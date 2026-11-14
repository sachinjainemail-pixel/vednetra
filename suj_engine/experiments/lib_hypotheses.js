/*
 * EXPERIMENT library, not part of the engine. Generates typed evidence for a hypothesis from the chart by the fixed procedure written in
 * rerun_892_round12.js and runs strength_tally.js on it. Used for every tested chart so that the evidence is made the same way each time.
 * hypothesis = { option, houses, from, karakas, varga }. carriersOnly adds a weakness only for a planet that has an entry for the option.
 */
const fs = require("fs"), path = require("path");
const { tally, naturalNature } = require("../tools/strength_tally");
const { analyse } = require("../tools/planet_strength");
const { loadVedicCore } = require("../tools/vednetra_loader");
const KB = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "significations.json"), "utf8"));
const ASP = { Sun: [7], Moon: [7], Mercury: [7], Venus: [7], Mars: [4, 7, 8], Jupiter: [5, 7, 9], Saturn: [3, 7, 10], Rahu: [5, 7, 9], Ketu: [5, 7, 9] };
const ALL = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
const houseFrom = (a, b) => ((a - b + 12) % 12) + 1;
const signLord = sg => Object.keys(KB.ownSigns).find(p => KB.ownSigns[p].indexOf(sg) >= 0);

function context(C) {
  const VC = loadVedicCore();
  const t = String(C.time).length === 5 ? C.time + ":00" : C.time;
  const chart = VC.avEngineFor({ name: "x", gender: C.gender, birthISO: C.date + "T" + t, tz: C.tz, lat: C.lat, lon: C.lon, place: "" }).chart;
  return { chart, P: chart.planetsByName, LAG: chart.ascendant.sign, MOON: chart.planetsByName.Moon.sign, nat: naturalNature(C).nat };
}

function build(C, ctx, h, carriersOnly) {
  const { P, LAG, MOON, nat } = ctx;
  const base = analyse(Object.assign({}, C, { houses: [], karakas: [], varga: h.varga, candidates: ["Sun", "Moon"] }));
  const lordships = pl => KB.ownSigns[pl].map(sg => ((sg - LAG + 12) % 12) + 1).sort((a, b) => a - b);
  const ev = [], involved = new Set();
  const add = e => { ev.push(Object.assign({ option: h.option }, e)); involved.add(e.planet); };
  h.houses.forEach(hh => {
    const sign = (LAG + hh - 1) % 12, lord = signLord(sign);
    lordships(lord).forEach(x => add({ type: "lordship", planet: lord, house: x, from: h.from, factor: "lord of house " + hh + " from Lagna, also owns house " + x }));
    add({ type: "lordship", planet: signLord((MOON + hh - 1) % 12), house: hh, ref: "moon", from: h.from, factor: "lord of house " + hh + " from Moon" });
    ALL.filter(p => P[p].sign === sign).forEach(p => add(nat[p] === "benefic" ? { type: "role", side: "for", planet: p, factor: "occupies house " + hh + ", natural benefic" } : { type: "harm", side: "against", planet: p, factor: "occupies house " + hh + ", natural malefic" }));
    ALL.filter(p => P[p].sign !== sign && ASP[p].indexOf(houseFrom(sign, P[p].sign)) >= 0).forEach(p => add({ type: "aspect", planet: p, factor: "aspects house " + hh }));
  });
  (h.karakas || []).forEach(k => add({ type: "role", side: "for", planet: k, factor: "karaka" }));
  let carriers = null;
  if (carriersOnly) {
    const probe = tally(Object.assign({}, C, { kind: "ordered", options: ["x", h.option], varga: h.varga, evidence: ev.map(e => Object.assign({}, e)) }));
    carriers = new Set(probe.evidence.filter(e => e.side === "for" && e.mult !== 0).map(e => e.planet));
  }
  Array.from(involved).forEach(p => {
    if (p === "Rahu" || p === "Ketu") return;
    if (carriers && !carriers.has(p)) return;
    const r = base.rows[p], why = [];
    if (["Enemy sign", "Debilitated"].indexOf(r.step2.dignity) >= 0) why.push("D1 sign " + r.step2.dignity);
    if (r.step4.combustVednetraFlag) why.push("combust");
    if ([6, 8, 12].indexOf(r.step2.houseFromLagna) >= 0) why.push("house " + r.step2.houseFromLagna);
    if (["Enemy", "Debilitated"].indexOf(r.step3.navamshaDignity) >= 0) why.push("D9 " + r.step3.navamshaDignity);
    if (h.varga && r.step3.topicVarga && !r.step3.topicVarga.inGoodHouse) why.push("D" + h.varga + " house " + r.step3.topicVarga.houseInVarga);
    if (why.length) ev.push({ option: h.option, type: "weakness", side: "against", planet: p, factor: why.join(", ") });
  });
  return ev;
}

// hs is a list of hypotheses that feed one ordered question. opts lowest first. Returns the tally result.
function run(C, ctx, hs, opts, carriersOnly) {
  const ev = [].concat.apply([], hs.map(h => build(C, ctx, h, carriersOnly)));
  return tally(Object.assign({}, C, { kind: "ordered", options: opts, varga: hs[0].varga, evidence: ev }));
}
module.exports = { context, build, run };
