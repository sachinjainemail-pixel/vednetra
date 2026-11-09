#!/usr/bin/env node
/*
 * SUJ engine answer guard. Checks a drafted answer against the owner's hard coded rules before it is sent.
 *
 *   node suj_engine/tools/answer_guard.js answer.txt [--options "Option A|Option B"] [--strict-style]
 *
 * Errors (exit code 1): hedging or undecided language in English or Hindi, missing or misordered sections S0 to
 * S9, no TIME STATUS line with one of the three allowed values, no final answer line, final answer not one of
 * the given options, closing bullets not 2 or 3 one liners at the very end, last bullet not starting with the
 * Hindi marker for Final answer.
 *
 * Language rule (owner's fifth instruction round): section S9 SUMMARY is written in Hindi in Devanagari script.
 * That covers the recap lines, the final answer line, which starts with अंतिम उत्तर, and the 2 or 3 closing
 * bullets, the last of which starts with अंतिम उत्तर. Sections S0 to S8 stay in English. The heading S9. SUMMARY
 * and the line TIME STATUS in S6 stay in English because the guard reads them. Option texts given with
 * --options are quoted as given and are not counted against the Hindi share.
 *
 * Warnings: characters the owner does not want in responses. They become errors with --strict-style.
 */
const fs = require("fs");

const FINAL_MARK = "अंतिम उत्तर";                 // Hindi for Final answer
const DEVANAGARI = /[ऀ-ॿ]/g;
const LATIN_LETTER = /[A-Za-z]/g;
const BULLET_MAX = 300;                          // Hindi runs longer than English for the same sentence
const HINDI_SHARE_MIN = 0.7;                     // share of Devanagari letters among all letters in S9

const BANNED = [
  /can(?:no|')t (?:be )?(?:differentiate|distinguish|decide|determine|choose|say|tell|conclude)/i,
  /(?:unable|not able|impossible|difficult|hard) to (?:differentiate|distinguish|decide|determine|choose|say|tell|conclude|pick)/i,
  /not possible to (?:differentiate|distinguish|decide|determine|choose|say|tell|conclude)/i,
  /(?:no|not a) clear (?:answer|winner|result|option)/i,
  /(?:options?|choices?|planets?|results?) (?:are|is) (?:equally|equal|evenly|tied)/i,
  /equally (?:likely|possible|probable|strong)/i,
  /\binconclusive\b/i, /\bit depends\b/i, /insufficient (?:evidence|data|information) to/i,
  /\bwe cannot know\b/i, /\bcannot be (?:known|determined|decided|predicted)\b/i, /\bno definitive\b/i,
  // Hindi hedging, for the Hindi summary
  /निर्णय (?:नहीं|करना (?:कठिन|मुश्किल|संभव नहीं))/,
  /(?:कहना|बताना|तय करना|निश्चित करना|चुनना|निर्धारित करना) (?:कठिन|मुश्किल|संभव नहीं|असंभव)/,
  /(?:अंतर|भेद) (?:नहीं )?(?:करना|कर पाना) (?:कठिन|मुश्किल|संभव नहीं)/,
  /(?:स्पष्ट|निश्चित|निर्णायक) (?:उत्तर|निष्कर्ष|विजेता) नहीं/,
  /(?:दोनों|सभी|विकल्प|ग्रह) (?:समान|बराबर) (?:रूप से )?(?:बलवान|संभव|रूप से)/,
  // no \b here, JavaScript word boundaries do not work on Devanagari
  /निर्भर करता है/, /अनिर्णायक/, /कुछ कहा नहीं जा सकता/, /नहीं जाना जा सकता/, /निश्चित नहीं कहा जा सकता/
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
    const fa = body.filter(l => l.startsWith(FINAL_MARK));
    if (fa.length !== 1) {
      errors.push("S9 must contain exactly one line starting " + FINAL_MARK + " (Hindi for Final answer), found " + fa.length);
      if (body.some(l => /^FINAL ANSWER\b/.test(l))) errors.push("The summary must be in Hindi. Replace the English line FINAL ANSWER with a Hindi line starting " + FINAL_MARK);
    } else finalLine = fa[0].slice(FINAL_MARK.length).trim();
    let end = lines.length - 1;
    while (end >= 0 && lines[end].trim() === "") end--;
    const bullets = [];
    for (let i = end; i >= 0 && /^•\s+\S/.test(lines[i]); i--) bullets.unshift(lines[i]);
    if (bullets.length < 2 || bullets.length > 3) errors.push("The answer must end with 2 or 3 bullet lines starting with the dot character, found " + bullets.length + " at the end");
    bullets.forEach(b => { if (b.length > BULLET_MAX) errors.push("A closing bullet is longer than a one liner: \"" + b.slice(0, 40) + "...\""); });
    if (bullets.length && !new RegExp("^•\\s+" + FINAL_MARK).test(bullets[bullets.length - 1])) errors.push("The last bullet must start with " + FINAL_MARK + " (Hindi for Final answer)");
    if (bullets.length && fa.length === 1 && lines.indexOf(fa[0]) > end - bullets.length) errors.push("The " + FINAL_MARK + " line must come before the closing bullets");

    // Hindi language check on the whole of S9. Option texts are quoted as given, so they are removed first.
    let s9text = body.join("\n");
    (opts.options || []).forEach(o => { s9text = s9text.split(o).join(" "); });
    const dev = (s9text.match(DEVANAGARI) || []).length;
    const lat = (s9text.match(LATIN_LETTER) || []).length;
    const share = dev + lat ? dev / (dev + lat) : 0;
    if (share < HINDI_SHARE_MIN) errors.push("Section S9 SUMMARY must be written in Hindi in Devanagari script, the Devanagari share is " + Math.round(share * 100) + " percent and the minimum is " + Math.round(HINDI_SHARE_MIN * 100) + " percent");
    body.forEach(l => {
      if (l.trim() && (l.match(DEVANAGARI) || []).length < 3 && !(opts.options || []).some(o => l.indexOf(o) >= 0)) errors.push("A line in S9 has no Hindi text: \"" + l.trim().slice(0, 50) + "\"");
    });
  }

  // options
  if (opts.options && opts.options.length) {
    if (finalLine == null) errors.push("No अंतिम उत्तर line to check against the options");
    else {
      const hit = opts.options.filter(o => finalLine.toLowerCase().indexOf(o.toLowerCase()) >= 0);
      const longest = hit.filter(o => !hit.some(p => p !== o && p.toLowerCase().indexOf(o.toLowerCase()) >= 0));
      if (longest.length !== 1) errors.push("The अंतिम उत्तर line must name exactly one of the given options, it names " + longest.length);
    }
  } else if (finalLine != null && finalLine.trim().length < 3) errors.push("FINAL ANSWER is empty");

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
  const res = check(fs.readFileSync(file, "utf8"), { options, strictStyle: argv.indexOf("--strict-style") >= 0 });
  res.errors.forEach(e => console.log("ERROR " + e));
  res.warnings.forEach(w => console.log("WARNING " + w));
  console.log(res.ok ? "GUARD PASSED" : "GUARD FAILED");
  process.exit(res.ok ? 0 : 1);
}
module.exports = { check };
