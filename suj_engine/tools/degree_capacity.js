#!/usr/bin/env node
/*
 * SUJ engine, DEGREE CAPACITY. The owner's round 17 question, whether the degree of a planet changes its capacity to give results, and whether that explains the engine's
 * errors. This tool reads each planet's degree from Vednetra and reports
 *   the Baladi avastha, Bala, Kumara, Yuva, Vriddha or Mrita, from the degree in the sign, reversed in even signs, and the capacity factor from data/degree_factors.json
 *   gandanta, from the rule library, Sutton, the junction degrees of the water and fire signs
 *   pushkara bhaga, from the rule library, Sutton table C3.2, and pushkara pada from the Sutton list of 24
 *   sandhi, within one degree of a sign boundary
 *   separation from the Sun in degrees, for combustion
 *   distance from the deepest exaltation and debilitation degree, which is the part of Shadbala that already counts degree, Ucchabala
 * Rahu and Ketu get no Baladi avastha, the classical scheme is for the seven planets, and their capacity factor is 1 and flagged. nodeDegree true is a variant that applies the same bands to them.
 * Only the capacity factor is numeric. The rest are flags, because the library gives no numbers for them. strength_tally.js can multiply each planet's weight by the
 * capacity factor, option degree true.
 *
 *   node suj_engine/tools/degree_capacity.js '{"gender":"female","date":"1993-01-06","time":"07:10:00","tz":5.5,"lat":27.1333,"lon":81.9667}'
 */
const fs = require("fs");
const path = require("path");
const { loadVedicCore } = require("./vednetra_loader");
const F = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "degree_factors.json"), "utf8"));
const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const key = s => String(s).toLowerCase().replace(/[^a-z]/g, "").replace(/sh/g, "s").replace(/h/g, "");
const EXALT = { Sun: [0, 10], Moon: [1, 3], Mars: [9, 28], Mercury: [5, 15], Jupiter: [3, 5], Venus: [11, 27], Saturn: [6, 20] };
const PUSHKARA_PADA = [
  [["Ardra", "Swati", "Shatabhisha"], [4]], [["Rohini", "Hasta", "Shravana"], [2]], [["Krittika", "Uttara Phalguni", "Uttara Ashadha"], [1, 4]],
  [["Punarvasu", "Vishakha", "Purva Bhadrapada"], [2, 4]], [["Pushya", "Anuradha", "Uttara Bhadrapada"], [2]], [["Bharani", "Purva Phalguni", "Purva Ashadha"], [3]]];
const angDist = (a, b) => { const d = Math.abs(((a - b) % 360 + 360) % 360); return d > 180 ? 360 - d : d; };

function avastha(signIdx, deg) {
  const odd = signIdx % 2 === 0; // Aries index 0 is an odd sign
  const band = Math.min(4, Math.floor(deg / 6));
  const names = odd ? ["Bala", "Kumara", "Yuva", "Vriddha", "Mrita"] : ["Mrita", "Vriddha", "Yuva", "Kumara", "Bala"];
  return names[band];
}

function capacity(cfg) {
  const VC = loadVedicCore(cfg.appDir);
  const t = String(cfg.time).length === 5 ? cfg.time + ":00" : cfg.time;
  const chart = VC.avEngineFor({ name: "x", gender: cfg.gender || "unspecified", birthISO: cfg.date + "T" + t, tz: Number(cfg.tz), lat: Number(cfg.lat), lon: Number(cfg.lon), place: "" }).chart;
  const P = chart.planetsByName, out = {};
  chart.planets.forEach(p => {
    const node = p.name === "Rahu" || p.name === "Ketu";
    const deg = p.deg, sIdx = p.sign;
    const r = { planet: p.name, sign: SIGNS[sIdx], degree: Math.round(deg * 100) / 100, retrograde: !!p.retrograde };
    if (node && !cfg.nodeDegree) { r.avastha = "none, node"; r.factor = 1; r.nodeNote = "no Baladi avastha for the nodes, factor 1"; }
    else if (node) { r.avastha = avastha(sIdx, deg); r.factor = F.factors[r.avastha]; r.nodeNote = "VARIANT, the Baladi bands applied to the node, not in the classical scheme"; }
    else { r.avastha = avastha(sIdx, deg); r.factor = F.factors[r.avastha]; }
    const water = [3, 7, 11].indexOf(sIdx) >= 0 && deg >= 29.2, fire = [4, 8, 0].indexOf(sIdx) >= 0 && deg <= 0.8;
    r.gandanta = water || fire;
    r.sandhi = deg < 1 || deg > 29;
    r.pushkaraBhaga = Math.abs(deg - F.pushkaraBhagaDegrees[SIGNS[sIdx]]) <= 1;
    r.pushkaraPada = PUSHKARA_PADA.some(([ns, ps]) => ns.some(n => key(n) === key(p.nakshatra)) && ps.indexOf(p.pada) >= 0);
    if (p.name !== "Sun") r.sunSeparation = Math.round(angDist(p.lon, P.Sun.lon) * 100) / 100;
    r.combust = !!p.combust;
    if (EXALT[p.name]) { const [es, ed] = EXALT[p.name]; const lonEx = es * 30 + ed; r.fromExaltPoint = Math.round(angDist(p.lon, lonEx) * 10) / 10; r.fromDebilPoint = Math.round(angDist(p.lon, (lonEx + 180) % 360) * 10) / 10; }
    out[p.name] = r;
  });
  return out;
}

function render(c) {
  const L = ["# SUJ DEGREE CAPACITY, factors from data/degree_factors.json, Bala 0.25, Kumara 0.5, Yuva 1, Vriddha 0.25, Mrita 0, the engine author's reading", ""];
  L.push("planet   sign          degree  avastha   factor  flags");
  Object.values(c).forEach(r => {
    const f = [];
    if (r.gandanta) f.push("GANDANTA"); if (r.sandhi) f.push("sandhi"); if (r.pushkaraBhaga) f.push("pushkara bhaga"); if (r.pushkaraPada) f.push("pushkara pada");
    if (r.combust) f.push("combust " + r.sunSeparation); if (r.retrograde) f.push("retro");
    if (r.fromExaltPoint != null) f.push("exalt point " + r.fromExaltPoint + " away, debil point " + r.fromDebilPoint + " away");
    L.push(r.planet.padEnd(9) + r.sign.padEnd(14) + String(r.degree).padEnd(8) + String(r.avastha).padEnd(10) + String(r.factor).padEnd(8) + f.join(", "));
  });
  return L.join("\n");
}

if (require.main === module) {
  const arg = process.argv.slice(2).find(a => a.trim().startsWith("{"));
  if (!arg) { console.error("Usage: degree_capacity.js '{json}' [--json]"); process.exit(2); }
  const res = capacity(JSON.parse(arg));
  console.log(process.argv.indexOf("--json") >= 0 ? JSON.stringify(res, null, 1) : render(res));
}
module.exports = { capacity, render, avastha };
