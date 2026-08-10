// Instrument discovery helpers: NIFTY spot index token, and resolving the
// nearest ITM CE/PE weekly-option contract for a given spot price + date.

const NIFTY_INDEX_TRADINGSYMBOL = "NIFTY 50";
const NIFTY_OPTION_NAME = "NIFTY";

let nfoInstrumentsCache = null;
let nseInstrumentsCache = null;

async function getNfoInstruments(kite) {
  if (!nfoInstrumentsCache) {
    nfoInstrumentsCache = await kite.getInstruments("NFO");
  }
  return nfoInstrumentsCache;
}

async function getNseInstruments(kite) {
  if (!nseInstrumentsCache) {
    nseInstrumentsCache = await kite.getInstruments("NSE");
  }
  return nseInstrumentsCache;
}

async function getNiftySpotInstrument(kite) {
  const nse = await getNseInstruments(kite);
  const spot = nse.find(
    (i) => i.segment === "INDICES" && i.tradingsymbol === NIFTY_INDEX_TRADINGSYMBOL
  );
  if (!spot) {
    throw new Error(`Could not find ${NIFTY_INDEX_TRADINGSYMBOL} in NSE instruments dump`);
  }
  return spot;
}

// All weekly NIFTY option expiries currently present in the instruments dump,
// sorted ascending. Kite's dump typically only carries a handful of upcoming
// / very-recently-expired weekly contracts - older expiries will not appear
// here at all, which is the "expired contract" limitation flagged up front.
async function getAvailableNiftyOptionExpiries(kite) {
  const nfo = await getNfoInstruments(kite);
  const expiries = new Set(
    nfo
      .filter((i) => i.name === NIFTY_OPTION_NAME && (i.instrument_type === "CE" || i.instrument_type === "PE"))
      .map((i) => i.expiry)
  );
  return Array.from(expiries).sort();
}

// The weekly expiry that was "current" (nearest expiry on/after tradingDate)
// for a given trading day, restricted to expiries actually present in the dump.
function resolveExpiryForDate(availableExpiries, tradingDate) {
  const dateStr = tradingDate; // "YYYY-MM-DD"
  const candidates = availableExpiries.filter((e) => e >= dateStr);
  return candidates.length > 0 ? candidates[0] : null;
}

// Nearest ITM CE (highest strike below spot) and PE (lowest strike above spot)
// for the given expiry, restricted to what's actually listed.
async function findItmContracts(kite, expiry, spotPrice) {
  const nfo = await getNfoInstruments(kite);
  const contracts = nfo.filter((i) => i.name === NIFTY_OPTION_NAME && i.expiry === expiry);

  const ceCandidates = contracts
    .filter((i) => i.instrument_type === "CE" && i.strike < spotPrice)
    .sort((a, b) => b.strike - a.strike);
  const peCandidates = contracts
    .filter((i) => i.instrument_type === "PE" && i.strike > spotPrice)
    .sort((a, b) => a.strike - b.strike);

  const ce = ceCandidates[0] || null;
  const pe = peCandidates[0] || null;

  return { ce, pe };
}

function resetCache() {
  nfoInstrumentsCache = null;
  nseInstrumentsCache = null;
}

module.exports = {
  getNiftySpotInstrument,
  getAvailableNiftyOptionExpiries,
  resolveExpiryForDate,
  findItmContracts,
  resetCache,
};
