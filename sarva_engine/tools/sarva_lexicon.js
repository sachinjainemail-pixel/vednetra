#!/usr/bin/env node
/*
 * SARVA engine LEXICON lookup. Translates a question option, such as Gynecologist, Government job, Diabetes, Husband profession,
 * into the houses, planets, signs, KP cards, KCIL cusps and BNN rule ids that each of the seven methodologies reads.
 *
 *   node sarva_engine/tools/sarva_lexicon.js "Dentist"
 *   node sarva_engine/tools/sarva_lexicon.js --options "A Gynecologist|B Pediatrician|C Dentist|D Skin specialist" [--column KPPRO]
 *   node sarva_engine/tools/sarva_lexicon.js --options "..." --family            print the recipe of the matched question family
 *   node sarva_engine/tools/sarva_lexicon.js --card EDU.02                      print one KP PRO MAX card
 *   node sarva_engine/tools/sarva_lexicon.js --list [cat]    --stats    --check
 *
 * What the lexicon is. A signification dictionary, built from the owner's KP PRO MAX cards and KCIL tables, the BNN rule base,
 * and classical karaka lists. It adds no methodology and no verdict. It only says which houses, planets and cusps an option
 * belongs to, so that each column can run its own rules on the option. See ENGINE_CONTRACT.md section 12.
 * Provenance. Output lines marked CITE come from the owner corpora of that column, tier T1, and may be cited in an EVIDENCE line.
 * Lines marked HINT ONLY are web summaries, tier T3, or the analyst's karaka lists, tier T4. A hint translates an option into
 * houses and is never the evidence of a cell. An option that matches no entry prints NO ENTRY and is not given the nearest planet.
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const LEX = path.join(__dirname, "..", "knowledge", "lexicon");
const read = f => JSON.parse(fs.readFileSync(path.join(LEX, f), "utf8"));
const CATFILES = ["medical", "professions", "business", "diseases", "income", "relations"];
const COLS = { KPPRO: "KP", KCIL: "KCIL", SUJ: "SUJ", CHAWDHRI: "CHAWDHRI", BNN: "BNN" };
const NODE = process.execPath;

function load() {
  const entries = [].concat.apply([], CATFILES.map(c => read("taxonomy_" + c + ".json")));
  return { entries, cards: read("kp_cards.json"), index: read("kp_event_index.json"), matrix: read("kcil_event_matrix.json"), recipes: read("recipes.json"), core: read("core.json"), sources: read("sources.json") };
}
const norm = s => String(s || "").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
const stripLabel = s => String(s).replace(/^\s*\(?[A-Za-z]\)?[\s.:)\-]+(?=\S)/, "").trim();

function score(entry, q) {
  const nq = norm(q); if (!nq) return 0;
  const names = [entry.name].concat(entry.aliases).map(norm).filter(Boolean);
  let best = 0;
  names.forEach(n => {
    if (n === nq) best = Math.max(best, 20);
    else if (nq.length >= 3 && n.indexOf(nq) >= 0) best = Math.max(best, 12 + Math.min(4, nq.length / 4));
    else if (n.length >= 3 && nq.indexOf(n) >= 0) best = Math.max(best, 10 + Math.min(4, n.length / 4));
  });
  const qt = new Set(nq.split(" ").filter(t => t.length > 2));
  let ov = 0;
  names.forEach(n => { const nt = n.split(" ").filter(t => t.length > 2); const c = nt.filter(t => qt.has(t)).length; if (c) ov = Math.max(ov, c * 3); });
  return Math.max(best, ov);
}
function match(L, q, cat, limit) {
  return L.entries.filter(e => !cat || e.cat === cat).map(e => ({ e, s: score(e, q) })).filter(x => x.s >= 3).sort((a, b) => b.s - a.s).slice(0, limit || 3);
}
function eventRows(L, q) {
  const nq = norm(q).split(" ").filter(t => t.length > 3);
  const hit = (txt) => nq.filter(t => norm(txt).indexOf(t) >= 0).length;
  const kp = L.index.map(r => ({ r, h: hit(r.matter) })).filter(x => x.h).sort((a, b) => b.h - a.h).slice(0, 3).map(x => x.r);
  const kc = L.matrix.map(r => ({ r, h: hit(r.matter) })).filter(x => x.h).sort((a, b) => b.h - a.h).slice(0, 3).map(x => x.r);
  return { kp, kc };
}
function bnnIds(keywords, limit) {
  const out = [];
  for (const kw of keywords.slice(0, 3)) {
    const r = spawnSync(NODE, [path.join(__dirname, "bnn_rules.js"), JSON.stringify({ q: kw, limit: limit || 3 })], { encoding: "utf8", timeout: 20000 });
    if (r.status !== 0) continue;
    (r.stdout.match(/^[A-Z]{3}-[A-Z]{3}-\d{3}(?= \|)/gm) || []).forEach(id => { if (out.indexOf(id) < 0) out.push(id); });
  }
  return out.slice(0, 8);
}
function cardLines(L, code, sections) {
  const c = L.cards.find(x => x.code === code); if (!c) return null;
  return { code: c.code, title: c.title, houses: c.houses, bullets: [].concat.apply([], Object.keys(c.sections).filter(k => !sections || sections.some(s => k.indexOf(s) === 0)).map(k => c.sections[k].map(b => k.split(" ")[0] + " " + b))) };
}
function describe(L, e, col, opts) {
  const o = [];
  const own = col ? COLS[col] : null;
  o.push("ENTRY " + e.id + " " + e.name + "  category " + e.cat + "  best tier " + e.best_tier);
  const show = (label, tier, txt, isMap) => o.push("  " + (isMap ? (tier === "T1" ? "MAP T1    " : "MAP T4    ") : (tier === "T1" ? "CITE      " : "HINT ONLY ")) + label + " " + txt);
  const v = e.vedic;
  if (!col || col === "SUJ" || col === "CHAWDHRI") show("VEDIC houses " + v.houses.join(","), "T4", "planets " + v.planets.join(",") + " signs " + v.signs.join(",") + " karaka lists from memory, translate the option only", true);
  if (!col || col === "KPPRO") show("KP houses " + e.kp.houses.join(","), e.kp.tier, "csl planets " + e.kp.csl_planets.join(",") + " cards " + e.kp.cards.join(",") + ", the analyst reading of the KP corpus, cite the sentence and the card and not this map", true);
  if (!col || col === "KCIL") show("KCIL event cusps " + e.kcil.primary.join(",") + " supporting " + e.kcil.supporting.join(","), e.kcil.tier, "TA field houses " + e.kcil.ta_houses.join(",") + ", the analyst reading of the KCIL tables, cite the sentence and not this map", true);
  e.evidence.forEach(ev => {
    const t = ev.src === "WEB" ? "T3" : (["KP", "KCIL", "BNN", "CHAWDHRI", "SUJ"].indexOf(ev.src) >= 0 ? "T1" : "T4");
    if (own && ["KP", "KCIL", "BNN", "CHAWDHRI", "SUJ"].indexOf(ev.src) >= 0 && ev.src !== own) return; // isolation, another column's corpus text is not shown to this column
    show("[" + ev.src + "]", t, ev.text);
  });
  if (!col || col === "BNN") {
    if (opts.bnn) { const ids = bnnIds(e.bnn_keywords); o.push("  " + (ids.length ? "CANDIDATES " : "NONE       ") + "BNN keyword search " + e.bnn_keywords.join(",") + " rule ids " + (ids.join(" ") || "none, the register does not name this, grade OPEN") + (ids.length ? ". A keyword hit is not a match, read each rule with bnn_rules.js and cite only the ones that name the option" : "")); }
    else o.push("  BNN search keywords " + e.bnn_keywords.join(",") + " (run without --no-bnn to look up rule ids)");
  }
  if ((!col || col === "KPPRO") && e.kp.cards.length && opts.cards) e.kp.cards.forEach(code => { const c = cardLines(L, code, ["Nature"]); if (c) { o.push("  CITE      KP card " + c.code + " " + c.title + " houses " + c.houses.slice(0, 160)); c.bullets.slice(0, 4).forEach(b => o.push("            " + b.slice(0, 260))); } });
  return o;
}
function familyOf(entries) {
  const cats = entries.map(e => e.cat);
  const has = c => cats.indexOf(c) >= 0;
  const ids = entries.map(e => e.id).join(" ");
  if (/prf\.(pvt_job|govt_job|own_business)/.test(ids)) return "service_or_business_or_government";
  if (has("relationship")) return "relatives_and_family";
  if (has("disease")) return "disease_or_health";
  if (has("income")) return "income_and_wealth";
  return "speciality_or_degree";
}

function main() {
  const L = load();
  const argv = process.argv.slice(2);
  const flag = f => argv.indexOf(f) >= 0;
  const val = f => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : null; };
  const opts = { bnn: !flag("--no-bnn"), cards: !flag("--no-cards") };
  const col = val("--column");
  if (col && !COLS[col]) { console.error("column must be one of " + Object.keys(COLS).join(", ")); process.exit(2); }

  if (flag("--stats")) {
    const c = {}; L.entries.forEach(e => { c[e.cat] = (c[e.cat] || 0) + 1; });
    const t = {}; L.entries.forEach(e => { t[e.best_tier] = (t[e.best_tier] || 0) + 1; });
    console.log("SARVA LEXICON entries " + L.entries.length + " by category " + JSON.stringify(c) + " by best tier " + JSON.stringify(t) + ", KP cards " + L.cards.length + ", KP event index " + L.index.length + ", KCIL matrix rows " + L.matrix.length);
    return;
  }
  if (flag("--list")) { const cat = val("--list"); L.entries.filter(e => !cat || e.cat === cat || e.cat.indexOf(cat) === 0).forEach(e => console.log(e.id + "  " + e.name + "  [" + e.best_tier + "]")); return; }
  if (flag("--card")) {
    const code = val("--card"); const c = L.cards.find(x => x.code === code);
    if (!c) { console.error("no card " + code); process.exit(1); }
    console.log("KP PRO MAX card " + c.code + " " + c.title + " (" + c.file + ")\nHouses " + c.houses);
    Object.keys(c.sections).forEach(k => { console.log("\n" + k); c.sections[k].forEach(b => console.log("  - " + b)); }); return;
  }
  if (flag("--check")) return check(L);

  let optionsArg = val("--options");
  let queries;
  if (optionsArg) queries = optionsArg.split("|").map(x => x.trim()).filter(Boolean);
  else { queries = argv.filter(a => !a.startsWith("--") && a !== col); if (!queries.length) { console.error("give a term, --options, --card, --list, --stats or --check"); process.exit(2); } }
  const cat = val("--cat");
  const all = [], summary = [];
  queries.forEach(q0 => {
    const label = optionsArg ? (q0.match(/^\s*\(?([A-Za-z])\)?[\s.:)\-]/) || [])[1] : null;
    const q = optionsArg ? stripLabel(q0) : q0;
    console.log("\nOPTION " + (label ? label.toUpperCase() + " " : "") + q);
    const ms = match(L, q, cat, 2);
    if (!ms.length) {
      console.log("  NO ENTRY. The lexicon holds no entry for this option. Do not give it the nearest planet. Say so in the EVIDENCE line, grade BNN OPEN, and read the KP event index and the KCIL matrix rows below if any.");
      const er = eventRows(L, q); er.kp.forEach(r => console.log("  KP index " + r.code + " " + r.matter + " houses " + r.houses)); er.kc.forEach(r => console.log("  KCIL matrix " + r.matter + " primary " + r.primary + " supporting " + r.supporting));
      summary.push({ q, none: true }); return;
    }
    const qt = norm(q).split(" ").filter(t => t.length > 2);
    const have = new Set([].concat.apply([], [ms[0].e.name].concat(ms[0].e.aliases).map(n => norm(n).split(" "))));
    const missing = qt.filter(t => !have.has(t) && !Array.from(have).some(h => h.length > 3 && (h.indexOf(t) >= 0 || t.indexOf(h) >= 0)));
    if (qt.length >= 2 && missing.length) console.log("  PARTIAL MATCH. These words are not in the entry: " + missing.join(" ") + ". Treat the match as the nearest entry only. If the missing words change the meaning, the option has NO ENTRY, do not use the planets below.");
    ms.forEach((m, i) => { if (i === 0 || m.s >= ms[0].s - 2) { describe(L, m.e, col, opts).forEach(l => console.log(l)); all.push(m.e); } });
    summary.push({ q, e: ms[0].e });
  });
  if (optionsArg) {
    // symmetric check so that no option wins by having a longer entry
    console.log("\nSYMMETRY CHECK, the count of T1 sentences per option. A large gap means the entries are not equally detailed and the tally must not read that gap as evidence.");
    summary.forEach(s => { const mine = col ? [COLS[col]] : ["KP", "KCIL", "BNN", "CHAWDHRI"]; console.log("  " + s.q + "  " + (s.none ? "no entry" : s.e.evidence.filter(x => mine.indexOf(x.src) >= 0).length + " T1 sentences" + (col ? " of " + col : "") + ", houses KP " + s.e.kp.houses.length + " KCIL ta " + s.e.kcil.ta_houses.length)); });
  }
  if (flag("--family")) {
    const fam = familyOf(all); const r = L.recipes[fam];
    console.log("\nRECIPE " + fam);
    (r.steps_common || []).forEach(s => console.log("  step " + s));
    Object.keys(COLS).forEach(c => { if ((!col || col === c) && r[c]) console.log("  " + c + " " + r[c]); });
    (r.pitfalls || []).forEach(p => console.log("  pitfall " + p));
  }
  console.log("\nREMINDER A lexicon line translates an option and decides nothing. Each column casts its own chart and applies its own rules. Only CITE lines of that column may appear in its EVIDENCE line.");
}

function check(L) {
  const errs = [];
  const ids = new Set();
  L.entries.forEach(e => {
    if (ids.has(e.id)) errs.push("duplicate id " + e.id); ids.add(e.id);
    if (!e.name || !e.aliases.length) errs.push(e.id + " needs a name and aliases");
    [].concat(e.vedic.houses, e.kp.houses, e.kcil.primary, e.kcil.supporting, e.kcil.ta_houses).forEach(h => { if (!(h >= 1 && h <= 12)) errs.push(e.id + " house out of range " + h); });
    e.kp.cards.forEach(c => { if (!L.cards.some(x => x.code === c) && !L.index.some(x => x.code === c)) errs.push(e.id + " unknown KP code " + c); });
    if (!e.bnn_keywords.length) errs.push(e.id + " no bnn keyword");
    if (!e.evidence.length) errs.push(e.id + " no note");
    // a T1 tier claim needs a sentence of that column
    if (e.kp.tier === "T1" && !e.evidence.some(x => x.src === "KP")) errs.push(e.id + " kp tier without a KP sentence");
    if (e.kcil.tier === "T1" && !e.evidence.some(x => x.src === "KCIL")) errs.push(e.id + " kcil tier without a KCIL sentence");
  });
  L.sources.sources.forEach(s => { if (s.tier === "T3" && s.page_read) errs.push(s.id + " claims the page was read"); if (s.tier === "T3" && s.url && /example/.test(s.url)) errs.push(s.id + " has a made up url"); });
  Object.keys(L.recipes).filter(k => k[0] !== "_").forEach(k => { ["KPPRO", "KCIL", "SUJ", "CHAWDHRI", "BNN"].forEach(c => { if (!L.recipes[k][c]) errs.push("recipe " + k + " lacks " + c); }); });
  const rot = L.core.derived_house_rule.table; Object.keys(rot).forEach(k => { const vals = Object.values(rot[k]); if (new Set(vals).size !== 12) errs.push("rotation table " + k + " is not a permutation"); });
  if (errs.length) { errs.forEach(e => console.log("ERROR " + e)); console.log("LEXICON CHECK FAILED with " + errs.length + " errors"); process.exit(1); }
  console.log("LEXICON CHECK PASSED, " + L.entries.length + " entries, " + L.cards.length + " KP cards, " + L.matrix.length + " KCIL matrix rows");
}
main();
