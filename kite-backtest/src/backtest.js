require("dotenv").config();
const path = require("path");
const { getKite } = require("./kiteClient");
const { fetchCandles, addDays, toDateOnly } = require("./historical");
const {
  getNiftySpotInstrument,
  getAvailableNiftyOptionExpiries,
  resolveExpiryForDate,
  findItmContracts,
} = require("./instruments");
const { computeTradesForDay } = require("./strategy");
const { summarize, writeTradesCsv, writeSummaryJson, printSummary } = require("./report");

const TRADING_DAYS = parseInt(process.env.BACKTEST_TRADING_DAYS || "30", 10);
const LOTS = parseInt(process.env.BACKTEST_LOTS || "1", 10);
const COST_PER_TRADE_PER_LOT = parseFloat(process.env.BACKTEST_COST_PER_TRADE_PER_LOT || "0");

async function resolveTradingDays(kite, spotToken, count) {
  // Fetch a generous calendar-day lookback (weekends + holidays included) and
  // take the trailing `count` days that actually produced a daily candle -
  // i.e. real trading days, without hardcoding an NSE holiday calendar.
  const today = toDateOnly(new Date());
  const from = addDays(today, -Math.ceil(count * 1.8) - 15);
  const daily = await fetchCandles(kite, spotToken, "day", from, today);
  return daily.slice(-count).map((c) => ({ date: toDateOnly(new Date(c.date)), open: c.open }));
}

async function backtestLeg(kite, day, contract, meta, gaps) {
  const candles = await fetchCandles(kite, contract.instrument_token, "minute", day.date, day.date);
  if (candles.length === 0) {
    gaps.push({ date: day.date, leg: meta.leg, reason: `no minute data returned for ${contract.tradingsymbol}` });
    return [];
  }
  const trades = computeTradesForDay(candles, {
    date: day.date,
    leg: meta.leg,
    tradingsymbol: contract.tradingsymbol,
    strike: contract.strike,
    expiry: contract.expiry,
    lotSize: contract.lot_size,
  });
  return trades;
}

async function main() {
  const kite = getKite();

  console.log(`Resolving last ${TRADING_DAYS} trading days...`);
  const spot = await getNiftySpotInstrument(kite);
  const tradingDays = await resolveTradingDays(kite, spot.instrument_token, TRADING_DAYS);
  console.log(`Found ${tradingDays.length} trading days: ${tradingDays[0]?.date} .. ${tradingDays[tradingDays.length - 1]?.date}`);

  const availableExpiries = await getAvailableNiftyOptionExpiries(kite);
  console.log(`Weekly NIFTY option expiries available in instruments dump: ${availableExpiries.join(", ") || "(none found)"}`);

  const allTrades = [];
  const gaps = [];

  for (const day of tradingDays) {
    const expiry = resolveExpiryForDate(availableExpiries, day.date);
    if (!expiry) {
      gaps.push({ date: day.date, reason: "no listed weekly expiry on/after this date (contract likely expired out of the instruments dump)" });
      continue;
    }

    const { ce, pe } = await findItmContracts(kite, expiry, day.open);
    if (!ce) gaps.push({ date: day.date, leg: "CE", reason: `no ITM CE strike found for expiry ${expiry} at spot ${day.open}` });
    if (!pe) gaps.push({ date: day.date, leg: "PE", reason: `no ITM PE strike found for expiry ${expiry} at spot ${day.open}` });

    console.log(`${day.date}: spot open ${day.open}, expiry ${expiry}, CE ${ce ? ce.tradingsymbol : "-"}, PE ${pe ? pe.tradingsymbol : "-"}`);

    if (ce) allTrades.push(...(await backtestLeg(kite, day, ce, { leg: "CE" }, gaps)));
    if (pe) allTrades.push(...(await backtestLeg(kite, day, pe, { leg: "PE" }, gaps)));
  }

  const summary = summarize(allTrades, { lots: LOTS, costPerTradePerLot: COST_PER_TRADE_PER_LOT });

  const outDir = path.join(__dirname, "..", "output");
  await writeTradesCsv(allTrades, path.join(outDir, "trades.csv"));
  writeSummaryJson(summary, gaps, path.join(outDir, "summary.json"));

  printSummary(summary, gaps);
  console.log(`\nTrades written to kite-backtest/output/trades.csv`);
  console.log(`Summary written to kite-backtest/output/summary.json`);
}

main().catch((err) => {
  console.error("Backtest failed:", err.message || err);
  process.exit(1);
});
