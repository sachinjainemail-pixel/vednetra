#!/usr/bin/env node
/*
 * SUJ engine, CHILD SEX READINGS, round 23. Prints two readings of the sex of children side by side, for the record, before the truth is known.
 * Reading 1 sign parity, the 5th sign, the 5th lord, the karaka Jupiter and the D7 5th sign and Jupiter, odd sign male, even sign female.
 * Reading 2 planet gender, the planets on the child chain, Sun Mars Jupiter male, Moon Venus female, Mercury Saturn neutral.
 * Both are PROPOSED readings. Neither is in the owner's methodology or the rule library, neither enters the tally. Kundali 5 had two daughters,
 * reading 1 pointed to daughters and reading 2 to sons. One case, no rule. Log both readings in every new child question.
 *   node suj_engine/tools/child_sex.js '{"gender":"male","date":"1983-01-29","time":"14:45:00","tz":5.5,"lat":19.076,"lon":72.8777}'
 */
const { loadVedicCore } = require("./vednetra_loader");
function readings(cfg) {
  const VC = loadVedicCore(cfg.appDir);
  const t = String(cfg.time).length === 5 ? cfg.time + ":00" : cfg.time;
  const ch = VC.avEngineFor({ name: "x", gender: cfg.gender || "unspecified", birthISO: cfg.date + "T" + t, tz: Number(cfg.tz), lat: Number(cfg.lat), lon: Number(cfg.lon), place: "" }).chart;
  const P = ch.planetsByName, lagna = ch.ascendant.sign;
  const LORD = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"];
  const sign5 = (lagna + 4) % 12, lord5 = LORD[sign5];
  const par = s => (s % 2 === 0 ? "male" : "female");
  const nm = s => VC.SIGNS[s].name;
  const items = [["5th sign", nm(sign5), par(sign5)], ["5th lord " + lord5 + " sign", nm(P[lord5].sign), par(P[lord5].sign)], ["Jupiter sign", nm(P.Jupiter.sign), par(P.Jupiter.sign)]];
  try { const dj = VC.vargaSign(P.Jupiter.lon, 7); items.push(["D7 Jupiter sign", nm(dj), par(dj)]); const d7l = VC.vargaSign(ch.ascendant.lon, 7), d75 = (d7l + 4) % 12; items.push(["D7 5th sign", nm(d75), par(d75)]); } catch (e) {}
  const male = items.filter(x => x[2] === "male").length, female = items.length - male;
  const G = { Sun: "male", Mars: "male", Jupiter: "male", Moon: "female", Venus: "female", Mercury: "neutral", Saturn: "neutral" };
  const chain = [lord5, "Jupiter"];
  const aspM = P.Mars && [4, 7, 8].map(n => (P.Mars.sign + n - 1) % 12).indexOf(sign5) >= 0;
  if (aspM) chain.push("Mars");
  const pm = chain.filter(p => G[p] === "male").length, pf = chain.filter(p => G[p] === "female").length;
  return { sign5: nm(sign5), lord5, parity: { items, male, female, leans: male > female ? "sons" : female > male ? "daughters" : "mixed" }, planetGender: { chain: chain.map(p => p + " " + G[p]), male: pm, female: pf, leans: pm > pf ? "sons" : pf > pm ? "daughters" : "mixed" } };
}
function render(r) {
  return ["# SUJ CHILD SEX READINGS, proposed, not in the tally", "5th sign " + r.sign5 + ", 5th lord " + r.lord5,
    "Reading 1 sign parity, male " + r.parity.male + ", female " + r.parity.female + ", leans " + r.parity.leans, ...r.parity.items.map(x => "  " + x[0] + " " + x[1] + " " + x[2]),
    "Reading 2 planet gender, male " + r.planetGender.male + ", female " + r.planetGender.female + ", leans " + r.planetGender.leans + ", chain " + r.planetGender.chain.join(", "),
    "Both readings are proposed. Kundali 5, two daughters, sign parity right, planet gender wrong. One case."].join("\n");
}
if (require.main === module) { const cfg = JSON.parse(process.argv.slice(2).find(a => a.trim().startsWith("{"))); console.log(render(readings(cfg))); }
module.exports = { readings, render };
