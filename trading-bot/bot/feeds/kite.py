"""KiteFeed - live/historical 5-minute candles from Zerodha Kite Connect.

This polls Kite's historical_data endpoint once per timeframe and yields any
newly *completed* candle for each watchlist symbol. It blocks in real time
(it is meant to run during market hours) and stops at the square-off time.

Requires: pip install kiteconnect, plus a valid daily access token
(generate with scripts/kite_login.py). See README for the login flow.

NOTE: this path needs real credentials to run and should be validated against
your account before you rely on it. The offline SimulatedFeed is the default.
"""
from __future__ import annotations

import logging
import time as _time
from datetime import datetime, timedelta
from typing import Dict, Iterator, List

from ..config import KiteCredentials, TradingWindow
from ..models import Candle, Instrument
from .base import DataFeed

log = logging.getLogger("bot.kite.feed")


class KiteFeed(DataFeed):
    def __init__(self, instruments: List[Instrument], creds: KiteCredentials,
                 timeframe_minutes: int, window: TradingWindow,
                 poll_seconds: int = 15):
        if not creds.is_complete:
            raise SystemExit(
                "Kite credentials missing. Set KITE_API_KEY and "
                "KITE_ACCESS_TOKEN (run scripts/kite_login.py).")
        try:
            from kiteconnect import KiteConnect
        except ImportError as exc:  # pragma: no cover
            raise SystemExit("kiteconnect not installed: pip install kiteconnect") from exc

        self.instruments = instruments
        self.timeframe = timeframe_minutes
        self.window = window
        self.poll_seconds = poll_seconds
        self.kite = KiteConnect(api_key=creds.api_key)
        self.kite.set_access_token(creds.access_token)
        self.interval = f"{timeframe_minutes}minute"
        self._tokens: Dict[str, int] = self._resolve_tokens()
        self._last_seen: Dict[str, datetime] = {}

    def _resolve_tokens(self) -> Dict[str, int]:
        """Map each watchlist symbol to its Kite instrument_token."""
        wanted = {(i.exchange, i.symbol): i for i in self.instruments}
        tokens: Dict[str, int] = {}
        exchanges = {i.exchange for i in self.instruments}
        for exch in exchanges:
            for row in self.kite.instruments(exch):
                key = (exch, row["tradingsymbol"])
                if key in wanted:
                    tokens[wanted[key].symbol] = row["instrument_token"]
        missing = [i.symbol for i in self.instruments if i.symbol not in tokens]
        if missing:
            raise SystemExit(f"Could not resolve Kite tokens for: {missing}")
        return tokens

    def candles(self) -> Iterator[Candle]:
        today = datetime.now().date()
        session_start = datetime.combine(today, self.window.start) \
            - timedelta(minutes=self.timeframe * 30)  # warm-up history
        while True:
            now = datetime.now()
            if now.time() >= self.window.square_off:
                log.info("Square-off time reached; KiteFeed stopping.")
                return
            for inst in self.instruments:
                yield from self._poll_symbol(inst, session_start, now)
            _time.sleep(self.poll_seconds)

    def _poll_symbol(self, inst: Instrument, frm: datetime, now: datetime
                     ) -> Iterator[Candle]:
        try:
            bars = self.kite.historical_data(
                self._tokens[inst.symbol], frm, now, self.interval)
        except Exception as exc:  # pragma: no cover - network
            log.warning("historical_data failed for %s: %s", inst.symbol, exc)
            return
        for bar in bars:
            ts = bar["date"].replace(tzinfo=None)
            # only emit COMPLETED candles (the current forming bar is skipped)
            if ts + timedelta(minutes=self.timeframe) > now:
                continue
            last = self._last_seen.get(inst.symbol)
            if last is not None and ts <= last:
                continue
            self._last_seen[inst.symbol] = ts
            yield Candle(
                symbol=inst.symbol, timestamp=ts,
                open=float(bar["open"]), high=float(bar["high"]),
                low=float(bar["low"]), close=float(bar["close"]),
                volume=float(bar.get("volume", 0)))
