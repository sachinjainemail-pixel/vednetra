"""Top-level pattern detector: runs all families, applies filters, builds Signals."""
from __future__ import annotations

from typing import List, Optional

import pandas as pd

from ..config import PatternConfig
from ..indicators import atr, ema, is_above_average_volume
from ..models import Side, Signal
from .candlesticks import PatternHit, detect_candlesticks
from .chart_patterns import detect_chart_patterns


class PatternDetector:
    """Runs candlestick + chart pattern detection on a symbol's candle history.

    Returns at most one Signal per call (the highest-confidence hit that passes
    the trend / volume / confidence filters), to avoid firing several
    overlapping orders on the same candle.
    """

    def __init__(self, cfg: PatternConfig):
        self.cfg = cfg

    def detect(self, symbol: str, df: pd.DataFrame) -> Optional[Signal]:
        if len(df) < self.cfg.min_history:
            return None

        hits: List[PatternHit] = []
        if self.cfg.enable_candlestick:
            hits.extend(detect_candlesticks(df))
        if self.cfg.enable_chart:
            hits.extend(detect_chart_patterns(df))
        if not hits:
            return None

        trend = self._trend(df)
        atr_value = float(atr(df, period=14).iloc[-1])
        if atr_value <= 0:
            return None

        candidates: List[PatternHit] = []
        for hit in hits:
            if hit.confidence < self.cfg.min_confidence:
                continue
            if self.cfg.use_trend_filter and trend is not None \
                    and hit.side is not trend:
                continue
            candidates.append(hit)

        if not candidates:
            return None

        if self.cfg.use_volume_filter and not is_above_average_volume(
                df, self.cfg.volume_lookback):
            return None

        best = max(candidates, key=lambda h: h.confidence)
        last = df.iloc[-1]
        return Signal(
            symbol=symbol,
            timestamp=df.index[-1].to_pydatetime(),
            pattern=best.name,
            side=best.side,
            price=float(last.close),
            stop_distance=atr_value,   # raw ATR; risk manager applies multiple
            confidence=best.confidence,
            note=best.note,
        )

    def _trend(self, df: pd.DataFrame) -> Optional[Side]:
        if not self.cfg.use_trend_filter:
            return None
        fast = ema(df["close"], self.cfg.ema_fast).iloc[-1]
        slow = ema(df["close"], self.cfg.ema_slow).iloc[-1]
        if fast > slow:
            return Side.LONG
        if fast < slow:
            return Side.SHORT
        return None
