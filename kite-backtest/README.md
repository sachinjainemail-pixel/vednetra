# Kite ITM NIFTY Options Pattern Backtest

A local, standalone Node.js script that backtests a 5-minute/1-minute
candle-pattern strategy on ITM NIFTY weekly options, using historical data
from your Zerodha Kite Connect subscription.

This is **not** part of the deployed VedNetra web app — it's a separate
tool you run on your own machine with your own Kite Connect API credentials.
Nothing here touches the public site, and your API secret / access token
never leave your `.env` file.

## Strategy being backtested

Applied **independently** to the ITM CE and the ITM PE (i.e. two parallel,
separate runs of the same rule on each option's own price candles):

1. Resample the option's 1-minute candles into 5-minute blocks anchored to
   market open (09:15).
2. For each block (except the first block of the day, which has no prior
   block to compare against):
   - `lastDir` = direction (up/down) of the **previous** 5-minute block.
   - `firstDir` = direction of the **current** block's first 1-minute candle.
   - If `firstDir` is **opposite** `lastDir` → take the trade **with**
     `lastDir`.
   - If `firstDir` is the **same** as `lastDir` → take the trade **against**
     `lastDir` (fade it).
   - If either candle is a doji (open == close) → no trade, signal is
     ambiguous.
3. Entry: open of the block's 2nd minute (right after the 1st minute
   closes).
4. Exit: open of the block's 5th minute (three minutes later).
5. P&L is marked symmetrically for both directions: a "trade with `lastDir`
   up" is long, a "trade against `lastDir` up" is short — `pnl = tradeDir *
   (exitPrice - entryPrice)`.

ITM strike selection: the nearest ITM CE (highest strike below spot) and
nearest ITM PE (lowest strike above spot) are chosen **once per day**, using
the NIFTY 50 index's opening price at 09:15, against the nearest weekly
expiry on/after that date.

## Known limitation: historical data for expired weekly contracts

Kite Connect's historical data API only reliably serves candles for
instruments that are still present in the **current** `/instruments` dump.
That dump typically only carries the current week's (and maybe the next
week's / a recently expired week's) NIFTY option contracts — strikes from
older, already-expired weekly contracts generally are **not** discoverable
or fetchable through the API at all.

This means a request for e.g. the last 30 trading days will likely only
return usable data for the most recent 1-2 weekly expiries. The script does
**not** silently drop this gap: every day/leg it couldn't fetch data for is
recorded and printed under "Data gaps" in the summary output, with a reason
(no listed expiry, no ITM strike found, or no candles returned).

## Setup

```bash
cd kite-backtest
npm install
cp .env.example .env
```

Edit `.env` and fill in:

- `KITE_API_KEY` / `KITE_API_SECRET` — from your app at
  https://developers.kite.trade
- Leave `KITE_ACCESS_TOKEN` blank for now — the login step below fills it in.
- Adjust `BACKTEST_TRADING_DAYS`, `BACKTEST_LOTS`, and
  `BACKTEST_COST_PER_TRADE_PER_LOT` as desired.

## Daily login (required before each run)

Kite access tokens expire daily. Before running the backtest each day:

```bash
npm run login
```

This prints a login URL — open it, log in with your Zerodha credentials,
and paste the `request_token` from the redirected URL back into the
terminal. The resulting access token is saved into `.env` automatically.

## Running the backtest

```bash
npm run backtest
```

This will:

1. Resolve the last `BACKTEST_TRADING_DAYS` actual trading days (derived
   from NIFTY 50 daily candles, so weekends/holidays are excluded
   automatically).
2. For each day, resolve the current weekly expiry and the nearest ITM CE /
   PE strikes based on that day's opening spot price.
3. Fetch 1-minute candles for each leg and run the strategy.
4. Write `output/trades.csv` (every individual trade) and
   `output/summary.json` (aggregated stats + data gaps), and print a summary
   to the console.

## Output

- **`output/trades.csv`** — one row per trade: date, leg (CE/PE), contract,
  the block's signal (`last_5min_dir`, `first_1min_dir`, `trade_dir`), entry
  and exit time/price, and raw `pnl_per_unit`.
- **`output/summary.json`** — total trades, win rate, gross/net P&L (net
  applies `BACKTEST_COST_PER_TRADE_PER_LOT` as a flat per-trade cost
  estimate for brokerage/STT/slippage — set it to `0` for pure price P&L),
  a per-leg and per-day breakdown, and the list of data gaps.

## Assumptions worth knowing about

- The first 5-minute block of each trading day is skipped (no prior block
  within the same session to compare against) — signals do not carry over
  from the previous day's close.
- A block is skipped entirely if any of its 5 one-minute candles are
  missing (e.g. an illiquid deep-ITM strike with a no-trade minute), rather
  than guessing or forward-filling.
- Position sizing is `BACKTEST_LOTS` lots per trade, using each contract's
  actual exchange lot size (read from the instruments dump, not
  hardcoded).
- `BACKTEST_COST_PER_TRADE_PER_LOT` is a flat estimate, not a real
  brokerage/STT/slippage model — treat net P&L as approximate.
