#!/usr/bin/env python3
"""Monte-Carlo backtest harness for the VedNetra trading bot.

Runs the full engine (detector -> risk -> paper broker) over many independent
trading days and aggregates the statistics that actually matter for a
fixed-rupee strategy: distribution of daily P&L, % of red days, max drawdown,
consecutive losing days, per-trade expectancy, and the impact of costs.

  python backtest.py --days 250 --cost 150

-------------------------------------------------------------------------------
IMPORTANT - WHAT THESE NUMBERS DO AND DO NOT MEAN
-------------------------------------------------------------------------------
By default this runs on the SYNTHETIC SimulatedFeed (a random walk with
injected trend regimes). The results therefore characterise the STRATEGY
MECHANICS AND RISK PROFILE - per-trade caps holding, how often the daily loss
cap fires, the shape of the daily-P&L distribution, drawdown behaviour - they
do NOT represent real-market performance and do NOT predict profitability.
A real edge can only be measured on real historical data (--source kite, once
you have credentials). Treat synthetic results as a stress-test of the plumbing
and the risk design, not as a track record.
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
from bot.feeds import SimulatedFeed


@dataclass
class DayResult:
    seed: int
    gross_pnl: float
    trades: int
    wins: int
    losses: int
    cap_fired: bool
    avg_win: float
    avg_loss: float

    def net_pnl(self, cost_per_trade: float) -> float:
        return self.gross_pnl - cost_per_trade * self.trades


def run_one_day(cfg: Config, seed: int) -> DayResult:
    feed = SimulatedFeed(cfg.watchlist, cfg.timeframe_minutes, seed=seed)
    engine = TradingEngine(cfg, feed, PaperBroker())
    p = engine.run()
    win_pnls = [t.pnl for t in p.trades if t.is_win]
    loss_pnls = [t.pnl for t in p.trades if not t.is_win]
    return DayResult(
        seed=seed,
        gross_pnl=p.realized_pnl,
        trades=len(p.trades),
        wins=p.wins,
        losses=p.losses,
        cap_fired=engine._loss_cap_logged,
        avg_win=statistics.mean(win_pnls) if win_pnls else 0.0,
        avg_loss=statistics.mean(loss_pnls) if loss_pnls else 0.0,
    )


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


def report(results: List[DayResult], cost: float) -> str:
    net = [r.net_pnl(cost) for r in results]
    gross = [r.gross_pnl for r in results]
    trades_total = sum(r.trades for r in results)
    wins_total = sum(r.wins for r in results)
    losses_total = sum(r.losses for r in results)
    green_days = sum(1 for v in net if v >= 0)
    red_days = len(net) - green_days

    equity = []
    run = 0.0
    for v in net:
        run += v
        equity.append(run)

    all_wins = [r.avg_win for r in results if r.wins]
    all_losses = [r.avg_loss for r in results if r.losses]
    win_rate = wins_total / trades_total if trades_total else 0.0
    avg_win = statistics.mean(all_wins) if all_wins else 0.0
    avg_loss = statistics.mean(all_losses) if all_losses else 0.0
    expectancy = (win_rate * avg_win + (1 - win_rate) * avg_loss)

    L = []
    add = L.append
    add("=" * 64)
    add("  MONTE-CARLO BACKTEST  (SYNTHETIC DATA - mechanics only)")
    add("=" * 64)
    add(f"  Simulated trading days : {len(results)}")
    add(f"  Cost modelled / trade  : Rs {cost:,.0f} (brokerage+taxes+slippage)")
    add("-" * 64)
    add("  DAILY P&L (net of costs)")
    add(f"    Total / cumulative   : Rs {sum(net):,.0f}")
    add(f"    Mean per day         : Rs {statistics.mean(net):,.0f}")
    add(f"    Median per day       : Rs {percentile(net, 0.5):,.0f}")
    add(f"    Std dev              : Rs {statistics.pstdev(net):,.0f}")
    add(f"    Best day             : Rs {max(net):,.0f}")
    add(f"    Worst day            : Rs {min(net):,.0f}")
    add(f"    5th pctile day       : Rs {percentile(net, 0.05):,.0f}")
    add(f"    95th pctile day      : Rs {percentile(net, 0.95):,.0f}")
    add("-" * 64)
    add("  GREEN vs RED DAYS")
    add(f"    Green days           : {green_days} ({green_days/len(net)*100:.1f}%)")
    add(f"    Red days             : {red_days} ({red_days/len(net)*100:.1f}%)")
    add(f"    Longest red streak   : {longest_red_streak(net)} day(s)")
    add(f"    Days loss-cap fired  : {sum(1 for r in results if r.cap_fired)}")
    add("-" * 64)
    add("  PER-TRADE STATS")
    add(f"    Total trades         : {trades_total}")
    add(f"    Win / Loss           : {wins_total} / {losses_total}")
    add(f"    Win rate             : {win_rate*100:.1f}%")
    add(f"    Avg win              : Rs {avg_win:,.0f}")
    add(f"    Avg loss             : Rs {avg_loss:,.0f}")
    add(f"    Expectancy / trade   : Rs {expectancy:,.0f} (gross of costs)")
    add(f"    Expectancy / trade   : Rs {expectancy - cost:,.0f} (net of costs)")
    add("-" * 64)
    add("  RISK (on the net daily equity curve)")
    add(f"    Max drawdown         : Rs {max_drawdown(equity):,.0f}")
    add(f"    Gross total (no cost): Rs {sum(gross):,.0f}")
    add("=" * 64)
    add("  NOTE: synthetic data. Characterises mechanics & risk profile,")
    add("  NOT real-market performance. Validate on Kite history before")
    add("  trusting any expectancy number.")
    add("=" * 64)
    return "\n".join(L)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Monte-Carlo backtest")
    ap.add_argument("--config", default="config.yaml")
    ap.add_argument("--days", type=int, default=250,
                    help="number of independent simulated trading days")
    ap.add_argument("--cost", type=float, default=150.0,
                    help="modelled round-trip cost per trade (Rs)")
    ap.add_argument("--seed-start", type=int, default=0)
    ap.add_argument("--csv", default=None, help="optional path to write per-day CSV")
    args = ap.parse_args(argv)

    logging.basicConfig(level=logging.ERROR)  # silence per-day engine logs
    cfg = Config.load(args.config)

    results = [run_one_day(cfg, s)
               for s in range(args.seed_start, args.seed_start + args.days)]

    if args.csv:
        with open(args.csv, "w", encoding="utf-8") as fh:
            fh.write("seed,gross_pnl,net_pnl,trades,wins,losses,cap_fired\n")
            for r in results:
                fh.write(f"{r.seed},{r.gross_pnl:.2f},{r.net_pnl(args.cost):.2f},"
                         f"{r.trades},{r.wins},{r.losses},{int(r.cap_fired)}\n")

    print(report(results, args.cost))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
