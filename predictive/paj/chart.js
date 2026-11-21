"use strict";
// Chart input for the PAJ engine. All positions, houses, nakshatras, dignities and Vimshottari
// periods come from the VedNetra engine in this repository. Ashtakavarga contribution rules are read
// from the VedNetra source so that the tables are the same ones the app displays.
const fs = require("fs");
const path = require("path");
const VC = require("./loader.js");

const APP_ROOT = path.resolve(__dirname, "..", "..");
const CLASSICAL = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
const SHORT = { Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me", Jupiter: "Ju", Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke" };
const VIM_YEARS = { Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17 };
const VIM_ORDER = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
const JAIMINI_KEYS = ["AK", "AmK", "BK", "MK", "PK", "GK", "DK"];

let rulesCache = null;
function ashtakavargaRules() {
  if (rulesCache) return rulesCache;
  const src = fs.readFileSync(path.join(APP_ROOT, "app.js"), "utf8");
  const start = src.indexOf("function ashtakavargaRules()");
  if (start < 0) throw new Error("ashtakavargaRules not found in app.js");
  const end = src.indexOf("\n  }\n", start) + 5;
  rulesCache = (new Function(src.slice(start, end) + "; return ashtakavargaRules();"))();
  return rulesCache;
}

function ashtakavarga(signOf) {
  const rules = ashtakavargaRules();
  const bav = {};
  for (const target of CLASSICAL) {
    const row = new Array(12).fill(0);
    for (const contributor of Object.keys(rules[target])) {
      for (let sign = 0; sign < 12; sign++) {
        const rel = ((sign - signOf[contributor]) % 12 + 12) % 12 + 1;
        if (rules[target][contributor].includes(rel)) row[sign] += 1;
      }
    }
    bav[SHORT[target]] = row;
  }
  const sav = new Array(12).fill(0).map((_, s) => CLASSICAL.reduce((a, t) => a + bav[SHORT[t]][s], 0));
  return { bav, sav };
}

// Vimshottari: VedNetra gives mahadasha periods. Antardashas are split in proportion to the lord's years.
function vimshottari(v) {
  const out = [];
  for (const md of v.timeline) {
    const s = Date.parse(md.start), e = Date.parse(md.end);
    const lord = SHORT[md.lord] || md.lord;
    const full = md.lord;
    const startIdx = VIM_ORDER.indexOf(full);
    const span = e - s;
    const ads = [];
    let cur = s;
    for (let j = 0; j < 9; j++) {
      const adLord = VIM_ORDER[(startIdx + j) % 9];
      const len = span * VIM_YEARS[adLord] / 120;
      ads.push({ lord: SHORT[adLord], start: cur, end: cur + len });
      cur += len;
    }
    out.push({ lord, start: s, end: e, ads });
  }
  return out;
}

// Jaimini seven karakas by degree within sign, highest degree first (Rahu and Ketu excluded).
function charaKarakas(planets) {
  const cands = ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa"].map(k => ({ k, deg: planets[k].deg }));
  cands.sort((a, b) => b.deg - a.deg);
  const out = {};
  JAIMINI_KEYS.forEach((key, i) => { out[key] = cands[i].k; });
  return out;
}

function cast(spec) {
  const time = String(spec.time).length === 5 ? spec.time + ":00" : spec.time;
  const inst = VC.localDateTimeToUtc(spec.date, time, Number(spec.tz));
  const raw = VC.buildChart(inst, Number(spec.lat), Number(spec.lon), Number(spec.tz), { ayanamshaKey: "lahiri" });
  const planets = {};
  for (const p of raw.planets) {
    const key = SHORT[p.name];
    if (!key) continue;
    planets[key] = {
      name: p.name, sign: p.sign, deg: p.degreeInSign, lon: p.lon, house: p.house,
      nakshatra: p.nakshatra, nakLord: p.nakLord, pada: p.pada, retrograde: !!p.retrograde,
      dignity: p.dignity, combust: !!p.combust, lordships: p.lordships || [], strength: p.strength
    };
  }
  const signOf = { Su: planets.Su.sign, Mo: planets.Mo.sign, Ma: planets.Ma.sign, Me: planets.Me.sign,
    Ju: planets.Ju.sign, Ve: planets.Ve.sign, Sa: planets.Sa.sign, La: raw.ascendant.sign };
  const av = ashtakavarga({ Sun: signOf.Su, Moon: signOf.Mo, Mars: signOf.Ma, Mercury: signOf.Me,
    Jupiter: signOf.Ju, Venus: signOf.Ve, Saturn: signOf.Sa, Lagna: signOf.La });
  return {
    name: spec.name || "Native", gender: spec.gender || "unspecified",
    lagnaSign: raw.ascendant.sign, lagnaDeg: raw.ascendant.degreeInSign,
    planets, bav: av.bav, sav: av.sav,
    dashas: vimshottari(raw.vimshottari),
    karakas: charaKarakas(planets),
    birthIso: new Date(inst).toISOString()
  };
}

module.exports = { cast, SHORT, CLASSICAL };
