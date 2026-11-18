#!/usr/bin/env node
/*
 * SARVA engine UDU RULE LOOKUP. Reads the Udu corpus installed in sarva_engine/knowledge/udu/ukn, 16,008 UDU rules in 21 life event files,
 * and the 1,006 rule KN timing corpus in the 13 KN files. The rules are the owner's. Nothing here edits or paraphrases a rule.
 *
 *   node sarva_engine/tools/udu_rules.js --stats
 *   node sarva_engine/tools/udu_rules.js --check
 *   node sarva_engine/tools/udu_rules.js --id AVA-2-0092
 *   node sarva_engine/tools/udu_rules.js '{"ev":"marriage","nak":"Ashvini","planet":"Moon","pada":2,"q":"spouse","limit":10}'
 *   node sarva_engine/tools/udu_rules.js --kn '{"q":"double agent"}'
 *
 * Rule line, from INDEX.md. ID, placement fields nak, pada, planet, house, sign, source book and page, polarity and confidence, then IF and THEN.
 * Weight equals polarity times confidence times specificity. Polarity benefic +1, malefic minus 1, mixed 0. Confidence classical 1.2, stated 1.0, inferred 0.7.
 * Specificity pada 1.5, planet in nakshatra 1.3, nakshatra alone 1.0, house or sign alone 0.6.
 * INDEX.md rule 5. A UDU rule may never be cited for a timing claim and a KN rule may never be cited for a nakshatra content claim.
 */
const fs = require("fs");
const path = require("path");
const DIR = path.join(__dirname, "..", "knowledge", "udu", "ukn");
const EVENTS = ["career", "nature", "wealth", "health", "timing", "dharma", "family", "marriage", "relations", "education", "core", "remedy", "longevity", "body", "muhurta", "progeny", "enemies", "property", "matching", "travel", "mundane"];
// The Udu document routes a question to nine corpus files. This corpus is split by life event, so the nine routes map to these files.
const ROUTES = {
  "UDU-vivah-sambandh": ["marriage", "relations", "matching"], "UDU-karya-dhan": ["career", "wealth", "property"], "UDU-arogya-ayu": ["health", "body", "longevity"],
  "UDU-vidya-swabhav": ["nature", "education"], "UDU-santan-parivar": ["progeny", "family"], "UDU-dharma-upay": ["dharma", "remedy"],
  "UDU-samay-muhurat": ["timing", "muhurta"], "UDU-yatra-shatru": ["travel", "enemies"], "UDU-mool-tattva": ["core"]
};
const POL = { "+": 1, "-": -1, "~": 0 }, CONF = { classical: 1.2, stated: 1.0, inferred: 0.7 };
// canonical nakshatra key, the corpus spells the 27 names in several ways
const ALIAS = { aridra: "ardra", mola: "mula" };
function nakKey(s) {
  let k = String(s || "").toLowerCase().replace(/[^a-z]/g, "").replace(/w/g, "v").replace(/h/g, "").replace(/(.)\1+/g, "$1");
  return ALIAS[k] || k;
}
const RX = /^- \*\*([A-Za-z0-9\-]+)\*\* · (?:(.*) · )?([^·]+) · ([+\-~])\/(classical|stated|inferred)\s*$/;
let CACHE = null;
function present() { return fs.existsSync(path.join(DIR, "INDEX.md")) && EVENTS.every(e => fs.existsSync(path.join(DIR, "UDU-" + e.toUpperCase() + ".md"))); }
function parseFile(ev) {
  const lines = fs.readFileSync(path.join(DIR, "UDU-" + ev.toUpperCase() + ".md"), "utf8").split("\n");
  const out = []; let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (l.startsWith("- **")) {
      const m = RX.exec(l); if (!m) { throw new Error("unparsed rule line in UDU-" + ev.toUpperCase() + ".md: " + l.slice(0, 100)); }
      const r = { id: m[1], ev, nak: null, pada: null, planet: null, house: null, sign: null, book: null, page: null, pol: m[4], conf: m[5], if: "", then: "" };
      (m[2] || "").split(", ").forEach(p => { const sp = p.indexOf(" "); if (sp < 0) return; const k = p.slice(0, sp), v = p.slice(sp + 1); if (k === "nak") r.nak = v; else if (k === "pada") r.pada = Number(v); else if (k === "planet") r.planet = v; else if (k === "house") r.house = Number(v); else if (k === "sign") r.sign = v; });
      const sp = m[3].trim().match(/^(.*?) p([\d\-–, ]+)$/); r.book = sp ? sp[1] : m[3].trim(); r.page = sp ? sp[2] : null;
      let j = i + 1;
      while (j < lines.length && !lines[j].startsWith("- **") && !lines[j].startsWith("## ")) {
        const t = lines[j].trim();
        if (t.startsWith("**IF**")) r.if = t.slice(6).trim(); else if (t.startsWith("**THEN**")) r.then = t.slice(8).trim(); else if (t && r.then) r.then += " " + t;
        j++;
      }
      r.nk = r.nak ? nakKey(r.nak) : null;
      r.spec = r.pada ? 1.5 : (r.planet && r.nak) ? 1.3 : r.nak ? 1.0 : 0.6;
      r.w = POL[r.pol] * CONF[r.conf] * r.spec;
      out.push(r); i = j;
    } else i++;
  }
  return out;
}
function load() {
  if (CACHE) return CACHE;
  if (!present()) throw new Error("the Udu corpus is not installed in " + DIR);
  const all = []; EVENTS.forEach(ev => parseFile(ev).forEach(r => all.push(r)));
  const byId = new Map(); all.forEach(r => byId.set(r.id, r));
  CACHE = { all, byId }; return CACHE;
}
function stats() {
  const { all } = load(); const per = {}; const books = {}; const pol = {};
  all.forEach(r => { per[r.ev] = (per[r.ev] || 0) + 1; const b = r.id.replace(/-?\d+[a-z]?$/, ""); books[b] = (books[b] || 0) + 1; pol[r.pol] = (pol[r.pol] || 0) + 1; });
  return { total: all.length, perEvent: per, books, polarity: pol };
}
function query(q) {
  q = q || {}; const { all } = load();
  const evs = q.ev ? [].concat(q.ev) : null, nk = q.nak ? nakKey(q.nak) : null, pl = q.planet ? String(q.planet).toLowerCase() : null, tx = q.q ? String(q.q).toLowerCase() : null;
  let r = all.filter(x => (!evs || evs.indexOf(x.ev) >= 0) && (!nk || x.nk === nk) && (!q.pada || x.pada === Number(q.pada)) && (!pl || (x.planet || "").toLowerCase() === pl) && (!q.house || x.house === Number(q.house)) && (!tx || (x.if + " " + x.then).toLowerCase().indexOf(tx) >= 0));
  return q.limit ? r.slice(0, q.limit) : r;
}
function show(r) { return r.id + " | " + r.ev + " | " + [r.nak && "nak " + r.nak, r.pada && "pada " + r.pada, r.planet && "planet " + r.planet, r.house && "house " + r.house, r.sign && "sign " + r.sign].filter(Boolean).join(", ") + " | " + r.book + (r.page ? " p" + r.page : "") + " | " + r.pol + "/" + r.conf + " weight " + (Math.round(r.w * 100) / 100) + "\n  IF " + r.if + "\n  THEN " + r.then; }

// ---- KN corpus, the timing rules
function loadKN() {
  const files = fs.readdirSync(DIR).filter(f => /^KN-(E\d\d|MACHINERY)\.md$/.test(f));
  const out = [];
  files.forEach(f => {
    const L = fs.readFileSync(path.join(DIR, f), "utf8").split("\n"); const prot = f.replace(/^KN-|\.md$/g, "");
    for (let i = 0; i < L.length; i++) {
      const m = /^- \*\*([A-Za-z0-9\-]+)\*\*(?: · ([A-Za-z0-9\-]+))?(?: · (cited by protocol (E\d\d)|keyword match))?\s*$/.exec(L[i]);
      if (!m) continue;
      let t = ""; let j = i + 1; while (j < L.length && !L[j].startsWith("- **") && !L[j].startsWith("## ")) { t += " " + L[j].trim(); j++; }
      out.push({ id: m[1], book: m[2] || m[1].split("-")[0], protocol: prot, how: m[3] || "", text: t.trim() });
    }
  });
  return out;
}

function check() {
  const errs = []; const idx = fs.readFileSync(path.join(DIR, "INDEX.md"), "utf8");
  const { all } = load(); const ids = new Set(all.map(r => r.id));
  if (ids.size !== all.length) errs.push("duplicate rule ids");
  const total = Number((/Total UDU rules ([\d,]+)/.exec(idx) || [])[1].replace(/,/g, ""));
  if (all.length !== total) errs.push("rule count " + all.length + " differs from the INDEX total " + total);
  const st = stats();
  const rows = idx.match(/^\| `([a-z]+)` \| (\d+) \|/gm) || [];
  rows.forEach(r => { const m = /\| `([a-z]+)` \| (\d+) \|/.exec(r); if (st.perEvent[m[1]] !== Number(m[2])) errs.push("event " + m[1] + " has " + st.perEvent[m[1]] + " rules, INDEX says " + m[2]); });
  if (rows.length !== EVENTS.length) errs.push("INDEX lists " + rows.length + " events, expected " + EVENTS.length);
  const keys = new Set(all.filter(r => r.nk).map(r => r.nk)); keys.delete("abijit");
  if (keys.size !== 27) errs.push("expected 27 canonical nakshatra keys, found " + keys.size + " " + Array.from(keys).sort().join(","));
  const kn = loadKN(); const knRows = (idx.match(/^\| KN [^|]+\| (\d+) \| `(KN-[A-Z0-9]+\.md)` \|/gm) || []).map(x => /\| (\d+) \| `(KN-[A-Z0-9]+)\.md`/.exec(x));
  knRows.forEach(m => { const n = kn.filter(k => k.protocol === m[2].replace("KN-", "")).length; if (n !== Number(m[1])) errs.push("KN " + m[2] + " has " + n + " rules, INDEX says " + m[1]); });
  const knIds = new Set(kn.map(k => k.id)); if (knIds.size !== 1006) errs.push("KN unique rule ids " + knIds.size + ", INDEX says 1,006");
  if (errs.length) { errs.forEach(e => console.log("ERROR " + e)); console.log("UDU CORPUS CHECK FAILED with " + errs.length + " errors"); process.exit(1); }
  console.log("UDU CORPUS CHECK PASSED, " + all.length + " UDU rules in " + EVENTS.length + " files, " + knIds.size + " unique KN rules, 27 nakshatras");
}

module.exports = { present, load, query, stats, nakKey, loadKN, EVENTS, ROUTES, POL, CONF, show };

if (require.main === module) {
  const a = process.argv.slice(2);
  if (!present()) { console.error("the Udu corpus is not installed in " + DIR); process.exit(1); }
  if (a.indexOf("--check") >= 0) check();
  else if (a.indexOf("--stats") >= 0) { const s = stats(); console.log("UDU rules " + s.total + "\nper event " + JSON.stringify(s.perEvent) + "\nbooks " + JSON.stringify(s.books) + "\npolarity " + JSON.stringify(s.polarity) + "\nKN rules " + new Set(loadKN().map(k => k.id)).size); }
  else if (a.indexOf("--id") >= 0) { const r = load().byId.get(a[a.indexOf("--id") + 1]); if (!r) { console.error("no such rule"); process.exit(1); } console.log(show(r)); }
  else if (a.indexOf("--kn") >= 0) {
    const q = JSON.parse(a.find(x => x.trim().startsWith("{")) || "{}"); const tx = (q.q || "").toLowerCase();
    const r = loadKN().filter(k => (!q.protocol || k.protocol === q.protocol) && (!tx || k.text.toLowerCase().indexOf(tx) >= 0)).slice(0, q.limit || 10);
    r.forEach(k => console.log(k.id + " | " + k.book + " | " + k.protocol + " | " + (k.how || "machinery") + "\n  " + k.text.slice(0, 400))); console.log(r.length + " KN rules shown");
  } else {
    const q = JSON.parse(a.find(x => x.trim().startsWith("{")) || "{}"); const r = query(q);
    r.slice(0, q.limit || 10).forEach(x => console.log(show(x))); console.log("\n" + r.length + " rules match, " + Math.min(r.length, q.limit || 10) + " shown");
  }
}
