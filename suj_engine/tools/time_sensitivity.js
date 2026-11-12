#!/usr/bin/env node
/*
 * SUJ engine, birth time stability scan (fifth instruction round).
 *
 * The D1 ascendant can change within one or two minutes. This tool scans the birth time plus and minus a
 * window (default 6 minutes, owner's instruction) in small steps, using Vednetra for every chart, and reports
 *
 *   1. the D1 ascendant sign at every step and where it changes,
 *   2. the candidate ascendants, each with its time range inside the window and a run time to feed to
 *      stellium.js and planet_strength.js,
 *   3. notes on divisional ascendants (D3, D7, D9, D10, D12, D24, D30), the Moon nakshatra pada and the running
 *      Mahadasha, Antardasha and Pratyantardasha at the as-of date,
 *   4. a verdict: STABLE (one D1 ascendant in the whole window) or UNSTABLE (more than one).
 *
 * UNSTABLE means the engine must run the full analysis for every candidate ascendant and give more than one
 * answer. The primary answer is the candidate that holds the given birth time. The others follow in order of
 * distance in time from the given birth time.
 *
 * Usage:
 *   node suj_engine/tools/time_sensitivity.js '{"date":"YYYY-MM-DD","time":"HH:MM:SS","tz":5.5,"lat":0,"lon":0}'
 * Optional config: windowMinutes (default 6), stepSeconds (default 30), asOf (YYYY-MM-DD), splitVargas
 * (array of division numbers, for example [9], which also splits candidates by that divisional ascendant),
 * name, gender, place, appDir.   Add --json for structured output.
 */
const fs = require("fs");
const { loadVedicCore } = require("./vednetra_loader");

const SIGN_NAMES = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const NOTE_VARGAS = [3, 7, 9, 10, 12, 24, 30];

function pad(n) { return String(n).padStart(2, "0"); }
function parseLocal(date, time) {
  const t = String(time).length === 5 ? time + ":00" : String(time);
  const d = date.split("-").map(Number), h = t.split(":").map(Number);
  return Date.UTC(d[0], d[1] - 1, d[2], h[0], h[1], h[2] || 0);
}
// A "local clock" instant is stored as a UTC millisecond count so that no zone conversion is applied twice.
function fmtClock(ms) {
  const d = new Date(ms);
  return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()) + "T" + pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes()) + ":" + pad(d.getUTCSeconds());
}
function fmtHms(ms) { return fmtClock(ms).slice(11); }

function run(cfg, VC) {
  VC = VC || loadVedicCore(cfg.appDir);
  const windowMin = cfg.windowMinutes != null ? Number(cfg.windowMinutes) : 6;
  const stepSec = cfg.stepSeconds != null ? Number(cfg.stepSeconds) : 30;
  const split = (cfg.splitVargas || []).map(Number);
  const asOf = cfg.asOf ? new Date(cfg.asOf + "T12:00:00Z") : new Date();
  const centre = parseLocal(cfg.date, cfg.time);
  const steps = [];

  for (let off = -windowMin * 60; off <= windowMin * 60; off += stepSec) {
    const clock = centre + off * 1000;
    const built = VC.avEngineFor({
      name: cfg.name || "Native", gender: cfg.gender || "unspecified",
      birthISO: fmtClock(clock), tz: Number(cfg.tz), lat: Number(cfg.lat), lon: Number(cfg.lon), place: cfg.place || ""
    });
    const chart = built.chart, lon = chart.ascendant.lon;
    const vargas = {};
    NOTE_VARGAS.forEach(n => { vargas[n] = VC.vargaSign(lon, n); });
    const moon = chart.planetsByName.Moon;
    const stack = VC.findDashaStack(chart.vimshottari.timeline, asOf).slice(0, 3).map(p => ({ lord: p.lord, start: p.start.toISOString().slice(0, 10), end: p.end.toISOString().slice(0, 10) }));
    steps.push({
      offsetSec: off, clock, asc: chart.ascendant.sign, ascDeg: Number(chart.ascendant.deg.toFixed(2)),
      vargas, moonNak: moon.nakshatra + " " + moon.pada, stack
    });
  }

  // Candidates: contiguous runs with the same D1 ascendant (and the same split divisional ascendants).
  const keyOf = s => [s.asc].concat(split.map(n => s.vargas[n])).join("|");
  const runs = [];
  steps.forEach(s => {
    const last = runs[runs.length - 1];
    if (last && last.key === keyOf(s)) last.steps.push(s); else runs.push({ key: keyOf(s), steps: [s] });
  });
  const candidates = runs.map(r => {
    const first = r.steps[0], lastS = r.steps[r.steps.length - 1];
    const holdsGiven = r.steps.some(s => s.offsetSec === 0);
    const nearest = r.steps.reduce((a, b) => Math.abs(a.offsetSec) <= Math.abs(b.offsetSec) ? a : b);
    const mid = r.steps[Math.floor(r.steps.length / 2)];
    const run = holdsGiven ? centre : mid.clock;
    return {
      ascendant: SIGN_NAMES[first.asc], ascSign: first.asc,
      splitVargas: split.map(n => ({ division: n, sign: SIGN_NAMES[first.vargas[n]] })),
      from: fmtHms(first.clock), to: fmtHms(lastS.clock), holdsGivenTime: holdsGiven,
      distanceFromGivenSec: Math.abs(nearest.offsetSec),
      runTime: fmtHms(run), runDate: fmtClock(run).slice(0, 10),
      dashaAtAsOf: first.stack.map(p => p.lord).join(" "),
      moonNakshatra: first.moonNak
    };
  });
  // Primary first, then by distance from the given birth time.
  candidates.sort((a, b) => (b.holdsGivenTime - a.holdsGivenTime) || (a.distanceFromGivenSec - b.distanceFromGivenSec));
  candidates.forEach((c, i) => { c.rank = i + 1; });

  // Notes on divisional ascendants and dasha stability.
  const notes = [];
  NOTE_VARGAS.forEach(n => {
    const signs = Array.from(new Set(steps.map(s => s.vargas[n])));
    if (signs.length > 1) notes.push("D" + n + " ascendant changes inside the window: " + signs.map(x => SIGN_NAMES[x]).join(", "));
  });
  const naks = Array.from(new Set(steps.map(s => s.moonNak)));
  if (naks.length > 1) notes.push("Moon nakshatra pada changes inside the window: " + naks.join(", "));
  const stacks = Array.from(new Set(steps.map(s => s.stack.map(p => p.lord).join(" "))));
  if (stacks.length > 1) notes.push("Running dasha stack at the as-of date changes inside the window: " + stacks.join(" | "));
  const given = steps.find(s => s.offsetSec === 0);
  const d1Changes = new Set(steps.map(s => s.asc)).size > 1;
  const verdict = (runs.length > 1) ? "UNSTABLE" : "STABLE";
  return {
    verdict, windowMinutes: windowMin, stepSeconds: stepSec, givenTime: cfg.date + "T" + fmtHms(centre),
    givenAscendant: SIGN_NAMES[given.asc] + " " + given.ascDeg, d1AscendantChanges: d1Changes,
    candidates, notes, asOf: asOf.toISOString().slice(0, 10)
  };
}

function render(r) {
  const out = [];
  out.push("# SUJ BIRTH TIME STABILITY for the given time " + r.givenTime);
  out.push("Window plus and minus " + r.windowMinutes + " minutes in steps of " + r.stepSeconds + " seconds. As of " + r.asOf + ". Ascendant at the given time " + r.givenAscendant + " degrees.");
  out.push("");
  out.push("BIRTH TIME STABILITY " + r.verdict);
  if (r.verdict === "UNSTABLE") {
    out.push("The D1 ascendant changes inside the window. Run the full analysis for every candidate below and give one answer per candidate. The first candidate is the primary answer.");
  } else {
    out.push("One D1 ascendant holds for the whole window. One answer is enough.");
  }
  out.push("");
  out.push("## Candidates, primary first");
  r.candidates.forEach(c => {
    out.push(c.rank + ". " + c.ascendant + " from " + c.from + " to " + c.to + (c.holdsGivenTime ? ", holds the given time" : ", " + c.distanceFromGivenSec + " seconds from the given time")
      + (c.splitVargas.length ? ", " + c.splitVargas.map(x => "D" + x.division + " " + x.sign).join(", ") : "")
      + ". Run time " + c.runDate + " " + c.runTime + ". Dasha at as of date " + c.dashaAtAsOf + ". Moon " + c.moonNakshatra + ".");
  });
  out.push("");
  out.push("## Notes");
  if (r.notes.length) r.notes.forEach(n => out.push("- " + n)); else out.push("- No divisional ascendant, Moon pada or dasha change inside the window.");
  out.push("");
  out.push("Feed each run time to stellium.js and planet_strength.js as the time field.");
  return out.join("\n");
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  let cfg = null;
  const fi = argv.indexOf("--file");
  if (fi >= 0) cfg = JSON.parse(fs.readFileSync(argv[fi + 1], "utf8"));
  else { const raw = argv.find(a => a.trim().startsWith("{")); if (raw) cfg = JSON.parse(raw); }
  if (!cfg || !cfg.date || !cfg.time || cfg.tz == null || cfg.lat == null || cfg.lon == null) {
    console.error("Usage: time_sensitivity.js '{\"date\":\"YYYY-MM-DD\",\"time\":\"HH:MM:SS\",\"tz\":5.5,\"lat\":28.6,\"lon\":77.2}' [--json]");
    process.exit(2);
  }
  const res = run(cfg);
  console.log(argv.indexOf("--json") >= 0 ? JSON.stringify(res, null, 2) : render(res));
}
module.exports = { run, render };
