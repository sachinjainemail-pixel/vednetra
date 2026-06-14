"""ReplayFeed - yields a pre-built list of candles (used for historical replay)."""
from __future__ import annotations

from typing import Iterator, List

from ..models import Candle
from .base import DataFeed


class ReplayFeed(DataFeed):
    def __init__(self, candles: List[Candle]):
        self._candles = candles

    def candles(self) -> Iterator[Candle]:
        yield from self._candles
