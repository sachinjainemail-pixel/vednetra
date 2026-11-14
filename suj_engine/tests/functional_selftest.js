#!/usr/bin/env node
/* Self test for functional_nature.js on Kundali 892, Sagittarius Lagna. node suj_engine/tests/functional_selftest.js */
const { nature } = require("../tools/functional_nature");
const r = nature({ gender: "female", date: "1993-01-06", time: "07:10:00", tz: 5.5, lat: 27.1333, lon: 81.9667, asOf: "2026-11-13" });
let pass = 0, n = 0;
const ok = (name, c) => { n++; if (c) pass++; else console.log("FAIL " + name); };
ok("Sun and Mars are yogakarakas by the library's test", r.yogakarakas.indexOf("Sun") >= 0 && r.yogakarakas.indexOf("Mars") >= 0);
ok("Venus is a trishadayesha with dosha type 1", r.rows.Venus.trishaday.length === 2 && r.rows.Venus.dosha1.length === 2);
ok("Jupiter and Mercury carry a triggered kendradhipatya dosha", r.rows.Jupiter.triggered && r.rows.Mercury.triggered);
ok("Saturn in its own sign is not a kendra owner so no dosha 2", !r.rows.Saturn.dosha2);
ok("Rahu alone in the 12th is sama but vyayakaraka", r.nodes.Rahu.houseVerdict.indexOf("sama but vyayakaraka") === 0 && r.nodes.Rahu.companions.length === 0);
ok("Rahu doubles the result of Mars, the lord of the 12th", r.nodes.Rahu.doubles === "Mars");
ok("Ketu in the 6th with the Moon uses the house verdict, papi", r.nodes.Ketu.houseVerdict === "papi" && r.nodes.Ketu.basis.indexOf("LP-058-3") >= 0);
ok("No nodal yogakaraka here", !r.nodes.Rahu.yogakaraka && !r.nodes.Ketu.yogakaraka);
ok("all five dasha levels are returned", r.dasha.length === 5);
console.log(pass + " of " + n + " passed");
process.exit(pass === n ? 0 : 1);
