"""Configuration loading: merges config.yaml + .env + CLI overrides."""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from datetime import time
from typing import List, Optional

import yaml

from .models import Instrument

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:  # python-dotenv optional at import time
    pass


def _parse_time(value: str) -> time:
    hh, mm = value.split(":")
    return time(int(hh), int(mm))


@dataclass
class TradingWindow:
    start: time
    end: time
    square_off: time


@dataclass
class RiskConfig:
    profit_target_rupees: float = 5000
    stop_loss_rupees: float = 2500
    daily_loss_cap_rupees: float = 7500
    daily_profit_target_rupees: float = 0
    max_open_positions: int = 3
    max_trades_per_day: int = 10
    one_position_per_symbol: bool = True
    stop_atr_multiple: float = 1.5
    max_risk_overshoot: float = 1.25


@dataclass
class PatternConfig:
    min_history: int = 30
    use_trend_filter: bool = True
    ema_fast: int = 9
    ema_slow: int = 21
    use_volume_filter: bool = True
    volume_lookback: int = 20
    min_confidence: float = 0.55
    enable_candlestick: bool = True
    enable_chart: bool = True


@dataclass
class KiteCredentials:
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    access_token: Optional[str] = None

    @property
    def is_complete(self) -> bool:
        return bool(self.api_key and self.access_token)


@dataclass
class Config:
    mode: str = "paper"
    feed: str = "simulated"
    broker: str = "paper"
    timeframe_minutes: int = 5
    trading_window: TradingWindow = field(
        default_factory=lambda: TradingWindow(
            time(9, 20), time(15, 0), time(15, 15)))
    risk: RiskConfig = field(default_factory=RiskConfig)
    patterns: PatternConfig = field(default_factory=PatternConfig)
    watchlist: List[Instrument] = field(default_factory=list)
    kite: KiteCredentials = field(default_factory=KiteCredentials)
    capital: float = 1_000_000.0
    log_level: str = "INFO"

    @classmethod
    def load(cls, path: str = "config.yaml") -> "Config":
        with open(path, "r", encoding="utf-8") as fh:
            raw = yaml.safe_load(fh) or {}

        tw = raw.get("trading_window", {})
        window = TradingWindow(
            start=_parse_time(tw.get("start", "09:20")),
            end=_parse_time(tw.get("end", "15:00")),
            square_off=_parse_time(tw.get("square_off", "15:15")),
        )

        risk = RiskConfig(**{**RiskConfig().__dict__, **raw.get("risk", {})})
        patterns = PatternConfig(
            **{**PatternConfig().__dict__, **raw.get("patterns", {})})

        watchlist = [
            Instrument(
                symbol=item["symbol"],
                exchange=item.get("exchange", "NSE"),
                lot_size=int(item.get("lot_size", 1)),
                tick_size=float(item.get("tick_size", 0.05)),
                point_value=float(item.get("point_value", 1.0)),
            )
            for item in raw.get("watchlist", [])
        ]

        kite = KiteCredentials(
            api_key=os.getenv("KITE_API_KEY") or None,
            api_secret=os.getenv("KITE_API_SECRET") or None,
            access_token=os.getenv("KITE_ACCESS_TOKEN") or None,
        )

        return cls(
            mode=raw.get("mode", "paper"),
            feed=raw.get("feed", "simulated"),
            broker=raw.get("broker", "paper"),
            timeframe_minutes=int(raw.get("timeframe_minutes", 5)),
            trading_window=window,
            risk=risk,
            patterns=patterns,
            watchlist=watchlist,
            kite=kite,
            capital=float(raw.get("capital", 1_000_000.0)),
            log_level=raw.get("log_level", "INFO"),
        )
