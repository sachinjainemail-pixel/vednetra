from datetime import time

import pytest

from bot.config import RiskConfig, TradingWindow
from bot.models import Instrument, Side, Signal
from bot.risk import RiskManager

WINDOW = TradingWindow(time(9, 20), time(15, 0), time(15, 15))


def make_rm(**overrides):
    cfg = RiskConfig(stop_atr_multiple=1.0, **overrides)
    return RiskManager(cfg, WINDOW)


def base_signal():
    return Signal(symbol="X", timestamp=None, pattern="Test", side=Side.LONG,
                  price=1000.0, stop_distance=10.0, confidence=0.9)


EQUITY = Instrument(symbol="X", exchange="NSE", lot_size=1, tick_size=0.05,
                    point_value=1.0)


def evaluate(rm, signal, inst, **kw):
    defaults = dict(now=time(10, 0), realized_pnl=0.0, open_positions=0,
                    trades_today=0, has_symbol_position=False)
    defaults.update(kw)
    return rm.evaluate(signal, inst, **defaults)


def test_position_sized_to_exact_rupee_targets():
    rm = make_rm()
    decision = evaluate(rm, base_signal(), EQUITY)
    assert decision.approved
    plan = decision.plan
    # 2500 risk / (10 pts * 1) = 250 shares
    assert plan.quantity == 250
    assert plan.stop_price == pytest.approx(990.0, abs=0.05)
    assert plan.target_price == pytest.approx(1020.0, abs=0.05)
    assert plan.risk_rupees == pytest.approx(2500, abs=15)
    assert plan.reward_rupees == pytest.approx(5000, abs=15)


def test_short_targets_below_entry():
    rm = make_rm()
    sig = base_signal()
    sig.side = Side.SHORT
    plan = evaluate(rm, sig, EQUITY).plan
    assert plan.stop_price > plan.entry_price
    assert plan.target_price < plan.entry_price


def test_daily_loss_cap_blocks_new_trades():
    rm = make_rm(daily_loss_cap_rupees=7500)
    decision = evaluate(rm, base_signal(), EQUITY, realized_pnl=-7500)
    assert not decision.approved
    assert "loss cap" in decision.rejected_reason


def test_outside_window_blocked():
    rm = make_rm()
    decision = evaluate(rm, base_signal(), EQUITY, now=time(15, 5))
    assert not decision.approved


def test_max_open_positions_blocked():
    rm = make_rm(max_open_positions=3)
    decision = evaluate(rm, base_signal(), EQUITY, open_positions=3)
    assert not decision.approved


def test_one_position_per_symbol():
    rm = make_rm()
    decision = evaluate(rm, base_signal(), EQUITY, has_symbol_position=True)
    assert not decision.approved


def test_oversized_lot_rejected():
    # A futures-like instrument whose single lot risks far more than the budget.
    fat_lot = Instrument(symbol="X", lot_size=1000, point_value=1.0)
    rm = make_rm(max_risk_overshoot=1.25)
    # risk per unit = 10; one lot = 1000 units -> 10*1000 = 10000 >> 2500*1.25
    decision = evaluate(rm, base_signal(), fat_lot)
    assert not decision.approved
