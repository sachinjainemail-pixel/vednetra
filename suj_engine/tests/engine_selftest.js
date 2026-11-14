#!/usr/bin/env node
/* Self test for the engine default, round 22. Version 2.0 is the default, legacy reproduces the old configuration, an explicit key always wins. node suj_engine/tests/engine_selftest.js */
const { resolve, version } = require("../tools/engine_config");
const { tally } = require("../tools/strength_tally");
const { score } = require("../tools/score_hypotheses");
let pass = 0, total = 0;
const ok = (name, c) => { total++; if (c) pass++; else console.log("FAIL " + name); };
ok("default version is 2.0", version === "2.0" && resolve({}).engineVersion === "2.0");
const d = resolve({});
ok("defaults switch on degree, nakshatra and the node bands", d.degree === true && d.nakshatra === true && d.nodeDegree === true);
const l = resolve({ engine: "legacy" });
ok("legacy switches degree and nakshatra off", l.degree === false && l.nakshatra === false && l.engineVersion === "legacy");
ok("an explicit key wins over the default", resolve({ degree: false }).degree === false && resolve({ engine: "legacy", degree: true }).degree === true);
const K892 = { gender: "female", date: "1993-01-06", time: "07:10:00", tz: 5.5, lat: 27.1333, lon: 81.9667, asOf: "2026-11-14" };
const ev = [{ option: "Yes", side: "for", type: "role", planet: "Jupiter", factor: "karaka" }, { option: "Yes", side: "against", type: "harm", planet: "Saturn", factor: "x" }];
const T = o => tally(Object.assign({}, K892, o, { kind: "choice", options: ["Yes", "No"], evidence: ev.map(e => Object.assign({}, e)) }));
const def = T({}), exp = T({ degree: true, nakshatra: true }), leg = T({ engine: "legacy" });
ok("a tally with no flags equals the explicit updated configuration", JSON.stringify(def.rows.map(r => r.score)) === JSON.stringify(exp.rows.map(r => r.score)));
ok("the legacy tally carries no nakshatra part", leg.weights.parts.Jupiter.nakshatra === undefined && def.weights.parts.Jupiter.nakshatra !== undefined);
const K4 = { gender: "male", date: "2006-02-14", time: "05:27:00", tz: 5.5, lat: 31.326, lon: 75.576, asOf: "2026-11-14", types: ["Has siblings", "CA"] };
const r = score(K4), by = {}; r.rows.forEach(x => { by[x.type] = x; });
ok("hypothesis scores of Kundali 4 reproduce the stored updated scores 21 and 40", by["Has siblings"].score === 21 && by["CA"].score === 40);
ok("the z score is read against the stored null distribution", Math.abs(by["Has siblings"].z - (21 - 29.1) / 24) < 0.2 && /PROVISIONAL/.test(r.status));
console.log(pass + " of " + total + " passed");
process.exit(pass === total ? 0 : 1);
