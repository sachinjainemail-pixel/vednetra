#!/usr/bin/env node
/*
 * SUJ engine, HYPOTHESIS SCORES. For yes or no questions about the native, does the native have X, such as education of a kind, a profession, siblings, living parents, a child.
 * Scores each hypothesis type of data/hypothesis_types.json with the engine, the evidence made by tools/hypotheses.js and weighed by strength_tally.js, and reads the score as a z score against
 * data/null_distribution.json, the score the same type gets on random charts. That removes the topic bias, for example siblings always score low.
 * PROVISIONAL. The z reading was found after the true answers of Kundali 4 were known, see data/engine_config.json. Report the raw score and the z score together and say the reading is provisional.
 *
 *   node suj_engine/tools/score_hypotheses.js '{"gender":"male","date":"2006-02-14","time":"05:27:00","tz":5.5,"lat":31.326,"lon":75.576,"topic":"education"}'
 * topic limits the types to one topic, or give "types":["Doctor","Lawyer"]. Without either all types are scored. Add --json for machine output.
 */
const fs = require("fs"), path = require("path");
const H = require("./hypotheses");
const { CONFIG } = require("./engine_config");
const TYPES = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "hypothesis_types.json"), "utf8")).types;
const NULL = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "null_distribution.json"), "utf8"));

function score(cfg) {
  const names = cfg.types || Object.keys(TYPES).filter(n => !cfg.topic || TYPES[n].topic === cfg.topic);
  if (!names.length) throw new Error("No hypothesis type for that topic. Known topics: " + Array.from(new Set(Object.values(TYPES).map(t => t.topic))).join(", "));
  const ctx = H.context(cfg);
  const rows = names.map(n => {
    const t = TYPES[n]; if (!t) throw new Error("Unknown hypothesis type " + n);
    const hs = [{ option: "Yes", houses: t.houses, from: t.from, karakas: t.karakas, varga: t.varga }];
    const res = H.run(Object.assign({}, cfg), ctx, hs, ["No", "Yes"], false);
    const row = res.rows[1], nl = NULL.out[n] && NULL.out[n].B;
    const z = nl ? (row.score - nl.m) / nl.sd : null;
    return { type: n, topic: t.topic, score: row.score, favour: row.favour, against: row.against, nullMean: nl ? Math.round(nl.m * 10) / 10 : null, nullSd: nl ? Math.round(nl.sd * 10) / 10 : null, z: z == null ? null : Math.round(z * 100) / 100,
      reading: z == null ? "no null distribution, run experiments/null_distribution.js with this type" : (z > CONFIG.hypotheses.zRule.yesAbove ? "above the typical chart, read as yes" : "at or below the typical chart, read as no"), forPlanets: row.forPlanets, againstPlanets: row.againstPlanets };
  });
  rows.sort((a, b) => (b.z == null ? -9 : b.z) - (a.z == null ? -9 : a.z));
  return { engineVersion: res0(cfg), status: CONFIG.hypotheses.status, rows };
}
function res0(cfg) { return cfg.engine === "legacy" ? "legacy" : CONFIG.version; }
function render(r) {
  const L = ["# SUJ HYPOTHESIS SCORES, engine " + r.engineVersion, "STATUS " + r.status, ""];
  r.rows.forEach(x => L.push(x.type.padEnd(18) + "score " + String(x.score).padStart(5) + "  null " + (x.nullMean == null ? "none" : x.nullMean + " sd " + x.nullSd) + "  z " + (x.z == null ? "none" : x.z) + "  " + x.reading + "\n" + " ".repeat(18) + "for " + x.forPlanets.join(", ") + " | against " + x.againstPlanets.join(", ")));
  return L.join("\n");
}
if (require.main === module) {
  const argv = process.argv.slice(2), arg = argv.find(a => a.trim().startsWith("{"));
  if (!arg) { console.error("Usage: score_hypotheses.js '{json}' [--json]"); process.exit(2); }
  const cfg = JSON.parse(arg); cfg.asOf = cfg.asOf || new Date().toISOString().slice(0, 10);
  const r = score(cfg);
  console.log(argv.indexOf("--json") >= 0 ? JSON.stringify(r, null, 1) : render(r));
}
module.exports = { score, render };
