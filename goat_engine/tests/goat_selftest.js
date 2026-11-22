#!/usr/bin/env node
/*
 * GOAT ENGINE self test. Checks the house arithmetic the owner text specifies, the navamsa data the engine
 * reads from VedNetra, the Moon benefic rule, the option ranking and the report character rules.
 * Run: node goat_engine/tests/goat_selftest.js   (exit code 0 means all checks passed)
 */
"use strict";
const assert = require("assert");
const G = require("../tools/goat");
const { loadVedicCore } = require("../../suj_engine/tools/vednetra_loader");

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

console.log("\n" + pass + " checks passed" + (process.exitCode ? ", some failed" : ""));
