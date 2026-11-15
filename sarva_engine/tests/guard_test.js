// Run with: node sarva_engine/tests/guard_test.js
const assert = require("assert");
const { check, METHODS } = require("../tools/sarva_guard");

function draft(o) {
  o = o || {};
  const res = o.res || { KPPRO: "B", KCIL: "B", SUJ: "C", CHAWDHRI: "B", BNN: "A" };
  const out = ["OPTIONS Q1 A B C D"];
  METHODS.forEach(c => {
    if (o.skip === c) return;
    out.push("METHOD " + c + " Q1", "EVIDENCE Q1 " + c + " counted evidence" + (c === "BNN" ? " POSSIBLE RAO-FND-009" : ""), "RESULT Q1 " + c + " " + res[c]);
  });
  out.push("SUJ FILE Q1 /tmp/none.txt");
  const cells = o.cells || [res.KPPRO, res.KCIL, res.SUJ, res.CHAWDHRI, res.BNN];
  out.push("", "| Question | " + (o.header || "KP Pro | KCIL | SUJ engine | CHAWDHRI | BNN") + " |", "|---|---|---|---|---|---|", "| Q1 | " + cells.join(" | ") + " |");
  if (o.after) out.push("", o.after);
  return out.join("\n");
}
const run = (d, o) => check(d, Object.assign({ noSujGuard: true, bnnPresent: false }, o));
// SUJ FILE existence is checked, so make the fixture exist
require("fs").writeFileSync("/tmp/none.txt", "x");

assert.deepStrictEqual(run(draft()).errors, [], "clean draft passes");
assert.ok(run(draft({ skip: "BNN" })).errors.some(e => /no METHOD BNN/.test(e)), "missing methodology fails");
assert.ok(run(draft({ res: { KPPRO: "Z", KCIL: "B", SUJ: "C", CHAWDHRI: "B", BNN: "A" } })).errors.some(e => /not one of the options/.test(e)), "option outside list fails");
assert.ok(run(draft({ header: "KP Pro | KCIL | SUJ engine | CHAWDHRI | Poddar" })).errors.some(e => /header/.test(e)), "wrong column fails");
assert.ok(run(draft({ cells: ["B", "A", "C", "B", "A"] })).errors.some(e => /Table cell/.test(e)), "table cell mismatch fails");
assert.ok(run(draft({ after: "Final thought" })).errors.some(e => /last block/.test(e)), "text after table fails");
assert.ok(run(draft() + "\nMETHOD POPPAR Q1").errors.length > 0, "sixth methodology fails");
const bnn = { KPPRO: "B", KCIL: "B", SUJ: "C", CHAWDHRI: "B", BNN: "NOT RUN BNN RULES MISSING" };
const r = run(draft({ res: bnn }));
assert.deepStrictEqual(r.errors, []); assert.ok(r.incomplete, "BNN missing text is incomplete not clean");
const bad = { KPPRO: "NOT RUN BNN RULES MISSING", KCIL: "B", SUJ: "C", CHAWDHRI: "B", BNN: "A" };
assert.ok(run(draft({ res: bad })).errors.length > 0, "missing text outside BNN fails");
assert.ok(run(draft({ res: bnn }), { bnnPresent: true }).errors.some(e => /rules are missing but/.test(e)), "missing text with the csv present fails");
const noId = draft().replace(" RAO-FND-009", "");
const noGrade = draft().replace(" POSSIBLE", "");
assert.deepStrictEqual(run(noId).errors, [], "no Rule ID needed when the csv is absent");
assert.ok(run(noId, { bnnPresent: true }).errors.some(e => /Rule ID/.test(e)), "BNN evidence without a Rule ID fails when the csv is present");
assert.ok(run(noGrade, { bnnPresent: true }).errors.some(e => /grade/.test(e)), "BNN evidence without a grade fails when the csv is present");
assert.deepStrictEqual(run(draft(), { bnnPresent: true }).errors, [], "clean draft passes with the csv present");
console.log("sarva guard tests passed");
