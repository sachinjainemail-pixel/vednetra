#!/usr/bin/env node
/*
 * SARVA engine, BNN rule lookup over knowledge/bnn/BNN-RULES-5COLUMN.csv (3,073 rules).
 *
 *   node sarva_engine/tools/bnn_rules.js --method
 *   node sarva_engine/tools/bnn_rules.js '{"event":"marriage","q":"Venus Jupiter","limit":12}'
 *   node sarva_engine/tools/bnn_rules.js '{"id":"RAO-FND-009"}'
 *
 * Keys. event: a life event group or a word such as marriage, career, health, wealth, parents, property, education,
 * foreign, children, litigation, siblings, mind, death, character, spiritual. General method rules are always
 * included for an event unless general is false. q: words that must all appear in the rule text. book: part of a
 * source book name. id: a rule id or a prefix. limit: default 12. full: true prints the whole rule text.
 * It prints rules. It does not decide anything.
 */
const fs = require("fs");
const path = require("path");
const FILE = path.join(__dirname, "..", "knowledge", "bnn", "BNN-RULES-5COLUMN.csv");

function parseCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = ""; if (row.length > 1 || row[0] !== "") rows.push(row); row = [];
    } else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
function load() {
  if (!fs.existsSync(FILE)) return [];
  const rows = parseCsv(fs.readFileSync(FILE, "utf8"));
  const head = rows.shift();
  return rows.map(r => {
    const o = {}; head.forEach((h, i) => { o[h] = (r[i] || "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, ""); });
    return { id: o["Rule ID"], event: o["Related life event"], desc: o["Rule description"], exact: o["Exact rule"],
      effect: o["Effect of the rule"], comb: o["Combination of the rule"], book: o["Source book"] };
  });
}
const ALIASES = { marriage: "Marriage & spouse", spouse: "Marriage & spouse", career: "Career & profession", profession: "Career & profession",
  work: "Career & profession", job: "Career & profession", health: "Health & body", disease: "Health & body", wealth: "Wealth & finance",
  money: "Wealth & finance", finance: "Wealth & finance", parents: "Parents", father: "Parents", mother: "Parents", property: "Property, land & house",
  house: "Property, land & house", education: "Education & knowledge", foreign: "Travel & foreign", travel: "Travel & foreign",
  children: "Children & progeny", child: "Children & progeny", progeny: "Children & progeny", litigation: "Litigation & disputes",
  siblings: "Siblings & relatives", sibling: "Siblings & relatives", mind: "Mind & mental health", death: "Danger & death",
  danger: "Danger & death", character: "Character & nature", spiritual: "Spirituality & remedy", remedy: "Spirituality & remedy" };
const GENERAL = "General method (no single life event)";
const METHOD_PREFIXES = ["RAO-FND", "ARI-GRM", "ARI-TIM", "RAO-DOM", "RAO-JTC", "NAI-FRM"];

function lookup(cfg) {
  const all = load();
  let out = all;
  if (cfg.id) out = all.filter(r => r.id.startsWith(cfg.id));
  else {
    if (cfg.method) out = all.filter(r => METHOD_PREFIXES.some(p => r.id.startsWith(p)));
    if (cfg.event) {
      const ev = ALIASES[String(cfg.event).toLowerCase()] || cfg.event;
      out = out.filter(r => r.event.toLowerCase() === String(ev).toLowerCase() || (cfg.general !== false && r.event === GENERAL));
      const own = out.filter(r => r.event !== GENERAL);
      if (cfg.q) { /* filtered below */ }
      out = own.concat(out.filter(r => r.event === GENERAL));
    }
    if (cfg.book) out = out.filter(r => r.book.toLowerCase().includes(String(cfg.book).toLowerCase()));
    if (cfg.q) {
      const ws = String(cfg.q).toLowerCase().split(/\s+/).filter(Boolean);
      out = out.filter(r => { const t = (r.desc + " " + r.exact + " " + r.effect + " " + r.comb).toLowerCase(); return ws.every(w => t.includes(w)); });
    }
  }
  return { total: all.length, hits: out };
}
function render(res, cfg) {
  const lim = cfg.limit || 12, full = !!cfg.full;
  const L = ["BNN RULES, " + res.total + " in the table, " + res.hits.length + " match, showing " + Math.min(lim, res.hits.length)];
  if (!res.total) L.push("The rule file is missing: " + FILE);
  res.hits.slice(0, lim).forEach(r => {
    const cut = s => full || s.length <= 420 ? s : s.slice(0, 420) + " ...";
    L.push("", r.id + " | " + r.book + " | " + r.event, "  RULE " + r.desc, "  EXACT " + cut(r.exact));
    if (r.effect !== r.exact) L.push("  EFFECT " + cut(r.effect));
    L.push("  WHEN " + cut(r.comb));
  });
  return L.join("\n");
}
if (require.main === module) {
  const arg = process.argv.slice(2);
  const cfg = JSON.parse(arg.find(a => a.trim().startsWith("{")) || "{}");
  if (arg.includes("--method")) { cfg.method = true; cfg.limit = cfg.limit || 200; }
  if (arg.includes("--full")) cfg.full = true;
  console.log(render(lookup(cfg), cfg));
}
module.exports = { load, lookup, render, FILE };
