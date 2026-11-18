#!/usr/bin/env node
/*
 * SARVA engine QUAD DASHA READING. Runs the Quad Dasha column on the owner's full methodology file, installed 18 November 2026 in
 * sarva_engine/knowledge/quad/QUAD-FULL-METHODOLOGY.pdf and .txt, sections 1 to 21, 86 pages, Hindi.
 *
 * Three jobs, never mixed, as the file says in section 1 and section 21.
 *   COMPUTE. The chart and the four dashas with the stability gate. Validated, 8 of 8 self tests. Comes from quad-dasha.js through promise_layer.js cast().
 *   READ. The interpretive rules of the four schools, the 88 rows of knowledge/quad/quad_rules.json. NOT validated, 52 tests at chance, mean lift 0.960.
 *   OPTION TEST. The Rule of 10, section 13. Every option is broken into exactly 10 layers that are written BEFORE the chart is read, then scored.
 *          The leader of the Rule of 10 is the answer of the Quad column, section 14.3 S12. NOT validated.
 *
 * What the file fixes, and this file does not change. Section 13.7 parameters. 10 layers per option, at most 5 houses and 3 karakas per layer, natal part 0.7 of the
 * houses and 0.3 of the karakas, dasha part at half weight with the weights MD 0.25, AD 0.35 and PD 0.4, transit part at quarter weight,
 * a support layer is satisfied at 1.1 and an afflict layer at 0.6, 1 point per satisfied layer plus at most 0.3 for strong planets and at most 0.2 for rajayoga,
 * at most 1.5 per layer, no rajayoga points on an afflict layer, NARROW when the lead is under 2.0 points, tie break planet strength then rajayoga and nothing else.
 *
 * What the file leaves to the hand. The numeric scale of the house state, of the karaka strength, of the natural signification link and of the text rule
 * polarity. Section 13.3 says to fix it once in writing before the scores, apply it to every option and print every number, all of it HAND ARITHMETIC.
 * The scale is in SCALE below. It was fixed on 18 November 2026 so that the median layer of a random chart sits at the satisfied threshold, as the file asks
 * ("layers are satisfied about half the time"), by looking at random charts only and never at an answer. Do not change it after a wrong leader, section 11.4.
 *
 * Chart numbers come from VedNetra and the Quad compute layer. The Vimshottari pratyantar, the Jupiter and Saturn transit and every number of the scale are not
 * printed by the Quad report, so they are HAND ARITHMETIC and the evidence line says so.
 */
const QR = require("./quad_rules.js");

const SIGNN = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const K2N = { Su: "Sun", Mo: "Moon", Ma: "Mars", Me: "Mercury", Ju: "Jupiter", Ve: "Venus", Sa: "Saturn", Ra: "Rahu", Ke: "Ketu" };
const N2K = {}; Object.keys(K2N).forEach(k => { N2K[K2N[k]] = k; });
const BEN = ["Jupiter", "Venus", "Mercury", "Moon"], MAL = ["Saturn", "Mars", "Rahu", "Ketu", "Sun"];
const VORD = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"], VYRS = { Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17 };
const rn = r => (r && typeof r === "object") ? r.n / r.d : r;
const f2 = x => (Math.round(x * 100) / 100).toFixed(2);
const strong = p => /Own|Exalted|Moolatrikona/i.test(String(p.dignity || ""));
const KT = [1, 4, 5, 7, 9, 10], DU = [6, 8, 12];

// the thresholds and weights of section 13.7, never changed
const FIXED = { layers: 10, maxHouses: 5, maxKar: 3, wHouse: 0.7, wKar: 0.3, wMD: 0.25, wAD: 0.35, wPD: 0.4, dashaWeight: 0.5, transitWeight: 0.25, thSupport: 1.1, thAfflict: 0.6, perLayer: 1, strongMax: 0.3, rajaMax: 0.2, layerMax: 1.5, narrow: 2.0 };
// the hand scale of section 13.3, fixed once on 18 November 2026, version SARVA-R10-SCALE-1
const SCALE = {
  version: "SARVA-R10-SCALE-1",
  houseBase: 1.0, lordStrong: 0.30, lordDebil: -0.30, lordCombust: -0.15, lordKT: 0.20, lord2_11: 0.05, lordDusthana: -0.30, benOcc: 0.15, malOcc: -0.15, malOccUpachaya: 0.10, jupAsp: 0.20, malAsp: -0.10,
  affMalOcc: 0.30, affSunOcc: 0.20, affMalAsp: 0.15, affLordDebil: 0.40, affLordCombust: 0.20, affLordDusthana: 0.40, affLordTouch: 0.20,
  karBase: 1.0, kStrong: 0.40, kDebil: -0.50, kCombust: -0.30, kKT: 0.20, k11: 0.10, kDusthana: -0.30, kJup: 0.15, kMalConj: -0.15, kMalConjCap: -0.30, kNakWeight: 0.4,
  kafDebil: 0.40, kafCombust: 0.30, kafDusthana: 0.30, kafMal: 0.15, kafCap: 0.45, linkEach: 0.10, linkCap: 0.20,
  dashaSupportRef: 0.8, dashaAfflictRef: 0.25, strongKar: 1.4, dictumPolarity: 0, supportShift: -0.50, afflictShift: -0.24
};

// ------------------------------------------------------------------ chart facts for the scale
function mk(C) {
  const P = C.P, sg = n => P[n].sign, house = n => P[n].house;
  const malTouch = (n) => MAL.filter(m => m !== n && (P[m].sign === P[n].sign || C.grahaAsp(m, P[n].house)));
  const hs = h => {
    const lord = C.houseLord(h), L = P[lord]; let s = SCALE.houseBase;
    if (strong(L)) s += SCALE.lordStrong; if (/Debilitated/i.test(L.dignity || "")) s += SCALE.lordDebil; if (L.combust) s += SCALE.lordCombust;
    if (KT.indexOf(L.house) >= 0) s += SCALE.lordKT; else if (L.house === 11 || L.house === 2) s += SCALE.lord2_11; else if (DU.indexOf(L.house) >= 0) s += SCALE.lordDusthana;
    C.occ(h).forEach(n => { if (n === lord) return; if (BEN.indexOf(n) >= 0 && !(n === "Moon" && P.Moon.combust)) s += SCALE.benOcc; else if (MAL.indexOf(n) >= 0) s += ([3, 6, 10, 11].indexOf(h) >= 0 ? SCALE.malOccUpachaya : SCALE.malOcc); });
    if (C.grahaAsp("Jupiter", h) && P.Jupiter.house !== h) s += SCALE.jupAsp;
    ["Saturn", "Mars", "Rahu", "Ketu"].forEach(m => { if (P[m].house !== h && C.grahaAsp(m, h)) s += SCALE.malAsp; });
    return Math.max(0, Math.min(2, s));
  };
  const af = h => {
    const lord = C.houseLord(h), L = P[lord]; let s = 0;
    C.occ(h).forEach(n => { if (n === "Sun") s += SCALE.affSunOcc; else if (MAL.indexOf(n) >= 0) s += SCALE.affMalOcc; });
    ["Saturn", "Mars", "Rahu", "Ketu"].forEach(m => { if (P[m].house !== h && C.grahaAsp(m, h)) s += SCALE.affMalAsp; });
    if (/Debilitated/i.test(L.dignity || "")) s += SCALE.affLordDebil; if (L.combust) s += SCALE.affLordCombust;
    if (DU.indexOf(L.house) >= 0 && DU.indexOf(h) < 0) s += SCALE.affLordDusthana;
    if (malTouch(lord).some(m => ["Saturn", "Mars", "Rahu", "Ketu"].indexOf(m) >= 0)) s += SCALE.affLordTouch;
    return Math.max(0, Math.min(2, s));
  };
  const ks0 = n => {
    const p = P[n]; let s = SCALE.karBase;
    if (strong(p)) s += SCALE.kStrong; if (/Debilitated/i.test(p.dignity || "")) s += SCALE.kDebil; if (p.combust) s += SCALE.kCombust;
    if (KT.indexOf(p.house) >= 0) s += SCALE.kKT; else if (p.house === 11) s += SCALE.k11; else if (DU.indexOf(p.house) >= 0) s += SCALE.kDusthana;
    if (n !== "Jupiter" && (P.Jupiter.sign === p.sign || C.grahaAsp("Jupiter", p.house))) s += SCALE.kJup;
    const mc = MAL.filter(m => m !== n && m !== "Sun" && P[m].sign === p.sign).length; s += Math.max(SCALE.kMalConjCap, mc * SCALE.kMalConj);
    return Math.max(0, Math.min(2, s));
  };
  const kaf0 = n => {
    const p = P[n]; let s = 0;
    if (/Debilitated/i.test(p.dignity || "")) s += SCALE.kafDebil; if (p.combust) s += SCALE.kafCombust; if (DU.indexOf(p.house) >= 0) s += SCALE.kafDusthana;
    s += Math.min(SCALE.kafCap, malTouch(n).length * SCALE.kafMal);
    return Math.max(0, Math.min(2, s));
  };
  const ks = n => { const p = P[n]; const nl = p.nakLord && P[p.nakLord] ? p.nakLord : n; return (1 - SCALE.kNakWeight) * ks0(n) + SCALE.kNakWeight * ks0(nl); };
  const kaf = n => { const p = P[n]; const nl = p.nakLord && P[p.nakLord] ? p.nakLord : n; return (1 - SCALE.kNakWeight) * kaf0(n) + SCALE.kNakWeight * kaf0(nl); };
  const linkHouse = (n, h) => C.houseLord(h) === n || P[n].house === h || C.grahaAsp(n, h);
  return { hs, af, ks, kaf, linkHouse };
}

// ------------------------------------------------------------------ Vimshottari levels, MD AD from the report, PD by the Vimshottari proportion (HAND ARITHMETIC)
function pdAt(adLord, a, b, age) {
  const i0 = VORD.indexOf(adLord); let t = a; const len = b - a;
  for (let k = 0; k < 9; k++) { const p = VORD[(i0 + k) % 9]; const d = len * VYRS[p] / 120; if (age < t + d || k === 8) return p; t += d; }
  return adLord;
}
function lordsAt(rows, age) { const r = rows.find(x => x.a <= age && age < x.b) || rows[rows.length - 1]; return { md: r.md, ad: r.ad, pd: pdAt(r.ad, r.a, r.b, age), a: r.a, b: r.b }; }
function lordsPerturbed(C, off) {
  const Q = globalThis.VNQuadDasha, E = C.E;
  const base = C.ch.date instanceof Date ? C.ch.date : new Date(C.ch.date);
  const c = C.VC.buildChart(new Date(base.getTime() + off * 60000), C.input.lat, C.input.lon, C.input.tz, { ayanamshaKey: "lahiri" });
  const X = Q.extract(c);
  const rows = E.vimshottari(X.lon.Mo).rows.map(r => ({ md: K2N[r.md], ad: K2N[r.ad], a: rn(r.start), b: rn(r.end) }));
  return lordsAt(rows, C.age);
}
function transitOf(C) {
  if (C._tr) return C._tr;
  const c = C.VC.buildChart(C.asOfDate, C.input.lat, C.input.lon, C.input.tz, { ayanamshaKey: "lahiri" });
  const T = {}; c.planets.forEach(p => { T[p.name] = p.sign; });
  const E = C.E;
  const aspSigns = n => (E.PASP[N2K[n]] || [6]).map(o => (T[n] + o) % 12);
  C._tr = { T, asp: aspSigns };
  return C._tr;
}

// ------------------------------------------------------------------ WRITING THE LAYERS. Chart free. Nothing below reads C.
const TESTS = ["condition", "combination", "yoga", "dictum", "signification", "nakshatra", "dasha", "transit"];
function lay(id, text, houses, kar, dir, tests, subj) {
  const hs = []; houses.forEach(h => { if (h && hs.indexOf(h) < 0) hs.push(h); });
  const ks = []; kar.forEach(k => { if (k && ks.indexOf(k) < 0) ks.push(k); });
  return { id, text, houses: hs.slice(0, FIXED.maxHouses), kar: ks.slice(0, FIXED.maxKar), dir, tests, subj };
}
const shiftH = (b, h) => ((b - 1) + (h - 1)) % 12 + 1;
function whoseOf(text) {
  const t = String(text || "");
  if (/(husband|wife|spouse|पति|पत्नी|जीवनसाथी|जीवन साथी)/i.test(t)) return { base: 7, who: "spouse" };
  if (/(father|पिता|पापा)/i.test(t)) return { base: 9, who: "father" };
  if (/(mother|माता|माँ|मां)/i.test(t)) return { base: 4, who: "mother" };
  if (/(\bson\b|daughter|child|बेटा|बेटी|संतान|पुत्र)/i.test(t)) return { base: 5, who: "child" };
  if (/(brother|sister|भाई|बहन)/i.test(t)) return { base: 3, who: "sibling" };
  return { base: 1, who: "native" };
}
function writeEntryLayers(opt, prof, whose, afflictAll) {
  const b = whose.base, S = whose.who === "native" ? "the native" : "the " + whose.who + " of the native";
  const H = prof.houses.map(h => shiftH(b, h)); const K = prof.planets;
  const h1 = H[0], h2 = H[1] || H[0], h3 = H[2] || H[1] || H[0], k1 = K[0], k2 = K[1] || K[0];
  const o = opt.text;
  if (afflictAll) {
    return [
      lay("1", S + " is weak and vulnerable in the part or system that " + o + " concerns", [h1, h2, b], [k1, k2], "afflict", ["signification", "condition", "nakshatra"], 1),
      lay("2", "A cause or trigger for " + o + " is present in " + S, [6, h1, 8], ["Saturn", "Mars", k1], "afflict", ["signification", "combination", "dictum"], 1),
      lay("3", "Vitality of " + S + " is low against " + o, [b, 6, 8], ["Sun", "Moon", k1], "afflict", ["condition", "nakshatra", "signification"], 1),
      lay("4", "Malefic pressure sits on the signs and houses that show " + o, [h1, h2, h3], ["Saturn", "Mars", "Rahu"], "afflict", ["condition", "combination", "yoga"], 1),
      lay("5", o + " tends to last long in " + S, [6, 8, 12, h1], ["Saturn", k1], "afflict", ["combination", "dasha", "dictum"], 1),
      lay("6", "A running period activates " + o + " in " + S + " now", [h1, 6, 8], [k1, "Saturn"], "afflict", ["dasha", "transit", "signification"], 1),
      lay("7", "Diet, habit or surroundings aggravate " + o, [6, 4, 12, h1], ["Moon", "Rahu", k1], "afflict", ["condition", "signification", "nakshatra"], 1),
      lay("8", "A past or inherited weakness leads to " + o, [8, 4, 9, h1], ["Saturn", "Ketu", k1], "afflict", ["dictum", "combination", "signification"], 1),
      lay("9", "Stress of the mind plays a part in " + o, [5, 8, 12, h1], ["Moon", "Mercury", k1], "afflict", ["condition", "nakshatra", "signification"], 1),
      lay("10", o + " comes to notice and demands attention in " + S, [b, 6, 12, h1], ["Mars", "Sun", k1], "afflict", ["condition", "dasha", "transit"], 1)
    ];
  }
  return [
    lay("1", S + " has the aptitude and mind for " + o, [h1, shiftH(b, 5), shiftH(b, 3), b], ["Mercury", k1], "support", ["signification", "nakshatra", "condition"], 1),
    lay("2", S + " can get the training or qualification that leads to " + o, [h1, shiftH(b, 4), shiftH(b, 5), shiftH(b, 9)], ["Jupiter", "Mercury", k1], "support", ["signification", "yoga", "combination"], 1),
    lay("3", "The field of " + o + " is open to " + S + " as work or income", [h1, shiftH(b, 10), shiftH(b, 6), shiftH(b, 11)], [k1, k2], "support", ["signification", "combination", "dictum"], 1),
    lay("4", S + " has the resources and support to take up " + o, [h1, shiftH(b, 2), shiftH(b, 11), shiftH(b, 9)], ["Jupiter", k1], "support", ["yoga", "combination", "nakshatra"], 1),
    lay("5", S + " has the temperament and character that " + o + " needs", [h2, b, shiftH(b, 3)], [k2, "Mars"], "support", ["condition", "nakshatra", "signification"], 1),
    lay("6", "Circumstances and people around " + S + " favour " + o, [h1, shiftH(b, 4), shiftH(b, 7)], [k1, "Moon"], "support", ["signification", "condition", "dictum"], 1),
    lay("7", S + " can keep up the sustained effort and discipline " + o + " asks for", [h3, shiftH(b, 6), shiftH(b, 10)], ["Saturn", k1], "support", ["condition", "combination", "nakshatra"], 1),
    lay("8", "The running periods and transits are timed for " + o, [h1, shiftH(b, 10), shiftH(b, 11)], [k1, k2], "support", ["dasha", "transit", "signification"], 1),
    lay("9", S + " earns recognition, status or result in " + o, [h1, shiftH(b, 10), shiftH(b, 11), shiftH(b, 9)], ["Sun", k1], "support", ["yoga", "dictum", "signification"], 1),
    lay("10", S + " stays with " + o + " and does not drop it", [h2, shiftH(b, 10), shiftH(b, 2)], ["Saturn", k1], "support", ["combination", "dasha", "nakshatra"], 1)
  ];
}
function writeCountLayers(opt, kind, includingNative, nativeGender) {
  const kids = kind === "children";
  let m = opt.m, f = opt.f; if (!kids && includingNative) { if (nativeGender === "female") f = Math.max(0, f - 1); else m = Math.max(0, m - 1); }
  const tot = m + f, one = kids ? "child" : "sibling";
  const hMain = kids ? 5 : 3, hAlt = kids ? 9 : 11, kMain = kids ? "Jupiter" : "Mars", kFem = ["Venus", "Moon", "Mercury"], kMal = kids ? ["Jupiter", "Sun", "Mars"] : ["Mars", "Sun", "Jupiter"];
  const s = tot > 0 ? "support" : "afflict";
  const L = [];
  L.push(lay("1", tot > 0 ? "The native has " + tot + " " + one + (tot > 1 ? "s" : "") + " in all, the line is open" : "The native has no " + one + ", the line is shut", [hMain, hAlt, 2, 11, 1], [kMain], s, ["signification", "yoga", "combination"], 1));
  L.push(lay("2", m > 0 ? "The male line is strong, " + m + " male " + one + (m > 1 ? "s" : "") : "The male line is weak, no male " + one, [hMain, hAlt, 11], kMal, m > 0 ? "support" : "afflict", ["signification", "condition", "nakshatra"], 1));
  L.push(lay("3", f > 0 ? "The female line is strong, " + f + " female " + one + (f > 1 ? "s" : "") : "The female line is weak, no female " + one, [hMain, 2, 11], kFem, f > 0 ? "support" : "afflict", ["signification", "condition", "nakshatra"], 1));
  L.push(lay("4", tot >= 2 ? "More than one channel supports the line, room for " + tot : tot === 1 ? "A single restricted channel gives only the one " + one : "No channel supports a " + one, [hMain, hAlt, 11, 3, 7], tot >= 2 ? [kMain, "Venus"] : ["Saturn", kMain], tot >= 2 ? "support" : "afflict", ["combination", "yoga", "dictum"], 1));
  L.push(lay("5", "A period that supports the line has run or runs by the date asked", [hMain, hAlt, 2], [kMain], "support", ["dasha", "transit", "signification"], 1));
  L.push(lay("6", "The " + one + (tot > 1 ? "s" : "") + " thrive and are kept", [hMain, 1, hAlt], [kMain, "Sun"], tot > 0 ? "support" : "afflict", ["condition", "nakshatra", "dictum"], 1));
  L.push(lay("7", kids ? "The partner and the marriage support children" : "The elder and younger side of the family support the line", kids ? [7, 5, 2] : [11, 3, 9], kids ? ["Venus", "Jupiter"] : ["Mars", "Jupiter"], "support", ["signification", "combination", "yoga"], 1));
  L.push(lay("8", "The timing and age of the native fit the line", kids ? [7, 5, 9] : [3, 11, 1], [kMain], "support", ["dasha", "transit", "nakshatra"], 1));
  L.push(lay("9", "The planets of the line are not hurt by Saturn, Mars, Rahu or Ketu", [hMain, hAlt], [kMain, "Venus"], tot > 0 ? "support" : "afflict", ["condition", "combination", "signification"], 1));
  L.push(lay("10", "The size of the family fits the whole chart", [hMain, 11, 3, 1], [kMain, "Venus"], tot > 1 ? "support" : "afflict", ["combination", "dictum", "nakshatra"], 1));
  return L;
}
function writeParentLayers(opt) {
  const L = []; let n = 0;
  [["father", opt.father, 9, "Sun", ["Jupiter"]], ["mother", opt.mother, 4, "Moon", ["Venus"]]].forEach(([who, alive, b, kar, helpers]) => {
    const d = alive ? "support" : "afflict"; const verb = alive ? "is alive" : "is gone";
    const eighth = shiftH(b, 8), second = shiftH(b, 2), seventh = shiftH(b, 7);
    L.push(lay(String(++n), "The " + who + " " + verb + ", the karaka of the " + who + " " + (alive ? "stands strong" : "stands weak or hurt"), [b], [kar].concat(helpers), d, ["signification", "nakshatra", "condition"], 1));
    L.push(lay(String(++n), "The " + who + " " + verb + ", the house of the " + who + " " + (alive ? "is protected" : "is damaged"), [b, 1, 5], [kar], d, ["condition", "combination", "dictum"], 1));
    L.push(lay(String(++n), "The " + who + " " + verb + ", the 8th house from the " + who + " " + (alive ? "is quiet" : "is struck"), [eighth, b], [kar, "Saturn"], d, ["condition", "combination", "dictum"], 1));
    L.push(lay(String(++n), "The " + who + " " + verb + ", the killer houses of the " + who + " " + (alive ? "are not engaged" : "are engaged"), [second, seventh, eighth], [kar, "Saturn"], d, ["combination", "yoga", "nakshatra"], 1));
    L.push(lay(String(++n), "The " + who + " " + verb + ", the periods and transits " + (alive ? "protect" : "end the life of the " + who), [b, eighth, second], [kar], d, ["dasha", "transit", "signification"], 1));
  });
  return L;
}
const SCRIPT_LEVEL = /(10th|12th|matric|graduate|post.?graduate|master|bachelor|phd|doctorate|diploma|illiterate|school pass|दसवीं|बारहवीं|स्नातक)/i;
function writeLayers(opt, prof, q, ctx) {
  // chart free. Returns { family, layers } or null when no layer can be written
  if (opt.type === "children" || opt.type === "siblings") return { family: opt.type, layers: writeCountLayers(opt, opt.type, q.includingNative !== false, ctx.gender) };
  if (opt.type === "parents") return { family: "parents", layers: writeParentLayers(opt) };
  if (!prof) return null;
  const whose = whoseOf(q.text + " " + opt.text);
  const disease = /^dis\./.test(prof.id);
  return { family: disease ? "disease" : /^rel\./.test(prof.id) ? "relation" : "entry", whose, layers: writeEntryLayers(opt, prof, whose, disease) };
}
function checkLayers(set) {
  // section 13.2 rules 1 to 4 and the engine rule. Returns problems, an empty list when the set is lawful
  const bad = [];
  if (set.length !== FIXED.layers) bad.push("not 10 layers");
  set.forEach(l => {
    if (l.houses.length > FIXED.maxHouses) bad.push(l.id + " more than 5 houses"); if (l.kar.length > FIXED.maxKar) bad.push(l.id + " more than 3 karakas");
    if (!l.subj) bad.push(l.id + " names nothing of the option subject"); if (["support", "afflict"].indexOf(l.dir) < 0) bad.push(l.id + " no direction");
    if (!l.tests.some(t => TESTS.indexOf(t) >= 0 && t !== "condition" || false) && l.tests.length < 1) bad.push(l.id + " no test");
    if (!l.tests.some(t => ["combination", "yoga", "dictum", "signification", "nakshatra", "dasha", "transit"].indexOf(t) >= 0)) bad.push(l.id + " no test that reads beyond the house");
  });
  return bad;
}

// ------------------------------------------------------------------ SCORING A LAYER, section 13.3
function scoreLayer(C, M, L, lords, tr, opts) {
  opts = opts || {};
  const sup = L.dir === "support";
  const hv = L.houses.map(h => sup ? M.hs(h) : M.af(h)); const Hm = hv.reduce((a, b) => a + b, 0) / hv.length;
  const kv = L.kar.filter(k => C.P[k]).map(k => sup ? M.ks(k) : M.kaf(k)); const Km = kv.length ? kv.reduce((a, b) => a + b, 0) / kv.length : Hm;
  let link = 0; L.kar.forEach(k => { if (C.P[k] && L.houses.some(h => M.linkHouse(k, h))) link += SCALE.linkEach; }); link = Math.min(SCALE.linkCap, link);
  const N = FIXED.wHouse * Hm + FIXED.wKar * Km + link + SCALE.dictumPolarity + (sup ? SCALE.supportShift : SCALE.afflictShift);
  const lk = x => L.kar.indexOf(x) >= 0 || L.houses.some(h => M.linkHouse(x, h));
  const m = x => !lk(x) ? 0 : (sup ? M.ks(x) - SCALE.dashaSupportRef : M.kaf(x) - SCALE.dashaAfflictRef);
  const wsum = (lords.md ? FIXED.wMD * m(lords.md) : 0) + (lords.ad ? FIXED.wAD * m(lords.ad) : 0) + (opts.noPD || !lords.pd ? 0 : FIXED.wPD * m(lords.pd));
  const D = FIXED.dashaWeight * wsum;
  let Tt = 0;
  if (tr) {
    const T = tr.T, houseSigns = L.houses.map(h => C.houseSign(h));
    const hit = n => houseSigns.some(s => T[n] === s || tr.asp(n).indexOf(s) >= 0);
    if (sup) Tt = FIXED.transitWeight * ((hit("Jupiter") ? 1 : 0) + (hit("Saturn") ? 0.5 : 0));
    else { const sa = hit("Saturn"); const pair = ["Mars", "Rahu", "Ketu"].some(n => T[n] === T.Saturn || hit(n)); Tt = FIXED.transitWeight * (sa && pair ? 1 : sa ? 0.5 : 0); }
  }
  const S = N + D + Tt;
  return { N, D, T: Tt, S, hv, kv, link };
}
function layerPoints(C, M, L, sat, jai) {
  if (!sat) return { pts: 0, strong: 0, raja: 0 };
  const pl = new Set(); L.kar.forEach(k => pl.add(k)); L.houses.forEach(h => pl.add(C.houseLord(h)));
  const strongN = Array.from(pl).filter(n => C.P[n] && L.dir === "support" && (strong(C.P[n]) || M.ks(n) >= SCALE.strongKar)).length;
  const sPts = Math.min(FIXED.strongMax, 0.1 * strongN);
  let rPts = 0;
  if (L.dir === "support") { const hit = jai.filter(j => j.planets.split("+").some(n => pl.has(n))).length; rPts = Math.min(FIXED.rajaMax, 0.1 * hit); }
  return { pts: Math.min(FIXED.layerMax, FIXED.perLayer + sPts + rPts), strong: sPts, raja: rPts };
}

// ------------------------------------------------------------------ POPULATION PRIORS. Analyst memory tier T4, never from the Quad file, written HAND ARITHMETIC
const SURV_M = [[40, 96], [50, 91], [55, 87], [60, 80], [65, 71], [70, 60], [75, 47], [80, 33], [85, 19], [90, 9], [100, 0]];
const SURV_F = [[40, 97], [50, 94], [55, 91], [60, 86], [65, 78], [70, 68], [75, 55], [80, 41], [85, 26], [90, 13], [100, 0]];
function interp(t, a) { if (a < t[0][0]) return t[0][1] / 100; for (let i = 1; i < t.length; i++) if (a <= t[i][0]) { const [x0, y0] = t[i - 1], [x1, y1] = t[i]; return (y0 + (y1 - y0) * (a - x0) / (x1 - x0)) / 100; } return 0; }
function tfr(year) { return year < 1960 ? 5.9 : year < 1970 ? 5.6 : year < 1980 ? 4.9 : year < 1990 ? 4.2 : year < 2000 ? 3.5 : year < 2010 ? 2.9 : 2.3; }
function popPrior(C, q, opts, parsed) {
  const age = C.age, year = Number(String(C.cfg.date).slice(0, 4));
  const t = parsed[0].type;
  if (t === "parents" && parsed.every(o => o.type === "parents")) {
    const pf = interp(SURV_M, age + 28), pm = interp(SURV_F, age + 25);
    const sc = parsed.map(o => (o.father ? pf : 1 - pf) * (o.mother ? pm : 1 - pm));
    return { sc, reason: "life table of the parents ages", note: "father alive " + f2(pf) + ", mother alive " + f2(pm) };
  }
  if (t === "siblings" && parsed.every(o => o.type === "siblings")) {
    const exp = tfr(year) + 0.8; const incl = q.includingNative !== false;
    const sc = parsed.map(o => { const tot = o.m + o.f + (incl ? 0 : 1); const d = tot - exp; const g = (o.m + o.f) > 0 ? o.m / (o.m + o.f) : 0.5; return Math.exp(-0.5 * d * d / 2.5) * Math.exp(-4 * Math.pow(g - 0.515, 2)); });
    return { sc, reason: "family size of the birth year", note: "expected family size " + f2(exp) + " by an analyst table of the Indian birth rate" };
  }
  if (t === "children" && parsed.every(o => o.type === "children")) {
    const pn = [0.08, 0.14, 0.38, 0.22, 0.12, 0.06]; // children of a woman near the end of her fertility, India. For a man of the same age the same table is used
    const sc = parsed.map(o => { const n = Math.min(5, o.m + o.f); let c = 1; for (let i = 1; i <= o.f; i++) c = c * (o.m + i) / i; return (pn[n] || 0.03) * c * Math.pow(0.515, o.m) * Math.pow(0.485, o.f); });
    return { sc, reason: "child count and sex ratio", note: "analyst table of the number of children and 0.515 male births" };
  }
  return null;
}

// ------------------------------------------------------------------ THE FOUR SYSTEM READING, evaluators of the quad_rules.json rows
const idx = ab => globalThis.VNQuadDasha.engines.SIGNS.indexOf(ab);
function ctxOf(C) {
  const E = C.E, run = C.run, st = C.stab && C.stab.res || {};
  const ok = (key, m) => !st[key] || st[key][m] !== false;
  const chIdx = idx(run.chara), kcIdx = idx(run.kcd);
  const row = C.rows.chara.find(r => r.a <= C.age && C.age < r.b);
  const subs = row ? E.charaSubs(row.sign, row.b - row.a, C.X.lagna) : [];
  const off = C.age - (row ? row.a : 0);
  const sub = subs.find(s => rn(s.start) <= off && off < rn(s.start) + rn(s.len));
  const plIdx = run.pl ? idx(run.pl) : null;
  return { C, E, run, chIdx, kcIdx, subIdx: sub ? sub.sign : null, plIdx, ok };
}
const HOUSEN = n => n;
function karakaPlanet(C, role) { const ab = C.kar.byRole[role]; return ab ? K2N[ab] : null; }
const fire = (fired, text) => ({ fired, text });
const aspectsSign = (C, planetSign, target) => planetSign !== target && C.E.JASP[planetSign].indexOf(target) >= 0;
const fromSign = (s, off) => (s + off) % 12;
const CLS = (C, n) => {
  // functional class of a planet, section 6 rule 1, by lordship only
  const fr = globalThis.VNQuadDasha.frames.lpFrame(C.X.sg, C.X.lagna).find(x => x.p === N2K[n]); if (!fr) return "none";
  if (fr.yogakaraka) return "Yogakaraka";
  const o = fr.owns; if (fr.eighth && !fr.exempt8) return "Ashubha 8th";
  if (o.some(h => [1, 5, 9].indexOf(h) >= 0)) return "Shubha";
  if (o.some(h => [3, 6, 11].indexOf(h) >= 0)) return "Ashubha Trishadaya";
  if (o.some(h => [4, 7, 10].indexOf(h) >= 0)) return fr.dosha ? "Ashubha kendra dosha" : "Neutral kendra";
  if (o.some(h => [2, 12].indexOf(h) >= 0)) return "Neutral";
  return "none";
};
const isMaraka = (C, n) => { const fr = globalThis.VNQuadDasha.frames.lpFrame(C.X.sg, C.X.lagna).find(x => x.p === N2K[n]); return !!fr && (fr.owns.indexOf(2) >= 0 || fr.owns.indexOf(7) >= 0); };
const lords2 = C => ({ md: K2N[C.run.vimMD], ad: K2N[C.run.vimAD] });
const related = (C, a, b) => globalThis.VNQuadDasha.frames.sambandha(C.X.sg, N2K[a], N2K[b]) !== "UNRELATED";
const EVAL = {
  ch_karaka(c, r) {
    const p = r.params, pl = karakaPlanet(c.C, p.role); if (!pl) return fire(null, "no karaka");
    const ks = c.C.P[pl].sign; const hit = [];
    [["main", c.chIdx], ["sub", c.subIdx]].forEach(([tag, s]) => { if (s === null || s === undefined) return; p.offsets.forEach(o => { const t = fromSign(s, o); if (ks === t || aspectsSign(c.C, ks, t)) hit.push(tag + " sign " + SIGNN[s] + " offset " + o); }); });
    return fire(hit.length > 0, p.role + " " + pl + " in " + SIGNN[ks] + (hit.length ? " links " + hit.join(", ") : " links neither the main sign " + SIGNN[c.chIdx] + " nor the sub sign " + (c.subIdx === null ? "none" : SIGNN[c.subIdx]) + " at the offsets"));
  },
  ch_karaka_multi(c, r) {
    const p = r.params; const pls = p.roles.map(x => karakaPlanet(c.C, x)).concat(p.planets).filter(Boolean); const hit = [];
    pls.forEach(pl => { const ks = c.C.P[pl].sign; [["main", c.chIdx], ["sub", c.subIdx]].forEach(([tag, s]) => { if (s === null) return; p.offsets.forEach(o => { const t = fromSign(s, o); if (ks === t || aspectsSign(c.C, ks, t)) hit.push(pl + " " + tag + " offset " + o); }); }); });
    return fire(hit.length > 0, p.tag + " " + (hit.length ? hit.join(", ") : "no link"));
  },
  ch_dk_refs(c) {
    const C = c.C, dk = karakaPlanet(C, "DK"), F = globalThis.VNQuadDasha.frames; const ds = C.P[dk].sign;
    const refs = { DKN: C.P[dk].navamsaSign, UL: F.pada(C.X.sg, C.X.lagna, 12), DP: F.pada(C.X.sg, C.X.lagna, 7) };
    const hit = Object.keys(refs).filter(k => ds === refs[k] || ds === fromSign(refs[k], 6) || aspectsSign(C, ds, refs[k]) || aspectsSign(C, ds, fromSign(refs[k], 6)));
    return fire(hit.length > 0, "DK " + dk + " in " + SIGNN[ds] + " against DKN " + SIGNN[refs.DKN] + ", UL " + SIGNN[refs.UL] + ", DP " + SIGNN[refs.DP] + (hit.length ? " links " + hit.join(", ") : " links none"));
  },
  kc_sector(c, r) {
    const C = c.C, p = r.params; if (!c.ok("kcd", 5)) return fire("UNSTABLE", "Kaal Chakra sign moves at 5 minutes of birth time, claim withdrawn for this date");
    const E = c.E, sg = c.kcIdx; const hit = []; const notes = [];
    const planets = p.karaka.filter(n => C.P[n]);
    p.houses.forEach(n => {
      const t = fromSign(sg, n - 1);
      const d1 = planets.some(pl => C.P[pl].sign === t || (E.PASP[N2K[pl]] || [6]).some(o => (C.P[pl].sign + o) % 12 === t));
      let all = d1; const vtxt = [];
      p.vargas.forEach(v => { if ([9, 7, 3].indexOf(v) < 0) { notes.push("D" + v + " not computed"); return; }
        const ok = planets.some(pl => { const vs = E.varga(C.X.lon[N2K[pl]], v); return vs === t || (E.PASP[N2K[pl]] || [6]).some(o => (vs + o) % 12 === t); }); vtxt.push("D" + v + (ok ? " yes" : " no")); all = all && ok; });
      if (all) hit.push(SIGNN[t] + " (" + (n) + "th from " + SIGNN[sg] + ") D1 " + (d1 ? "yes" : "no") + " " + vtxt.join(" "));
    });
    const flag = c.ok("kcd", 15) ? "" : ", shifts at 15 minutes, flag kept";
    return fire(hit.length > 0, "dasha sign " + SIGNN[sg] + " " + p.tag + (hit.length ? " active " + hit.join("; ") : " not active") + (notes.length ? ", " + Array.from(new Set(notes)).join(" ") + ", HAND ARITHMETIC" : "") + flag + ", Singh's own aspect table is not in the file so the Parashari aspects are used");
  },
  vim_lord_of(c, r) { const n = lords2(c.C)[r.params.who.toLowerCase()]; const ok = c.C.P[n].lordships.indexOf(r.params.house) >= 0; return fire(ok, r.params.who + " lord " + n + (ok ? " lords" : " does not lord") + " house " + r.params.house); },
  vim_loose(c, r) { const L = lords2(c.C), h = r.params.house, C = c.C; const hit = ["md", "ad"].filter(k => C.P[L[k]].lordships.indexOf(h) >= 0 || C.P[L[k]].house === h || C.grahaAsp(L[k], h)); return fire(hit.length > 0, "MD " + L.md + " AD " + L.ad + (hit.length ? " link house " + h + " by " + hit.join(" and ") : " do not link house " + h)); },
  vim_matrix(c) {
    const C = c.C, L = lords2(C), cm = CLS(C, L.md), ca = CLS(C, L.ad), rel = related(C, L.md, L.ad), mk_ = isMaraka(C, L.ad);
    let cell = "cell not tabulated for an MD of class " + cm + ", HAND ARITHMETIC";
    if (cm === "Yogakaraka") cell = ca === "Yogakaraka" ? (rel ? "related Yogakaraka, full rajayoga, maximum fruit" : "unrelated, class not tabulated") : ca === "Shubha" ? (rel ? "related Shubha, quite a big fruit" : "unrelated Shubha, something good") : /Ashubha/.test(ca) ? (rel ? "related Ashubha, a little more than a maraka and the big gains land here" : "unrelated Ashubha, not tabulated") : mk_ ? (rel ? "related Maraka, the least, fame without something in hand" : "unrelated Maraka, mixed by relative strength") : "AD class " + ca + " not tabulated";
    else if (/Ashubha/.test(cm)) cell = ca === "Shubha" ? (rel ? "related Shubha, mixed, the relation softens the MD lord" : "unrelated Shubha, inauspicious, the reverse rule") : ca === "Yogakaraka" ? (rel ? "related Yogakaraka, mixed leaning good" : "unrelated Yogakaraka, very inauspicious") : /Ashubha/.test(ca) ? "inauspicious, worse if 6, 8 or 12 from each other" : "AD class " + ca + " not tabulated";
    return fire(null, "MD " + L.md + " " + cm + ", AD " + L.ad + " " + ca + ", " + (rel ? "related" : "unrelated") + ", " + cell);
  },
  yg_pair(c, r) {
    const C = c.C; if (c.plIdx === null) return fire(null, "no progressed lagna"); if (!c.ok("yogini", 5)) return fire("UNSTABLE", "Yogini row moves at 5 minutes");
    const nl = K2N[C.E.NAKLORD[C.run.progNak]], dl = K2N[C.run.yoginiLord]; const hz = n => ((C.P[n].sign - c.plIdx + 12) % 12) + 1;
    const ok = hz(nl) === r.params.house && hz(dl) === r.params.house;
    return fire(ok, "progressed lagna " + SIGNN[c.plIdx] + ", nakshatra lord " + nl + " in house " + hz(nl) + ", dasha lord " + dl + " in house " + hz(dl) + " of the progressed chart");
  },
  yg_birth_lagna(c, r) { if (c.plIdx === null) return fire(null, "no progressed lagna"); if (!c.ok("yogini", 5)) return fire("UNSTABLE", "Yogini row moves at 5 minutes"); const h = ((c.C.X.lagna - c.plIdx + 12) % 12) + 1; return fire(h === r.params.house, "birth lagna " + SIGNN[c.C.X.lagna] + " is house " + h + " of the progressed chart, progressed lagna " + SIGNN[c.plIdx]); },
  yg_11th(c) { if (c.plIdx === null) return fire(null, "no progressed lagna"); if (!c.ok("yogini", 5)) return fire("UNSTABLE", "Yogini row moves at 5 minutes"); const b11 = fromSign(c.C.X.lagna, 10), h = ((c.C.X.lagna - c.plIdx + 12) % 12) + 1; return fire(c.plIdx === b11 || h === 11, "progressed lagna " + SIGNN[c.plIdx] + ", birth 11th " + SIGNN[b11] + ", birth lagna is house " + h + " of the progressed chart"); },
  yg_goel3(c) { const C = c.C, nl = K2N[C.E.NAKLORD[C.run.progNak]], dl = K2N[C.run.yoginiLord]; const ok = nl === dl || C.P[nl].sign === C.P[dl].sign || C.grahaAsp(dl, C.P[nl].house) || C.grahaAsp(nl, C.P[dl].house); return fire(ok, "dasha lord " + dl + " and nakshatra lord " + nl + (ok ? " are tied" : " are not tied")); },
  yg_maraka(c) { const C = c.C, nl = K2N[C.E.NAKLORD[C.run.progNak]], dl = K2N[C.run.yoginiLord]; const ok = isMaraka(C, nl) || isMaraka(C, dl); return fire(ok, "Yogini lord " + dl + " nakshatra lord " + nl + (ok ? " include a maraka" : " include no maraka")); },
  ch_dasha_house(c, r) { const s = c.C.houseSign(r.params.house); return fire(c.chIdx === s, "Chara dasha " + SIGNN[c.chIdx] + ", sign of house " + r.params.house + " is " + SIGNN[s]); },
  ch_sub_68(c) { if (c.subIdx === null) return fire(null, "no sub sign"); const ak = karakaPlanet(c.C, "AK"), aks = c.C.P[ak].sign; const six = c.subIdx === fromSign(c.chIdx, 5), eight = c.subIdx === fromSign(c.chIdx, 7); return fire(six || eight, "main " + SIGNN[c.chIdx] + ", sub " + SIGNN[c.subIdx] + (six ? " is the 6th" : eight ? " is the 8th" : " is neither the 6th nor the 8th") + ((six || eight) && (aks === c.subIdx || aspectsSign(c.C, aks, c.subIdx)) ? ", and the AK " + ak + " looks at it" : "")); },
  ch_ak_8th(c) { const ak = karakaPlanet(c.C, "AK"), aks = c.C.P[ak].sign; const hit = [["main", c.chIdx], ["sub", c.subIdx]].filter(([t, s]) => s !== null && aks === fromSign(s, 7)); return fire(hit.length > 0, "AK " + ak + " in " + SIGNN[aks] + (hit.length ? " is the 8th from the " + hit.map(h => h[0]).join(" and ") + " sign" : " is not the 8th from the running signs")); },
  ch_cautions(c, r) { const a = EVAL.ch_sub_68(c), b = EVAL.ch_ak_8th(c), d = EVAL.ch_dasha_house(c, { params: { house: 6 } }); return fire(!!(a.fired || b.fired || d.fired), "6 or 8 sub " + a.fired + ", AK 8th " + b.fired + ", dasha of the 6th " + d.fired); },
  ch_dasha_sign(c, r) { const ss = r.params.signs; const hit = [["main", c.chIdx], ["sub", c.subIdx]].filter(([t, s]) => s !== null && ss.indexOf(s) >= 0); return fire(hit.length > 0, "main " + SIGNN[c.chIdx] + ", sub " + (c.subIdx === null ? "none" : SIGNN[c.subIdx]) + (hit.length ? " is " + r.params.tag : " is not " + r.params.tag)); },
  ch_ak_dasha(c) { const aks = c.C.P[karakaPlanet(c.C, "AK")].sign; const ok = c.chIdx === aks || aks === fromSign(c.chIdx, 9); return fire(ok, "AK sign " + SIGNN[aks] + ", Chara dasha " + SIGNN[c.chIdx]); },
  ch_amk_place(c) { const am = karakaPlanet(c.C, "AmK"); const h = c.C.P[am].house; const ok = [1, 4, 5, 7, 9, 10, 11].indexOf(h) >= 0; return fire(ok, "AmK " + am + " is in house " + h + " from the Lagna, " + (ok ? "kendra, trikona or 11th" : "outside kendra, trikona and 11th")); },
  ch_rajayogas(c) { const C = c.C, F = globalThis.VNQuadDasha.frames; const d1 = F.jaiminiRajayogas(C.X.sg, C.X.lagna, C.kar, false, C.X.lon), d9 = F.jaiminiRajayogas(C.X.sg, C.X.lagna, C.kar, true, C.X.lon); return fire(d9.length > 0, "D1 pairs " + (d1.map(x => x.pair).join(" ") || "none") + ", D9 pairs that stay " + (d9.map(x => x.pair).join(" ") || "none")); },
  ch_ak_amk(c) { const C = c.C, ak = karakaPlanet(C, "AK"), am = karakaPlanet(C, "AmK"); const h = ((C.P[am].sign - C.P[ak].sign + 12) % 12) + 1; const t = h === 10 ? "the 10th, the best place found by Rao" : [1, 4, 5, 7, 9, 11].indexOf(h) >= 0 ? "kendra, trikona or 11th, high position with little struggle" : [6, 8, 12].indexOf(h) >= 0 ? "6th, 8th or 12th, struggle" : "no stated reading"; return fire([10, 1, 4, 5, 7, 9, 11].indexOf(h) >= 0, "AmK " + am + " is house " + h + " from the AK " + ak + ", " + t); },
  kc_dasha_sign(c, r) { const ok = r.params.signs.indexOf(c.kcIdx) >= 0; if (!c.ok("kcd", 5)) return fire("UNSTABLE", "Kaal Chakra sign moves at 5 minutes"); return fire(ok, "Kaal Chakra dasha " + SIGNN[c.kcIdx] + (ok ? " is " : " is not ") + r.params.tag); },
  kc_deha_jiva(c) { if (!c.ok("kcd", 5)) return fire("UNSTABLE", "Kaal Chakra sign moves at 5 minutes"); const pkg = c.E.kcd(c.C.X.lon.Mo).pkg; const ok = c.run.kcd === pkg.deha || c.run.kcd === pkg.jeeva; return fire(ok, "Kaal Chakra " + c.run.kcd + ", deha " + pkg.deha + ", jiva " + pkg.jeeva); },
  kc_maraka(c) {
    if (!c.ok("kcd", 5)) return fire("UNSTABLE", "Kaal Chakra sign moves at 5 minutes");
    const C = c.C, s = c.kcIdx, h = ((s - C.X.lagna + 12) % 12) + 1; const pairs = [[1, "Saturn"], [3, "Jupiter"], [6, "Venus"], [7, "Mercury"], [7, "Mars"], [8, "Moon"], [9, "Rahu"], [12, "Sun"]];
    const hit = pairs.filter(([hh, pl]) => hh === h && C.P[pl].sign === s);
    return fire(hit.length > 0, "Kaal Chakra sign " + SIGNN[s] + " is house " + h + (hit.length ? " with " + hit.map(x => x[1]).join(" ") + ", a maraka state of Jataka Parijata 17, death only when the span of life is complete, otherwise accident, illness, debt, stigma" : ", no maraka state of the eight"));
  },
  kc_resilience(c) { const C = c.C, M = mk(C); const ll = C.houseLord(1); const weak = M.ks(ll) < 0.9 && M.ks("Moon") < 0.9; const sec = [fromSign(C.P.Moon.sign, 1), fromSign(C.P.Moon.sign, 11), C.P.Moon.sign]; const kem = !["Mars", "Mercury", "Jupiter", "Venus", "Saturn"].some(n => sec.indexOf(C.P[n].sign) >= 0); const shak = [6, 8, 12].indexOf(((C.P.Jupiter.sign - C.P.Moon.sign + 12) % 12) + 1) >= 0; return fire(weak || kem || shak, "lagna lord " + ll + " strength " + f2(M.ks(ll)) + ", Moon " + f2(M.ks("Moon")) + ", Kemadruma " + kem + ", Shakata " + shak); },
  kc_gati(c) { if (!c.ok("kcd", 5)) return fire("UNSTABLE", "Kaal Chakra sign moves at 5 minutes"); return fire(!!c.run.kcdGati, "Kaal Chakra move at this date " + (c.run.kcdGati || "none")); },
  kc_childhood(c) { return fire(c.C.age < 18, "age " + f2(c.C.age) + (c.C.age < 18 ? ", the dasha describes the family and guardians first" : ", an adult, the dasha describes the native")); },
  vim_yk_related(c) { const C = c.C, L = lords2(C); const ok = CLS(C, L.md) === "Yogakaraka" && CLS(C, L.ad) === "Shubha" && related(C, L.md, L.ad); return fire(ok, "MD " + L.md + " " + CLS(C, L.md) + ", AD " + L.ad + " " + CLS(C, L.ad) + ", " + (related(C, L.md, L.ad) ? "related" : "unrelated")); },
  vim_yk_related_malefic(c) { const C = c.C, L = lords2(C); const ok = CLS(C, L.md) === "Yogakaraka" && /Ashubha/.test(CLS(C, L.ad)) && related(C, L.md, L.ad); return fire(ok, "MD " + L.md + " " + CLS(C, L.md) + ", AD " + L.ad + " " + CLS(C, L.ad) + ", " + (related(C, L.md, L.ad) ? "related" : "unrelated")); },
  vim_yk_related_maraka(c) { const C = c.C, L = lords2(C); const ok = CLS(C, L.md) === "Yogakaraka" && isMaraka(C, L.ad) && related(C, L.md, L.ad); return fire(ok, "MD " + L.md + " " + CLS(C, L.md) + ", AD " + L.ad + (isMaraka(C, L.ad) ? " maraka" : " not maraka") + ", " + (related(C, L.md, L.ad) ? "related" : "unrelated")); },
  vim_exchange(c, r) { const C = c.C, F = globalThis.VNQuadDasha.frames; const hit = r.params.pairs.filter(([a, b]) => { const la = C.houseLord(a), lb = C.houseLord(b); return la !== lb && F.sambandha(C.X.sg, N2K[la], N2K[lb]) === "EXCHANGE"; }); return fire(hit.length > 0, hit.length ? "exchange of the lords of " + hit.map(x => x.join(" and ")).join(", ") : "no exchange of the lords of the 1 and 10 or the 9 and 10"); },
  vim_maraka(c) { const C = c.C, L = lords2(C); const ok = isMaraka(C, L.md) || isMaraka(C, L.ad); return fire(ok, "MD " + L.md + (isMaraka(C, L.md) ? " maraka" : "") + ", AD " + L.ad + (isMaraka(C, L.ad) ? " maraka" : "") + ((ok) ? "" : ", neither is a maraka")); },
  vim_maraka_order(c) { const C = c.C, L = lords2(C), F = globalThis.VNQuadDasha.frames; const rows = F.marakas(C.X.sg, C.X.lagna).rows; const hit = rows.filter(r => r[1].split(" ").some(x => [N2K[L.md], N2K[L.ad]].indexOf(x) >= 0)).map(r => r[0]); return fire(hit.length > 0, hit.length ? "MD or AD lord is in the maraka order at " + hit.join("; ") : "MD " + L.md + " and AD " + L.ad + " are not in the maraka order"); },
  vim_death_ad(c) { const C = c.C, L = lords2(C); const ca = CLS(C, L.ad), rel = related(C, L.md, L.ad); const t = ca === "Yogakaraka" ? "never in a Yogakaraka antardasha" : /Ashubha/.test(ca) ? (rel ? "related Ashubha, a suspected killer" : "unrelated Ashubha, death can come") : ca === "Shubha" ? (rel ? "related Shubha, not in it" : "unrelated Shubha, not stated") : "class " + ca + " not stated"; return fire(/Ashubha/.test(ca) && !rel, "AD " + L.ad + " " + ca + ", " + t + ". A death date is never given"); },
  vim_axis(c) { const C = c.C, L = lords2(C); const pairs = [[1, 7], [2, 12], [3, 11], [4, 10], [5, 9], [6, 8]]; const hit = pairs.filter(([a, b]) => (C.P[L.md].lordships.indexOf(a) >= 0 && C.P[L.ad].lordships.indexOf(b) >= 0) || (C.P[L.md].lordships.indexOf(b) >= 0 && C.P[L.ad].lordships.indexOf(a) >= 0)); return fire(hit.length > 0, "MD " + L.md + " lords " + C.P[L.md].lordships.join(",") + ", AD " + L.ad + " lords " + C.P[L.ad].lordships.join(",") + (hit.length ? ", axis pair " + hit.map(x => x.join("-")).join(" ") : ", no axis pair")); },
  vim_longevity(c) { const lg = globalThis.VNQuadDasha.frames.longevity(c.C.X.sg, c.C.X.lagna); return fire(null, "lagna lord " + K2N[lg.lagnaLord] + " " + lg.a + ", 8th lord " + K2N[lg.eighthLord] + " " + lg.b + ", result " + lg.resultType + ", class " + lg.cls); },
  vim_6th_lord(c) { const C = c.C, L = lords2(C), l6 = C.houseLord(6); return fire(L.md === l6 || L.ad === l6, "6th lord " + l6 + ", MD " + L.md + ", AD " + L.ad); },
  vim_own_ad(c) { const L = lords2(c.C); return fire(L.md === L.ad, "MD " + L.md + " AD " + L.ad + (L.md === L.ad ? " is the own antardasha, the lord does not give its good fruit now" : " is not an own antardasha")); },
  vim_venus_saturn(c) { const C = c.C, L = lords2(C); const vs = ["Venus", "Saturn"]; const ok = vs.indexOf(L.md) >= 0 && vs.indexOf(L.ad) >= 0 && L.md !== L.ad && !related(C, L.md, L.ad); return fire(ok, "MD " + L.md + " AD " + L.ad + (ok ? " are Venus and Saturn unrelated, each gives the other's result" : " is not an unrelated Venus Saturn pair")); },
  vim_kendra_trikona(c) { const C = c.C, L = lords2(C); const isK = n => C.P[n].lordships.some(h => [4, 7, 10].indexOf(h) >= 0), isT = n => C.P[n].lordships.some(h => [5, 9].indexOf(h) >= 0); const ok = (isK(L.md) && isT(L.ad)) || (isT(L.md) && isK(L.ad)); return fire(ok, "MD " + L.md + " lords " + C.P[L.md].lordships.join(",") + ", AD " + L.ad + " lords " + C.P[L.ad].lordships.join(",")); },
  vim_sadharmi(c) { const C = c.C, L = lords2(C), F = globalThis.VNQuadDasha.frames; const s = F.sadharmi(N2K[L.md], N2K[L.ad], C.X.lagna), a = F.atmasambandhi(C.X.sg, N2K[L.md], N2K[L.ad]); return fire(s || !!a, "MD " + L.md + " AD " + L.ad + ", sadharmi " + s + ", atmasambandhi " + (a || "no")); },
  vim_pbkv(c) { const C = c.C, L = lords2(C), F = globalThis.VNQuadDasha.frames; const r = F.pbkvFor(C.X.sg, N2K[L.md]); if (!r) return fire(null, "no table for " + L.md); const act = r.filter(x => x.positional).map(x => x.role + " " + K2N[x.planet]); return fire(act.length > 0, "MD " + L.md + ", " + r.map(x => x.role + " " + K2N[x.planet] + " at " + x.distance).join(", ") + (act.length ? ", positionally full " + act.join(" ") : ", none positionally full")); }
};
// which question gets which event rules
function eventOf(q, parsed, profs) {
  const t = String(q.text || "") + " " + q.options.join(" ");
  const p0 = parsed[0], id = profs.find(Boolean) ? profs.find(Boolean).id : "";
  if (p0.type === "children" || /(child|संतान|बच्चे)/i.test(q.text || "")) return "CHI";
  if (p0.type === "siblings") return "SIB";
  if (p0.type === "parents") return "PAR";
  if (/(husband|wife|spouse|marriage|marital|पति|पत्नी|विवाह|जीवनसाथी)/i.test(q.text || "")) return "MAR";
  if (/(education|degree|qualification|शिक्षा|डिग्री)/i.test(q.text || "")) return "EDU";
  if (/^rel\.(spouse|marriage|love|second|affair)/.test(id)) return "MAR";
  if (/^rel\.(child|first_child|childbirth)/.test(id)) return "CHI";
  if (/^rel\.(father|mother|parents)/.test(id)) return "PAR";
  if (/^rel\.(elder|younger|sibling)/.test(id)) return "SIB";
  if (/^deg\./.test(id)) return "EDU";
  if (/^dis\./.test(id)) return "HEA";
  if (/(property|vehicle|land|house|flat|संपत्ति)/i.test(t)) return "PRO";
  if (/(travel|abroad|foreign|visa|यात्रा|विदेश)/i.test(t)) return "TRA";
  if (/(death|longevity|age of|मृत्यु|आयु)/i.test(t)) return "DEA";
  if (/^(med|prf|biz|inc)\./.test(id)) return "CAR";
  return null;
}
function runBoard(C, event) {
  const c = ctxOf(C); const rules = QR.load().rules.filter(r => r.event === event || r.event === "ALL");
  const out = [], hand = [];
  rules.forEach(r => {
    if (!r.impl) { hand.push(r); return; }
    let res; try { res = EVAL[r.impl](c, r); } catch (e) { res = { fired: null, text: "evaluator error " + e.message }; }
    out.push({ r, res });
  });
  return { out, hand, c };
}
const labelOf = (r, res) => res.fired === "UNSTABLE" ? "UNSTABLE" : (r.label === "VACUOUS" ? "VACUOUS" : (r.label === "CLASSICAL" ? "CLASSICAL" : r.label));

// ------------------------------------------------------------------ THE COLUMN
function runQuadColumn(C, L, q, mode, H) {
  const { parseOption, profileOf } = H;
  const M = mk(C);
  const parsed = q.options.map(parseOption);
  const profs = parsed.map(o => (o.type === "entry" ? profileOf(L, o) : null));
  const k = parsed.length;
  const out = [];
  const gender = C.input.gender;
  // 1 LAYERS, written first, chart free, printed before any number
  const sets = parsed.map((o, i) => { const w = writeLayers(o, profs[i], q, { gender }); if (w) { const bad = checkLayers(w.layers); if (bad.length) throw new Error("layer set of option " + o.label + " is not lawful: " + bad.join("; ")); } return w; });
  const event = eventOf(q, parsed, profs);
  const pop = popPrior(C, q, q.options, parsed);
  const noRule = parsed.every(o => o.type === "siblings") || (parsed.every(o => o.type === "children") && parsed.some(o => o.m + o.f > 0) && parsed.some(o => o.m !== o.f));
  out.push("METHOD QUAD " + q.id);
  out.push("    Quad Dasha on the full methodology file. Vimshottari " + C.run.vimMD + " " + C.run.vimAD + ", Chara sign " + C.run.chara + ", Kaal Chakra sign " + C.run.kcd + (C.run.kcdGati ? " move " + C.run.kcdGati : "") + ", Yogini " + C.run.yogini + " lord " + C.run.yoginiLord + " progressed lagna " + C.run.pl + ". Stability at plus and minus 5 and 15 minutes " + ["vimMD", "vimAD", "chara", "kcd", "yogini"].map(s => s + (C.stab && C.stab.res[s] ? " " + (C.stab.res[s][5] === false ? "UNSTABLE at 5" : C.stab.res[s][15] === false ? "shifts at 15, flag" : "stable") : "")).join(", ") + ".");
  out.push("    PRIORS " + q.id + " k " + k + ", blind pick 1 of " + k + ", population estimate " + (pop ? parsed.length && (() => { const b = Math.max.apply(null, pop.sc); return parsed[pop.sc.indexOf(b)].label + " by " + pop.reason + ", " + pop.note + ", HAND ARITHMETIC analyst table"; })() : "none computed by the code, the analyst names it in the reply, HAND ARITHMETIC"));
  out.push("    LAYERS written before the chart, fixed scale " + SCALE.version + ", section 13.2");
  sets.forEach((w, i) => {
    const o = parsed[i];
    if (!w) { out.push("        OPTION " + o.label + " " + o.text + "  NO ENTRY, no layer can be written"); return; }
    out.push("        OPTION " + o.label + " " + o.text + "  family " + w.family + (w.whose && w.whose.who !== "native" ? " for the " + w.whose.who + " read from house " + w.whose.base + ", derived houses HAND ARITHMETIC" : ""));
    w.layers.forEach(l => out.push("            L" + l.id + " " + l.dir + " houses " + l.houses.join(",") + " karakas " + l.kar.join(",") + " tests " + l.tests.join("+") + "  " + l.text));
  });
  // 2 SCORES
  const lords = lordsAt(C.rows.vim, C.age); const lordsNoPD = { md: lords.md, ad: lords.ad, pd: null };
  const tr = transitOf(C);
  const roundTime = [0, 15, 30, 45].indexOf(Number(String(C.cfg.time).split(":")[1])) >= 0;
  const scen = {}; [-15, -5, 5, 15].forEach(m => { try { scen[m] = lordsPerturbed(C, m); } catch (e) { scen[m] = null; } });
  const F = globalThis.VNQuadDasha.frames;
  const jai = F.jaiminiRajayogas(C.X.sg, C.X.lagna, C.kar, true, C.X.lon).map(j => ({ pair: j.pair, planets: j.planets.split("+").map(x => K2N[x]).join("+") }));
  const res = sets.map((w, i) => {
    if (!w) return { o: parsed[i], none: true, label: parsed[i].label };
    let sat = 0, pts = 0, sPts = 0, rPts = 0; const rows = [];
    w.layers.forEach(l => {
      const th = l.dir === "support" ? FIXED.thSupport : FIXED.thAfflict;
      const s0 = scoreLayer(C, M, l, lords, tr), s1 = scoreLayer(C, M, l, lordsNoPD, tr, { noPD: true });
      const ok0 = s0.S >= th;
      const flips = [];
      if (l.tests.indexOf("dasha") >= 0 || true) [-5, 5].forEach(m => { if (scen[m]) { const sx = scoreLayer(C, M, l, scen[m], tr); if ((sx.S >= th) !== ok0) flips.push(m); } });
      const flip15 = [-15, 15].filter(m => scen[m] && ((scoreLayer(C, M, l, scen[m], tr).S >= th) !== ok0));
      const roundFlip = roundTime && (s1.S >= th) !== ok0;
      const unstable = flips.length > 0 || roundFlip;
      const counted = ok0 && !unstable;
      const pp = layerPoints(C, M, l, counted, jai);
      if (counted) sat++; pts += pp.pts; sPts += pp.strong; rPts += pp.raja;
      rows.push({ l, s0, ok0, unstable, flips, flip15, counted, pp, th, roundFlip });
    });
    return { o: parsed[i], w, rows, sat, pts, sPts, rPts, label: parsed[i].label };
  });
  const vac = [], used = [];
  for (let n = 1; n <= 10; n++) { const v = res.filter(r => r.rows).map(r => r.rows[n - 1].counted); if (v.length > 1 && v.every(x => x === v[0])) vac.push("L" + n); }
  const unstAll = []; res.forEach(r => { if (r.rows) r.rows.forEach(x => { if (x.unstable) unstAll.push(r.label + "L" + x.l.id); }); });
  out.push("    SCORES section 13.3, natal 0.7 houses plus 0.3 karakas, dasha at half weight MD " + lords.md + " AD " + lords.ad + " PD " + lords.pd + " with weights 0.25, 0.35, 0.40, transit at quarter weight Jupiter " + SIGNN[tr.T.Jupiter] + " Saturn " + SIGNN[tr.T.Saturn] + ", support at 1.10 and afflict at 0.60. Every number below is HAND ARITHMETIC, the pratyantar and the transit are not printed by the Quad report" + (roundTime ? ", the birth time looks rounded so each layer was also scored without the pratyantar and a flip is UNSTABLE" : "") + ".");
  res.forEach(r => {
    if (r.none) return;
    out.push("        OPTION " + r.label + " satisfied " + r.sat + " of 10, points " + f2(r.pts) + " strength points " + f2(r.sPts) + " rajayoga points " + f2(r.rPts));
    r.rows.forEach(x => out.push("            L" + x.l.id + " " + x.l.dir + " natal " + f2(x.s0.N) + " dasha " + (x.s0.D >= 0 ? "+" : "") + f2(x.s0.D) + " transit +" + f2(x.s0.T) + " = " + f2(x.s0.S) + " against " + f2(x.th) + (x.unstable ? " UNSTABLE withdrawn, flips at " + x.flips.concat(x.roundFlip ? ["no pratyantar"] : []).join(" ") : x.ok0 ? " SATISFIED" : " no") + (x.flip15.length && !x.unstable ? " shifts at 15 minutes flag" : "") + (x.counted ? " points " + f2(x.pp.pts) : "")));
  });
  out.push("    Sutton score not available in this run, and no VedNetra windows are printed by this build, sections 13.3 and 13.5. Dasha activation and the board stand beside the leader and never re rank it.");
  // 3 THE LEADER
  const live = res.filter(r => !r.none);
  let leader = null, second = null, narrow = false, tieNote = "";
  if (!live.length) { leader = res[0]; tieNote = "NO ENTRY for every option, first listed forced"; }
  else {
    const rank = live.slice().sort((a, b) => (b.sat - a.sat) || (b.sPts - a.sPts) || (b.rPts - a.rPts));
    const top = rank.filter(r => r.sat === rank[0].sat);
    leader = rank[0]; second = rank[1] || null;
    if (top.length > 1) { const bs = top.filter(r => Math.abs(r.sPts - top[0].sPts) < 1e-9); const br = bs.filter(r => Math.abs(r.rPts - bs[0].rPts) < 1e-9); tieNote = top.length + " options level on " + leader.sat + " layers, " + (bs.length === 1 ? "settled by planet strength" : br.length === 1 ? "settled by rajayoga" : "still level after planet strength and rajayoga, TIE FORCED PICK the first listed of " + br.map(x => x.label).join(","));  }
    narrow = !second || (leader.pts - second.pts) < FIXED.narrow;
  }
  // 4 THE FOUR SYSTEM BOARD
  let board = null, boardLine = "";
  if (event) {
    board = runBoard(C, event);
    out.push("    READ the four systems for the event " + event + " at the as of date, fields only. The board names the field and never the option, S3.");
    board.out.forEach(({ r, res: rr }) => out.push("        " + r.id + " " + r.system + " " + r.name + ": " + (rr.fired === "UNSTABLE" ? "UNSTABLE withdrawn" : rr.fired === null ? "read" : rr.fired ? "FIRED" : "not fired") + ", " + labelOf(r, rr) + (r.base !== null ? ", base rate " + r.base + " percent" : "") + (r.lift !== null ? ", lift " + r.lift : "") + (r.label === "VACUOUS" && rr.fired ? ", fired and not counted" : "") + ". " + rr.text));
    board.hand.filter(r => r.event === event).forEach(r => out.push("        " + r.id + " " + r.system + " " + r.name + ": not run here, " + r.label));
    const counted = board.out.filter(({ r, res: rr }) => r.event === event && r.label === "CLASSICAL" && rr.fired === true).map(x => x.r.id);
    const unfired = board.out.filter(({ r, res: rr }) => r.event === event && r.label === "CLASSICAL" && rr.fired === false).length;
    boardLine = counted.length ? "the board fires the field " + event + " by " + counted.join(" ") + ", it names the field only" : unfired ? "the board does not fire the field " + event + " on any CLASSICAL rule" : "the board has no rule that reads";
  } else boardLine = "no field of the board matches the question, HAND ARITHMETIC";
  const agree = !event || !board ? "does not separate" : (leader && leader.rows && leader.rows.filter(x => x.l.dir === "support").length >= 5 ? (board.out.some(({ r, res: rr }) => r.event === event && r.label === "CLASSICAL" && rr.fired === true) ? "agree, the field is active and the option sits in the field" : (board.out.some(({ r, res: rr }) => r.event === event && r.label === "CLASSICAL" && rr.fired === false) ? "conflict, the field is not active at this date while the leader needs it" : "does not separate")) : "does not separate, the leader is a loss or ending option and the board names fields only");
  // 5 THE CELL
  let cell = leader, why = "Rule of 10 leader", noteRule = "";
  if (noRule && pop) {
    const best = Math.max.apply(null, pop.sc); const idxs = pop.sc.map((v, i) => [v, i]).filter(x => x[0] >= best * 0.95).map(x => x[1]);
    let pickI = pop.sc.indexOf(best);
    if (idxs.length > 1) { const lead = res.filter((r, i) => idxs.indexOf(i) >= 0 && !r.none).sort((a, b) => (b.sat - a.sat) || (b.sPts - a.sPts))[0]; if (lead) pickI = res.indexOf(lead); noteRule = " tie in the population estimate within 5 percent among " + idxs.map(i => parsed[i].label).join(",") + ", settled by the Rule of 10 leader"; }
    cell = res[pickI]; why = "NO RULE field, the answer is the population estimate and the Rule of 10 leader " + (leader ? leader.label : "none") + " is a note" + noteRule;
  }
  const secondLabel = (second && cell === leader) ? second.label : (cell !== leader && leader ? leader.label : (second ? second.label : "none"));
  const satTxt = res.map(r => r.label + " " + (r.none ? "none" : r.sat)).join(", "), ptsTxt = res.map(r => r.label + " " + (r.none ? "none" : f2(r.pts))).join(", ");
  const ha = noRule ? "answer by population estimate NO RULE, " : "";
  const ev = "EVIDENCE " + q.id + " QUAD Rule of 10 on the full methodology, " + why + (noRule ? ", cell " + cell.label : " " + (leader ? leader.label : "none")) + ", layers satisfied " + satTxt + ", points " + ptsTxt + (narrow ? ", NARROW lead under 2.0" : ", lead " + (second ? f2(leader.pts - second.pts) : "n/a") + " points") + (tieNote ? ", " + tieNote : "") + ", second place " + secondLabel + ", prior 1 of " + k + ", " + ha + (event ? (board.out.filter(x => x.res.fired === true && x.r.event === event).length ? "READ rules fired " + board.out.filter(x => x.res.fired === true && x.r.event === event).map(x => x.r.id).join(" ") : "READ none fired in the field " + event + ", checked " + board.out.filter(x => x.r.event === event).map(x => x.r.id).join(" ")) : "READ none") + ", " + boardLine + ", Rule of 10 and the board " + agree + ", COMPUTED dasha facts, CLASSICAL reading, UNSTABLE " + (unstAll.length ? unstAll.join(" ") : "none") + ", VACUOUS " + (vac.length ? "layers " + vac.join(" ") + " same on every option" : "none") + (board && board.out.some(x => x.r.label === "VACUOUS" && x.res.fired) ? " and fired VACUOUS rules " + board.out.filter(x => x.r.label === "VACUOUS" && x.res.fired).map(x => x.r.id).join(" ") : "") + ", HAND ARITHMETIC scale " + SCALE.version + " pratyantar transit and layer scores, no validated hit rate, 51.8 percent against 45.3 percent without a chart and p 0.21";
  out.push("    " + ev);
  out.push("    RESULT " + q.id + " QUAD " + cell.label);
  return { lines: out, label: cell.label, second: secondLabel, narrow, leader: leader ? leader.label : null, sat: res.map(r => r.sat), points: res.map(r => r.pts), noRule, event, agree, unstable: unstAll, vac };
}

module.exports = { runQuadColumn, writeLayers, checkLayers, scoreLayer, mk, popPrior, runBoard, ctxOf, EVAL, FIXED, SCALE, eventOf, pdAt, whoseOf };
