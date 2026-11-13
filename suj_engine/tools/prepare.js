#!/usr/bin/env node
/*
 * SUJ engine, PREPARE DOSSIER. Runs the mandatory engine tools for one question in one go, so that no step is skipped:
 * the dominant house scan, the strict and the wide window scan, and the rule library lookup. It then prints the
 * checklist the answer must satisfy. It does not decide anything.
 *
 *   node suj_engine/tools/prepare.js '{"name":"X","gender":"female","date":"1993-01-06","time":"07:10:00","tz":5.5,
 *        "lat":27.1333,"lon":81.9667,"topic":"parents"}'
 * topic is one of education, marriage, work, siblings, parents, children, health, wealth, property, foreign.
 * asOf defaults to today. Run planet_strength.js separately once the conflicting planets are known.
 */
const path = require("path");
const { execFileSync } = require("child_process");
const { scan, render } = require("./window_scan");
const { lookup, render: renderRules } = require("./rules_lookup");

const MAP = {
  education: { events: ["education_step"], tag: "Education", focus: 4, strength: "education" },
  marriage:  { events: ["marriage"], tag: "Marriage / Spouse", focus: 7, strength: "marriage_female or marriage_male" },
  work:      { events: ["job_start"], tag: "Career / Profession", focus: 10, strength: "career" },
  siblings:  { events: ["sibling_birth"], tag: null, focus: 3, strength: "siblings" },
  parents:   { events: ["father_loss", "mother_loss"], tag: "Parents / Family", focus: 9, strength: "father and mother" },
  children:  { events: ["child_birth"], tag: "Children", focus: 5, strength: "children" },
  health:    { events: ["health_crisis"], tag: "Health / Disease", focus: 6, strength: "health" },
  wealth:    { events: [], tag: "Wealth / Finance", focus: 2, strength: "wealth" },
  property:  { events: ["property"], tag: "Property / Vehicles", focus: 4, strength: "property" },
  foreign:   { events: ["foreign_travel"], tag: "Travel / Foreign", focus: 12, strength: "foreign" }
};

const cfg = JSON.parse(process.argv.slice(2).find(a => a.trim().startsWith("{")) || "{}");
const m = MAP[cfg.topic];
if (!m) { console.error("Give a topic, one of " + Object.keys(MAP).join(", ")); process.exit(2); }
cfg.asOf = cfg.asOf || new Date().toISOString().slice(0, 10);
const here = __dirname;
const out = [];
out.push("# SUJ DOSSIER for topic " + cfg.topic + ", as of " + cfg.asOf, "");
try {
  out.push(execFileSync("node", [path.join(here, "stellium.js"), JSON.stringify(Object.assign({}, cfg, { focusHouse: m.focus }))], { encoding: "utf8" }));
} catch (e) { out.push("Dominant house scan failed " + e.message); }
m.events.forEach(ev => {
  out.push("", render(scan(Object.assign({}, cfg, { event: ev, strict: true }))));
  const wide = scan(Object.assign({}, cfg, { event: ev, strict: false })).windows;
  out.push("", "Wide view for " + ev + " found " + wide.length + " windows, past " + wide.filter(w => w.timeStatus === "PAST").length + ", grade A " + wide.filter(w => w.grade === "A").length + ". Too many to separate events, use the strict list above and run window_scan.js without strict only to look at a specific period.");
});
out.push("", renderRules(lookup(Object.assign({}, cfg, { event: m.tag })), 3));
out.push("", "## CHECKLIST for the answer, enforced by answer_guard.js version 2",
  "1. Run planet_strength.js for the planets whose results conflict. Topics " + m.strength + ".",
  "2. S2 has a RULES CITED line. S6 has a WINDOW SCAN line and weighs the strict windows first.",
  "3. Write down every flag that points against your leading option. They go on the COUNTER EVIDENCE line or into the tally.",
  "4. S8 has an EVIDENCE TALLY line with a whole number for every option. The final answer is the option with the highest number.",
  "5. No typicality, no base rate, no safe choice. No rule that is not in the methodology, the library or a cited text.",
  "6. Candidate windows are not proof. A natal promise is capacity and not proof of status. Check the status indicators separately.");
console.log(out.join("\n"));
