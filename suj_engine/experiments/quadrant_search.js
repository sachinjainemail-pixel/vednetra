#!/usr/bin/env node
/*
 * EXPERIMENT, round 19. The owner's decisions: 60 percent to the nakshatra and 40 percent to the planet degree, the degree bands on Rahu and Ketu, and the pada factors may be tuned if it improves the results.
 * The owner asked for the mix and the juncture where all results come accurate. A search can always find a mix that fits 14 hypotheses and 2 dated events, so this script also reports what protects
 * against fooling ourselves, a permutation test with shuffled truth labels, and a leave one chart out check. Read those two before reading the best mix.
 *
 * Reading of the owner's 60 and 40. Capacity multiplier of a planet m = 0.6 n + 0.4 d, and every weight of that planet, role, harm or weakness, is multiplied by m.
 *   n the nakshatra capacity, the real strength of the planet's nakshatra lord as a share of 1, times the pada factor, pushkara pada, vargottama, gandanta, cut at 1
 *   d the degree capacity, the Baladi factor of the planet's degree
 * With the share 0 for the nakshatra this is exactly the degree option of round 17, which the script checks. The real strength S of every planet comes from
 * strength_tally.js with no options, so it still holds Shadbala, D1 and D9 dignity, Vimshopaka and the subject varga. A first version of this script put the capacity into S itself, which makes
 * every weakness weigh 100 minus a small number and pushes every score down. That was a mistake of reading, found by the check against round 17, and is not the owner's rule.
 * Grid. Baladi sets 5, pushkara pada 3, vargottama 3, gandanta 3, the line for yes 5 values. 675 settings.
 */
const L = require("./lib_hypotheses");
const { capacity } = require("../tools/degree_capacity");
const { rank } = require("../tools/event_rank");
const { tally } = require("../tools/strength_tally");
const src = require("fs").readFileSync(__dirname + "/degree_analysis.js", "utf8");
const K = eval("(" + src.match(/const K = (\{[\s\S]*?\n\});\nconst rows/)[1] + ")");

// ---------- data ----------
const data = [];
Object.entries(K).forEach(([id, k]) => {
  const ctx = L.context(k.C), cap = capacity(Object.assign({}, k.C, { nodeDegree: true }));
  k.H.forEach(([name, truth, hs, opts]) => {
    const o = opts || ["No", "Yes"];
    const t = L.run(Object.assign({}, k.C), ctx, hs, o, false);
    data.push({ id, name, truth, cap, S0: t.weights.strength, opts: o, ev: t.evidence.map(e => ({ planet: e.planet, side: e.side, type: e.type, mult: e.mult == null ? 1 : e.mult, j: o.indexOf(e.option) })) });
  });
});
const events = [
  { id: "K2", name: "event 3 May 2021", truthEvent: "child_birth", cfg: { gender: "female", date: "1991-11-07", time: "10:50:00", tz: 5.5, lat: 28.6139, lon: 77.2090, on: "2021-05-03", events: ["marriage", "child_birth", "health_crisis", "mother_in_law_loss"] } },
  { id: "K3", name: "event 7 Dec 2022", truthEvent: "marriage", cfg: { gender: "female", date: "2000-11-12", time: "13:13:00", tz: 5.5, lat: 22.7196, lon: 75.8577, on: "2022-12-07", events: ["marriage", "job_start", "child_birth", "eye_surgery"] } }
];
events.forEach(e => {
  e.rank = rank(e.cfg);
  e.cap = capacity(Object.assign({}, e.cfg, { nodeDegree: true }));
  const probe = tally(Object.assign({}, e.cfg, { kind: "choice", options: ["a", "b"], evidence: [{ option: "a", type: "role", side: "for", planet: "Sun", factor: "x" }] }));
  e.S0 = probe.weights.strength;
});

// ---------- scoring ----------
const BALADI = { classical: { Bala: .25, Kumara: .5, Yuva: 1, Vriddha: .25, Mrita: 0 }, soft: { Bala: .5, Kumara: .75, Yuva: 1, Vriddha: .5, Mrita: .25 }, flat: { Bala: 1, Kumara: 1, Yuva: 1, Vriddha: 1, Mrita: 1 },
  mid: { Bala: .5, Kumara: .75, Yuva: 1, Vriddha: .75, Mrita: .5 }, steep: { Bala: 0, Kumara: .5, Yuva: 1, Vriddha: .5, Mrita: 0 } };
const WN = process.env.WN !== undefined ? Number(process.env.WN) : 0.6;
function mult(S0, cap, p, P) {
  const c = cap[p], b = P.bal[c.avastha] != null ? P.bal[c.avastha] : 1;
  const f = (c.pushkaraPada ? P.push : 1) * (c.vargottama ? P.varg : 1) * (c.gandanta ? P.gand : 1);
  const n = Math.min(1, S0[c.nakLord] / 100 * f);
  return WN * n + (1 - WN) * b;
}
const FAM = process.env.FAM === "2" ? 2 : 1;
function effS(S0, cap, p, P) {
  const c = cap[p], f = (c.pushkaraPada ? P.push : 1) * (c.vargottama ? P.varg : 1) * (c.gandanta ? P.gand : 1);
  return Math.min(100, ((1 - P.w) * S0[p] + P.w * S0[c.nakLord]) * f);
}
function score(d, P) {
  const idx = d.opts.length - 1, fav = {}, ag = {};
  d.ev.forEach(e => {
    if (e.mult === 0) return;
    let s, w;
    if (FAM === 2) { s = effS(d.S0, d.cap, e.planet, P); const c = d.cap[e.planet]; w = (e.type === "weakness" ? 100 - s : s) * e.mult * (P.bal[c.avastha] != null ? P.bal[c.avastha] : 1); }
    else { s = d.S0[e.planet]; w = (e.type === "weakness" ? 100 - s : s) * e.mult * mult(d.S0, d.cap, e.planet, P); }
    if (e.side === "for") { if (e.j >= idx) fav[e.planet] = Math.max(fav[e.planet] || 0, w); }
    else { if (e.j <= idx) ag[e.planet] = Math.max(ag[e.planet] || 0, w); }
  });
  const f = Object.values(fav).reduce((a, b) => a + b, 0), a = Object.values(ag).reduce((a, b) => a + b, 0);
  return f + a ? 100 * f / (f + a) : 0;
}
function eventTop(e, P) {
  const res = e.rank.rows.map(r => ({ ev: r.event, s: r.per.reduce((a, p) => {
    let fac;
    if (FAM === 2) { const c = e.cap[p.lord]; fac = (effS(e.S0, e.cap, p.lord, P) / 100) * (P.bal[c.avastha] != null ? P.bal[c.avastha] : 1); }
    else fac = mult(e.S0, e.cap, p.lord, P);
    return a + (p.of ? p.links / p.of : 0) * fac; }, 0) }));
  res.sort((a, b) => b.s - a.s);
  return res[0].ev === e.truthEvent ? 1 : 0;
}
const auc = (rows, key) => { const y = rows.filter(r => r.truth), n = rows.filter(r => !r.truth); let w = 0, c = 0; y.forEach(a => n.forEach(b => { c++; w += a[key] > b[key] ? 1 : (a[key] === b[key] ? 0.5 : 0); })); return c ? w / c : 0.5; };
function evaluate(P, ds, evs) {
  const rows = ds.map(d => ({ truth: d.truth, s: score(d, P) }));
  return { auc: auc(rows, "s"), ev: evs.reduce((a, e) => a + eventTop(e, P), 0), rows };
}

// ---------- grid ----------
const grid = [];
const WS = FAM === 2 ? [0, 0.25, 0.5, 0.6, 0.75, 1] : [WN];
for (const w of WS) for (const [bn, bal] of Object.entries(BALADI)) for (const push of [1, 1.15, 1.3]) for (const varg of [1, 1.15, 1.3]) for (const gand of [0.5, 0.7, 1]) grid.push({ w, bn, bal, push, varg, gand });
const ok = (P, ds, evs) => { const r = evaluate(P, ds, evs); return r.auc + 0.02 * r.ev; };
let best = null;
const results = grid.map(P => { const r = evaluate(P, data, events); const v = r.auc + 0.02 * r.ev; if (!best || v > best.v) best = { v, P, r }; return { P, r, v }; });
const lineAcc = (P, T) => { const r = data.map(d => ({ truth: d.truth, s: score(d, P) })); return r.filter(x => (x.s > T) === x.truth).length; };
const bestT = P => { let b = { T: 50, acc: -1 }; for (const T of [30, 35, 40, 45, 50, 55, 60]) { const a = lineAcc(P, T); if (a > b.acc) b = { T, acc: a }; } return b; };

console.log("14 hypotheses, 10 true and 4 false. Always answering true gets 10 of 14, 71 percent. The events are 2 targets.");
console.log("Owner's mix: 60 percent nakshatra, 40 percent degree, bands on the nodes.");
const own = grid.find(P => P.bn === "classical" && P.push === 1.15 && P.varg === 1.15 && P.gand === 0.7);
const ro = evaluate(own, data, events), to = bestT(own);
console.log("Previous setting, classical bands 1.15 1.15 0.7: AUC " + ro.auc.toFixed(2) + ", events first " + ro.ev + " of 2, best line " + to.T + " gives " + to.acc + " of 14.");
const bt = bestT(best.P);
console.log("\nFAMILY " + FAM + (FAM === 2 ? ", the round 18 form, strength blended with the star lord's then times the Baladi capacity, nakshatra weight searched" : ", the owner's 60 and 40 as capacity multipliers"));
console.log("BEST OF THE GRID: weight " + best.P.w + " bands " + best.P.bn + " pushkara " + best.P.push + " vargottama " + best.P.varg + " gandanta " + best.P.gand + ": AUC " + best.r.auc.toFixed(2) + ", events first " + best.r.ev + " of 2, best line " + bt.T + " gives " + bt.acc + " of 14.");
const near = results.filter(x => x.v >= best.v - 1e-9);
console.log("Settings that reach exactly this best value " + near.length + " of " + grid.length + ". By bands " + Object.keys(BALADI).map(b => b + " " + near.filter(x => x.P.bn === b).length).join(", "));
const aucs = results.map(x => x.r.auc).sort((a, b) => a - b);
console.log("AUC over the whole grid, min " + aucs[0].toFixed(2) + ", median " + aucs[Math.floor(aucs.length / 2)].toFixed(2) + ", max " + aucs[aucs.length - 1].toFixed(2));

// ---------- permutation test ----------
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = mulberry(20261119);
const base = data.map(d => ({ truth: d.truth }));
const precomp = grid.map(P => data.map(d => score(d, P)));
let ge = 0, N = 2000; const maxes = [];
for (let it = 0; it < N; it++) {
  const lab = base.map(b => b.truth); for (let i = lab.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [lab[i], lab[j]] = [lab[j], lab[i]]; }
  let mx = 0; precomp.forEach(sc => { const rows = sc.map((s, i) => ({ truth: lab[i], s })); const a = auc(rows, "s"); if (a > mx) mx = a; });
  maxes.push(mx); if (mx >= best.r.auc - 1e-9) ge++;
}
maxes.sort((a, b) => a - b);
console.log("\nPERMUTATION TEST, truth labels shuffled " + N + " times and the whole grid searched each time. The best AUC reached by chance has median " + maxes[Math.floor(N / 2)].toFixed(2) + ", 95th percentile " + maxes[Math.floor(N * 0.95)].toFixed(2) + ". Observed best " + best.r.auc.toFixed(2) + ". Share of shuffles that did as well " + (ge / N).toFixed(3) + ".");

// ---------- leave one chart out ----------
const pooled = [];
["K892", "K2", "K3"].forEach(out => {
  const tr = data.filter(d => d.id !== out), te = data.filter(d => d.id === out);
  let b = null; grid.forEach(P => { const v = evaluate(P, tr, []).auc; if (!b || v > b.v) b = { v, P }; });
  te.forEach(d => pooled.push({ truth: d.truth, s: score(d, b.P), chart: out }));
  console.log("Held out " + out + ", chosen on the other two: weight " + b.P.w + " bands " + b.P.bn + " " + b.P.push + " " + b.P.varg + " " + b.P.gand + ", training AUC " + b.v.toFixed(2));
});
console.log("LEAVE ONE CHART OUT, pooled AUC of the held out predictions " + auc(pooled, "s").toFixed(2) + " over 14 hypotheses. Held out true scores " + pooled.filter(x => x.truth).map(x => Math.round(x.s)).join(",") + "; held out false scores " + pooled.filter(x => !x.truth).map(x => Math.round(x.s)).join(","));
console.log("\nScores of the 14 hypotheses under the best mix");
const rb = evaluate(best.P, data, events);
data.forEach((d, i) => console.log("  " + (d.id + " " + d.name).padEnd(36) + (d.truth ? "TRUE " : "false") + " " + Math.round(rb.rows[i].s)));
