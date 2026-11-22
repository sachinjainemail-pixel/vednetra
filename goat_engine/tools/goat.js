#!/usr/bin/env node
/*
 * GOAT ENGINE. Promise and timing analysis for one question, following the owner's GOAT method.
 *
 * Every position comes from VedNetra through the SUJ loader. The Lagna chart, the Moon chart, the
 * navamsa (D9) rotated to the Lagna sign, the Vimshottari tree and the transits of Jupiter and Saturn
 * are all read from the VedNetra core. Nothing is computed by hand here.
 *
 * The owner ranks the factors and asks for best judgement. This engine turns that rank into explicit
 * weighted points. The weights and thresholds live in data/weights.json so the owner can change them.
 *
 * Steps run for each question:
 *   1. Promise. Ten components are scored in the Lagna chart, the Moon chart and the rotated D9 chart.
 *      Benefic points and malefic points are kept apart. The net decides the promise, YES if net is above 0.
 *   2. Timing. Pratyantardasha windows of the relevant planets are listed inside the search range.
 *   3. Transit validation. Each window is sampled. A double transit means Jupiter and Saturn both hit the
 *      house, its lord or the karaka in the same sample. Grade A or B validates the window.
 *   4. Final answer. YES needs a promise and a validated window. Otherwise the answer is NO.
 *   5. Hindi one-liner built from the decisive factors.
 *
 * Usage:
 *   node goat_engine/tools/goat.js '<json-config>'            report text
 *   node goat_engine/tools/goat.js '<json-config>' --json     structured result
 * Config fields: name, gender, date (YYYY-MM-DD), time (HH:MM or HH:MM:SS), tz (hours), lat, lon, place,
 *   topic (a key of data/topics.json) or options (a list of {label, topic}), asOf (YYYY-MM-DD, default today),
 *   fromISO and toISO (search range, default asOf to asOf plus horizonYears), horizonYears, appDir (optional).
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { loadVedicCore } = require("../../suj_engine/tools/vednetra_loader");

const DATA = path.join(__dirname, "..", "data");
const W = JSON.parse(fs.readFileSync(path.join(DATA, "weights.json"), "utf8"));
const TOPICS = JSON.parse(fs.readFileSync(path.join(DATA, "topics.json"), "utf8"));
const DAY = 86400000;

// ---- fixed astrological tables -------------------------------------------------------------------
const MALEFIC_NATURE = ["Sun", "Mars", "Saturn", "Rahu", "Ketu"];
const SIGN_LORD = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"];
const EXALT = { Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6 };
const DEEP_DEG = { Sun: 10, Moon: 3, Mars: 28, Mercury: 15, Jupiter: 5, Venus: 27, Saturn: 20 };
const MOOLATRIKONA = { Sun: [4, 0, 20], Moon: [1, 4, 30], Mars: [0, 0, 12], Mercury: [5, 16, 20], Jupiter: [8, 0, 10], Venus: [6, 0, 15], Saturn: [10, 0, 20] };
const FRIENDS = {
  Sun: [["Moon", "Mars", "Jupiter"], ["Venus", "Saturn"]],
  Moon: [["Sun", "Mercury"], []],
  Mars: [["Sun", "Moon", "Jupiter"], ["Mercury"]],
  Mercury: [["Sun", "Venus"], ["Moon"]],
  Jupiter: [["Sun", "Moon", "Mars"], ["Mercury", "Venus"]],
  Venus: [["Mercury", "Saturn"], ["Sun", "Moon"]],
  Saturn: [["Mercury", "Venus"], ["Sun", "Moon", "Mars"]]
};
const NATAL_ASPECTS = { Sun: [7], Moon: [7], Mars: [4, 7, 8], Mercury: [7], Jupiter: [5, 7, 9], Venus: [7], Saturn: [3, 7, 10], Rahu: [5, 7, 9], Ketu: [5, 7, 9] };
const TRANSIT_ASPECTS = { Jupiter: [5, 7, 9], Saturn: [3, 7, 10] };
const KENDRA_KONA = [1, 4, 5, 7, 9, 10];
const DUSTHANA = [6, 8, 12];
const HI_PLANET = { Sun: "सूर्य", Moon: "चंद्र", Mars: "मंगल", Mercury: "बुध", Jupiter: "गुरु", Venus: "शुक्र", Saturn: "शनि", Rahu: "राहु", Ketu: "केतु" };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ---- small helpers -------------------------------------------------------------------------------
const mod12 = x => ((x % 12) + 12) % 12;
const modDeg = x => ((x % 360) + 360) % 360;
const houseFrom = (sign, ref) => mod12(sign - ref) + 1;
const signAtHouse = (ref, h) => mod12(ref + h - 1);
const sum = a => a.reduce((s, x) => s + x, 0);
const round2 = x => Math.round(x * 100) / 100;
const fmt = x => (x < 0 ? "minus " + Math.abs(x).toFixed(2) : "+" + Number(x).toFixed(2));
const fmtDate = d => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
const fmtTime = d => `${String(d.getUTCHours()).padStart(2, "0")}h${String(d.getUTCMinutes()).padStart(2, "0")}`;
function parseDay(s) {
  if (!s) return null;
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error("Date must be YYYY-MM-DD, got " + s);
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
}
function birthInstant(cfg) {
  const m = String(cfg.date).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const t = String(cfg.time).split(":").map(Number);
  if (!m) throw new Error("date must be YYYY-MM-DD");
  const local = Date.UTC(+m[1], +m[2] - 1, +m[3], t[0] || 0, t[1] || 0, t[2] || 0);
  return new Date(local - Number(cfg.tz) * 3600000);
}
function friendship(name, lord) {
  const f = FRIENDS[name];
  if (!f || name === lord) return 0;
  if (f[0].indexOf(lord) >= 0) return 1;
  if (f[1].indexOf(lord) >= 0) return -1;
  return 0;
}

// ---- context from VedNetra -----------------------------------------------------------------------
function makeContext(cfg) {
  const VC = loadVedicCore(cfg.appDir);
  const C = VC.buildChart(birthInstant(cfg), Number(cfg.lat), Number(cfg.lon), Number(cfg.tz), { ayanamshaKey: "lahiri" });
  return { cfg, VC, C, by: C.planetsByName, planets: C.planets, lagna: C.ascendant.sign, moon: C.planetsByName.Moon.sign };
}

// ---- nature, function and condition of one planet ------------------------------------------------
function natureOf(ctx, name) {
  if (name === "Jupiter" || name === "Venus") return 1;
  if (MALEFIC_NATURE.indexOf(name) >= 0) return -1;
  if (name === "Moon") {
    const e = modDeg(ctx.by.Moon.lon - ctx.by.Sun.lon);
    return e >= 60 && e < 300 ? 1 : -1;               // benefic from Shukla 6th to Krishna 10th tithi
  }
  if (name === "Mercury") {
    const m = ctx.by.Mercury;
    const bad = ctx.planets.some(q => q.name !== "Mercury" && MALEFIC_NATURE.indexOf(q.name) >= 0 && q.sign === m.sign);
    return bad ? -1 : 1;                              // conditional benefic by association
  }
  return 0;
}
function functionalOf(ctx, name) {
  if (name === "Rahu" || name === "Ketu") return 0;
  const owned = [];
  for (let h = 1; h <= 12; h++) if (SIGN_LORD[signAtHouse(ctx.lagna, h)] === name) owned.push(h);
  if (!owned.length) return 0;
  const kendra = owned.some(h => [1, 4, 7, 10].indexOf(h) >= 0);
  const kona = owned.some(h => [1, 5, 9].indexOf(h) >= 0);
  if (kendra && kona && name !== "Sun" && name !== "Moon") return 1;   // yogakaraka
  const bad = owned.filter(h => [3, 6, 8, 12].indexOf(h) >= 0);
  const good = owned.filter(h => [3, 6, 8, 12].indexOf(h) < 0);
  if (bad.length === 0) return 0.5;
  if (good.length === 0) return -0.5;
  return 0;
}
function dignityAt(name, sign, deg) {
  if (EXALT[name] === undefined) return { label: "none", v: 0, deep: false };
  const deep = deg !== undefined && Math.abs(deg - DEEP_DEG[name]) <= 5;
  if (EXALT[name] === sign) return { label: "exalted", v: 1, deep };
  if (mod12(EXALT[name] + 6) === sign) return { label: "debilitated", v: -1, deep };
  const m = MOOLATRIKONA[name];
  if (deg !== undefined && m[0] === sign && deg >= m[1] && deg <= m[2]) return { label: "moolatrikona", v: 0.75, deep: false };
  if (SIGN_LORD[sign] === name) return { label: "own sign", v: 0.5, deep: false };
  const rel = friendship(name, SIGN_LORD[sign]);
  if (rel > 0) return { label: "friendly sign", v: 0.25, deep: false };
  if (rel < 0) return { label: "enemy sign", v: -0.25, deep: false };
  return { label: "neutral sign", v: 0, deep: false };
}
// Value of one planet placed in a sign. d9 true uses the navamsa sign and skips the D1 only conditions.
function pvAt(ctx, name, sign, d9) {
  const p = ctx.by[name];
  const nat = natureOf(ctx, name);
  const fn = functionalOf(ctx, name);
  const dig = dignityAt(name, sign, d9 ? undefined : p.deg);
  let v = nat + fn + dig.v;
  if (dig.deep) v += dig.v > 0 ? 0.25 : -0.25;
  if (!d9) {
    if (p.combust && name !== "Sun" && name !== "Moon") v -= 0.5;
    if (p.retrograde && name !== "Rahu" && name !== "Ketu") v *= 1.25;
    v += 0.25 * Math.sign(natureOf(ctx, p.nakLord));
  }
  return { v: round2(v), nat, fn, dignity: dig.label };
}

// ---- house level factors in one D1 chart ---------------------------------------------------------
function aspectsOn(ctx, s) {
  const list = [];
  ctx.planets.forEach(q => {
    const asp = NATAL_ASPECTS[q.name];
    if (!asp || q.sign === s) return;
    if (asp.indexOf(houseFrom(s, q.sign)) >= 0) list.push({ name: q.name, v: 0.5 * natureOf(ctx, q.name) });
  });
  return { score: round2(sum(list.map(x => x.v))), list };
}
function kartari(ctx, s) {
  const left = ctx.planets.filter(q => q.sign === mod12(s - 1));
  const right = ctx.planets.filter(q => q.sign === mod12(s + 1));
  const side = arr => sum(arr.map(q => natureOf(ctx, q.name)));
  const ls = side(left), rs = side(right);
  if (left.length && right.length) {
    if (ls > 0 && rs > 0) return { score: 1, kind: "Shubh kartari" };
    if (ls < 0 && rs < 0) return { score: -1, kind: "Paap kartari" };
    return { score: 0, kind: "mixed kartari" };
  }
  if (left.length || right.length) {
    const s1 = left.length ? ls : rs;
    if (s1 > 0) return { score: 0.5, kind: "partial Shubh kartari" };
    if (s1 < 0) return { score: -0.5, kind: "partial Paap kartari" };
  }
  return { score: 0, kind: "no kartari" };
}
function evalD1House(ctx, s) {
  const occ = ctx.planets.filter(q => q.sign === s).map(q => Object.assign({ name: q.name }, pvAt(ctx, q.name, q.sign, false)));
  const asp = aspectsOn(ctx, s);
  const kar = kartari(ctx, s);
  return { s, occ, asp, kar, total: round2(sum(occ.map(o => o.v)) + asp.score + kar.score) };
}
// Placement of a lord or karaka counted from the house under study, in D1.
function placeRel(d) {
  if (KENDRA_KONA.indexOf(d) >= 0) return 0.5;
  if (d === 2 || d === 11) return 0.25;
  if (DUSTHANA.indexOf(d) >= 0) return -0.5;
  return 0;
}
function evalPlanetFromHouse(ctx, name, s) {
  const p = ctx.by[name];
  const cond = pvAt(ctx, name, p.sign, false);
  const d = houseFrom(p.sign, s);
  const place = placeRel(d);
  const kar = kartari(ctx, p.sign).score;
  const asp = aspectsOn(ctx, p.sign).score;
  const conj = sum(ctx.planets.filter(q => q.sign === p.sign && q.name !== name).map(q => 0.5 * pvAt(ctx, q.name, q.sign, false).v));
  return { name, cond, d, place, kar, asp, conj: round2(conj), total: round2(cond.v + place + kar + asp + conj) };
}
// Placement in the rotated D9 chart, counted from the D1 Lagna sign.
function placeD9(d) {
  if ([1, 2, 4, 5, 7, 9, 10, 11].indexOf(d) >= 0) return 1;
  if (d === 3) return -0.5;
  return -1;
}
function evalD9Planet(ctx, name) {
  const p = ctx.by[name];
  const d = houseFrom(p.navamsaSign, ctx.lagna);
  const cond = pvAt(ctx, name, p.navamsaSign, true);
  return { name, d, place: placeD9(d), cond, total: round2(placeD9(d) + cond.v) };
}

// ---- the promise for one house --------------------------------------------------------------------
function karakaNames(T, gender) {
  const k = T.karaka;
  if (k.male || k.female) return gender && String(gender).toLowerCase() === "female" ? k.female : k.male;
  return k.any;
}
function evalPromise(ctx, T) {
  const H = T.house;
  const sL = signAtHouse(ctx.lagna, H);
  const sM = signAtHouse(ctx.moon, H);
  const karakas = karakaNames(T, ctx.cfg.gender);
  const lordName = SIGN_LORD[sL];
  const c1 = evalD1House(ctx, sL);
  const c3 = evalD1House(ctx, sM);
  const d9occ = ctx.planets.filter(q => q.navamsaSign === sL).map(q => ({ name: q.name, v: pvAt(ctx, q.name, q.navamsaSign, true).v }));
  const c2 = round2(sum(d9occ.map(x => x.v)));
  const c4 = evalPlanetFromHouse(ctx, lordName, sL);
  const c5 = evalD9Planet(ctx, lordName);
  const kEval = karakas.map(k => evalPlanetFromHouse(ctx, k, sL));
  const kD9 = karakas.map(k => evalD9Planet(ctx, k));
  const x4 = ((H + H - 2) % 12) + 1;                 // Nth house from the house, N equal to H
  const s4 = signAtHouse(ctx.lagna, x4);
  const lord4 = SIGN_LORD[s4];
  const c8 = round2(evalD1House(ctx, s4).total + evalPlanetFromHouse(ctx, lord4, s4).total);
  const sK = mod12(H - 1);                           // Kalpurusha sign of house H, Aries for house 1
  const lordK = SIGN_LORD[sK];
  const c9 = round2(evalD1House(ctx, sK).total + evalPlanetFromHouse(ctx, lordK, sK).total);
  const avg = a => (a.length ? sum(a) / a.length : 0);
  const raw = {
    c1_house_lagna: c1.total,
    c2_house_d9_rotated: c2,
    c3_house_moon: c3.total,
    c4_lord_lagna: c4.total,
    c5_lord_d9_rotated: c5.total,
    c6_karaka_lagna: round2(avg(kEval.map(x => x.total))),
    c7_karaka_d9_rotated: round2(avg(kD9.map(x => x.total))),
    c8_nth_house: c8,
    c9_kalpurusha_house: c9,
    c10_lagna_moon_agreement: (c1.total > 0 && c3.total > 0) ? 1 : (c1.total < 0 && c3.total < 0) ? -1 : 0
  };
  const comps = Object.keys(raw).map(id => {
    const w = W.weights[id];
    const contrib = id === "c10_lagna_moon_agreement" ? w * raw[id] : w * Math.tanh(raw[id] / 2);
    return { id, weight: w, raw: round2(raw[id]), contribution: round2(contrib) };
  });
  const net = round2(sum(comps.map(c => c.contribution)));
  const detail = {
    c1_house_lagna: c1, c3_house_moon: c3, c4_lord_lagna: c4, c5_lord_d9_rotated: c5,
    c6_karaka_lagna: kEval, c7_karaka_d9_rotated: kD9, c8_nth_house: { house: x4, sign: s4, lord: lord4 },
    c9_kalpurusha_house: { sign: sK, lord: lordK }, c2_house_d9_rotated: d9occ
  };
  return { H, sL, sM, karakas, lordName, x4, s4, sK, lordK, comps, net, weightSum: sum(Object.values(W.weights)), detail };
}

// ---- timing: pratyantardasha windows and transit validation --------------------------------------
function hitsTargets(ref, name, targets) {
  return targets.some(t => { const d = houseFrom(t, ref.sign); return d === 1 || TRANSIT_ASPECTS[name].indexOf(d) >= 0; });
}
function transitCheck(ctx, a0, b0, targets) {
  const N = W.transit.samples_per_window;
  let dbl = 0, jup = 0, sat = 0;
  for (let i = 0; i < N; i++) {
    const t = N === 1 ? a0 : a0 + ((b0 - a0) * i) / (N - 1);
    const tc = ctx.VC.buildChart(new Date(t), Number(ctx.cfg.lat), Number(ctx.cfg.lon), Number(ctx.cfg.tz), { ayanamshaKey: "lahiri" });
    const jh = hitsTargets(tc.planetsByName.Jupiter, "Jupiter", targets);
    const sh = hitsTargets(tc.planetsByName.Saturn, "Saturn", targets);
    if (jh) jup++;
    if (sh) sat++;
    if (jh && sh) dbl++;
  }
  let grade = "D";                                   // no double transit at all
  if (dbl >= W.transit.grade_A_min_double_samples) grade = "A";
  else if (dbl >= W.transit.grade_B_min_double_samples) grade = "B";
  else if (dbl >= 1) grade = "C";                    // one double sample only, not validated
  return { grade, double: dbl, jupiterSamples: jup, saturnSamples: sat, validated: W.transit.validated_grades.indexOf(grade) >= 0 };
}
function findWindows(ctx, S, targets) {
  const { from, to, asOf } = ctx;
  const out = [];
  for (const md of ctx.C.vimshottari.timeline) {
    if (md.end <= from || md.start >= to) continue;
    const mdIn = S.has(md.lord);
    for (const ad of ctx.VC.subPeriods(md, "AD")) {
      if (ad.end <= from || ad.start >= to) continue;
      const adIn = S.has(ad.lord);
      if (W.dasha.antardasha_must_be_relevant && !adIn) continue;
      for (const pd of ctx.VC.subPeriods(ad, "PD")) {
        if (pd.end <= from || pd.start >= to) continue;
        const pdIn = S.has(pd.lord);
        if (W.dasha.mahadasha_or_pratyantardasha_must_be_relevant && !(mdIn || pdIn)) continue;
        const a0 = Math.max(pd.start.getTime(), from.getTime());
        const b0 = Math.min(pd.end.getTime(), to.getTime());
        const tr = transitCheck(ctx, a0, b0, targets);
        const status = pd.end < asOf ? "PAST" : (pd.start > asOf ? "FUTURE" : "NOW");
        out.push({ md: md.lord, ad: ad.lord, pd: pd.lord, start: pd.start, end: pd.end, dashaCount: [mdIn, adIn, pdIn].filter(Boolean).length, status, ...tr });
      }
    }
  }
  return out;
}
const GRADE_RANK = { A: 4, B: 3, C: 2, D: 1 };
function bestWindow(windows) {
  const v = windows.filter(w => w.validated);
  v.sort((a, b) => (GRADE_RANK[b.grade] - GRADE_RANK[a.grade]) || (b.dashaCount - a.dashaCount) || (a.start - b.start));
  return v;
}

// ---- one topic, one full run ----------------------------------------------------------------------
function analyseTopic(ctx, topicKey, label) {
  const T = TOPICS[topicKey];
  if (!T) throw new Error("Unknown topic " + topicKey + ". Known topics are " + Object.keys(TOPICS).filter(k => k[0] !== "_").join(", "));
  const P = evalPromise(ctx, T);
  const lordP = ctx.by[P.lordName];
  const occH = ctx.planets.filter(q => q.sign === P.sL).map(q => q.name);
  const occD9 = ctx.planets.filter(q => q.navamsaSign === P.sL).map(q => q.name);
  const S = new Set([P.lordName].concat(occH, occD9, P.karakas));
  const targets = [P.sL, lordP.sign].concat(P.karakas.map(k => ctx.by[k].sign));
  const promiseYes = P.net > 0;
  const windows = findWindows(ctx, S, targets);
  const valid = bestWindow(windows);
  const best = valid.length ? valid[0] : null;
  let decision, yes, reason;
  if (!promiseYes) { yes = false; decision = "NO"; reason = "The natal promise is not there, net " + fmt(P.net) + "."; }
  else if (!best) { yes = false; decision = "NO"; reason = "The promise is there but no dasha window in the search range is validated by a double transit of Jupiter and Saturn."; }
  else { yes = true; decision = "YES"; reason = "The promise is there, and the best window is validated by a double transit of Jupiter and Saturn."; }
  const pos = P.comps.filter(c => c.contribution > 0).sort((a, b) => b.contribution - a.contribution);
  const neg = P.comps.filter(c => c.contribution < 0).sort((a, b) => a.contribution - b.contribution);
  const result = {
    label, topic: topicKey, hi: T.hi, house: P.H, lagnaSign: P.sL, moonHouseSign: P.sM, karakas: P.karakas, lord: P.lordName,
    nthHouse: P.x4, kalpurushaHouseSign: P.sK, kalpurushaLord: P.lordK, net: P.net, promiseYes,
    components: P.comps, benefic: pos, malefic: neg, detail: P.detail,
    relevantPlanets: Array.from(S), transitTargetSigns: targets,
    windowsFound: windows.length, validatedWindows: valid.length, topWindows: valid.slice(0, 5),
    best, yes, decision, reason, asOf: ctx.asOf, from: ctx.from, to: ctx.to,
    hindi: null
  };
  result.hindi = hindiLine(ctx, result);
  result.score = (yes ? 1000 : 0) + (best ? GRADE_RANK[best.grade] * 10 : 0) + P.net;
  return result;
}
function hindiLine(ctx, r) {
  const occ = ctx.planets.filter(q => q.sign === r.lagnaSign).map(q => HI_PLANET[q.name]);
  const lordHi = HI_PLANET[r.lord] || r.lord;
  const occHi = occ.length ? occ.join(" और ") : "कोई ग्रह नहीं";
  const parts = [];
  parts.push(`${r.hi} के लिए भाव ${r.house} का स्वामी ${lordHi} है और भाव में ${occHi} है`);
  parts.push(`लग्न चंद्र और नवांश के संयुक्त तर्क से वचन ${r.net > 0 ? "सकारात्मक" : "नकारात्मक"} है`);
  parts.push(`गोचर में गुरु और शनि का दोहरा समर्थन ${r.best ? "मिलता है" : "नहीं मिलता"}`);
  if (r.yes && r.best) parts.push(`अतः निर्णय हाँ है और समय ${fmtDate(r.best.start)} से ${fmtDate(r.best.end)} तक का है`);
  else parts.push("अतः निर्णय नहीं है");
  return parts.join(", ") + "।";
}

function run(cfg) {
  if (!cfg || !cfg.date || !cfg.time || cfg.tz === undefined || cfg.lat === undefined || cfg.lon === undefined) {
    throw new Error("Config needs date, time, tz, lat and lon");
  }
  const ctx = makeContext(cfg);
  const asOf = parseDay(cfg.asOf) || parseDay(new Date().toISOString().slice(0, 10));
  const horizon = Number(cfg.horizonYears || W.horizonYears || 10);
  ctx.asOf = asOf;
  ctx.from = parseDay(cfg.fromISO) || asOf;
  ctx.to = parseDay(cfg.toISO) || new Date(asOf.getTime() + horizon * 365.25 * DAY);
  const items = cfg.options && cfg.options.length ? cfg.options : [{ label: cfg.topic, topic: cfg.topic }];
  const results = items.map(it => analyseTopic(ctx, it.topic, it.label || it.topic));
  const sorted = results.slice().sort((a, b) => b.score - a.score);
  return { mode: items.length > 1 ? "options" : "single", name: cfg.name || "Native", gender: cfg.gender || "unspecified", place: cfg.place || "",
    birth: cfg.date, time: cfg.time, asOf, from: ctx.from, to: ctx.to, lagnaSign: ctx.lagna, moonSign: ctx.moon,
    results: sorted, chosen: sorted[0] };
}

// ---- report text. Plain sentences only, no colon, bracket, slash, hyphen, hash, asterisk or tilde ----
const SAFE = { "(": "", ")": "", "!": "", ";": ".", ":": "", "—": ", ", "“": "", "”": "", "/": " or ", "‘": "'", "’": "'", "-": " ", "#": "", "*": "", "~": "" };
function plain(s) { return String(s).replace(/[()!;:—“”\/‘’\-#*~]/g, ch => SAFE[ch] === undefined ? "" : SAFE[ch]); }
function renderResult(r, idx) {
  const L = [];
  const occ = ctxOccNames(r);
  L.push(`${idx === undefined ? "" : idx + 1 + ". "}Option ${r.label}`);
  L.push(`Topic ${r.topic}, house ${r.house} from Lagna, lord ${r.lord}, karakas ${r.karakas.join(" and ")}, Nth house ${r.nthHouse}, Kalpurusha house sign lord ${r.kalpurushaLord}.`);
  L.push("");
  L.push("STEP 1 AND 2. Benefic points first, then malefic points discounted.");
  r.benefic.forEach(c => L.push(`  Benefic ${c.id} weight ${c.weight} gives ${fmt(c.contribution)}.`));
  if (!r.benefic.length) L.push("  No benefic component.");
  r.malefic.forEach(c => L.push(`  Malefic ${c.id} weight ${c.weight} gives ${fmt(c.contribution)}.`));
  if (!r.malefic.length) L.push("  No malefic component.");
  L.push(`  Promise net ${fmt(r.net)}, so the promise is ${r.promiseYes ? "PRESENT" : "ABSENT"}.`);
  L.push(`  Occupants of house ${r.house} in Lagna chart are ${occ.lagna}. Occupants in rotated D9 are ${occ.d9}.`);
  L.push("");
  L.push("STEP 3. Dasha windows of relevant planets, validated by Jupiter and Saturn transits.");
  L.push(`  Relevant planets are ${r.relevantPlanets.join(", ")}.`);
  L.push(`  Windows found in range ${r.windowsFound}, validated ${r.validatedWindows}.`);
  r.topWindows.forEach((w, i) => L.push(`  ${i + 1}. ${fmtDate(w.start)} to ${fmtDate(w.end)}, dasha ${w.md} Mahadasha ${w.ad} Antardasha ${w.pd} Pratyantardasha, dasha count ${w.dashaCount} of 3, transit grade ${w.grade}, double transit in ${w.double} of 5 samples, time ${w.status}.`));
  if (!r.topWindows.length) L.push("  No validated window in range.");
  L.push("");
  L.push("STEP 4. Final answer for this option.");
  L.push(`  ${r.decision}. ${r.reason}`);
  if (r.best) L.push(`  Best window ${fmtDate(r.best.start)} to ${fmtDate(r.best.end)}, time ${r.best.status}.`);
  L.push("");
  L.push("Hindi one liner.");
  L.push(r.hindi);
  return L.join("\n");
}
function ctxOccNames(r) {
  const lagna = (r.detail && r.detail.c1_house_lagna && r.detail.c1_house_lagna.occ) || [];
  const d9 = (r.detail && r.detail.c2_house_d9_rotated) || [];
  const f = a => a.length ? a.map(x => x.name).join(", ") : "none";
  return { lagna: f(lagna), d9: f(d9) };
}
function renderRun(res) {
  const L = [];
  L.push(`GOAT ENGINE REPORT for ${res.name}`);
  const hm = String(res.time).split(":");
  L.push(`Gender ${res.gender}, born ${fmtDate(new Date(res.birth + "T00:00:00Z"))} at ${hm[0]}h${hm[1]} local time, ${res.place}.`);
  L.push(`Lagna is sign index ${res.lagnaSign} and Moon sign index ${res.moonSign} in the VedNetra chart.`);
  L.push(`As of ${fmtDate(res.asOf)}. Search range ${fmtDate(res.from)} to ${fmtDate(res.to)}.`);
  L.push("");
  if (res.mode === "options") {
    L.push("Options ranked by the engine. The top option is the definitive answer.");
    res.results.forEach((r, i) => L.push(`  ${i + 1}. ${r.label}, decision ${r.decision}, net ${fmt(r.net)}, best window ${r.best ? fmtDate(r.best.start) + " to " + fmtDate(r.best.end) : "none"}.`));
    L.push("");
  }
  res.results.forEach((r, i) => { L.push(renderResult(r, res.mode === "options" ? i : undefined)); L.push(""); });
  const c = res.chosen;
  L.push("DEFINITIVE FINAL ANSWER");
  L.push(res.mode === "options" ? `Chosen option ${c.label}. ${c.decision}.` : `${c.decision}.`);
  L.push(c.reason);
  return plain(L.join("\n"));
}

module.exports = { run, renderRun, plain, analyseTopic, makeContext, natureOf, houseFrom, signAtHouse, mod12, SIGN_LORD, placeD9, bestWindow, TOPICS, W };

if (require.main === module) {
  const argv = process.argv.slice(2);
  const cfg = JSON.parse(argv.find(a => !a.startsWith("--")) || "{}");
  const res = run(cfg);
  if (argv.indexOf("--json") >= 0) {
    const j = Object.assign({}, res, { results: res.results.map(r => Object.assign({}, r, { best: r.best ? Object.assign({}, r.best, { start: r.best.start.toISOString(), end: r.best.end.toISOString() }) : null, topWindows: r.topWindows.map(w => Object.assign({}, w, { start: w.start.toISOString(), end: w.end.toISOString() })) })) });
    j.chosen = j.results[0]; j.asOf = res.asOf.toISOString(); j.from = res.from.toISOString(); j.to = res.to.toISOString();
    process.stdout.write(JSON.stringify(j, null, 2) + "\n");
  } else {
    process.stdout.write(renderRun(res) + "\n");
  }
}
