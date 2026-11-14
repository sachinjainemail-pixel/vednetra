#!/usr/bin/env node
/* EXPERIMENT. Case K2, female, 7 November 1991, 10:50, New Delhi. Pre-stated mapping, chosen before the run, the engine author's proposal.
 * Working 10th house with Saturn. Doctor 6th and 10th with Sun and Mars. Lawyer 9th and 10th with Jupiter Saturn Mercury. Astrologer 8th 9th 10th
 * with Jupiter Mercury Ketu. Marriage 7th with Venus and Jupiter, happy marriage adds the 2nd. Child 5th with Jupiter. The true answers were
 * given together with the chart, so this is not a blind test. */
const L = require("./lib_hypotheses");
const { scan } = require("../tools/window_scan");
const { nature } = require("../tools/functional_nature");
const C = { gender: "female", date: "1991-11-07", time: "10:50:00", tz: 5.5, lat: 28.6139, lon: 77.2090, asOf: "2026-11-14" };
const ctx = L.context(C);
const H = [
  ["Working", [{ option: "Yes", houses: [10], karakas: ["Saturn"], varga: 10 }]],
  ["Doctor", [{ option: "Yes", houses: [6, 10], karakas: ["Sun", "Mars"], varga: 10 }]],
  ["Lawyer", [{ option: "Yes", houses: [9, 10], karakas: ["Jupiter", "Saturn", "Mercury"], varga: 10 }]],
  ["Astrologer", [{ option: "Yes", houses: [8, 9, 10], karakas: ["Jupiter", "Mercury", "Ketu"], varga: 10 }]],
  ["Married", [{ option: "Yes", houses: [7], karakas: ["Venus", "Jupiter"], varga: 9 }]],
  ["Happy marriage", [{ option: "Yes", houses: [7, 2], karakas: ["Venus", "Jupiter"], varga: 9 }]],
  ["Has a child", [{ option: "Yes", houses: [5], karakas: ["Jupiter"], varga: 7 }]]
];
console.log("Hypothesis scores, share of planet strength in favour. View 1 as stated, view 2 weakness for carriers only");
H.forEach(([name, hs]) => {
  const a = L.run(C, ctx, hs, ["No", "Yes"], false), b = L.run(C, ctx, hs, ["No", "Yes"], true);
  console.log("  " + name.padEnd(16) + a.rows[1].score + "   " + b.rows[1].score + "   favour " + a.rows[1].favour + " against " + a.rows[1].against);
});
console.log("\nDasha lords on 3 May 2021 and now, Laghu Parashari");
["2021-05-03", "2026-11-14"].forEach(d => { const fn = nature(Object.assign({}, C, { asOf: d })); console.log(" " + d); fn.dasha.forEach(x => console.log("   " + x.level + " " + x.lord + " " + (fn.rows[x.lord] ? fn.rows[x.lord].role + (fn.rows[x.lord].marakaLord.length ? ", marakesha" : "") : fn.nodes[x.lord].role))); });
console.log("\nStrict windows that cover 3 May 2021, with the nodes. Option events");
["marriage", "child_birth", "health_crisis", "mother_in_law_loss"].forEach(ev => {
  const w = scan(Object.assign({}, C, { event: ev, strict: true, from: "2021-01-01", to: "2021-12-31" })).windows;
  const hit = w.filter(x => x.start <= "2021-05-03" && x.end >= "2021-05-03");
  const all = scan(Object.assign({}, C, { event: ev, strict: true })).windows.filter(x => x.timeStatus !== "FUTURE");
  console.log("  " + ev.padEnd(20) + (hit.length ? "COVERS 3 May 2021 " + hit.map(x => x.grade + " " + x.start + " to " + x.end + " " + x.lords.join(" ")).join("; ") : "no strict window on that date") + ". Past windows in life " + all.length + ", grade A " + all.filter(x => x.grade === "A").length);
});
const wide = ["marriage", "child_birth", "health_crisis", "mother_in_law_loss"].map(ev => { const w = scan(Object.assign({}, C, { event: ev, strict: false, from: "2021-05-03", to: "2021-05-03" })).windows; return ev + (w.length ? " yes " + w.map(x => x.grade + " " + x.lords.join(" ")).join(";") : " no"); });
console.log("Wide view on 3 May 2021, " + wide.join(" | "));
