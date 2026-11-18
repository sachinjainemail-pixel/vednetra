#!/usr/bin/env node
/*
 * SARVA engine PROMISE LAYERS for the Udu and Quad Dasha columns. Fires both columns together for every question of a chart.
 *
 *   node sarva_engine/tools/promise_layer.js '{"name":"N","gender":"female","date":"1980-12-08","time":"04:38:00","tz":5.5,"lat":23.588,"lon":72.3693,
 *        "asOf":"2026-11-17","questions":[{"id":"Q1","text":"Education","options":["A Gynecologist","B Pediatrician"],"mode":"to_date"}]}' [--rules] [--json]
 *
 * WHAT THIS IS. The Udu corpus of 11,683 rules and the Quad READ rules of sections 3 to 19 were never supplied, and both methods forbid answering without them.
 * The owner asked on 17 November 2026 that both columns still answer, with a promise layer built in. This file is that layer. It is authored by the SARVA engine author.
 * It is NOT the Udu corpus and NOT the Quad READ rules. It uses no Udu rule id and invents none. Its rules carry the ids SARVA-UDU-P and SARVA-QUAD-P. They follow the
 * documented frame of each method, Udu's nakshatra and pada reading with its weighing formula and its Law 3 promise and delivery gate, and Quad's four dasha systems, its
 * stability gate and its Rule of 10 option test. Every cell it produces is marked PROVISIONAL in the EVIDENCE line. When the real files arrive the guard and the routing switch back to the corpus.
 * Chart numbers come from VedNetra and the Quad compute layer, nothing is computed by hand. Option profiles come from the lexicon, tier T4 houses and planets only.
 */
const path = require("path");
const { loadVedicCore } = require("../../suj_engine/tools/vednetra_loader");
const LEX = require("./sarva_lexicon.js");
const UR = require("./udu_rules.js");
const UE = require("./udu_engine.js");

const SIGNN = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const LORDN = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"];
const K2N = { Su: "Sun", Mo: "Moon", Ma: "Mars", Me: "Mercury", Ju: "Jupiter", Ve: "Venus", Sa: "Saturn", Ra: "Rahu", Ke: "Ketu" };
const N2K = {}; Object.keys(K2N).forEach(k => { N2K[K2N[k]] = k; });
const MALE = ["Sun", "Mars", "Jupiter", "Saturn", "Rahu"], FEMALE = ["Moon", "Venus"];
const GOOD = [1, 4, 5, 7, 9, 10], DUS = [6, 8, 12];
const rn = r => (r && typeof r === "object") ? r.n / r.d : r;

// ------------------------------------------------------------------ chart
function cast(c) {
  const VC = loadVedicCore();
  const tz = Number(c.tz), hh = Math.floor(Math.abs(tz)), mm = Math.round((Math.abs(tz) - hh) * 60);
  const t = String(c.time).length === 5 ? c.time + ":00" : c.time;
  const input = { name: c.name || "native", gender: c.gender || "unspecified", birthISO: c.date + "T" + t, tz, lat: Number(c.lat), lon: Number(c.lon), place: "" };
  const ch = VC.avEngineFor(input).chart;
  const Q = globalThis.VNQuadDasha, E = Q.engines;
  const X = Q.extract(ch);
  const birth = new Date(c.date + "T" + t + (tz < 0 ? "-" : "+") + String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0"));
  const asOf = new Date((c.asOf || new Date().toISOString().slice(0, 10)) + "T12:00:00Z");
  const age = (asOf - birth) / (365.25 * 86400000);
  const P = {}; ch.planets.forEach(p => { P[p.name] = p; });
  const lagna = ch.ascendant.sign;
  const houseSign = h => (lagna + h - 1) % 12;
  const houseLord = h => LORDN[houseSign(h)];
  const signHouse = s => ((s - lagna + 12) % 12) + 1;
  const occ = h => Object.keys(P).filter(n => P[n].house === h);
  const grahaAsp = (n, h) => { const s = P[n].sign; const offs = E.PASP[N2K[n]] || [6]; return offs.some(o => (s + o) % 12 === houseSign(h)); };
  const rashiAsp = (s1, s2) => s1 !== s2 && E.JASP[s1].indexOf(s2) >= 0;
  const link = (s1, s2) => s1 === s2 || rashiAsp(s1, s2);
  const rows = {
    vim: E.vimshottari(X.lon.Mo).rows.map(r => ({ md: K2N[r.md], ad: K2N[r.ad], a: rn(r.start), b: rn(r.end) })),
    chara: E.chara(X.lagna, X.sg, X.deg).rows.map(r => ({ sign: r.sign, a: r.start, b: r.end })),
    kcd: E.kcd(X.lon.Mo).rows.map(r => ({ sign: E.SIGNS.indexOf(r.sign), a: rn(r.start), b: rn(r.end) })),
    yog: E.yogini(X.lon.Mo).rows.map(r => ({ lord: K2N[r.lord], name: r.yogini, a: rn(r.start), b: rn(r.start) + rn(r.len) }))
  };
  const run = Q.runningAt(ch, X, age);
  const stab = Q.stability(ch, { latitude: input.lat, longitude: input.lon, timezone: tz }, age, [5, 15]);
  const kar = E.karakas(X.deg);
  return { ch, P, lagna, houseSign, houseLord, signHouse, occ, grahaAsp, rashiAsp, link, rows, run, stab, age, kar, E, X, input };
}
// periods that count for a question. now means the running period only, to_date means every period from birth to the as of date
const live = (rows, age, mode) => rows.filter(r => mode === "now" ? (r.a <= age && age < r.b) : r.a < age);
const dignity = p => String(p.dignity || "");

// ------------------------------------------------------------------ option parsing
const NUM = { one: 1, two: 2, three: 3, four: 4, "एक": 1, "दो": 2, "तीन": 3, "चार": 4 };
const NOUN = [[/^(sons?|पुत्र|बेटा|बेटे)$/, "son"], [/^(daughters?|पुत्रियाँ|पुत्रियां|पुत्री|बेटियाँ|बेटियां|बेटी)$/, "daughter"], [/^(brothers?|भाई)$/, "brother"], [/^(sisters?|बहनें|बहन)$/, "sister"]];
function parseOption(text) {
  const t = LEX.norm(LEX.stripLabel(text));
  const lbl = (String(text).match(/^\s*\(?([A-Za-z])\)?[\s.:)\-]/) || [])[1];
  const label = lbl ? lbl.toUpperCase() : null;
  const toks = t.split(" ");
  const counts = { son: 0, daughter: 0, brother: 0, sister: 0 }; let any = false;
  toks.forEach((w, i) => { NOUN.forEach(([re, k]) => { if (re.test(w)) { const prev = toks[i - 1]; const n = NUM[prev] || (/^\d$/.test(prev) ? Number(prev) : 1); counts[k] += n; any = true; } }); });
  if (any) {
    const kids = counts.son + counts.daughter > 0;
    return { label, text: LEX.stripLabel(text), type: kids ? "children" : "siblings", m: kids ? counts.son : counts.brother, f: kids ? counts.daughter : counts.sister };
  }
  const mother = /(mother|माता|माताजी|मां|माँ)/.test(t), father = /(father|पिता|पिताजी|पापा)/.test(t), both = /(both|दोनों|दोनो)/.test(t);
  if ((mother || father || both) && /(alive|living|जीवित|only|केवल|सिर्फ|दोनों|both)/.test(t)) return { label, text: LEX.stripLabel(text), type: "parents", mother: both || (mother && !father) || (mother && father && both), father: both || (father && !mother) };
  return { label, text: LEX.stripLabel(text), type: "entry" };
}
function profileOf(L, opt) {
  const ms = LEX.match(L, opt.text, null, 1);
  if (!ms.length) return null;
  const e = ms[0].e;
  return { id: e.id, name: e.name, cat: e.cat, aliases: e.aliases, bnn_keywords: e.bnn_keywords, houses: e.vedic.houses, planets: e.vedic.planets };
}

// ------------------------------------------------------------------ UDU promise layer
const UDU_RULES = [
  ["U1", 1.3, "A graha delivers through its nakshatra lord. Plus when the nakshatra lord is in the promise set or lords or occupies a house of the profile. Minus when it lords only a house 6, 8 or 12 and none of the profile."],
  ["U2", 1.5, "Pada level. Plus when the navamsa sign lord of the graha pada is in the promise set. Minus when that lord is debilitated."],
  ["U3", 0.6, "Dignity. Plus own, exalted or moolatrikona sign. Minus debilitated or combust."],
  ["U4", 0.6, "Placement from the Lagna. Plus houses 1,4,5,7,9,10. Minus houses 6,8,12."],
  ["U5", 1.0, "Moon nakshatra. Plus when the Moon nakshatra lord is in the promise set."],
  ["U6", 0.6, "Link to the governing house. Plus when the graha occupies it or throws a graha drishti on it."]
];
const CONF = 0.7; // every authored rule is inferred, the lowest confidence of the Udu weighing formula
const SET_CAP = 4; // a fixed size so that an option with a longer lexicon entry does not win by having more grahas to score
function promiseSet(C, prof) {
  const H = prof.houses.slice(0, 3);
  const order = [].concat(prof.planets.slice(0, 2), [C.houseLord(H[0]), C.houseLord(H[1] || H[0])], C.occ(H[0]), prof.planets.slice(2));
  const S = []; order.forEach(n => { if (C.P[n] && S.indexOf(n) < 0 && S.length < SET_CAP) S.push(n); });
  return { H, S };
}
function uduEntry(C, prof) {
  const { H, S } = promiseSet(C, prof);
  const inS = n => S.indexOf(n) >= 0;
  const lordsOf = n => (C.P[n].lordships || []);
  const hit = [];
  const add = (id, spec, pol, g, why) => hit.push({ id, spec, pol, g, why, w: pol * CONF * spec });
  S.forEach(g => {
    const p = C.P[g], NL = p.nakLord;
    if (NL && C.P[NL]) {
      const nlL = lordsOf(NL), nlH = C.P[NL].house;
      if (inS(NL) || H.some(h => nlL.indexOf(h) >= 0 || nlH === h)) add("U1", 1.3, +1, g, g + " in " + p.nakshatra + " delivers through " + NL);
      else if (nlL.length && nlL.every(h => DUS.indexOf(h) >= 0)) add("U1", 1.3, -1, g, g + " in " + p.nakshatra + " delivers through " + NL + " that lords only " + nlL.join(","));
    }
    const nsl = LORDN[p.navamsaSign];
    if (inS(nsl) && C.P[nsl]) add("U2", 1.5, +1, g, g + " pada " + p.pada + " navamsa " + SIGNN[p.navamsaSign] + " lord " + nsl + " in the set");
    else if (C.P[nsl] && /Debilitated/.test(dignity(C.P[nsl]))) add("U2", 1.5, -1, g, g + " pada navamsa lord " + nsl + " debilitated");
    if (/Own|Exalted|Moolatrikona/i.test(dignity(p))) add("U3", 0.6, +1, g, g + " " + dignity(p));
    if (/Debilitated/i.test(dignity(p))) add("U3", 0.6, -1, g, g + " debilitated");
    if (p.combust) add("U3", 0.6, -1, g, g + " combust");
    if (GOOD.indexOf(p.house) >= 0) add("U4", 0.6, +1, g, g + " in house " + p.house);
    else if (DUS.indexOf(p.house) >= 0) add("U4", 0.6, -1, g, g + " in house " + p.house);
    if (p.house === H[0] || C.grahaAsp(g, H[0])) add("U6", 0.6, +1, g, g + " links house " + H[0]);
  });
  const mn = C.P.Moon.nakLord; if (mn && inS(mn)) add("U5", 1.0, +1, "Moon", "Moon nakshatra lord " + mn + " in the set");
  const total = hit.reduce((a, h) => a + h.w, 0);
  const pada = hit.filter(h => h.id === "U2" && h.pol > 0).length;
  return { kind: "entry", set: S, houses: H, hit, total, padaRules: pada };
}
function frameCount(C, houses, kar, useRashi) {
  const fr = new Set(kar);
  houses.forEach(h => { fr.add(C.houseLord(h)); C.occ(h).forEach(n => fr.add(n)); Object.keys(C.P).forEach(n => { if (useRashi ? C.rashiAsp(C.P[n].sign, C.houseSign(h)) : C.grahaAsp(n, h)) fr.add(n); }); });
  let m = 0, f = 0; const names = [];
  fr.forEach(n => { if (!C.P[n] || n === "Ketu") return; let g = MALE.indexOf(n) >= 0 ? "m" : FEMALE.indexOf(n) >= 0 ? "f" : null;
    if (n === "Mercury") { const mates = Object.keys(C.P).filter(x => x !== "Mercury" && C.P[x].sign === C.P.Mercury.sign); const fm = mates.filter(x => FEMALE.indexOf(x) >= 0).length, ml = mates.filter(x => MALE.indexOf(x) >= 0).length; g = fm > ml ? "f" : ml > fm ? "m" : null; }
    if (g === "m") m++; else if (g === "f") f++; if (g) names.push(n + ":" + g); });
  return { m, f, names };
}
function uduCount(C, opt, incNative) {
  const kids = opt.type === "children";
  const houses = kids ? [5] : [3, 11], kar = kids ? ["Jupiter"] : ["Mars"];
  const fr = frameCount(C, houses, kar, false);
  let m = opt.m, f = opt.f;
  if (!kids && incNative) { if (C.input.gender === "female") f = Math.max(0, f - 1); else m = Math.max(0, m - 1); }
  const tot = m + f, frTot = fr.m + fr.f;
  const hit = [];
  if (tot > 0 && frTot > 0) { const d = Math.abs(m / tot - fr.m / frTot); hit.push({ id: "F1", spec: 0.6, pol: 1 - 2 * d, why: "option male share " + m + " of " + tot + " against frame male share " + fr.m + " of " + frTot + " " + fr.names.join(" "), w: (1 - 2 * d) * CONF * 0.6 }); }
  const want = Math.max(1, Math.min(3, Math.ceil(frTot / 2))); const dd = Math.abs(tot - want);
  hit.push({ id: "F2", spec: 0.6, pol: dd === 0 ? 1 : dd === 1 ? 0 : -1, why: "option count " + tot + " against the scaled frame count " + want + " from " + frTot + " frame grahas, no validated count rule", w: (dd === 0 ? 1 : dd === 1 ? 0 : -1) * CONF * 0.6 });
  return { kind: "count", hit, total: hit.reduce((a, h) => a + h.w, 0), padaRules: 0, frame: fr };
}
function parentState(C, who, mode) {
  const sun = who === "father";
  const k = sun ? "Sun" : "Moon", own = sun ? 9 : 4, marakaH = sun ? [10, 3] : [5, 10], eighth = sun ? 4 : 11;
  const p = C.P[k]; let dmg = 0; const why = [];
  const dbad = (c, w) => { dmg += c; why.push((c < 0 ? "minus " : "plus ") + w); };
  if (/Debilitated/i.test(dignity(p))) dbad(-1, k + " debilitated"); if (p.combust) dbad(-1, k + " combust");
  ["Saturn", "Rahu", "Ketu", "Mars"].forEach(n => { if (n !== k && (C.P[n].sign === p.sign || C.grahaAsp(n, p.house))) dbad(-1, n + " afflicts " + k); });
  if (DUS.indexOf(p.house) >= 0) dbad(-1, k + " in house " + p.house);
  const ol = C.houseLord(own), op = C.P[ol]; if (DUS.indexOf(op.house) >= 0) dbad(-1, "lord of " + own + " " + ol + " in house " + op.house); if (/Debilitated/i.test(dignity(op))) dbad(-1, ol + " debilitated");
  if (C.P.Jupiter.sign === p.sign || C.grahaAsp("Jupiter", p.house)) dbad(+1, "Jupiter protects " + k);
  if (GOOD.indexOf(op.house) >= 0) dbad(+1, "lord of " + own + " in house " + op.house);
  if (/Own|Exalted/i.test(dignity(p))) dbad(+1, k + " " + dignity(p));
  const killers = new Set([C.houseLord(eighth)].concat(marakaH.map(h => C.houseLord(h))));
  const per = live(C.rows.vim, C.age, mode).filter(r => killers.has(r.ad) || killers.has(r.md));
  const gate = per.length > 0;
  const gone = dmg <= -3 && gate;
  return { who, dmg, gate, gone, why, killers: Array.from(killers) };
}
function uduParents(C, opt, mode) {
  const f = parentState(C, "father", mode), m = parentState(C, "mother", mode);
  const hit = [];
  [["father", f, opt.father], ["mother", m, opt.mother]].forEach(([who, st, claimedAlive]) => {
    const pol = claimedAlive === !st.gone ? 1 : -1;
    hit.push({ id: "P1", spec: 1.3, pol, why: who + " " + (st.gone ? "damage " + st.dmg + " and a killer period passed, so gone" : "damage " + st.dmg + (st.gate ? "" : " but no delivering period") + ", so alive") + ", option says " + (claimedAlive ? "alive" : "gone"), w: pol * CONF * 1.3 });
  });
  return { kind: "parents", hit, total: hit.reduce((a, h) => a + h.w, 0), padaRules: 0, state: { f, m } };
}
function band(t) { return t >= 3 ? "yes certain" : t >= 1 ? "yes with a condition" : t > -1 ? "mixed" : t > -3 ? "difficult" : "no"; }
function lawThree(C, ent, mode) {
  const S = ent.set; if (!S) return null;
  const per = live(C.rows.vim, C.age, mode).filter(r => S.indexOf(r.md) >= 0 || S.indexOf(r.ad) >= 0);
  const strong = ent.total >= 1;
  const word = strong ? (per.length ? "strong promise and a delivering period has run or runs, so it has happened" : "strong promise and no delivering period yet, so it has not happened") : (per.length ? "weak promise and a delivering period has passed, so reduced or missed" : "weak promise and no delivering period, so not and unlikely");
  return word + ", " + per.length + " Vimshottari periods of the set counted";
}
function runUdu(C, L, q, mode) {
  const opts = q.options.map(parseOption);
  const res = opts.map(o => {
    let ent;
    if (o.type === "children" || o.type === "siblings") ent = uduCount(C, o, q.includingNative !== false);
    else if (o.type === "parents") ent = uduParents(C, o, mode);
    else { const prof = profileOf(L, o); ent = prof ? Object.assign(uduEntry(C, prof), { prof }) : { kind: "none", hit: [], total: null, padaRules: 0 }; }
    return Object.assign({ o }, ent);
  });
  return res;
}

// ------------------------------------------------------------------ QUAD promise layer
const QUAD_LAYERS = [
  ["L1", "Vim", "The first karaka of the option is not debilitated and not combust."],
  ["L2", "Chart", "The lord of the first house of the option sits in a kendra or trikona from the Lagna."],
  ["L3", "Chart", "The lord of the first house and the karaka are in sambandha, same sign or Jaimini rashi aspect."],
  ["L4", "Chart", "The karaka occupies or rashi aspects the sign of the first house."],
  ["L5", "Chart", "The lord of the second house of the option is in sambandha with the lord of the first."],
  ["L6", "Chart", "The Jaimini karaka of the matter links the sign of the first house, same sign or rashi aspect."],
  ["L7", "Vim", "A Vimshottari antardasha or mahadasha lord of the counted periods is in the promise set."],
  ["L8", "Yog", "A Yogini dasha lord of the counted periods is in the promise set."],
  ["L9", "Chara", "A Chara dasha sign of the counted periods occupies or rashi aspects the sign of the first or second house."],
  ["L10", "Kcd", "A Kaal Chakra dasha sign of the counted periods occupies or rashi aspects the sign of the first or second house."]
];
function jKarakaFor(C, prof, kind) {
  const m = kind === "children" ? "PK" : kind === "siblings" ? "BK" : /spouse|marriage|husband|wife/.test(prof.id) ? "DK" : /rel\.mother/.test(prof.id) ? "MK" : /^(med|prf|biz|inc|deg)/.test(prof.id) ? "AmK" : "AK";
  const kr = C.kar; const name = kr && (kr[m] || (kr.byRole && kr.byRole[m]));
  if (name) return K2N[name] || name;
  if (Array.isArray(kr)) { const idx = { AK: 0, AmK: 1, BK: 2, MK: 3, PK: 4, GK: 5, DK: 6 }[m]; const x = kr[idx]; if (x) return K2N[x.p || x.planet || x] || x.name || null; }
  return null;
}
function quadEntry(C, prof, mode, withdrawn) {
  const { H, S } = promiseSet(C, prof);
  const k1 = prof.planets.find(n => C.P[n]) || C.houseLord(H[0]);
  const sg1 = C.houseSign(H[0]), sg2 = C.houseSign(H[1] || H[0]);
  const l1 = C.houseLord(H[0]), l2 = C.houseLord(H[1] || H[0]);
  const jk = jKarakaFor(C, prof, "entry");
  const sat = {};
  const L = {};
  L.L1 = !/Debilitated/i.test(dignity(C.P[k1])) && !C.P[k1].combust;
  L.L2 = GOOD.indexOf(C.P[l1].house) >= 0;
  L.L3 = C.link(C.P[l1].sign, C.P[k1].sign);
  L.L4 = C.P[k1].sign === sg1 || C.rashiAsp(C.P[k1].sign, sg1);
  L.L5 = C.link(C.P[l2].sign, C.P[l1].sign);
  L.L6 = jk && C.P[jk] ? C.link(C.P[jk].sign, sg1) : false;
  L.L7 = live(C.rows.vim, C.age, mode).some(r => S.indexOf(r.ad) >= 0 || S.indexOf(r.md) >= 0);
  L.L8 = live(C.rows.yog, C.age, mode).some(r => S.indexOf(r.lord) >= 0);
  L.L9 = live(C.rows.chara, C.age, mode).some(r => [sg1, sg2].some(s => r.sign === s || C.rashiAsp(r.sign, s)));
  L.L10 = live(C.rows.kcd, C.age, mode).some(r => [sg1, sg2].some(s => r.sign === s || C.rashiAsp(r.sign, s)));
  return { kind: "entry", L, set: S, houses: H, karaka: k1, jaimini: jk };
}
function quadFamily(C, opt, mode, incNative) {
  // five layers for the male frame signals and five for the female, written from the Jaimini rashi frame and the four dasha systems
  const kids = opt.type === "children"; const houses = kids ? [5] : [3, 11];
  const fr = frameCount(C, houses, kids ? ["Jupiter"] : ["Mars"], true);
  let m = opt.m, f = opt.f; if (!kids && incNative) { if (C.input.gender === "female") f = Math.max(0, f - 1); else m = Math.max(0, m - 1); }
  const tot = m + f; const frTot = fr.m + fr.f; const want = Math.max(1, Math.min(3, Math.ceil(frTot / 2)));
  const L = {};
  L.L1 = tot > 0 && fr.m + fr.f > 0 && Math.abs(m / tot - fr.m / (fr.m + fr.f)) <= 0.34;
  L.L2 = tot === want;
  L.L3 = Math.abs(tot - want) <= 1;
  L.L4 = (m > 0) === (fr.m > 0);
  L.L5 = (f > 0) === (fr.f > 0);
  const sg = houses.map(h => C.houseSign(h));
  L.L6 = (m >= f) === (fr.m >= fr.f);
  L.L7 = live(C.rows.vim, C.age, mode).some(r => houses.some(h => r.ad === C.houseLord(h) || r.md === C.houseLord(h)));
  L.L8 = live(C.rows.yog, C.age, mode).some(r => houses.some(h => r.lord === C.houseLord(h)));
  L.L9 = live(C.rows.chara, C.age, mode).some(r => sg.some(s => r.sign === s || C.rashiAsp(r.sign, s)));
  L.L10 = live(C.rows.kcd, C.age, mode).some(r => sg.some(s => r.sign === s || C.rashiAsp(r.sign, s)));
  return { kind: "count", L, frame: fr };
}
function quadParents(C, opt, mode) {
  const f = parentState(C, "father", mode), m = parentState(C, "mother", mode);
  const L = {};
  // five layers per parent, each one says whether the layer points to alive. The option is satisfied where it agrees.
  const lay = (who, st, base) => {
    const sun = who === "father"; const k = sun ? "Sun" : "Moon"; const p = C.P[k]; const own = sun ? 9 : 4; const eighthSign = C.houseSign(sun ? 4 : 11);
    const claim = sun ? opt.father : opt.mother;
    const alive = {
      a: DUS.indexOf(p.house) < 0 && !/Debilitated/i.test(dignity(p)),
      b: !["Saturn", "Rahu", "Ketu", "Mars"].some(n => n !== k && C.link(C.P[n].sign, p.sign)),
      c: DUS.indexOf(C.P[C.houseLord(own)].house) < 0,
      d: !st.gate,
      e: !live(C.rows.chara, C.age, mode).some(r => r.sign === eighthSign || C.rashiAsp(r.sign, eighthSign))
    };
    ["a", "b", "c", "d", "e"].forEach((x, i) => { L["L" + (base + i)] = claim === alive[x]; });
  };
  lay("father", f, 1); lay("mother", m, 6);
  return { kind: "parents", L, state: { f, m } };
}
function runQuad(C, L, q, mode) {
  const opts = q.options.map(parseOption);
  const unst = [];
  const st = C.stab && C.stab.res || {};
  const ok = k => !st[k] || Object.keys(st[k]).every(m => st[k][m]);
  const sysOf = { L7: ["vimAD", "vimMD"], L8: ["yogini"], L9: ["chara"], L10: ["kcd"] };
  Object.keys(sysOf).forEach(l => { if (!sysOf[l].every(ok)) unst.push(l); });
  const res = opts.map(o => {
    let ent;
    if (o.type === "children" || o.type === "siblings") ent = quadFamily(C, o, mode, q.includingNative !== false);
    else if (o.type === "parents") ent = quadParents(C, o, mode);
    else { const prof = profileOf(L, o); ent = prof ? Object.assign(quadEntry(C, prof, mode), { prof }) : { kind: "none", L: null }; }
    return Object.assign({ o }, ent);
  });
  // voided layers, the same truth for every option carries no information. withdrawn layers, the system is unstable inside the birth time error.
  const live_ = res.filter(r => r.L);
  const vac = [], used = [];
  QUAD_LAYERS.forEach(([id]) => {
    if (unst.indexOf(id) >= 0) return;
    const vals = live_.map(r => !!r.L[id]);
    if (vals.length > 1 && vals.every(v => v === vals[0])) vac.push(id); else used.push(id);
  });
  res.forEach(r => { r.score = r.L ? used.filter(id => r.L[id]).length : null; });
  return { res, unst, vac, used };
}

// ------------------------------------------------------------------ choose
function pick(list, key, padaKey) {
  const ok = list.filter(r => r[key] !== null && r[key] !== undefined);
  if (!ok.length) return { r: list[0], tie: true, none: true };
  const best = Math.max.apply(null, ok.map(r => r[key]));
  const top = ok.filter(r => Math.abs(r[key] - best) < 1e-9);
  if (top.length === 1) return { r: top[0], tie: false };
  if (padaKey) { const pm = Math.max.apply(null, top.map(r => r[padaKey] || 0)); const t2 = top.filter(r => (r[padaKey] || 0) === pm); if (t2.length === 1) return { r: t2[0], tie: false, byPada: true }; }
  return { r: top[0], tie: true };
}
const f2 = x => (Math.round(x * 100) / 100).toFixed(2);

const opts_hasParents = q => q.options.some(o => parseOption(o).type === "parents");
function fire(cfg, opts) {
  opts = opts || {};
  const L = LEX.load();
  const C = cast(cfg);
  const out = [], data = [];
  (cfg.questions || []).forEach(q => {
    const mode = q.mode || (/(present|current|now|अभी|वर्तमान)/i.test(q.text || "") ? "now" : "to_date");
    const labels = q.options.map(o => parseOption(o).label || "?");
    out.push("");
    let uduDone = null;
    const parentWarn = opts_hasParents(q) ? ", WEAK HANDLER the owner's BNN backtest called four living parents gone by a damage and age rule of this kind, read this cell as the least reliable" : "";
    // UDU
    const corpus = UR.present() && !opts.authoredUdu;
    if (corpus) {
      const cu = UE.runUduCorpus(C, L, q, mode, { parseOption, profileOf, promiseSet });
      const pk = UE.pickBest(cu.out);
      const fireN = cu.coll.fired.size, nearN = cu.coll.nearly.size;
      out.push("METHOD UDU " + q.id);
      out.push("    Udu corpus reading. Chart on Lahiri, Moon in " + C.P.Moon.nakshatra + " pada " + C.P.Moon.pada + ", Lagna " + SIGNN[C.lagna] + ". Files read " + Array.from(new Set([].concat.apply([], cu.out.map(x => x.route)))).join(", ") + ". Rules that fired " + fireN + ", nearly fired and left out " + nearN + " because an IF condition could not be tested.");
      cu.out.forEach(r => {
        out.push("    OPTION " + r.o.label + " " + r.o.text + (r.prof ? "  profile " + r.prof.id + " graha set " + r.S.join(",") : "  type " + r.o.type) + "  direct " + r.direct.length + " link " + r.link.length);
        r.rows.sort((x, y) => Math.abs(y.r.w * y.agree) - Math.abs(x.r.w * x.agree)).slice(0, 6).forEach(x => out.push("        " + x.r.id + " " + x.kind + " " + x.r.pol + "/" + x.r.conf + " x " + x.r.spec + (x.agree !== 1 ? " x agree " + x.agree : "") + " = " + (x.r.w * x.agree >= 0 ? "+" : "") + UE.f2(x.r.w * x.agree) + "  " + x.r.if.slice(0, 70) + "  THEN " + x.r.then.slice(0, 90)));
        if (r.rows.length > 6) out.push("        and " + (r.rows.length - 6) + " more rules in the sum");
        r.named.slice(0, 3).forEach(n => out.push("        " + n));
        out.push("        direct sum " + UE.f2(r.dsum) + ", link sum " + UE.f2(r.lsum) + ", counted " + UE.f2(r.total) + " by " + r.basis);
      });
      const best = pk.r; const none = cu.out.every(x => x.rows.length === 0);
      let cite = best.rows.filter(x => x.r.w !== 0).sort((x, y) => Math.abs(y.r.w * y.agree) - Math.abs(x.r.w * x.agree)).slice(0, 4).map(x => x.r.id);
      let silent = "";
      if (!cite.length) { const nr = UE.nearest(C, cu.coll, best.route); cite = nr.map(x => x.r.id); silent = ", CORPUS SILENT on the options, nearest rules are the janma nakshatra rules of the routed files and they do not separate the options"; if (!cite.length) { const any = Array.from(cu.coll.fired.values()).slice(0, 2); cite = any.map(x => x.r.id); } }
      const g3 = best.prof ? lawThree(C, { set: best.S, total: best.total }, mode) : null;
      if (g3) out.push("    Law 3 period test, adds no weight and cites no Udu rule for timing. " + g3);
      const sums = cu.out.map(r => r.o.label + " " + UE.f2(r.total)).join(", ");
      const parentWarn2 = opts_hasParents(q) ? ", WEAK HANDLER a parent is called gone only by a malefic rule that names death, loss or separation, the owner's BNN backtest called four living parents gone by a similar table rule" : "";
      out.push("    EVIDENCE " + q.id + " UDU corpus rules " + (cite.join(" ") || "none") + ", counted sums " + sums + " by " + best.basis + ", band " + UE.bandOf(best.total) + (pk.tie ? ", TIE FORCED PICK the first listed of the tied options, no rule of the corpus separates them" : pk.law3 ? ", LAW 3 NO PROMISE OF LOSS no decisive rule of death or loss fired for either parent so the option with both alive is read" : pk.byPada ? ", tie settled by the pada level rule" : "") + silent + ", pada level rules in the winner " + best.pada + ", nearly fired left out " + nearN + parentWarn2 + ", no accuracy has been measured for Udu");
      out.push("    RESULT " + q.id + " UDU " + best.o.label);
      uduDone = { label: best.o.label, sums };
    }
    if (!corpus) {
    const u = runUdu(C, L, q, mode);
    u.forEach(r => { r.label = r.o.label; });
    const pu = pick(u, "total", "padaRules");
    const sums = u.map(r => r.o.label + " " + (r.total === null ? "none" : f2(r.total))).join(", ");
    const bandTxt = pu.r.total === null ? "no profile" : band(pu.r.total) + " by the Udu bands, ranking decides because the sums of this layer are not on the corpus scale";
    const g3 = pu.r.kind === "entry" ? lawThree(C, pu.r, mode) : null;
    out.push("METHOD UDU " + q.id);
    out.push("    Udu promise layer, provisional. Chart cast on Lahiri, Moon in " + C.P.Moon.nakshatra + " pada " + C.P.Moon.pada + ", Lagna " + SIGNN[C.lagna] + ". Periods counted " + (mode === "now" ? "now, the running one" : "from birth to the as of date") + ".");
    u.forEach(r => {
      out.push("    OPTION " + r.o.label + " " + r.o.text + (r.prof ? "  profile " + r.prof.id + " houses " + r.prof.houses.join(",") + " planets " + r.prof.planets.join(",") : "  type " + r.o.type + (r.kind === "none" ? "  NO ENTRY, no rules fire" : "")));
      r.hit.slice(0, 14).forEach(h => out.push("        SARVA-UDU-P-" + h.id + " " + (h.pol > 0 ? "+" : "") + f2(h.pol) + " x 0.7 x " + h.spec + " = " + (h.w >= 0 ? "+" : "") + f2(h.w) + "  " + h.why));
      if (r.hit.length > 14) out.push("        and " + (r.hit.length - 14) + " more rule lines");
      out.push("        total " + (r.total === null ? "none" : f2(r.total)));
    });
    if (g3) out.push("    Law 3 gate, adds no weight. " + g3);
    out.push("    EVIDENCE " + q.id + " UDU PROVISIONAL, no Udu corpus rules were used and no Udu rule id is cited, rules SARVA-UDU-P-U1 to U6 and F1 F2 P1, weighted sums " + sums + ", band " + bandTxt + (pu.tie ? ", TIE FORCED PICK the first listed" : pu.byPada ? ", tie settled by the pada level rule" : "") + parentWarn + ", no accuracy has been measured for Udu");
    out.push("    RESULT " + q.id + " UDU " + pu.r.label);
    uduDone = { label: pu.r.label, sums };
    }
    // QUAD
    const Qd = runQuad(C, L, q, mode);
    const pq = pick(Qd.res, "score");
    out.push("METHOD QUAD " + q.id);
    out.push("    Quad promise layer, provisional. Vimshottari " + C.run.vimMD + " " + C.run.vimAD + ", Chara sign " + C.run.chara + ", Kaal Chakra sign " + C.run.kcd + ", Yogini " + C.run.yogini + ". Stability at plus and minus 5 and 15 minutes, withdrawn " + (Qd.unst.length ? Qd.unst.join(" ") : "none") + ".");
    Qd.res.forEach(r => {
      if (!r.L) { out.push("    OPTION " + r.o.label + " " + r.o.text + "  NO ENTRY, no layer can be written"); return; }
      const lay = QUAD_LAYERS.map(([id]) => id + (Qd.unst.indexOf(id) >= 0 ? " withdrawn" : Qd.vac.indexOf(id) >= 0 ? " " + (r.L[id] ? "yes" : "no") + " void" : " " + (r.L[id] ? "YES" : "no"))).join(", ");
      out.push("    OPTION " + r.o.label + " " + r.o.text + (r.prof ? "  profile " + r.prof.id + " karaka " + r.karaka + " jaimini " + (r.jaimini || "none") : "  type " + r.o.type));
      out.push("        layers " + lay + ", counted " + r.score);
    });
    const sc = Qd.res.filter(r => r.score !== null).map(r => r.score).sort((a, b) => b - a);
    const lead = sc.length > 1 ? sc[0] - sc[1] : sc[0];
    out.push("    EVIDENCE " + q.id + " QUAD PROVISIONAL, no Quad READ rules were used, Rule of 10 layers SARVA-QUAD-P-L1 to L10 fixed before the chart, satisfied " + Qd.res.map(r => r.o.label + " " + (r.score === null ? "none" : r.score)).join(", ") + ", lead " + lead + (lead < 2 ? " narrow" : "") + ", COMPUTED dasha facts, UNSTABLE " + (Qd.unst.length ? Qd.unst.join(" ") : "none") + ", VACUOUS " + (Qd.vac.length ? Qd.vac.join(" ") : "none") + (pq.tie ? ", TIE FORCED PICK the first listed" : "") + parentWarn + ", no validated hit rate");
    out.push("    RESULT " + q.id + " QUAD " + pq.r.o.label);
    data.push({ id: q.id, udu: uduDone.label, quad: pq.r.o.label, uduSums: uduDone.sums, quadScores: Qd.res.map(r => r.score) });
  });
  if (opts.rules) { out.push("", "RULE TABLE"); UDU_RULES.forEach(r => out.push("  SARVA-UDU-P-" + r[0] + " specificity " + r[1] + " " + r[2])); QUAD_LAYERS.forEach(l => out.push("  SARVA-QUAD-P-" + l[0] + " " + l[2])); }
  return { text: out.join("\n"), data };
}
module.exports = { fire, cast, parseOption, band, profileOf, promiseSet };

if (require.main === module) {
  const a = process.argv.slice(2);
  const cfg = JSON.parse(a.find(x => x.trim().startsWith("{")) || "{}");
  if (!cfg.date || !cfg.time || cfg.lat === undefined || cfg.tz === undefined || !cfg.questions) { console.error("give date, time, tz, lat, lon, gender and questions"); process.exit(2); }
  const r = fire(cfg, { rules: a.indexOf("--rules") >= 0 });
  console.log(a.indexOf("--json") >= 0 ? JSON.stringify(r.data) : r.text);
}
