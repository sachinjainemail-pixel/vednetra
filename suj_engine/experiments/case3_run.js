#!/usr/bin/env node
/* EXPERIMENT. Case K3, female, 12 November 2000, 13:13, Indore. True answers came with the chart, so this is NOT a blind test. Pre-stated, the Married hypothesis uses the
 * 7th house with Venus and Jupiter and D9, as for the earlier charts. Events for the date are marriage, job_start, child_birth and the new preset eye_surgery. */
const L = require("./lib_hypotheses");
const { scan } = require("../tools/window_scan");
const { rank, render } = require("../tools/event_rank");
const { nature } = require("../tools/functional_nature");
const C = { gender: "female", date: "2000-11-12", time: "13:13:00", tz: 5.5, lat: 22.7196, lon: 75.8577, asOf: "2026-11-14" };
const ctx = L.context(C);
const h = [{ option: "Yes", houses: [7], karakas: ["Venus", "Jupiter"], varga: 9 }];
const a = L.run(C, ctx, h, ["No", "Yes"], false), b = L.run(C, ctx, h, ["No", "Yes"], true);
console.log("Married hypothesis score " + a.rows[1].score + " view 2 " + b.rows[1].score + ", favour " + a.rows[1].favour + " against " + a.rows[1].against);
console.log("\nDasha lords on 7 December 2022 and now, Laghu Parashari");
["2022-12-07", "2026-11-14"].forEach(d => { const fn = nature(Object.assign({}, C, { asOf: d })); console.log(" " + d); fn.dasha.forEach(x => console.log("   " + x.level + " " + x.lord + " " + (fn.rows[x.lord] ? fn.rows[x.lord].role + (fn.rows[x.lord].marakaLord.length ? ", marakesha" : "") : fn.nodes[x.lord].role))); });
console.log("\nWhich scan view covers 7 December 2022");
for (const ev of ["marriage", "job_start", "child_birth", "eye_surgery"]) {
  const row = [];
  for (const [lab, ex] of [["strict double", { strict: true }], ["strict single", { strict: true, gate: "single" }], ["wide double", {}], ["wide single", { gate: "single" }]]) {
    const w = scan(Object.assign({}, C, { event: ev, from: "2022-12-07", to: "2022-12-07" }, ex)).windows;
    row.push(lab + " " + (w.length ? "YES " + w.map(x => x.grade + " via " + x.via).join(";") : "no"));
  }
  console.log("  " + ev.padEnd(12) + row.join(" | "));
}
console.log("\n" + render(rank(Object.assign({}, C, { on: "2022-12-07", events: ["marriage", "job_start", "child_birth", "eye_surgery"] }))));
console.log("\nSeparation windows between 8 December 2022 and 14 November 2026, strict double and wide double");
["strict", "wide"].forEach(v => {
  const w = scan(Object.assign({}, C, { event: "separation", strict: v === "strict", from: "2022-12-08", to: "2026-11-14" })).windows;
  console.log("  " + v + " " + w.length + " windows " + w.map(x => x.grade + " " + x.start + " to " + x.end + " " + x.lords.join(" ") + " via " + x.via).join(" | "));
});
const all = scan(Object.assign({}, C, { event: "marriage", strict: true })).windows;
console.log("\nMarriage strict windows in life, past " + all.filter(x => x.timeStatus !== "FUTURE").length + ", between 2022-06 and 2023-06 " + all.filter(x => x.end >= "2022-06-01" && x.start <= "2023-06-30").map(x => x.grade + " " + x.start + " to " + x.end + " " + x.lords.join(" ") + " via " + x.via).join(" | "));
