#!/usr/bin/env node
/* EXPERIMENT, round 18. The owner asked to add the nakshatra and the nakshatra pada to the degree of the planets and see whether it helps. Four conditions per hypothesis, without anything,
 * with the degree, with the nakshatra and pada only, with both. Then the AUC of each, and the event rank for the two dated events. The true answers were known, so this is a diagnosis. */
const L = require("./lib_hypotheses");
const { capacity } = require("../tools/degree_capacity");
const { rank } = require("../tools/event_rank");
const src = require("fs").readFileSync(__dirname + "/degree_analysis.js", "utf8");
// reuse the hypothesis table of degree_analysis.js
const K = eval("(" + src.match(/const K = (\{[\s\S]*?\n\});\nconst rows/)[1] + ")");
const conds = [["base", {}], ["degree", { degree: true }], ["nakshatra", { nakshatra: true }], ["both", { degree: true, nakshatra: true }], ["both+nodes", { degree: true, nakshatra: true, nodeDegree: true }]];
const rows = [];
Object.entries(K).forEach(([id, k]) => {
  const ctx = L.context(k.C), cap = capacity(k.C);
  console.log("\n######## " + id);
  k.H.forEach(([name, truth, hs, opts]) => {
    const o = opts || ["No", "Yes"], sc = {};
    let planets = [];
    conds.forEach(([cn, extra]) => { const t = L.run(Object.assign({}, k.C, extra), ctx, hs, o, false); sc[cn] = t.rows[o.length - 1].score; if (cn === "both") planets = Array.from(new Set(t.evidence.map(e => e.planet))); });
    console.log(name.padEnd(26) + (truth ? "TRUE " : "false") + conds.map(([cn]) => cn + " " + sc[cn]).join("  "));
    console.log("   " + planets.map(p => { const c = cap[p]; return p + " " + c.nakshatra + "-" + c.pada + " star lord " + c.nakLord + (c.vargottama ? " VARGOTTAMA" : "") + (c.pushkaraPada ? " pushkara" : "") + (c.gandanta ? " GANDANTA" : ""); }).join(" | "));
    rows.push({ id, name, truth, sc });
  });
});
const auc = key => { const y = rows.filter(r => r.truth), n = rows.filter(r => !r.truth); let w = 0, c = 0; y.forEach(a => n.forEach(b => { c++; w += a.sc[key] > b.sc[key] ? 1 : (a.sc[key] === b.sc[key] ? 0.5 : 0); })); return (w / c).toFixed(2); };
const toward = key => rows.filter(r => (r.truth && r.sc[key] > r.sc.base) || (!r.truth && r.sc[key] < r.sc.base)).length;
console.log("\nCondition       AUC    toward truth of 14   above 50");
conds.forEach(([cn]) => console.log(cn.padEnd(16) + auc(cn) + "   " + String(toward(cn)).padEnd(19) + rows.filter(r => r.sc[cn] > 50).length + "   true above 50 " + rows.filter(r => r.truth && r.sc[cn] > 50).length + " false above 50 " + rows.filter(r => !r.truth && r.sc[cn] > 50).length));
console.log("\nEvent rank on the dated events");
const ev = [["K2 3 May 2021 truth child_birth", { gender: "female", date: "1991-11-07", time: "10:50:00", tz: 5.5, lat: 28.6139, lon: 77.2090, on: "2021-05-03", events: ["marriage", "child_birth", "health_crisis", "mother_in_law_loss"] }],
  ["K3 7 Dec 2022 truth marriage", { gender: "female", date: "2000-11-12", time: "13:13:00", tz: 5.5, lat: 22.7196, lon: 75.8577, on: "2022-12-07", events: ["marriage", "job_start", "child_birth", "eye_surgery"] }]];
ev.forEach(([n, c]) => conds.forEach(([cn, extra]) => { const r = rank(Object.assign({}, c, extra)); console.log("  " + n.padEnd(34) + cn.padEnd(12) + r.rows.map(x => x.event + " " + x.score).join(" | ")); }));
