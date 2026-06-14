"""PaperBroker - simulates fills against candle highs/lows. No real money."""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Dict, List

from ..models import Candle, ExitReason, Position, Side, Trade
from ..risk import OrderPlan
from .base import Broker

log = logging.getLogger("bot.paper")


class PaperBroker(Broker):
    def place(self, plan: OrderPlan, timestamp: datetime) -> Position:
        # Assume a market fill at the plan's entry price (signal candle close).
        pos = Position(
            instrument=plan.instrument,
            side=plan.side,
            quantity=plan.quantity,
            entry_price=plan.entry_price,
            target_price=plan.target_price,
            stop_price=plan.stop_price,
            entry_time=timestamp,
            pattern=plan.pattern,
            order_id=f"PAPER-{plan.instrument.symbol}-{timestamp:%H%M%S}",
        )
        self.positions[plan.instrument.symbol] = pos
        log.info(
            "ENTRY  %-10s %-5s qty=%-4d @ %.2f  TP=%.2f SL=%.2f  [%s]",
            pos.instrument.symbol, pos.side.value, pos.quantity,
            pos.entry_price, pos.target_price, pos.stop_price, pos.pattern)
        return pos

    def on_candle(self, candle: Candle) -> List[Trade]:
        pos = self.positions.get(candle.symbol)
        if pos is None:
            return []

        hit_stop, hit_target = self._touches(pos, candle)

        # If both are touched within the same candle we cannot know the order
        # from OHLC alone, so we assume the WORST case (stop first). This keeps
        # the paper P&L honest / conservative rather than flattering.
        if hit_stop:
            return [self._close(pos, pos.stop_price, ExitReason.STOP, candle.timestamp)]
        if hit_target:
            return [self._close(pos, pos.target_price, ExitReason.TARGET, candle.timestamp)]
        return []

    def square_off_all(self, prices: Dict[str, float],
                       timestamp: datetime) -> List[Trade]:
        trades: List[Trade] = []
        for symbol in list(self.positions):
            pos = self.positions[symbol]
            price = prices.get(symbol, pos.entry_price)
            trades.append(self._close(pos, price, ExitReason.SQUARE_OFF, timestamp))
        return trades

    # -- helpers -------------------------------------------------------------

    @staticmethod
    def _touches(pos: Position, candle: Candle):
        if pos.side is Side.LONG:
            return candle.low <= pos.stop_price, candle.high >= pos.target_price
        return candle.high >= pos.stop_price, candle.low <= pos.target_price

    def _close(self, pos: Position, exit_price: float, reason: ExitReason,
               timestamp: datetime) -> Trade:
        pnl = (exit_price - pos.entry_price) * pos.side.sign \
            * pos.quantity * pos.instrument.point_value
        del self.positions[pos.instrument.symbol]
        trade = Trade(
            symbol=pos.instrument.symbol,
            side=pos.side,
            quantity=pos.quantity,
            entry_price=pos.entry_price,
            exit_price=exit_price,
            entry_time=pos.entry_time,
            exit_time=timestamp,
            pnl=pnl,
            reason=reason,
            pattern=pos.pattern,
        )
        log.info(
            "EXIT   %-10s %-5s qty=%-4d @ %.2f  %-10s P&L=Rs %s",
            trade.symbol, trade.side.value, trade.quantity, exit_price,
            reason.value, f"{pnl:,.2f}")
        return trade
