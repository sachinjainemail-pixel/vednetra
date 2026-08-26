#!/usr/bin/env node
/*
 * Ashtakvarga Engine — TIMING backtest harness.
 *
 * Measures whether the engine's dated window actually lands on events that
 * really happened. Without this every weighting change is guesswork, so this
 * is the instrument the timing lane is tuned against.
 *
 * Usage:
 *   node tools/av-timing-backtest.js cases/events.json [--app <index.html>] [--json out.json]
 *
 * Case file: an array of natives, each with dated known events.
 *   [
 *     { "name":"A", "birthISO":"1991-12-01T01:15:00", "tz":5.5,
 *       "lat":28.9931, "lon":77.0151, "place":"Sonipat",
 *       "events":[ {"question":"When will my marriage happen?","date":"2019-02-11"} ] }
 *   ]
 * birthISO is LOCAL clock time at the birth place; tz converts it.
 *
 * The judgment date must NOT be derived from the answer. Setting it to a fixed
 * offset before each event (say a year) looks innocent but leaks: the engine
 * quotes the soonest converged window, so anchoring the question a year out
 * makes "soonest" land near the truth by construction, and the harness reports
 * skill the engine has not got. The judgment date therefore defaults to the
 * native's 18th birthday — one fixed point per native, identical for all their
 * events — so nothing about the answer reaches the question.
 *   --asof age:<n>     judge from the native's nth birthday (default 18)
 *   --asof <ISO date>  judge every case from one calendar date
 *
 * Reported metrics:
 *   hit@window  — the true date fell inside the quoted window
 *   hit@±6mo / ±12mo — the true date within that tolerance of the window
 *   median |error| — months from the window's centre to the true date
 *   BASELINE    — a window of identical width swept uniformly over the range
 *                 the engine could have picked from. Skill is the margin over
 *                 it: a wide window hits often by luck.
 *   SOONEST     — the same width placed immediately after the judgment date,
 *                 i.e. "the next thing that comes along". Beating uniform but
 *                 not SOONEST means the instruments are contributing nothing
 *                 the calendar did not already supply.
 */
const fs = require("fs");
const path = require("path");

function loadChromium() {
  for (const c of ["playwright", "/opt/node22/lib/node_modules/playwright",
                   "/usr/lib/node_modules/playwright", "/usr/local/lib/node_modules/playwright"]) {
    try { return require(c).chromium; } catch (e) {}
  }
  throw new Error("Playwright not found. `npm i -g playwright`.");
}

const args = process.argv.slice(2);
const caseFile = args.find(a => !a.startsWith("--"));
function flag(n, d) { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; }
if (!caseFile) { console.error("usage: av-timing-backtest.js <cases.json> [--app index.html] [--json out.json]"); process.exit(2); }

const appPath = path.resolve(flag("--app", path.join(__dirname, "..", "index.html")));
const cases = JSON.parse(fs.readFileSync(caseFile, "utf8"));
const MONTH = 30.44 * 86400000;
const ASOF = flag("--asof", "age:18");
// One judgment date per native, fixed and independent of any event date.
function judgmentDate(nat) {
  if (!/^age:/.test(ASOF)) return new Date(ASOF).toISOString();
  const yrs = parseFloat(ASOF.slice(4)) || 18;
  return new Date(Date.parse(nat.birthISO) + yrs * 365.25 * 86400000).toISOString();
}

// Parse the engine's quoted window out of the report markdown.
function parseWindow(md) {
  const m = md.match(/> \*\*The window:\*\* (\d{4}-\d{2}-\d{2}) – (\d{4}-\d{2}-\d{2})/);
  const c = md.match(/convergence (\d)\/3/);
  const s = md.match(/\*\*SUPPORT (\d)\/(\d)\*\*/);
  const v = md.match(/VERDICT ([\d.]+) ?%/);
  const span = md.match(/life span (\d{4})–(\d{4})/);
  if (!m) return { datable: false, converge: c ? +c[1] : 0, support: s ? +s[1] : 0, verdict: v ? +v[1] : null };
  return {
    datable: true,
    start: Date.parse(m[1]), end: Date.parse(m[2]),
    converge: c ? +c[1] : 0, support: s ? +s[1] : 0, verdict: v ? +v[1] : null,
    scanFrom: span ? Date.parse(span[1] + "-01-01") : null,
    scanTo: span ? Date.parse(span[2] + "-01-01") : null
  };
}

function score(win, trueMs) {
  const width = win.end - win.start, mid = (win.start + win.end) / 2;
  const inside = trueMs >= win.start && trueMs <= win.end;
  const gap = inside ? 0 : Math.min(Math.abs(trueMs - win.start), Math.abs(trueMs - win.end));
  return { inside, gapMonths: gap / MONTH, errMonths: Math.abs(trueMs - mid) / MONTH, widthMonths: width / MONTH };
}

// A same-width window dropped at random in the range the engine could
// actually have chosen from: what it must beat to be carrying information
// rather than covering ground.
//
// The null model has to be offered the SAME choice as the engine. The engine
// only ever quotes a future window, so a baseline sampling the native's whole
// life is scored against dates it was never eligible to pick and reports
// flattering nonsense. It is therefore swept over [asOf, scanTo] only.
function baseline(win, trueMs, asOfMs, trials = 4000) {
  if (!win.scanTo) return null;
  const from = Math.max(asOfMs, win.scanFrom || asOfMs);
  const width = win.end - win.start;
  const span = (win.scanTo - from) - width;
  if (span <= 0) return null;
  let inside = 0, w6 = 0, w12 = 0;
  // deterministic sweep rather than RNG, so the number is reproducible
  for (let i = 0; i < trials; i++) {
    const s = from + (span * i) / trials, e = s + width;
    if (trueMs >= s && trueMs <= e) inside++;
    const gap = (trueMs >= s && trueMs <= e) ? 0 : Math.min(Math.abs(trueMs - s), Math.abs(trueMs - e));
    if (gap <= 6 * MONTH) w6++;
    if (gap <= 12 * MONTH) w12++;
  }
  return { inside: inside / trials, w6: w6 / trials, w12: w12 / trials };
}

// The trivial strategy: same width, placed immediately after judgment.
function soonest(win, trueMs, asOfMs) {
  const width = win.end - win.start, s = asOfMs, e = s + width;
  const gap = (trueMs >= s && trueMs <= e) ? 0 : Math.min(Math.abs(trueMs - s), Math.abs(trueMs - e));
  return { inside: trueMs >= s && trueMs <= e ? 1 : 0, w6: gap <= 6 * MONTH ? 1 : 0, w12: gap <= 12 * MONTH ? 1 : 0 };
}

function median(xs) {
  if (!xs.length) return null;
  const a = xs.slice().sort((x, y) => x - y), h = a.length >> 1;
  return a.length % 2 ? a[h] : (a[h - 1] + a[h]) / 2;
}
const pct = x => (x * 100).toFixed(1) + "%";

(async () => {
  const chromium = loadChromium();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const pageErrs = [];
  page.on("pageerror", e => pageErrs.push(String(e).slice(0, 200)));
  await page.goto("file://" + appPath, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const ok = await page.evaluate(() => !!(window.VedicCore && window.VedicCore.avEngineFor));
  if (!ok) { console.error("VedicCore.avEngineFor missing — needs VedNetra v1.118+."); await browser.close(); process.exit(1); }

  const rows = [];
  for (const nat of cases) {
    for (const ev of nat.events || []) {
      const trueMs = Date.parse(ev.date);
      const asOf = judgmentDate(nat);
      let md;
      try {
        md = (await page.evaluate(s => window.VedicCore.avEngineFor(s).markdown, {
          name: nat.name, gender: nat.gender, birthISO: nat.birthISO, tz: nat.tz,
          lat: nat.lat, lon: nat.lon, place: nat.place, question: ev.question, asOfISO: asOf
        })).toString();
      } catch (e) { rows.push({ nat: nat.name, ev: ev.question, error: String(e).slice(0, 120) }); continue; }
      const win = parseWindow(md);
      const row = { nat: nat.name, ev: ev.question, date: ev.date, ...win };
      if (win.datable) { Object.assign(row, score(win, trueMs)); row.base = baseline(win, trueMs, Date.parse(asOf)); row.soon = soonest(win, trueMs, Date.parse(asOf)); }
      rows.push(row);
      process.stderr.write(".");
    }
  }
  process.stderr.write("\n");
  await browser.close();

  const scored = rows.filter(r => r.datable && !r.error);
  const n = scored.length, N = rows.length;
  const hit = scored.filter(r => r.inside).length;
  const h6 = scored.filter(r => r.gapMonths <= 6).length;
  const h12 = scored.filter(r => r.gapMonths <= 12).length;
  const bIn = scored.map(r => r.base && r.base.inside).filter(x => x != null);
  const b6 = scored.map(r => r.base && r.base.w6).filter(x => x != null);
  const b12 = scored.map(r => r.base && r.base.w12).filter(x => x != null);
  const sIn = scored.map(r => r.soon && r.soon.inside).filter(x => x != null);
  const s6 = scored.map(r => r.soon && r.soon.w6).filter(x => x != null);
  const s12 = scored.map(r => r.soon && r.soon.w12).filter(x => x != null);
  const avg = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;

  console.log("\n=== AV TIMING BACKTEST ===");
  console.log(`cases: ${N}   datable: ${n} (${pct(n / N)})   undatable: ${N - n}`);
  if (!n) { console.log("nothing datable — cannot score."); process.exit(0); }
  console.log(`median window width : ${median(scored.map(r => r.widthMonths)).toFixed(1)} months`);
  console.log(`median |error|      : ${median(scored.map(r => r.errMonths)).toFixed(1)} months (window centre → true date)`);
  console.log("");
  console.log(`judged from: ${ASOF}  (fixed per native, independent of the event)`);
  console.log("");
  console.log("                     engine    uniform     skill    soonest");
  const line = (label, e, b, so) => console.log(`  ${label.padEnd(18)} ${pct(e).padStart(7)}  ${(b == null ? "—" : pct(b)).padStart(8)}  ${(b == null ? "—" : (e - b >= 0 ? "+" : "") + pct(e - b)).padStart(7)}   ${(so == null ? "—" : pct(so)).padStart(7)}`);
  line("hit @ window", hit / n, avg(bIn), avg(sIn));
  line("hit @ ±6 mo", h6 / n, avg(b6), avg(s6));
  line("hit @ ±12 mo", h12 / n, avg(b12), avg(s12));
  console.log("\n  skill = engine − uniform. At or below zero the window is covering ground");
  console.log("  rather than carrying information, however high the raw hit rate. If the");
  console.log("  engine does not also beat 'soonest', its instruments are adding nothing");
  console.log("  the calendar did not already supply.\n");

  // does convergence actually predict accuracy? if not, the grade is cosmetic
  console.log("by convergence:");
  [1, 2, 3].forEach(c => {
    const g = scored.filter(r => r.converge === c);
    if (!g.length) return console.log(`  ${c}/3 : (none)`);
    console.log(`  ${c}/3 : n=${String(g.length).padStart(3)}  hit@window ${pct(g.filter(r => r.inside).length / g.length).padStart(6)}  median |err| ${median(g.map(r => r.errMonths)).toFixed(1)} mo`);
  });
  if (pageErrs.length) console.log("\npage errors:", pageErrs.slice(0, 3));

  const out = flag("--json");
  if (out) { fs.writeFileSync(out, JSON.stringify(rows, null, 2)); console.log(`\nper-case detail → ${out}`); }
})().catch(e => { console.error("ERROR:", e && e.message ? e.message : e); process.exit(1); });
