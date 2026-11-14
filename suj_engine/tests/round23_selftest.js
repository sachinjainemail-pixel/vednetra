#!/usr/bin/env node
/* Self test for the round 23 changes. node suj_engine/tests/round23_selftest.js */
const fs = require("fs"), path = require("path");
const { tally } = require("../tools/strength_tally");
const { readings } = require("../tools/child_sex");
let pass = 0, n = 0;
const ok = (name, c) => { n++; if (c) pass++; else console.log("FAIL " + name); };
const ev = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "events.json"), "utf8"));
ok("native_death preset has the 8th and the maraka houses and Saturn", ev.native_death && ev.native_death.houses.join() === "8,2,7" && ev.native_death.karakas[0] === "Saturn");
const base = { gender: "male", date: "1983-01-29", time: "14:45:00", tz: 5.5, lat: 19.076, lon: 72.8777, kind: "choice", options: ["Death", "Foreign travel"],
  evidence: [{ option: "Death", side: "for", type: "role", planet: "Jupiter", factor: "8th lord" }, { option: "Death", side: "against", type: "harm", planet: "Saturn", capacity: true, factor: "strong longevity karaka" }, { option: "Foreign travel", side: "for", type: "role", planet: "Saturn", factor: "9th lord" }] };
const a = tally(Object.assign({}, base, { statusEvent: true })), b = tally(base);
const sc = (r, o) => r.rows.find(x => x.option === o).score;
ok("capacity entry dropped under statusEvent", a.droppedCapacity.length === 1 && b.droppedCapacity.length === 0);
ok("dropping the capacity entry raises the death score", sc(a, "Death") > sc(b, "Death"));
const r = readings({ gender: "male", date: "1983-01-29", time: "14:45:00", tz: 5.5, lat: 19.076, lon: 72.8777 });
ok("Kundali 5 sign parity leans daughters and planet gender leans sons", r.parity.leans === "daughters" && r.planetGender.leans === "sons");
console.log(pass + " of " + n + " passed");
process.exit(pass === n ? 0 : 1);
