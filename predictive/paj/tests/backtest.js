"use strict";
// Backtest on verified AA rated charts. Birth times come from Astrotheme (birth certificate or record).
// Event dates come from Wikipedia. Profession questions use the career start year as the as-of date.
const { cast, answerDomain, eventWindow } = require("../engine.js");

const CHARTS = [
  { name: "Rami Malek", gender: "male", date: "1981-05-12", time: "08:41", tz: -7, lat: 33.8358, lon: -118.3406,
    careerStart: "2004-01-01", profession: "acting film and OTT",
    events: [
      { event: "career milestone", from: "2018-01-01", to: "2020-12-31", truth: true, note: "Academy Award 24 Feb 2019" },
      { event: "career milestone", from: "1985-01-01", to: "1987-12-31", truth: false, note: "childhood window" }] },
  { name: "Dale Davis", gender: "male", date: "1969-03-25", time: "15:52", tz: -5, lat: 34.5776, lon: -83.3349,
    careerStart: "1991-01-01", profession: "sports and athletics",
    events: [
      { event: "career milestone", from: "1990-01-01", to: "1992-12-31", truth: true, note: "career began 1991" },
      { event: "career milestone", from: "1972-01-01", to: "1974-12-31", truth: false, note: "childhood window" }] },
  { name: "David Chokachi", gender: "male", date: "1968-01-16", time: "13:03", tz: -5, lat: 41.9584, lon: -70.6673,
    careerStart: "1995-01-01", profession: "acting film and OTT",
    events: [
      { event: "marriage", from: "2003-01-01", to: "2005-12-31", truth: true, note: "married 2004" },
      { event: "marriage", from: "1985-01-01", to: "1987-12-31", truth: false, note: "early window" }] },
];
const PROFESSION_OPTIONS = ["sports and athletics", "acting film and OTT", "politics and government",
  "writing journalism and media", "banking finance and business", "medicine and healthcare"];

let profHit = 0, evHit = 0, evN = 0, evYes = 0, evYesHit = 0;
for (const t of CHARTS) {
  const c = cast(t);
  c.birthIso = c.birthIso;
  const r = answerDomain(c, "profession", PROFESSION_OPTIONS, t.careerStart);
  const ok = r.choice === t.profession;
  profHit += ok ? 1 : 0;
  console.log(`${t.name} profession chosen ${r.choice} truth ${t.profession} hit ${ok}`);
  for (const e of t.events) {
    const w = eventWindow(c, e.event, e.from, e.to, t.gender);
    evN++; if (w.hit === e.truth) evHit++;
    if (e.truth) { evYes++; if (w.hit) evYesHit++; }
    console.log(`  ${e.event} ${e.from.slice(0, 4)} to ${e.to.slice(0, 4)} engine ${w.hit ? "yes" : "no"} truth ${e.truth ? "yes" : "no"} hit ${w.hit === e.truth} (${e.note})`);
  }
}
console.log(`profession accuracy ${profHit}/${CHARTS.length} chance ${(1 / PROFESSION_OPTIONS.length).toFixed(2)}`);
console.log(`event accuracy ${evHit}/${evN} chance 0.50, yes answers caught ${evYesHit}/${evYes}`);
