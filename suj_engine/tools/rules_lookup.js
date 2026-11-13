#!/usr/bin/env node
/*
 * SUJ engine, RULE LOOKUP. Pulls rules from the attached library (suj_engine/rules/rules_index.json, 1,561 rules from
 * Komilla Sutton The Nakshatras and Umesh Puri Laghu Parashari) that apply to this native's chart, so that every
 * answer can cite them on the RULES CITED line. Placements come from Vednetra, nothing is typed by hand.
 *
 * What it does
 *   1. For Lagna and each of the nine bodies, finds Sutton rules written for that body in that nakshatra, keeps the
 *      pada rules only when the pada matches, and optionally filters by an event tag.
 *   2. Lists Laghu Parashari rules carrying the same event tag (these are general rules, not placement rules).
 *   3. Says plainly how many rules were found. When the library holds nothing on the event it says so, and the
 *      answer must then write that on its RULES CITED line. Nothing is invented to fill a gap.
 *
 * Usage
 *   node suj_engine/tools/rules_lookup.js '{"gender":"female","date":"1993-01-06","time":"07:10:00","tz":5.5,
 *        "lat":27.1333,"lon":81.9667,"event":"Education"}' [--json] [--max 8]
 * event is one of the tags in the library, for example Education, Career / Profession, Marriage / Spouse,
 * Parents / Family, Longevity / Death, Children, Wealth / Finance, Health / Disease, Property / Vehicles,
 * Travel / Foreign, Litigation / Enemies / Debt, Personality / Nature. Leave it out for all tags.
 */
const fs = require("fs");
const path = require("path");
const { loadVedicCore } = require("./vednetra_loader");

const RULES = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "rules", "rules_index.json"), "utf8"));
// letters only, sh to s, h removed, so that Jyeshtha equals Jyeshta and Mrigashira equals Mrigasira
const key = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, "").replace(/sh/g, "s").replace(/h/g, "");

function lookup(cfg) {
  const VC = loadVedicCore(cfg.appDir);
  const t = String(cfg.time).length === 5 ? cfg.time + ":00" : cfg.time;
  const built = VC.avEngineFor({ name: cfg.name || "Native", gender: cfg.gender || "unspecified",
    birthISO: cfg.date + "T" + t, tz: Number(cfg.tz), lat: Number(cfg.lat), lon: Number(cfg.lon), place: cfg.place || "" });
  const chart = built.chart;
  const bodies = chart.planets.map(p => ({ name: p.name, nak: p.nakshatra, pada: p.pada }));
  bodies.unshift({ name: "Lagna", nak: chart.ascendant.nakshatra, pada: chart.ascendant.pada });
  const ev = cfg.event || null;
  const sut = RULES.sutton_nakshatras, lp = RULES.laghu_parashari;
  const placement = [];
  for (const b of bodies) {
    if (!b.nak) continue;
    const kb = key(b.name), kn = key(b.nak);
    const hits = sut.filter(r => {
      const d = key(r.description);
      const ok = d.indexOf(kb + "in" + kn) >= 0 || ((b.name === "Moon" || b.name === "Lagna") && (d.indexOf("orlagnain" + kn) >= 0 || d.indexOf("lagnain" + kn) >= 0 || d.indexOf("mooninlagnain" + kn) >= 0));
      if (!ok) return false;
      const pm = /pada ?(\d)/i.exec(r.description);
      if (pm && Number(pm[1]) !== Number(b.pada)) return false;
      if (ev && !(r.events || []).some(e => e.toLowerCase().indexOf(ev.toLowerCase()) >= 0)) return false;
      return true;
    });
    placement.push({ body: b.name, nakshatra: b.nak, pada: b.pada, rules: hits.map(r => ({ id: r.rule_id, description: r.description, effect: (r.effect || "").replace(/\s+/g, " ").slice(0, 220), events: r.events })) });
  }
  const general = ev ? lp.filter(r => (r.events || []).some(e => e.toLowerCase().indexOf(ev.toLowerCase()) >= 0))
    .map(r => ({ id: r.rule_id, description: (r.description || "").slice(0, 110) })) : [];
  const total = placement.reduce((n, x) => n + x.rules.length, 0);
  return { event: ev, placementRuleCount: total, generalRuleCount: general.length, placement, general };
}

function render(r, max) {
  const L = ["# SUJ RULE LOOKUP, event " + (r.event || "all tags"),
    "Placement rules found " + r.placementRuleCount + ". Laghu Parashari general rules with this tag " + r.generalRuleCount + "."];
  for (const p of r.placement) {
    L.push("", p.body + " in " + p.nakshatra + " pada " + p.pada + ", " + p.rules.length + " rules");
    p.rules.slice(0, max).forEach(x => L.push("- " + x.id + " | " + x.description.replace(/\s+/g, " ").slice(0, 100) + " | " + x.effect.slice(0, 160)));
  }
  if (r.general.length) { L.push("", "Laghu Parashari rules with this tag, first " + Math.min(max, r.general.length)); r.general.slice(0, max).forEach(x => L.push("- " + x.id + " | " + x.description)); }
  if (r.placementRuleCount === 0 && r.generalRuleCount === 0) L.push("", "The library holds no rule for this event and this chart. Write that on the RULES CITED line.");
  return L.join("\n");
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  const arg = argv.find(a => a.trim().startsWith("{"));
  if (!arg) { console.error("Usage: rules_lookup.js '{json}' [--json] [--max N]"); process.exit(2); }
  const mi = argv.indexOf("--max");
  const max = mi >= 0 ? Number(argv[mi + 1]) : 8;
  const res = lookup(JSON.parse(arg));
  console.log(argv.indexOf("--json") >= 0 ? JSON.stringify(res, null, 1) : render(res, max));
}
module.exports = { lookup, render };
