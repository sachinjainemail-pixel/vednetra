#!/usr/bin/env node
/*
 * EXPERIMENT, not part of the engine. Reruns Kundali 892 with the planet resolution proposed in round 6.
 * Rule fixed before running.
 *   1. Subject houses include the derived houses, father 9 4 10 3, mother 4 11 5 10.
 *   2. A planet is ELIGIBLE only if its subject links, counted by planet_strength step 6 WITHOUT the dasha items, are 3 or more.
 *   3. Eligible planets are ranked by DASHA INVOLVEMENT first. Involvement is the weighted count of strict window scan windows up
 *      to the as-of date in which the planet is the Antardasha or the Pratyantardasha lord, grade A weighs 2 and grade B weighs 1.
 *   4. Equal involvement is broken by Shadbala percent, then by link count.
 * The tool planet_strength.js is not changed. Its own winner is printed beside for comparison.
 * The true answers of this chart were known when this was run, so the output is not a test. It shows what the proposed rule does.
 */
const { analyse } = require("../tools/planet_strength");
const { scan } = require("../tools/window_scan");
const C = { gender: "female", date: "1993-01-06", time: "07:10:00", tz: 5.5, lat: 27.1333, lon: 81.9667, asOf: "2026-11-13" };
const Q = [
  { q: "Q1 education",  houses: [4, 5, 9],        karakas: ["Mercury", "Jupiter"], varga: 24, events: ["education_step"], candidates: ["Jupiter", "Mercury", "Mars", "Saturn", "Sun", "Moon", "Venus", "Rahu", "Ketu"] },
  { q: "Q2 marriage",   houses: [7, 2, 11, 6, 8, 12], risk: [6, 8, 12], karakas: ["Venus", "Jupiter"],   varga: 9,  events: ["marriage"],       candidates: [] },
  { q: "Q3 work",       houses: [10, 6, 11, 2],   karakas: ["Saturn"],             varga: 10, events: ["job_start"],      candidates: [] },
  { q: "Q4 siblings",   houses: [3, 11],          karakas: ["Mars"],               varga: 3,  events: ["sibling_birth"],  candidates: [] },
  { q: "Q5 father",     houses: [9, 4, 10, 3],    risk: [4, 10, 3],  karakas: ["Sun"],                varga: 12, events: ["father_loss"],    candidates: [] },
  { q: "Q5 mother",     houses: [4, 11, 5, 10],   risk: [11, 5, 10], karakas: ["Moon"],               varga: 12, events: ["mother_loss"],    candidates: [] }
];
const ALL = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
for (const t of Q) {
  const r = analyse(Object.assign({}, C, { houses: t.houses, karakas: t.karakas, varga: t.varga, candidates: ["Sun", "Moon"] }));
  const w = scan(Object.assign({}, C, { event: t.events[0], strict: true })).windows.filter(x => x.timeStatus !== "FUTURE");
  const inv = {}; ALL.forEach(p => { inv[p] = 0; });
  w.forEach(x => { [x.lords[1], x.lords[2]].forEach(l => { inv[l] += x.grade === "A" ? 2 : 1; }); });
  const rows = ALL.map(p => ({
    p, link: r.rows[p].step6.subjectOnlyCount, now: r.rows[p].step6.dashaActive.join("+") || "-", inv: inv[p],
    pct: r.rows[p].step1 && r.rows[p].step1.percent != null ? r.rows[p].step1.percent : null,
    why: r.rows[p].step6.reasons.filter(x => x.indexOf("running") < 0)
  }));
  const eligible = rows.filter(x => x.link >= 3).sort((a, b) => b.inv - a.inv || (b.pct || 0) - (a.pct || 0) || b.link - a.link);
  console.log("\n==== " + t.q + ", subject houses " + t.houses.join(" ") + ", strict windows used " + w.length);
  console.log("planet   links  dashaNow       inv  shadbala%");
  rows.forEach(x => console.log(x.p.padEnd(9) + String(x.link).padEnd(7) + x.now.padEnd(15) + String(x.inv).padEnd(5) + (x.pct == null ? "node" : x.pct)));
  console.log("ELIGIBLE in order " + eligible.map(x => x.p + " inv " + x.inv).join(" , "));
  eligible.slice(0, 4).forEach(x => console.log("  " + x.p + " links " + x.why.join(" ; ")));
  if (t.risk) {
    console.log("  NATURE of each planet's house links. support = links to the life giving houses and varga help, risk = links to " + t.risk.join(" ") + ", the loss houses");
    rows.filter(x => x.link >= 1).forEach(x => {
      let sup = 0, rsk = 0;
      x.why.forEach(w => {
        const m = /house (\d+)/.exec(w);
        if (/lords house|sits in house|aspects house/.test(w) && m) { if (t.risk.indexOf(Number(m[1])) >= 0) rsk++; else sup++; }
        else if (/karaka|confirmed|dignified/.test(w)) sup++;
      });
      console.log("   " + x.p.padEnd(8) + "support " + sup + " risk " + rsk + " net " + (sup - rsk) + "  inv " + x.inv + "  dashaNow " + x.now);
    });
  }
}
