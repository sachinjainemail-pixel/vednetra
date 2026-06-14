"""SimulatedFeed - generates a full day of synthetic 5-minute candles.

Used for the default offline paper-trading demo so the bot is runnable with
zero credentials. The series is a random walk with injected trend regimes and
the occasional volume spike, so that genuine chart patterns actually form and
the detector / risk / broker pipeline gets exercised end to end.

It is NOT a market simulator for edge validation - real validation needs real
historical data (use --feed kite). It exists to prove the plumbing works.
"""
from __future__ import annotations

import random
from datetime import datetime, time, timedelta
from typing import Dict, Iterator, List

from ..models import Candle, Instrument
from .base import DataFeed


class SimulatedFeed(DataFeed):
    def __init__(self, instruments: List[Instrument],
                 timeframe_minutes: int = 5,
                 session_date: datetime | None = None,
                 seed: int | None = 42):
        self.instruments = instruments
        self.timeframe = timeframe_minutes
        self.rng = random.Random(seed)
        base = session_date or datetime.now()
        self.day = base.replace(hour=0, minute=0, second=0, microsecond=0)

    def _timestamps(self) -> List[datetime]:
        start = datetime.combine(self.day.date(), time(9, 15))
        end = datetime.combine(self.day.date(), time(15, 30))
        out, t = [], start
        while t <= end:
            out.append(t)
            t += timedelta(minutes=self.timeframe)
        return out

    def _series_for(self, inst: Instrument, n: int) -> List[Candle]:
        # Distinct but deterministic starting price per symbol.
        price = 500 + (abs(hash(inst.symbol)) % 3000)
        vol_unit = price * 0.0012  # ~0.12% per-bar volatility

        # Build a sequence of trend regimes so structure (breakouts, double
        # tops/bottoms, H&S) can emerge instead of pure noise.
        drift = 0.0
        candles: List[Candle] = []
        timestamps = self._timestamps()[:n]
        regime_left = 0
        for ts in timestamps:
            if regime_left <= 0:
                regime_left = self.rng.randint(6, 14)
                drift = self.rng.choice([-1, -0.5, 0, 0.5, 1]) * vol_unit * 0.4
            regime_left -= 1

            o = price
            shock = self.rng.gauss(0, 1) * vol_unit
            c = max(1.0, o + drift + shock)
            hi = max(o, c) + abs(self.rng.gauss(0, 1)) * vol_unit * 0.5
            lo = min(o, c) - abs(self.rng.gauss(0, 1)) * vol_unit * 0.5
            base_vol = self.rng.randint(50_000, 150_000)
            if self.rng.random() < 0.15:        # occasional volume spike
                base_vol *= self.rng.uniform(1.8, 3.5)
            candles.append(Candle(
                symbol=inst.symbol, timestamp=ts,
                open=round(o, 2), high=round(hi, 2),
                low=round(lo, 2), close=round(c, 2),
                volume=round(base_vol)))
            price = c
        return candles

    def candles(self) -> Iterator[Candle]:
        n = len(self._timestamps())
        per_symbol: Dict[str, List[Candle]] = {
            inst.symbol: self._series_for(inst, n) for inst in self.instruments}
        # Interleave by bar index so the engine sees one timestamp at a time.
        for i in range(n):
            for inst in self.instruments:
                series = per_symbol[inst.symbol]
                if i < len(series):
                    yield series[i]
