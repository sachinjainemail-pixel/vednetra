#!/usr/bin/env node
/* Self test of the SARVA orchestrator, round 26. Every wrong turn of the first SARVA table, Kundali 893, is a test here. No engine is run.
 *   node suj_engine/tests/sarva_selftest.js     prints N of N passed */
const fs = require("fs"), os = require("os"), path = require("path");
const T = require("../sarva/topics"), TB = require("../sarva/table");
let pass = 0, total = 0;
const ok = (name, cond) => { total++; if (cond) pass++; else console.log("FAIL " + name); };

const OPT = {
  1: ["इंटरमीडिएट", "MA", "MBA", "मेडिकल"], 2: ["अविवाहित", "पारंपरिक", "दूसरी जाति में", "दूसरे धर्म में"],
  3: ["निःसंतान", "एक पुत्र", "एक पुत्री", "एक पुत्र+एक पुत्री"], 5: ["गाड़ी का एक्सीडेंट हुआ?", "विवाह हुआ?", "संतान हुई?", "जेल हुई?"]
};
const chart = { id: "T", name: "Test chart", post: "शिक्षा इंटरमीडिएट MA MBA मेडिकल विवाह अविवाहित पारंपरिक दूसरी जाति में दूसरे धर्म में संतान निःसंतान एक पुत्र एक पुत्री एक पुत्र+एक पुत्री 10 दिसंबर 2024 को क्या घटना घटी गाड़ी का एक्सीडेंट हुआ? विवाह हुआ? संतान हुई? जेल हुई?",
  questions: [{ text: "1.जातक की शिक्षा", options: OPT[1] }, { text: "2.जातक का विवाह", options: OPT[2] }, { text: "3.संतान", options: OPT[3] }, { text: "5. 10 दिसंबर 2024 को जातक के जीवन में क्या घटना घटी?", options: OPT[5] }] };
chart.questions.forEach((q, i) => { q.no = i + 1; q.kind = T.classify(q); });
const [Q1, Q2, Q3, Q4] = chart.questions;
const cellOf = (q, pick, extra) => Object.assign({ pick, second: null, flags: [], tied: [] }, extra || {});
const full = over => {
  const c = {};
  TB.REG.columns.forEach(col => { c[col.id] = {}; chart.questions.forEach(q => { c[col.id][q.no] = col.mode === "report" ? { notRun: "report only" } : cellOf(q, q.options[0], q.kind.key === "dated" ? { fromReader: true, gates: { double: true, single: true } } : {}); }); });
  return over ? over(c) : c;
};
const errs = (cells, o) => TB.check(chart, chart.questions, cells, Object.assign({ sujRepo: path.join(__dirname, "..", "..") }, o || {}));

// topics and dates
ok("a question that names a date and asks what happened is dated", Q4.kind.key === "dated" && Q4.kind.date === "2024-12-10");
ok("the Hindi digits and months are read", T.dateIn("१० दिसंबर २०२४") === "2024-12-10" && T.dateIn("10.12.2024") === "2024-12-10" && T.dateIn("10 December 2024") === "2024-12-10");
ok("education, marriage and children are told apart", Q1.kind.key === "education" && Q2.kind.key === "marriage" && Q3.kind.key === "children");
ok("the display text holds none of the unwanted characters", !T.STYLE.test(T.display("अपना कार्य/व्यापार एक पुत्र+एक पुत्री (x) a-b: c;")) );

// the good table
ok("a complete table with picks from the options passes", errs(full()).length === 0);
const text = TB.render(chart, chart.questions, full());
ok("the table has no unwanted character and is in code fences", TB.styleErrors(text).length === 0 && /^```/.test(text));
ok("a column that is not run in every row is one line and not a block", /Other Vednetra skills not run, report only/.test(text) && !/Other Vednetra skills\s*\n=/.test(text));

// G1 verbatim, the options were translated or the pick is not an option
ok("G1 a translated pick fails", errs(full(c => { c.SJJ[2] = cellOf(Q2, "Traditional"); return c; })).some(e => /^G1/.test(e)));
const reworded = JSON.parse(JSON.stringify(chart)); reworded.questions[0].options[2] = "Master of Business Administration";
ok("G1 an option that is not in the owner's post fails", TB.check(reworded, reworded.questions, full(), { sujRepo: "." }).some(e => /not in the owner's post/.test(e)));

// G2 chained inference
ok("G2 a note that leans on another question fails", errs(full(c => { c.SUJ[3] = cellOf(Q3, "निःसंतान", { fromReader: true, note: "married from question 5, so childless", dependsOn: [] }); return c; })).some(e => /^G2/.test(e)));
ok("G2 the same note with the dependency declared passes and shows dep", (() => {
  const cell = TB.cellFor({ id: "SUJ", label: "SUJ", mode: "analyst" }, Q3, {}, { SUJ: { 3: { pick: "निःसंतान", note: "from question 5", dependsOn: [5] } } }, true);
  return cell.flags.includes("dep") && cell.flags.includes("no rule") && TB.check(chart, chart.questions, full(c => { c.SUJ[3] = cell; return c; }), { sujRepo: "." }).every(e => !/^G2/.test(e));
})());

// G4 dated question needs both gates
ok("G4 a dated pick that read only the double gate fails", errs(full(c => { c.SUJ[4] = cellOf(Q4, "विवाह हुआ?", { fromReader: true, gates: { double: true, single: false } }); return c; })).some(e => /^G4/.test(e)));
ok("G4 a dated pick with no record of the gates fails", errs(full(c => { c.CHW[4] = cellOf(Q4, "जेल हुई?", { fromReader: true }); return c; })).some(e => /^G4/.test(e)));

// G3, G5
ok("G3 an unknown flag fails", errs(full(c => { c.KPP[1] = cellOf(Q1, "MA", { flags: ["sure"] }); return c; })).some(e => /^G3/.test(e)));
ok("G5 a missing cell fails", errs(full(c => { delete c.POD[2]; return c; })).some(e => /^G5/.test(e)));

// G7 SUJ draft must pass the guard
const bad = path.join(os.tmpdir(), "sarva_bad_draft_" + process.pid + ".txt"); fs.writeFileSync(bad, "S0. INTAKE AND TIME FRAME\nnothing else\n");
ok("G7 a SUJ pick whose draft fails answer_guard.js fails", errs(full(c => { c.SUJ[1] = cellOf(Q1, "MBA", { fromReader: true, draft: bad }); return c; })).some(e => /^G7/.test(e)));
fs.unlinkSync(bad);

// cells, the engine never gets to look surer than it is
const col = id => TB.REG.columns.find(c => c.id === id);
ok("an automatic tie stays a tie and shows the tie flag", (() => { const c = TB.cellFor(col("POD"), Q2, { POD: { 2: { pick: "पारंपरिक", flags: ["tie"], tied: ["पारंपरिक", "दूसरी जाति में"] } } }, {}, false); return TB.cellText(c) === "पारंपरिक tie"; })());
ok("a reader override of an automatic tie is marked read and keeps the engine flags except the tie", (() => { const c = TB.cellFor(col("POD"), Q2, { POD: { 2: { pick: "पारंपरिक", flags: ["tie", "unmapped"] } } }, { POD: { 2: { pick: "दूसरे धर्म में" } } }, false); return c.pick === "दूसरे धर्म में" && c.flags.includes("read") && c.flags.includes("unmapped") && !c.flags.includes("tie"); })());
ok("a column with no pick and no reading says not run", TB.cellFor(col("SUJ"), Q1, {}, {}, false).notRun === "no reading");
ok("a no rule question flags every engine but the one that holds the rules", TB.cellFor(col("KPP"), Q2, { KPP: { 2: { pick: "पारंपरिक", flags: [] } } }, {}, true).flags.includes("no rule") && !TB.cellFor(col("SJJ"), Q2, { SJJ: { 2: { pick: "पारंपरिक", flags: [] } } }, {}, true).flags.includes("no rule"));

// score
const cells = full(c => { c.SJJ[1] = cellOf(Q1, "MA", { flags: ["tie"], tied: ["MA", "MBA"] }); c.KPP[1] = cellOf(Q1, "MBA"); c.POD[1] = cellOf(Q1, "MA", { second: "MBA" }); return c; });
const sc = TB.scoreCells(chart, cells, { 1: "MBA" });
ok("a tie that held the truth is a tie hit and not a hit", sc.SJJ.tieHit === 1 && sc.SJJ.hit === 0);
ok("a first pick equal to the truth is a hit, a second place is counted apart", sc.KPP.hit === 1 && sc.POD.hit === 0 && sc.POD.secondHit === 1);
ok("a column that was not run is not counted as wrong", sc.VSK.asked === 0 && sc.VSK.notRun === 1);

// seen, an engine that already holds the answers of the chart
const A = require("../sarva/adapters");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sarva_root_"));
fs.mkdirSync(path.join(tmp, "poddar-engine", "engine", "practice", "charts"), { recursive: true }); fs.writeFileSync(path.join(tmp, "poddar-engine", "engine", "practice", "charts", "777.json"), "{}");
fs.mkdirSync(path.join(tmp, "KP-Pro-sutton", "src", "kpredict", "backtest"), { recursive: true }); fs.writeFileSync(path.join(tmp, "KP-Pro-sutton", "src", "kpredict", "backtest", "dataset.py"), "x = _mk(777, 'dev')\n");
ok("seen finds a chart in the Poddar practice charts and in the KP Pro backtest", A.seen("POD", { number: 777 }, tmp) && A.seen("KPP", { number: 777 }, tmp));
ok("seen is false for a chart the engines have not met and for a chart with no number", !A.seen("POD", { number: 778 }, tmp) && !A.seen("KPP", { number: 778 }, tmp) && !A.seen("POD", {}, tmp));
const seenCells = full(c => { c.POD[1] = cellOf(Q1, "MBA", { flags: ["seen"] }); return c; });
ok("a seen cell is not scored", TB.scoreCells(chart, seenCells, { 1: "MBA" }).POD.hit === 0 && TB.scoreCells(chart, seenCells, { 1: "MBA" }).POD.seen === 1);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(pass + " of " + total + " passed");
process.exit(pass === total ? 0 : 1);
