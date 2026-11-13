#!/usr/bin/env node
/*
 * SUJ engine, CASE SCOREBOARD. Reads suj_engine/cases/cases.json and prints the engine's score on tested charts, the
 * score by question kind and topic, and a count of the error tags on the misses. Run it after every owner reported
 * result and add the new case first. It makes drift visible, a rising score, or the same tag recurring.
 * With --windows it also runs the strict window scan for the event of each question so the candidate windows
 * can be compared with the true answers. Small numbers prove nothing, so the report prints the sample size.
 *
 *   node suj_engine/tools/cases_report.js [--windows]
 */
const fs = require("fs");
const path = require("path");
const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "cases", "cases.json"), "utf8"));
const EVENT_FOR = { education: "education_step", marriage: "marriage", work: "job_start", siblings: "sibling_birth", parents: null };

const rows = [];
DATA.cases.forEach(c => c.questions.forEach(q => rows.push({ case: c.id, q, ok: q.engine === q.truth })));
const pct = (a, b) => b ? Math.round(100 * a / b) + " percent" : "none";
const out = [];
out.push("# SUJ CASE SCOREBOARD");
out.push("Cases " + DATA.cases.length + ", questions " + rows.length + ", correct " + rows.filter(r => r.ok).length + ", " + pct(rows.filter(r => r.ok).length, rows.length) + ".");
const by = fn => { const m = {}; rows.forEach(r => { const k = fn(r); (m[k] = m[k] || []).push(r); }); return m; };
out.push("", "## By question kind");
Object.entries(by(r => r.q.kind)).forEach(([k, v]) => out.push("- " + k + " " + v.filter(r => r.ok).length + " of " + v.length));
out.push("", "## By topic");
Object.entries(by(r => r.q.topic)).forEach(([k, v]) => out.push("- " + k + " " + v.filter(r => r.ok).length + " of " + v.length));
out.push("", "## Error tags on the misses");
const tags = {}; rows.filter(r => !r.ok).forEach(r => r.q.errorTags.forEach(t => { tags[t] = (tags[t] || 0) + 1; }));
Object.entries(tags).sort((a, b) => b[1] - a[1]).forEach(([t, n]) => out.push("- " + t + " " + n));
out.push("", "## Misses");
rows.filter(r => !r.ok).forEach(r => out.push("- " + r.case + " Q" + r.q.n + " " + r.q.topic + ", engine " + r.q.engine + ", truth " + r.q.truth + ", tags " + r.q.errorTags.join(" ")));
out.push("", "Chance level for four options is 25 percent. With " + rows.length + " questions the score cannot show skill either way.");

if (process.argv.indexOf("--windows") >= 0) {
  const { scan } = require("./window_scan");
  out.push("", "## Strict window counts per question event");
  DATA.cases.forEach(c => c.questions.forEach(q => {
    const ev = q.topic === "parents" ? ["father_loss", "mother_loss"] : [EVENT_FOR[q.topic]];
    ev.filter(Boolean).forEach(e => {
      const r = scan({ gender: c.gender, date: c.date, time: c.time, tz: c.tz, lat: c.lat, lon: c.lon, event: e, asOf: c.asOf, strict: true });
      const past = r.windows.filter(w => w.timeStatus === "PAST");
      out.push("- " + c.id + " Q" + q.n + " " + e + ", past windows " + past.length + ", grade A " + past.filter(w => w.grade === "A").length + ", truth " + q.truth);
    });
  }));
}
console.log(out.join("\n"));
