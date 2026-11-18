#!/usr/bin/env node
/*
 * SARVA engine QUAD RULE LOOKUP. Reads sarva_engine/knowledge/quad/quad_rules.json, the Quad Dasha READ rules of the owner's full methodology file
 * (QUAD-FULL-METHODOLOGY.pdf and .txt, 86 pages, dated 15 November 2026, installed 18 November 2026), written in English by tools/quad_build/build_rules.js.
 *
 *   node sarva_engine/tools/quad_rules.js --stats
 *   node sarva_engine/tools/quad_rules.js --check
 *   node sarva_engine/tools/quad_rules.js --id QR-MAR-03
 *   node sarva_engine/tools/quad_rules.js --event MAR
 *
 * Every rule is CLASSICAL unless its label says VACUOUS, HAND ARITHMETIC or NO RULE. No rule has a validated hit rate.
 * The 7 fixed corrections of section 4, the parameters of section 13.7 and the output rules of sections 12 and 14 are in quad_engine.js and in
 * knowledge/quad/QUAD-RULES-MAP.md, they are not rows of this table.
 */
const fs = require("fs");
const path = require("path");
const DIR = path.join(__dirname, "..", "knowledge", "quad");
const FILE = path.join(DIR, "quad_rules.json");
function present() { return fs.existsSync(FILE) && ["pdf", "txt", "md"].some(e => fs.existsSync(path.join(DIR, "QUAD-FULL-METHODOLOGY." + e))); }
let CACHE = null;
function load() { if (!CACHE) CACHE = JSON.parse(fs.readFileSync(FILE, "utf8")); return CACHE; }
function byId(id) { return load().rules.find(r => r.id === id) || null; }
function byEvent(ev) { return load().rules.filter(r => r.event === ev.toUpperCase()); }
module.exports = { present, load, byId, byEvent, DIR };

if (require.main === module) {
  const a = process.argv.slice(2);
  if (!present()) { console.log("QUAD RULES MISSING. Place QUAD-FULL-METHODOLOGY.pdf or .txt and run tools/quad_build/build_rules.js."); process.exit(3); }
  const J = load();
  if (a.indexOf("--stats") >= 0) {
    const ev = {}, sy = {}, lb = {};
    J.rules.forEach(r => { ev[r.event] = (ev[r.event] || 0) + 1; sy[r.system] = (sy[r.system] || 0) + 1; lb[r.label] = (lb[r.label] || 0) + 1; });
    console.log("Quad rules " + J.rules.length + ", with an evaluator " + J.rules.filter(r => r.impl).length + ".\nBy event " + JSON.stringify(ev) + "\nBy system " + JSON.stringify(sy) + "\nBy label " + JSON.stringify(lb));
  } else if (a.indexOf("--check") >= 0) {
    let bad = 0;
    const QE = require("./quad_engine.js");
    const ids = new Set();
    J.rules.forEach(r => {
      if (ids.has(r.id)) { console.log("DUPLICATE " + r.id); bad++; } ids.add(r.id);
      if (!["CLASSICAL", "VACUOUS", "HAND ARITHMETIC", "NO RULE"].includes(r.label)) { console.log("BAD LABEL " + r.id + " " + r.label); bad++; }
      if (r.impl && !QE.EVAL[r.impl]) { console.log("NO EVALUATOR " + r.id + " " + r.impl); bad++; }
      if (r.label === "NO RULE" && r.impl) { console.log("NO RULE ROW WITH AN EVALUATOR " + r.id); bad++; }
    });
    console.log(bad ? bad + " problems" : "OK " + J.rules.length + " rules, " + J.rules.filter(r => r.impl).length + " evaluators found");
    process.exit(bad ? 1 : 0);
  } else if (a.indexOf("--id") >= 0) {
    const r = byId(a[a.indexOf("--id") + 1]); console.log(r ? JSON.stringify(r, null, 1) : "no such rule");
  } else if (a.indexOf("--event") >= 0) {
    byEvent(a[a.indexOf("--event") + 1]).forEach(r => console.log(r.id + " [" + r.system + "] " + r.name + " " + r.label + (r.base !== null ? " base " + r.base : "") + (r.lift !== null ? " lift " + r.lift : "") + "  " + r.trigger));
  } else console.log("use --stats, --check, --id ID or --event MAR");
}
