"""Tracks realised P&L, the trade log and daily statistics."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import List

from .models import Trade


@dataclass
class Portfolio:
    realized_pnl: float = 0.0
    trades: List[Trade] = field(default_factory=list)

    def record(self, trade: Trade) -> None:
        self.realized_pnl += trade.pnl
        self.trades.append(trade)

    @property
    def trades_today(self) -> int:
        # Single trading session per run, so every recorded trade is "today".
        return len(self.trades)

    @property
    def wins(self) -> int:
        return sum(1 for t in self.trades if t.is_win)

    @property
    def losses(self) -> int:
        return sum(1 for t in self.trades if not t.is_win)

    @property
    def win_rate(self) -> float:
        return self.wins / len(self.trades) if self.trades else 0.0

    def summary(self) -> str:
        lines = [
            "=" * 52,
            "  DAILY SUMMARY",
            "=" * 52,
            f"  Trades taken : {len(self.trades)}",
            f"  Wins / Losses: {self.wins} / {self.losses}",
            f"  Win rate     : {self.win_rate * 100:.1f}%",
            f"  Realised P&L : Rs {self.realized_pnl:,.2f}",
            "=" * 52,
        ]
        if self.trades:
            lines.append("  Trade log:")
            for i, t in enumerate(self.trades, 1):
                lines.append(
                    f"   {i:>2}. {t.symbol:<10} {t.side.value:<5} "
                    f"qty={t.quantity:<4} {t.pattern:<24} "
                    f"{t.reason.value:<10} Rs {t.pnl:>9,.2f}")
            lines.append("=" * 52)
        return "\n".join(lines)
