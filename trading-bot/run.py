#!/usr/bin/env python3
"""VedNetra trading bot - entry point.

Examples
--------
  # Default: paper trading on the offline simulated feed (no keys needed)
  python run.py

  # Paper trade against LIVE Zerodha 5-min data (needs Kite credentials)
  python run.py --feed kite

  # Show every skipped-signal reason
  python run.py --log-level DEBUG
"""
from __future__ import annotations

import argparse
import logging
import sys

from bot.config import Config
from bot.engine import TradingEngine


def build_feed(cfg: Config):
    if cfg.feed == "simulated":
        from bot.feeds import SimulatedFeed
        return SimulatedFeed(cfg.watchlist, cfg.timeframe_minutes)
    if cfg.feed == "kite":
        from bot.feeds.kite import KiteFeed
        return KiteFeed(cfg.watchlist, cfg.kite, cfg.timeframe_minutes,
                        cfg.trading_window)
    raise SystemExit(f"Unknown feed: {cfg.feed}")


def build_broker(cfg: Config):
    if cfg.broker == "paper":
        from bot.brokers import PaperBroker
        return PaperBroker()
    if cfg.broker == "kite":
        if cfg.mode != "live":
            raise SystemExit(
                "broker=kite requires mode=live. Refusing to place real "
                "orders in paper mode.")
        from bot.brokers.kite import KiteBroker
        return KiteBroker(cfg.kite, cfg.watchlist)
    raise SystemExit(f"Unknown broker: {cfg.broker}")


def parse_args(argv) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="VedNetra trading bot")
    p.add_argument("--config", default="config.yaml")
    p.add_argument("--mode", choices=["paper", "live"])
    p.add_argument("--feed", choices=["simulated", "kite"])
    p.add_argument("--broker", choices=["paper", "kite"])
    p.add_argument("--log-level", default=None,
                   choices=["DEBUG", "INFO", "WARNING", "ERROR"])
    return p.parse_args(argv)


def main(argv=None) -> int:
    args = parse_args(argv or sys.argv[1:])
    cfg = Config.load(args.config)

    # CLI overrides win over the yaml file.
    if args.mode:
        cfg.mode = args.mode
    if args.feed:
        cfg.feed = args.feed
    if args.broker:
        cfg.broker = args.broker
    if args.log_level:
        cfg.log_level = args.log_level

    logging.basicConfig(
        level=getattr(logging, cfg.log_level, logging.INFO),
        format="%(asctime)s %(levelname)-7s %(name)-12s %(message)s",
        datefmt="%H:%M:%S",
    )

    if cfg.mode == "live":
        logging.getLogger("bot").warning(
            "LIVE MODE: real orders may be placed. Ctrl-C now if unintended.")

    engine = TradingEngine(cfg, build_feed(cfg), build_broker(cfg))
    portfolio = engine.run()

    # Non-zero exit if the day finished red, so CI / cron can alert.
    return 0 if portfolio.realized_pnl >= 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
