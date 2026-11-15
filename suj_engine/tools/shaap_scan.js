#!/usr/bin/env node
/*
 * SUJ engine, KNOWLEDGE BASE 3: SHAAP DOSH scan. Round 23. Rules given by the owner in Hindi, full text in suj_engine/SHAAP_DOSH.md,
 * data in suj_engine/data/shaap_rules.json. All positions come from Vednetra, nothing is cast by hand.
 *
 * The owner's sutra. A shaap is a YOGA and not a significator. Rahu, plus an afflicted significator planet, plus the 5th or 9th or a
 * trik house, plus a running dasha, makes a shaap yoga. One or two of these alone is not called shaap. No sign and no nakshatra
 * makes a shaap, a sign only names the cause of a shaap the planets already show.
 *
 * What the tool does, for nine types, pitru, matru, sarpa, brahma, bhratru, patni, pret, matul, dev
 *   1. Tests the owner's one line rule of the type in the D1 chart (Lagna houses) and again in D9 (D9 Lagna houses).
 *   2. Tests the four pillars. P1 a node, Rahu, or Ketu where the owner allows it, or Gulika as carrier for pret and the inferior sarpa.
 *      P2 the type rule met by an afflicted significator. P3 the house link, the type's own house, or any of the 5th 9th 6th 8th 12th
 *      touched by the evidence. P4 a running dasha, the Mahadasha or Antardasha lord is one of the planets in the evidence.
 *   3. Status per chart. FORMED = rule met and P1 and P3. INDICATION = some evidence, not a shaap. NONE.
 *   4. Combines D1 and D9. Both = FORMED FULL, D1 only = FORMED HALF, D9 only = quality of fruit fault and not a shaap.
 *   5. Gives dasha status as of the date, ACTIVE NOW, TRIGGER AT PD or DORMANT, with past and future windows.
 *   6. Reads the owner's modifiers, retrograde, combust, debilitated, neecha bhanga, weak afflictor, Jupiter relief, Ketu role.
 *   7. Separate blocks for Saturn afflicted by Rahu (shapit Shani), for Gulika, and nakshatra flags that are SUPPORT ONLY.
 *
 *   node suj_engine/tools/shaap_scan.js '{"gender":"female","date":"1993-01-06","time":"07:10:00","tz":5.5,"lat":27.1333,"lon":81.9667,"asOf":"2026-11-15","topic":"children"}'
 * Options, topic (highlights the types read for it), asOf, nodeAspects "7" (default, the owner accepted the 7th aspect of the nodes) or "vednetra" (5th 7th 9th),
 * mandi true (use the end of Saturn's part for Gulika), json via the flag --json.
 *
 * Honest limits. This is the owner's rule set coded as written. It has not been tested against a chart with known outcomes. The
 * book citations are the owner's and were not checked against the books. Where the owner's text is ambiguous the reading is marked
 * proposed in shaap_rules.json. The frequency of each status in random charts is in data/shaap_frequency.json, a FORMED status is not rare.
 */
const fs = require("fs");
const path = require("path");
const KB = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "significations.json"), "utf8"));
const R = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "shaap_rules.json"), "utf8"));

const SIGN_NAMES = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const NINE = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
const MALEFICS = ["Sun", "Mars", "Saturn", "Rahu", "Ketu"];
const NODES = ["Rahu", "Ketu"];
const DUSTHANA = [6, 8, 12], KENDRA = [1, 4, 7, 10];
const CENTRAL = R.centralHouses;
const OWN = KB.ownSigns;
const EXALT = { Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6 };
const DEBIL = { Sun: 6, Moon: 7, Mars: 3, Mercury: 11, Jupiter: 9, Venus: 5, Saturn: 0 };
let FREQ = null;
try { FREQ = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "shaap_frequency.json"), "utf8")); } catch (e) { FREQ = null; }
const ORD = n => n + (n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th");
const uniq = a => Array.from(new Set(a));

// ---------- frame: one chart (D1 or D9) reduced to signs, houses and states ----------
function aspectSet(name, nodeAspects) {
  if (name === "Mars") return [4, 7, 8];
  if (name === "Jupiter") return [5, 7, 9];
  if (name === "Saturn") return [3, 7, 10];
  if (name === "Rahu" || name === "Ketu") return nodeAspects === "vednetra" ? [5, 7, 9] : [7];
  return [7];
}
function makeFrame(label, L, specs, opts) {
  const f = { label, L, P: {}, opts: opts || {}, gulika: null };
  NINE.forEach(n => {
    const s = specs[n];
    f.P[n] = { name: n, sign: s.sign, house: ((s.sign - L + 12) % 12) + 1, retro: NODES.indexOf(n) >= 0 ? true : !!s.retro, combust: !!s.combust, nakshatra: s.nakshatra, nakLord: s.nakLord, signName: SIGN_NAMES[s.sign] };
  });
  return f;
}
const dist = (a, b) => ((b - a + 12) % 12) + 1;
const lordSign = s => { for (const p of Object.keys(OWN)) if (OWN[p].indexOf(s) >= 0) return p; return null; };
const houseSign = (f, h) => (f.L + h - 1) % 12;
const houseLord = (f, h) => lordSign(houseSign(f, h));
function aspectHit(f, X, sign) { const d = dist(X.sign, sign); return aspectSet(X.name, f.opts.nodeAspects).indexOf(d) >= 0 ? d : 0; }
function relPlanet(f, X, T) {
  if (!X || !T || X.name === T.name) return null;
  if (X.sign === T.sign) return "conjunction";
  const d = aspectHit(f, X, T.sign);
  return d ? ORD(d) + " aspect" : null;
}
function relHouse(f, X, h) {
  if (X.house === h) return "occupies";
  const d = aspectHit(f, X, houseSign(f, h));
  return d ? ORD(d) + " aspect" : null;
}
function afflictPlanet(f, Tname, set) {
  const T = f.P[Tname], out = [];
  set.forEach(n => { if (n === Tname) return; const r = relPlanet(f, f.P[n], T); if (r) out.push({ by: n, how: r }); });
  return out;
}
function afflictHouse(f, h, set) {
  const out = [];
  set.forEach(n => { const r = relHouse(f, f.P[n], h); if (r) out.push({ by: n, how: r }); });
  return out;
}
function afflictLord(f, h, set) {
  const lord = houseLord(f, h);
  return { lord, list: lord ? afflictPlanet(f, lord, set) : [] };
}
function kartari(f, Tname) {
  const T = f.P[Tname], prev = (T.sign + 11) % 12, next = (T.sign + 1) % 12;
  const a = MALEFICS.filter(n => n !== Tname && f.P[n].sign === prev), b = MALEFICS.filter(n => n !== Tname && f.P[n].sign === next);
  return { ok: a.length > 0 && b.length > 0, a, b };
}
const kendraFrom = (fromSign, toSign) => KENDRA.indexOf(dist(fromSign, toSign)) >= 0;
function badhaka(f) {
  const m = f.L;
  const house = R.badhaka.movable.indexOf(m) >= 0 ? 11 : R.badhaka.fixed.indexOf(m) >= 0 ? 9 : 7;
  return { house, lord: houseLord(f, house), kind: house === 11 ? "movable" : house === 9 ? "fixed" : "dual" };
}
const descr = list => list.map(x => x.by + " " + x.how).join(", ");

// ---------- atoms ----------
function atom(f, id, ok, text, o) {
  o = o || {};
  const by = uniq(o.by || []), planets = uniq(o.planets || []);
  const houses = uniq(planets.concat(by).filter(n => f.P[n]).map(n => f.P[n].house).concat(o.houses || []));
  return { id, ok: !!ok, text, role: o.role || "support", by, planets, houses, gulikaCarrier: !!o.gulikaCarrier, p1ok: !!o.p1ok };
}

// ---------- the nine types ----------
function evalTypes(f) {
  const G = f.gulika; // D1 only, { sign, house, nakLord, ... }
  const res = {};
  const add = (id, atoms, ruleFn, extra) => { res[id] = Object.assign({ id, atoms, rule: !!ruleFn(Object.fromEntries(atoms.map(a => [a.id, a.ok]))) }, extra || {}); };
  const gulConj = (planet, label) => G && G.sign === f.P[planet].sign ? atom(f, "G_" + planet, true, "Gulika joins " + planet + " (" + label + ")", { planets: [planet], role: "support" }) : atom(f, "G_" + planet, false, "", { role: "support" });
  const gulHouse = (h, label) => G && G.house === h ? atom(f, "G_h" + h, true, "Gulika stands in the " + ORD(h) + " house (" + label + ")", { houses: [h], role: "support" }) : atom(f, "G_h" + h, false, "", { role: "support" });

  // pitru
  { const k = afflictPlanet(f, "Sun", ["Rahu", "Saturn"]), h9 = afflictHouse(f, 9, ["Rahu", "Saturn", "Ketu"]), l9 = afflictLord(f, 9, ["Rahu", "Saturn", "Ketu"]);
    add("pitru", [
      atom(f, "K", k.length, "Sun afflicted by " + descr(k), { by: k.map(x => x.by), planets: ["Sun"], role: "rule" }),
      atom(f, "H9", h9.length, "9th house influenced by " + descr(h9), { by: h9.map(x => x.by), houses: [9], role: "house" }),
      atom(f, "L9", l9.list.length, "9th lord " + l9.lord + " afflicted by " + descr(l9.list), { by: l9.list.map(x => x.by), planets: [l9.lord], houses: [9], role: "house" }),
      gulConj("Sun", "father side spoiled"), gulHouse(9, "obstruction in the father's dharma")
    ], a => a.K, { sig: ["Sun"], key: ["K"] });
    res.pitru.strong = res.pitru.atoms[0].ok && (res.pitru.atoms[1].ok || res.pitru.atoms[2].ok); }

  // matru
  { const k = afflictPlanet(f, "Moon", NODES).filter(x => x.how === "conjunction"), h4 = afflictHouse(f, 4, MALEFICS), l4 = afflictLord(f, 4, MALEFICS);
    add("matru", [
      atom(f, "K", k.length, "Moon conjoined with " + k.map(x => x.by).join(" and ") + " (eclipse yoga)", { by: k.map(x => x.by), planets: ["Moon"], role: "rule" }),
      atom(f, "H4", h4.length, "4th house influenced by " + descr(h4), { by: h4.map(x => x.by), houses: [4], role: "house" }),
      atom(f, "L4", l4.list.length, "4th lord " + l4.lord + " afflicted by " + descr(l4.list), { by: l4.list.map(x => x.by), planets: [l4.lord], houses: [4], role: "house" }),
      gulConj("Moon", "mother side and the mind spoiled")
    ], a => a.K && (a.H4 || a.L4), { sig: ["Moon"], key: ["K"] }); }

  // sarpa
  { const h5 = afflictHouse(f, 5, NODES), l5 = afflictLord(f, 5, NODES);
    const mr = f.P.Mars.sign === f.P.Rahu.sign;
    const asp5 = [f.P.Mars, f.P.Rahu].some(X => aspectHit(f, X, houseSign(f, 5)));
    const tied = mr && (f.P.Mars.house === 5 || houseLord(f, 5) === "Mars" || asp5);
    const jDus = DUSTHANA.indexOf(f.P.Jupiter.house) >= 0;
    const bd = badhaka(f), jBadhaka = bd.lord && bd.lord !== "Jupiter" && f.P[bd.lord] && f.P[bd.lord].sign === f.P.Jupiter.sign;
    const varA = jDus && houseLord(f, f.P.Jupiter.house) === "Jupiter", varB = jDus && jBadhaka;
    const cond = varA || varB;
    const kRahu = cond && kendraFrom(f.P.Jupiter.sign, f.P.Rahu.sign);
    const kGul = !!(cond && G && kendraFrom(f.P.Jupiter.sign, G.sign));
    add("sarpa", [
      atom(f, "H5", h5.length, "5th house influenced by " + descr(h5), { by: h5.map(x => x.by), houses: [5], role: "house" }),
      atom(f, "L5", l5.list.length, "5th lord " + l5.lord + " afflicted by " + descr(l5.list), { by: l5.list.map(x => x.by), planets: [l5.lord], houses: [5], role: "house" }),
      atom(f, "MR", tied, "Mars conjoined Rahu and tied to the 5th (" + (f.P.Mars.house === 5 ? "in the 5th" : houseLord(f, 5) === "Mars" ? "Mars is the 5th lord" : "aspecting the 5th") + ")", { planets: ["Mars", "Rahu"], houses: [5], role: "house" }),
      atom(f, "PMu", kRahu, "Prashna Marga form, Jupiter in a dusthana (" + (varA ? "lord of that dusthana and seated in it" : "with the badhaka lord " + bd.lord) + ") and Rahu in a kendra from Jupiter, superior serpent class", { planets: ["Jupiter", "Rahu"], role: "rule" }),
      atom(f, "PMa", kGul, "Prashna Marga form, Jupiter in a dusthana and Gulika in a kendra from Jupiter, inferior serpent class", { planets: ["Jupiter"], role: "rule", gulikaCarrier: true }),
      atom(f, "MRany", mr && !tied, "Mars conjoined Rahu but not tied to the 5th, supporting only", { planets: ["Mars", "Rahu"], role: "support" }),
      gulHouse(5, "children obstruction and past life fault")
    ], a => a.H5 || a.L5 || a.MR || a.PMu || a.PMa, { sig: [houseLord(f, 5)].filter(Boolean), key: ["H5", "L5", "MR", "PMu", "PMa"] });
    res.sarpa.causeLabel = SIGN_NAMES[f.P.Rahu.sign] && R.badhaka.movable.indexOf(f.P.Rahu.sign) >= 0 ? "Rahu stands in a movable sign, Prashna Marga names the cause as destruction of serpent eggs. A label for the cause only, never a proof." : null;
    res.sarpa.class = kRahu ? "superior serpents (Rahu in a kendra from Jupiter)" : kGul ? "inferior serpents (Gulika in a kendra from Jupiter)" : null; }

  // brahma
  { const j = f.P.Jupiter, conj = j.sign === f.P.Rahu.sign;
    const deb = DEBIL.Jupiter === j.sign, comb = !!j.combust, inH = j.house === 2 || j.house === 9;
    const rAff = afflictPlanet(f, "Jupiter", ["Rahu"]);
    add("brahma", [
      atom(f, "A", conj, "Jupiter conjoined Rahu (chandala yoga)", { by: ["Rahu"], planets: ["Jupiter"], role: "rule" }),
      atom(f, "AH", conj && inH, "the chandala conjunction stands in the " + ORD(j.house) + " house", { by: ["Rahu"], planets: ["Jupiter"], houses: [j.house], role: "house" }),
      atom(f, "B", (deb || comb) && inH, "Jupiter " + [deb ? "debilitated" : null, comb ? "combust" : null].filter(Boolean).join(" and ") + " in the " + ORD(j.house) + " house", { planets: ["Jupiter"], role: "house" }),
      atom(f, "BR", (deb || comb) && inH && rAff.length > 0 && !conj, "Rahu also afflicts Jupiter by " + descr(rAff), { by: rAff.map(x => x.by), planets: ["Jupiter"], role: "support", p1ok: true })
    ], a => a.A || a.B, { sig: ["Jupiter"], key: ["A", "B"] });
    res.brahma.heaviest = !!(conj && comb); }

  // bhratru
  { const s3h = afflictHouse(f, 3, ["Saturn"]), s3l = afflictLord(f, 3, ["Saturn"]);
    const lord3 = houseLord(f, 3);
    const hm = afflictHouse(f, 3, ["Mars", "Rahu"]), lm = afflictLord(f, 3, ["Mars", "Rahu"]);
    const bothOn = list => list.some(x => x.by === "Mars") && list.some(x => x.by === "Rahu");
    const lordMars = lord3 === "Mars" && afflictPlanet(f, "Mars", ["Rahu"]).length > 0;
    const mrOn3 = bothOn(hm) || bothOn(lm.list) || lordMars;
    const kM = afflictPlanet(f, "Mars", ["Rahu", "Saturn"]);
    add("bhratru", [
      atom(f, "S3", s3h.length || s3l.list.length, [s3h.length ? "3rd house influenced by Saturn (" + descr(s3h) + ")" : null, s3l.list.length ? "3rd lord " + lord3 + " afflicted by Saturn (" + descr(s3l.list) + ")" : null].filter(Boolean).join("; "), { by: ["Saturn"], planets: [lord3], houses: [3], role: "house" }),
      atom(f, "MR3", mrOn3, "3rd house or 3rd lord " + lord3 + " under Mars and Rahu together" + (lordMars ? " (the 3rd lord is Mars and Rahu afflicts it)" : ""), { by: ["Mars", "Rahu"], planets: [lord3], houses: [3], role: "house" }),
      atom(f, "K", kM.length, "Mars (the significator) afflicted by " + descr(kM) + ", names whose shaap it is", { by: kM.map(x => x.by), planets: ["Mars"], role: "support", p1ok: true }),
      gulConj("Mars", "brother side spoiled")
    ], a => a.S3 || a.MR3, { sig: [lord3, "Mars"].filter(Boolean), key: ["S3", "MR3"] }); }

  // patni
  { const k = afflictPlanet(f, "Venus", ["Rahu", "Saturn"]), h7 = afflictHouse(f, 7, MALEFICS), l7 = afflictLord(f, 7, MALEFICS), m = afflictPlanet(f, "Moon", ["Rahu", "Saturn"]);
    add("patni", [
      atom(f, "K", k.length, "Venus afflicted by " + descr(k), { by: k.map(x => x.by), planets: ["Venus"], role: "rule" }),
      atom(f, "H7", h7.length, "7th house influenced by " + descr(h7), { by: h7.map(x => x.by), houses: [7], role: "house" }),
      atom(f, "L7", l7.list.length, "7th lord " + l7.lord + " afflicted by " + descr(l7.list), { by: l7.list.map(x => x.by), planets: [l7.lord], houses: [7], role: "house" }),
      atom(f, "M", m.length, "Moon also afflicted by " + descr(m) + ", the yoga is strong when Moon and Venus are both afflicted", { by: m.map(x => x.by), planets: ["Moon"], role: "support" }),
      gulConj("Venus", "wife side spoiled")
    ], a => a.K && (a.H7 || a.L7), { sig: ["Venus"], key: ["K"] });
    res.patni.strong = res.patni.atoms[0].ok && res.patni.atoms[3].ok; }

  // pret
  { const rel = (X, Y) => relPlanet(f, X, Y) || relPlanet(f, Y, X);
    let aText = "", aBy = [];
    NODES.forEach(n => { const N = f.P[n], S = f.P.Saturn, r = rel(N, S); if (r && [8, 12].some(h => N.house === h || S.house === h)) { aText += (aText ? "; " : "") + n + " and Saturn related by " + r + " with " + (N.house === 8 || N.house === 12 ? n + " in the " + ORD(N.house) : "Saturn in the " + ORD(S.house)); aBy.push(n); } });
    const ll = houseLord(f, 1);
    let g1 = false, g1Text = "", g2 = false;
    const bd = badhaka(f);
    if (G) {
      const gp = { sign: G.sign, name: "Gulika", house: G.house };
      const relGul = [];
      ["Moon", "Saturn", "Rahu"].forEach(n => {
        const X = f.P[n];
        if (X.sign === G.sign) relGul.push({ n, how: "conjunction", house: X.house });
        else if (aspectHit(f, X, G.sign)) relGul.push({ n, how: ORD(aspectHit(f, X, G.sign)) + " aspect", house: X.house });
      });
      if (["Moon", "Saturn", "Rahu"].indexOf(G.nakLord) >= 0) relGul.push({ n: G.nakLord, how: "Gulika stands in its nakshatra", house: f.P[G.nakLord].house });
      const dusLink = DUSTHANA.indexOf(G.house) >= 0 || G.house === bd.house;
      g1 = relGul.length > 0 && dusLink;
      g1Text = "Gulika related to " + relGul.map(x => x.n + " by " + x.how).join(", ") + " and Gulika stands in the " + ORD(G.house) + " house, a dusthana or the badhaka house";
      g2 = dusLink;
    }
    add("pret", [
      atom(f, "A", aText, aText ? aText : "", { by: aBy, planets: ["Saturn"], role: "house" }),
      atom(f, "B", f.P[ll] && f.P[ll].house === 12, "Lagna lord " + ll + " in the 12th house", { planets: [ll], houses: [12], role: "house" }),
      atom(f, "G1", g1, g1Text, { planets: ["Moon", "Saturn", "Rahu"].filter(n => g1Text.indexOf(n) >= 0), houses: G ? [G.house] : [], role: "rule", gulikaCarrier: true }),
      atom(f, "G2", g2 && !g1, "Gulika stands in a dusthana or the badhaka house (" + (G ? ORD(G.house) : "") + "), the Prashna Marga link, but with no Moon, Saturn or Rahu relation. The owner says Gulika alone is not enough", { houses: G ? [G.house] : [], role: "support", gulikaCarrier: true })
    ], a => a.A || a.B || a.G1, { sig: [ll].filter(Boolean), key: ["A", "B", "G1"] }); }

  // matul
  { const k = afflictPlanet(f, "Mercury", ["Rahu", "Saturn"]), inH = f.P.Mercury.house === 6 || f.P.Mercury.house === 10;
    add("matul", [
      atom(f, "K", k.length, "Mercury afflicted by " + descr(k), { by: k.map(x => x.by), planets: ["Mercury"], role: "rule" }),
      atom(f, "H", inH, "Mercury stands in the " + ORD(f.P.Mercury.house) + " house", { planets: ["Mercury"], role: "house" }),
      gulConj("Mercury", "maternal uncle side spoiled")
    ], a => a.K && a.H, { sig: ["Mercury"], key: ["K"] });
    res.matul.strong = k.some(x => x.by === "Rahu") && k.some(x => x.by === "Saturn"); }

  // dev
  { const l5 = houseLord(f, 5), l9 = houseLord(f, 9), k5 = kartari(f, l5), k9 = kartari(f, l9), e5 = afflictPlanet(f, l5, ["Ketu"]).filter(x => x.how === "conjunction"), e9 = afflictPlanet(f, l9, ["Ketu"]).filter(x => x.how === "conjunction");
    add("dev", [
      atom(f, "PK5", k5.ok, "5th lord " + l5 + " in papa kartari between " + k5.a.join(" ") + " and " + k5.b.join(" "), { by: k5.a.concat(k5.b), planets: [l5], houses: [5], role: "house" }),
      atom(f, "PK9", k9.ok, "9th lord " + l9 + " in papa kartari between " + k9.a.join(" ") + " and " + k9.b.join(" "), { by: k9.a.concat(k9.b), planets: [l9], houses: [9], role: "house" }),
      atom(f, "KE5", e5.length, "5th lord " + l5 + " connected with Ketu by conjunction", { by: ["Ketu"], planets: [l5], houses: [5], role: "house" }),
      atom(f, "KE9", e9.length, "9th lord " + l9 + " connected with Ketu by conjunction", { by: ["Ketu"], planets: [l9], houses: [9], role: "house" }),
      gulConj("Jupiter", "deity or brahma wrath")
    ], a => (a.PK5 && a.PK9) || a.KE5 || a.KE9, { sig: [l5, l9].filter(Boolean), key: ["PK5", "PK9", "KE5", "KE9"] }); }
  return res;
}

// ---------- pillars, status, modifiers ----------
const TYPE = Object.fromEntries(R.types.map(t => [t.id, t]));
function judge(f, t) {
  const meta = TYPE[t.id], on = t.atoms.filter(a => a.ok);
  const core = on.filter(a => a.role !== "support" || a.p1ok);
  const involved = uniq([].concat.apply([], core.map(a => a.by.concat(a.planets))));
  const carrier = core.some(a => a.gulikaCarrier);
  const p1by = involved.filter(n => n === "Rahu" || (n === "Ketu" && meta.ketuAllowed));
  const p1 = p1by.length > 0 || carrier;
  const ownHouse = core.filter(a => a.role === "house");
  const centralTouch = core.filter(a => a.houses.some(h => CENTRAL.indexOf(h) >= 0));
  const p3 = ownHouse.length > 0 || centralTouch.length > 0;
  const missing = [];
  if (!t.rule) missing.push("type rule not met");
  if (!p1) missing.push("no Rahu (or Ketu where allowed, or Gulika carrier)");
  if (!p3) missing.push("no house link to the type's house or to the 5th 9th 6th 8th 12th");
  const evidence = on.filter(a => a.role !== "support" || a.ok);
  const anyKey = on.some(a => (t.key || []).indexOf(a.id) >= 0);
  const status = t.rule && p1 && p3 ? "FORMED" : anyKey ? "INDICATION" : "NONE";
  const act = uniq([].concat.apply([], on.map(a => a.by.concat(a.planets))).filter(n => f.P[n]));
  return Object.assign(t, { p1, p1by: carrier && !p1by.length ? ["Gulika"] : p1by, p3, p3why: ownHouse.length ? "the type's own house is touched (" + ownHouse.map(a => a.id).join(", ") + ")" : centralTouch.length ? "the evidence touches the " + uniq([].concat.apply([], centralTouch.map(a => a.houses.filter(h => CENTRAL.indexOf(h) >= 0)))).sort((x, y) => x - y).map(ORD).join(", ") + " house (central link)" : "none", missing, status, evidencePlanets: act, anyEvidence: anyKey, ruleEvidence: anyKey });
}

function states(chart, f, t) {
  const sigs = uniq((t.sig || []).filter(n => f.P[n]));
  const aff = uniq([].concat.apply([], t.atoms.filter(a => a.ok && a.role !== "support").map(a => a.by)).filter(n => f.P[n]));
  const out = { deep: [], lighter: [], repeating: [], relief: [] };
  const D = chart && chart.planetsByName;
  sigs.filter(n => NODES.indexOf(n) < 0).forEach(n => {
    const P = f.P[n], deb = DEBIL[n] === P.sign;
    if (P.combust) out.deep.push(n + " combust, the defence of the afflicted significator is closed");
    if (deb) {
      let nb = false;
      if (D && f.label === "D1" && D[n]) { try { nb = !!chart._nb(D[n]); } catch (e) { nb = false; } }
      out.deep.push(n + " debilitated" + (nb ? "" : ", no neecha bhanga by Vednetra's test"));
      if (nb) out.relief.push(n + " has neecha bhanga by Vednetra's test, a fall first and a rise after the bhoga");
    }
    if (P.retro) out.repeating.push(n + " retrograde, the same obstruction returns, a debt carried from a past birth");
    if (n !== "Jupiter" && f.P.Jupiter && (f.P.Jupiter.sign === P.sign || aspectHit(f, f.P.Jupiter, P.sign))) out.relief.push("Jupiter " + (f.P.Jupiter.sign === P.sign ? "conjoins" : "aspects") + " " + n + ", the poison is reduced");
  });
  const real = aff.filter(n => NODES.indexOf(n) < 0);
  if (real.length) {
    const weak = real.filter(n => f.P[n].combust || DEBIL[n] === f.P[n].sign);
    if (weak.length === real.length) out.lighter.push("every planetary afflictor (" + real.join(", ") + ") is debilitated or combust, a weak afflictor hits lighter");
    real.filter(n => f.P[n].retro).forEach(n => out.repeating.push(n + " retrograde as afflictor, more active, the blow repeats"));
    real.filter(n => n === "Saturn" && (OWN.Saturn.indexOf(f.P[n].sign) >= 0 || EXALT.Saturn === f.P[n].sign)).forEach(() => out.relief.push("Saturn in own sign or exalted, it punishes with delay and strain and does not destroy the house totally"));
  }
  return out;
}

function shaapOfFrame(f, chart) {
  const raw = evalTypes(f), out = {};
  Object.keys(raw).forEach(id => { out[id] = judge(f, raw[id]); out[id].states = states(chart, f, out[id]); });
  return out;
}

// ---------- shapit Shani ----------
function shapitShani(f1, f9, chart, dash) {
  const S = f1.P.Saturn, Ra = f1.P.Rahu;
  const conj = S.sign === Ra.sign, asp = !conj && !!relPlanet(f1, Ra, S);
  if (!conj && !asp) return { present: false };
  const H = S.house, nth = (h, n) => ((h + n - 2) % 12) + 1;
  const hits = [{ house: H, how: "occupied by Saturn" + (conj ? " with Rahu" : ""), rank: 1 }];
  if (conj) hits.push({ house: nth(H, 7), how: "7th aspect of Saturn and Rahu, a double blow", rank: 2 });
  else hits.push({ house: nth(H, 7), how: "7th aspect of Saturn", rank: 2 });
  [3, 10].forEach(n => hits.push({ house: nth(H, n), how: ORD(n) + " aspect of Saturn", rank: 3 }));
  if (f1.opts.nodeAspects === "vednetra") [5, 9].forEach(n => hits.push({ house: nth(Ra.house, n), how: ORD(n) + " aspect of Rahu, Vednetra node aspect setting", rank: 3 }));
  const reversal = conj && [3, 6, 11].indexOf(H) >= 0;
  const seen = {};
  const rows = hits.filter(h => (seen[h.house] ? false : (seen[h.house] = true))).map(h => ({ house: h.house, how: h.how, rank: h.rank, lord: houseLord(f1, h.house), karakas: R.houseKarakas[String(h.house)] || [], themes: KB.houses[h.house].themes.split(", ").slice(0, 5).join(", ") }));
  if (reversal) rows.forEach(r => { if (r.rank === 1) r.rank = 4; });
  rows.sort((a, b) => a.rank - b.rank);
  const sat9 = f9 ? { conj: f9.P.Saturn.sign === f9.P.Rahu.sign, rel: relPlanet(f9, f9.P.Rahu, f9.P.Saturn), sign: f9.P.Saturn.signName, deb: DEBIL.Saturn === f9.P.Saturn.sign, own: OWN.Saturn.indexOf(f9.P.Saturn.sign) >= 0 || EXALT.Saturn === f9.P.Saturn.sign } : null;
  const ownEx = OWN.Saturn.indexOf(S.sign) >= 0 || EXALT.Saturn === S.sign;
  const indirect = [];
  for (let h = 1; h <= 12; h++) if (houseLord(f1, h) === "Saturn") indirect.push(h);
  const P = chart.planetsByName;
  const ketuStar = ["Saturn", "Rahu"].filter(n => P[n].nakLord === "Ketu");
  return {
    present: true, kind: conj ? "conjunction" : "Rahu aspects Saturn", saturnHouse: H, sign: S.signName,
    rows, reversal, ownSignOrExalted: ownEx, indirectHousesLordedBySaturn: indirect,
    d9: sat9, d9Repeated: !!(sat9 && (sat9.conj || sat9.rel)),
    ketu: { automaticAspect: conj, nakshatraLink: ketuStar, hereditary: ketuStar.length > 0 },
    dasha: dash ? ["MD", "AD", "PD"].filter(l => dash[l] && ["Saturn", "Rahu"].indexOf(dash[l]) >= 0).map(l => l + " " + dash[l]) : []
  };
}

// ---------- Gulika ----------
function gulikaBlock(f1, G, chart) {
  if (!G) return { available: false };
  const bd = badhaka(f1);
  const conj = NINE.filter(n => f1.P[n].sign === G.sign);
  const asp = NINE.filter(n => f1.P[n].sign !== G.sign && aspectHit(f1, f1.P[n], G.sign)).map(n => n + " " + ORD(aspectHit(f1, f1.P[n], G.sign)));
  const kendra = NINE.filter(n => f1.P[n].sign !== G.sign && kendraFrom(G.sign, f1.P[n].sign)).map(n => n + " (" + ORD(dist(G.sign, f1.P[n].sign)) + " from Gulika)");
  const lord = lordSign(G.sign);
  const who = conj.filter(n => R.karakaOfShaap[n]).map(n => n + " so the " + R.karakaOfShaap[n] + " side");
  return {
    available: true, sign: SIGN_NAMES[G.sign], house: G.house, nakshatra: G.nakshatra + " pada " + G.pada, nakLord: G.nakLord,
    houseFieldSpoiled: KB.houses[G.house].themes.split(", ").slice(0, 6).join(", "),
    conjunct: conj, aspectedBy: asp, kendraPlanets: kendra, signLord: lord, signLordHouse: lord ? f1.P[lord].house : null,
    spoilsKarakaOf: who, badhaka: bd
  };
}

// ---------- dasha ----------
function dashaWindows(VC, chart, act, asOf) {
  const stack = VC.findDashaStack(chart.vimshottari.timeline, asOf);
  const lv = {}; stack.forEach(s => { lv[s.level] = s.lord; });
  const inAct = n => act.indexOf(n) >= 0;
  const now = inAct(lv.MD) && inAct(lv.AD) ? "STRONG" : (inAct(lv.MD) || inAct(lv.AD)) ? "ACTIVE" : inAct(lv.PD) ? "TRIGGER AT PD" : "DORMANT";
  const wins = [];
  chart.vimshottari.timeline.forEach(md => {
    if (!inAct(md.lord)) return;
    VC.subPeriods(md, "AD").forEach(ad => { if (inAct(ad.lord)) wins.push({ md: md.lord, ad: ad.lord, start: ad.start, end: ad.end, status: asOf >= ad.end ? "PAST" : asOf < ad.start ? "FUTURE" : "NOW" }); });
  });
  return { levels: lv, now, windows: wins };
}
const D10 = d => d.toISOString().slice(0, 10);

// ---------- main ----------
function combine(d1, d9) {
  if (d1.status === "FORMED") return d9.ruleEvidence ? "FORMED FULL" : "FORMED HALF";
  if (d1.status === "INDICATION") return d9.ruleEvidence ? "INDICATION, repeated in D9" : "INDICATION";
  return d9.ruleEvidence ? "D9 ONLY, a fault in the quality of the fruit and not a shaap" : "NONE";
}

function scan(cfg) {
  const { loadVedicCore } = require("./vednetra_loader");
  const VC = loadVedicCore(cfg.appDir);
  const t = String(cfg.time).length === 5 ? cfg.time + ":00" : cfg.time;
  const built = VC.avEngineFor({ name: cfg.name || "Native", gender: cfg.gender || "unspecified", birthISO: cfg.date + "T" + t, tz: Number(cfg.tz), lat: Number(cfg.lat), lon: Number(cfg.lon), place: cfg.place || "" });
  const chart = built.chart;
  const asOf = cfg.asOf ? new Date(cfg.asOf) : new Date();
  chart._nb = p => VC.sujInternals.neechabhanga(chart, p);
  const opts = { nodeAspects: cfg.nodeAspects === "vednetra" ? "vednetra" : "7" };
  const spec1 = {}; NINE.forEach(n => { const p = chart.planetsByName[n]; spec1[n] = { sign: p.sign, retro: p.retrograde, combust: p.combust, nakshatra: p.nakshatra, nakLord: p.nakLord }; });
  const f1 = makeFrame("D1", chart.ascendant.sign, spec1, opts);
  const v9 = VC.makeVargaChart(chart, 9), spec9 = {}; NINE.forEach(n => { const p = v9.planetsByName[n]; spec9[n] = { sign: p.sign, retro: p.retrograde, combust: p.combust }; });
  const f9 = makeFrame("D9", v9.ascendant.sign, spec9, opts);
  let G = null;
  try { G = VC.sujInternals.standingGulika(chart, built.input, { atEnd: !!cfg.mandi }); } catch (e) { G = null; }
  if (G) f1.gulika = G;
  const d1 = shaapOfFrame(f1, chart), d9 = shaapOfFrame(f9, chart);
  const stack = VC.findDashaStack(chart.vimshottari.timeline, asOf), lv = {}; stack.forEach(s => { lv[s.level] = s.lord; });
  const types = {};
  R.types.forEach(meta => {
    const a = d1[meta.id], b = d9[meta.id];
    const dw = dashaWindows(VC, chart, a.evidencePlanets, asOf);
    types[meta.id] = {
      id: meta.id, name: meta.en, hi: meta.hi, ruleEn: meta.ruleEn, topics: meta.topics,
      d1: { status: a.status, rule: a.rule, p1: a.p1, p1by: a.p1by, p3: a.p3, p3why: a.p3why, missing: a.missing, atoms: a.atoms.filter(x => x.ok), strong: !!a.strong, class: a.class || null, causeLabel: a.anyEvidence ? (a.causeLabel || null) : null, heaviest: !!a.heaviest },
      d9: { status: b.status, rule: b.rule, evidence: b.ruleEvidence, atoms: b.atoms.filter(x => x.ok) },
      combined: combine(a, b), states: a.states, dasha: a.anyEvidence ? { activators: a.evidencePlanets, now: dw.now, levels: dw.levels, windows: dw.windows } : null
    };
  });
  const gb = gulikaBlock(f1, G, chart);
  const ss = shapitShani(f1, f9, chart, lv);
  // supporting nakshatra flags, never counted
  const flags = [];
  Object.keys(types).forEach(id => {
    const tt = types[id]; if (tt.d1.status === "NONE") return;
    const sigs = d1[id].sig || [];
    sigs.filter(n => f1.P[n] && NODES.indexOf(n) < 0).forEach(n => {
      const nk = chart.planetsByName[n].nakshatra;
      if (R.nakshatraPolicy.rahuStars.indexOf(nk) >= 0) flags.push(id + ": " + n + " in " + nk + ", a Rahu star");
      if (R.nakshatraPolicy.ketuStars.indexOf(nk) >= 0) flags.push(id + ": " + n + " in " + nk + ", a Ketu star");
    });
  });
  // Ketu vichhedak links for FORMED or INDICATION types
  const ketuLinks = [];
  Object.keys(types).forEach(id => {
    if (types[id].d1.status === "NONE") return;
    (d1[id].sig || []).filter(n => f1.P[n] && NODES.indexOf(n) < 0).forEach(n => { const r = relPlanet(f1, f1.P.Ketu, f1.P[n]); if (r) ketuLinks.push(id + ": Ketu " + r + " " + n + ", happiness may come and then go"); });
  });
  return {
    native: cfg.name || "Native", asOf: D10(asOf), topic: cfg.topic || null, nodeAspects: opts.nodeAspects,
    ascendant: SIGN_NAMES[chart.ascendant.sign], d9Ascendant: SIGN_NAMES[v9.ascendant.sign],
    dashaNow: lv, types, shapitShani: ss, gulika: gb, supportFlags: flags, ketuLinks,
    badhaka: badhaka(f1)
  };
}

// ---------- output ----------
function topicTypes(topic) { return R.types.filter(t => (t.topics || []).indexOf(topic) >= 0).map(t => t.id); }
function lineFor(res) {
  const rel = res.topic ? topicTypes(res.topic) : [];
  const word = id => res.types[id].combined;
  const formed = Object.keys(res.types).filter(id => /^FORMED/.test(word(id)));
  const ind = Object.keys(res.types).filter(id => /^INDICATION/.test(word(id)));
  const parts = [];
  parts.push(formed.length ? "FORMED " + formed.map(id => id + " " + word(id).replace("FORMED ", "").toLowerCase() + " " + (res.types[id].dasha ? res.types[id].dasha.now.toLowerCase() : "")).join(", ") : "FORMED none");
  parts.push(ind.length ? "INDICATION only " + ind.join(", ") : "INDICATION none");
  if (res.topic) parts.push("read for " + res.topic + " " + (rel.length ? rel.map(id => id + " " + word(id).split(",")[0].toLowerCase()).join(", ") : "no type linked"));
  return "SHAAP SCAN " + parts.join(". ") + ". Entered as harm evidence only for the named planets, not as proof, engine author's topic links are proposed";
}

function render(res, o) {
  o = o || {};
  const L = [];
  const rel = res.topic ? topicTypes(res.topic) : [];
  L.push("# SUJ KB3 SHAAP DOSH SCAN for " + res.native + ", as of " + res.asOf + (res.topic ? ", topic " + res.topic : ""));
  L.push("Lagna " + res.ascendant + ", D9 Lagna " + res.d9Ascendant + ". Running dasha " + ["MD", "AD", "PD"].map(l => l + " " + res.dashaNow[l]).join(", ") + ". Node aspects " + (res.nodeAspects === "vednetra" ? "5th 7th 9th, Vednetra setting" : "7th only, the owner's accepted aspect") + ". Badhaka house " + res.badhaka.house + " (" + res.badhaka.kind + " Lagna), badhakesh " + res.badhaka.lord + ".");
  L.push("Owner's sutra. Rahu, plus an afflicted significator, plus the 5th or 9th or a trik house, plus a running dasha, makes a shaap yoga. One or two alone is an indication and is not called shaap. No sign and no nakshatra makes a shaap.");
  L.push("");
  L.push("## Summary of the nine types, D1 then D9 then combined, then the dasha as of the date");
  Object.keys(res.types).forEach(id => {
    const t = res.types[id];
    L.push("- " + id.toUpperCase() + " " + t.hi + ". D1 " + t.d1.status + ", D9 " + (t.d9.evidence ? t.d9.status : "no repeat") + ", combined " + t.combined + (t.dasha ? ". Dasha " + t.dasha.now : "") + (rel.indexOf(id) >= 0 ? ". READ FOR THIS TOPIC" : ""));
  });
  L.push("");
  Object.keys(res.types).forEach(id => {
    const t = res.types[id];
    if (t.d1.status === "NONE" && !t.d9.evidence) return;
    L.push("## " + id.toUpperCase() + " " + t.hi + ", " + t.name);
    L.push("Owner's rule. " + t.ruleEn);
    L.push("D1 " + t.d1.status + (t.d1.strong ? ", strong form" : "") + ". Pillars, type rule " + (t.d1.rule ? "met" : "not met") + ", carrier P1 " + (t.d1.p1 ? "yes (" + t.d1.p1by.join(", ") + ")" : "no") + ", house link P3 " + (t.d1.p3 ? "yes, " + t.d1.p3why : "no") + ", dasha P4 " + (t.dasha ? t.dasha.now : "n.a."));
    t.d1.atoms.forEach(a => L.push("  D1 evidence " + a.id + " (" + a.role + "). " + a.text));
    if (t.d1.missing.length && t.d1.status !== "FORMED") L.push("  Why not a shaap yet. " + t.d1.missing.join("; "));
    if (t.d1.class) L.push("  Class. " + t.d1.class);
    if (t.d1.heaviest) L.push("  Heaviest form of brahma shaap, Jupiter combust with Rahu.");
    if (t.d1.causeLabel) L.push("  " + t.d1.causeLabel);
    t.d9.atoms.forEach(a => L.push("  D9 evidence " + a.id + " (" + a.role + "). " + a.text));
    L.push("  Combined D1 and D9. " + t.combined);
    if (FREQ && FREQ.types[id]) { const q = FREQ.types[id]; L.push("  Frequency of this type in " + FREQ.n + " random charts, a calibration of the rules and not evidence. D1 FORMED " + q.d1Formed + " percent, FORMED FULL " + q.formedFull + " percent, D1 FORMED with a running dasha " + q.formedAndActiveNow + " percent."); }
    const s = t.states;
    ["deep", "lighter", "repeating", "relief"].forEach(k => s[k].forEach(x => L.push("  " + ({ deep: "Deeper", lighter: "Lighter", repeating: "Repeating", relief: "Relief" })[k] + ". " + x)));
    if (t.dasha) {
      const w = t.dasha.windows, past = w.filter(x => x.status === "PAST"), nowW = w.filter(x => x.status === "NOW"), fut = w.filter(x => x.status === "FUTURE");
      L.push("  Dasha. Planets in the evidence " + t.dasha.activators.join(", ") + ". Now " + t.dasha.now + " (MD " + t.dasha.levels.MD + ", AD " + t.dasha.levels.AD + ", PD " + t.dasha.levels.PD + "). Windows where both Mahadasha and Antardasha lords are in the evidence, past " + past.length + ", now " + nowW.length + ", future " + fut.length + ".");
      past.slice(-2).forEach(x => L.push("    PAST " + x.md + " " + x.ad + " " + D10(x.start) + " to " + D10(x.end)));
      nowW.forEach(x => L.push("    NOW " + x.md + " " + x.ad + " " + D10(x.start) + " to " + D10(x.end)));
      fut.slice(0, 3).forEach(x => L.push("    FUTURE " + x.md + " " + x.ad + " " + D10(x.start) + " to " + D10(x.end)));
    }
    L.push("");
  });
  const ss = res.shapitShani;
  L.push("## Saturn afflicted by Rahu, shapit Shani");
  if (!ss.present) L.push("Not present. Saturn is neither conjoined with nor aspected by Rahu.");
  else {
    L.push("Present, " + ss.kind + ", Saturn in the " + ORD(ss.saturnHouse) + " house in " + ss.sign + ". Order of harm, most first" + (ss.reversal ? ", REVERSED because the conjunction stands in the 3rd 6th or 11th, the aspected houses are hurt more than the occupied house" : "") + ".");
    ss.rows.forEach(r => L.push("- House " + r.house + ", " + r.how + ". Lord " + r.lord + ". Natural karakas " + r.karakas.join(", ") + ". Themes " + r.themes));
    if (ss.ownSignOrExalted) L.push("Saturn is in own sign or exalted, the house is not destroyed totally, fruit comes with delay and mental strain.");
    if (ss.indirectHousesLordedBySaturn.length) L.push("Houses lorded by Saturn are also spoiled indirectly " + ss.indirectHousesLordedBySaturn.join(", ") + ". The owner's further indirect rule by sign and nakshatra lords is not coded.");
    L.push("D9 Saturn in " + (ss.d9 ? ss.d9.sign : "n.a.") + ", Rahu relation in D9 " + (ss.d9Repeated ? "repeated, full" : "not repeated, half only") + ".");
    L.push("Ketu. " + (ss.ketu.automaticAspect ? "Ketu is the silent third partner and aspects the conjunction by position. " : "") + (ss.ketu.hereditary ? "Saturn or Rahu stands in a Ketu star " + ss.ketu.nakshatraLink.join(", ") + ", so the shaap is read as hereditary, from the father's side." : "No Ketu star or conjunction link beyond the automatic aspect, so the engine does not call it hereditary."));
    L.push("Dasha now. " + (ss.dasha.length ? ss.dasha.join(", ") + ", the yoga is awake" : "no Saturn or Rahu in the running Mahadasha, Antardasha or Pratyantardasha, the yoga sleeps"));
  }
  L.push("");
  const g = res.gulika;
  L.push("## Gulika");
  if (!g.available) L.push("Gulika could not be computed for this birth.");
  else {
    L.push("Gulika in " + g.sign + ", the " + ORD(g.house) + " house, " + g.nakshatra + ". Step 1, the field spoiled, " + g.houseFieldSpoiled + ".");
    L.push("Step 2, the significator spoiled. Joined by " + (g.conjunct.length ? g.conjunct.join(", ") : "no planet") + (g.spoilsKarakaOf.length ? ", so " + g.spoilsKarakaOf.join("; ") : "") + ". Aspected by " + (g.aspectedBy.length ? g.aspectedBy.join(", ") : "no planet") + ". Planets in kendra from Gulika " + (g.kendraPlanets.length ? g.kendraPlanets.join(", ") : "none") + ".");
    L.push("Step 3, the root. Gulika's sign lord " + g.signLord + " stands in the " + ORD(g.signLordHouse) + " house.");
  }
  L.push("");
  if (res.supportFlags.length || res.ketuLinks.length) {
    L.push("## Supporting flags, never counted in a verdict");
    res.supportFlags.forEach(x => L.push("- Nakshatra, later practical view and not classical. " + x));
    res.ketuLinks.forEach(x => L.push("- Ketu role. " + x));
    L.push("");
  }
  L.push("## Line for S2 of the answer");
  L.push(lineFor(res));
  L.push("");
  L.push("## How the finding may be used");
  L.push("A FORMED status with D9 repeating is a harm indicator on the type's house and significator. It enters strength_tally.js only as harm evidence for the afflicting planets, one entry per planet, with the weight the tally already gives. This entry rule is the engine author's proposal and awaits the owner. An INDICATION is not a shaap, it may not be called one in the answer. A DORMANT shaap does not act in the present dasha, use the windows above for the time status. " + (FREQ ? "In " + FREQ.n + " random charts at least one of the nine types was FORMED in D1 in " + FREQ.anyTypeFormedD1 + " percent, FORMED FULL in " + FREQ.anyTypeFormedFull + " percent and FORMED FULL with a running dasha in " + FREQ.anyTypeFormedFullAndActiveNow + " percent, so a finding for one type is a weak separator and must not be presented as proof." : ""));
  return L.join("\n");
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  let cfg;
  try { cfg = JSON.parse(argv.find(a => a.trim().startsWith("{")) || "{}"); } catch (e) { console.error("Bad config " + e.message); process.exit(2); }
  for (const k of ["date", "time", "tz", "lat", "lon"]) if (cfg[k] === undefined || cfg[k] === "") { console.error("Missing field " + k); process.exit(2); }
  const res = scan(cfg);
  console.log(argv.indexOf("--json") >= 0 ? JSON.stringify(res, null, 1) : render(res));
}

module.exports = { scan, render, lineFor, makeFrame, shaapOfFrame, evalTypes, judge, combine, shapitShani, badhaka, topicTypes, aspectSet, relPlanet, houseLord, TYPES: R.types.map(t => t.id) };
