"""Risk management: position sizing, fixed rupee targets, and the daily caps.

This module is where the strategy's promise actually lives:

  * Every position is sized so that hitting the stop loses ~ stop_loss_rupees
    and hitting the target gains ~ profit_target_rupees.
  * A DAILY LOSS CAP halts all new trades once the day is down too much.
  * Over-trading guards (max trades/day, max open positions) keep it sane.

It does NOT and CANNOT guarantee a green day - it guarantees disciplined,
bounded risk per trade and a hard floor on the day's loss.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import time
from typing import Optional

from .config import RiskConfig, TradingWindow
from .models import Instrument, Position, Side, Signal


@dataclass
class OrderPlan:
    instrument: Instrument
    side: Side
    quantity: int
    entry_price: float
    target_price: float
    stop_price: float
    pattern: str
    risk_rupees: float
    reward_rupees: float


@dataclass
class RiskDecision:
    plan: Optional[OrderPlan]
    rejected_reason: str = ""

    @property
    def approved(self) -> bool:
        return self.plan is not None


class RiskManager:
    def __init__(self, cfg: RiskConfig, window: TradingWindow):
        self.cfg = cfg
        self.window = window

    # -- gate checks ---------------------------------------------------------

    def entries_allowed_now(self, now: time) -> bool:
        return self.window.start <= now <= self.window.end

    def daily_loss_cap_hit(self, realized_pnl: float) -> bool:
        return realized_pnl <= -abs(self.cfg.daily_loss_cap_rupees)

    def daily_profit_target_hit(self, realized_pnl: float) -> bool:
        target = self.cfg.daily_profit_target_rupees
        return target > 0 and realized_pnl >= target

    # -- main entry point ----------------------------------------------------

    def evaluate(self, signal: Signal, instrument: Instrument, *,
                 now: time, realized_pnl: float, open_positions: int,
                 trades_today: int, has_symbol_position: bool) -> RiskDecision:
        if not self.entries_allowed_now(now):
            return RiskDecision(None, "outside trading window")
        if self.daily_loss_cap_hit(realized_pnl):
            return RiskDecision(None, "daily loss cap reached - trading halted")
        if self.daily_profit_target_hit(realized_pnl):
            return RiskDecision(None, "daily profit target reached - done for the day")
        if trades_today >= self.cfg.max_trades_per_day:
            return RiskDecision(None, "max trades/day reached")
        if open_positions >= self.cfg.max_open_positions:
            return RiskDecision(None, "max open positions reached")
        if self.cfg.one_position_per_symbol and has_symbol_position:
            return RiskDecision(None, "already in a position for this symbol")

        plan = self._build_plan(signal, instrument)
        if plan is None:
            return RiskDecision(None, "could not size within risk limits")
        return RiskDecision(plan)

    # -- position sizing -----------------------------------------------------

    def _build_plan(self, signal: Signal, instrument: Instrument
                    ) -> Optional[OrderPlan]:
        # Technical stop distance from the pattern's ATR * configured multiple.
        stop_dist = signal.stop_distance * self.cfg.stop_atr_multiple
        if stop_dist <= 0:
            return None

        risk_per_unit = stop_dist * instrument.point_value
        if risk_per_unit <= 0:
            return None

        # Size so that loss at the technical stop ~ stop_loss_rupees, rounded
        # DOWN to whole lots (never risk more than intended by over-sizing).
        raw_units = self.cfg.stop_loss_rupees / risk_per_unit
        lots = math.floor(raw_units / instrument.lot_size)
        quantity = lots * instrument.lot_size
        if quantity <= 0:
            # Smallest tradeable size is one lot; accept only if it doesn't
            # blow past the risk budget by more than max_risk_overshoot.
            quantity = instrument.lot_size
            if quantity * risk_per_unit > \
                    self.cfg.stop_loss_rupees * self.cfg.max_risk_overshoot:
                return None

        # Now pin the stop/target to the EXACT rupee amounts for this quantity.
        per_unit_value = quantity * instrument.point_value
        sl_distance = self.cfg.stop_loss_rupees / per_unit_value
        tp_distance = self.cfg.profit_target_rupees / per_unit_value

        entry = signal.price
        if signal.side is Side.LONG:
            stop_price = instrument.round_to_tick(entry - sl_distance)
            target_price = instrument.round_to_tick(entry + tp_distance)
        else:
            stop_price = instrument.round_to_tick(entry + sl_distance)
            target_price = instrument.round_to_tick(entry - tp_distance)

        return OrderPlan(
            instrument=instrument,
            side=signal.side,
            quantity=quantity,
            entry_price=entry,
            target_price=target_price,
            stop_price=stop_price,
            pattern=signal.pattern,
            risk_rupees=abs(entry - stop_price) * per_unit_value,
            reward_rupees=abs(target_price - entry) * per_unit_value,
        )
