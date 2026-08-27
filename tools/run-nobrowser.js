#!/usr/bin/env node
/*
 * VedNetra report runner that needs NO browser.
 *
 * The Playwright runner drives the real app in Chromium, which is the most
 * faithful path but fails outright where a browser cannot be installed. The
 * master reports are pure string builders over the computed chart, so they do
 * not need a page — this runner loads app.js behind a handful of stub browser
 * globals and calls the builder directly. Output is byte-identical to the
 * Chromium path for the same inputs.
 *
 * Usage:
 *   node run-nobrowser.js '<json-config>'
 *   node run-nobrowser.js --file <config.json>
 *
 * Config: name, gender, date (YYYY-MM-DD), time (HH:MM[:SS]), tz (hours),
 *         lat, lon, place, question, report, outFile, appDir
 *
 * `date`/`time` are LOCAL clock time at the birth place; `tz` converts them.
 * `report` is one of: avengine (default), intakeform, dayevent, consolidated,
 *         triveni, trinetra, kp, vapm, vapmnak, native, cc
 * `eventDate` (YYYY-MM-DD) + optional `eventTime` aim the day engine at one day,
 *         for "what happened on <date>" questions. Use with report "dayevent".
 */
const fs = require("fs");
const path = require("path");

const argv = process.argv.slice(2);
let cfg;
const fi = argv.indexOf("--file");
try {
  cfg = fi >= 0 ? JSON.parse(fs.readFileSync(argv[fi + 1], "utf8"))
                : JSON.parse(argv.find(a => !a.startsWith("--")) || "{}");
} catch (e) { console.error("Bad config:", e.message); process.exit(2); }

for (const k of ["date", "time", "tz", "lat", "lon"]) {
  if (cfg[k] === undefined || cfg[k] === null || cfg[k] === "") {
    console.error("Missing required config field: " + k); process.exit(2);
  }
}

// ---- the stub browser globals app.js touches while loading -----------------
const noop = () => {};
const el = () => new Proxy({}, {
  get: (t, k) => k === "style" ? {}
    : k === "classList" ? { add: noop, remove: noop, toggle: noop, contains: () => false }
    : k === "children" ? [] : k === "dataset" ? {}
    : k === "value" || k === "textContent" || k === "innerHTML" ? ""
    : (t[k] !== undefined ? t[k] : noop),
  set: (t, k, v) => (t[k] = v, true)
});
const doc = {
  documentElement: el(), body: el(), head: el(), readyState: "complete", cookie: "",
  getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
  createElement: el, createTextNode: el, addEventListener: noop, removeEventListener: noop
};
const store = {};
// Node 22 defines some of these (navigator) as getter-only globals, so each is
// installed defensively rather than by a blanket Object.assign.
function put(name, value) {
  try { global[name] = value; }
  catch (e) { try { Object.defineProperty(global, name, { value: value, configurable: true, writable: true }); } catch (_) {} }
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
}).forEach(function (kv) { put(kv[0], kv[1]); });
put("sessionStorage", global.localStorage);
global.window = globalThis;
Object.assign(global.window, { document: doc, addEventListener: noop, removeEventListener: noop, innerWidth: 1280, innerHeight: 900, devicePixelRatio: 1 });

// ---- load the app ----------------------------------------------------------
const appDir = cfg.appDir
  ? path.resolve(cfg.appDir)
  : [path.join(__dirname, "..", "assets", "vednetra"), path.join(__dirname, "..")]
      .find(d => fs.existsSync(path.join(d, "app.js")));
if (!appDir) { console.error("Could not locate app.js — pass appDir."); process.exit(1); }

for (const f of ["trinetra-rules.js", "app.js"]) {
  const p = path.join(appDir, f);
  if (!fs.existsSync(p)) continue;
  try { require(p); }
  catch (e) { console.error(`Failed loading ${f}: ${e.message}`); process.exit(1); }
}
const VC = globalThis.VedicCore || (global.window && global.window.VedicCore);
if (!VC || !VC.reportFor) {
  console.error("VedicCore.reportFor missing — needs VedNetra v1.118+.");
  process.exit(1);
}

// ---- build ----------------------------------------------------------------
const t = String(cfg.time).length === 5 ? cfg.time + ":00" : cfg.time;
const spec = {
  name: cfg.name || "Native", gender: cfg.gender || "unspecified",
  birthISO: `${cfg.date}T${t}`, tz: Number(cfg.tz),
  lat: Number(cfg.lat), lon: Number(cfg.lon), place: cfg.place || "",
  question: cfg.question || "", asOfISO: cfg.enquiryISO || undefined,
  eventDate: cfg.eventDate || undefined, eventTime: cfg.eventTime || undefined
};
let md;
try { md = VC.reportFor(spec, cfg.report || "avengine").markdown; }
catch (e) { console.error("Report failed:", e.message); process.exit(1); }

const out = cfg.outFile || path.resolve(process.cwd(), "report_out.md");
fs.writeFileSync(out, md, "utf8");
process.stdout.write(md + "\n");
process.stderr.write(`\n[no-browser run] ${cfg.report || "avengine"} → ${out}\n`);
