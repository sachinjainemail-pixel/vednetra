"""Classic structural chart patterns built on swing pivots.

These confirm on the *last* candle (e.g. a neckline break / breakout close),
which is what makes them tradeable in real time. They are intentionally
conservative: better to miss a fuzzy pattern than to fire on noise.
"""
from __future__ import annotations

from typing import List, Optional

import pandas as pd

from ..indicators import find_pivots
from ..models import Side
from .candlesticks import PatternHit


def _near(a: float, b: float, tol: float) -> bool:
    return abs(a - b) <= tol * max(abs(a), abs(b), 1e-9)


def support_resistance_breakout(df: pd.DataFrame, lookback: int = 20,
                                margin: float = 0.0015) -> Optional[PatternHit]:
    """Last close breaks the recent range high/low by `margin` fraction."""
    if len(df) < lookback + 2:
        return None
    window = df.iloc[-(lookback + 1):-1]
    res = window["high"].max()
    sup = window["low"].min()
    last = df.iloc[-1]
    if last.close > res * (1 + margin):
        return PatternHit("Resistance Breakout", Side.LONG, 0.6,
                          note=f"broke {res:.2f}")
    if last.close < sup * (1 - margin):
        return PatternHit("Support Breakdown", Side.SHORT, 0.6,
                          note=f"broke {sup:.2f}")
    return None


def double_top(df: pd.DataFrame, tol: float = 0.004) -> Optional[PatternHit]:
    highs, lows = find_pivots(df, left=2, right=2)
    if len(highs) < 2 or not lows:
        return None
    h2, h1 = highs[-1], highs[-2]
    top1, top2 = df["high"].iloc[h1], df["high"].iloc[h2]
    if not _near(top1, top2, tol):
        return None
    trough = [l for l in lows if h1 < l < h2]
    if not trough:
        return None
    neckline = df["low"].iloc[trough].min()
    last = df.iloc[-1]
    if last.close < neckline and last.name != df.index[h2]:
        return PatternHit("Double Top", Side.SHORT, 0.66,
                          note=f"neckline {neckline:.2f}")
    return None


def double_bottom(df: pd.DataFrame, tol: float = 0.004) -> Optional[PatternHit]:
    highs, lows = find_pivots(df, left=2, right=2)
    if len(lows) < 2 or not highs:
        return None
    l2, l1 = lows[-1], lows[-2]
    bot1, bot2 = df["low"].iloc[l1], df["low"].iloc[l2]
    if not _near(bot1, bot2, tol):
        return None
    peak = [h for h in highs if l1 < h < l2]
    if not peak:
        return None
    neckline = df["high"].iloc[peak].max()
    last = df.iloc[-1]
    if last.close > neckline and last.name != df.index[l2]:
        return PatternHit("Double Bottom", Side.LONG, 0.66,
                          note=f"neckline {neckline:.2f}")
    return None


def head_and_shoulders(df: pd.DataFrame, tol: float = 0.01
                       ) -> Optional[PatternHit]:
    highs, lows = find_pivots(df, left=2, right=2)
    if len(highs) < 3 or len(lows) < 2:
        return None
    ls, head, rs = highs[-3], highs[-2], highs[-1]
    h_ls, h_head, h_rs = (df["high"].iloc[ls], df["high"].iloc[head],
                          df["high"].iloc[rs])
    # head must be the highest; shoulders roughly equal and below head
    if not (h_head > h_ls and h_head > h_rs and _near(h_ls, h_rs, tol)):
        return None
    necks = [df["low"].iloc[l] for l in lows if ls < l < rs]
    if not necks:
        return None
    neckline = sum(necks) / len(necks)
    last = df.iloc[-1]
    if last.close < neckline:
        return PatternHit("Head & Shoulders", Side.SHORT, 0.7,
                          note=f"neckline {neckline:.2f}")
    return None


def inverse_head_and_shoulders(df: pd.DataFrame, tol: float = 0.01
                               ) -> Optional[PatternHit]:
    highs, lows = find_pivots(df, left=2, right=2)
    if len(lows) < 3 or len(highs) < 2:
        return None
    ls, head, rs = lows[-3], lows[-2], lows[-1]
    l_ls, l_head, l_rs = (df["low"].iloc[ls], df["low"].iloc[head],
                          df["low"].iloc[rs])
    if not (l_head < l_ls and l_head < l_rs and _near(l_ls, l_rs, tol)):
        return None
    necks = [df["high"].iloc[h] for h in highs if ls < h < rs]
    if not necks:
        return None
    neckline = sum(necks) / len(necks)
    last = df.iloc[-1]
    if last.close > neckline:
        return PatternHit("Inverse Head & Shoulders", Side.LONG, 0.7,
                          note=f"neckline {neckline:.2f}")
    return None


def ascending_triangle(df: pd.DataFrame, tol: float = 0.004
                       ) -> Optional[PatternHit]:
    """Flat resistance + rising lows, breakout up."""
    highs, lows = find_pivots(df, left=2, right=2)
    if len(highs) < 2 or len(lows) < 2:
        return None
    h1, h2 = df["high"].iloc[highs[-2]], df["high"].iloc[highs[-1]]
    l1, l2 = df["low"].iloc[lows[-2]], df["low"].iloc[lows[-1]]
    flat_top = _near(h1, h2, tol)
    rising_lows = l2 > l1
    last = df.iloc[-1]
    if flat_top and rising_lows and last.close > max(h1, h2):
        return PatternHit("Ascending Triangle", Side.LONG, 0.62)
    return None


def descending_triangle(df: pd.DataFrame, tol: float = 0.004
                        ) -> Optional[PatternHit]:
    """Flat support + falling highs, breakdown down."""
    highs, lows = find_pivots(df, left=2, right=2)
    if len(highs) < 2 or len(lows) < 2:
        return None
    h1, h2 = df["high"].iloc[highs[-2]], df["high"].iloc[highs[-1]]
    l1, l2 = df["low"].iloc[lows[-2]], df["low"].iloc[lows[-1]]
    flat_bottom = _near(l1, l2, tol)
    falling_highs = h2 < h1
    last = df.iloc[-1]
    if flat_bottom and falling_highs and last.close < min(l1, l2):
        return PatternHit("Descending Triangle", Side.SHORT, 0.62)
    return None


CHART_DETECTORS = [
    head_and_shoulders,
    inverse_head_and_shoulders,
    double_top,
    double_bottom,
    ascending_triangle,
    descending_triangle,
    support_resistance_breakout,
]


def detect_chart_patterns(df: pd.DataFrame) -> List[PatternHit]:
    hits: List[PatternHit] = []
    for fn in CHART_DETECTORS:
        try:
            hit = fn(df)
        except Exception:
            hit = None
        if hit is not None:
            hits.append(hit)
    return hits
