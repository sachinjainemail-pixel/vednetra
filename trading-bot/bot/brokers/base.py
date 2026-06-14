"""Abstract broker interface.

A broker turns an approved OrderPlan into an open Position, watches each new
candle to see if the target or stop was touched, and reports closed Trades.
PaperBroker simulates this; KiteBroker does it for real.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Dict, List

from ..models import Candle, Position, Trade
from ..risk import OrderPlan


class Broker(ABC):
    def __init__(self) -> None:
        self.positions: Dict[str, Position] = {}

    @property
    def open_count(self) -> int:
        return len(self.positions)

    def has_position(self, symbol: str) -> bool:
        return symbol in self.positions

    @abstractmethod
    def place(self, plan: OrderPlan, timestamp: datetime) -> Position:
        """Open a position from an approved plan."""

    @abstractmethod
    def on_candle(self, candle: Candle) -> List[Trade]:
        """Process a new candle; close + return any trades whose TP/SL hit."""

    @abstractmethod
    def square_off_all(self, prices: Dict[str, float],
                       timestamp: datetime) -> List[Trade]:
        """Force-close every open position (end of day)."""
