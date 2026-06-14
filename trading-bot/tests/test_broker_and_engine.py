from datetime import datetime

from bot.brokers import PaperBroker
from bot.config import Config
from bot.engine import TradingEngine
from bot.feeds import SimulatedFeed
from bot.models import Candle, ExitReason, Instrument, Side
from bot.risk import OrderPlan

INST = Instrument(symbol="X", lot_size=1, tick_size=0.05, point_value=1.0)


def a_plan(side=Side.LONG):
    return OrderPlan(
        instrument=INST, side=side, quantity=250, entry_price=1000.0,
        target_price=1020.0, stop_price=990.0, pattern="Test",
        risk_rupees=2500, reward_rupees=5000)


def test_paper_target_hit_books_profit():
    broker = PaperBroker()
    broker.place(a_plan(), datetime(2026, 1, 1, 10, 0))
    candle = Candle("X", datetime(2026, 1, 1, 10, 5), 1000, 1025, 999, 1020, 1)
    trades = broker.on_candle(candle)
    assert len(trades) == 1
    assert trades[0].reason is ExitReason.TARGET
    assert trades[0].pnl == 5000  # 20 pts * 250


def test_paper_stop_hit_books_loss():
    broker = PaperBroker()
    broker.place(a_plan(), datetime(2026, 1, 1, 10, 0))
    candle = Candle("X", datetime(2026, 1, 1, 10, 5), 1000, 1001, 989, 990, 1)
    trades = broker.on_candle(candle)
    assert len(trades) == 1
    assert trades[0].reason is ExitReason.STOP
    assert trades[0].pnl == -2500


def test_both_hit_assumes_stop_first():
    broker = PaperBroker()
    broker.place(a_plan(), datetime(2026, 1, 1, 10, 0))
    # candle spans both stop and target
    candle = Candle("X", datetime(2026, 1, 1, 10, 5), 1000, 1025, 985, 1010, 1)
    trades = broker.on_candle(candle)
    assert trades[0].reason is ExitReason.STOP


def test_engine_smoke_runs_clean():
    cfg = Config.load("config.yaml")
    cfg.watchlist = [Instrument(symbol="DEMO", point_value=1.0)]
    feed = SimulatedFeed(cfg.watchlist, cfg.timeframe_minutes, seed=7)
    engine = TradingEngine(cfg, feed, PaperBroker())
    portfolio = engine.run()
    # No open positions should remain after square-off.
    assert engine.broker.open_count == 0
    # Realised P&L is a finite number; the run completed end to end.
    assert isinstance(portfolio.realized_pnl, float)
