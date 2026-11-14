#!/usr/bin/env node
/* Self test for degree_capacity.js and the degree option of strength_tally.js. node suj_engine/tests/degree_selftest.js */
const { capacity, avastha } = require("../tools/degree_capacity");
const { tally } = require("../tools/strength_tally");
let pass = 0, n = 0;
const ok = (name, c) => { n++; if (c) pass++; else console.log("FAIL " + name); };
ok("odd sign Aries, 3 degrees is Bala, 9 Kumara, 15 Yuva, 21 Vriddha, 27 Mrita", [3, 9, 15, 21, 27].map(d => avastha(0, d)).join(" ") === "Bala Kumara Yuva Vriddha Mrita");
ok("even sign Taurus reverses the order", [3, 9, 15, 21, 27].map(d => avastha(1, d)).join(" ") === "Mrita Vriddha Yuva Kumara Bala");
const C = { gender: "female", date: "1993-01-06", time: "07:10:00", tz: 5.5, lat: 27.1333, lon: 81.9667, asOf: "2026-11-14" };
const c = capacity(C);
ok("Kundali 892 Mars 24.6 Gemini is Mrita with factor 0", c.Mars.avastha === "Mrita" && c.Mars.factor === 0);
ok("Jupiter 20.1 Virgo, an even sign, is Kumara", c.Jupiter.avastha === "Kumara" && c.Jupiter.factor === 0.5);
ok("Sun 22 Sagittarius is Vriddha", c.Sun.avastha === "Vriddha" && c.Sun.factor === 0.25);
ok("the nodes take the bands by default, the owner's decision of round 19, and keep the factor 1 only with nodeDegree false", c.Rahu.factor === 0.25 && capacity(Object.assign({}, C, { nodeDegree: false })).Rahu.factor === 1);
const ev = [{ option: "Yes", type: "role", side: "for", planet: "Mars", factor: "x" }];
const off = tally(Object.assign({}, C, { engine: "legacy", kind: "choice", options: ["Yes", "No"], evidence: ev.map(e => Object.assign({}, e)) }));
const on = tally(Object.assign({}, C, { degree: true, kind: "choice", options: ["Yes", "No"], evidence: ev.map(e => Object.assign({}, e)) }));
ok("a Mrita planet carries no weight when the degree option is on", off.rows[0].favour > 0 && on.rows[0].favour === 0);
console.log(pass + " of " + n + " passed");
process.exit(pass === n ? 0 : 1);
