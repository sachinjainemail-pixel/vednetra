#!/usr/bin/env node
/*
 * SUJ engine, knowledge base 1: DOMINANT HOUSE (stellium) finder.
 *
 * Rule (owner): in the D1 chart, find the house where two, three, four or more planets sit together.
 * That house and its significations have the biggest impact on the native's life. The kind of impact is
 * decided by the planets in it: each planet delivers the house through its NATURAL significations and its
 * FUNCTIONAL significations (the houses it lords in this chart). Applies to every planet and every house.
 *
 * All positions come from Vednetra (VedicCore). This tool only reads them and arranges the judgement table.
 * Houses are whole sign houses counted from the reference sign, which is Vednetra's own "house" field.
 *
 * Usage:
 *   node suj_engine/tools/stellium.js '<json-config>'            (markdown)
 *   node suj_engine/tools/stellium.js --file cfg.json --json     (structured)
 * Config: name, gender, date, time, tz, lat, lon, place, focusHouse (optional, 1 to 12, the house the
 *         question is about), appDir (optional).
 */
const fs = require("fs");
const path = require("path");
const { loadVedicCore } = require("./vednetra_loader");

const SIGN_NAMES = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const KENDRA = [1, 4, 7, 10], KONA = [1, 5, 9], DUSTHANA = [6, 8, 12];
const KB = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "significations.json"), "utf8"));

function signLord(signIdx) {
  for (const p of Object.keys(KB.ownSigns)) if (KB.ownSigns[p].indexOf(signIdx) >= 0) return p;
  return null;
}
function houseOf(signIdx, refSign) { return ((signIdx - refSign + 12) % 12) + 1; }
function lordshipsIn(planetName, refSign) {
  return (KB.ownSigns[planetName] || []).map(s => houseOf(s, refSign)).sort((a, b) => a - b);
}
// Same rule set Vednetra uses for its own functionalRole, applied to any reference sign.
function functionalRole(planetName, lords, nodeDispositorRole) {
  if (planetName === "Rahu" || planetName === "Ketu") return "Node adopts " + (nodeDispositorRole || "dispositor result");
  const bad = lords.filter(h => [3, 6, 8, 12].indexOf(h) >= 0);
  const good = lords.filter(h => [1, 2, 4, 5, 7, 9, 10, 11].indexOf(h) >= 0);
  const ownsKendra = lords.some(h => KENDRA.indexOf(h) >= 0);
  const ownsKona = lords.some(h => KONA.indexOf(h) >= 0);
  if (ownsKendra && ownsKona && planetName !== "Sun" && planetName !== "Moon") return "Yogakaraka";
  if (bad.length === 0) return "Functional benefic";
  if (good.length === 0) return "Functional malefic";
  return "Mixed functional";
}
// SUJ rule: Moon is benefic from Shukla 6th tithi through Krishna 10th tithi (elongation 60 to 300 degrees).
function moonIsBenefic(chart) {
  const e = ((chart.planetsByName.Moon.lon - chart.planetsByName.Sun.lon) % 360 + 360) % 360;
  return e >= 60 && e <= 300;
}
function naturalNature(chart, p) {
  if (p.name === "Jupiter" || p.name === "Venus") return "Benefic";
  if (["Sun", "Mars", "Saturn", "Rahu", "Ketu"].indexOf(p.name) >= 0) return "Malefic";
  if (p.name === "Moon") return moonIsBenefic(chart) ? "Benefic (Shukla 6 to Krishna 10)" : "Malefic (Krishna 11 to Shukla 5)";
  if (p.name === "Mercury") {
    const assoc = chart.planets.filter(q => q.name !== "Mercury" && q.sign === p.sign && ["Sun", "Mars", "Saturn", "Rahu", "Ketu"].indexOf(q.name) >= 0);
    return assoc.length ? "Malefic by association with " + assoc.map(q => q.name).join(", ") : "Benefic (no malefic association)";
  }
  return "Mixed";
}

function analyseFrame(chart, frameName, refSign) {
  const byHouse = {};
  for (let h = 1; h <= 12; h++) byHouse[h] = [];
  chart.planets.forEach(p => byHouse[houseOf(p.sign, refSign)].push(p));
  const isLagna = frameName === "Lagna";

  const rows = [];
  for (let h = 1; h <= 12; h++) {
    const members = byHouse[h];
    if (members.length < 2) continue;
    const signIdx = (refSign + h - 1) % 12;
    const lordName = signLord(signIdx);
    const lordP = chart.planetsByName[lordName];
    const planets = members.map(p => {
      const lords = isLagna ? p.lordships.slice().sort((a, b) => a - b) : lordshipsIn(p.name, refSign);
      const disp = chart.planetsByName[p.dispositor];
      const dispLords = disp ? (isLagna ? disp.lordships : lordshipsIn(disp.name, refSign)) : [];
      const role = isLagna ? p.functionalRole : functionalRole(p.name, lords, disp ? functionalRole(disp.name, dispLords) : null);
      return {
        name: p.name,
        degree: Number(p.deg.toFixed(2)),
        sign: p.signName,
        nakshatra: p.nakshatra + " pada " + p.pada + " (lord " + p.nakLord + ")",
        naturalNature: naturalNature(chart, p),
        naturalSignifications: KB.planets[p.name].natural,
        lordshipOfHouses: lords,
        functionalSignifications: lords.map(x => "House " + x + ": " + KB.houses[x].themes),
        functionalRole: role,
        dignity: p.dignity,
        retrograde: !!p.retrograde,
        combust: !!p.combust,
        navamsaSign: p.navamsaSignName,
        dispositor: p.dispositor,
        vednetraStrength: isLagna && p.strength ? p.strength.label + " (" + p.strength.score + ")" : null,
        vednetraAfflictions: isLagna ? p.afflictions : undefined
      };
    });
    rows.push({
      frame: frameName,
      house: h,
      sign: SIGN_NAMES[signIdx],
      houseLord: lordName,
      houseLordPlacedInHouse: houseOf(lordP.sign, refSign),
      houseType: [KENDRA.indexOf(h) >= 0 ? "Kendra" : null, KONA.indexOf(h) >= 0 ? "Trikona" : null, DUSTHANA.indexOf(h) >= 0 ? "Dusthana" : null, [3, 6, 10, 11].indexOf(h) >= 0 ? "Upachaya" : null, [2, 5, 8, 11].indexOf(h) >= 0 ? "Panapara" : null, [3, 6, 9, 12].indexOf(h) >= 0 ? "Apoklima" : null].filter(Boolean).join(" and "),
      houseThemes: KB.houses[h].themes,
      count: members.length,
      planets,
      houseLordAmongOccupants: members.some(p => p.name === lordName),
      score: members.length
    });
  }
  rows.sort((a, b) => b.count - a.count || a.house - b.house);
  const max = rows.length ? rows[0].count : 0;
  rows.forEach(r => { r.dominant = r.count === max; });
  return { frame: frameName, refSign: SIGN_NAMES[refSign], stelliumCount: rows.length, maxPlanets: max, houses: rows };
}

function analyse(cfg) {
  const VC = loadVedicCore(cfg.appDir);
  const t = String(cfg.time).length === 5 ? cfg.time + ":00" : cfg.time;
  const built = VC.avEngineFor({
    name: cfg.name || "Native", gender: cfg.gender || "unspecified",
    birthISO: cfg.date + "T" + t, tz: Number(cfg.tz), lat: Number(cfg.lat), lon: Number(cfg.lon), place: cfg.place || ""
  });
  const chart = built.chart;
  const frames = [
    analyseFrame(chart, "Lagna", chart.ascendant.sign),
    analyseFrame(chart, "Moon", chart.planetsByName.Moon.sign),
    analyseFrame(chart, "Sun", chart.planetsByName.Sun.sign)
  ];
  const lagna = frames[0];
  // Cross frame agreement (Sudarshan): is the dominant Lagna house also a stellium house from Moon and Sun?
  const agreement = lagna.houses.filter(r => r.dominant).map(r => ({
    lagnaHouse: r.house,
    sign: r.sign,
    alsoStelliumFromMoon: frames[1].houses.some(x => x.sign === r.sign),
    alsoStelliumFromSun: frames[2].houses.some(x => x.sign === r.sign)
  }));
  let focus = null;
  if (cfg.focusHouse) {
    const f = Number(cfg.focusHouse);
    const dom = lagna.houses.filter(r => r.dominant);
    const fRow = lagna.houses.find(r => r.house === f);
    const fLordName = signLord((chart.ascendant.sign + f - 1) % 12);
    const fLordHouse = houseOf(chart.planetsByName[fLordName].sign, chart.ascendant.sign);
    focus = {
      focusHouse: f,
      focusHouseIsStellium: !!fRow,
      focusHouseIsDominant: !!(fRow && fRow.dominant),
      focusHouseLord: fLordName,
      focusHouseLordSitsIn: fLordHouse,
      focusLordSitsInDominantHouse: dom.some(r => r.house === fLordHouse),
      dominantPlanetsLordingFocusHouse: dom.flatMap(r => r.planets.filter(p => p.lordshipOfHouses.indexOf(f) >= 0).map(p => p.name + " (in house " + r.house + ")"))
    };
  }
  return {
    native: cfg.name || "Native",
    ascendant: SIGN_NAMES[chart.ascendant.sign] + " " + chart.ascendant.deg.toFixed(2),
    houseSystem: "Whole sign houses from each reference sign (Vednetra house field)",
    nodesCounted: true,
    frames, agreement, focus
  };
}

function toMarkdown(res) {
  const L = [];
  L.push("# SUJ KB1 DOMINANT HOUSE (STELLIUM) SCAN for " + res.native);
  L.push("Ascendant " + res.ascendant + ". " + res.houseSystem + ". Rahu and Ketu are counted as planets.");
  L.push("");
  res.frames.forEach(f => {
    L.push("## " + f.frame + " chart (reference sign " + f.refSign + ")");
    if (!f.houses.length) { L.push("No house holds two or more planets in this chart. Dominant house rule has no stellium here."); L.push(""); return; }
    L.push("Houses with two or more planets: " + f.houses.map(r => "H" + r.house + " " + r.sign + " (" + r.count + ")").join(", ") + ". Most populated: " + f.maxPlanets + " planets.");
    L.push("");
    f.houses.forEach(r => {
      L.push("### " + (r.dominant ? "DOMINANT " : "Secondary ") + "house " + r.house + " in " + r.sign + ", " + r.count + " planets, " + r.houseType);
      L.push("House significations: " + r.houseThemes);
      L.push("House lord " + r.houseLord + " sits in house " + r.houseLordPlacedInHouse + (r.houseLordAmongOccupants ? " (lord is among the occupants, so it joins them in the delivery)" : ""));
      r.planets.forEach(p => {
        L.push("- " + p.name + " " + p.degree + " deg " + p.sign + ", " + p.nakshatra + ". " + p.naturalNature + ". " + p.functionalRole + ". Dignity " + p.dignity + (p.retrograde ? ", retrograde" : "") + (p.combust ? ", combust" : "") + ". Navamsa " + p.navamsaSign + (p.vednetraStrength ? ". Vednetra strength " + p.vednetraStrength : ""));
        L.push("  Natural: " + p.naturalSignifications);
        L.push("  Functional, lord of " + (p.lordshipOfHouses.length ? p.lordshipOfHouses.join(" and ") : "no house (node, acts through dispositor " + p.dispositor + ")") + (p.functionalSignifications.length ? ". " + p.functionalSignifications.join(" | ") : ""));
      });
      L.push("");
    });
  });
  L.push("## Cross chart agreement for the dominant Lagna chart houses");
  if (!res.agreement.length) L.push("No stellium in the Lagna chart.");
  res.agreement.forEach(a => L.push("House " + a.lagnaHouse + " (" + a.sign + ") is also a stellium from the Moon: " + a.alsoStelliumFromMoon + ", from the Sun: " + a.alsoStelliumFromSun));
  if (res.focus) {
    L.push("");
    L.push("## Link to the question house " + res.focus.focusHouse);
    L.push(JSON.stringify(res.focus, null, 1));
  }
  return L.join("\n");
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  const fi = argv.indexOf("--file");
  let cfg;
  try {
    cfg = fi >= 0 ? JSON.parse(fs.readFileSync(argv[fi + 1], "utf8")) : JSON.parse(argv.find(a => !a.startsWith("--")) || "{}");
  } catch (e) { console.error("Bad config: " + e.message); process.exit(2); }
  for (const k of ["date", "time", "tz", "lat", "lon"]) {
    if (cfg[k] === undefined || cfg[k] === "") { console.error("Missing required config field: " + k); process.exit(2); }
  }
  const res = analyse(cfg);
  process.stdout.write((argv.indexOf("--json") >= 0 ? JSON.stringify(res, null, 1) : toMarkdown(res)) + "\n");
}

module.exports = { analyse, toMarkdown };
