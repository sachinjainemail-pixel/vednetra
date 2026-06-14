"""Technical indicators and swing-pivot helpers.

Everything here works on a pandas DataFrame with columns:
    open, high, low, close, volume
indexed by timestamp (ascending). Pure functions, no side effects.
"""
from __future__ import annotations

from typing import List, Tuple

import numpy as np
import pandas as pd


def ema(series: pd.Series, period: int) -> pd.Series:
    return series.ewm(span=period, adjust=False).mean()


def sma(series: pd.Series, period: int) -> pd.Series:
    return series.rolling(window=period, min_periods=period).mean()


def rsi(close: pd.Series, period: int = 14) -> pd.Series:
    delta = close.diff()
    gain = delta.clip(lower=0.0)
    loss = -delta.clip(upper=0.0)
    avg_gain = gain.ewm(alpha=1 / period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1 / period, adjust=False).mean()
    rs = avg_gain / avg_loss.replace(0.0, np.nan)
    out = 100 - (100 / (1 + rs))
    return out.fillna(50.0)


def atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    high, low, close = df["high"], df["low"], df["close"]
    prev_close = close.shift(1)
    tr = pd.concat([
        high - low,
        (high - prev_close).abs(),
        (low - prev_close).abs(),
    ], axis=1).max(axis=1)
    return tr.ewm(alpha=1 / period, adjust=False).mean()


def find_pivots(df: pd.DataFrame, left: int = 2, right: int = 2
                ) -> Tuple[List[int], List[int]]:
    """Return (pivot_high_indices, pivot_low_indices) as positional indices.

    A pivot high at position i means high[i] is the max of the window
    [i-left, i+right]. Symmetric for pivot lows. The most recent `right`
    bars cannot be confirmed pivots yet and are excluded.
    """
    highs = df["high"].values
    lows = df["low"].values
    n = len(df)
    pivot_highs: List[int] = []
    pivot_lows: List[int] = []
    for i in range(left, n - right):
        window_h = highs[i - left:i + right + 1]
        window_l = lows[i - left:i + right + 1]
        if highs[i] == window_h.max() and (window_h == highs[i]).sum() == 1:
            pivot_highs.append(i)
        if lows[i] == window_l.min() and (window_l == lows[i]).sum() == 1:
            pivot_lows.append(i)
    return pivot_highs, pivot_lows


def is_above_average_volume(df: pd.DataFrame, lookback: int = 20,
                            factor: float = 1.0) -> bool:
    """True if the latest candle's volume >= factor * average of prior `lookback`."""
    if len(df) < lookback + 1:
        return True  # not enough data -> don't block
    recent = df["volume"].iloc[-(lookback + 1):-1]
    avg = recent.mean()
    if avg <= 0:
        return True
    return df["volume"].iloc[-1] >= factor * avg
