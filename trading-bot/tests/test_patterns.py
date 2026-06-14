from datetime import datetime, timedelta

import pandas as pd

from bot.patterns.candlesticks import (bearish_engulfing, bullish_engulfing,
                                        detect_candlesticks)
from bot.indicators import atr, ema, find_pivots, rsi


def make_df(rows):
    idx = [datetime(2026, 1, 1, 9, 15) + timedelta(minutes=5 * i)
           for i in range(len(rows))]
    return pd.DataFrame(rows, index=pd.DatetimeIndex(idx),
                        columns=["open", "high", "low", "close", "volume"])


def test_bullish_engulfing_detected():
    df = make_df([
        [100, 101, 99, 99.5, 1000],   # prior bearish
        [99, 102, 98.5, 101.5, 1500],  # engulfs to the upside
    ])
    hit = bullish_engulfing(df)
    assert hit is not None
    assert hit.side.value == "LONG"


def test_bearish_engulfing_detected():
    df = make_df([
        [100, 102, 99.5, 101.5, 1000],  # prior bullish
        [101.6, 102, 98, 99, 1500],     # engulfs to the downside
    ])
    hit = bearish_engulfing(df)
    assert hit is not None
    assert hit.side.value == "SHORT"


def test_no_false_positive_on_flat():
    df = make_df([[100, 100.2, 99.8, 100, 1000]] * 5)
    assert detect_candlesticks(df) == []


def test_indicators_run():
    closes = [100 + i * 0.1 for i in range(50)]
    df = make_df([[c, c + 0.5, c - 0.5, c, 1000] for c in closes])
    assert ema(df["close"], 9).iloc[-1] > 0
    assert 0 <= rsi(df["close"]).iloc[-1] <= 100
    assert atr(df).iloc[-1] > 0
    highs, lows = find_pivots(df)
    assert isinstance(highs, list) and isinstance(lows, list)
