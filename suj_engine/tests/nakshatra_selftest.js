#!/usr/bin/env node
/* Self test for the nakshatra option of strength_tally.js and event_rank.js. node suj_engine/tests/nakshatra_selftest.js */
const { tally } = require("../tools/strength_tally");
const { capacity } = require("../tools/degree_capacity");
let pass = 0, n = 0;
const ok = (name, c) => { n++; if (c) pass++; else console.log("FAIL " + name); };
const K2 = { gender: "female", date: "1991-11-07", time: "10:50:00", tz: 5.5, lat: 28.6139, lon: 77.2090, asOf: "2026-11-14" };
const K892 = { gender: "female", date: "1993-01-06", time: "07:10:00", tz: 5.5, lat: 27.1333, lon: 81.9667, asOf: "2026-11-14" };
const ev = [{ option: "Yes", type: "role", side: "for", planet: "Jupiter", factor: "x" }];
const t = (C, o) => tally(Object.assign({}, C, o, { kind: "choice", options: ["Yes", "No"], evidence: ev.map(e => Object.assign({}, e)) }));
const c2 = capacity(K2);
ok("Kundali 2 Jupiter is vargottama in Purva Phalguni and stands in the star of Venus", c2.Jupiter.vargottama && c2.Jupiter.nakLord === "Venus");
const a = t(K2, {}), b = t(K2, { nakshatra: true });
ok("the nakshatra option changes Jupiter's strength through the star lord and the vargottama factor", a.weights.strength.Jupiter !== b.weights.strength.Jupiter && b.weights.parts.Jupiter.vargottama === true);
const NF = JSON.parse(require("fs").readFileSync(require("path").join(__dirname, "..", "data", "nakshatra_factors.json"), "utf8"));
ok("the blend is between Jupiter's own strength and Venus's at the weight in the data file, then the vargottama factor", Math.abs(b.weights.strength.Jupiter - Math.min(100, ((1 - NF.blend) * a.weights.strength.Jupiter + NF.blend * a.weights.strength.Venus) * NF.vargottama)) < 0.2);
const m0 = t(K892, {}), m1 = t(K892, { nakshatra: true });
ok("the Moon of Kundali 892 stands in its own star, Rohini, so the blend leaves its strength unchanged", Math.abs(m0.weights.strength.Moon - m1.weights.strength.Moon) < 0.2);
ok("nakshatra off keeps the earlier behaviour", a.weights.parts.Jupiter.nakshatra === undefined);
console.log(pass + " of " + n + " passed");
process.exit(pass === n ? 0 : 1);
