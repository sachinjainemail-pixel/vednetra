#!/usr/bin/env node
/*
 * SUJ engine, knowledge base 2: PLANET STRENGTH and CONFLICT RESOLUTION.
 *
 * Owner's rule: when more than one planet can deliver the result of a life event and their results
 * conflict, the more powerful planet enforces its result. Strength is judged by the owner's six step
 * method (Hindi text saved in suj_engine/METHODOLOGY.md section 5):
 *   1  Shadbala percent against Santhanam's minimum (all six components shown)
 *   2  D1 sign and house condition (dignity, sign lord, neecha bhanga)
 *   3  D9, vargottama, Vimshopaka, and the topic varga
 *   4  retrograde, combust, graha yuddha, recorded separately. The owner's adjusted ranking
 *      (retrograde = maximum cheshta, combust = zero cheshta) is kept apart from the mathematical ranking
 *   5  aspects, conjunctions, yogas, used to INTERPRET and never added to a score
 *   6  relationship to the subject and activity in dasha
 * Rahu and Ketu are assessed separately and get no Shadbala.
 *
 * Every chart quantity comes from Vednetra (VedicCore). Nothing is computed from memory.
 *
 * Usage:
 *   node suj_engine/tools/planet_strength.js '{"date":"1985-12-10","time":"10:00:00","tz":5.5,"lat":28.6,"lon":77.2,
 *        "topic":"career","candidates":["Venus","Saturn"],"asOf":"2026-11-09"}'
 *   add --json for structured output.
 * Config: name, gender, date, time, tz, lat, lon, topic (key of data/topics.json) or houses, karakas, varga;
 *         candidates (planets whose results conflict); asOf (date to test dasha activity, default today).
 */
const fs = require("fs");
const path = require("path");
const { loadVedicCore } = require("./vednetra_loader");

const KB = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "significations.json"), "utf8"));
const TOPICS = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "topics.json"), "utf8"));
const SEVEN = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
const NODES = ["Rahu", "Ketu"];
const SIGN_NAMES = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const GOOD_VARGA_HOUSES = [1, 2, 4, 5, 7, 9, 10, 11];            // kendra, trikona, 2nd, 11th (owner's good houses)
const EXALT = { Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6, Rahu: 1, Ketu: 7 };
const DEBIL = { Sun: 6, Moon: 7, Mars: 3, Mercury: 11, Jupiter: 9, Venus: 5, Saturn: 0, Rahu: 7, Ketu: 1 };
const DIGNITY_ORDINAL = { "Exalted": 6, "Moolatrikona": 5, "Own sign": 4, "Friendly sign": 3, "Neutral sign": 2, "Enemy sign": 1, "Debilitated": 0 };

const signLord = s => { for (const p of Object.keys(KB.ownSigns)) if (KB.ownSigns[p].indexOf(s) >= 0) return p; return null; };
const houseFrom = (sign, ref) => ((sign - ref + 12) % 12) + 1;
const lordshipsFrom = (pl, ref) => (KB.ownSigns[pl] || []).map(s => houseFrom(s, ref)).sort((a, b) => a - b);
const r2 = x => Math.round(x * 100) / 100;
const angDist = (a, b) => { const d = Math.abs(((a - b) % 360 + 360) % 360); return d > 180 ? 360 - d : d; };

// Same degree windows Vednetra uses. Vednetra labels a planet in its own sign "Own sign" before it tests
// Moolatrikona, so the Moolatrikona label never appears there. Strength needs it, so it is rebuilt here.
function isMoolatrikona(p) {
  const d = p.deg;
  return (p.name === "Sun" && p.sign === 4 && d <= 20) || (p.name === "Moon" && p.sign === 1 && d >= 3) ||
    (p.name === "Mars" && p.sign === 0 && d <= 12) || (p.name === "Mercury" && p.sign === 5 && d >= 15 && d <= 20) ||
    (p.name === "Jupiter" && p.sign === 8 && d <= 10) || (p.name === "Venus" && p.sign === 6 && d <= 15) ||
    (p.name === "Saturn" && p.sign === 10 && d <= 20);
}

function analyse(cfg) {
  const VC = loadVedicCore(cfg.appDir);
  const I = VC.sujInternals;
  const t = String(cfg.time).length === 5 ? cfg.time + ":00" : cfg.time;
  const built = VC.avEngineFor({
    name: cfg.name || "Native", gender: cfg.gender || "unspecified",
    birthISO: cfg.date + "T" + t, tz: Number(cfg.tz), lat: Number(cfg.lat), lon: Number(cfg.lon), place: cfg.place || ""
  });
  const chart = built.chart;
  const P = chart.planetsByName;
  const asOf = cfg.asOf ? new Date(cfg.asOf) : new Date();
  const lagnaSign = chart.ascendant.sign, moonSign = P.Moon.sign;

  // ---- topic ----
  let topic = null;
  if (cfg.topic || cfg.houses || cfg.karakas) {
    const preset = cfg.topic ? TOPICS[cfg.topic] : null;
    if (cfg.topic && !preset) throw new Error("Unknown topic " + cfg.topic + ". Known: " + Object.keys(TOPICS).filter(k => k[0] !== "_").join(", "));
    topic = {
      key: cfg.topic || "custom",
      houses: cfg.houses || (preset && preset.houses) || [],
      karakas: cfg.karakas || (preset && preset.karakas) || [],
      varga: cfg.varga || (preset && preset.varga) || null,
      source: preset ? preset.source : "command line"
    };
  }

  // ---- dasha at asOf ----
  const stack = VC.findDashaStack(chart.vimshottari.timeline, asOf);
  const dasha = {};
  stack.forEach(p => { dasha[p.level] = p.lord; });
  const dashaText = stack.slice(0, 3).map(p => p.level + " " + p.lord + " " + p.start.toISOString().slice(0, 10) + " to " + p.end.toISOString().slice(0, 10));

  // ---- topic varga ----
  const vchart = topic && topic.varga ? VC.makeVargaChart(chart, topic.varga) : null;
  const d9 = VC.makeVargaChart(chart, 9);

  // ---- step 1 base ----
  const sbRows = {};
  I.shadbalaRows(chart).forEach(r => { sbRows[r.planet] = r; });

  // ---- step 4 data: Sun distance and planetary war ----
  const warPairs = [];
  const warPlanets = ["Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
  for (let i = 0; i < warPlanets.length; i++) for (let j = i + 1; j < warPlanets.length; j++) {
    const a = P[warPlanets[i]], b = P[warPlanets[j]];
    const sep = angDist(a.lon, b.lon);
    if (sep < 1) warPairs.push({ a: a.name, b: b.name, separationDeg: r2(sep), provisionalWinner: a.lon < b.lon ? a.name : b.name,
      note: "Winner by lower longitude as Vednetra does. Latitude is not produced by Vednetra, so treat the winner as provisional." });
  }
  const warLost = {}, warWon = {};
  warPairs.forEach(w => { warWon[w.provisionalWinner] = w; warLost[w.provisionalWinner === w.a ? w.b : w.a] = w; });

  // ---- yogas ----
  const yogas = I.scanYogas(chart);

  const rows = {};
  SEVEN.concat(NODES).forEach(name => {
    const p = P[name];
    const isNode = NODES.indexOf(name) >= 0;
    const row = { planet: name, isNode };

    // ===== STEP 1 =====
    if (!isNode) {
      const s = sbRows[name];
      const comp = { sthana: s.sthana, dig: s.dig, kala: s.kala, cheshta: s.cheshta, naisargika: s.naisargika, drik: s.drik };
      const compRupa = {}; Object.keys(comp).forEach(k => { compRupa[k] = r2(comp[k] / 60); });
      const keys = Object.keys(comp);
      row.step1 = {
        components_virupa: comp, components_rupa: compRupa,
        totalVirupa: s.total, totalRupa: r2(s.total / 60),
        minimumRupa: r2(s.required / 60), minimumVirupa: s.required,
        percent: r2(s.total / s.required * 100),
        strongestComponent: keys.reduce((m, k) => comp[k] > comp[m] ? k : m, keys[0]),
        weakestComponent: keys.reduce((m, k) => comp[k] < comp[m] ? k : m, keys[0])
      };
    }

    // ===== STEP 4 (needs to come before the adjusted percent) =====
    const sunSep = name === "Sun" ? null : r2(angDist(p.lon, P.Sun.lon));
    row.step4 = {
      retrograde: !!p.retrograde, combustVednetraFlag: !!p.combust, separationFromSunDeg: sunSep,
      grahaYuddha: warWon[name] ? "in war, provisional winner" : warLost[name] ? "in war, provisional loser" : (warPlanets.indexOf(name) >= 0 ? "no war" : "not applicable")
    };
    if (!isNode) {
      // Owner's adjustment, kept apart from the mathematical percent: retrograde = maximum cheshta (60),
      // combust = zero cheshta. If both, combust is applied (assumption to confirm).
      const s = sbRows[name];
      let ch = s.cheshta, rule = "unchanged";
      if (p.combust) { ch = 0; rule = p.retrograde ? "combust and retrograde, combust applied (zero)" : "combust, cheshta set to zero"; }
      else if (p.retrograde) { ch = 60; rule = "retrograde, cheshta set to maximum 60"; }
      const adjTotal = s.total - s.cheshta + ch;
      row.step4.ownerAdjusted = { cheshtaRule: rule, cheshtaUsed: ch, totalVirupa: adjTotal, percent: r2(adjTotal / s.required * 100) };
    }

    // ===== STEP 2 =====
    const mt = !isNode && isMoolatrikona(p);
    let dignity = mt ? "Moolatrikona" : p.dignity;
    if (isNode) dignity = p.sign === EXALT[name] ? "Exalted" : p.sign === DEBIL[name] ? "Debilitated" : "Node, judged by dispositor";
    let bhanga = { present: false, reasons: [] };
    if (dignity === "Debilitated" && !isNode) {
      const dl = P[signLord(DEBIL[name])], el = P[signLord(EXALT[name])];
      const kendraFromLagna = pl => [1, 4, 7, 10].indexOf(houseFrom(pl.sign, lagnaSign)) >= 0;
      const kendraFromMoon = pl => [1, 4, 7, 10].indexOf(houseFrom(pl.sign, moonSign)) >= 0;
      if (kendraFromLagna(dl) || kendraFromMoon(dl)) bhanga.reasons.push("lord of the debilitation sign (" + dl.name + ") is in a kendra from Lagna or Moon");
      if (kendraFromLagna(el) || kendraFromMoon(el)) bhanga.reasons.push("lord of the exaltation sign (" + el.name + ") is in a kendra from Lagna or Moon");
      if (d9.planetsByName[name] && d9.planetsByName[name].sign === EXALT[name]) bhanga.reasons.push("the planet is exalted in Navamsha");
      bhanga.present = bhanga.reasons.length > 0;
      bhanga.vednetraReport = I.neechabhangaReport(chart, p);
    }
    const sl = P[signLord(p.sign)];
    row.step2 = {
      sign: p.signName, degree: r2(p.deg), houseFromLagna: p.house, houseFromMoon: houseFrom(p.sign, moonSign),
      lordshipsFromLagna: isNode ? [] : p.lordships.slice().sort((a, b) => a - b),
      lordshipsFromMoon: isNode ? [] : lordshipsFrom(name, moonSign),
      dignity, dignityOrdinal: DIGNITY_ORDINAL[dignity] != null ? DIGNITY_ORDINAL[dignity] : null,
      neechaBhanga: bhanga,
      signLord: sl.name,
      signLordCondition: sl.name + " in house " + sl.house + ", " + sl.dignity + (sl.retrograde ? ", retrograde" : "") + (sl.combust ? ", combust" : "") +
        (sbRows[sl.name] ? ", Shadbala " + r2(sbRows[sl.name].total / sbRows[sl.name].required * 100) + " percent" : ""),
      nakshatra: p.nakshatra + " pada " + p.pada + ", star lord " + p.nakLord
    };
    // ordinal used in resolution: a cancelled debilitation is treated as neutral (assumption)
    row.step2.ordinalForResolution = dignity === "Debilitated" ? (bhanga.present ? 2 : 0) : (DIGNITY_ORDINAL[dignity] != null ? DIGNITY_ORDINAL[dignity] : null);

    // ===== STEP 3 =====
    const nav = d9.planetsByName[name];
    row.step3 = {
      navamshaSign: nav ? nav.signName : null, navamshaHouse: nav ? nav.house : null,
      navamshaDignity: !isNode ? I.vargaDignity(name, nav.sign).label : null,
      vargottama: !isNode && I.isD9Vargottama(chart, name),
      vargottamaSignQuality: !isNode && I.isD9Vargottama(chart, name) ? "same sign in D1 and D9, dignity " + dignity : null,
      vimshopaka: isNode ? null : {
        shadvarga: r2(I.vimScheme(name, p.lon, I.vimSchemes.Shadvarga)),
        saptavarga: r2(I.vimScheme(name, p.lon, I.vimSchemes.Saptavarga)),
        dashavarga: r2(I.vimScheme(name, p.lon, I.vimSchemes.Dashavarga)),
        shodashavarga: r2(I.vimScheme(name, p.lon, I.vimSchemes.Shodashavarga)),
        outOf: 20
      }
    };
    if (vchart) {
      const vp = vchart.planetsByName[name];
      row.step3.topicVarga = {
        varga: "D" + topic.varga, sign: vp.signName, houseInVarga: vp.house,
        dignityInVarga: !isNode ? I.vargaDignity(name, vp.sign).label : null,
        inGoodHouse: GOOD_VARGA_HOUSES.indexOf(vp.house) >= 0,
        lordOfVargaHouses: isNode ? [] : lordshipsFrom(name, vchart.ascendant.sign)
      };
    }

    // ===== STEP 5 (interpretation only, never scored) =====
    const aspectors = I.planetsAspectingPlanet(chart, p).map(q => q.name + " (" + q.naturalNature + ")");
    const conj = chart.planets.filter(q => q.name !== name && q.sign === p.sign).map(q => ({ planet: q.name, orbDeg: r2(angDist(q.lon, p.lon)), nature: q.naturalNature }));
    row.step5 = {
      aspectsReceivedNaturalNatureOnly: aspectors,
      conjunctions: conj,
      closestConjunction: conj.length ? conj.reduce((m, c) => c.orbDeg < m.orbDeg ? c : m, conj[0]) : null,
      yogas: yogas.filter(y => (y.planets || []).indexOf(name) >= 0).map(y => y.name + " (" + y.strength + ")"),
      note: "Used to read the nature of the result. Not added to any score, because Drik bala, exaltation, varga and retrogression are already inside Shadbala."
    };

    rows[name] = row;
  });

  // ---- nodes: separate assessment ----
  NODES.forEach(name => {
    const p = P[name], d = P[p.dispositor];
    rows[name].nodeAssessment = {
      note: "Parashari Shadbala covers Sun to Saturn only. Rahu and Ketu are judged by the sign lord, house, conjunction, aspect and dasha activity.",
      signLord: p.dispositor,
      signLordShadbalaPercent: sbRows[d.name] ? r2(sbRows[d.name].total / sbRows[d.name].required * 100) : null,
      signLordDignity: d.dignity, signLordHouse: d.house,
      starLord: p.nakLord,
      starLordShadbalaPercent: sbRows[p.nakLord] ? r2(sbRows[p.nakLord].total / sbRows[p.nakLord].required * 100) : null
    };
  });

  // ---- STEP 6: subject relationship and dasha activity ----
  if (topic) {
    const hs = topic.houses;
    const lagnaLords = hs.map(h => signLord((lagnaSign + h - 1) % 12));
    const moonLords = hs.map(h => signLord((moonSign + h - 1) % 12));
    Object.keys(rows).forEach(name => {
      const p = P[name], reasons = [];
      hs.forEach((h, i) => {
        if (lagnaLords[i] === name) reasons.push("lords house " + h + " from Lagna");
        if (moonLords[i] === name) reasons.push("lords house " + h + " from Moon");
        if (p.house === h) reasons.push("sits in house " + h + " from Lagna");
        if (houseFrom(p.sign, moonSign) === h) reasons.push("sits in house " + h + " from Moon");
        if (I.aspectNameToHouse(p, h)) reasons.push("aspects house " + h + " from Lagna");
      });
      if (topic.karakas.indexOf(name) >= 0) reasons.push("is a karaka of the subject");
      if (lagnaLords.indexOf(p.nakLord) >= 0 || topic.karakas.indexOf(p.nakLord) >= 0) reasons.push("stands in the star of " + p.nakLord + ", a lord or karaka of the subject");
      if (NODES.indexOf(name) >= 0 && (lagnaLords.indexOf(p.dispositor) >= 0 || topic.karakas.indexOf(p.dispositor) >= 0)) reasons.push("sign lord " + p.dispositor + " is a lord or karaka of the subject");
      const vt = rows[name].step3.topicVarga;
      if (vt) {
        if (vt.inGoodHouse) reasons.push("confirmed in " + vt.varga + ", house " + vt.houseInVarga + " is kendra, trikona, 2nd or 11th");
        if (["Exalted", "Mulatrikona", "Own"].indexOf(vt.dignityInVarga) >= 0) reasons.push("dignified in " + vt.varga + " (" + vt.dignityInVarga + ")");
      }
      const act = [];
      if (dasha.MD === name) act.push("Mahadasha");
      if (dasha.AD === name) act.push("Antardasha");
      if (dasha.PD === name) act.push("Pratyantardasha");
      act.forEach(a => reasons.push("running " + a + " on " + asOf.toISOString().slice(0, 10)));
      rows[name].step6 = { reasons, count: reasons.length, dashaActive: act, subjectOnlyCount: reasons.length - act.length };
    });
  }

  // ---- rankings ----
  const rank = (names, key) => names.slice().sort((a, b) => key(b) - key(a));
  const rankings = {
    shadbalaPercent_mathematical: rank(SEVEN, n => rows[n].step1.percent).map(n => n + " " + rows[n].step1.percent),
    shadbalaPercent_ownerAdjusted: rank(SEVEN, n => rows[n].step4.ownerAdjusted.percent).map(n => n + " " + rows[n].step4.ownerAdjusted.percent),
    d1Dignity: rank(SEVEN, n => rows[n].step2.ordinalForResolution).map(n => n + " " + rows[n].step2.dignity),
    vimshopakaShadvarga: rank(SEVEN, n => rows[n].step3.vimshopaka.shadvarga).map(n => n + " " + rows[n].step3.vimshopaka.shadvarga)
  };
  if (topic) rankings.subjectEffectiveness = rank(Object.keys(rows), n => rows[n].step6.count).map(n => n + " " + rows[n].step6.count);

  // ---- conflict resolution ----
  let resolution = null;
  if (cfg.candidates && cfg.candidates.length > 1) {
    resolution = resolve(cfg.candidates, rows, P, sbRows, topic, rankings);
  }

  return {
    native: cfg.name || "Native", asOf: asOf.toISOString().slice(0, 10), ascendant: SIGN_NAMES[lagnaSign],
    moonSign: SIGN_NAMES[moonSign], dasha: dashaText, topic, shadbalaSource: "Vednetra classical Shadbala in virupas, 60 virupa = 1 rupa",
    graha_yuddha: warPairs, rankings, rows, resolution
  };
}

// Provisional resolution procedure (to be confirmed by the owner). One vote per step.
// Step 1 Shadbala percent, Step 2 D1 dignity, Step 3 Vimshopaka Shadvarga, Step 6 subject count with dasha.
// Steps 4 and 5 do not vote. They are reported as flags. Ties on votes are broken by step 6, then 1, then 3, then 2.
function resolve(cands, rows, P, sbRows, topic, rankings) {
  const val = (c, step) => {
    const r = rows[c];
    // Rahu and Ketu have no Shadbala, no Vimshopaka and no dignity ordinal. They vote only on step 6, the
    // subject and dasha test. Their sign lord strength is shown for context and is not borrowed as a vote.
    if (step === 1) return r.step1 ? r.step1.percent : null;
    if (step === 2) return r.isNode ? null : r.step2.ordinalForResolution;
    if (step === 3) return r.step3.vimshopaka ? r.step3.vimshopaka.shadvarga : null;
    if (step === 6) return r.step6 ? r.step6.count : null;
  };
  const steps = [1, 2, 3].concat(topic ? [6] : []);
  const votes = {}; cands.forEach(c => { votes[c] = 0; });
  const detail = [];
  steps.forEach(s => {
    const vals = cands.map(c => ({ c, v: val(c, s) })).filter(x => x.v != null);
    const best = Math.max.apply(null, vals.map(x => x.v));
    const winners = vals.filter(x => x.v === best).map(x => x.c);
    winners.forEach(w => { votes[w] += 1 / winners.length; });
    detail.push({ step: s, values: vals.map(x => x.c + " " + r2(x.v)).concat(cands.filter(c => rows[c].isNode && s !== 6).map(c => c + " no vote, node")), winner: winners.join(" and ") + (winners.length > 1 ? " (tie, vote shared)" : "") });
  });
  const order = [6, 1, 3, 2].filter(s => steps.indexOf(s) >= 0);
  const sorted = cands.slice().sort((a, b) => {
    if (votes[b] !== votes[a]) return votes[b] - votes[a];
    for (const s of order) { const va = val(a, s), vb = val(b, s); if (va != null && vb != null && va !== vb) return vb - va; }
    return 0;
  });
  const winner = sorted[0];
  const w = rows[winner];
  const flags = [];
  if (w.isNode) flags.push(winner + " is a node with no Shadbala, it won on the subject and dasha test, so confidence is lower");
  if (w.step4.combustVednetraFlag) flags.push(winner + " is combust, its result is delivered with damage");
  if (w.step4.grahaYuddha === "in war, provisional loser") flags.push(winner + " lost a planetary war (provisional)");
  if (w.step4.retrograde) flags.push(winner + " is retrograde, results come with delay and review");
  if (w.step2.dignity === "Debilitated") flags.push(winner + " is debilitated" + (w.step2.neechaBhanga.present ? " with cancellation" : " without cancellation"));
  const adj = cands.filter(c => !rows[c].isNode && rows[c].step4.ownerAdjusted).sort((a, b) => rows[b].step4.ownerAdjusted.percent - rows[a].step4.ownerAdjusted.percent)[0];
  return {
    candidates: cands, winner, votes, stepDetail: detail,
    tieBreakOrder: order,
    ownerAdjustedRankingLeader: adj || null,
    adjustedRankingAgrees: adj ? adj === winner : null,
    flagsOnWinner: flags,
    note: "Procedure is provisional and awaits owner confirmation. Votes are one per step, tie shared."
  };
}

function toMarkdown(res) {
  const L = [];
  L.push("# SUJ KB2 PLANET STRENGTH for " + res.native);
  L.push("Ascendant " + res.ascendant + ", Moon in " + res.moonSign + ". Dasha as of " + res.asOf + ": " + res.dasha.join("; "));
  L.push(res.shadbalaSource + ".");
  if (res.topic) L.push("Topic " + res.topic.key + ": houses " + res.topic.houses.join(", ") + ", karakas " + res.topic.karakas.join(", ") + ", varga D" + res.topic.varga + " (" + res.topic.source + ").");
  L.push("");
  L.push("## Rankings, each on its own basis");
  Object.keys(res.rankings).forEach(k => L.push("- " + k + ": " + res.rankings[k].join(" > ")));
  if (res.graha_yuddha.length) { L.push(""); L.push("Graha yuddha: " + res.graha_yuddha.map(w => w.a + " and " + w.b + " " + w.separationDeg + " deg apart, provisional winner " + w.provisionalWinner).join("; ")); }
  L.push("");
  Object.keys(res.rows).forEach(n => {
    const r = res.rows[n];
    L.push("## " + n + (r.isNode ? " (separate node assessment)" : ""));
    if (r.step1) {
      const s = r.step1;
      L.push("Step 1. Shadbala " + s.totalRupa + " rupa against minimum " + s.minimumRupa + " = " + s.percent + " percent. Sthana " + s.components_rupa.sthana + ", Dig " + s.components_rupa.dig + ", Kala " + s.components_rupa.kala + ", Cheshta " + s.components_rupa.cheshta + ", Naisargika " + s.components_rupa.naisargika + ", Drik " + s.components_rupa.drik + ". Largest component " + s.strongestComponent + ", smallest " + s.weakestComponent + ".");
    } else {
      const a = r.nodeAssessment;
      L.push("Step 1. No Shadbala for nodes. Sign lord " + a.signLord + " (" + a.signLordDignity + ", house " + a.signLordHouse + ", Shadbala " + a.signLordShadbalaPercent + " percent). Star lord " + a.starLord + (a.starLordShadbalaPercent != null ? " (Shadbala " + a.starLordShadbalaPercent + " percent)" : "") + ".");
    }
    const s2 = r.step2;
    L.push("Step 2. " + s2.sign + " " + s2.degree + " deg, " + s2.dignity + ", house " + s2.houseFromLagna + " from Lagna and " + s2.houseFromMoon + " from Moon. Lordships from Lagna " + (s2.lordshipsFromLagna.join(" and ") || "none") + ", from Moon " + (s2.lordshipsFromMoon.join(" and ") || "none") + ". Sign lord: " + s2.signLordCondition + ". " + s2.nakshatra + "." + (s2.neechaBhanga.reasons.length ? " Neecha bhanga: " + s2.neechaBhanga.reasons.join("; ") + "." : (s2.dignity === "Debilitated" ? " No neecha bhanga found." : "")));
    const s3 = r.step3;
    L.push("Step 3. Navamsha " + s3.navamshaSign + " house " + s3.navamshaHouse + (s3.navamshaDignity ? ", " + s3.navamshaDignity : "") + (s3.vargottama ? ", VARGOTTAMA" : "") + (s3.vimshopaka ? ". Vimshopaka out of 20: Shadvarga " + s3.vimshopaka.shadvarga + ", Saptavarga " + s3.vimshopaka.saptavarga + ", Dashavarga " + s3.vimshopaka.dashavarga + ", Shodashavarga " + s3.vimshopaka.shodashavarga : "") + "." + (s3.topicVarga ? " " + s3.topicVarga.varga + ": " + s3.topicVarga.sign + ", house " + s3.topicVarga.houseInVarga + (s3.topicVarga.dignityInVarga ? ", " + s3.topicVarga.dignityInVarga : "") + (s3.topicVarga.inGoodHouse ? ", good house" : "") + "." : ""));
    const s4 = r.step4;
    L.push("Step 4. " + (s4.retrograde ? "Retrograde. " : "Direct. ") + (s4.separationFromSunDeg != null ? "Sun separation " + s4.separationFromSunDeg + " deg, combust " + (s4.combustVednetraFlag ? "yes" : "no") + ". " : "") + "War: " + s4.grahaYuddha + "." + (s4.ownerAdjusted ? " Owner adjusted Shadbala " + s4.ownerAdjusted.percent + " percent (" + s4.ownerAdjusted.cheshtaRule + "), kept apart from the mathematical " + r.step1.percent + " percent." : ""));
    const s5 = r.step5;
    L.push("Step 5 (interpretation only). Aspects from " + (s5.aspectsReceivedNaturalNatureOnly.join(", ") || "none") + ". Conjunct " + (s5.conjunctions.map(c => c.planet + " " + c.orbDeg + " deg").join(", ") || "none") + ". Yogas " + (s5.yogas.join(", ") || "none") + ".");
    if (r.step6) L.push("Step 6. Subject count " + r.step6.count + ": " + (r.step6.reasons.join("; ") || "no link") + ".");
    L.push("");
  });
  if (res.resolution) {
    const x = res.resolution;
    L.push("## Conflict resolution between " + x.candidates.join(" and "));
    x.stepDetail.forEach(d => L.push("- Step " + d.step + ": " + d.values.join(", ") + " -> " + d.winner));
    L.push("Votes: " + Object.keys(x.votes).map(k => k + " " + r2(x.votes[k])).join(", ") + ". Tie break order: steps " + x.tieBreakOrder.join(", ") + ".");
    L.push("RESULT: " + x.winner + " is the more powerful planet and enforces its result.");
    L.push("Owner adjusted ranking leader " + x.ownerAdjustedRankingLeader + ", " + (x.adjustedRankingAgrees ? "agrees with the result." : "differs from the result, so this is a lower confidence call."));
    if (x.flagsOnWinner.length) L.push("Flags on the winner: " + x.flagsOnWinner.join("; ") + ".");
    L.push(x.note);
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
  let res;
  try { res = analyse(cfg); } catch (e) { console.error("Error: " + e.message); process.exit(2); }
  process.stdout.write((argv.indexOf("--json") >= 0 ? JSON.stringify(res, null, 1) : toMarkdown(res)) + "\n");
}

module.exports = { analyse, toMarkdown };
