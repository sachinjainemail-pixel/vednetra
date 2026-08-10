// Historical data fetching helpers with basic rate-limit pacing and retry,
// since Kite's historical API is both rate-limited (~3 req/s) and capped in
// how wide a single from/to date range can be per request.

const MINUTE_CHUNK_DAYS = 55; // stay comfortably under Kite's ~60-day minute-candle window
const REQUEST_DELAY_MS = 350;
const MAX_RETRIES = 3;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toDateOnly(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return toDateOnly(d);
}

function chunkDateRange(fromDate, toDate, chunkDays) {
  const chunks = [];
  let cursor = fromDate;
  while (cursor <= toDate) {
    const chunkEnd = addDays(cursor, chunkDays);
    chunks.push([cursor, chunkEnd > toDate ? toDate : chunkEnd]);
    cursor = addDays(chunkEnd > toDate ? toDate : chunkEnd, 1);
  }
  return chunks;
}

async function fetchWithRetry(kite, instrumentToken, interval, from, to) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const candles = await kite.getHistoricalData(instrumentToken, interval, from, to, false, 0);
      return candles;
    } catch (err) {
      lastErr = err;
      const backoff = REQUEST_DELAY_MS * attempt * 2;
      await sleep(backoff);
    }
  }
  throw lastErr;
}

async function fetchCandles(kite, instrumentToken, interval, fromDate, toDate) {
  const chunkDays = interval === "minute" ? MINUTE_CHUNK_DAYS : 365;
  const chunks = chunkDateRange(fromDate, toDate, chunkDays);
  const all = [];

  for (const [from, to] of chunks) {
    await sleep(REQUEST_DELAY_MS);
    const candles = await fetchWithRetry(kite, instrumentToken, interval, from, to);
    all.push(...candles);
  }

  all.sort((a, b) => new Date(a.date) - new Date(b.date));
  return all;
}

module.exports = { fetchCandles, addDays, toDateOnly, sleep };
