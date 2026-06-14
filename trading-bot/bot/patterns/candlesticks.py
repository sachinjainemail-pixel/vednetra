"""Candlestick pattern detectors.

Each detector inspects the *last completed candle* (with a little prior
context) of a pandas OHLCV DataFrame and returns a ``PatternHit`` or ``None``.

These are the well-known, objectively-definable single/multi-candle patterns.
They are reversal/continuation signals; the chart_patterns module handles the
larger structural patterns (double tops, head & shoulders, breakouts, ...).
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, List, Optional

import pandas as pd

from ..models import Side


@dataclass
class PatternHit:
    name: str
    side: Side
    confidence: float
    note: str = ""


# --- small candle geometry helpers -----------------------------------------

def _body(o: float, c: float) -> float:
    return abs(c - o)


def _range(h: float, l: float) -> float:
    return max(h - l, 1e-9)


def _upper_shadow(o: float, h: float, c: float) -> float:
    return h - max(o, c)


def _lower_shadow(o: float, l: float, c: float) -> float:
    return min(o, c) - l


def _bullish(o: float, c: float) -> bool:
    return c > o


def _bearish(o: float, c: float) -> bool:
    return c < o


# --- individual detectors ---------------------------------------------------
# Each takes the DataFrame and returns Optional[PatternHit]. They assume at
# least 3 rows are present (the detector class guarantees enough history).

def bullish_engulfing(df: pd.DataFrame) -> Optional[PatternHit]:
    p, c = df.iloc[-2], df.iloc[-1]
    if _bearish(p.open, p.close) and _bullish(c.open, c.close):
        if c.close >= p.open and c.open <= p.close:
            strength = _body(c.open, c.close) / _range(c.high, c.low)
            return PatternHit("Bullish Engulfing", Side.LONG,
                              0.55 + 0.25 * strength)
    return None


def bearish_engulfing(df: pd.DataFrame) -> Optional[PatternHit]:
    p, c = df.iloc[-2], df.iloc[-1]
    if _bullish(p.open, p.close) and _bearish(c.open, c.close):
        if c.close <= p.open and c.open >= p.close:
            strength = _body(c.open, c.close) / _range(c.high, c.low)
            return PatternHit("Bearish Engulfing", Side.SHORT,
                              0.55 + 0.25 * strength)
    return None


def hammer(df: pd.DataFrame) -> Optional[PatternHit]:
    c = df.iloc[-1]
    body = _body(c.open, c.close)
    lower = _lower_shadow(c.open, c.low, c.close)
    upper = _upper_shadow(c.open, c.high, c.close)
    rng = _range(c.high, c.low)
    if body > 0 and lower >= 2 * body and upper <= 0.3 * rng:
        # bullish reversal after a down move
        if df["close"].iloc[-4:-1].is_monotonic_decreasing:
            return PatternHit("Hammer", Side.LONG, 0.6)
        return PatternHit("Hammer", Side.LONG, 0.55)
    return None


def shooting_star(df: pd.DataFrame) -> Optional[PatternHit]:
    c = df.iloc[-1]
    body = _body(c.open, c.close)
    lower = _lower_shadow(c.open, c.low, c.close)
    upper = _upper_shadow(c.open, c.high, c.close)
    rng = _range(c.high, c.low)
    if body > 0 and upper >= 2 * body and lower <= 0.3 * rng:
        if df["close"].iloc[-4:-1].is_monotonic_increasing:
            return PatternHit("Shooting Star", Side.SHORT, 0.6)
        return PatternHit("Shooting Star", Side.SHORT, 0.55)
    return None


def morning_star(df: pd.DataFrame) -> Optional[PatternHit]:
    a, b, c = df.iloc[-3], df.iloc[-2], df.iloc[-1]
    if (_bearish(a.open, a.close)
            and _body(b.open, b.close) < _body(a.open, a.close) * 0.5
            and _bullish(c.open, c.close)
            and c.close > (a.open + a.close) / 2):
        return PatternHit("Morning Star", Side.LONG, 0.65)
    return None


def evening_star(df: pd.DataFrame) -> Optional[PatternHit]:
    a, b, c = df.iloc[-3], df.iloc[-2], df.iloc[-1]
    if (_bullish(a.open, a.close)
            and _body(b.open, b.close) < _body(a.open, a.close) * 0.5
            and _bearish(c.open, c.close)
            and c.close < (a.open + a.close) / 2):
        return PatternHit("Evening Star", Side.SHORT, 0.65)
    return None


def three_white_soldiers(df: pd.DataFrame) -> Optional[PatternHit]:
    a, b, c = df.iloc[-3], df.iloc[-2], df.iloc[-1]
    if (_bullish(a.open, a.close) and _bullish(b.open, b.close)
            and _bullish(c.open, c.close)
            and b.close > a.close and c.close > b.close
            and b.open > a.open and c.open > b.open):
        return PatternHit("Three White Soldiers", Side.LONG, 0.62)
    return None


def three_black_crows(df: pd.DataFrame) -> Optional[PatternHit]:
    a, b, c = df.iloc[-3], df.iloc[-2], df.iloc[-1]
    if (_bearish(a.open, a.close) and _bearish(b.open, b.close)
            and _bearish(c.open, c.close)
            and b.close < a.close and c.close < b.close
            and b.open < a.open and c.open < b.open):
        return PatternHit("Three Black Crows", Side.SHORT, 0.62)
    return None


def piercing_line(df: pd.DataFrame) -> Optional[PatternHit]:
    p, c = df.iloc[-2], df.iloc[-1]
    mid = (p.open + p.close) / 2
    if (_bearish(p.open, p.close) and _bullish(c.open, c.close)
            and c.open < p.low and p.close < c.close < p.open
            and c.close > mid):
        return PatternHit("Piercing Line", Side.LONG, 0.58)
    return None


def dark_cloud_cover(df: pd.DataFrame) -> Optional[PatternHit]:
    p, c = df.iloc[-2], df.iloc[-1]
    mid = (p.open + p.close) / 2
    if (_bullish(p.open, p.close) and _bearish(c.open, c.close)
            and c.open > p.high and p.close > c.close > p.open
            and c.close < mid):
        return PatternHit("Dark Cloud Cover", Side.SHORT, 0.58)
    return None


# Ordered registry of all candlestick detectors.
CANDLESTICK_DETECTORS: List[Callable[[pd.DataFrame], Optional[PatternHit]]] = [
    morning_star,
    evening_star,
    three_white_soldiers,
    three_black_crows,
    bullish_engulfing,
    bearish_engulfing,
    piercing_line,
    dark_cloud_cover,
    hammer,
    shooting_star,
]


def detect_candlesticks(df: pd.DataFrame) -> List[PatternHit]:
    hits: List[PatternHit] = []
    for fn in CANDLESTICK_DETECTORS:
        try:
            hit = fn(df)
        except Exception:
            hit = None
        if hit is not None:
            hits.append(hit)
    return hits
