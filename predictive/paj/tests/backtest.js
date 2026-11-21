"use strict";
// Backtest of the PAJ engine on verified AA rated charts (verified_charts.json).
// The engine sees only the birth record, the option list and the as-of date. The true answers are used only for scoring.
const fs = require("fs");
const path = require("path");
const { cast, answerDomain, eventWindow } = require("../engine.js");

const data = JSON.parse(fs.readFileSync(path.join(__dirname, "verified_charts.json"), "utf8"));
const OPTIONS = data.options;
const rows = [];
let profHit = 0, profN = 0;
let evN = 0, evHit = 0, yesN = 0, yesHit = 0, noN = 0, noHit = 0;

for (const t of data.charts) {
  const c = cast(t);
  const r = answerDomain(c, "profession", OPTIONS, t.careerStart);
  const ok = r.choice === t.profession;
  profN++; profHit += ok ? 1 : 0;
  rows.push([t.name, "profession", r.hi, t.profession, ok ? "hit" : "miss"]);
  for (const e of t.events) {
    const w = eventWindow(c, e.event, e.from, e.to, t.gender);
    const hit = w.hit === e.truth;
    evN++; evHit += hit ? 1 : 0;
    if (e.truth) { yesN++; yesHit += w.hit ? 1 : 0; } else { noN++; noHit += w.hit ? 0 : 1; }
    rows.push([t.name, `${e.event} ${e.from.slice(0, 4)} to ${e.to.slice(0, 4)}`, w.hit ? "yes" : "no", e.truth ? "yes" : "no", hit ? "hit" : "miss"]);
  }
}

for (const r of rows) console.log(r.join(" | "));
console.log("");
console.log(`profession ${profHit}/${profN} correct, chance ${(100 / OPTIONS.length).toFixed(1)} percent`);
console.log(`events ${evHit}/${evN} correct, chance 50 percent`);
console.log(`true yes windows caught ${yesHit}/${yesN}`);
console.log(`true no windows rejected ${noHit}/${noN}`);
