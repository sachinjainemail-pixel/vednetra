#!/usr/bin/env python3
"""Backtest harness for the VedNetra trading bot.

Two data sources:

  python backtest.py --source synthetic --days 250     # offline Monte-Carlo
  python backtest.py --source csv --data-dir data/history   # REAL Kite history

Each trading day is run with a FRESH engine (fresh broker + portfolio), so the
per-day risk caps reset exactly like they do live. Results are aggregated into
the distribution of daily P&L, % red days, max drawdown, consecutive losing
streaks, per-trade expectancy, and the impact of costs.

-------------------------------------------------------------------------------
WHAT THE NUMBERS MEAN
  --source synthetic : random-walk data. Characterises STRATEGY MECHANICS and
                       RISK PROFILE only. NOT real performance, NOT predictive.
  --source csv       : your real historical 5-min candles (fetched on your own
                       machine via scripts/fetch_history.py). This is the only
                       source whose expectancy is meaningful - and even then,
                       past performance does not guarantee future results, and
                       it excludes live slippage beyond the modelled cost.
-------------------------------------------------------------------------------
"""
from __future__ import annotations

import argparse
import logging
import statistics
from dataclasses import dataclass
from typing import List

from bot.brokers import PaperBroker
from bot.config import Config
from bot.engine import TradingEngine
from bot.feeds import ReplayFeed, SimulatedFeed, load_history
from bot.portfolio import Portfolio


@dataclass
class DayResult:
    label: str
    gross_pnl: float
    trades: int
    wins: int
    losses: int
    cap_fired: bool
    avg_win: float
    avg_loss: float

    def net_pnl(self, cost_per_trade: float) -> float:
        return self.gross_pnl - cost_per_trade * self.trades


def _result_from(engine: TradingEngine, p: Portfolio, label: str) -> DayResult:
    win_pnls = [t.pnl for t in p.trades if t.is_win]
    loss_pnls = [t.pnl for t in p.trades if not t.is_win]
    return DayResult(
        label=label,
        gross_pnl=p.realized_pnl,
        trades=len(p.trades),
        wins=p.wins,
        losses=p.losses,
        cap_fired=engine._loss_cap_logged,
        avg_win=statistics.mean(win_pnls) if win_pnls else 0.0,
        avg_loss=statistics.mean(loss_pnls) if loss_pnls else 0.0,
    )


def run_synthetic(cfg: Config, days: int, seed_start: int) -> List[DayResult]:
    results = []
    for s in range(seed_start, seed_start + days):
        feed = SimulatedFeed(cfg.watchlist, cfg.timeframe_minutes, seed=s)
        engine = TradingEngine(cfg, feed, PaperBroker())
        results.append(_result_from(engine, engine.run(), f"sim-{s}"))
    return results


def run_csv(cfg: Config, data_dir: str) -> List[DayResult]:
    history = load_history(data_dir, cfg.watchlist)
    results = []
    for day, candles in history:
        engine = TradingEngine(cfg, ReplayFeed(candles), PaperBroker())
        results.append(_result_from(engine, engine.run(), day.isoformat()))
    return results


def max_drawdown(equity: List[float]) -> float:
    peak = equity[0] if equity else 0.0
    mdd = 0.0
    for v in equity:
        peak = max(peak, v)
        mdd = min(mdd, v - peak)
    return mdd


def longest_red_streak(daily: List[float]) -> int:
    streak = best = 0
    for v in daily:
        streak = streak + 1 if v < 0 else 0
        best = max(best, streak)
    return best


def percentile(values: List[float], pct: float) -> float:
    if not values:
        return 0.0
    s = sorted(values)
    k = (len(s) - 1) * pct
    lo = int(k)
    hi = min(lo + 1, len(s) - 1)
    return s[lo] + (s[hi] - s[lo]) * (k - lo)


def report(results: List[DayResult], cost: float, capital: float,
           source: str) -> str:
    net = [r.net_pnl(cost) for r in results]
    gross = [r.gross_pnl for r in results]
    trades_total = sum(r.trades for r in results)
    wins_total = sum(r.wins for r in results)
    losses_total = sum(r.losses for r in results)
    green_days = sum(1 for v in net if v >= 0)
    red_days = len(net) - green_days

    equity, run = [], 0.0
    for v in net:
        run += v
        equity.append(run)

    all_wins = [r.avg_win for r in results if r.wins]
    all_losses = [r.avg_loss for r in results if r.losses]
    win_rate = wins_total / trades_total if trades_total else 0.0
    avg_win = statistics.mean(all_wins) if all_wins else 0.0
    avg_loss = statistics.mean(all_losses) if all_losses else 0.0
    expectancy = win_rate * avg_win + (1 - win_rate) * avg_loss
    mdd = max_drawdown(equity)

    is_real = source == "csv"
    banner = "REAL HISTORICAL DATA" if is_real else "SYNTHETIC DATA - mechanics only"

    out: List[str] = []
    def add(s: str) -> None:
        out.append(s)
    add("=" * 64)
    add(f"  BACKTEST  ({banner})")
    add("=" * 64)
    add(f"  Trading days           : {len(results)}")
    add(f"  Capital                : Rs {capital:,.0f}")
    add(f"  Cost modelled / trade  : Rs {cost:,.0f} (brokerage+taxes+slippage)")
    add("-" * 64)
    add("  DAILY P&L (net of costs)")
    add(f"    Total / cumulative   : Rs {sum(net):,.0f}")
    add(f"    Mean per day         : Rs {statistics.mean(net):,.0f}")
    add(f"    Median per day       : Rs {percentile(net, 0.5):,.0f}")
    add(f"    Std dev              : Rs {statistics.pstdev(net):,.0f}")
    add(f"    Best / Worst day     : Rs {max(net):,.0f} / Rs {min(net):,.0f}")
    add(f"    5th / 95th pctile    : Rs {percentile(net, 0.05):,.0f} / "
        f"Rs {percentile(net, 0.95):,.0f}")
    add("-" * 64)
    add("  GREEN vs RED DAYS")
    add(f"    Green / Red          : {green_days} ({green_days/len(net)*100:.1f}%)"
        f"  /  {red_days} ({red_days/len(net)*100:.1f}%)")
    add(f"    Longest red streak   : {longest_red_streak(net)} day(s)")
    add(f"    Days loss-cap fired  : {sum(1 for r in results if r.cap_fired)}")
    add("-" * 64)
    add("  PER-TRADE STATS")
    add(f"    Total trades         : {trades_total}  (W {wins_total} / L {losses_total})")
    add(f"    Win rate             : {win_rate*100:.1f}%")
    add(f"    Avg win / avg loss   : Rs {avg_win:,.0f} / Rs {avg_loss:,.0f}")
    add(f"    Expectancy / trade   : Rs {expectancy:,.0f} gross, "
        f"Rs {expectancy - cost:,.0f} net")
    add("-" * 64)
    add("  RETURN & RISK (vs capital, net of costs)")
    add(f"    Total return         : {sum(net)/capital*100:+.1f}%")
    add(f"    Max drawdown         : Rs {mdd:,.0f} ({mdd/capital*100:.1f}% of capital)")
    add(f"    Gross total (no cost): Rs {sum(gross):,.0f}")
    add("=" * 64)
    if is_real:
        add("  Real data. Past performance does NOT guarantee future results;")
        add("  forward paper-trade before risking money, and confirm SEBI algo")
        add("  compliance with your broker.")
    else:
        add("  Synthetic data. Mechanics & risk profile only - NOT real")
        add("  performance. Use --source csv on real history for any expectancy.")
    add("=" * 64)
    return "\n".join(out)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="VedNetra backtest")
    ap.add_argument("--config", default="config.yaml")
    ap.add_argument("--source", choices=["synthetic", "csv"], default="synthetic")
    ap.add_argument("--days", type=int, default=250, help="synthetic only")
    ap.add_argument("--seed-start", type=int, default=0, help="synthetic only")
    ap.add_argument("--data-dir", default="data/history", help="csv source")
    ap.add_argument("--cost", type=float, default=150.0,
                    help="modelled round-trip cost per trade (Rs)")
    ap.add_argument("--csv-out", default=None, help="write per-day CSV here")
    args = ap.parse_args(argv)

    logging.basicConfig(level=logging.ERROR)
    cfg = Config.load(args.config)

    if args.source == "csv":
        results = run_csv(cfg, args.data_dir)
    else:
        results = run_synthetic(cfg, args.days, args.seed_start)

    if not results:
        raise SystemExit("No trading days produced results.")

    if args.csv_out:
        with open(args.csv_out, "w", encoding="utf-8") as fh:
            fh.write("day,gross_pnl,net_pnl,trades,wins,losses,cap_fired\n")
            for r in results:
                fh.write(f"{r.label},{r.gross_pnl:.2f},{r.net_pnl(args.cost):.2f},"
                         f"{r.trades},{r.wins},{r.losses},{int(r.cap_fired)}\n")

    print(report(results, args.cost, cfg.capital, args.source))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
