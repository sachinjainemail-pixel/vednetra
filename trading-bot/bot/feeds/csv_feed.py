"""Load historical 5-minute candles from CSV files for backtesting.

Expected layout - one CSV per instrument in `data_dir`, named <SYMBOL>.csv:

    timestamp,open,high,low,close,volume
    2026-06-13 09:15:00,3380.00,3384.20,3378.50,3382.10,145200
    ...

`load_history` groups every candle by trading date and interleaves the symbols
within each date, so a multi-day backtest can run the engine one fresh day at a
time (which makes the per-day risk caps reset naturally, exactly like live).
"""
from __future__ import annotations

from datetime import date
from pathlib import Path
from typing import Dict, List, Tuple

import pandas as pd

from ..models import Candle, Instrument


def _load_symbol(path: Path, symbol: str) -> List[Candle]:
    df = pd.read_csv(path)
    cols = {c.lower(): c for c in df.columns}
    required = ["timestamp", "open", "high", "low", "close"]
    missing = [c for c in required if c not in cols]
    if missing:
        raise ValueError(f"{path.name} missing columns: {missing}")
    ts = pd.to_datetime(df[cols["timestamp"]])
    out: List[Candle] = []
    vol_col = cols.get("volume")
    for i in range(len(df)):
        out.append(Candle(
            symbol=symbol,
            timestamp=ts.iloc[i].to_pydatetime(),
            open=float(df[cols["open"]].iloc[i]),
            high=float(df[cols["high"]].iloc[i]),
            low=float(df[cols["low"]].iloc[i]),
            close=float(df[cols["close"]].iloc[i]),
            volume=float(df[vol_col].iloc[i]) if vol_col else 0.0,
        ))
    return out


def load_history(data_dir: str, instruments: List[Instrument]
                 ) -> List[Tuple[date, List[Candle]]]:
    """Return [(trading_date, candles_sorted_by_time), ...] ascending by date.

    Only dates for which at least one instrument has data are returned. Within
    a day, candles are ordered by (timestamp, symbol) so the engine sees one
    timestamp at a time across all symbols.
    """
    directory = Path(data_dir)
    if not directory.exists():
        raise SystemExit(f"History dir not found: {directory.resolve()}")

    by_day: Dict[date, List[Candle]] = {}
    found = 0
    for inst in instruments:
        path = directory / f"{inst.symbol}.csv"
        if not path.exists():
            continue
        found += 1
        for candle in _load_symbol(path, inst.symbol):
            by_day.setdefault(candle.timestamp.date(), []).append(candle)

    if found == 0:
        raise SystemExit(
            f"No CSVs found in {directory.resolve()} for the watchlist. "
            f"Run scripts/fetch_history.py first.")

    result: List[Tuple[date, List[Candle]]] = []
    for day in sorted(by_day):
        candles = sorted(by_day[day], key=lambda c: (c.timestamp, c.symbol))
        result.append((day, candles))
    return result
