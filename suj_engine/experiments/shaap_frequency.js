#!/usr/bin/env node
/*
 * How often does each shaap status appear in random charts, round 23. Seeded per chart, so the numbers reproduce.
 *   node suj_engine/experiments/shaap_frequency.js 300
 * The ephemeris cache of app.js stops a long run (Map maximum size), so the work is split into child processes of 40 charts each.
 * Writes suj_engine/data/shaap_frequency.json. This is a calibration of the rule set, not evidence about any native. It answers one
 * question, how selective is a FORMED status, so that nobody reads it as rare.
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const pad = n => String(n).padStart(2, "0");
const mk = seed0 => { let seed = seed0; return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };

if (process.argv[2] === "--chunk") {
  const { scan, TYPES } = require("../tools/shaap_scan");
  const start = Number(process.argv[3]), n = Number(process.argv[4]);
  const nodeAspects = process.argv[5] || "7";
  const raw = { n: 0, anyFormed: 0, anyFull: 0, anyFullActive: 0, ss: 0, ssFull: 0, types: {} };
  TYPES.forEach(id => { raw.types[id] = { d1Formed: 0, d1Indication: 0, formedFull: 0, formedHalf: 0, d9Only: 0, formedActiveNow: 0 }; });
  for (let i = start; i < start + n; i++) {
    const rnd = mk(20261115 + i * 7919);
    const y = 1950 + Math.floor(rnd() * 56), m = 1 + Math.floor(rnd() * 12), d = 1 + Math.floor(rnd() * 28);
    const cfg = { gender: "female", date: y + "-" + pad(m) + "-" + pad(d), time: pad(Math.floor(rnd() * 24)) + ":" + pad(Math.floor(rnd() * 60)) + ":00", tz: 5.5, lat: 8 + rnd() * 27, lon: 70 + rnd() * 20, asOf: "2026-11-15", nodeAspects };
    const r = scan(cfg);
    let f = false, full = false, fullActive = false;
    TYPES.forEach(id => {
      const t = r.types[id], c = raw.types[id];
      if (t.d1.status === "FORMED") { c.d1Formed++; f = true; if (/ACTIVE|STRONG/.test(t.dasha.now)) c.formedActiveNow++; }
      else if (t.d1.status === "INDICATION") c.d1Indication++;
      if (t.combined === "FORMED FULL") { c.formedFull++; full = true; if (/ACTIVE|STRONG/.test(t.dasha.now)) fullActive = true; }
      if (t.combined === "FORMED HALF") c.formedHalf++;
      if (/^D9 ONLY/.test(t.combined)) c.d9Only++;
    });
    if (f) raw.anyFormed++; if (full) raw.anyFull++; if (fullActive) raw.anyFullActive++;
    if (r.shapitShani.present) { raw.ss++; if (r.shapitShani.d9Repeated) raw.ssFull++; }
    raw.n++;
  }
  process.stdout.write(JSON.stringify(raw));
} else {
  const N = Number(process.argv[2] || 300), nodeAspects = process.argv[3] || "7", CH = 40;
  const TYPES = require("../tools/shaap_scan").TYPES;
  const agg = { n: 0, anyFormed: 0, anyFull: 0, anyFullActive: 0, ss: 0, ssFull: 0, types: {} };
  TYPES.forEach(id => { agg.types[id] = { d1Formed: 0, d1Indication: 0, formedFull: 0, formedHalf: 0, d9Only: 0, formedActiveNow: 0 }; });
  for (let s = 0; s < N; s += CH) {
    const raw = JSON.parse(execFileSync("node", [__filename, "--chunk", String(s), String(Math.min(CH, N - s)), nodeAspects], { encoding: "utf8", maxBuffer: 1 << 26 }));
    agg.n += raw.n; ["anyFormed", "anyFull", "anyFullActive", "ss", "ssFull"].forEach(k => { agg[k] += raw[k]; });
    TYPES.forEach(id => Object.keys(agg.types[id]).forEach(k => { agg.types[id][k] += raw.types[id][k]; }));
    console.error(agg.n + " charts");
  }
  const pct = x => Math.round(1000 * x / agg.n) / 10;
  const out = { _note: "Share of random charts, in percent. Seeded sample of " + agg.n + " births 1950 to 2005, India, as of 2026-11-15, shaap_scan.js version 1.0, node aspects " + (nodeAspects === "vednetra" ? "5th 7th 9th" : "7th only") + ". A calibration of the rules, not evidence about a native. d1Formed is the D1 status FORMED, formedFull needs D9 to repeat, formedAndActiveNow is D1 FORMED with the Mahadasha or Antardasha lord in the evidence.", n: agg.n, nodeAspects, anyTypeFormedD1: pct(agg.anyFormed), anyTypeFormedFull: pct(agg.anyFull), anyTypeFormedFullAndActiveNow: pct(agg.anyFullActive), shapitShaniPresent: pct(agg.ss), shapitShaniWithD9Repeat: pct(agg.ssFull), types: {} };
  TYPES.forEach(id => { const c = agg.types[id]; out.types[id] = { d1Formed: pct(c.d1Formed), d1Indication: pct(c.d1Indication), formedFull: pct(c.formedFull), formedHalf: pct(c.formedHalf), d9Only: pct(c.d9Only), formedAndActiveNow: pct(c.formedActiveNow) }; });
  const file = nodeAspects === "vednetra" ? "shaap_frequency_vednetra_nodes.json" : "shaap_frequency.json";
  fs.writeFileSync(path.join(__dirname, "..", "data", file), JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1));
}
