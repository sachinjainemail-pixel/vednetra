#!/usr/bin/env python3
"""Download historical 5-minute candles from Zerodha Kite into CSV files.

RUN THIS ON YOUR OWN MACHINE (it needs your Kite credentials and internet).
The bot's cloud/sandbox environment cannot reach Kite or do the daily login.

Workflow:
    1. pip install -r requirements.txt
    2. Put KITE_API_KEY / KITE_API_SECRET in .env
    3. python scripts/kite_login.py          # daily access token
    4. python scripts/fetch_history.py --from 2026-01-01 --to 2026-06-13
    5. python backtest.py --source csv       # (me or you) backtest on real data

It reads the watchlist from config.yaml and writes one <SYMBOL>.csv per
instrument into data/history/. Kite caps the date range per request, so this
chunks automatically.
"""
from __future__ import annotations

import argparse
import sys
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from bot.config import Config  # noqa: E402

try:
    from kiteconnect import KiteConnect
except ImportError:
    raise SystemExit("pip install kiteconnect")


CHUNK_DAYS = 60  # stay within Kite's per-request range limit for 5-minute data


def resolve_tokens(kite, instruments):
    wanted = {(i.exchange, i.symbol): i for i in instruments}
    tokens = {}
    for exch in {i.exchange for i in instruments}:
        for row in kite.instruments(exch):
            key = (exch, row["tradingsymbol"])
            if key in wanted:
                tokens[wanted[key].symbol] = row["instrument_token"]
    missing = [i.symbol for i in instruments if i.symbol not in tokens]
    if missing:
        raise SystemExit(f"Could not resolve tokens for: {missing}")
    return tokens


def fetch_symbol(kite, token, frm, to, interval):
    rows = []
    cursor = frm
    while cursor <= to:
        chunk_end = min(cursor + timedelta(days=CHUNK_DAYS), to)
        rows.extend(kite.historical_data(token, cursor, chunk_end, interval))
        cursor = chunk_end + timedelta(days=1)
    return rows


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Fetch Kite historical candles")
    ap.add_argument("--config", default="config.yaml")
    ap.add_argument("--from", dest="frm", required=True, help="YYYY-MM-DD")
    ap.add_argument("--to", dest="to", required=True, help="YYYY-MM-DD")
    ap.add_argument("--interval", default="5minute")
    ap.add_argument("--out", default="data/history")
    args = ap.parse_args(argv)

    cfg = Config.load(args.config)
    if not cfg.kite.is_complete:
        raise SystemExit("Kite credentials missing. Run scripts/kite_login.py first.")

    kite = KiteConnect(api_key=cfg.kite.api_key)
    kite.set_access_token(cfg.kite.access_token)

    frm = datetime.strptime(args.frm, "%Y-%m-%d")
    to = datetime.strptime(args.to, "%Y-%m-%d") + timedelta(hours=23, minutes=59)

    out_dir = ROOT / args.out
    out_dir.mkdir(parents=True, exist_ok=True)
    tokens = resolve_tokens(kite, cfg.watchlist)

    for inst in cfg.watchlist:
        print(f"Fetching {inst.symbol} {args.interval} {args.frm}..{args.to} ...",
              end=" ", flush=True)
        bars = fetch_symbol(kite, tokens[inst.symbol], frm, to, args.interval)
        path = out_dir / f"{inst.symbol}.csv"
        with open(path, "w", encoding="utf-8") as fh:
            fh.write("timestamp,open,high,low,close,volume\n")
            for b in bars:
                ts = b["date"].strftime("%Y-%m-%d %H:%M:%S")
                fh.write(f"{ts},{b['open']},{b['high']},{b['low']},"
                         f"{b['close']},{b.get('volume', 0)}\n")
        print(f"{len(bars)} candles -> {path.relative_to(ROOT)}")

    print("\nDone. Now run:  python backtest.py --source csv")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
