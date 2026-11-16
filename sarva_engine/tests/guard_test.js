// Run with: node sarva_engine/tests/guard_test.js
const assert = require("assert");
const fs = require("fs");
const { check, METHODS, NOT_RUN } = require("../tools/sarva_guard");

const EVID = { KCIL: " STABLE", KPPRO: " CHART DECIDED MEDIUM", BNN: " POSSIBLE RAO-FND-009", UDU: " ASH-1467", QUAD: " COMPUTED" };
const BASE = { KPPRO: "B", KCIL: "B", SUJ: "C", CHAWDHRI: "B", BNN: "A", UDU: "B", QUAD: "C" };
fs.writeFileSync("/tmp/none.txt", "x");

function draft(o) {
  o = o || {};
  const res = Object.assign({}, BASE, o.res || {});
  const out = ["OPTIONS Q1 A B C D"];
  METHODS.forEach(c => {
    if (o.skip === c) return;
    out.push("METHOD " + c + " Q1", "EVIDENCE Q1 " + c + " counted evidence" + (o.noEvid ? "" : (EVID[c] || "")), "RESULT Q1 " + c + " " + res[c]);
  });
  out.push("SUJ FILE Q1 /tmp/none.txt");
  const cells = o.cells || METHODS.map(c => res[c]);
  out.push("", "| Question | " + (o.header || "KP Pro | KCIL | SUJ engine | CHAWDHRI | BNN | Udu | Quad Dasha") + " |",
    "|---|---|---|---|---|---|---|---|", "| Q1 | " + cells.join(" | ") + " |");
  if (o.after) out.push("", o.after);
  return out.join("\n");
}
const ALL = { KCIL: true, KPPRO: true, BNN: true, UDU: true, QUAD: true }, NONE = { KCIL: false, KPPRO: false, BNN: false, UDU: false, QUAD: false };
const run = (d, present) => check(d, { noSujGuard: true, present: present || ALL });

assert.deepStrictEqual(run(draft()).errors, [], "clean draft passes with all sources present");
assert.ok(run(draft({ skip: "UDU" })).errors.some(e => /no METHOD UDU/.test(e)), "missing methodology fails");
assert.ok(run(draft({ res: { QUAD: "Z" } })).errors.some(e => /not one of the options/.test(e)), "option outside list fails");
assert.ok(run(draft({ header: "KP Pro | KCIL | SUJ engine | CHAWDHRI | BNN | Udu | Poddar" })).errors.some(e => /header/.test(e)), "wrong column fails");
assert.ok(run(draft({ header: "KP Pro | KCIL | SUJ engine | CHAWDHRI | BNN" , cells: ["B", "B", "C", "B", "A"] })).errors.some(e => /header/.test(e)), "old five column table fails");
assert.ok(run(draft({ cells: ["B", "A", "C", "B", "A", "B", "C"] })).errors.some(e => /Table cell/.test(e)), "table cell mismatch fails");
assert.ok(run(draft({ after: "Final thought" })).errors.some(e => /last block/.test(e)), "text after table fails");
assert.ok(run(draft() + "\nMETHOD POPPAR Q1").errors.length > 0, "eighth methodology fails");

// not run handling, per source
["BNN", "UDU", "QUAD"].forEach(c => {
  const d = draft({ res: { [c]: NOT_RUN(c) } });
  const absent = Object.assign({}, ALL, { [c]: false });
  const r = run(d, absent);
  assert.deepStrictEqual(r.errors, [], c + " not run is allowed while its source is absent");
  assert.ok(r.incomplete, c + " not run marks the reply incomplete");
  assert.ok(run(d, ALL).errors.some(e => /rules are missing but/.test(e)), c + " not run fails while its source is present");
});
assert.ok(run(draft({ res: { KPPRO: NOT_RUN("KPPRO") } }), NONE).errors.length > 0, "not run in a core column fails");
assert.ok(run(draft({ res: { BNN: NOT_RUN("UDU") } }), NONE).errors.length > 0, "wrong not run text fails");

// evidence requirements apply only while the source is present
assert.ok(run(draft().replace(" RAO-FND-009", "")).errors.some(e => /BNN.*Rule ID/.test(e)), "BNN needs a rule id");
assert.ok(run(draft().replace(" POSSIBLE", "")).errors.some(e => /BNN.*grade/.test(e)), "BNN needs a grade");
assert.ok(run(draft().replace(" ASH-1467", "")).errors.some(e => /UDU.*Rule ID/.test(e)), "UDU needs a rule id");
assert.ok(run(draft().replace(" COMPUTED", "")).errors.some(e => /QUAD.*confidence/.test(e)), "QUAD needs a confidence word");
assert.ok(run(draft().replace(" CHART DECIDED", "")).errors.some(e => /KPPRO.*CHART DECIDED/.test(e)), "KPPRO needs a basis word");
assert.ok(run(draft().replace(" STABLE", "")).errors.some(e => /KCIL.*STABLE/.test(e)), "KCIL needs a determinacy mark");
assert.ok(run(draft().replace(" STABLE", " TWO CANDIDATES")).errors.length === 0, "KCIL two candidates mark is allowed");
assert.ok(run(draft().replace(" MEDIUM", "")).errors.some(e => /KPPRO.*confidence/.test(e)), "KPPRO needs a confidence word");
assert.ok(run(draft({ res: { KPPRO: "A" } })).errors.length === 0, "KPPRO prior dominant answer is allowed");
assert.deepStrictEqual(run(draft({ noEvid: true }), NONE).errors, [], "no source specific evidence is needed while sources are absent");

console.log("sarva guard tests passed");
