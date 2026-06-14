"""Abstract market-data feed.

A feed yields completed OHLCV candles in chronological order, interleaved
across all watchlist symbols. The engine does not care whether they came from
a random generator or from Zerodha's servers.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Iterator

from ..models import Candle


class DataFeed(ABC):
    @abstractmethod
    def candles(self) -> Iterator[Candle]:
        """Yield Candle objects in ascending timestamp order."""
