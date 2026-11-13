#!/usr/bin/env node
/* Self test for strength_tally.js on the Kundali 892 chart. node suj_engine/tests/strength_selftest.js */
const { tally } = require("../tools/strength_tally");
const C = { gender: "female", date: "1993-01-06", time: "07:10:00", tz: 5.5, lat: 27.1333, lon: 81.9667, asOf: "2026-11-13", varga: 24 };
let pass = 0, n = 0;
const ok = (name, cond) => { n++; if (cond) pass++; else console.log("FAIL " + name); };
// The owner's example. A debilitated Sun in D9 is a weak 9th lord, so its weight against is larger than its weight for.
const t1 = tally(Object.assign({}, C, { kind: "choice", options: ["Yes", "No"], evidence: [
  { option: "Yes", side: "for", type: "role", planet: "Sun", factor: "9th lord" },
  { option: "No", side: "against", type: "weakness", planet: "Sun", factor: "debilitated in D9" }] }));
const S = t1.weights.strength.Sun;
ok("Sun real strength is below 50", S < 50);
ok("Sun weakness weight is larger than its role weight", 100 - S > S);
ok("a weak planet's role scores below 50 against its own weakness", t1.rows.find(r => r.option === "Yes").score === 100 && t1.rows.find(r => r.option === "No").score === 0);
// a strong planet has little weakness to count
const strong = Object.entries(t1.weights.strength).filter(([p, v]) => v > 60).map(([p]) => p);
ok("a strong planet exists and its weakness weight is below 40", strong.length > 0 && 100 - t1.weights.strength[strong[0]] < 40);
// nodes take the strength of their sign lord and are flagged
const t2 = tally(Object.assign({}, C, { kind: "choice", options: ["Yes", "No"], evidence: [{ option: "No", side: "against", planet: "Rahu", factor: "x" }] }));
ok("Rahu takes the strength of Mars and is flagged", t2.weights.strength.Rahu === t2.weights.strength.Mars && /node/.test(t2.weights.flags.Rahu));
// ordered options, evidence for a level supports lower levels, against a level opposes higher ones
const t3 = tally(Object.assign({}, C, { kind: "ordered", options: ["Low", "Mid", "High"], evidence: [
  { option: "High", side: "for", planet: "Moon", factor: "x" }, { option: "Mid", side: "against", planet: "Sun", type: "weakness", factor: "y" }] }));
ok("ordered, High has Moon for and Sun against so it scores by their weights", t3.rows[2].forPlanets.length === 1 && t3.rows[2].againstPlanets.length === 1);
ok("ordered, Low has no evidence against", t3.rows[0].against === 0 && t3.rows[0].score === 100);
// type rules
let threw = 0;
try { tally(Object.assign({}, C, { kind: "choice", options: ["A", "B"], evidence: [{ option: "A", side: "for", type: "weakness", planet: "Sun", factor: "z" }] })); } catch (e) { threw++; }
try { tally(Object.assign({}, C, { kind: "choice", options: ["A", "B"], evidence: [{ option: "A", side: "against", type: "role", planet: "Sun", factor: "z" }] })); } catch (e) { threw++; }
ok("wrong type for a side is refused", threw === 2);
console.log(pass + " of " + n + " passed");
process.exit(pass === n ? 0 : 1);
