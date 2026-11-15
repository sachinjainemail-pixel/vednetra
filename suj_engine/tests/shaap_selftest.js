#!/usr/bin/env node
/* Self test for the shaap scan, knowledge base 3, round 23. Synthetic frames test each rule of the owner on its own, then one real chart checks the plumbing.
 *   node suj_engine/tests/shaap_selftest.js     prints N of N passed */
const S = require("../tools/shaap_scan");
let pass = 0, total = 0;
const ok = (name, c, extra) => { total++; if (c) pass++; else console.log("FAIL " + name + (extra ? " " + JSON.stringify(extra) : "")); };
const NAMES = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
// signs are 0 Aries to 11 Pisces. pos gives a sign for every planet, over gives retrograde, combust. Rahu and Ketu are given by Rahu, Ketu is set 6 signs away.
function frame(L, pos, over, opts) {
  const specs = {};
  NAMES.forEach(n => { specs[n] = Object.assign({ sign: pos[n] }, (over || {})[n] || {}); });
  if (pos.Ketu === undefined) specs.Ketu.sign = (pos.Rahu + 6) % 12;
  return S.makeFrame("D1", L, specs, opts || { nodeAspects: "7" });
}
const base = { Sun: 4, Moon: 1, Mars: 3, Mercury: 3, Jupiter: 11, Venus: 7, Saturn: 10, Rahu: 2 };
const run = (f, gulika) => { if (gulika) f.gulika = gulika; return S.shaapOfFrame(f, null); };

// 1 pitru formed, Sun joined by Rahu, and the 9th house sits under Ketu
{ const r = run(frame(0, Object.assign({}, base, { Sun: 2, Rahu: 2 })));
  ok("pitru FORMED when Sun is joined by Rahu and the 9th is influenced", r.pitru.status === "FORMED" && r.pitru.strong === true, { st: r.pitru.status, miss: r.pitru.missing }); }
// 2 pitru without any house link stays an indication
{ const r = run(frame(1, Object.assign({}, base, { Sun: 2, Rahu: 2, Saturn: 10, Venus: 9 })));
  ok("pitru is only an INDICATION when no house link exists", r.pitru.status === "INDICATION" && /house link/.test(r.pitru.missing.join(" ")), { st: r.pitru.status, miss: r.pitru.missing }); }
// 3 pitru without Rahu: Sun with Saturn in the 5th, the nodes far away
{ const r = run(frame(1, Object.assign({}, base, { Sun: 5, Saturn: 5, Rahu: 0 })));
  ok("pitru with Saturn but no node is an INDICATION and says Rahu is missing", r.pitru.status === "INDICATION" && /no Rahu/.test(r.pitru.missing.join(" ")), { st: r.pitru.status, miss: r.pitru.missing }); }
// 4 no sign makes a shaap: Pisces Lagna, four planets in Pisces, nothing touching them
{ const r = run(frame(11, { Sun: 11, Moon: 11, Mars: 3, Mercury: 11, Jupiter: 11, Venus: 1, Saturn: 6, Rahu: 2 }));
  ok("a stellium in Pisces with no node or Saturn link forms no shaap of Sun, Moon or Jupiter", ["pitru", "matru", "brahma", "sarpa"].every(id => r[id].status === "NONE"), Object.fromEntries(["pitru", "matru", "brahma", "sarpa"].map(id => [id, r[id].status]))); }
// 5 matru: Moon joined by Ketu and the 4th afflicted. Lagna Aries, 4th house Cancer, Saturn aspects it from Libra
{ const r = run(frame(0, Object.assign({}, base, { Moon: 7, Rahu: 1, Saturn: 6, Mars: 11 })));
  ok("matru FORMED with Moon joined by Ketu and the 4th under Saturn", r.matru.status === "FORMED", { st: r.matru.status, miss: r.matru.missing, atoms: r.matru.atoms.filter(a => a.ok).map(a => a.id) }); }
// 5b matru: an afflicted 4th without the eclipse conjunction is not even an indication
{ const r = run(frame(0, Object.assign({}, base, { Moon: 9, Rahu: 1, Saturn: 6, Mars: 3 })));
  ok("an afflicted 4th without the Moon node conjunction is NONE for matru", r.matru.status === "NONE", { st: r.matru.status }); }
// 6 brahma: Jupiter joined by Rahu in the 9th, and combust is the heaviest form
{ const r = run(frame(0, Object.assign({}, base, { Jupiter: 8, Rahu: 8 }), { Jupiter: { combust: true } }));
  ok("brahma FORMED when Jupiter joins Rahu in the 9th, heaviest when combust", r.brahma.status === "FORMED" && r.brahma.atoms.find(a => a.id === "A").ok, { st: r.brahma.status }); }
// 7 brahma, nicha Jupiter in the 2nd needs Rahu on Jupiter for the node pillar. Sagittarius Lagna, Capricorn is the 2nd
{ const a = run(frame(8, Object.assign({}, base, { Jupiter: 9, Rahu: 3 }))), b = run(frame(8, Object.assign({}, base, { Jupiter: 9, Rahu: 0, Saturn: 10 })));
  ok("brahma nicha route is FORMED with Rahu aspecting Jupiter and an INDICATION without Rahu", a.brahma.status === "FORMED" && b.brahma.status === "INDICATION", { a: a.brahma.status, b: b.brahma.status }); }
// 8 pret by Gulika. Gulika alone is not enough, it needs a Moon, Saturn or Rahu relation and a dusthana or badhaka house
{ const lone = run(frame(0, Object.assign({}, base, { Saturn: 4, Moon: 5, Rahu: 0 })), { sign: 7, house: 8, nakLord: "Mars", nakshatra: "Anuradha", pada: 1 });
  ok("Gulika alone in the 8th, related to no Moon, Saturn or Rahu, is not a pret shaap", lone.pret.status === "NONE" && lone.pret.atoms.find(a => a.id === "G2").ok === true, { st: lone.pret.status, atoms: lone.pret.atoms.filter(a => a.ok).map(a => a.id) });
  const rel = run(frame(0, Object.assign({}, base, { Saturn: 4, Moon: 5, Rahu: 0 })), { sign: 7, house: 8, nakLord: "Saturn", nakshatra: "Anuradha", pada: 1 });
  ok("Gulika in the 8th in a nakshatra of Saturn is related to Saturn, and Gulika is the carrier, so pret is FORMED", rel.pret.status === "FORMED" && rel.pret.p1by.indexOf("Gulika") >= 0, { st: rel.pret.status, miss: rel.pret.missing });
  const off = run(frame(2, Object.assign({}, base, { Rahu: 0 })), { sign: 5, house: 4, nakLord: "Saturn", nakshatra: "Pushya", pada: 1 });
  ok("the same relation with Gulika outside the dusthana and the badhaka house forms nothing", off.pret.status === "NONE", { st: off.pret.status }); }
// 9 dev: Ketu aspecting the 5th lord is not a connection, Ketu joined is
{ const asp = run(frame(0, Object.assign({}, base, { Sun: 4, Rahu: 1 }))), con = run(frame(0, Object.assign({}, base, { Sun: 6, Rahu: 0 })));
  ok("dev needs Ketu by conjunction with a lord of the 5th or 9th", !asp.dev.atoms.find(a => a.id === "KE5").ok && con.dev.atoms.find(a => a.id === "KE5").ok, { asp: asp.dev.atoms.filter(a => a.ok).map(a => a.id), con: con.dev.atoms.filter(a => a.ok).map(a => a.id) }); }
// 10 combine rule
{ const c = S.combine;
  ok("D1 and D9 both give FORMED FULL, D1 only gives HALF, D9 only is not a shaap", c({ status: "FORMED" }, { ruleEvidence: true }) === "FORMED FULL" && c({ status: "FORMED" }, { ruleEvidence: false }) === "FORMED HALF" && /^D9 ONLY/.test(c({ status: "NONE" }, { ruleEvidence: true })) && c({ status: "INDICATION" }, { ruleEvidence: false }) === "INDICATION"); }
// 11 node aspects, the owner accepts the 7th, Vednetra adds the 5th and 9th
{ ok("node aspect set is the 7th by default and 5th 7th 9th on request", JSON.stringify(S.aspectSet("Rahu", "7")) === "[7]" && JSON.stringify(S.aspectSet("Ketu", "vednetra")) === "[5,7,9]" && JSON.stringify(S.aspectSet("Saturn", "7")) === "[3,7,10]"); }
// 12 badhaka house
{ const f = L => S.badhaka(frame(L, base));
  ok("badhaka house is the 11th for a movable Lagna, the 9th for a fixed one, the 7th for a dual one", f(0).house === 11 && f(1).house === 9 && f(2).house === 7 && f(0).lord === "Saturn" && f(2).lord === "Jupiter", { a: f(0), b: f(1), c: f(2) }); }
// 13 shapit Shani, conjunction in the 3rd reverses the order of harm
{ const f1 = frame(0, Object.assign({}, base, { Saturn: 2, Rahu: 2 })), f9 = frame(0, Object.assign({}, base, { Saturn: 2, Rahu: 2 }));
  const chart = { planetsByName: { Saturn: { nakLord: "Mercury" }, Rahu: { nakLord: "Jupiter" } } };
  const r = S.shapitShani(f1, f9, chart, { MD: "Saturn" });
  ok("shapit Shani in the 3rd is reversed, the occupied house comes last in harm and the 9th, 10th aspect houses first", r.present && r.reversal === true && r.rows[r.rows.length - 1].house === 3 && r.d9Repeated === true && r.dasha.length === 1, r);
  const g = frame(0, Object.assign({}, base, { Saturn: 4, Rahu: 4 }));
  const r2 = S.shapitShani(g, null, chart, {});
  ok("shapit Shani in the 5th is not reversed and the occupied house is hurt first", r2.present && !r2.reversal && r2.rows[0].house === 5 && r2.rows[1].house === 11, r2.rows.map(x => x.house));
  const none = S.shapitShani(frame(0, Object.assign({}, base, { Saturn: 10, Rahu: 2 })), null, chart, {});
  ok("no shapit Shani when Saturn and Rahu are unrelated", none.present === false); }
// 14 a real chart, plumbing only, Kundali 892 as of 2026-11-15
{ const cfg = { gender: "female", date: "1993-01-06", time: "07:10:00", tz: 5.5, lat: 27.1333, lon: 81.9667, asOf: "2026-11-15", topic: "children" };
  const a = S.scan(cfg), b = S.scan(cfg);
  ok("scan is deterministic", JSON.stringify(a.types) === JSON.stringify(b.types) && S.lineFor(a) === S.lineFor(b));
  ok("all nine types are reported with a status and a combined verdict", S.TYPES.length === 9 && S.TYPES.every(id => a.types[id] && /^(FORMED|INDICATION|NONE)$/.test(a.types[id].d1.status) && a.types[id].combined));
  ok("the dashboard line starts with SHAAP SCAN and names a status word", /^SHAAP SCAN /.test(S.lineFor(a)) && /FORMED|INDICATION/.test(S.lineFor(a)));
  ok("dasha now agrees with Vednetra, Jupiter Mercury Rahu", a.dashaNow.MD === "Jupiter" && a.dashaNow.AD === "Mercury" && a.dashaNow.PD === "Rahu", a.dashaNow);
  ok("a window marked PAST ends before the as of date and FUTURE starts after it", S.TYPES.every(id => !a.types[id].dasha || a.types[id].dasha.windows.every(w => w.status !== "PAST" || w.end <= new Date("2026-11-15")) && a.types[id].dasha.windows.every(w => w.status !== "FUTURE" || w.start >= new Date("2026-11-15"))));
  ok("topic links give the types read for children, sarpa brahma dev", JSON.stringify(S.topicTypes("children")) === JSON.stringify(["sarpa", "brahma", "dev"]), S.topicTypes("children"));
  ok("Gulika is computed by Vednetra for the chart", a.gulika.available && a.gulika.sign === "Pisces" && a.gulika.house === 4, a.gulika); }
console.log(pass + " of " + total + " passed");
process.exit(pass === total ? 0 : 1);
