#!/usr/bin/env node
/*
 * SUJ engine answer guard. Checks a drafted answer against the owner's hard coded rules before it is sent.
 *
 *   node suj_engine/tools/answer_guard.js answer.txt [--options "Option A|Option B"] [--strict-style]
 *
 * Errors (exit code 1): hedging or undecided language, missing or misordered sections S0 to S9, no BIRTH TIME
 * STABILITY line in S0, no TIME STATUS line with one of the three allowed values, no FINAL ANSWER line, a final
 * answer that is not one of the given options, closing bullets not 2 or 3 one liners at the very end, last bullet
 * not starting with Final answer.
 * Birth time stability (fifth round). S0 carries one line BIRTH TIME STABILITY STABLE or BIRTH TIME STABILITY
 * UNSTABLE, from time_sensitivity.js. STABLE needs exactly one FINAL ANSWER line. UNSTABLE never stops the answer
 * and allows one FINAL ANSWER line per candidate ascendant, primary first, each naming one option.
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
  const s0 = heads.find(h => h.n === 0), s1 = heads.find(h => h.n === 1);
  const s6 = heads.find(h => h.n === 6), s7 = heads.find(h => h.n === 7), s9 = heads.find(h => h.n === 9);

  // birth time stability line inside S0
  let unstable = false;
  if (s0) {
    const body = lines.slice(s0.line, s1 ? s1.line : lines.length);
    const bs = body.filter(l => /^BIRTH TIME STABILITY\b/.test(l));
    if (bs.length !== 1) errors.push("S0 must contain exactly one line starting BIRTH TIME STABILITY, found " + bs.length);
    else {
      const u = /\bUNSTABLE\b/.test(bs[0].toUpperCase()), st = /\bSTABLE\b/.test(bs[0].toUpperCase());
      if (u === st) errors.push("The BIRTH TIME STABILITY line must contain exactly one of STABLE, UNSTABLE");
      unstable = u;
    }
  }

  // time status inside S6. One line when STABLE. When UNSTABLE one line per candidate ascendant is allowed.
  if (s6) {
    const end = s7 ? s7.line : lines.length;
    const body = lines.slice(s6.line, end);
    const ts = body.filter(l => /^TIME STATUS\b/.test(l));
    if (ts.length < 1 || (!unstable && ts.length !== 1)) errors.push("S6 must contain " + (unstable ? "at least one" : "exactly one") + " line starting TIME STATUS, found " + ts.length);
    ts.forEach(l => {
      const hits = ["ALREADY HAPPENED", "HAPPENING NOW", "WILL HAPPEN"].filter(v => l.toUpperCase().indexOf(v) >= 0);
      if (hits.length !== 1) errors.push("Each TIME STATUS line must contain exactly one of ALREADY HAPPENED, HAPPENING NOW, WILL HAPPEN");
    });
  }

  // S9: final answers and closing bullets
  let finalLines = [];
  if (s9) {
    const body = lines.slice(s9.line + 1);
    const fa = body.filter(l => /^FINAL ANSWER\b/.test(l));
    if (unstable) {
      if (fa.length < 1) errors.push("S9 must contain at least one line starting FINAL ANSWER, found 0");
      else if (fa.length < 2) warnings.push("BIRTH TIME STABILITY is UNSTABLE but only one FINAL ANSWER line is given. S8 must then state that every candidate ascendant gives the same answer");
    } else if (fa.length !== 1) errors.push("S9 must contain exactly one line starting FINAL ANSWER, found " + fa.length);
    finalLines = fa.map(l => l.replace(/^FINAL ANSWER\s*/i, ""));
    let end = lines.length - 1;
    while (end >= 0 && lines[end].trim() === "") end--;
    const bullets = [];
    for (let i = end; i >= 0 && /^•\s+\S/.test(lines[i]); i--) bullets.unshift(lines[i]);
    if (bullets.length < 2 || bullets.length > 3) errors.push("The answer must end with 2 or 3 bullet lines starting with the dot character, found " + bullets.length + " at the end");
    bullets.forEach(b => { if (b.length > 240) errors.push("A closing bullet is longer than a one liner: \"" + b.slice(0, 40) + "...\""); });
    if (bullets.length && !/^•\s+Final answer\b/i.test(bullets[bullets.length - 1])) errors.push("The last bullet must start with Final answer");
    if (bullets.length && fa.some(l => lines.indexOf(l) > end - bullets.length)) errors.push("FINAL ANSWER lines must come before the closing bullets");
  }

  // options, checked for every FINAL ANSWER line
  if (opts.options && opts.options.length) {
    if (!finalLines.length) errors.push("No FINAL ANSWER line to check against the options");
    finalLines.forEach((fl, i) => {
      const hit = opts.options.filter(o => fl.toLowerCase().indexOf(o.toLowerCase()) >= 0);
      const longest = hit.filter(o => !hit.some(p => p !== o && p.toLowerCase().indexOf(o.toLowerCase()) >= 0));
      if (longest.length !== 1) errors.push("FINAL ANSWER line " + (i + 1) + " must name exactly one of the given options, it names " + longest.length);
    });
  } else finalLines.forEach((fl, i) => { if (fl.trim().length < 3) errors.push("FINAL ANSWER line " + (i + 1) + " is empty"); });

  // owner style characters
  const bad = (text.match(STYLE_CHARS) || []);
  if (bad.length) {
    const uniq = Array.from(new Set(bad)).join(" ");
    (opts.strictStyle ? errors : warnings).push("Characters the owner does not want in responses appear " + bad.length + " times: " + uniq);
  }
  return { ok: errors.length === 0, errors, warnings, finalAnswer: finalLines[0] || null, finalAnswers: finalLines, unstable };
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  const file = argv.find(a => !a.startsWith("--") && argv[argv.indexOf(a) - 1] !== "--options");
  if (!file) { console.error("Usage: answer_guard.js answer.txt [--options \"A|B\"] [--strict-style]"); process.exit(2); }
  const oi = argv.indexOf("--options");
  const options = oi >= 0 ? argv[oi + 1].split("|").map(s => s.trim()).filter(Boolean) : [];
  const res = check(fs.readFileSync(file, "utf8"), { options, strictStyle: argv.indexOf("--strict-style") >= 0 });
  res.errors.forEach(e => console.log("ERROR " + e));
  res.warnings.forEach(w => console.log("WARNING " + w));
  console.log(res.ok ? "GUARD PASSED" : "GUARD FAILED");
  process.exit(res.ok ? 0 : 1);
}
module.exports = { check };
