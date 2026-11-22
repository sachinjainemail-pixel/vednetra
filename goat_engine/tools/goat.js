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
const { loadVedicCore } = require("./vednetra_loader");

const DATA = path.join(__dirname, "..", "data");
const W = JSON.parse(fs.readFileSync(path.join(DATA, "weights.json"), "utf8"));
const TOPICS = JSON.parse(fs.readFileSync(path.join(DATA, "topics.json"), "utf8"));
const TYPES = JSON.parse(fs.readFileSync(path.join(DATA, "types.json"), "utf8"));
const NAKS = JSON.parse(fs.readFileSync(path.join(DATA, "nakshatras.json"), "utf8"));
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
// Timing set. Dasha lords that count for a house are checked from two charts, the Lagna chart (D1 from Lagna)
// Moon chart (house counted from the Moon) and the D9 chart rotated from the Lagna. In each chart the set takes the
// house lord, its occupants and the planets that aspect the house. The karakas of the topic are added once.
function timingSet(ctx, P, occH, occD9) {
  const occM = ctx.planets.filter(q => q.sign === P.sM).map(q => q.name);
  const lordM = SIGN_LORD[P.sM];
  return new Set([P.lordName, lordM].concat(occH, occD9, occM, P.karakas, aspectersOn(ctx, P.sL), aspectersOn(ctx, P.sM), aspectersOnD9(ctx, P.sL)));
}
// Planets that aspect a house by their natal aspects. They count as linked to the house for timing.
function aspectersOn(ctx, s) {
  return ctx.planets.filter(q => { const asp = NATAL_ASPECTS[q.name]; return asp && q.sign !== s && asp.indexOf(houseFrom(s, q.sign)) >= 0; }).map(q => q.name);
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
// Transit targets in two frames. D1 targets are the house, the house counted from the Moon, the house lord and
// the karakas. D9 targets are the rotated D9 house (the D1 Lagna sign), the lord and the karakas in D9.
function targetsOf(ctx, P, lordSign) {
  const d1 = [P.sL, P.sM, lordSign, ctx.by[SIGN_LORD[P.sM]].sign].concat(P.karakas.map(k => ctx.by[k].sign));
  const d9 = [P.sL, ctx.by[P.lordName].navamsaSign].concat(P.karakas.map(k => ctx.by[k].navamsaSign));
  return { d1, d9 };
}
// Planets that aspect the rotated D9 house by natal aspect, counted in the D9 chart.
function aspectersOnD9(ctx, sL) {
  return ctx.planets.filter(q => { const asp = NATAL_ASPECTS[q.name]; return asp && q.navamsaSign !== sL && asp.indexOf(houseFrom(sL, q.navamsaSign)) >= 0; }).map(q => q.name);
}
function hitsTargets(ref, name, targets) {
  return targets.some(t => { const d = houseFrom(t, ref.sign); return d === 1 || TRANSIT_ASPECTS[name].indexOf(d) >= 0; });
}
function transitCheck(ctx, a0, b0, targets) {
  const N = W.transit.samples_per_window;
  let dbl = 0, jup = 0, sat = 0;
  for (let i = 0; i < N; i++) {
    const t = N === 1 ? a0 : a0 + ((b0 - a0) * i) / (N - 1);
    const tc = ctx.VC.buildChart(new Date(t), Number(ctx.cfg.lat), Number(ctx.cfg.lon), Number(ctx.cfg.tz), { ayanamshaKey: "lahiri" });
    // Double transit in the D1 chart (house, Moon house, lord, karakas) or in the D9 chart rotated from the Lagna.
    const useD9 = Array.isArray(targets.d9);
    const tc9 = useD9 ? ctx.VC.makeVargaChart(tc, 9) : null;
    const jh1 = hitsTargets(tc.planetsByName.Jupiter, "Jupiter", targets.d1);
    const sh1 = hitsTargets(tc.planetsByName.Saturn, "Saturn", targets.d1);
    const jh9 = useD9 && hitsTargets(tc9.planetsByName.Jupiter, "Jupiter", targets.d9);
    const sh9 = useD9 && hitsTargets(tc9.planetsByName.Saturn, "Saturn", targets.d9);
    const jh = jh1 || jh9, sh = sh1 || sh9;
    if (jh) jup++;
    if (sh) sat++;
    if ((jh1 && sh1) || (jh9 && sh9)) dbl++;
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
        const a0 = pd.start.getTime();   // transit is sampled across the whole pratyantardasha, not the search range
        const b0 = pd.end.getTime();
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
// Ranking score of one planet for an event. The owner rule. The strength of the planet is its power and it
// enforces its result. Its nature, the nature of its nakshatra lord and the gana nature of its nakshatra decide
// the sign of that result for the event, positive for a positive event and reversed for an adverse event.
// A nakshatra that relates to the event by its significations adds one.
function eventGroup(topicKey) { return NAKS.groups[topicKey] || topicKey; }
function planetEventValue(ctx, name, topicKey, adverse) {
  const p = ctx.by[name];
  const pol = adverse ? -1 : 1;
  const power = Math.abs(pvAt(ctx, name, p.sign, false).v);
  const nak = NAKS.nakshatras[Math.floor(modDeg(p.lon) / (360 / 27))];
  const planetFit = natureOf(ctx, name) * pol;
  const lordFit = natureOf(ctx, p.nakLord) * pol;
  const ganaFit = NAKS.gana_nature[nak.gana] * pol;
  const match = nak.events.indexOf(eventGroup(topicKey)) >= 0 ? 1 : 0;
  return round2(power * planetFit + 0.5 * lordFit + ganaFit + match);
}
function analyseTopic(ctx, topicKey, label) {
  const T = TOPICS[topicKey];
  if (T && T.anchor) return analyseRelative(ctx, topicKey, label);
  if (!T) throw new Error("Unknown topic " + topicKey + ". Known topics are " + Object.keys(TOPICS).filter(k => k[0] !== "_").join(", "));
  const P = evalPromise(ctx, T);
  const lordP = ctx.by[P.lordName];
  const occH = ctx.planets.filter(q => q.sign === P.sL).map(q => q.name);
  const occD9 = ctx.planets.filter(q => q.navamsaSign === P.sL).map(q => q.name);
  const S = timingSet(ctx, P, occH, occD9);
  const targets = targetsOf(ctx, P, lordP.sign);
  // Adverse events, such as illness or job loss, are promised by affliction, so the test is inverted.
  const adverse = T.polarity === "adverse";
  const promiseYes = adverse ? P.net < 0 : P.net > 0;
  const windows = findWindows(ctx, S, targets);
  const valid = bestWindow(windows);
  const best = valid.length ? valid[0] : null;
  const involved = best ? Array.from(new Set([best.md, best.ad, best.pd])) : [];
  const eventScore = involved.length ? round2(sum(involved.map(n => planetEventValue(ctx, n, topicKey, adverse)))) : 0;
  let decision, yes, reason;
  if (!promiseYes) { yes = false; decision = "NO"; reason = adverse ? "The affliction promise is not there, net " + fmt(P.net) + "." : "The natal promise is not there, net " + fmt(P.net) + "."; }
  else if (!best) { yes = false; decision = "NO"; reason = "The promise is there but no dasha window in the search range is validated by a double transit of Jupiter and Saturn."; }
  else { yes = true; decision = "YES"; reason = "The promise is there, and the best window is validated by a double transit of Jupiter and Saturn."; }
  const pos = P.comps.filter(c => c.contribution > 0).sort((a, b) => b.contribution - a.contribution);
  const neg = P.comps.filter(c => c.contribution < 0).sort((a, b) => a.contribution - b.contribution);
  const result = {
    label, topic: topicKey, hi: T.hi, house: P.H, lagnaSign: P.sL, moonHouseSign: P.sM, karakas: P.karakas, lord: P.lordName,
    nthHouse: P.x4, kalpurushaHouseSign: P.sK, kalpurushaLord: P.lordK, net: P.net, promiseYes,
    components: P.comps, benefic: pos, malefic: neg, detail: P.detail,
    relevantPlanets: Array.from(S), transitTargetSigns: targets.d1, transitTargetSigns9: targets.d9,
    windowsFound: windows.length, validatedWindows: valid.length, topWindows: valid.slice(0, 5),
    best, yes, decision, reason, asOf: ctx.asOf, from: ctx.from, to: ctx.to,
    adverse, involved, eventScore, hindi: null
  };
  result.hindi = hindiLine(ctx, result);
  result.score = (yes ? 1000 : 0) + eventScore;
  return result;
}
// Hindi names of planets for the astrological text. Anything not in the table is left as written.
const hiP = p => HI_PLANET[p] || p;
const absTxt = x => Math.abs(x).toFixed(2);
const signTxt = x => (x < 0 ? "minus " : "") + Math.abs(x).toFixed(2);
// Astrological Hindi sentence. House, lord, karakas, planets in the house, the dasha of the window and the
// transit support all come from the chart, so the sentence states the reason for the answer.
function hindiLine(ctx, r) {
  const occ = ctx.planets.filter(q => q.sign === r.lagnaSign).map(q => hiP(q.name));
  const occTxt = occ.length ? `भाव ${r.house} में ${occ.join(" और ")}` : `भाव ${r.house} खाली है`;
  const kTxt = r.karakas.map(hiP).join(" और ");
  const strength = `${r.adverse ? "पाप वचन" : "शुभ वचन"} का बल ${absTxt(r.net)} है और ${r.promiseYes ? "वचन मौजूद है" : "वचन अनुपस्थित है"}`;
  const dasha = r.best
    ? `${hiP(r.best.md)} महादशा, ${hiP(r.best.ad)} अंतरदशा और ${hiP(r.best.pd)} प्रत्यंतरदशा में गोचर से गुरु और शनि का दोहरा ${r.best.grade === "A" ? "पूरा" : "आंशिक"} समर्थन`
    : "किसी मान्य दशा में गोचर का दोहरा समर्थन नहीं मिलता";
  const end = r.yes && r.best
    ? `अतः निर्णय हाँ है, समय ${fmtDate(r.best.start)} से ${fmtDate(r.best.end)} तक`
    : (r.adverse ? "अतः निर्णय नहीं है, यह घटना इस समय के योग से नहीं बनती" : "अतः निर्णय नहीं है");
  return `${r.hi} का भाव ${r.house}, उसका स्वामी ${hiP(r.lord)}, कारक ${kTxt}, ${occTxt}। ${strength}। ${dasha}। ${end}।`;
}

// ---- life area quality. Afflictions, event evidence and outcome, for any topic --------------------
// The owner's rule. When the promise is present and past or present dasha and transit windows show that
// the event has happened, the afflictions of the house decide the quality of the outcome.
//   positive    light afflictions, the situation is happy and stable
//   challenged  real afflictions, the situation holds but is stressful
//   separated   strong afflictions, and they are active in the dasha of the afflicting planets
//   severe      very strong afflictions, active in the dasha, that end the situation, such as divorce
// Afflictions are the malefic points of the promise plus markers from the house, the lord and the karakas.
// Activation counts validated windows after the event date whose dasha lords are afflicting planets.
// The thresholds live in data/weights.json under quality and are provisional until the owner sets them.
const STATE_ORDER = ["positive", "challenged", "separated", "severe"];
const STATE_TEXT = {
  positive: "The afflictions are light, so the state is positive and stable.",
  challenged: "The afflictions are real but the situation holds, so the state is challenged.",
  separated: "Strong afflictions are active in the dasha of the afflicting planets, so the state is separation.",
  severe: "Very strong afflictions are active in the dasha of the afflicting planets, so the state is severe and ends the situation."
};
function addYears(d, n) { return new Date(Date.UTC(d.getUTCFullYear() + n, d.getUTCMonth(), d.getUTCDate())); }
function afflictionProfile(ctx, P) {
  const q = W.quality;
  const d1 = P.detail.c1_house_lagna;
  const lord = P.detail.c4_lord_lagna;
  const afflicters = new Set();
  const markers = [];
  d1.occ.forEach(o => {
    if (natureOf(ctx, o.name) < 0) afflicters.add(o.name);
    if (o.name === "Rahu" || o.name === "Ketu") markers.push(o.name + " sits in house " + P.H);
  });
  (P.detail.c2_house_d9_rotated || []).forEach(o => { if (o.v < 0) afflicters.add(o.name); });
  // Malefic aspects and malefic occupants of the house in the Moon chart also afflict it.
  d1.asp.list.forEach(a => { if (a.v < 0) { afflicters.add(a.name); markers.push(a.name + " aspects house " + P.H); } });
  const m3 = P.detail.c3_house_moon;
  m3.occ.forEach(o => { if (o.v < 0) afflicters.add(o.name); });
  m3.asp.list.forEach(a => { if (a.v < 0) afflicters.add(a.name); });
  if (d1.kar.score < 0) markers.push(d1.kar.kind + " on house " + P.H);
  if (DUSTHANA.indexOf(lord.d) >= 0) markers.push("lord " + lord.name + " is in house " + lord.d + " from house " + P.H);
  if (lord.cond.dignity === "debilitated") markers.push("lord " + lord.name + " is debilitated");
  if (ctx.by[lord.name].combust) markers.push("lord " + lord.name + " is combust");
  if (lord.total < 0) afflicters.add(lord.name);
  if (P.detail.c5_lord_d9_rotated.total < 0) markers.push("lord " + lord.name + " is weak in D9");
  P.detail.c6_karaka_lagna.forEach(k => {
    if (k.total < 0) { markers.push("karaka " + k.name + " is afflicted"); afflicters.add(k.name); }
  });
  const A = round2(-sum(P.comps.filter(c => c.contribution < 0).map(c => c.contribution)));
  const points = round2(A + q.marker_weight * markers.length);
  const pct = round2(100 * points / P.weightSum);
  return { A, markers, afflicters: Array.from(afflicters), points, pct };
}
function classifyQuality(happened, pct, activated, q) {
  if (!happened) return "NOT SHOWN";
  if (pct < q.mild_percent) return "positive";
  if (activated >= 1 && pct >= q.very_severe_percent) return "severe";
  if (activated >= 1 && pct >= q.severe_percent) return "separated";
  return "challenged";
}
function qualityAnalysis(ctx, topicKey, options) {
  const T = TOPICS[topicKey];
  if (!T) throw new Error("Unknown topic " + topicKey + ". Known topics are " + Object.keys(TOPICS).filter(k => k[0] !== "_").join(", "));
  const q = W.quality;
  const P = evalPromise(ctx, T);
  const lordP = ctx.by[P.lordName];
  const occH = ctx.planets.filter(x => x.sign === P.sL).map(x => x.name);
  const occD9 = ctx.planets.filter(x => x.navamsaSign === P.sL).map(x => x.name);
  const S = timingSet(ctx, P, occH, occD9);
  const targets = targetsOf(ctx, P, lordP.sign);
  const aff = afflictionProfile(ctx, P);
  const windows = findWindows(ctx, S, targets);
  const validated = windows.filter(w => w.validated).sort((a, b) => a.start - b.start);
  // Activation looks at the afflicting planets too, which may lie outside the promise set.
  const Sa = new Set(Array.from(S).concat(aff.afflicters));
  const windowsA = findWindows(ctx, Sa, targets);
  const validatedA = windowsA.filter(w => w.validated).sort((a, b) => a.start - b.start);
  const promiseYes = P.net > 0;
  const minEvent = addYears(parseDay(ctx.cfg.date), q.event_min_age_years);
  const eventWins = validated.filter(w => w.status !== "FUTURE" && w.start >= minEvent && w.dashaCount >= q.event_min_dasha_count);
  const presumed = !!(ctx.cfg && ctx.cfg.eventPresumed);
  const event = presumed ? { presumed: true, start: null } : (promiseYes && eventWins.length ? eventWins[0] : null);
  // Prevailing activation. Validated windows in the lookback before as of, after the event, where at least
  // activation_min_dasha_count of the mahadasha, antardasha and pratyantardasha lords are afflicting planets.
  const lookbackFrom = addYears(ctx.asOf, -q.activation_lookback_years);
  const activeFrom = event && event.start > lookbackFrom ? event.start : lookbackFrom;
  const active = event ? validatedA.filter(w => w.start >= activeFrom && w.start <= ctx.asOf && w.status !== "FUTURE" &&
    [w.md, w.ad, w.pd].filter(l => aff.afflicters.indexOf(l) >= 0).length >= q.activation_min_dasha_count) : [];
  const outcome = classifyQuality(!!event, aff.pct, active.length, q);
  const tagged = options.filter(o => o.state);
  let chosen = null, closestUsed = false;
  if (outcome !== "NOT SHOWN" && tagged.length) {
    chosen = tagged.find(o => o.state === outcome) || null;
    if (!chosen) {
      const target = STATE_ORDER.indexOf(outcome);
      chosen = tagged.slice().sort((a, b) => Math.abs(STATE_ORDER.indexOf(a.state) - target) - Math.abs(STATE_ORDER.indexOf(b.state) - target))[0];
      closestUsed = true;
    }
  }
  const benefic = P.comps.filter(c => c.contribution > 0).sort((a, b) => b.contribution - a.contribution);
  const malefic = P.comps.filter(c => c.contribution < 0).sort((a, b) => a.contribution - b.contribution);
  const res = {
    topic: topicKey, hi: T.hi, house: P.H, lord: P.lordName, karakas: P.karakas, net: P.net, promiseYes,
    components: P.comps, benefic, malefic, detail: P.detail,
    relevantPlanets: Array.from(S), windowsFound: windows.length, validatedWindows: validated.length,
    event, activeWindows: active, affliction: aff, outcome, outcomeText: STATE_TEXT[outcome] || null,
    options: tagged.map(o => ({ label: o.label, state: o.state })), chosen, closestUsed,
    thresholds: { mild_percent: q.mild_percent, severe_percent: q.severe_percent, very_severe_percent: q.very_severe_percent }
  };
  const affTxt = aff.afflicters.length ? aff.afflicters.map(hiP).join(" और ") : "कोई पाप ग्रह नहीं";
  const parts = [];
  parts.push(`${T.hi} का भाव ${P.H}, उसका स्वामी ${hiP(P.lordName)}, कारक ${P.karakas.map(hiP).join(" और ")}`);
  parts.push(`${promiseYes ? "शुभ वचन मौजूद है" : "शुभ वचन अनुपस्थित है"}, भाव पर पाप प्रभाव ${affTxt}, कष्ट ${aff.pct} प्रतिशत`);
  parts.push(event && event.presumed ? "विवाह का तथ्य प्रश्न में दिया गया है, इसलिए वचन की जाँच नहीं होती" : event
    ? `${hiP(event.md)} महादशा, ${hiP(event.ad)} अंतरदशा और ${hiP(event.pd)} प्रत्यंतरदशा में ${fmtDate(event.start)} से घटना के संकेत मिलते हैं`
    : "दशा और गोचर में घटना के संकेत नहीं मिलते");
  parts.push(`${q.activation_lookback_years} वर्ष में पाप ग्रह की सक्रिय दशा ${active.length}`);
  parts.push(outcome === "NOT SHOWN" ? "अतः स्थिति का निर्णय नहीं हो सकता" : `अतः स्थिति ${OUTCOME_HI[outcome]} है`);
  res.hindi = parts.join("। ") + "।";
  return res;
}
function renderQuality(res) {
  const r = res.quality;
  const q = W.quality;
  const L = [];
  const hm = String(res.time).split(":");
  L.push(`GOAT ENGINE QUALITY REPORT for ${res.name}`);
  L.push(`Gender ${res.gender}, born ${fmtDate(new Date(res.birth + "T00:00:00Z"))} at ${hm[0]}h${hm[1]} local time, ${res.place}.`);
  L.push(`Lagna is sign index ${res.lagnaSign} and Moon sign index ${res.moonSign} in the VedNetra chart.`);
  L.push(`As of ${fmtDate(res.asOf)}. History scan from ${fmtDate(res.from)} to ${fmtDate(res.to)}.`);
  L.push("");
  L.push(`Topic ${r.topic}, house ${r.house} from Lagna, lord ${r.lord}, karakas ${r.karakas.join(" and ")}.`);
  L.push("");
  L.push("STEP 1. Promise. Benefic points first, then malefic points.");
  r.benefic.forEach(c => L.push(`  Benefic ${c.id} weight ${c.weight} gives ${fmt(c.contribution)}.`));
  r.malefic.forEach(c => L.push(`  Malefic ${c.id} weight ${c.weight} gives ${fmt(c.contribution)}.`));
  L.push(`  Promise net ${fmt(r.net)}, so the promise is ${r.promiseYes ? "PRESENT" : "ABSENT"}.`);
  L.push("");
  L.push(`STEP 2. Event evidence. A validated window in the past or now, with at least ${q.event_min_dasha_count} relevant dasha lords.`);
  if (r.event && r.event.presumed) {
    L.push("  Event presumed by the question, so the promise is not tested.");
  } else if (r.event) {
    const e = r.event;
    L.push(`  Event indicated from ${fmtDate(e.start)} to ${fmtDate(e.end)}, dasha ${e.md} Mahadasha ${e.ad} Antardasha ${e.pd} Pratyantardasha, dasha count ${e.dashaCount} of 3, transit grade ${e.grade}, time ${e.status}.`);
  } else {
    L.push("  No validated past or present window with the required dasha count. The event is not shown.");
  }
  L.push("");
  L.push("STEP 3. Afflictions of the house, the lord and the karakas.");
  L.push(`  Malefic points total ${r.affliction.A}.`);
  if (r.affliction.markers.length) r.affliction.markers.forEach(m => L.push("  Marker " + m + "."));
  else L.push("  No affliction marker.");
  L.push(`  Afflicting planets ${r.affliction.afflicters.join(", ") || "none"}.`);
  L.push(`  Severity points ${r.affliction.points}, which is ${r.affliction.pct} percent of the full weight.`);
  L.push(`  Thresholds, mild below ${q.mild_percent} percent, severe from ${q.severe_percent} percent, very severe from ${q.very_severe_percent} percent.`);
  L.push("");
  L.push("STEP 4. Activation after the event. Validated windows where an afflicting planet is a dasha lord.");
  L.push(`  Lookback ${q.activation_lookback_years} years before as of, at least ${q.activation_min_dasha_count} afflicting dasha lords. Windows found ${r.activeWindows.length}.`);
  if (r.activeWindows.length) {
    r.activeWindows.slice(0, 10).forEach((w, i) => L.push(`  ${i + 1}. ${fmtDate(w.start)} to ${fmtDate(w.end)}, dasha ${w.md} Mahadasha ${w.ad} Antardasha ${w.pd} Pratyantardasha, transit grade ${w.grade}, time ${w.status}.`));
    if (r.activeWindows.length > 10) L.push(`  And ${r.activeWindows.length - 10} more.`);
  } else {
    L.push("  None.");
  }
  L.push("");
  L.push("STEP 5. Outcome.");
  L.push(`  Outcome ${r.outcome}. ${r.outcomeText || "The event is not shown, so no quality outcome is given."}`);
  L.push(`  Event search starts only after the native is ${q.event_min_age_years} years old.`);
  L.push("");
  L.push("DEFINITIVE FINAL ANSWER");
  if (r.chosen) {
    L.push(`Chosen option ${r.chosen.label}, state ${r.chosen.state}.${r.closestUsed ? " No option carries the outcome state, so the closest state is chosen." : ""}`);
  } else {
    L.push("NO ANSWER. The event is not shown, so no option is chosen.");
  }
  L.push("Hindi one liner.");
  L.push(r.hindi);
  L.push("");
  L.push("HINDI SUMMARY");
  hindiSummaryLines(res).forEach(l => L.push(l));
  return plain(L.join("\n"));
}

// ---- ordinal, count and type rules --------------------------------------------------------------
// Ordinal (education level). The more auspicious the promise, the higher the degree on the option list.
// Count (siblings). The more auspicious the promise, the larger the total. The gender balance of the
// planets forming the promise splits the total into brothers and sisters.
// Type (property). The planet that is strongest in the promise decides the kind of thing.
// The stream, the gender and the kind come from the planets, as the owner asked.
const NUMBER_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
function parseSiblings(label) {
  const t = String(label).toLowerCase();
  if (/only child|no sibling|none/.test(t)) return { brothers: 0, sisters: 0, total: 0 };
  const num = s => (/^\d+$/.test(s) ? Number(s) : (NUMBER_WORDS[s] || 0));
  const b = t.match(/(\d+|[a-z]+)\s+brothers?\b/);
  const s = t.match(/(\d+|[a-z]+)\s+sisters?\b/);
  const brothers = b ? num(b[1]) : 0;
  const sisters = s ? num(s[1]) : 0;
  return { brothers, sisters, total: brothers + sisters };
}
function ruleAnalysis(ctx, topicKey, options) {
  const T = TOPICS[topicKey];
  const P = evalPromise(ctx, T);
  const strength = Math.max(-1, Math.min(1, P.net / W.rule.net_scale));
  const pos = (strength + 1) / 2;
  const sigSet = Array.from(new Set([P.lordName].concat(ctx.planets.filter(q => q.sign === P.sL).map(q => q.name), P.karakas)));
  const pvOf = {};
  ctx.planets.forEach(q => { pvOf[q.name] = pvAt(ctx, q.name, q.sign, false).v; });
  const strongest = sigSet.slice().sort((a, b) => pvOf[b] - pvOf[a])[0];
  const out = { rule: T.rule, topic: topicKey, hi: T.hi, net: P.net, strength: round2(strength), relevant: sigSet, pvOf, strongest, lines: [] };
  if (T.rule === "ordinal") {
    const n = options.length;
    const idx = Math.round(pos * (n - 1));
    out.chosen = { label: options[idx].label };
    out.index = idx + 1;
    out.of = n;
    out.stream = TYPES.stream[strongest];
    out.lines.push(`Strength ${fmt(strength)} on the scale puts the native at level ${idx + 1} of ${n} on the option list, where higher means a higher degree.`);
    out.lines.push(`The strongest promise planet is ${strongest}, so the field of study points to ${out.stream}.`);
  } else if (T.rule === "count") {
    const parsed = options.map(o => Object.assign({ label: o.label }, parseSiblings(o.label)));
    const maxT = Math.max(...parsed.map(p => p.total));
    const total = Math.round(pos * maxT);
    let male = 0, female = 0; const maleP = [], femaleP = [];
    sigSet.forEach(n => {
      const g = TYPES.gender[n];
      if (g === "male") { male += pvOf[n]; maleP.push(n); }
      if (g === "female") { female += pvOf[n]; femaleP.push(n); }
    });
    const ratio = (male - female) / ((Math.abs(male) + Math.abs(female)) || 1);
    const tb = Math.round(total * ((ratio + 1) / 2));
    const ts = total - tb;
    const dist = p => Math.abs(p.brothers - tb) + Math.abs(p.sisters - ts);
    const best = parsed.slice().sort((a, b) => (dist(a) - dist(b)) || (Math.abs(a.total - total) - Math.abs(b.total - total)))[0];
    out.chosen = { label: best.label };
    out.total = total; out.brothersTarget = tb; out.sistersTarget = ts; out.ratio = round2(ratio);
    out.lines.push(`Strength ${fmt(strength)} gives a sibling total of ${total} on the option list.`);
    out.lines.push(`Male promise planets ${maleP.join(", ") || "none"} and female promise planets ${femaleP.join(", ") || "none"} give a brothers share of ${(100 * (ratio + 1) / 2).toFixed(0)} percent, so about ${tb} brothers and ${ts} sisters.`);
  } else if (T.rule === "type") {
    const hit = options.find(o => o.planet === strongest);
    const tagged = options.filter(o => o.planet).sort((a, b) => pvOf[b.planet] - pvOf[a.planet]);
    out.chosen = { label: (hit || tagged[0] || options[0]).label };
    out.propertyType = TYPES.propertyType[strongest];
    out.lines.push(hit ? `The strongest promise planet ${strongest} matches option ${hit.label}.` : `No option is tagged with ${strongest}, so the option tagged with the strongest planet among the options is closest.`);
    out.lines.push(`The strongest promise planet is ${strongest}, which points to ${out.propertyType}.`);
  } else if (T.rule === "occupation") {
    // Occupation. The 10th house and its lord, with Saturn and the Sun as karakas, decide the field of work.
    // Each option kind scores by the natal condition of its planets, plus the planets that are active in the
    // current dasha. When no career dasha is active and the 10th house promise is negative, the unemployed
    // option is chosen. The kinds and the rule are in data/types.json and are provisional.
    const targets = targetsOf(ctx, P, ctx.by[P.lordName].sign);
    const winsC = findWindows(ctx, new Set(sigSet), targets);
    const validC = winsC.filter(w => w.validated && w.dashaCount >= W.quality.event_min_dasha_count);
    const careerNow = validC.filter(w => w.status === "NOW");
    const careerPast = validC.filter(w => w.status === "PAST");
    const activeLords = new Set(careerNow.reduce((a, w) => a.concat([w.md, w.ad, w.pd]), []));
    const pastLords = new Set(careerPast.reduce((a, w) => a.concat([w.md, w.ad, w.pd]), []));
    const kindScore = {};
    Object.keys(TYPES.occupationKinds).forEach(k => {
      const combo = TYPES.occupationKinds[k];
      const ps = combo.planets;
      const base = comboScore(ctx, combo);
      kindScore[k] = round2(base + (ps.some(p => activeLords.has(p)) ? 1 : 0) + (ps.some(p => pastLords.has(p)) ? 0.5 : 0));
    });
    const unemployedOpt = options.find(o => o.kind === "unemployed");
    const noCareerNow = careerNow.length === 0;
    let chosenOpt;
    if (noCareerNow && P.net < 0 && unemployedOpt) {
      chosenOpt = unemployedOpt;
      out.occupationReason = "no career dasha is active now and the 10th house promise is negative, so the unemployed option is chosen";
    } else {
      const kindOpts = options.filter(o => o.kind && TYPES.occupationKinds[o.kind]);
      kindOpts.sort((a, b) => kindScore[b.kind] - kindScore[a.kind]);
      chosenOpt = kindOpts[0] || unemployedOpt || options[0];
      out.occupationReason = "the best scoring kind of work, from its planets in the chart and in the active career dasha";
    }
    out.chosen = { label: chosenOpt.label, kind: chosenOpt.kind || null };
    out.kindScore = kindScore;
    out.careerNow = careerNow.length;
    out.careerPast = careerPast.length;
    out.lines.push(`Career dasha windows now ${careerNow.length}, in the past ${careerPast.length}, with at least ${W.quality.event_min_dasha_count} career lords.`);
    out.lines.push(`Kind scores ${Object.keys(kindScore).map(k => k + " " + (kindScore[k] < 0 ? "minus " : "") + Math.abs(kindScore[k]).toFixed(2)).join(", ")}.`);
    out.lines.push(`Rule. ${out.occupationReason}.`);
  } else {
    throw new Error("Topic " + topicKey + " has no ordinal, count, type or occupation rule");
  }
  out.hindi = ruleHindi(ctx, out, P, pvOf, strongest, sigSet);
  return out;
}
// Astrological Hindi sentence for a rule answer. It names the planets that decide the answer.
function ruleHindi(ctx, r, P, pvOf, strongest, sigSet) {
  const kTxt = r.relevant.map(hiP).join(", ");
  const head = `${r.hi} के लिए भाव ${P.H}, उसका स्वामी ${hiP(P.lordName)}, कारक ${P.karakas.map(hiP).join(" और ")}, संबंधित ग्रह ${kTxt}`;
  if (r.rule === "ordinal") {
    return `${head}। सबसे बलवान कारक ${hiP(strongest)} है और वचन का बल ${absTxt(r.net)}, इसलिए स्तर ${r.index} में से ${r.of} और क्षेत्र ${r.stream}। अतः विकल्प ${r.chosen.label} चुना गया।`;
  }
  if (r.rule === "count") {
    return `${head}। वचन का बल ${absTxt(r.net)}, कुल ${r.total}, भाई ${r.brothersTarget} और बहन ${r.sistersTarget}। अतः विकल्प ${r.chosen.label} चुना गया।`;
  }
  if (r.rule === "type") {
    return `${head}। सबसे बलवान कारक ${hiP(strongest)} है, इसलिए संपत्ति का प्रकार ${r.propertyType}। अतः विकल्प ${r.chosen.label} चुना गया।`;
  }
  // occupation
  const now = r.careerNow > 0 ? `वर्तमान में ${r.careerNow} कर्म दशा सक्रिय है` : "वर्तमान में कोई कर्म दशा सक्रिय नहीं है";
  const sc = Object.keys(r.kindScore).map(k => `${TYPES.occupationKindHi[k] || k} ${signTxt(r.kindScore[k])}`).join(", ");
  const why = r.chosen.kind === "unemployed"
    ? "कोई कर्म दशा सक्रिय न होने और दसवें भाव के नकारात्मक वचन के कारण बेरोजगारी का योग बनता है, भले ही कुछ कर्म ग्रहों का स्कोर अधिक हो"
    : "सबसे अधिक स्कोर वाले कर्म के ग्रहों के बल और सक्रिय कर्म दशा के कारण";
  return `${head}। ${now}, वचन का बल ${absTxt(r.net)}। व्यवसाय के स्कोर ${sc}। ${why}, अतः विकल्प ${r.chosen.label} चुना गया।`;
}
function renderRule(res) {
  const r = res.rule;
  const L = [];
  const hm = String(res.time).split(":");
  L.push(`GOAT ENGINE REPORT for ${res.name}`);
  L.push(`Gender ${res.gender}, born ${fmtDate(new Date(res.birth + "T00:00:00Z"))} at ${hm[0]}h${hm[1]} local time, ${res.place}.`);
  L.push(`Lagna is sign index ${res.lagnaSign} and Moon sign index ${res.moonSign} in the VedNetra chart.`);
  L.push(`Topic ${r.topic} with the ${r.rule} rule. Promise net ${fmt(r.net)}, strength ${fmt(r.strength)} on a scale from minus 1 to plus 1.`);
  L.push("");
  L.push("STEP 1 AND 2. Promise and relevant planets.");
  L.push(`  Relevant planets are ${r.relevant.join(", ")}. The strongest is ${r.strongest}.`);
  r.lines.forEach(l => L.push("  " + l));
  L.push("");
  L.push("FINAL ANSWER");
  L.push(`Chosen option ${r.chosen.label}. This is the closest option by the rule, because the rule always selects one option from the list.`);
  L.push("Hindi one liner.");
  L.push(r.hindi);
  L.push("");
  L.push("HINDI SUMMARY");
  hindiSummaryLines(res).forEach(l => L.push(l));
  return plain(L.join("\n"));
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
  const qualityMode = cfg.mode === "quality" || (cfg.options || []).some(o => o.state);
  if (qualityMode) {
    if (!TOPICS[cfg.topic]) throw new Error("Quality mode needs a topic key from data/topics.json");
    if (!cfg.options || !cfg.options.length) throw new Error("Quality mode needs an options list with state tags");
    ctx.from = parseDay(cfg.historyFromISO) || parseDay(cfg.date);
    return { mode: "quality", name: cfg.name || "Native", gender: cfg.gender || "unspecified", place: cfg.place || "",
      birth: cfg.date, time: cfg.time, asOf, from: ctx.from, to: ctx.to, lagnaSign: ctx.lagna, moonSign: ctx.moon,
      quality: qualityAnalysis(ctx, cfg.topic, cfg.options) };
  }
  const T0 = TOPICS[cfg.topic];
  if (T0 && T0.rule && T0.rule !== "yes_no") {
    if (!cfg.options || !cfg.options.length) throw new Error("Topic " + cfg.topic + " needs an options list");
    return { mode: "rule", name: cfg.name || "Native", gender: cfg.gender || "unspecified", place: cfg.place || "",
      birth: cfg.date, time: cfg.time, asOf, from: ctx.from, to: ctx.to, lagnaSign: ctx.lagna, moonSign: ctx.moon,
      rule: ruleAnalysis(ctx, cfg.topic, cfg.options) };
  }
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
// ---- relatives. The D1 chart rotated to the relative's anchor house. Rule kept in weights.json under relatives ----
// Only the D1 chart is used. The D9 chart and the Moon chart are not used for any relative. Only the prevailing
// windows, validated and active on the as of date, decide the answer. The rotated house r is the native house
// anchor plus r minus 2, wrapped to 1 to 12, so the anchor house is rotated 1.
function relNativeHouse(anchor, r) { return ((anchor + r - 2) % 12) + 1; }
function relCtx(ctx, anchor) { return Object.assign(Object.create(ctx), { lagna: signAtHouse(ctx.lagna, anchor) }); }
function relPromise(rctx, T) {
  const H = T.house;
  const sH = signAtHouse(rctx.lagna, H);
  const lordName = SIGN_LORD[sH];
  const karakas = T.karaka.any;
  const c1 = evalD1House(rctx, sH);
  const c4 = evalPlanetFromHouse(rctx, lordName, sH);
  const kEval = karakas.map(k => evalPlanetFromHouse(rctx, k, sH));
  const x4 = ((H + H - 2) % 12) + 1;
  const s4 = signAtHouse(rctx.lagna, x4);
  const c8 = round2(evalD1House(rctx, s4).total + evalPlanetFromHouse(rctx, SIGN_LORD[s4], s4).total);
  const sK = mod12(H - 1);
  const c9 = round2(evalD1House(rctx, sK).total + evalPlanetFromHouse(rctx, SIGN_LORD[sK], sK).total);
  const avg = a => (a.length ? sum(a) / a.length : 0);
  const raw = { c1_house_lagna: c1.total, c4_lord_lagna: c4.total, c6_karaka_lagna: round2(avg(kEval.map(x => x.total))), c8_nth_house: c8, c9_kalpurusha_house: c9 };
  const comps = Object.keys(raw).map(id => { const w = W.weights[id]; return { id, weight: w, raw: round2(raw[id]), contribution: round2(w * Math.tanh(raw[id] / 2)) }; });
  const net = round2(sum(comps.map(c => c.contribution)));
  return { H, sH, lordName, karakas, comps, net, detail: { c1_house_lagna: c1, c4_lord_lagna: c4, c6_karaka_lagna: kEval, x4, s4, sK } };
}
function analyseRelative(ctx, topicKey, label) {
  const T = TOPICS[topicKey];
  const anchor = T.anchor;
  const rctx = relCtx(ctx, anchor);
  const P = relPromise(rctx, T);
  const adverse = T.polarity === "adverse";
  const promiseYes = adverse ? P.net < 0 : P.net > 0;
  const occH = ctx.planets.filter(q => q.sign === P.sH).map(q => q.name);
  const S = new Set([P.lordName].concat(occH, P.karakas, aspectersOn(rctx, P.sH)));
  const targets = { d1: [P.sH, ctx.by[P.lordName].sign].concat(P.karakas.map(k => ctx.by[k].sign)), d9: null };
  const windows = findWindows(rctx, S, targets);
  const now = windows.filter(w => w.validated && w.status === "NOW" && w.dashaCount >= W.relatives.min_dasha_count).sort((a, b) => b.dashaCount - a.dashaCount || (a.start - b.start));
  const best = now.length ? now[0] : null;
  const yes = promiseYes && !!best;
  const involved = best ? Array.from(new Set([best.md, best.ad, best.pd])) : [];
  const eventScore = involved.length ? round2(sum(involved.map(n => planetEventValue(rctx, n, topicKey, adverse)))) : 0;
  const decision = yes ? "YES" : "NO";
  const reason = !promiseYes
    ? (adverse ? "The affliction promise in the rotated chart is not there, net " + fmt(P.net) + "." : "The promise in the rotated chart is not there, net " + fmt(P.net) + ".")
    : (best ? "The promise is there and a prevailing window with at least " + W.relatives.min_dasha_count + " relevant dasha lords is validated by a double transit of Jupiter and Saturn." : "The promise is there but no prevailing window with the required dasha count is validated by a double transit.");
  const hi = (x) => hiP(x);
  const dashaTxt = best ? `${hi(best.md)} महादशा, ${hi(best.ad)} अंतरदशा और ${hi(best.pd)} प्रत्यंतरदशा` : "";
  const hindi = `${T.hi} के लिए भाई का भाव ${anchor} लग्न माना गया, घुमाया गया भाव ${P.H} का स्वामी ${hi(P.lordName)}, कारक ${P.karakas.map(hi).join(" और ")}। ${adverse ? "पाप वचन" : "शुभ वचन"} का बल ${signTxt(P.net)}, ${promiseYes ? "वचन मौजूद है" : "वचन अनुपस्थित है"}। ${best ? `अभी की दशा ${dashaTxt} में गोचर का दोहरा समर्थन है` : "अभी की दशा में गोचर का दोहरा समर्थन नहीं है"}। अतः निर्णय ${yes ? "हाँ" : "नहीं"} है।`;
  return {
    label, topic: topicKey, hi: T.hi, relative: true, anchor, house: P.H, nativeHouse: relNativeHouse(anchor, P.H),
    lagnaSign: rctx.lagna, lord: P.lordName, karakas: P.karakas, net: P.net, promiseYes, adverse,
    components: P.comps, detail: P.detail, usesD9: false, usesMoon: false,
    relevantPlanets: Array.from(S), transitTargetSigns: targets.d1, windowsFound: windows.length,
    validatedWindows: now.length, topWindows: now.slice(0, 5), best, yes, decision, reason,
    involved, eventScore, asOf: ctx.asOf, from: ctx.from, to: ctx.to, hindi,
    score: (yes ? 1000 : 0) + eventScore
  };
}
// Combination score. Planets of a kind, their strength, their placement in the combination houses and their
// lordship of those houses. Used for occupation kinds, and for any life area once its combination is in data.
function comboScore(ctx, combo) {
  let s = 0;
  combo.planets.forEach(name => {
    const p = ctx.by[name];
    s += pvAt(ctx, name, p.sign, false).v;
    combo.houses.forEach(h => {
      if (houseFrom(p.sign, ctx.lagna) === h) s += 1;
      if (SIGN_LORD[signAtHouse(ctx.lagna, h)] === name) s += 1;
    });
  });
  return round2(s / combo.planets.length);
}
function renderRelativeResult(r, idx) {
  const L = [];
  L.push(`${idx === undefined ? "" : idx + 1 + ". "}Option ${r.label}`);
  L.push(`Relative brother. Native chart rotated to anchor house ${r.anchor}, so rotated house ${r.house} is native house ${r.nativeHouse}. Rotated lord ${r.lord}, karakas ${r.karakas.join(" and ")}.`);
  L.push("");
  L.push("STEP 1. Promise in the rotated D1 chart only. The D9 chart and the Moon chart are not used.");
  r.components.forEach(c => L.push(`  ${c.id} weight ${c.weight} gives ${fmt(c.contribution)}.`));
  L.push(`  Promise net ${fmt(r.net)}, so the promise is ${r.promiseYes ? "PRESENT" : "ABSENT"}.`);
  L.push("");
  L.push("STEP 2. Prevailing windows only. Validated windows active on the as of date.");
  if (r.best) {
    const b = r.best;
    L.push(`  Prevailing ${fmtDate(b.start)} to ${fmtDate(b.end)}, dasha ${b.md} Mahadasha ${b.ad} Antardasha ${b.pd} Pratyantardasha, dasha count ${b.dashaCount} of 3, transit grade ${b.grade}, double transit in ${b.double} of 5 samples.`);
  } else {
    L.push("  No prevailing window is validated by a double transit.");
  }
  L.push("");
  L.push("STEP 3. Final answer for this option.");
  L.push(`  ${r.decision}. ${r.reason}`);
  L.push("");
  L.push("Hindi one liner.");
  L.push(r.hindi);
  return L.join("\n");
}
function renderResult(r, idx) {
  if (r.relative) return renderRelativeResult(r, idx);
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
// One line in Hindi for each answer finalized by the engine. Used at the end of every report and in --json.
const OUTCOME_HI = { positive: "सुखी और स्थिर", challenged: "तनावपूर्ण पर साथ रहना", separated: "अलग रहना", severe: "टूटन या तलाक", "NOT SHOWN": "घटना नहीं दिखती" };
function hindiSummaryLines(res) {
  const out = [];
  if (res.mode === "quality") {
    const r = res.quality;
    out.push(r.hindi);
  } else if (res.mode === "rule") {
    out.push(res.rule.hindi);
  } else {
    const list = res.mode === "options" ? res.results : [res.chosen];
    list.forEach(r => out.push(r.hindi));
  }
  return out;
}
function renderRun(res) {
  if (res.mode === "rule") return renderRule(res);
  if (res.mode === "quality") return renderQuality(res);
  const L = [];
  L.push(`GOAT ENGINE REPORT for ${res.name}`);
  const hm = String(res.time).split(":");
  L.push(`Gender ${res.gender}, born ${fmtDate(new Date(res.birth + "T00:00:00Z"))} at ${hm[0]}h${hm[1]} local time, ${res.place}.`);
  L.push(`Lagna is sign index ${res.lagnaSign} and Moon sign index ${res.moonSign} in the VedNetra chart.`);
  L.push(`As of ${fmtDate(res.asOf)}. Search range ${fmtDate(res.from)} to ${fmtDate(res.to)}.`);
  L.push("");
  if (res.mode === "options") {
    L.push("Options ranked by the engine. The top option is the definitive answer.");
    res.results.forEach((r, i) => L.push(`  ${i + 1}. ${r.label}, decision ${r.decision}, event score ${fmt(r.eventScore)}, involved ${r.involved.join(" ")}, best window ${r.best ? fmtDate(r.best.start) + " to " + fmtDate(r.best.end) : "none"}.`));
    L.push("");
  }
  res.results.forEach((r, i) => { L.push(renderResult(r, res.mode === "options" ? i : undefined)); L.push(""); });
  const c = res.chosen;
  L.push("DEFINITIVE FINAL ANSWER");
  if (res.mode === "options") {
    const closest = c.decision === "NO" ? " No option is promised in the range, so this is the closest option." : "";
    L.push(`Chosen option ${c.label}. ${c.decision}.${closest}`);
  } else {
    L.push(`${c.decision}.`);
  }
  L.push(c.reason);
  L.push("");
  L.push("HINDI SUMMARY");
  hindiSummaryLines(res).forEach(l => L.push(l));
  return plain(L.join("\n"));
}

module.exports = { run, renderRun, renderRule, renderQuality, plain, analyseTopic, ruleAnalysis, qualityAnalysis, afflictionProfile, classifyQuality, parseSiblings, makeContext, natureOf, houseFrom, signAtHouse, mod12, SIGN_LORD, placeD9, bestWindow, TOPICS, W };

// Command line. Use --file for the config so that no shell quoting is needed on Windows, macOS, Linux or a
// phone terminal. Use --out to write the report as UTF-8 so that Hindi text is kept intact on any console.
//   node goat_engine/tools/goat.js --file goat_engine/examples/marriage_female.json [--json] [--out report.txt]
function readConfig(argv) {
  const fi = argv.indexOf("--file");
  if (fi >= 0) {
    const file = path.resolve(process.cwd(), argv[fi + 1] || "");
    if (!argv[fi + 1] || !fs.existsSync(file)) throw new Error("Config file not found, give the path after --file");
    return JSON.parse(fs.readFileSync(file, "utf8").replace(/^﻿/, ""));
  }
  const inline = argv.find(a => a.trim().startsWith("{"));
  if (inline) return JSON.parse(inline);
  throw new Error("Give a config with --file path or as a JSON string. See goat_engine/README.md");
}
function toPlainJson(obj) {
  return JSON.stringify(obj, (k, v) => (v instanceof Date ? v.toISOString() : v), 2) + "\n";
}
if (require.main === module) {
  const argv = process.argv.slice(2);
  if (argv.indexOf("--help") >= 0 || argv.length === 0) {
    process.stdout.write("GOAT ENGINE. Usage: node goat_engine/tools/goat.js --file <config.json> [--json] [--out <file>]\n");
    process.exit(0);
  }
  let text;
  try {
    const res = run(readConfig(argv));
    if (argv.indexOf("--json") >= 0) {
      if (res.mode === "rule" || res.mode === "quality") { res.hindiSummary = hindiSummaryLines(res); text = toPlainJson(res); }
      else {
        const j = Object.assign({}, res, { results: res.results.map(r => Object.assign({}, r, { best: r.best ? Object.assign({}, r.best, { start: r.best.start.toISOString(), end: r.best.end.toISOString() }) : null, topWindows: r.topWindows.map(w => Object.assign({}, w, { start: w.start.toISOString(), end: w.end.toISOString() })) })) });
        j.chosen = j.results[0]; j.asOf = res.asOf.toISOString(); j.from = res.from.toISOString(); j.to = res.to.toISOString();
        j.hindiSummary = hindiSummaryLines(res);
        text = JSON.stringify(j, null, 2) + "\n";
      }
    } else {
      text = renderRun(res) + "\n";
    }
  } catch (e) {
    process.stderr.write("GOAT ENGINE error. " + e.message + "\n");
    process.exit(2);
  }
  const oi = argv.indexOf("--out");
  if (oi >= 0 && argv[oi + 1]) {
    const outFile = path.resolve(process.cwd(), argv[oi + 1]);
    fs.writeFileSync(outFile, text, "utf8");
    process.stdout.write("Report written to " + outFile + "\n");
  } else {
    process.stdout.write(text);
  }
}
