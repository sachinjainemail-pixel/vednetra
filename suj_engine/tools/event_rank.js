#!/usr/bin/env node
/*
 * SUJ engine, EVENT RANK. For a given date it asks which of several candidate events the running dasha lords point to MOST DIRECTLY. It exists because the
 * window scan only says that significators are running, and one planet can be a significator of many events. In Kundali 2 Mercury is the 7th lord, for marriage,
 * and sits in the 5th house of D7, for children, on the date a child was born, so marriage and children could not be told apart.
 * Method, the owner agreed in round 15 that the grade should follow how directly the dasha lords are tied to the event.
 *   1. For every candidate event the links of each planet are listed, the same links the window scan uses. A link is a lordship of an event house, an occupant of an
 *      event house, a karaka, a lordship or an occupant of the key house of the subject varga, or a node rule of Laghu Parashari.
 *   2. SPECIFICITY. A planet's links are divided among the events it is linked to, in proportion to the number of links to each. A planet that links to only one event gives
 *      that event its whole weight, a planet that links to many gives each a share.
 *   3. The score of an event is the sum, over the running Mahadasha, Antardasha, Pratyantardasha and Sookshma lords on the date, of the planet's share for that event. Prana is not used.
 *   4. Ties go to the event with the double transit from any reference, Lagna, Moon or Sun, then to the single transit.
 * The weights are equal for the four levels. That, the division by links, and counting each link once are the engine author's proposal, written before any chart was
 * tested with it. The tool ranks, it does not decide the answer alone.
 *
 *   node suj_engine/tools/event_rank.js '{"gender":"female","date":"1991-11-07","time":"10:50:00","tz":5.5,"lat":28.6139,"lon":77.2090,
 *        "on":"2021-05-03","events":["marriage","child_birth","health_crisis","mother_in_law_loss"]}'
 */
const { scan } = require("./window_scan");
const { loadVedicCore } = require("./vednetra_loader");

function rank(cfg) {
  const events = cfg.events || ["marriage", "child_birth", "health_crisis", "job_start", "education_step", "sibling_birth", "father_loss", "mother_loss", "mother_in_law_loss", "foreign_travel", "property"];
  const VC = loadVedicCore(cfg.appDir);
  const t = String(cfg.time).length === 5 ? cfg.time + ":00" : cfg.time;
  const chart = VC.avEngineFor({ name: "x", gender: cfg.gender || "unspecified", birthISO: cfg.date + "T" + t, tz: Number(cfg.tz), lat: Number(cfg.lat), lon: Number(cfg.lon), place: "" }).chart;
  const day = new Date(cfg.on + "T06:30:00Z");
  const stack = VC.findDashaStack(chart.vimshottari.timeline, day).slice(0, 4);
  const lords = stack.map(x => ({ level: x.level, lord: x.lord }));
  const links = {}, trans = {};
  events.forEach(ev => {
    const base = Object.assign({}, cfg, { event: ev, from: cfg.on, to: cfg.on, asOf: cfg.on });
    links[ev] = scan(Object.assign({}, base, { strict: false })).links;
    trans[ev] = { double: scan(Object.assign({}, base, { strict: false, minDasha: 0 })).windows.length > 0, single: scan(Object.assign({}, base, { strict: false, minDasha: 0, gate: "single" })).windows.length > 0 };
  });
  const total = {};
  lords.forEach(l => { total[l.lord] = events.reduce((n, ev) => n + ((links[ev][l.lord] || []).length), 0); });
  const rows = events.map(ev => {
    const per = lords.map(l => { const own = (links[ev][l.lord] || []).length; return { level: l.level, lord: l.lord, links: own, of: total[l.lord], share: total[l.lord] ? Math.round(own / total[l.lord] * 100) / 100 : 0, why: links[ev][l.lord] || [] }; });
    return { event: ev, score: Math.round(per.reduce((a, x) => a + x.share, 0) * 100) / 100, doubleTransit: trans[ev].double, singleTransit: trans[ev].single, per };
  });
  rows.sort((a, b) => b.score - a.score || (b.doubleTransit - a.doubleTransit) || (b.singleTransit - a.singleTransit));
  return { on: cfg.on, lords, rows };
}

function render(r) {
  const L = ["# SUJ EVENT RANK on " + r.on, "Running lords " + r.lords.map(x => x.level + " " + x.lord).join(", "), ""];
  r.rows.forEach((x, i) => {
    L.push((i + 1) + ". " + x.event + " score " + x.score + ", double transit " + (x.doubleTransit ? "yes" : "no") + ", single " + (x.singleTransit ? "yes" : "no"));
    x.per.forEach(p => L.push("     " + p.level + " " + p.lord + " " + p.links + " of " + p.of + " links " + (p.why.length ? "| " + p.why.join("; ") : "")));
  });
  return L.join("\n");
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  const arg = argv.find(a => a.trim().startsWith("{"));
  if (!arg) { console.error("Usage: event_rank.js '{json}' [--json]"); process.exit(2); }
  const res = rank(JSON.parse(arg));
  console.log(argv.indexOf("--json") >= 0 ? JSON.stringify(res, null, 1) : render(res));
}
module.exports = { rank, render };
