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
// round 14, subject varga and the three reference charts
const k2 = { gender: "female", date: "1991-11-07", time: "10:50:00", tz: 5.5, lat: 28.6139, lon: 77.2090, asOf: "2026-11-14", strict: true };
const cb = scan(Object.assign({}, k2, { event: "child_birth" }));
ok("Mercury enters the child birth significators from D7 house 5", cb.significators.indexOf("Mercury") >= 0 && cb.vargaReasons.some(x => /Mercury occupies the D7 house 5/.test(x)));
ok("windows say which reference chart passed", cb.windows.length > 0 && cb.windows.every(x => /Lagna|Moon|Sun/.test(x.via)));
ok("a Moon reference window exists", cb.windows.some(x => /Moon/.test(x.via)));
const off = scan(Object.assign({}, k2, { event: "child_birth", varga: false, refs: ["Lagna"] }));
ok("varga false and refs Lagna restore the earlier view", off.vargaReasons.length === 0 && off.windows.every(x => x.via === "Lagna"));
const one = scan(Object.assign({}, k2, { event: "child_birth", from: "2021-05-03", to: "2021-05-03", strict: false, gate: "single" })).windows;
ok("gate single widens the view, the 3 May 2021 child date is then reached via the Moon", one.length > 0 && one.some(x => /Moon/.test(x.via)));
console.log(pass + " of " + n + " passed");
process.exit(pass === n ? 0 : 1);
