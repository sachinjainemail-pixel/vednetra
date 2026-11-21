#!/usr/bin/env node
"use strict";
// Command line entry for the PAJ engine. Prints the answer in Hindi with the chosen option and 1 or 2 logic lines.
//
// Profession, course or disease question:
//   node predictive/paj/paj.js '{"name":"Dale Davis","gender":"male","date":"1969-03-25","time":"15:52","tz":-5,
//     "lat":34.5776,"lon":-83.3349,"domain":"profession","asOf":"1991-01-01",
//     "options":["sports and athletics","banking finance and business"]}'
// Yes or no life event:
//   node predictive/paj/paj.js '{"name":"David Chokachi","gender":"male","date":"1968-01-16","time":"13:03","tz":-5,
//     "lat":41.9584,"lon":-70.6673,"domain":"event","event":"marriage","from":"2003-01-01","to":"2005-12-31"}'
const fs = require("fs");
const { cast, answerDomain, eventWindow, HEALTH_NOTE, KB } = require("./engine.js");

function run(q) {
  const c = cast(q);
  if (q.domain === "event") {
    const r = eventWindow(c, q.event, q.from, q.to, q.gender);
    return r.lines;
  }
  const r = answerDomain(c, q.domain, q.options || [], q.asOf);
  const lines = [`सबसे उपयुक्त विकल्प ${r.hi}`, ...r.lines];
  if (q.domain === "disease") lines.push(HEALTH_NOTE);
  return lines;
}

module.exports = { run };

if (require.main === module) {
  const arg = process.argv[2];
  if (!arg) { console.error("Pass a JSON question as the first argument."); process.exit(2); }
  const q = arg.startsWith("@") ? JSON.parse(fs.readFileSync(arg.slice(1), "utf8")) : JSON.parse(arg);
  console.log(run(q).join("\n"));
}
