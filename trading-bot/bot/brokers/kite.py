"""KiteBroker - places REAL orders on Zerodha. Use only after validation.

Behaviour:
  * place(): a MARKET entry (MIS / intraday), then a protective SL-M stop and
    a LIMIT target on the opposite side.
  * on_candle(): mirrors the paper exit logic to detect when price has touched
    the stop or target, records the trade locally and cancels the still-pending
    sibling order (so you are not left with a naked resting order).

IMPORTANT LIMITATIONS - read before trusting this with money:
  * Fill reconciliation here is candle-based, not driven by Kite order
    postbacks/websocket. For production you should subscribe to order updates
    and reconcile actual fills/prices. Validate on a tiny quantity first.
  * Zerodha discontinued native Bracket Orders; this emulates them with two
    independent child orders + manual sibling cancellation.
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Dict, List

from ..config import KiteCredentials
from ..models import Candle, ExitReason, Instrument, Position, Side, Trade
from ..risk import OrderPlan
from .base import Broker

log = logging.getLogger("bot.kite.broker")


class KiteBroker(Broker):
    def __init__(self, creds: KiteCredentials, instruments: List[Instrument]):
        super().__init__()
        if not creds.is_complete:
            raise SystemExit("Kite credentials missing for live broker.")
        try:
            from kiteconnect import KiteConnect
        except ImportError as exc:  # pragma: no cover
            raise SystemExit("kiteconnect not installed: pip install kiteconnect") from exc
        self.kite = KiteConnect(api_key=creds.api_key)
        self.kite.set_access_token(creds.access_token)
        self.instruments = {i.symbol: i for i in instruments}
        # symbol -> {"stop": order_id, "target": order_id}
        self._child_orders: Dict[str, Dict[str, str]] = {}

    def place(self, plan: OrderPlan, timestamp: datetime) -> Position:
        k = self.kite
        inst = plan.instrument
        entry_txn = k.TRANSACTION_TYPE_BUY if plan.side is Side.LONG \
            else k.TRANSACTION_TYPE_SELL
        exit_txn = k.TRANSACTION_TYPE_SELL if plan.side is Side.LONG \
            else k.TRANSACTION_TYPE_BUY

        entry_id = k.place_order(
            variety=k.VARIETY_REGULAR, exchange=inst.exchange,
            tradingsymbol=inst.symbol, transaction_type=entry_txn,
            quantity=plan.quantity, product=k.PRODUCT_MIS,
            order_type=k.ORDER_TYPE_MARKET)

        stop_id = k.place_order(
            variety=k.VARIETY_REGULAR, exchange=inst.exchange,
            tradingsymbol=inst.symbol, transaction_type=exit_txn,
            quantity=plan.quantity, product=k.PRODUCT_MIS,
            order_type=k.ORDER_TYPE_SLM, trigger_price=plan.stop_price)

        target_id = k.place_order(
            variety=k.VARIETY_REGULAR, exchange=inst.exchange,
            tradingsymbol=inst.symbol, transaction_type=exit_txn,
            quantity=plan.quantity, product=k.PRODUCT_MIS,
            order_type=k.ORDER_TYPE_LIMIT, price=plan.target_price)

        self._child_orders[inst.symbol] = {"stop": stop_id, "target": target_id}
        pos = Position(
            instrument=inst, side=plan.side, quantity=plan.quantity,
            entry_price=plan.entry_price, target_price=plan.target_price,
            stop_price=plan.stop_price, entry_time=timestamp,
            pattern=plan.pattern, order_id=entry_id)
        self.positions[inst.symbol] = pos
        log.info("LIVE ENTRY %s %s qty=%d @~%.2f TP=%.2f SL=%.2f (entry order %s)",
                 inst.symbol, plan.side.value, plan.quantity, plan.entry_price,
                 plan.target_price, plan.stop_price, entry_id)
        return pos

    def on_candle(self, candle: Candle) -> List[Trade]:
        pos = self.positions.get(candle.symbol)
        if pos is None:
            return []
        if pos.side is Side.LONG:
            hit_stop = candle.low <= pos.stop_price
            hit_target = candle.high >= pos.target_price
        else:
            hit_stop = candle.high >= pos.stop_price
            hit_target = candle.low <= pos.target_price

        if hit_stop:
            self._cancel_sibling(candle.symbol, keep="stop")
            return [self._close(pos, pos.stop_price, ExitReason.STOP, candle.timestamp)]
        if hit_target:
            self._cancel_sibling(candle.symbol, keep="target")
            return [self._close(pos, pos.target_price, ExitReason.TARGET, candle.timestamp)]
        return []

    def square_off_all(self, prices: Dict[str, float],
                       timestamp: datetime) -> List[Trade]:
        k = self.kite
        trades: List[Trade] = []
        for symbol in list(self.positions):
            pos = self.positions[symbol]
            # Cancel both protective orders and exit at market.
            self._cancel_sibling(symbol, keep=None)
            exit_txn = k.TRANSACTION_TYPE_SELL if pos.side is Side.LONG \
                else k.TRANSACTION_TYPE_BUY
            try:
                k.place_order(
                    variety=k.VARIETY_REGULAR, exchange=pos.instrument.exchange,
                    tradingsymbol=symbol, transaction_type=exit_txn,
                    quantity=pos.quantity, product=k.PRODUCT_MIS,
                    order_type=k.ORDER_TYPE_MARKET)
            except Exception as exc:  # pragma: no cover - network
                log.error("square-off order failed for %s: %s", symbol, exc)
            price = prices.get(symbol, pos.entry_price)
            trades.append(self._close(pos, price, ExitReason.SQUARE_OFF, timestamp))
        return trades

    def _cancel_sibling(self, symbol: str, keep: str | None) -> None:
        orders = self._child_orders.pop(symbol, {})
        for kind, order_id in orders.items():
            if kind == keep:
                continue
            try:
                self.kite.cancel_order(
                    variety=self.kite.VARIETY_REGULAR, order_id=order_id)
            except Exception as exc:  # pragma: no cover - network
                log.warning("cancel %s order %s failed: %s", kind, order_id, exc)

    def _close(self, pos: Position, exit_price: float, reason: ExitReason,
               timestamp: datetime) -> Trade:
        pnl = (exit_price - pos.entry_price) * pos.side.sign \
            * pos.quantity * pos.instrument.point_value
        del self.positions[pos.instrument.symbol]
        log.info("LIVE EXIT %s %s @ %.2f %s P&L=Rs %s", pos.instrument.symbol,
                 pos.side.value, exit_price, reason.value, f"{pnl:,.2f}")
        return Trade(
            symbol=pos.instrument.symbol, side=pos.side, quantity=pos.quantity,
            entry_price=pos.entry_price, exit_price=exit_price,
            entry_time=pos.entry_time, exit_time=timestamp, pnl=pnl,
            reason=reason, pattern=pos.pattern)
