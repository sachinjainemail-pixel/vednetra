#!/usr/bin/env node
/*
 * SUJ engine answer guard. Checks a drafted answer against the owner's hard coded rules before it is sent.
 *
 *   node suj_engine/tools/answer_guard.js answer.txt [--options "Option A|Option B"] [--strict-style] [--v1]
 *
 * Version 2 (round 5, from the first tested chart) adds process checks. Use --v1 to run only the older checks.
 *   RULES CITED line in the answer, WINDOW SCAN line in S6, EVIDENCE TALLY and COUNTER EVIDENCE lines in S8.
 *   With options, the EVIDENCE TALLY line must give a whole number for every option, and the final answer must hold
 *   the highest number. A tie for the highest number needs a TIE BREAK line that names the deciding step.
 *   Reasoning from typicality, base rates or the safe choice is an error. A choice must rest on counted chart evidence.
 *
 * Errors (exit code 1): hedging or undecided language, missing or misordered sections S0 to S9, no TIME STATUS
 * line with one of the three allowed values, no FINAL ANSWER line, final answer not one of the given options,
 * closing bullets not 2 or 3 one liners at the very end, last bullet not starting with Final answer.
 * Warnings: characters the owner does not want in responses. They become errors with --strict-style.
 */
const fs = require("fs");

const BANNED = [
  /can(?:no|')t (?:be )?(?:differentiate|distinguish|decide|determine|choose|say|tell|conclude)/i,
  /(?:unable|not able|impossible|difficult|hard) to (?:differentiate|distinguish|decide|determine|choose|say|tell|conclude|pick)/i,
  /not possible to (?:differentiate|distinguish|decide|determine|choose|say|tell|conclude)/i,
  /(?:no|not a) clear (?:answer|winner|result|option)/i,
  /(?:options?|choices?|planets?|results?) (?:are|is) (?:equally|equal|evenly|tied)/i,
  /equally (?:likely|possible|probable|strong)/i,
  /\binconclusive\b/i, /\bit depends\b/i, /insufficient (?:evidence|data|information) to/i,
  /\bwe cannot know\b/i, /\bcannot be (?:known|determined|decided|predicted)\b/i, /\bno definitive\b/i
];
// Reasoning from priors instead of chart evidence. Added in round 5 after the engine overrode its own flags with typicality.
const PRIOR_WORDS = [
  /आम तौर पर/, /सामान्यतः/, /सामान्यतया/, /अक्सर/, /औसत परिवार/, /सुरक्षित विकल्प/, /सबसे सामान्य/, /बहुधा/,
  /\bbase rate/i, /\btypical(?:ly)?\b/i, /\busually\b/i, /\bmost common/i, /\bstatistical/i, /\bsafe choice/i, /\bon average\b/i, /\bin general\b/i
];
const SECTION_NAMES = ["INTAKE", "DOMINANT HOUSE", "D1 ANALYSIS", "D9 ANALYSIS", "SUBJECT DIVISIONAL", "PLANET STRENGTH", "DASHA", "TRANSIT", "RECONCILIATION", "SUMMARY"];
const STYLE_CHARS = /[()!;:—“”‘\/\-#*~]/g;

function check(text, opts) {
  const errors = [], warnings = [];
  const lines = text.replace(/\r/g, "").split("\n");

  // hedging language
  BANNED.forEach(re => { const m = text.match(re); if (m) errors.push("Hedging or undecided language is not allowed: \"" + m[0] + "\""); });

  // sections S0..S9 in order
  const heads = [];
  lines.forEach((l, i) => { const m = l.match(/^S(\d)\.\s+(.+)$/); if (m) heads.push({ n: Number(m[1]), title: m[2].toUpperCase(), line: i }); });
  for (let n = 0; n <= 9; n++) {
    const h = heads.find(x => x.n === n);
    if (!h) errors.push("Section S" + n + " (" + SECTION_NAMES[n] + ") is missing");
    else if (h.title.indexOf(SECTION_NAMES[n]) < 0) errors.push("Section S" + n + " should be about " + SECTION_NAMES[n] + " but is titled \"" + h.title + "\"");
  }
  const order = heads.map(h => h.n);
  for (let i = 1; i < order.length; i++) if (order[i] <= order[i - 1]) { errors.push("Sections are out of order near S" + order[i]); break; }
  const s6 = heads.find(h => h.n === 6), s7 = heads.find(h => h.n === 7), s9 = heads.find(h => h.n === 9);

  // time status inside S6
  if (s6) {
    const end = s7 ? s7.line : lines.length;
    const body = lines.slice(s6.line, end);
    const ts = body.filter(l => /^TIME STATUS\b/.test(l));
    if (ts.length !== 1) errors.push("S6 must contain exactly one line starting TIME STATUS, found " + ts.length);
    else {
      const hits = ["ALREADY HAPPENED", "HAPPENING NOW", "WILL HAPPEN"].filter(v => ts[0].toUpperCase().indexOf(v) >= 0);
      if (hits.length !== 1) errors.push("The TIME STATUS line must contain exactly one of ALREADY HAPPENED, HAPPENING NOW, WILL HAPPEN");
    }
  }

  // S9: final answer and closing bullets
  let finalLine = null;
  if (s9) {
    const body = lines.slice(s9.line + 1);
    const fa = body.filter(l => /^FINAL ANSWER\b/.test(l));
    if (fa.length !== 1) errors.push("S9 must contain exactly one line starting FINAL ANSWER, found " + fa.length);
    else finalLine = fa[0].replace(/^FINAL ANSWER\s*/i, "");
    let end = lines.length - 1;
    while (end >= 0 && lines[end].trim() === "") end--;
    const bullets = [];
    for (let i = end; i >= 0 && /^•\s+\S/.test(lines[i]); i--) bullets.unshift(lines[i]);
    if (bullets.length < 2 || bullets.length > 3) errors.push("The answer must end with 2 or 3 bullet lines starting with the dot character, found " + bullets.length + " at the end");
    bullets.forEach(b => { if (b.length > 240) errors.push("A closing bullet is longer than a one liner: \"" + b.slice(0, 40) + "...\""); });
    if (bullets.length && !/^•\s+Final answer\b/i.test(bullets[bullets.length - 1])) errors.push("The last bullet must start with Final answer");
    if (bullets.length && fa.length === 1 && lines.indexOf(fa[0]) > end - bullets.length) errors.push("FINAL ANSWER line must come before the closing bullets");
  }

  // options
  if (opts.options && opts.options.length) {
    if (finalLine == null) errors.push("No FINAL ANSWER line to check against the options");
    else {
      const hit = opts.options.filter(o => finalLine.toLowerCase().indexOf(o.toLowerCase()) >= 0);
      const longest = hit.filter(o => !hit.some(p => p !== o && p.toLowerCase().indexOf(o.toLowerCase()) >= 0));
      if (longest.length !== 1) errors.push("FINAL ANSWER must name exactly one of the given options, it names " + longest.length);
    }
  } else if (finalLine != null && finalLine.trim().length < 3) errors.push("FINAL ANSWER is empty");

  // version 2 process checks
  if (!opts.v1) {
    const oneLine = (re, label, where) => {
      const f = lines.filter(l => re.test(l));
      if (f.length !== 1) errors.push(label + " line is required exactly once" + (where ? " in " + where : "") + ", found " + f.length);
      return f[0] || "";
    };
    const s2 = heads.find(h => h.n === 2), s3 = heads.find(h => h.n === 3);
    const s8 = heads.find(h => h.n === 8);
    const inRange = (a, b) => lines.slice(a ? a.line : 0, b ? b.line : lines.length);
    const has = (arr, re) => arr.filter(l => re.test(l));
    if (s2 && has(inRange(s2, s3), /^RULES CITED\b/).length !== 1) errors.push("S2 must contain exactly one line starting RULES CITED. Run rules_lookup.js and list the rule ids used, or write that the library holds no rule");
    if (s6 && has(inRange(s6, s7), /^WINDOW SCAN\b/).length !== 1) errors.push("S6 must contain exactly one line starting WINDOW SCAN. Run window_scan.js and state the windows found and which were weighed");
    let tallyLine = "";
    if (s8) {
      const r8 = inRange(s8, s9);
      const tl = has(r8, /^EVIDENCE TALLY\b/);
      if (tl.length !== 1) errors.push("S8 must contain exactly one line starting EVIDENCE TALLY, found " + tl.length); else tallyLine = tl[0];
      const cl = has(r8, /^COUNTER EVIDENCE\b/);
      if (cl.length !== 1 || cl[0].replace(/^COUNTER EVIDENCE\s*/, "").trim().length < 10) errors.push("S8 must contain one COUNTER EVIDENCE line that names the strongest evidence against the final answer");
    }
    // tally against the options
    if (tallyLine && opts.options && opts.options.length) {
      let rest = tallyLine.replace(/^EVIDENCE TALLY\s*/, "");
      const nums = {};
      opts.options.slice().sort((a, b) => b.length - a.length).forEach(o => {
        const i = rest.toLowerCase().indexOf(o.toLowerCase());
        if (i < 0) return;
        const after = rest.slice(i + o.length);
        const m = /^\s*[,.]?\s*(\d+)/.exec(after);
        if (m) nums[o] = Number(m[1]);
        rest = rest.slice(0, i) + " ".repeat(o.length) + after;
      });
      const missing = opts.options.filter(o => nums[o] === undefined);
      if (missing.length) errors.push("EVIDENCE TALLY must give a whole number for every option, missing " + missing.join(", "));
      else if (finalLine != null) {
        const hit = opts.options.filter(o => finalLine.toLowerCase().indexOf(o.toLowerCase()) >= 0);
        const fo = hit.filter(o => !hit.some(p => p !== o && p.toLowerCase().indexOf(o.toLowerCase()) >= 0))[0];
        const mx = Math.max.apply(null, Object.values(nums));
        if (fo && nums[fo] < mx) errors.push("The final answer " + fo + " has " + nums[fo] + " in the EVIDENCE TALLY but the highest is " + mx + ". A choice must follow the counted evidence");
        if (fo && nums[fo] === mx && Object.values(nums).filter(v => v === mx).length > 1 && !lines.some(l => /^TIE BREAK\b/.test(l)))
          errors.push("The EVIDENCE TALLY has a tie for the highest number. Add a line starting TIE BREAK that names the deciding step");
      }
    }
    // reasoning from priors
    PRIOR_WORDS.forEach(re => { const m = text.match(re); if (m) errors.push("Reasoning from typicality or base rates is not allowed, found \"" + m[0] + "\". Decide from counted chart evidence"); });
  }

  // owner style characters
  const bad = (text.match(STYLE_CHARS) || []);
  if (bad.length) {
    const uniq = Array.from(new Set(bad)).join(" ");
    (opts.strictStyle ? errors : warnings).push("Characters the owner does not want in responses appear " + bad.length + " times: " + uniq);
  }
  return { ok: errors.length === 0, errors, warnings, finalAnswer: finalLine };
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  const file = argv.find(a => !a.startsWith("--") && argv[argv.indexOf(a) - 1] !== "--options");
  if (!file) { console.error("Usage: answer_guard.js answer.txt [--options \"A|B\"] [--strict-style]"); process.exit(2); }
  const oi = argv.indexOf("--options");
  const options = oi >= 0 ? argv[oi + 1].split("|").map(s => s.trim()).filter(Boolean) : [];
  const res = check(fs.readFileSync(file, "utf8"), { options, strictStyle: argv.indexOf("--strict-style") >= 0, v1: argv.indexOf("--v1") >= 0 });
  res.errors.forEach(e => console.log("ERROR " + e));
  res.warnings.forEach(w => console.log("WARNING " + w));
  console.log(res.ok ? "GUARD PASSED" : "GUARD FAILED");
  process.exit(res.ok ? 0 : 1);
}
module.exports = { check };
