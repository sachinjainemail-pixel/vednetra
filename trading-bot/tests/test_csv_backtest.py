from datetime import datetime, time, timedelta

from bot.config import Config
from bot.feeds import ReplayFeed, load_history
from bot.feeds.csv_feed import _load_symbol
from bot.models import Instrument


def _write_csv(path, symbol, start_price, days=2):
    lines = ["timestamp,open,high,low,close,volume"]
    price = start_price
    for d in range(days):
        day = datetime(2026, 6, 10) + timedelta(days=d)
        t = datetime.combine(day.date(), time(9, 15))
        end = datetime.combine(day.date(), time(15, 30))
        while t <= end:
            o = price
            c = price + 1.0
            lines.append(f"{t:%Y-%m-%d %H:%M:%S},{o:.2f},{c+0.5:.2f},"
                         f"{o-0.5:.2f},{c:.2f},100000")
            price = c
            t += timedelta(minutes=5)
    path.write_text("\n".join(lines))


def test_load_symbol_parses(tmp_path):
    p = tmp_path / "X.csv"
    _write_csv(p, "X", 100.0, days=1)
    candles = _load_symbol(p, "X")
    assert candles and candles[0].symbol == "X"
    assert all(c.high >= c.low for c in candles)


def test_load_history_groups_by_day(tmp_path):
    insts = [Instrument(symbol="A"), Instrument(symbol="B")]
    _write_csv(tmp_path / "A.csv", "A", 100.0, days=2)
    _write_csv(tmp_path / "B.csv", "B", 200.0, days=2)
    history = load_history(str(tmp_path), insts)
    assert len(history) == 2                      # two distinct trading dates
    for _day, candles in history:
        # interleaved & time-ordered across symbols
        times = [c.timestamp for c in candles]
        assert times == sorted(times)
        assert {c.symbol for c in candles} == {"A", "B"}


def test_replay_feed_yields_in_order(tmp_path):
    _write_csv(tmp_path / "A.csv", "A", 100.0, days=1)
    history = load_history(str(tmp_path), [Instrument(symbol="A")])
    _day, candles = history[0]
    feed = ReplayFeed(candles)
    out = list(feed.candles())
    assert out == candles


def test_capital_loaded_from_config():
    cfg = Config.load("config.yaml")
    assert cfg.capital == 1000000
