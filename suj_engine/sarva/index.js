#!/usr/bin/env node
"use strict";
/* SARVA, the all methodology comparison. Round 26.
 *
 *   node suj_engine/sarva/index.js run   chart.json --out DIR [--asof YYYY-MM-DD]     runs every engine in the back end, writes dossiers and picks.template.json
 *   node suj_engine/sarva/index.js table chart.json --out DIR [--picks picks.json]    validates and prints THE TABLE, which is the whole reply, nothing else
 *   node suj_engine/sarva/index.js score chart.json --out DIR --truths truths.json    scores every column against the true answers and keeps the running scoreboard
 *
 * chart.json  { "id","number","name","gender","date","time","tz","lat","lon","place", "post": "the owner's raw text, optional", "questions": [{ "text", "options": [...] }] }
 * The options are copied from the owner's text and never translated or reordered. If post is given the tool checks that each option is in it.
 * picks.json  { "SUJ": { "1": { "pick": "MBA", "flags": [], "note": "", "dependsOn": [], "gates": { "double": true, "single": true }, "draft": "path" } }, "CHW": {...}, "VKP": {...}, "POD": { overrides for ties } }
 * truths.json { "1": "MBA", "2": "..." } with the owner's option text.
 * Nothing is written into a repository except the scoreboard suj_engine/cases/sarva_scores.json, and only by score.
 */
const fs = require("fs"), path = require("path");
const T = require("./topics"), A = require("./adapters"), TB = require("./table");
const SUJ = path.join(__dirname, "..", "..");

function arg(name, def) { const i = process.argv.indexOf("--" + name); return i >= 0 ? process.argv[i + 1] : def; }
function load(file) {
  const chart = JSON.parse(fs.readFileSync(file, "utf8"));
  // truths, when the owner's post already carries the true answers, are shown beside the engines and can be used by score. A reader who has seen them cannot read blind.
  if (arg("truths") && fs.existsSync(arg("truths")) && process.argv[2] === "table" && process.argv.includes("--show-truths")) chart.truths = JSON.parse(fs.readFileSync(arg("truths"), "utf8"));
  chart.questions.forEach((q, i) => { q.no = i + 1; q.kind = T.classify(q); });
  return chart;
}
function root() { return path.resolve(process.env.SARVA_ROOT || path.join(SUJ, TB.REG.root)); }
const today = () => new Date().toISOString().slice(0, 10);
function noRule(q) {
  const NR = JSON.parse(fs.readFileSync(path.join(SUJ, "suj_engine", "data", "no_rule_topics.json"), "utf8")).topics;
  const text = q.text + " " + q.options.join(" ");
  return NR.some(t => new RegExp(t.pattern, "i").test(text));
}

function cmdRun(file) {
  const chart = load(file), out = arg("out"), asOf = arg("asof", today());
  if (!out) throw new Error("give --out DIR, a folder outside every repository");
  fs.mkdirSync(out, { recursive: true });
  const R = root();
  const pre = TB.check(chart, chart.questions, Object.fromEntries(TB.REG.columns.map(c => [c.id, Object.fromEntries(chart.questions.map(q => [q.no, { notRun: "pending" }]))])), { sujRepo: SUJ }).filter(e => /^G1 option not|fewer than two/.test(e));
  if (pre.length) { console.error(pre.join("\n")); process.exit(1); }
  const ctx = (repo, extra) => Object.assign({ chart, qs: chart.questions, repo: path.join(R, repo), work: out, asOf, root: R }, extra || {});
  const auto = {};
  TB.REG.columns.filter(c => c.mode === "auto").forEach(c => {
    const repo = path.join(R, c.repo);
    if (!fs.existsSync(repo)) { auto[c.id] = Object.fromEntries(chart.questions.map(q => [q.no, { notRun: "repository missing" }])); return; }
    try { auto[c.id] = { SJJ: A.sjj, POD: A.pod, KPP: A.kpp }[c.id](ctx(c.repo)); } catch (e) { auto[c.id] = Object.fromEntries(chart.questions.map(q => [q.no, { notRun: "error " + String(e.message).slice(0, 30) }])); }
  });
  fs.writeFileSync(path.join(out, "auto.json"), JSON.stringify(auto, null, 1));
  const made = A.dossiers(ctx("vednetra"));
  const tpl = {};
  TB.REG.columns.filter(c => c.mode === "analyst").forEach(c => {
    tpl[c.id] = Object.fromEntries(chart.questions.map(q => [q.no, Object.assign({ pick: null, flags: [], note: "", dependsOn: [] }, q.kind.key === "dated" ? { gates: { double: null, single: null } } : {}, c.id === "SUJ" ? { draft: null } : {})]));
  });
  tpl.POD = {};
  chart.questions.forEach(q => { const p = (auto.POD || {})[q.no]; if (p && p.flags && (p.flags.includes("tie") || p.flags.includes("unmapped"))) tpl.POD[q.no] = { pick: null, flags: ["read"], note: "break the tie from the chart, tied " + (p.tied || []).join(" | "), dependsOn: [] }; });
  fs.writeFileSync(path.join(out, "picks.template.json"), JSON.stringify(tpl, null, 1));
  const need = TB.REG.columns.filter(c => c.mode === "analyst").map(c => c.id);
  console.log("SARVA run done for " + (chart.name || chart.id) + " as of " + asOf + ", work folder " + out);
  chart.questions.forEach(q => console.log("  " + q.no + " " + q.kind.key + (q.kind.date ? " " + q.kind.date : "") + (noRule(q) ? ", NO VALIDATED RULE" : "")));
  console.log("Automatic columns written to auto.json. Dossiers " + JSON.stringify(Object.fromEntries(Object.entries(made).map(([k, v]) => [k, v.length]))));
  console.log("The reader must now read the dossiers and fill picks.template.json as picks.json for " + need.join(", ") + (Object.keys(tpl.POD).length ? ", and break the Poddar ties on " + Object.keys(tpl.POD).join(", ") : "") + ". Then run table.");
}

function build(chart, out, picksFile) {
  const auto = JSON.parse(fs.readFileSync(path.join(out, "auto.json"), "utf8"));
  const picks = picksFile && fs.existsSync(picksFile) ? JSON.parse(fs.readFileSync(picksFile, "utf8")) : {};
  const cells = {};
  TB.REG.columns.forEach(c => {
    cells[c.id] = {};
    const seen = A.seen(c.id, chart, root());
    chart.questions.forEach(q => { const cell = TB.cellFor(c, q, auto, picks, noRule(q)); if (seen && cell.pick) { cell.flags = (cell.flags || []).concat(["seen"]); } cells[c.id][q.no] = cell; });
  });
  return cells;
}

function cmdTable(file) {
  const chart = load(file), out = arg("out");
  const cells = build(chart, out, arg("picks", path.join(out, "picks.json")));
  const errors = TB.check(chart, chart.questions, cells, { sujRepo: SUJ });
  const text = TB.render(chart, chart.questions, cells);
  const all = errors.concat(TB.styleErrors(text));
  if (all.length) { console.error("SARVA GUARD FAILED, no table is printed\n" + all.map(e => "  " + e).join("\n")); process.exit(1); }
  console.log(text);
}

function cmdScore(file) {
  const chart = load(file), out = arg("out"), truths = JSON.parse(fs.readFileSync(arg("truths"), "utf8"));
  const cells = build(chart, out, arg("picks", path.join(out, "picks.json")));
  const per = TB.scoreCells(chart, cells, truths), chance = chart.questions.reduce((sum, q) => sum + 1 / q.options.length, 0);
  const file2 = path.join(SUJ, "suj_engine", "cases", "sarva_scores.json");
  const db = fs.existsSync(file2) ? JSON.parse(fs.readFileSync(file2, "utf8")) : { note: "SARVA scoreboard. hit is a first pick that equals the truth, tieHit a tie that contained the truth, secondHit a second place that was the truth. chance is the expected hits of a random pick. A table is not an accuracy claim.", runs: [] };
  if (process.argv.includes("--record")) {
    db.runs = db.runs.filter(r => r.id !== (chart.id || chart.name));
    db.runs.push({ id: chart.id || chart.name, asOf: arg("asof", today()), chance: Math.round(chance * 100) / 100, per });
    fs.writeFileSync(file2, JSON.stringify(db, null, 1));
  }
  const runs = process.argv.includes("--record") ? db.runs : db.runs.concat([{ id: chart.id || chart.name, chance, per }]);
  const rows = TB.REG.columns.map(c => { const t = runs.reduce((a, r) => { const x = (r.per || {})[c.id] || {}; a.asked += x.asked || 0; a.hit += x.hit || 0; a.tie += x.tieHit || 0; a.second += x.secondHit || 0; return a; }, { asked: 0, hit: 0, tie: 0, second: 0 }); return [c.label, t.hit + " of " + t.asked, String(t.tie), String(t.second)]; });
  const ch = runs.reduce((s, r) => s + (r.chance || 0), 0);
  const head = ["Engine", "First pick right", "Tie held it", "Second place"], all = [head].concat(rows);
  const w = head.map((_, k) => Math.max(...all.map(r => r[k].length)) + 2);
  console.log("```\n" + all.map(r => r.map((x, k) => T.display(x).padEnd(w[k])).join("").trimEnd()).join("\n") + "\n" + "Chance for these questions about " + ch.toFixed(1) + " right\n```");
}

const cmd = process.argv[2], file = process.argv[3];
try {
  if (cmd === "run") cmdRun(file); else if (cmd === "table") cmdTable(file); else if (cmd === "score") cmdScore(file);
  else { console.error("Usage: index.js run|table|score chart.json --out DIR"); process.exit(2); }
} catch (e) { console.error("SARVA error, " + e.message); process.exit(1); }
