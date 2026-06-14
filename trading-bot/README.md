# VedNetra Trading Bot

A Python intraday bot that scans stocks / F&O on the **5-minute** timeframe,
detects well-known **technical chart & candlestick patterns**, and on each
signal places a trade sized so that **the stop loses ~₹2,500 and the target
gains ~₹5,000**. It enforces a **daily loss cap** that halts trading once the
day is down too far.

Built for Indian markets, targeting **Zerodha Kite Connect**. It runs out of
the box in **paper-trading mode on an offline simulated feed** (no API keys),
so you can see the whole pipeline work before risking a rupee.

---

## ⚠️ Read this first — the honest truth about "never go red"

You asked for a strategy that **never ends the day in red**. No strategy on
earth can promise that, and anyone who says otherwise is selling a fantasy.
Here is the actual math this bot is built on:

- Every trade risks **₹2,500** to make **₹5,000** — a **2:1 reward:risk**.
- That is a *per-trade* ratio, **not** a per-day guarantee.
- On a choppy day you can hit 3–5 stop-losses in a row before a winner. Example:
  4 trades, 1 winner + 3 losers = `+5,000 − 2,500 − 2,500 − 2,500 = −₹2,500`. **Red.**

What this bot **can** guarantee — and what genuinely protects you — is:

1. **Bounded loss per trade** (~₹2,500), so no single trade blows up.
2. **A daily loss cap** (`daily_loss_cap_rupees`): once the day's *realised*
   loss hits it, the bot **stops taking new trades**. No revenge trading.
   (Positions already open can still run to their stops, so set the cap a bit
   tighter than your true max — worst case ≈ cap + open positions × ₹2,500.)
3. **Profit booked mechanically** at ₹5,000 — greed removed.
4. **Over-trading guards**: max trades/day, max open positions.

Because of the 2:1 ratio, you can be **wrong more often than right and still be
green** — but only *over many trades*, never with a per-day guarantee. The
included demo shows a 40%-win-rate day finishing **+₹5,014**; a different day
could finish red, and the loss cap is what stops that from spiralling.

> **Validate before you risk money.** Paper-trade for weeks, then go live with
> tiny size. See the SEBI note at the bottom.

---

## Quick start (paper mode, no credentials)

```bash
cd trading-bot
pip install -r requirements.txt
python run.py
```

You'll see ENTRY/EXIT logs and a daily summary. To see why signals are skipped:

```bash
python run.py --log-level DEBUG
```

Run the tests:

```bash
python -m pytest -q
```

---

## How it works

```
 DataFeed ──► PatternDetector ──► RiskManager ──► Broker ──► Portfolio
 (5-min       (candlesticks +     (sizing +       (fills /   (P&L,
  candles)     chart patterns)     daily caps)     exits)     trade log)
```

1. **Feed** emits completed 5-min candles per watchlist symbol
   (`SimulatedFeed` offline, or `KiteFeed` live).
2. **PatternDetector** runs all detectors on the rolling history and returns the
   single highest-confidence signal that passes the trend / volume / confidence
   filters.
3. **RiskManager** checks the daily caps & limits, then sizes the position so
   the stop = ~₹2,500 and the target = ~₹5,000, and pins both prices exactly.
4. **Broker** opens the position and, on each later candle, closes it when the
   high/low touches the target or stop (PaperBroker simulates; KiteBroker is
   real). If both are touched in one candle it assumes the **stop** first
   (conservative).
5. At **square-off time** all open positions are force-closed.

### Patterns detected

**Candlestick:** Bullish/Bearish Engulfing, Hammer, Shooting Star, Morning Star,
Evening Star, Three White Soldiers, Three Black Crows, Piercing Line, Dark Cloud
Cover.

**Chart (swing-based, confirmed on breakout/neckline):** Double Top, Double
Bottom, Head & Shoulders, Inverse Head & Shoulders, Ascending Triangle,
Descending Triangle, Support/Resistance Breakout.

> This is the practical, objectively-detectable subset of "humanly known"
> patterns. Adding more is easy — drop a detector into `bot/patterns/` and
> register it. Detecting *every* pattern a human eyeballs is not realistic in
> code, and many are unreliable anyway.

---

## Configuration

Everything lives in [`config.yaml`](config.yaml). Key knobs:

| Setting | Meaning |
|---|---|
| `mode` | `paper` (safe, default) or `live` (real orders) |
| `feed` | `simulated` (offline) or `kite` (live Zerodha data) |
| `broker` | `paper` or `kite` |
| `risk.profit_target_rupees` | ₹ booked at target (default 5000) |
| `risk.stop_loss_rupees` | ₹ risked at stop (default 2500) |
| `risk.daily_loss_cap_rupees` | day halts after this realised loss |
| `risk.max_trades_per_day` / `max_open_positions` | over-trading guards |
| `risk.stop_atr_multiple` | stop distance = ATR × this (controls size) |
| `watchlist` | symbols + `lot_size` / `tick_size` / `point_value` |

For **futures**, model a lot as `lot_size: <lot qty>` and `point_value: 1`
(e.g. NIFTY fut → `lot_size: 50`).

CLI flags override the file: `python run.py --feed kite --log-level DEBUG`.

---

## Going live with Zerodha (Kite Connect)

1. Get a Kite Connect app (₹500/month) → API key + secret. Put them in `.env`
   (copy `.env.example`).
2. Each morning, generate the daily access token:
   ```bash
   python scripts/kite_login.py
   ```
3. **Paper-trade against live data first** (real candles, simulated fills):
   ```bash
   python run.py --feed kite --broker paper
   ```
4. Only once you trust it, place real orders (start with *tiny* size):
   ```bash
   python run.py --mode live --feed kite --broker kite
   ```

The live broker (`bot/brokers/kite.py`) emulates a bracket order (Zerodha
discontinued native BO) with a MARKET entry + SL-M stop + LIMIT target, and
cancels the sibling when one fills. **Its fill reconciliation is candle-based;
validate it on one share before trusting it.** See the warnings in that file.

---

## Project layout

```
trading-bot/
  run.py                  # entry point
  config.yaml             # all settings
  scripts/kite_login.py   # daily Kite access-token helper
  bot/
    models.py             # Candle, Signal, Position, Trade, Instrument
    config.py             # config + .env loading
    indicators.py         # EMA, RSI, ATR, swing pivots, volume
    patterns/             # candlesticks.py, chart_patterns.py, detector.py
    risk.py               # sizing + daily caps  ← the strategy's core
    portfolio.py          # P&L + trade log
    brokers/              # base.py, paper.py, kite.py
    feeds/                # base.py, simulated.py, kite.py
    engine.py             # the main loop
  tests/                  # pytest suite
```

---

## ⚖️ Regulatory note (India / SEBI)

Automated/algo order placement through broker APIs falls under SEBI's
algo-trading framework. Retail algos above certain order rates require broker
approval / strategy registration, and brokers tag API orders as algo orders.
**Confirm your obligations with Zerodha and ensure compliance before running in
live mode.** This software is provided for education and research; you are
responsible for how you use it. Markets carry risk of loss.
