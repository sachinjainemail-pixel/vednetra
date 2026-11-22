#!/usr/bin/env node
/*
 * GOAT ENGINE backtest against the owner's own reported charts.
 *
 * Reads the owner case file in suj_engine/cases/cases.json (read only) and runs the GOAT engine on the
 * questions whose answers map cleanly onto a topic. Two kinds are scored.
 *   Status questions on marriage. The engine promise is compared with the reported status.
 *   Event questions with a date. The engine picks among mapped options with the search range set to one
 *   year either side of the event date, and the pick is compared with the reported event.
 * Questions with no clean topic mapping are listed as skipped, not guessed.
 *
 * Usage: node goat_engine/tools/backtest.js
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { run } = require("./goat");

const CASES = path.join(__dirname, "..", "cases", "owner_cases.json");
const cases = JSON.parse(fs.readFileSync(CASES, "utf8")).cases;

const MARRIED_TRUTH = ["Married", "Divorced", "Widowed", "Widow", "Very happy", "Very unhappy", "Separated from husband", "Divorce in 2023"];
const EVENT_TOPIC = { "Marriage": "marriage", "Child born": "children", "New job": "career", "Eye operation": "health", "Accident": "health" };
const DAY = 86400000;

function baseCfg(c) {
  return { name: c.id, gender: c.gender, date: c.date, time: c.time, tz: c.tz, lat: c.lat, lon: c.lon, place: c.place };
}
const rows = [];
const skipped = [];

cases.forEach(c => {
  (c.questions || []).forEach(q => {
    const eventMatch = String(q.topic).match(/(\d{1,2} [A-Za-z]+ \d{4})/);
    if (q.kind === "status" && q.topic === "marriage") {
      const truthYes = MARRIED_TRUTH.indexOf(q.truth) >= 0;
      const res = run(Object.assign(baseCfg(c), { topic: "marriage", asOf: c.asOf }));
      const r = res.chosen;
      rows.push({ case: c.id, question: "marriage status", truth: q.truth, engine: r.promiseYes ? "promise YES" : "promise NO",
        net: r.net, timing: r.decision, hit: r.promiseYes === truthYes, scored: "promise" });
    } else if (eventMatch && q.kind === "event") {
      const d = new Date(eventMatch[1] + " UTC");
      const mapped = q.options.filter(o => EVENT_TOPIC[o]);
      if (mapped.indexOf(q.truth) < 0) { skipped.push(c.id + " Q" + q.n + " truth " + q.truth + " has no topic mapping"); return; }
      const opts = mapped.map(o => ({ label: o, topic: EVENT_TOPIC[o] }));
      const iso = dt => new Date(dt.getTime()).toISOString().slice(0, 10);
      const res = run(Object.assign(baseCfg(c), { options: opts, asOf: iso(d), fromISO: iso(new Date(d.getTime() - 366 * DAY)), toISO: iso(new Date(d.getTime() + 366 * DAY)) }));
      const pick = res.chosen;
      rows.push({ case: c.id, question: "event " + eventMatch[1], truth: q.truth, engine: pick.label + " " + pick.decision, net: pick.net,
        timing: pick.best ? "window " + pick.best.start.toISOString().slice(0, 10) + " to " + pick.best.end.toISOString().slice(0, 10) : "none",
        hit: pick.label === q.truth, scored: "option" });
    } else if ((q.kind === "ordinal" && q.topic === "education") || (q.kind === "count" && q.topic === "siblings")) {
      const topic = q.topic;
      const res = run(Object.assign(baseCfg(c), { topic, options: q.options.map(o => ({ label: o })), asOf: c.asOf }));
      const pick = res.rule.chosen.label;
      rows.push({ case: c.id, question: topic + " " + q.kind, truth: q.truth, engine: pick, net: res.rule.net,
        timing: "rule " + res.rule.rule, hit: pick === q.truth, scored: "rule" });
    } else {
      skipped.push(c.id + " Q" + q.n + " " + q.topic + " kind " + q.kind + " has no clean topic mapping");
    }
  });
});

const promise = rows.filter(r => r.scored === "promise");
const option = rows.filter(r => r.scored === "option");
const rule = rows.filter(r => r.scored === "rule");
console.log("GOAT ENGINE backtest on owner cases");
console.log("");
rows.forEach(r => console.log(`${r.case} | ${r.question} | truth ${r.truth} | engine ${r.engine} | net ${r.net.toFixed(2)} | ${r.timing} | ${r.hit ? "HIT" : "MISS"}`));
console.log("");
console.log(`Promise questions hit ${promise.filter(r => r.hit).length} of ${promise.length}.`);
console.log(`Event option questions hit ${option.filter(r => r.hit).length} of ${option.length}.`);
console.log(`Ordinal and count questions hit ${rule.filter(r => r.hit).length} of ${rule.length}.`);
console.log("Skipped questions");
skipped.forEach(s => console.log("  " + s));
console.log("");
console.log("Sample size is very small. These numbers are a first check of the engine, not a validation.");
