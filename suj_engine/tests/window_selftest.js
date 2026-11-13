#!/usr/bin/env node
/* Self test for window_scan.js down to the Sookshma level, on Kundali 892. node suj_engine/tests/window_selftest.js */
const { scan } = require("../tools/window_scan");
const C = { gender: "female", date: "1993-01-06", time: "07:10:00", tz: 5.5, lat: 27.1333, lon: 81.9667, asOf: "2026-11-13", strict: true };
let pass = 0, n = 0;
const ok = (name, c) => { n++; if (c) pass++; else console.log("FAIL " + name); };
const m = scan(Object.assign({}, C, { event: "marriage" }));
const w = m.windows.find(x => x.start <= "2019-12-15" && x.end >= "2019-12-15");
ok("the marriage window of December 2019 is found at Pratyantardasha level", !!w && w.lords.join(" ") === "Rahu Mars Jupiter");
ok("it lists Sookshma significators with dates", !!w && w.sookshma.length >= 3 && w.sookshma.every(x => x.start && x.end && x.lord));
ok("every Sookshma run lies inside its window", m.windows.every(x => x.sookshma.every(q => q.start >= x.start && q.end <= x.end)));
ok("only Mahadasha, Antardasha and Pratyantardasha lords are kept per window, no Prana", m.windows.every(x => x.lords.length === 3 && x.prana === undefined));
ok("a Sookshma significator is a planet from the significator list", m.windows.every(x => x.sookshma.every(q => m.significators.indexOf(q.lord) >= 0)));
const f = scan(Object.assign({}, C, { event: "father_loss" }));
ok("father loss strict view still finds past windows", f.windows.filter(x => x.timeStatus === "PAST").length > 0);
console.log(pass + " of " + n + " passed");
process.exit(pass === n ? 0 : 1);
