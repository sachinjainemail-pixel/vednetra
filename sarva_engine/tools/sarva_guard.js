#!/usr/bin/env node
/*
 * SARVA engine guard. Checks a drafted reply against the owner's hard coded rules before it is sent.
 *
 *   node sarva_engine/tools/sarva_guard.js reply.txt [--no-suj-guard]
 *
 * Exit code 0 clean, 1 errors, 3 valid but incomplete because the BNN rule files were missing.
 *
 * Errors
 *   a question without an OPTIONS line, a METHOD block, an EVIDENCE line or a RESULT line for each of the five
 *   methodologies KPPRO, KCIL, SUJ, CHAWDHRI, BNN; a sixth methodology; two RESULT lines for one pair;
 *   a BNN EVIDENCE line with no Rule ID from the BNN rule base; NOT RUN BNN RULES MISSING while the rule csv is present;
 *   a RESULT that is not one of the listed options, or that hedges; no FINAL TABLE; a table whose header is not
 *   Question, KP Pro, KCIL, SUJ engine, CHAWDHRI, BNN; a row missing or a cell that differs from its RESULT line;
 *   anything after the table; a missing SUJ FILE; a SUJ file that fails suj_engine/tools/answer_guard.js.
 * Warning
 *   characters the owner does not want in responses, outside the table delimiter row.
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const METHODS = ["KPPRO", "KCIL", "SUJ", "CHAWDHRI", "BNN"];
const HEADER = ["Question", "KP Pro", "KCIL", "SUJ engine", "CHAWDHRI", "BNN"];
const BNN_MISSING = "NOT RUN BNN RULES MISSING";
const BNN_FILE = path.join(__dirname, "..", "knowledge", "bnn", "BNN-RULES-5COLUMN.csv");
const HEDGE = /\b(cannot|can't|unable|undecided|undetermined|equal|tie|either|neither)\b|\bor\b|\//i;
const BANNED = /[();:—“”‘’!#*~\/]|\s-\s/;

function check(text, opts) {
  opts = opts || {};
  const bnnPresent = opts.bnnPresent !== undefined ? opts.bnnPresent : fs.existsSync(BNN_FILE);
  const errors = [], warnings = [];
  const err = m => errors.push(m);
  const lines = text.split(/\r?\n/);
  const options = {}, results = {}, evidence = {}, blocks = {}, sujFiles = {}, questions = [];
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
    }
  });

  if (!questions.length) err("No questions found. Each question needs an OPTIONS line.");
  let incomplete = false;
  questions.forEach(q => {
    if (!options[q]) err(q + " has no OPTIONS line.");
    METHODS.forEach(c => {
      const k = q + c;
      if (!blocks[k]) err(q + " has no METHOD " + c + " block.");
      if (!evidence[k]) err(q + " " + c + " has no EVIDENCE line.");
      else if (c === "BNN" && bnnPresent && results[k] !== BNN_MISSING && !/\b[A-Z]{3}-[A-Z0-9]{3}-\d{3}\b/.test(evidence[k])) err(q + " BNN EVIDENCE line must cite at least one Rule ID from the BNN rule base, for example RAO-FND-009.");
      const r = results[k];
      if (r === undefined) { err(q + " " + c + " has no RESULT line."); return; }
      if (c === "BNN" && r === BNN_MISSING && !bnnPresent) { incomplete = true; return; }
      if (c === "BNN" && r === BNN_MISSING) { err(q + " BNN says the rules are missing but " + BNN_FILE + " is present. Run the BNN reading."); return; }
      if (r === BNN_MISSING) { err(q + " " + c + " uses the BNN missing text, allowed in the BNN column only."); return; }
      const o = options[q];
      if (Array.isArray(o)) {
        if (o.indexOf(r) < 0) err(q + " " + c + " RESULT " + r + " is not one of the options " + o.join(", ") + ".");
      } else if (o === "OPEN") {
        if (HEDGE.test(r)) err(q + " " + c + " RESULT hedges or gives more than one answer: " + r);
      }
    });
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
    if (/^(SUJ FILE|OPTIONS|RESULT|EVIDENCE|METHOD)/.test(l.trim()) && !BANNED.test(l.replace(/\//g, ""))) return;
    if (BANNED.test(l)) warnings.push("Line " + (i + 1) + " has a character the owner does not want in responses.");
  });
  return { errors, warnings: warnings.slice(0, 5), incomplete, questions };
}

if (require.main === module) {
  const f = process.argv[2];
  if (!f || !fs.existsSync(f)) { console.error("Usage: node sarva_engine/tools/sarva_guard.js reply.txt [--no-suj-guard]"); process.exit(2); }
  const r = check(fs.readFileSync(f, "utf8"), { noSujGuard: process.argv.includes("--no-suj-guard") });
  r.warnings.forEach(w => console.log("WARNING " + w));
  r.errors.forEach(e => console.log("ERROR " + e));
  if (r.errors.length) { console.log("GUARD FAILED with " + r.errors.length + " errors."); process.exit(1); }
  if (r.incomplete) { console.log("GUARD PASSED but INCOMPLETE. The BNN column was not run because the BNN rule files are missing. Tell the owner."); process.exit(3); }
  console.log("GUARD PASSED, " + r.questions.length + " questions, five methodologies each, final table matches.");
}
module.exports = { check, METHODS, HEADER };
