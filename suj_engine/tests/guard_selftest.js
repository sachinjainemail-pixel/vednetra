#!/usr/bin/env node
/* Self test for answer_guard.js version 2. Builds one good draft and several bad ones and checks the verdicts.
 *   node suj_engine/tests/guard_selftest.js     prints N of N passed */
const { check } = require("../tools/answer_guard");
const OPTS = ["Graduation", "Post graduation", "Intermediate", "High school"];
const base = (over) => {
  const o = Object.assign({
    rules: "RULES CITED S-N04-009 for Moon in Rohini, the library holds no rule on the event itself",
    scan: "WINDOW SCAN strict view found 6 past windows, 2 grade A, weighed against the dasha chain",
    tally: "EVIDENCE TALLY Graduation 4, Post graduation 7, Intermediate 1, High school 0",
    counter: "COUNTER EVIDENCE Mars the fifth lord is retrograde in an enemy sign and the D24 lagna lord is in the 12th house",
    tie: "", final: "FINAL ANSWER Post graduation", extra: ""
  }, over || {});
  return ["S0. INTAKE AND TIME FRAME", "x", "S1. DOMINANT HOUSE", "x", "S2. D1 ANALYSIS", o.rules, "S3. D9 ANALYSIS", "x",
    "S4. SUBJECT DIVISIONAL CHART ANALYSIS", "x", "S5. PLANET STRENGTH AND CONFLICT RESOLUTION", "x",
    "S6. DASHA AND TIME STATUS", o.scan, "TIME STATUS ALREADY HAPPENED done", "S7. TRANSIT VALIDATION", "x",
    "S8. RECONCILIATION OF SECTIONS", o.tally, o.counter, o.tie, o.extra, "S9. SUMMARY", "recap", o.final,
    "• Chart evidence points to the fifth house chain", "• Final answer Post graduation"].filter(x => x !== "").join("\n");
};
const cases = [
  ["good draft passes", base(), true],
  ["tally leader differs from final answer", base({ final: "FINAL ANSWER Graduation", }), false, /highest is 7/],
  ["missing counter evidence", base({ counter: "" }), false, /COUNTER EVIDENCE/],
  ["missing tally", base({ tally: "" }), false, /EVIDENCE TALLY/],
  ["tally missing an option", base({ tally: "EVIDENCE TALLY Graduation 4, Post graduation 7, Intermediate 1" }), false, /every option/],
  ["tie without tie break", base({ tally: "EVIDENCE TALLY Graduation 7, Post graduation 7, Intermediate 1, High school 0" }), false, /TIE BREAK/],
  ["tie with tie break passes", base({ tally: "EVIDENCE TALLY Graduation 7, Post graduation 7, Intermediate 1, High school 0", tie: "TIE BREAK step 6 dasha activity favours the higher level" }), true],
  ["typicality reasoning", base({ extra: "Graduation is the most common outcome so it is the safe choice" }), false, /typicality/],
  ["missing rules cited", base({ rules: "plain" }), false, /RULES CITED/],
  ["missing window scan", base({ scan: "plain" }), false, /WINDOW SCAN/],
  ["hedging still fails", base({ extra: "this cannot be determined" }), false, /Hedging/]
];
let pass = 0;
cases.forEach(([name, text, ok, re]) => {
  const r = check(text, { options: OPTS });
  const good = r.ok === ok && (ok || !re || r.errors.some(e => re.test(e)));
  if (good) pass++; else console.log("FAIL " + name + " ok=" + r.ok + " " + JSON.stringify(r.errors));
});
console.log(pass + " of " + cases.length + " passed");
process.exit(pass === cases.length ? 0 : 1);
