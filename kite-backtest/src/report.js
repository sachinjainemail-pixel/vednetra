const fs = require("fs");
const path = require("path");
const { createObjectCsvWriter } = require("csv-writer");

function summarize(trades, { lots, costPerTradePerLot }) {
  let grossPnl = 0;
  let netPnl = 0;
  let wins = 0;
  let losses = 0;
  let flat = 0;

  const byLeg = { CE: { trades: 0, grossPnl: 0 }, PE: { trades: 0, grossPnl: 0 } };
  const byDay = new Map();

  for (const t of trades) {
    const rupeesGross = t.pnlPerUnit * t.lotSize * lots;
    const cost = costPerTradePerLot * lots;
    const rupeesNet = rupeesGross - cost;

    grossPnl += rupeesGross;
    netPnl += rupeesNet;

    if (rupeesNet > 0) wins++;
    else if (rupeesNet < 0) losses++;
    else flat++;

    byLeg[t.leg].trades++;
    byLeg[t.leg].grossPnl += rupeesGross;

    if (!byDay.has(t.date)) byDay.set(t.date, { trades: 0, grossPnl: 0, netPnl: 0 });
    const dayStat = byDay.get(t.date);
    dayStat.trades++;
    dayStat.grossPnl += rupeesGross;
    dayStat.netPnl += rupeesNet;
  }

  return {
    totalTrades: trades.length,
    wins,
    losses,
    flat,
    winRate: trades.length > 0 ? wins / trades.length : 0,
    grossPnl,
    netPnl,
    totalCosts: grossPnl - netPnl,
    byLeg,
    byDay: Array.from(byDay.entries()).map(([date, stat]) => ({ date, ...stat })),
  };
}

async function writeTradesCsv(trades, filePath) {
  const writer = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: "date", title: "date" },
      { id: "leg", title: "leg" },
      { id: "tradingsymbol", title: "tradingsymbol" },
      { id: "strike", title: "strike" },
      { id: "expiry", title: "expiry" },
      { id: "blockStart", title: "block_start" },
      { id: "lastDir", title: "last_5min_dir" },
      { id: "firstDir", title: "first_1min_dir" },
      { id: "tradeDir", title: "trade_dir" },
      { id: "entryTime", title: "entry_time" },
      { id: "entryPrice", title: "entry_price" },
      { id: "exitTime", title: "exit_time" },
      { id: "exitPrice", title: "exit_price" },
      { id: "pnlPerUnit", title: "pnl_per_unit" },
      { id: "lotSize", title: "lot_size" },
    ],
  });
  await writer.writeRecords(trades);
}

function writeSummaryJson(summary, gaps, filePath) {
  fs.writeFileSync(filePath, JSON.stringify({ summary, gaps }, null, 2));
}

function printSummary(summary, gaps) {
  console.log("\n=== Backtest Summary ===");
  console.log(`Total trades:  ${summary.totalTrades}`);
  console.log(`Wins/Losses/Flat: ${summary.wins}/${summary.losses}/${summary.flat}`);
  console.log(`Win rate:      ${(summary.winRate * 100).toFixed(1)}%`);
  console.log(`Gross P&L:     Rs ${summary.grossPnl.toFixed(2)}`);
  console.log(`Costs:         Rs ${summary.totalCosts.toFixed(2)}`);
  console.log(`Net P&L:       Rs ${summary.netPnl.toFixed(2)}`);
  console.log(`\nBy leg: CE ${summary.byLeg.CE.trades} trades (Rs ${summary.byLeg.CE.grossPnl.toFixed(2)} gross), ` +
    `PE ${summary.byLeg.PE.trades} trades (Rs ${summary.byLeg.PE.grossPnl.toFixed(2)} gross)`);

  if (gaps.length > 0) {
    console.log(`\n=== Data gaps (${gaps.length}) - requested but unavailable/skipped ===`);
    for (const g of gaps) {
      console.log(`  ${g.date}${g.leg ? ` [${g.leg}]` : ""}: ${g.reason}`);
    }
  }
}

module.exports = { summarize, writeTradesCsv, writeSummaryJson, printSummary };
