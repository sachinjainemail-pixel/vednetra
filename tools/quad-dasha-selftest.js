#!/usr/bin/env node
/*
 * QUAD DASHA self-test and validation printout.
 *
 * Run this before trusting a quaddasha reading:
 *     node tools/quad-dasha-selftest.js
 *
 * It does two things.
 *
 * 1. Runs the eight assertions in quad-dasha.js. These are the same eight the
 *    project's Python engine `quad_dasha.py` carries, and they are checked
 *    against longitudes the PYTHON engine produced for the two validation
 *    charts, so they test the dasha arithmetic independently of either
 *    ephemeris. Exit code 1 if any fails.
 *
 * 2. Prints the four running periods at a named date for each validation
 *    chart, cast through VedNetra's OWN ephemeris, next to what the Python
 *    engine gives. The two casters differ by 1.4-3.5 arcminutes on the Moon,
 *    which is 2.6-6.3 minutes of equivalent birth time and up to ~18 months of
 *    Kaal Chakra drift -- enough, on Indira Gandhi's chart, to change which
 *    KCD dasha is running at her death. That is not a bug in either engine; it
 *    is why the report's stability gate exists and why a KCD row that shifts
 *    at +-5 min is withdrawn rather than softened.
 */
const path = require("path");
const fs = require("fs");

// --- stub browser globals, same set as run-nobrowser.js ---------------------
const noop = () => {};
const el = () => new Proxy({}, {
  get: (t, k) => k === "style" ? {}
    : k === "classList" ? { add: noop, remove: noop, toggle: noop, contains: () => false }
    : k === "children" ? [] : k === "dataset" ? {}
    : (k === "value" || k === "textContent" || k === "innerHTML") ? ""
    : (t[k] !== undefined ? t[k] : noop),
  set: (t, k, v) => (t[k] = v, true)
});
const doc = {
  documentElement: el(), body: el(), head: el(), readyState: "complete", cookie: "",
  getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
  createElement: el, createTextNode: el, addEventListener: noop, removeEventListener: noop
};
const store = {};
function put(name, value) {
  try { global[name] = value; }
  catch (e) { try { Object.defineProperty(global, name, { value, configurable: true, writable: true }); } catch (_) {} }
}
Object.entries({
  document: doc,
  navigator: { userAgent: "node", language: "en" },
  location: { href: "file:///", search: "", hash: "", pathname: "/" },
  localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; }, clear: () => {} },
  requestAnimationFrame: cb => setTimeout(cb, 0),
  requestIdleCallback: cb => setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 0 }), 0),
  matchMedia: () => ({ matches: false, addEventListener: noop, addListener: noop }),
  getComputedStyle: () => ({ getPropertyValue: () => "" }),
  Element: function () {}, HTMLElement: function () {}, Node: function () {}
}).forEach(kv => put(kv[0], kv[1]));
put("sessionStorage", global.localStorage);
global.window = globalThis;
Object.assign(global.window, { document: doc, addEventListener: noop, removeEventListener: noop, innerWidth: 1280, innerHeight: 900, devicePixelRatio: 1 });

const appDir = path.join(__dirname, "..");
["trinetra-rules.js", "quad-dasha.js", "app.js"].forEach(f => {
  const p = path.join(appDir, f);
  if (fs.existsSync(p)) require(p);
});

const QD = globalThis.VNQuadDasha;
const VC = globalThis.VedicCore;
if (!QD || !QD.selftest) { console.error("quad-dasha.js did not load."); process.exit(1); }

// --- 1. the eight assertions ------------------------------------------------
const st = QD.selftest();
console.log("QUAD DASHA SELF-TEST");
st.rows.forEach(r => console.log("  " + (r[1] ? "[PASS]" : "[FAIL]") + " " + r[0]));
console.log("  " + st.pass + "/" + st.total + " passed");
console.log("");

// --- 2. the four running periods, VedNetra ephemeris vs the Python engine ---
// `python` is what quad_dasha.py reports for the same chart and date.
const CASES = [
  {
    name: "Indira Gandhi", birthISO: "1917-11-19T23:11:01", tz: 5.5, lat: 25.45, lon: 81.85,
    at: "1984-10-31", label: "her death",
    python: { vimMD: "Sa", vimAD: "Ra", kcd: "Cp", chara: "Le", yogini: "Sankata" }
  },
  {
    name: "Queen Elizabeth II", birthISO: "1926-04-21T02:48:40", tz: 1.0, lat: 51.72, lon: -0.30,
    at: "1952-02-06", label: "her accession",
    python: null
  }
];

let drift = false;
for (const c of CASES) {
  const built = VC.avEngineFor({
    name: c.name, birthISO: c.birthISO, tz: c.tz, lat: c.lat, lon: c.lon,
    asOfISO: c.at + "T12:00:00Z"
  });
  const birth = built.chart.date;
  const age = (new Date(c.at + "T12:00:00Z").getTime() - birth.getTime()) / (365.25 * 86400000);
  const run = QD.runningAt(built.chart, QD.extract(built.chart), age);
  const stb = QD.stability(built.chart, built.input, age);
  console.log(c.name + " at " + c.at + " (" + c.label + "), age " + age.toFixed(2));
  console.log("  VedNetra ephemeris : Vim " + run.vimMD + "-" + run.vimAD +
              " | KCD " + run.kcd + (run.kcdGati ? " [" + run.kcdGati + "]" : "") +
              " | Chara " + run.chara + " | Yogini " + run.yogini);
  if (c.python) {
    console.log("  quad_dasha.py      : Vim " + c.python.vimMD + "-" + c.python.vimAD +
                " | KCD " + c.python.kcd + " | Chara " + c.python.chara + " | Yogini " + c.python.yogini);
    const diff = Object.keys(c.python).filter(k => c.python[k] !== run[k]);
    if (diff.length) {
      drift = true;
      console.log("  DIVERGE            : " + diff.join(", ") +
                  "  <-- the ephemeris delta, not a logic difference; see the header");
    } else {
      console.log("  agreement          : all four systems identical");
    }
  }
  if (stb) {
    console.log("  stability (+-5min) : " +
      ["vimMD", "vimAD", "kcd", "chara", "yogini"]
        .map(k => k + "=" + (stb.res[k][5] ? "stable" : "SHIFTS")).join(" "));
  }
  console.log("");
}

if (drift) {
  console.log("Where a boundary matters, cross-check quad_dasha.py. The stability row is the");
  console.log("governing fact: a system that shifts inside the plausible birth-time error is");
  console.log("withdrawn, not softened.");
}
process.exit(st.pass === st.total ? 0 : 1);
