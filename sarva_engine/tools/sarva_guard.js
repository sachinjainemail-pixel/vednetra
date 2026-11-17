#!/usr/bin/env node
/*
 * SARVA engine guard. Checks a drafted reply against the owner's hard coded rules before it is sent.
 *
 *   node sarva_engine/tools/sarva_guard.js reply.txt [--no-suj-guard]
 *
 * Exit code 0 clean, 1 errors, 3 valid but incomplete because the rules of BNN, Udu or Quad Dasha were missing.
 *
 * The seven methodologies, in order: KPPRO, KCIL, SUJ, CHAWDHRI, BNN, UDU, QUAD.
 *
 * Errors
 *   a question without an OPTIONS line, a METHOD block, an EVIDENCE line or a RESULT line for each methodology;
 *   a methodology that is not one of the seven; two RESULT lines for one pair;
 *   a RESULT that is not one of the listed options, or that hedges;
 *   KCIL EVIDENCE with none of STABLE, TWO CANDIDATES or NO RULE REGISTER while the KCIL summary is installed;
 *   KPPRO EVIDENCE with no confidence word HIGH, MEDIUM or LOW or no basis word CHART DECIDED, PRIOR DOMINANT or R10 DECIDED
 *   while the KP Pro booklet is installed;
 *   BNN EVIDENCE with no Rule ID or no BNN grade while the BNN rule csv is present;
 *   UDU EVIDENCE with no Udu Rule ID while the nine Udu corpus files are present;
 *   QUAD EVIDENCE with none of COMPUTED, CLASSICAL, UNSTABLE, VACUOUS while the Quad full methodology is present;
 *   NOT RUN X RULES MISSING for BNN, UDU or QUAD while that source is present, or for any other column;
 *   no final table; a table whose header is not Question, KP Pro, KCIL, SUJ engine, CHAWDHRI, BNN, Udu, Quad Dasha;
 *   a row missing or a cell that differs from its RESULT line; anything after the table;
 *   a missing SUJ FILE; a SUJ file that fails suj_engine/tools/answer_guard.js.
 * Warning
 *   characters the owner does not want in responses, outside the table delimiter row.
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const METHODS = ["KPPRO", "KCIL", "SUJ", "CHAWDHRI", "BNN", "UDU", "QUAD"];
const HEADER = ["Question", "KP Pro", "KCIL", "SUJ engine", "CHAWDHRI", "BNN", "Udu", "Quad Dasha"];
const NOT_RUN = c => "NOT RUN " + c + " RULES MISSING";
const KNOW = path.join(__dirname, "..", "knowledge");
const UDU_FILES = ["UDU-vivah-sambandh.md", "UDU-karya-dhan.md", "UDU-arogya-ayu.md", "UDU-vidya-swabhav.md",
  "UDU-santan-parivar.md", "UDU-dharma-upay.md", "UDU-samay-muhurat.md", "UDU-yatra-shatru.md", "UDU-mool-tattva.md"];
const HEDGE = /\b(cannot|can't|unable|undecided|undetermined|equal|tie|either|neither)\b|\bor\b|\//i;
const BANNED = /[();:—“”‘’!#*~\/]|\s-\s/;

// A source is present only when its rule files are in the knowledge folder.
function sources() {
  const has = f => fs.existsSync(path.join(KNOW, f));
  return {
    BNN: has("bnn/BNN-RULES-5COLUMN.csv"),
    UDU: UDU_FILES.every(f => has("udu/" + f)),
    QUAD: ["pdf", "txt", "md"].some(e => has("quad/QUAD-FULL-METHODOLOGY." + e)),
    KPPRO: has("kppro/KP-PRO-METHODOLOGY.txt"),
    KCIL: has("kcil/KCIL-METHODOLOGY-V2.6.txt")
  };
}
const UDU_ID = /\b[A-Z]{3}(-[A-Z0-9])?-\d{4}\b/;
const BNN_ID = /\b[A-Z]{3}-[A-Z0-9]{3}-\d{3}\b/;
const BNN_GRADE = /\b(CONFIRMED|INDICATED|POSSIBLE|OPEN|DENIED)\b/;
const QUAD_WORD = /\b(COMPUTED|CLASSICAL|UNSTABLE|VACUOUS)\b/;
const KCIL_DET = /\b(STABLE|TWO CANDIDATES|NO RULE REGISTER)\b/;
const KP_TRUST = /\b(HIGH|MEDIUM|LOW)\b/;
const KP_BASIS = /\b(CHART DECIDED|PRIOR DOMINANT|R10 DECIDED)\b/;

function check(text, opts) {
  opts = opts || {};
  const present = Object.assign(sources(), opts.present || {});
  const errors = [], warnings = [];
  const err = m => errors.push(m);
  const lines = text.split(/\r?\n/);
  const options = {}, results = {}, evidence = {}, blocks = {}, sujFiles = {}, lexLines = {}, questions = [];
  const seenQ = q => { if (questions.indexOf(q) < 0) questions.push(q); };

  lines.forEach(raw => {
    const l = raw.trim();
    let m;
    if ((m = l.match(/^OPTIONS (Q\d+) (.+)$/))) {
      seenQ(m[1]);
      options[m[1]] = /^OPEN$/i.test(m[2].trim()) ? "OPEN"
        : (m[2].indexOf("|") >= 0 ? m[2].split("|") : m[2].split(/\s+/)).map(s => s.trim()).filter(Boolean);
    } else if ((m = l.match(/^METHOD (\S+) (Q\d+)$/))) {
      seenQ(m[2]);
      if (METHODS.indexOf(m[1]) < 0) err("Unknown methodology " + m[1] + " in a METHOD line. Only " + METHODS.join(", ") + " are allowed.");
      blocks[m[2] + m[1]] = true;
    } else if ((m = l.match(/^RESULT (Q\d+) (\S+) (.+)$/))) {
      seenQ(m[1]);
      if (METHODS.indexOf(m[2]) < 0) { err("Unknown methodology " + m[2] + " in a RESULT line."); return; }
      const k = m[1] + m[2];
      if (results[k] !== undefined) err("Two RESULT lines for " + m[1] + " " + m[2] + ".");
      results[k] = m[3].trim();
    } else if ((m = l.match(/^EVIDENCE (Q\d+) (\S+) (.+)$/))) {
      evidence[m[1] + m[2]] = m[3];
    } else if ((m = l.match(/^SUJ FILE (Q\d+) (.+)$/))) {
      sujFiles[m[1]] = m[2].trim();
    } else if ((m = l.match(/^LEXICON (Q\d+) (.+)$/))) {
      lexLines[m[1]] = m[2].trim();
    }
  });

  if (!questions.length) err("No questions found. Each question needs an OPTIONS line.");
  let incomplete = false;
  questions.forEach(q => {
    if (!options[q]) err(q + " has no OPTIONS line.");
    METHODS.forEach(c => {
      const k = q + c;
      if (!blocks[k]) err(q + " has no METHOD " + c + " block.");
      const r = results[k];
      if (r === undefined) { err(q + " " + c + " has no RESULT line."); return; }
      const ev = evidence[k];
      if (!ev) err(q + " " + c + " has no EVIDENCE line.");
      if (c === "KPPRO" && ev && present.KPPRO) {
        if (!KP_BASIS.test(ev)) err(q + " KPPRO EVIDENCE line must say CHART DECIDED, PRIOR DOMINANT or R10 DECIDED.");
        else if (!KP_TRUST.test(ev)) err(q + " KPPRO EVIDENCE line must carry the confidence word HIGH, MEDIUM or LOW.");
      }
      if (c === "KCIL" && ev && present.KCIL && !KCIL_DET.test(ev)) err(q + " KCIL EVIDENCE line must say STABLE, TWO CANDIDATES or NO RULE REGISTER.");
      const rulesBased = c === "BNN" || c === "UDU" || c === "QUAD";
      if (r === NOT_RUN(c)) {
        if (!rulesBased) err(q + " " + c + " uses a not run text, allowed for BNN, UDU and QUAD only.");
        else if (present[c]) err(q + " " + c + " says the rules are missing but the " + c + " rule files are present in sarva_engine/knowledge. Run the " + c + " reading.");
        else incomplete = true;
        return;
      }
      if (/^NOT RUN/i.test(r)) { err(q + " " + c + " has a not run result that is not the exact text " + NOT_RUN(c) + "."); return; }
      if (ev && rulesBased && present[c]) {
        if (c === "BNN" && !BNN_ID.test(ev)) err(q + " BNN EVIDENCE line must cite at least one Rule ID from the BNN rule base, for example RAO-FND-009.");
        else if (c === "BNN" && !BNN_GRADE.test(ev)) err(q + " BNN EVIDENCE line must carry the BNN grade, one of CONFIRMED, INDICATED, POSSIBLE, OPEN, DENIED.");
        if (c === "UDU" && !UDU_ID.test(ev)) err(q + " UDU EVIDENCE line must cite at least one Udu Rule ID such as ASH-1467 or RBS-1-0943.");
        if (c === "QUAD" && !QUAD_WORD.test(ev)) err(q + " QUAD EVIDENCE line must use the confidence words COMPUTED, CLASSICAL, UNSTABLE or VACUOUS.");
      }
      const o = options[q];
      if (Array.isArray(o)) {
        if (o.indexOf(r) < 0) err(q + " " + c + " RESULT " + r + " is not one of the options " + o.join(", ") + ".");
      } else if (o === "OPEN") {
        if (HEDGE.test(r)) err(q + " " + c + " RESULT hedges or gives more than one answer: " + r);
      }
    });
    if (fs.existsSync(path.join(KNOW, "lexicon", "taxonomy_medical.json")) && Array.isArray(options[q]) && !lexLines[q]) warnings.unshift(q + " has no LEXICON line. Run node sarva_engine/tools/sarva_lexicon.js --options on its options and write one line, LEXICON " + q + " followed by the entry ids, or NONE when no entry matches.");
    if (!sujFiles[q]) err(q + " has no SUJ FILE line.");
    else if (!fs.existsSync(sujFiles[q])) err(q + " SUJ FILE " + sujFiles[q] + " does not exist.");
    else if (!opts.noSujGuard) {
      const g = path.join(__dirname, "..", "..", "suj_engine", "tools", "answer_guard.js");
      const a = [g, sujFiles[q]];
      if (Array.isArray(options[q])) a.push("--options", options[q].join("|"));
      const r = spawnSync("node", a, { encoding: "utf8" });
      if (r.status !== 0) err(q + " SUJ file fails answer_guard.js. " + ((r.stdout || "") + (r.stderr || "")).trim().split("\n").slice(0, 4).join(" "));
    }
  });

  // final table
  let tStart = -1, tEnd = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() === "") continue;
    if (lines[i].trim().startsWith("|")) { tEnd = i; break; }
    break;
  }
  if (tEnd < 0) {
    err("The last block of the reply must be the final table. Nothing may follow it.");
  } else {
    tStart = tEnd;
    while (tStart > 0 && lines[tStart - 1].trim().startsWith("|")) tStart--;
    const rows = lines.slice(tStart, tEnd + 1).map(s => s.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim()));
    if (rows[0].join("|") !== HEADER.join("|")) err("Table header must be exactly " + HEADER.join(", ") + ". Found " + rows[0].join(", ") + ".");
    const body = rows.slice(2);
    if (body.length !== questions.length) err("Table has " + body.length + " rows for " + questions.length + " questions.");
    questions.forEach((q, i) => {
      const row = body.find(r => r[0] === q) || body[i];
      if (!row) return;
      if (row[0] !== q) err("Table row " + (i + 1) + " is labelled " + row[0] + ", expected " + q + ".");
      METHODS.forEach((c, j) => {
        const want = results[q + c];
        if (want !== undefined && row[j + 1] !== want) err("Table cell " + q + " " + HEADER[j + 1] + " is " + row[j + 1] + " but RESULT says " + want + ".");
      });
    });
  }

  lines.forEach((l, i) => {
    if (tStart >= 0 && i >= tStart && i <= tEnd) return;
    if (/^(SUJ FILE|LEXICON|OPTIONS|RESULT|EVIDENCE|METHOD)/.test(l.trim()) && !BANNED.test(l.replace(/\//g, ""))) return;
    if (BANNED.test(l)) warnings.push("Line " + (i + 1) + " has a character the owner does not want in responses.");
  });
  return { errors, warnings: warnings.slice(0, 5), incomplete, questions, present };
}

if (require.main === module) {
  const f = process.argv[2];
  if (!f || !fs.existsSync(f)) { console.error("Usage: node sarva_engine/tools/sarva_guard.js reply.txt [--no-suj-guard]"); process.exit(2); }
  const r = check(fs.readFileSync(f, "utf8"), { noSujGuard: process.argv.includes("--no-suj-guard") });
  r.warnings.forEach(w => console.log("WARNING " + w));
  r.errors.forEach(e => console.log("ERROR " + e));
  if (r.errors.length) { console.log("GUARD FAILED with " + r.errors.length + " errors."); process.exit(1); }
  const miss = ["BNN", "UDU", "QUAD"].filter(c => !r.present[c]);
  if (r.incomplete) { console.log("GUARD PASSED but INCOMPLETE. Not run for lack of rule files: " + miss.join(", ") + ". Tell the owner."); process.exit(3); }
  console.log("GUARD PASSED, " + r.questions.length + " questions, seven methodologies each, final table matches.");
}
module.exports = { check, METHODS, HEADER, NOT_RUN };
