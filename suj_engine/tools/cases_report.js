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
const pending = []; DATA.cases.forEach(c => c.questions.forEach(q => { if (q.pending) pending.push(c.id + " Q" + q.n + " " + q.topic + ", engine " + q.engine); }));
DATA.cases.forEach(c => c.questions.filter(q => !q.pending).forEach(q => rows.push({ case: c.id, q, ok: q.engine === q.truth, blind: c.blind !== false })));
const pct = (a, b) => b ? Math.round(100 * a / b) + " percent" : "none";
const out = [];
out.push("# SUJ CASE SCOREBOARD");
const bl = rows.filter(r => r.blind);
out.push("Cases " + DATA.cases.length + ", questions " + rows.length + ", correct " + rows.filter(r => r.ok).length + ", " + pct(rows.filter(r => r.ok).length, rows.length) + ".");
out.push("BLIND questions, answered before the true answers were known " + bl.length + ", correct " + bl.filter(r => r.ok).length + ", " + pct(bl.filter(r => r.ok).length, bl.length) + ". The others were answered afterwards and do not test the engine.");
const by = fn => { const m = {}; rows.forEach(r => { const k = fn(r); (m[k] = m[k] || []).push(r); }); return m; };
if (pending.length) out.push("PENDING, answered blind and waiting for the owner's true answers " + pending.length + ". " + pending.join("; "));
out.push("", "## By question kind");
Object.entries(by(r => r.q.kind)).forEach(([k, v]) => out.push("- " + k + " " + v.filter(r => r.ok).length + " of " + v.length));
out.push("", "## By topic");
Object.entries(by(r => r.q.topic)).forEach(([k, v]) => out.push("- " + k + " " + v.filter(r => r.ok).length + " of " + v.length));
out.push("", "## Error tags on the misses");
const tags = {}; rows.filter(r => !r.ok).forEach(r => r.q.errorTags.forEach(t => { tags[t] = (tags[t] || 0) + 1; }));
Object.entries(tags).sort((a, b) => b[1] - a[1]).forEach(([t, n]) => out.push("- " + t + " " + n));
out.push("", "## Misses");
rows.filter(r => !r.ok).forEach(r => out.push("- " + r.case + " Q" + r.q.n + " " + r.q.topic + ", engine " + r.q.engine + ", truth " + r.q.truth + ", tags " + r.q.errorTags.join(" ")));
// strength tally scores against the true yes or no of each hypothesis
const hy = []; DATA.cases.forEach(c => (c.hypotheses || []).forEach(h => hy.push(Object.assign({ case: c.id }, h))));
if (hy.length) {
  const yes = hy.filter(h => h.truth), no = hy.filter(h => !h.truth);
  let w = 0, n = 0; yes.forEach(a => no.forEach(b => { n++; w += a.score > b.score ? 1 : (a.score === b.score ? 0.5 : 0); }));
  out.push("", "## Strength tally scores against the truth");
  out.push("Hypotheses " + hy.length + ", true " + yes.length + ", false " + no.length + ". Mean score of the true ones " + (yes.reduce((a, h) => a + h.score, 0) / (yes.length || 1)).toFixed(1) + ", of the false ones " + (no.reduce((a, h) => a + h.score, 0) / (no.length || 1)).toFixed(1) + ".");
  out.push(n ? "Chance that a true hypothesis outscores a false one, AUC " + (w / n).toFixed(2) + " over " + n + " pairs. 0.50 is chance." : "No pairs yet.");
  const hb = hy.filter(h => h.scoreB != null);
  if (hb.length) { let w2 = 0, n2 = 0; hb.filter(h => h.truth).forEach(a => hb.filter(h => !h.truth).forEach(b => { n2++; w2 += a.scoreB > b.scoreB ? 1 : (a.scoreB === b.scoreB ? 0.5 : 0); })); out.push("Updated engine, degree and nakshatra with the nodes, " + hb.length + " hypotheses, AUC " + (n2 ? (w2 / n2).toFixed(2) : "none") + " over " + n2 + " pairs."); }
  out.push("Above 50 " + hy.filter(h => h.score > 50).length + " of " + hy.length + ", of which true " + hy.filter(h => h.score > 50 && h.truth).length + ".");
}
// window scan recall on dates of events that really happened
const dc = []; DATA.cases.forEach(c => (c.dateChecks || []).forEach(x => dc.push(Object.assign({ case: c.id }, x))));
if (dc.length) {
  out.push("", "## Window scan on dates of events that really happened");
  out.push("Dates " + dc.length + ". Covered by strict double " + dc.filter(x => x.strictDouble).length + ", strict single " + dc.filter(x => x.strictSingle).length + ", wide double " + dc.filter(x => x.wideDouble).length + ", wide single " + dc.filter(x => x.wideSingle).length + ".");
  dc.forEach(x => out.push("- " + x.case + " " + x.event + " " + x.date + ", event rank " + x.rankOfTrueEvent + " of " + x.of + ". " + (x.note || "")));
}
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
