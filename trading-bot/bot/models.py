"""Core data models shared across the bot.

These are deliberately plain dataclasses so they are easy to log, serialise
and reason about. No broker- or feed-specific details leak in here.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


class Side(str, Enum):
    LONG = "LONG"
    SHORT = "SHORT"

    @property
    def opposite(self) -> "Side":
        return Side.SHORT if self is Side.LONG else Side.LONG

    @property
    def sign(self) -> int:
        """+1 for LONG, -1 for SHORT. Handy for P&L math."""
        return 1 if self is Side.LONG else -1


class ExitReason(str, Enum):
    TARGET = "TARGET"          # profit target hit
    STOP = "STOP"             # stop-loss hit
    SQUARE_OFF = "SQUARE_OFF"  # end-of-day forced close
    MANUAL = "MANUAL"


@dataclass
class Instrument:
    """Static metadata about a tradeable symbol."""
    symbol: str
    exchange: str = "NSE"
    lot_size: int = 1
    tick_size: float = 0.05
    point_value: float = 1.0   # rupee P&L per 1.0 price move per 1 unit

    @property
    def key(self) -> str:
        return f"{self.exchange}:{self.symbol}"

    def round_to_tick(self, price: float) -> float:
        steps = round(price / self.tick_size)
        return round(steps * self.tick_size, 2)


@dataclass
class Candle:
    """A single OHLCV bar."""
    symbol: str
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float = 0.0


@dataclass
class Signal:
    """A pattern detection that may become a trade."""
    symbol: str
    timestamp: datetime
    pattern: str
    side: Side
    price: float            # reference price (usually the signal candle close)
    stop_distance: float    # suggested stop distance in price points (> 0)
    confidence: float = 0.5
    note: str = ""


@dataclass
class Position:
    """An open position being managed by the broker."""
    instrument: Instrument
    side: Side
    quantity: int
    entry_price: float
    target_price: float
    stop_price: float
    entry_time: datetime
    pattern: str = ""
    order_id: Optional[str] = None

    def unrealised_pnl(self, last_price: float) -> float:
        return (last_price - self.entry_price) * self.side.sign * \
            self.quantity * self.instrument.point_value


@dataclass
class Trade:
    """A completed (closed) trade."""
    symbol: str
    side: Side
    quantity: int
    entry_price: float
    exit_price: float
    entry_time: datetime
    exit_time: datetime
    pnl: float
    reason: ExitReason
    pattern: str = ""

    @property
    def is_win(self) -> bool:
        return self.pnl > 0
