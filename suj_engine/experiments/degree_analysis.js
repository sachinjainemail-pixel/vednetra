#!/usr/bin/env node
/* EXPERIMENT, round 17. The owner asked whether the degree of the planets, and so their capacity to give results, explains the engine's errors. For every hypothesis of the three
 * tested charts this prints the planets that the evidence generator used, their degree, avastha and capacity, and the strength tally score without and with the degree option.
 * Then the AUC of the scores against the truth, without and with. The true answers were known, so this is a diagnosis and not a test. */
const L = require("./lib_hypotheses");
const { capacity } = require("../tools/degree_capacity");
const K = {
  K892: { C: { gender: "female", date: "1993-01-06", time: "07:10:00", tz: 5.5, lat: 27.1333, lon: 81.9667, asOf: "2026-11-14" }, H: [
    ["Q1 Education, Post graduation", true, [{ option: "Graduation", houses: [4], varga: 24 }, { option: "Post graduation", houses: [5, 9], karakas: ["Mercury", "Jupiter"], varga: 24 }], ["High school", "Intermediate", "Graduation", "Post graduation"]],
    ["Q2 Married", true, [{ option: "Yes", houses: [7], karakas: ["Venus", "Jupiter"], varga: 9 }]],
    ["Q3 Working", false, [{ option: "Yes", houses: [10], karakas: ["Saturn"], varga: 10 }]],
    ["Q4 Has siblings", true, [{ option: "Yes", houses: [3, 11], karakas: ["Mars"], varga: 3 }]],
    ["Q5 Father alive", false, [{ option: "Yes", houses: [9, 4], from: 9, karakas: ["Sun"], varga: 12 }]],
    ["Q5 Mother alive", true, [{ option: "Yes", houses: [4, 11], from: 4, karakas: ["Moon"], varga: 12 }]]] },
  K2: { C: { gender: "female", date: "1991-11-07", time: "10:50:00", tz: 5.5, lat: 28.6139, lon: 77.2090, asOf: "2026-11-14" }, H: [
    ["Q1 Working", true, [{ option: "Yes", houses: [10], karakas: ["Saturn"], varga: 10 }]],
    ["Q1 Doctor", false, [{ option: "Yes", houses: [6, 10], karakas: ["Sun", "Mars"], varga: 10 }]],
    ["Q1 Lawyer", true, [{ option: "Yes", houses: [9, 10], karakas: ["Jupiter", "Saturn", "Mercury"], varga: 10 }]],
    ["Q1 Astrologer", false, [{ option: "Yes", houses: [8, 9, 10], karakas: ["Jupiter", "Mercury", "Ketu"], varga: 10 }]],
    ["Q2 Married", true, [{ option: "Yes", houses: [7], karakas: ["Venus", "Jupiter"], varga: 9 }]],
    ["Q2 Happy marriage", true, [{ option: "Yes", houses: [7, 2], karakas: ["Venus", "Jupiter"], varga: 9 }]],
    ["Q3 Has a child", true, [{ option: "Yes", houses: [5], karakas: ["Jupiter"], varga: 7 }]]] },
  K3: { C: { gender: "female", date: "2000-11-12", time: "13:13:00", tz: 5.5, lat: 22.7196, lon: 75.8577, asOf: "2026-11-14" }, H: [
    ["Q1 Married", true, [{ option: "Yes", houses: [7], karakas: ["Venus", "Jupiter"], varga: 9 }]]] }
};
const rows = [];
Object.entries(K).forEach(([id, k]) => {
  const ctx = L.context(k.C), cap = capacity(Object.assign({}, k.C, { nodeDegree: process.env.NODES === "1" }));
  console.log("\n######## " + id);
  k.H.forEach(([name, truth, hs, opts]) => {
    const o = opts || ["No", "Yes"];
    const a = L.run(Object.assign({}, k.C, { degree: false }), ctx, hs, o, false), b = L.run(Object.assign({}, k.C, { degree: true, nodeDegree: process.env.NODES === "1" }), ctx, hs, o, false);
    const idx = o.length - 1, s0 = a.rows[idx].score, s1 = b.rows[idx].score;
    const pl = Array.from(new Set(a.evidence.map(e => e.planet)));
    console.log("\n" + name + ", truth " + (truth ? "yes" : "no") + ", score without degree " + s0 + ", with degree " + s1 + (s1 > s0 ? " (up)" : s1 < s0 ? " (down)" : " (same)"));
    console.log("  planets used " + pl.map(p => { const c = cap[p]; return p + " " + c.degree.toFixed(1) + " " + c.sign.slice(0, 3) + " " + c.avastha + " x" + c.factor + (c.gandanta ? " GANDANTA" : "") + (c.combust ? " combust" : "") + (c.sandhi ? " sandhi" : ""); }).join(" | "));
    rows.push({ id, name, truth, s0, s1 });
  });
});
const auc = key => { const y = rows.filter(r => r.truth), n = rows.filter(r => !r.truth); let w = 0, c = 0; y.forEach(a => n.forEach(b => { c++; w += a[key] > b[key] ? 1 : (a[key] === b[key] ? 0.5 : 0); })); return (w / c).toFixed(2) + " over " + c + " pairs"; };
const mean = (f, k) => (rows.filter(f).reduce((a, r) => a + r[k], 0) / rows.filter(f).length).toFixed(1);
console.log("\nAUC without degree " + auc("s0") + ", with degree " + auc("s1"));
console.log("Mean of true hypotheses " + mean(r => r.truth, "s0") + " without, " + mean(r => r.truth, "s1") + " with. Mean of false " + mean(r => !r.truth, "s0") + " without, " + mean(r => !r.truth, "s1") + " with.");
console.log("Scores above 50 without " + rows.filter(r => r.s0 > 50).length + ", with " + rows.filter(r => r.s1 > 50).length + " of " + rows.length);
