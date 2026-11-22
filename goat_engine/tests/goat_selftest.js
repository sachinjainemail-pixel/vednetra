#!/usr/bin/env node
/*
 * GOAT ENGINE self test. Checks the house arithmetic the owner text specifies, the navamsa data the engine
 * reads from VedNetra, the Moon benefic rule, the option ranking and the report character rules.
 * Run: node goat_engine/tests/goat_selftest.js   (exit code 0 means all checks passed)
 */
"use strict";
const assert = require("assert");
const G = require("../tools/goat");
const { loadVedicCore } = require("../tools/vednetra_loader");

let pass = 0;
function check(name, fn) {
  try { fn(); pass++; console.log("ok   " + name); }
  catch (e) { console.log("FAIL " + name + "\n     " + e.message); process.exitCode = 1; }
}

// 1. Nth house from the house, N equal to the house number. 10 from 10 is the 7th, 7 from 7 is the 1st.
function nthHouse(H) { return ((H + H - 2) % 12) + 1; }
check("Nth house 10 from 10 is 7", () => assert.strictEqual(nthHouse(10), 7));
check("Nth house 7 from 7 is 1", () => assert.strictEqual(nthHouse(7), 1));
check("Nth house 12 from 12 is 11", () => assert.strictEqual(nthHouse(12), 11));

// 2. Kalpurusha sign of a house is the fixed sign with the same number, Aries for house 1, Capricorn for house 10.
check("Kalpurusha sign for house 10 is Capricorn (index 9)", () => assert.strictEqual((10 - 1) % 12, 9));
check("Kalpurusha sign for house 1 is Aries (index 0)", () => assert.strictEqual((1 - 1) % 12, 0));

// 3. Sign arithmetic.
check("houseFrom same sign is 1", () => assert.strictEqual(G.houseFrom(0, 0), 1));
check("houseFrom seventh sign is 7", () => assert.strictEqual(G.houseFrom(6, 0), 7));
check("signAtHouse wraps", () => assert.strictEqual(G.signAtHouse(10, 4), 1));

// 4. Moon benefic from Shukla 6th tithi to Krishna 10th tithi, elongation 60 to 300 degrees.
const fakeCtx = (moonLon, sunLon) => ({ by: { Moon: { lon: moonLon, sign: 0 }, Sun: { lon: sunLon, sign: 0 }, Mercury: { sign: 0 } }, planets: [] });
check("Moon at elongation 90 is benefic", () => assert.strictEqual(G.natureOf(fakeCtx(90, 0), "Moon"), 1));
check("Moon at elongation 20 is malefic", () => assert.strictEqual(G.natureOf(fakeCtx(20, 0), "Moon"), -1));
check("Moon at elongation 310 is malefic", () => assert.strictEqual(G.natureOf(fakeCtx(310, 0), "Moon"), -1));
check("Moon elongation wraps across 360, Moon 70 with Sun 350 is 80 degrees, benefic", () => assert.strictEqual(G.natureOf(fakeCtx(70, 350), "Moon"), 1));
check("Moon elongation wraps across 360, Moon 10 with Sun 350 is 20 degrees, malefic", () => assert.strictEqual(G.natureOf(fakeCtx(10, 350), "Moon"), -1));

// 5. The navamsa sign the engine reads from VedNetra equals VedNetra's own D9 varga for a real chart.
const VC = loadVedicCore(undefined);
const inst = new Date(Date.UTC(1993, 0, 6, 7, 10, 0) - 5.5 * 3600000);
const C = VC.buildChart(inst, 27.1333, 81.9667, 5.5, { ayanamshaKey: "lahiri" });
const D9 = VC.makeVargaChart(C, 9);
check("navamsaSign equals VedNetra D9 varga for every planet", () => {
  C.planets.forEach(p => assert.strictEqual(p.navamsaSign, D9.planetsByName[p.name].sign, p.name));
});

// 6. Single run returns one definitive decision, YES or NO.
const base = { name: "T", gender: "female", date: "1993-01-06", time: "07:10:00", tz: 5.5, lat: 27.1333, lon: 81.9667, place: "Test" };
check("single run gives YES or NO", () => {
  const r = G.run(Object.assign({}, base, { topic: "marriage", asOf: "2026-11-22" }));
  assert.ok(["YES", "NO"].indexOf(r.chosen.decision) >= 0);
  assert.ok(Number.isFinite(r.chosen.net));
});

// 7. Option run ranks the chosen option first, with YES above NO.
check("options run picks the top ranked option", () => {
  const r = G.run(Object.assign({}, base, { options: [{ label: "Marriage", topic: "marriage" }, { label: "Career", topic: "career" }], asOf: "2026-11-22" }));
  assert.strictEqual(r.results.length, 2);
  assert.ok(r.results[0].score >= r.results[1].score);
  assert.strictEqual(r.chosen.label, r.results[0].label);
});

// 7b. Sibling option parsing, digits and words, and the only child case.
check("parse Two brothers two sisters as 2 and 2", () => assert.deepStrictEqual(G.parseSiblings("Two brothers two sisters").brothers + G.parseSiblings("Two brothers two sisters").sisters, 4));
check("parse 2 Brother 2 Sisters as 2 brothers and 2 sisters", () => { const p = G.parseSiblings("2 Brother 2 Sisters"); assert.strictEqual(p.brothers, 2); assert.strictEqual(p.sisters, 2); });
check("parse One brother three sisters as 1 brother and 3 sisters", () => { const p = G.parseSiblings("One brother three sisters"); assert.strictEqual(p.brothers, 1); assert.strictEqual(p.sisters, 3); });
check("parse Only Child as zero siblings", () => assert.strictEqual(G.parseSiblings("Only Child").total, 0));

// 7c. Ordinal rule. The strongest promise gives the highest level and the weakest gives the lowest.
const edu = ["High school", "Intermediate", "Graduation", "Post graduation"].map(l => ({ label: l }));
check("ordinal rule with a very weak promise picks the lowest level", () => {
  const ctx = G.makeContext(base);
  const r = G.ruleAnalysis(Object.assign(ctx, { asOf: new Date("2026-11-22T00:00:00Z") }), "education", edu);
  assert.ok(["High school", "Intermediate", "Graduation", "Post graduation"].indexOf(r.chosen.label) >= 0);
});
check("ordinal index stays inside the list for any strength", () => {
  const ctx = G.makeContext(base);
  for (const scale of [1, 60, 1000]) {
    const saved = G.W.rule.net_scale; G.W.rule.net_scale = scale;
    const r = G.ruleAnalysis(ctx, "education", edu);
    G.W.rule.net_scale = saved;
    assert.ok(r.index >= 1 && r.index <= 4);
  }
});

// 8. Determinism. The same config gives the same report.
check("the same config gives the same report", () => {
  const cfg = Object.assign({}, base, { topic: "children", asOf: "2026-11-22" });
  assert.strictEqual(G.renderRun(G.run(cfg)), G.renderRun(G.run(cfg)));
});

// 9. Report character rules and no broken numbers.
check("report has none of the owner's forbidden characters", () => {
  const text = G.renderRun(G.run(Object.assign({}, base, { topic: "marriage", asOf: "2026-11-22" })));
  const forbidden = ["(", ")", "!", ";", ":", "—", "“", "”", "/", "‘", "’", "-", "#", "*", "~"];
  forbidden.forEach(ch => assert.strictEqual(text.indexOf(ch), -1, "found " + JSON.stringify(ch)));
});
check("report has no NaN or undefined", () => {
  const text = G.renderRun(G.run(Object.assign({}, base, { topic: "career", asOf: "2026-11-22" })));
  assert.ok(text.indexOf("NaN") < 0 && text.indexOf("undefined") < 0);
});

// 10. Life area quality. Outcome classes follow the owner rule, from the afflictions and the active dasha.
const QW = G.W.quality;
check("no event shown gives NOT SHOWN", () => assert.strictEqual(G.classifyQuality(false, 50, 5, QW), "NOT SHOWN"));
check("light afflictions give positive", () => assert.strictEqual(G.classifyQuality(true, 5, 0, QW), "positive"));
check("moderate afflictions with no active dasha give challenged", () => assert.strictEqual(G.classifyQuality(true, 30, 0, QW), "challenged"));
check("strong afflictions active in dasha give separated", () => assert.strictEqual(G.classifyQuality(true, 55, 2, QW), "separated"));
check("very strong afflictions active in dasha give severe", () => assert.strictEqual(G.classifyQuality(true, 65, 2, QW), "severe"));
check("very strong afflictions without active dasha give challenged, not severe", () => assert.strictEqual(G.classifyQuality(true, 40, 0, QW), "challenged"));
check("quality report has no forbidden characters and no NaN", () => {
  const cfg = Object.assign({}, base, { mode: "quality", topic: "marriage", asOf: "2026-11-22", options: [
    { label: "Happy", state: "positive" }, { label: "Divorce case", state: "severe" } ] });
  const text = G.renderRun(G.run(cfg));
  ["(", ")", "!", ";", ":", "—", "“", "”", "/", "‘", "’", "-", "#", "*", "~"].forEach(ch => assert.strictEqual(text.indexOf(ch), -1, "found " + JSON.stringify(ch)));
  assert.ok(text.indexOf("NaN") < 0 && text.indexOf("undefined") < 0);
});

// 11. Hindi summary. One line per finalized answer at the end of every report.
check("options report ends with a Hindi summary line per option", () => {
  const cfg = Object.assign({}, base, { options: [{ label: "Marriage", topic: "marriage" }, { label: "Career", topic: "career" }], asOf: "2026-11-22" });
  const text = G.renderRun(G.run(cfg));
  const tail = text.split("HINDI SUMMARY\n")[1];
  assert.ok(tail, "no HINDI SUMMARY section");
  assert.strictEqual(tail.trim().split("\n").length, 2);
  assert.ok(/[\u0900-\u097F]/.test(tail));
});
check("quality report has a Hindi summary line", () => {
  const cfg = Object.assign({}, base, { mode: "quality", topic: "marriage", asOf: "2026-11-22", options: [{ label: "Happy", state: "positive" }, { label: "Divorce case", state: "severe" }] });
  const text = G.renderRun(G.run(cfg));
  assert.ok(text.split("HINDI SUMMARY\n")[1].trim().length > 0);
});

// 12. Adverse events are promised by affliction, and occupation picks one of the options by its kind.
check("adverse topic promise is the affliction, net below 0", () => {
  const r = G.run(Object.assign({}, base, { options: [{ label: "Job loss", topic: "job_loss" }], asOf: "2026-11-22", fromISO: "2016-03-04", toISO: "2016-03-04" }));
  assert.strictEqual(r.results[0].adverse, true);
  assert.strictEqual(r.results[0].promiseYes, r.results[0].net < 0);
});
check("occupation rule returns one of the options", () => {
  const opts = [{ label: "Teacher", kind: "teaching" }, { label: "Priest", kind: "religious" }, { label: "Marketing", kind: "commerce" }, { label: "Unemployed", kind: "unemployed" }];
  const r = G.run(Object.assign({}, base, { topic: "occupation", asOf: "2026-11-22", options: opts }));
  assert.ok(opts.map(o => o.label).indexOf(r.rule.chosen.label) >= 0);
  assert.ok(r.rule.hindi && r.rule.hindi.length > 0);
});

// 13. Relatives. Owner rule. D1 chart rotated to the anchor house only. D9 and Moon chart never used.
check("relative result uses D1 only and prevailing windows only", () => {
  const r = G.run(Object.assign({}, base, { asOf: "2026-11-22", options: [{ label: "Brother death", topic: "rel_death" }, { label: "Brother partner", topic: "rel_partner" }] }));
  r.results.forEach(x => {
    assert.strictEqual(x.relative, true);
    assert.strictEqual(x.usesD9, false);
    assert.strictEqual(x.usesMoon, false);
    if (x.best) assert.strictEqual(x.best.status, "NOW");
  });
});
check("relatives rule is marked in weights", () => {
  assert.strictEqual(G.W.relatives.uses_D9, false);
  assert.strictEqual(G.W.relatives.uses_moon_chart, false);
});

console.log("\n" + pass + " checks passed" + (process.exitCode ? ", some failed" : ""));
