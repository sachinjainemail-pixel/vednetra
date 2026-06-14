"""TradingEngine - the main loop tying feed -> detect -> risk -> broker together."""
from __future__ import annotations

import logging
from typing import Dict, List

import pandas as pd

from .brokers.base import Broker
from .config import Config
from .feeds.base import DataFeed
from .models import Candle, Instrument, Trade
from .patterns import PatternDetector
from .portfolio import Portfolio
from .risk import RiskManager

log = logging.getLogger("bot.engine")


class TradingEngine:
    def __init__(self, cfg: Config, feed: DataFeed, broker: Broker):
        self.cfg = cfg
        self.feed = feed
        self.broker = broker
        self.detector = PatternDetector(cfg.patterns)
        self.risk = RiskManager(cfg.risk, cfg.trading_window)
        self.portfolio = Portfolio()

        self.instruments: Dict[str, Instrument] = {
            inst.symbol: inst for inst in cfg.watchlist}
        self.history: Dict[str, List[Candle]] = {
            inst.symbol: [] for inst in cfg.watchlist}
        self.last_price: Dict[str, float] = {}

        self.entries_taken = 0
        self._squared_off = False
        self._loss_cap_logged = False

    # -- main loop -----------------------------------------------------------

    def run(self) -> Portfolio:
        log.info("Engine starting | mode=%s feed=%s broker=%s | %d symbols",
                 self.cfg.mode, self.cfg.feed, self.cfg.broker,
                 len(self.instruments))

        for candle in self.feed.candles():
            self._on_candle(candle)

        # End of data: square off whatever is left at the last seen price.
        self._square_off("end of session")
        log.info("Engine finished.\n%s", self.portfolio.summary())
        return self.portfolio

    # -- per-candle handling -------------------------------------------------

    def _on_candle(self, candle: Candle) -> None:
        inst = self.instruments.get(candle.symbol)
        if inst is None:
            return

        self.history[candle.symbol].append(candle)
        self.last_price[candle.symbol] = candle.close

        # 1) Manage existing positions first (exits take priority over entries).
        for trade in self.broker.on_candle(candle):
            self._record(trade)

        now = candle.timestamp.time()

        # 2) End-of-day square off.
        if now >= self.cfg.trading_window.square_off:
            if not self._squared_off:
                self._square_off("square-off time")
                self._squared_off = True
            return

        # 3) Look for a new entry.
        if self._squared_off:
            return
        self._maybe_enter(inst, candle)

    def _maybe_enter(self, inst: Instrument, candle: Candle) -> None:
        df = self._dataframe(inst.symbol)
        signal = self.detector.detect(inst.symbol, df)
        if signal is None:
            return

        decision = self.risk.evaluate(
            signal, inst,
            now=candle.timestamp.time(),
            realized_pnl=self.portfolio.realized_pnl,
            open_positions=self.broker.open_count,
            trades_today=self.entries_taken,
            has_symbol_position=self.broker.has_position(inst.symbol),
        )

        if not decision.approved:
            reason = decision.rejected_reason
            if reason.startswith("daily loss cap") and not self._loss_cap_logged:
                log.warning("*** %s *** No new trades for the rest of the day.",
                            reason)
                self._loss_cap_logged = True
            else:
                log.debug("skip %s (%s): %s", inst.symbol, signal.pattern, reason)
            return

        self.broker.place(decision.plan, candle.timestamp)
        self.entries_taken += 1

    # -- helpers -------------------------------------------------------------

    def _square_off(self, why: str) -> None:
        if self.broker.open_count == 0:
            return
        log.info("Squaring off %d open position(s) [%s]",
                 self.broker.open_count, why)
        for trade in self.broker.square_off_all(
                dict(self.last_price), self._latest_timestamp()):
            self._record(trade)

    def _record(self, trade: Trade) -> None:
        self.portfolio.record(trade)

    def _dataframe(self, symbol: str) -> pd.DataFrame:
        rows = self.history[symbol]
        df = pd.DataFrame(
            {
                "open": [c.open for c in rows],
                "high": [c.high for c in rows],
                "low": [c.low for c in rows],
                "close": [c.close for c in rows],
                "volume": [c.volume for c in rows],
            },
            index=pd.DatetimeIndex([c.timestamp for c in rows]),
        )
        return df

    def _latest_timestamp(self):
        latest = None
        for rows in self.history.values():
            if rows and (latest is None or rows[-1].timestamp > latest):
                latest = rows[-1].timestamp
        return latest
