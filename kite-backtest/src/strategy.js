// Core strategy logic, kept as pure functions so it can be reasoned about
// (and unit-tested) independently of the Kite API / IO layers.
//
// Rules (applied independently per option leg - CE or PE - using that
// option's own 1-minute candles, resampled into 5-minute blocks anchored to
// market open 09:15):
//
//   For each 5-minute block (except the first block of the day, which has no
//   preceding block to compare against):
//     lastDir  = direction (up/down) of the PREVIOUS 5-minute block
//     firstDir = direction of the CURRENT block's first 1-minute candle
//     - if firstDir is OPPOSITE lastDir  -> trade WITH lastDir
//     - if firstDir is SAME as lastDir   -> trade AGAINST lastDir (fade it)
//     - if either direction is flat (doji, open==close) -> no trade
//   Entry: open of the block's 2nd minute (right after the 1st minute closes)
//   Exit:  open of the block's 5th minute (three minutes later)
//   P&L is marked both long and short symmetrically: tradeDir * (exit - entry)

const MARKET_OPEN_MINUTES = 9 * 60 + 15; // 09:15 in minutes-from-midnight

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// The kiteconnect SDK parses Kite's "...+0530" timestamps into JS Date
// objects, which represent the correct absolute instant but whose
// getHours()/getMinutes() depend on the runtime's local timezone. Shift by
// the fixed IST offset and read back with UTC getters so this is correct
// regardless of what timezone the script happens to run in.
function localMinutesOfDay(timestamp) {
  const d = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const ist = new Date(d.getTime() + IST_OFFSET_MS);
  return ist.getUTCHours() * 60 + ist.getUTCMinutes();
}

function direction(open, close) {
  if (close > open) return 1;
  if (close < open) return -1;
  return 0;
}

// Groups a single day's 1-minute candles into 5-minute blocks anchored to
// 09:15. Blocks with missing minutes (gaps in illiquid contracts) are
// returned with complete: false so callers can skip them explicitly instead
// of silently trading on partial data.
function groupIntoFiveMinuteBlocks(oneMinCandles) {
  const blocks = new Map();

  for (const candle of oneMinCandles) {
    const offset = localMinutesOfDay(candle.date) - MARKET_OPEN_MINUTES;
    if (offset < 0) continue; // pre-market stray candle, ignore

    const blockIndex = Math.floor(offset / 5);
    const posInBlock = offset % 5;

    if (!blocks.has(blockIndex)) {
      blocks.set(blockIndex, new Array(5).fill(null));
    }
    blocks.get(blockIndex)[posInBlock] = candle;
  }

  return Array.from(blocks.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([blockIndex, candles]) => ({
      blockIndex,
      candles,
      complete: candles.every((c) => c !== null),
    }));
}

// Computes trades for a single day's worth of 5-minute blocks for one option
// leg. Returns an array of trade records (empty entries are simply omitted).
function computeTradesForDay(oneMinCandles, meta) {
  const blocks = groupIntoFiveMinuteBlocks(oneMinCandles);
  const trades = [];

  for (let i = 1; i < blocks.length; i++) {
    const prev = blocks[i - 1];
    const curr = blocks[i];

    if (curr.blockIndex !== prev.blockIndex + 1) {
      continue; // a whole block was missing entirely - prev isn't really adjacent
    }
    if (!prev.complete || !curr.complete) {
      continue; // missing minute data - skip rather than guess
    }

    const lastOpen = prev.candles[0].open;
    const lastClose = prev.candles[4].close;
    const lastDir = direction(lastOpen, lastClose);

    const firstMin = curr.candles[0];
    const firstDir = direction(firstMin.open, firstMin.close);

    if (lastDir === 0 || firstDir === 0) {
      continue; // doji on either reference candle - no clear signal
    }

    const tradeDir = firstDir !== lastDir ? lastDir : -lastDir;
    const entryPrice = curr.candles[1].open;
    const exitPrice = curr.candles[4].open;
    const pnlPerUnit = tradeDir * (exitPrice - entryPrice);

    trades.push({
      ...meta,
      blockIndex: curr.blockIndex,
      blockStart: curr.candles[0].date,
      lastDir,
      firstDir,
      tradeDir: tradeDir === 1 ? "LONG" : "SHORT",
      entryTime: curr.candles[1].date,
      entryPrice,
      exitTime: curr.candles[4].date,
      exitPrice,
      pnlPerUnit,
    });
  }

  return trades;
}

module.exports = { direction, groupIntoFiveMinuteBlocks, computeTradesForDay };
