#!/usr/bin/env node
/*
 * One time calibration of the hand scale of the Rule of 10, SARVA-R10-SCALE-1, section 13.3 of the Quad file.
 * The file defines a satisfied layer by the median of a typical chart, support at 1.1 and afflict at 0.6, so about half the layers are satisfied.
 * This script draws RANDOM charts, never a chart with a known answer, scores the layers of ordinary options and prints the median layer score of support and afflict
 * layers. The shifts it prints, the threshold minus the median, are written once into SCALE.supportShift and SCALE.afflictShift of quad_engine.js and never changed after a wrong leader.
 * Run: node sarva_engine/tools/quad_build/calibrate_scale.js [number of charts]
 */
const PL = require("../promise_layer.js"), QE = require("../quad_engine.js"), LEX = require("../sarva_lexicon.js");
const N = Number(process.argv[2] || 60);
let seed = Number(process.argv[3] || 20261118); const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const CITY = [[28.61, 77.21], [19.07, 72.88], [23.03, 72.58], [13.08, 80.27], [22.57, 88.36], [26.91, 75.79], [17.38, 78.48], [12.97, 77.59]];
const L = LEX.load();
const ENT = ["Gynecologist", "Pediatrician", "Dentist", "Private job", "Government job", "Own business", "Teacher", "Engineer", "Diabetes", "Asthma", "Orthopedic surgeon", "Cardiologist"];
const sup = [], aff = []; let sd = 0, ad = 0, cnt = { support: 0, afflict: 0 };
for (let i = 0; i < N; i++) {
  const y = 1940 + Math.floor(rnd() * 65), mo = 1 + Math.floor(rnd() * 12), d = 1 + Math.floor(rnd() * 28), hh = Math.floor(rnd() * 24), mm = Math.floor(rnd() * 60);
  const c = CITY[Math.floor(rnd() * CITY.length)];
  const ay = Math.min(2026, y + 8 + Math.floor(rnd() * 60));
  const cfg = { name: "R" + i, gender: rnd() < 0.5 ? "male" : "female", date: y + "-" + String(mo).padStart(2, "0") + "-" + String(d).padStart(2, "0"), time: String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0") + ":00", tz: 5.5, lat: c[0], lon: c[1], asOf: ay + "-" + String(1 + Math.floor(rnd() * 12)).padStart(2, "0") + "-15" };
  let C; try { C = PL.cast(cfg); } catch (e) { continue; }
  const M = QE.mk(C); const lords = { md: null, ad: null, pd: null };
  const rows = C.rows.vim.find(r => r.a <= C.age && C.age < r.b); if (!rows) continue;
  const lo = { md: rows.md, ad: rows.ad, pd: QE.pdAt(rows.ad, rows.a, rows.b, C.age) };
  // the transit part is read at the as of date through the same function the engine uses
  const tr = (function () { const c2 = C.VC.buildChart(C.asOfDate, C.input.lat, C.input.lon, C.input.tz, { ayanamshaKey: "lahiri" }); const T = {}; c2.planets.forEach(p => { T[p.name] = p.sign; }); return { T, asp: n => (C.E.PASP[{ Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me", Jupiter: "Ju", Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke" }[n]] || [6]).map(o => (T[n] + o) % 12) }; })();
  for (let k = 0; k < 4; k++) {
    const text = ENT[Math.floor(rnd() * ENT.length)];
    const o = PL.parseOption("A " + text); const prof = PL.profileOf(L, o); if (!prof) continue;
    const w = QE.writeLayers(o, prof, { text: "profession", options: [] }, { gender: cfg.gender }); if (!w) continue;
    w.layers.forEach(l => { const s = QE.scoreLayer(C, M, l, lo, tr).S; (l.dir === "support" ? sup : aff).push(s); });
  }
}
const med = a => { const b = a.slice().sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
const fr = (a, t) => a.filter(x => x >= t).length / a.length;
console.log("share satisfied, support " + fr(sup, 1.1).toFixed(2) + (aff.length ? ", afflict " + fr(aff, 0.6).toFixed(2) : ""));
console.log("charts " + N + ", support layers " + sup.length + " median " + med(sup).toFixed(3) + ", afflict layers " + aff.length + " median " + (aff.length ? med(aff).toFixed(3) : "none"));
console.log("supportShift " + (1.1 - med(sup)).toFixed(3) + (aff.length ? ", afflictShift " + (0.6 - med(aff)).toFixed(3) : ""));
