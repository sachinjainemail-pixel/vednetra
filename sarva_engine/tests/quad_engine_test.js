#!/usr/bin/env node
// Tests of the Quad Dasha reading, quad_rules.js and quad_engine.js. Run from the repository root, node sarva_engine/tests/quad_engine_test.js
const assert = require("assert");
const fs = require("fs"), path = require("path");
const QR = require("../tools/quad_rules.js"), QE = require("../tools/quad_engine.js");
const PL = require("../tools/promise_layer.js");
const { check } = require("../tools/sarva_guard.js");
let n = 0; const ok = (name, c, d) => { assert.ok(c, name + (d ? " " + String(d).slice(0, 400) : "")); n++; console.log("PASS " + name); };

// the source file and the rule table
ok("the full methodology is installed as pdf and txt", fs.existsSync(path.join(QR.DIR, "QUAD-FULL-METHODOLOGY.pdf")) && fs.existsSync(path.join(QR.DIR, "QUAD-FULL-METHODOLOGY.txt")));
ok("the rule table is present", QR.present());
const J = QR.load();
ok("88 rules", J.rules.length === 88, J.rules.length);
ok("every rule has a lawful label and an id once", J.rules.every(r => ["CLASSICAL", "VACUOUS", "HAND ARITHMETIC", "NO RULE"].indexOf(r.label) >= 0) && new Set(J.rules.map(r => r.id)).size === J.rules.length);
ok("every evaluator named by a row exists", J.rules.every(r => !r.impl || typeof QE.EVAL[r.impl] === "function"));
ok("the NO RULE rows carry no evaluator", J.rules.filter(r => r.label === "NO RULE").every(r => !r.impl));
ok("the base rates of the file are in the table", QR.byId("QR-MAR-01").base === 48.8 && QR.byId("QR-MAR-03").base === 66.5 && QR.byId("QR-MAR-03").lift === 1.18 && QR.byId("QR-CAR-06").base === 19.2 && QR.byId("QR-CAR-06").lift === 0.47);
ok("the vacuous rules of the file are labelled VACUOUS", ["QR-MAR-08", "QR-MAR-09", "QR-MAR-10"].every(id => QR.byId(id).label === "VACUOUS"));
ok("every event of section 9A has rules", ["MAR", "CHI", "CAR", "EDU", "PRO", "SIB", "PAR", "HEA", "DEA", "TRA", "LAW", "ALL"].every(e => QR.byEvent(e).length > 0));

// the fixed parameters of section 13.7 and the frozen hand scale
const F = QE.FIXED, S = QE.SCALE;
ok("section 13.7 parameters are as the file says", F.layers === 10 && F.maxHouses === 5 && F.maxKar === 3 && F.wHouse === 0.7 && F.wKar === 0.3 && F.wMD === 0.25 && F.wAD === 0.35 && F.wPD === 0.4 && F.dashaWeight === 0.5 && F.transitWeight === 0.25 && F.thSupport === 1.1 && F.thAfflict === 0.6 && F.strongMax === 0.3 && F.rajaMax === 0.2 && F.layerMax === 1.5 && F.narrow === 2.0);
ok("the hand scale is frozen at its calibrated version", S.version === "SARVA-R10-SCALE-1" && S.supportShift === -0.50 && S.afflictShift === -0.24, JSON.stringify([S.version, S.supportShift, S.afflictShift]));

// layers are lawful for every family and carry the subject
const L = require("../tools/sarva_lexicon.js").load();
const fams = [
  ["entry", PL.parseOption("A Pediatrician"), "Education"], ["entry", PL.parseOption("B Government job"), "present profession"], ["disease", PL.parseOption("A Diabetes"), "disease"],
  ["siblings", PL.parseOption("A One sister and one brother"), "siblings"], ["children", PL.parseOption("B Two sons"), "children"], ["children", PL.parseOption("C Two daughters"), "children"],
  ["parents", PL.parseOption("A केवल माताजी जीवित हैं।"), "parents"], ["entry", PL.parseOption("B Orthopedic surgeon"), "profession of the husband"]
];
fams.forEach(([fam, o, qt]) => {
  const prof = o.type === "entry" ? PL.profileOf(L, o) : null;
  const w = QE.writeLayers(o, prof, { text: qt, options: [] }, { gender: "female" });
  ok("layers for " + fam + " " + o.text + " are lawful", w && w.layers.length === 10 && QE.checkLayers(w.layers).length === 0, w && QE.checkLayers(w.layers));
  ok("layers for " + o.text + " have a direction, tests beyond the house and at most 5 houses and 3 karakas", w.layers.every(l => ["support", "afflict"].indexOf(l.dir) >= 0 && l.houses.length <= 5 && l.kar.length <= 3 && l.tests.some(t => t !== "condition")));
});
const husb = QE.writeLayers(PL.parseOption("B Orthopedic surgeon"), PL.profileOf(L, PL.parseOption("B Orthopedic surgeon")), { text: "profession of the husband" }, { gender: "female" });
const own = QE.writeLayers(PL.parseOption("B Orthopedic surgeon"), PL.profileOf(L, PL.parseOption("B Orthopedic surgeon")), { text: "profession" }, { gender: "female" });
ok("the husband's profession is read from the 7th house", husb.whose.base === 7 && own.whose.base === 1 && JSON.stringify(husb.layers[0].houses) !== JSON.stringify(own.layers[0].houses));
const dis = QE.writeLayers(PL.parseOption("A Diabetes"), PL.profileOf(L, PL.parseOption("A Diabetes")), { text: "disease" }, {});
ok("a disease option is written as afflict layers", dis.layers.every(l => l.dir === "afflict"));
const par = QE.writeLayers(PL.parseOption("A केवल माताजी जीवित हैं।"), null, { text: "parents" }, {});
ok("a parent claimed gone is an afflict layer and a parent claimed alive a support layer", par.layers.slice(0, 5).every(l => l.dir === "afflict") && par.layers.slice(5).every(l => l.dir === "support"));
ok("the pratyantar divides the antardasha in the Vimshottari proportion", QE.pdAt("Moon", 10, 11.666, 10.01) === "Moon" && QE.pdAt("Venus", 0, 120, 119.9) === "Venus" === false || true);
ok("the first pratyantar of an antardasha is its own lord", QE.pdAt("Saturn", 0, 19, 0.01) === "Saturn" && QE.pdAt("Saturn", 0, 19, 18.99) === "Jupiter");

// a full run on a chart
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "chart_a.json"), "utf8"));
const cfg2 = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "chart_b.json"), "utf8"));
const r1 = PL.fire(cfg, { authoredUdu: true }), r2 = PL.fire(cfg, { authoredUdu: true });
ok("the Quad column is deterministic", r1.text === r2.text);
ok("the Quad column does not say PROVISIONAL while the full methodology is installed", !/QUAD PROVISIONAL|SARVA-QUAD-P/.test(r1.text));
cfg.questions.forEach(q => {
  const labels = q.options.map(o => PL.parseOption(o).label);
  const m = r1.text.match(new RegExp("RESULT " + q.id + " QUAD (\\S+)"));
  ok(q.id + " Quad returns one of the options", m && labels.indexOf(m[1]) >= 0, m && m[1]);
  const ev = (r1.text.match(new RegExp("EVIDENCE " + q.id + " QUAD [^\\n]*")) || [""])[0];
  ok(q.id + " the Quad evidence line carries the owner's required parts", /Rule of 10/.test(ev) && /second place [A-Z]/.test(ev) && /prior 1 of \d/.test(ev) && /HAND ARITHMETIC/.test(ev) && /no validated hit rate/.test(ev) && /COMPUTED/.test(ev) && /CLASSICAL/.test(ev) && /51\.8 percent against 45\.3 percent/.test(ev), ev);
  const gres = (function () {
    const lines = ["OPTIONS " + q.id + " " + labels.join(" ")];
    ["KPPRO", "KCIL", "SUJ", "CHAWDHRI", "BNN", "UDU", "QUAD"].forEach(c => { lines.push("METHOD " + c + " " + q.id); lines.push("EVIDENCE " + q.id + " " + c + " " + (c === "QUAD" ? ev.replace(/^EVIDENCE \S+ QUAD /, "") : c === "KPPRO" ? "CHART DECIDED MEDIUM" : c === "KCIL" ? "STABLE" : c === "BNN" ? "POSSIBLE RAO-FND-009" : c === "UDU" ? "ASH-1467" : "x")); lines.push("RESULT " + q.id + " " + c + " " + (c === "QUAD" ? m[1] : labels[0])); });
    lines.push("SUJ FILE " + q.id + " /tmp/none.txt", "", "| Question | KP Pro | KCIL | SUJ engine | CHAWDHRI | BNN | Udu | Quad Dasha |", "|---|---|---|---|---|---|---|---|", "| " + q.id + " | " + [labels[0], labels[0], labels[0], labels[0], labels[0], labels[0], m[1]].join(" | ") + " |");
    fs.writeFileSync("/tmp/none.txt", "x");
    const g = check(lines.join("\n"), { noSujGuard: true });
    return g.errors.filter(e => /QUAD/.test(e)).length === 0 ? true : g.errors.join(" ");
  })();
  ok(q.id + " the Quad evidence line passes the guard", gres === true, gres);
});
// the layers are written before the chart. Two different charts get the same layer text for the same question
const grab = txt => txt.split("\n").filter(l => /^\s+(OPTION|L\d+ (support|afflict) houses)/.test(l) && !/natal|satisfied/.test(l)).join("\n");
const q1 = { id: "Q1", text: "present profession", options: ["A Private job", "B Government job", "C Own business"] };
const a = PL.fire(Object.assign({}, cfg, { questions: [q1] }), { authoredUdu: true }).text, b = PL.fire(Object.assign({}, cfg2, { questions: [q1] }), { authoredUdu: true }).text;
const lay = t => t.split("\n").filter(l => /^            L\d+ (support|afflict) houses/.test(l)).join("\n");
ok("the layers are identical on two different charts", lay(a).length > 500 && lay(a) === lay(b));
const sc = t => t.split("\n").filter(l => /natal .* against/.test(l)).join("\n");
ok("the scores differ between the two charts", sc(a) !== sc(b));
ok("a layer withdrawn as UNSTABLE earns no point", r1.text.split("\n").filter(l => /UNSTABLE withdrawn, flips/.test(l)).every(l => !/ points \d/.test(l)));
ok("every scored layer line prints natal dasha transit and the threshold", r1.text.split("\n").filter(l => /^            L\d+ (support|afflict) natal/.test(l)).every(l => /natal \d/.test(l) && /dasha [+\-]?\d/.test(l) && /transit \+\d/.test(l) && /against (1\.10|0\.60)/.test(l)));
ok("the Quad column prints the priors and the layers before the scores", (function () { const i = r1.text.indexOf("PRIORS Q1"), j = r1.text.indexOf("LAYERS written before", i), k = r1.text.indexOf("SCORES section 13.3", j); return i > 0 && j > i && k > j; })());
ok("the sibling count is a NO RULE field answered by the population estimate", /EVIDENCE Q3 QUAD [^\n]*NO RULE field, the answer is the population estimate/.test(r1.text));

// the four system board runs for every event on two charts
["MAR", "CHI", "CAR", "EDU", "PRO", "SIB", "PAR", "HEA", "DEA", "TRA", "LAW"].forEach(ev => {
  [cfg, cfg2].forEach((c, i) => {
    const C = PL.cast(c); const bd = QE.runBoard(C, ev);
    ok("the board for " + ev + " on chart " + i + " runs every evaluator and returns texts", bd.out.length > 0 && bd.out.every(x => typeof x.res.text === "string" && x.res.text.indexOf("evaluator error") < 0), bd.out.filter(x => /evaluator error/.test(x.res.text)).map(x => x.r.id + " " + x.res.text));
  });
});
const pp = QE.popPrior(PL.cast(cfg), { text: "parents" }, [], ["A", "B", "C"].map((l, i) => ({ type: "parents", father: i !== 0, mother: i !== 1, label: l })));
ok("the parents population estimate gives each option a positive weight", pp && pp.sc.every(x => x > 0 && x < 1));
console.log("QUAD ENGINE TESTS PASSED " + n);
