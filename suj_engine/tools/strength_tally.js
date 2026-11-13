#!/usr/bin/env node
/*
 * SUJ engine, STRENGTH TALLY. Implements the owner's decision of round 6 for questions where evidence is both for and
 * against an option. The owner said to see whether the planets in favour or the planets in opposition are stronger,
 * and to decide on the strength of the planets on each side. So the tally weighs planets by their strength and does not
 * count factors.
 *
 * Rules as built
 *   1. Every piece of evidence names ONE planet, a side (for or against), an option, a TYPE and a short factor text.
 *   2. A planet's weight is its REAL STRENGTH S, from 0 to 100, not its Shadbala alone. Owner's example of round 7, the Sun is
 *      the 9th lord, which speaks for the option, but the Sun is debilitated in D9, so it is a weak 9th lord. Its weight as a
 *      carrier of the 9th house is weaker than its weight as a source of damage. S is the mean of
 *        m1 Shadbala percent after the owner's cheshta adjustment, divided by 2 and cut at 100, so double the minimum is full
 *        m2 D1 sign dignity, ordinal 0 to 6 as a share of 100, neecha bhanga counted as neutral
 *        m3 D9 dignity, the same ordinal scale
 *        m4 Vimshopaka Shadvarga out of 20 as a share of 100
 *        m5 the subject varga, only when a varga number is given, house good or not and dignity, equal halves
 *      This composite and its equal weights are the engine author's reading of the owner's six steps and await the owner.
 *   2a. OWNER'S RULE OF ROUND 8. An ASPECT always works by the planet's NATURAL significations, a natural benefic aspect is for,
 *      a natural malefic aspect is against, whatever house the planet lords for this ascendant. HOUSE OWNERSHIP works by the
 *      houses owned, most beneficial for a trine lord, somewhat beneficial for a kendra lord, harmful for a trik lord. So a
 *      planet that lords a house and also aspects is two separate pieces of evidence that can point in different directions.
 *      The tool therefore takes two typed entries and works out the side itself.
 *        type lordship  give planet, house, and ref lagna or moon. The tool checks that the planet really lords that house.
 *                       Trine houses 1 5 9 are for with factor 1.0, kendra houses 4 7 10 are for with factor 0.5, trik houses
 *                       6 8 12 are against with factor 1.0. Houses 2 3 11 are not covered by the owner's rule, factor 0 and
 *                       they are reported. The factors 1.0 and 0.5 are the engine author's reading of most and somewhat.
 *        type aspect    give planet. Side from the natural nature, Jupiter and Venus benefic, Sun Mars Saturn Rahu Ketu malefic,
 *                       Moon benefic from Shukla 6th tithi to Krishna 10th tithi, Mercury benefic unless it shares a sign with a
 *                       malefic. Weight S.
 *   3. The TYPE decides which weight a piece of evidence carries.
 *        role      the planet carries something favourable, lordship, karaka, placement, benefic aspect. Weight S.
 *        harm      the planet damages the subject from outside, a malefic aspect or conjunction. Weight S, a strong malefic
 *                  harms more and a weak one harms less.
 *        weakness  the planet's own condition damages the role it carries, debilitation, combustion, enemy sign, 6 8 12
 *                  placement, bad varga house. Weight 100 minus S. A planet that is strong has little weakness to count.
 *      So a planet that is both carrier and weak, the owner's Sun, counts S for and 100 minus S against. Whichever is larger
 *      is its real net effect, and S below 50 turns it against.
 *   4. Per option and side each planet counts ONCE, with its largest weight. A planet can stand on both sides.
 *   5. Rahu and Ketu have no Shadbala, so the S of their sign lord stands in for them and the row is flagged. This proxy is the
 *      engine author's proposal. S is also computed from the mathematical Shadbala percent without the owner's cheshta
 *      adjustment and the two results are shown, as in planet_strength.js.
 *   6. The score of an option is its favour weight divided by favour plus against weight, a whole number from 0 to 100.
 *   7. For options with no order the highest score wins. A tie goes to the larger favour weight.
 *   8. For ORDERED options such as education levels, list them lowest first. Evidence for an option supports that option and
 *      every lower one. Evidence against an option means the native does not reach it, so it opposes that option and every
 *      higher one. The answer is the highest option whose score is above 50. If none is, the lowest.
 *   Which planet belongs on which side, and of which type, is a judgement of the analysis. The tool prints the evidence table
 *   so that the owner can check every placement.
 *
 * Usage
 *   node suj_engine/tools/strength_tally.js '{"gender":"female","date":"1993-01-06","time":"07:10:00","tz":5.5,"lat":27.1333,"lon":81.9667,
 *     "kind":"ordered","options":["High school","Intermediate","Graduation","Post graduation"],
 *     "varga":24,
     "evidence":[{"option":"Post graduation","side":"for","type":"role","planet":"Mercury","factor":"5th lord from Moon, karaka"}, ...]}' [--json]
 * varga is optional, the number of the subject varga, 24 for education. type is role, harm or weakness. Default type is role
 * for side for and harm for side against.
 * kind is ordered or choice. Prints a ready EVIDENCE TALLY line for the answer.
 */
const fs = require("fs");
const path = require("path");
const { analyse } = require("./planet_strength");
const { loadVedicCore } = require("./vednetra_loader");
const KB = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "significations.json"), "utf8"));
const signLord = sg => { for (const p of Object.keys(KB.ownSigns)) if (KB.ownSigns[p].indexOf(sg) >= 0) return p; return null; };
const LORD_CLASS = { 1: ["trine", "for", 1], 5: ["trine", "for", 1], 9: ["trine", "for", 1], 4: ["kendra", "for", 0.5], 7: ["kendra", "for", 0.5], 10: ["kendra", "for", 0.5],
  6: ["trik", "against", 1], 8: ["trik", "against", 1], 12: ["trik", "against", 1], 2: ["not covered", null, 0], 3: ["not covered", null, 0], 11: ["not covered", null, 0] };

// natural nature by the owner's rules, Moon by tithi, Mercury by company
function naturalNature(cfg) {
  const VC = loadVedicCore(cfg.appDir);
  const t = String(cfg.time).length === 5 ? cfg.time + ":00" : cfg.time;
  const ch = VC.avEngineFor({ name: "x", gender: cfg.gender || "unspecified", birthISO: cfg.date + "T" + t, tz: Number(cfg.tz), lat: Number(cfg.lat), lon: Number(cfg.lon), place: "" }).chart;
  const P = ch.planetsByName, nat = { Sun: "malefic", Mars: "malefic", Saturn: "malefic", Rahu: "malefic", Ketu: "malefic", Jupiter: "benefic", Venus: "benefic" };
  const tithi = Math.floor(ch.moonPhaseAngle / 12) + 1;
  nat.Moon = tithi >= 6 && tithi <= 25 ? "benefic" : "malefic";
  const withMal = ["Sun", "Mars", "Saturn", "Rahu", "Ketu"].some(m => P[m].sign === P.Mercury.sign);
  nat.Mercury = withMal ? "malefic" : "benefic";
  return { nat, lagna: ch.ascendant.sign, moon: P.Moon.sign, tithi };
}

const DIGNITY = { "Exalted": 6, "Moolatrikona": 5, "Mulatrikona": 5, "Own": 4, "Own sign": 4, "Friendly sign": 3, "Friend": 3, "Neutral": 2, "Neutral sign": 2, "Enemy": 1, "Enemy sign": 1, "Debilitated": 0 };
const dig = d => (DIGNITY[d] != null ? DIGNITY[d] : 2) / 6 * 100;
const SEVEN = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
const r1 = x => Math.round(x * 10) / 10;

function strengths(cfg) {
  const withVarga = cfg.varga ? { houses: [], karakas: [], varga: cfg.varga } : { topic: undefined, houses: undefined, karakas: undefined };
  const base = analyse(Object.assign({}, cfg, withVarga, { candidates: ["Sun", "Moon"] }));
  const S = { math: {}, adj: {} }, parts = {}, flag = {}, shad = {};
  SEVEN.forEach(p => {
    const r = base.rows[p];
    const pct = r.step1.percent, adjPct = r.step4.ownerAdjusted && r.step4.ownerAdjusted.percent != null ? r.step4.ownerAdjusted.percent : pct;
    const m2 = dig(r.step2.dignity);
    const m3 = dig(r.step3.navamshaDignity);
    const m4 = r.step3.vimshopaka.shadvarga / 20 * 100;
    const tv = r.step3.topicVarga;
    const m5 = cfg.varga && tv ? ((tv.inGoodHouse ? 100 : 0) + dig(tv.dignityInVarga)) / 2 : null;
    const mean = m1 => { const a = [m1, m2, m3, m4]; if (m5 != null) a.push(m5); return a.reduce((x, y) => x + y, 0) / a.length; };
    S.math[p] = mean(Math.min(pct / 2, 100)); S.adj[p] = mean(Math.min(adjPct / 2, 100));
    shad[p] = pct;
    parts[p] = { shadbalaPercent: pct, ownerAdjustedPercent: adjPct, d1: r1(m2), d9: r1(m3), vimshopaka: r1(m4), subjectVarga: m5 == null ? null : r1(m5) };
  });
  ["Rahu", "Ketu"].forEach(n => {
    const lord = base.rows[n].step2.signLord;
    S.math[n] = S.math[lord]; S.adj[n] = S.adj[lord]; shad[n] = shad[lord]; flag[n] = "node, strength of sign lord " + lord;
    parts[n] = { proxy: lord };
  });
  return { S, parts, flag, shad };
}

function tally(cfg) {
  const st = strengths(cfg);
  const weight = (e, which) => {
    const s = st.S[which][e.planet];
    return (e.type === "weakness" ? 100 - s : s) * (e.mult == null ? 1 : e.mult);
  };
  const opts = cfg.options, ordered = cfg.kind === "ordered";
  const ev = cfg.evidence || [];
  const ctx = naturalNature(cfg), notCovered = [];
  ev.forEach(e => {
    if (e.type === "lordship") {
      const ref = e.ref === "moon" ? ctx.moon : ctx.lagna;
      const lord = signLord((ref + Number(e.house) - 1) % 12);
      if (lord !== e.planet) throw new Error(e.planet + " does not lord house " + e.house + " from the " + (e.ref || "lagna") + ", the lord is " + lord);
      const c = LORD_CLASS[Number(e.house)];
      e.klass = c[0]; e.side = c[1] || "for"; e.factor = c[2];
      if (!c[1]) notCovered.push(e.planet + " lords house " + e.house);
      e.factor_text = e.factor_text || (e.planet + " lords house " + e.house + " from the " + (e.ref || "lagna") + ", " + c[0] + " lord");
      e.factor = e.factor_text; e.mult = c[2];
    } else if (e.type === "aspect") {
      e.klass = ctx.nat[e.planet]; e.side = e.klass === "benefic" ? "for" : "against"; e.mult = 1;
      e.factor = e.factor || (e.planet + " aspect, natural " + e.klass);
    } else e.mult = 1;
  });
  ev.forEach(e => {
    if (e.type !== "lordship" && e.type !== "aspect") e.type = e.type || (e.side === "for" ? "role" : "harm");
    if (opts.indexOf(e.option) < 0) throw new Error("Evidence names an unknown option " + e.option);
    if (st.S.math[e.planet] == null) throw new Error("Unknown planet " + e.planet);
    if (["role", "harm", "weakness", "lordship", "aspect"].indexOf(e.type) < 0) throw new Error("Unknown type " + e.type);
    if (e.type === "weakness" && e.side !== "against") throw new Error("A weakness is evidence against, not for");
    if (e.type === "role" && e.side !== "for") throw new Error("A role is evidence for, give the type harm or weakness for evidence against");
  });
  const rows = opts.map((o, i) => {
    const forW = {}, agW = {}, forWa = {}, agWa = {};
    ev.forEach(e => {
      const j = opts.indexOf(e.option);
      const apply = e.side === "for" ? (ordered ? j >= i : j === i) : (ordered ? j <= i : j === i);
      if (!apply || e.mult === 0) return;
      const tgt = e.side === "for" ? [forW, forWa] : [agW, agWa];
      tgt[0][e.planet] = Math.max(tgt[0][e.planet] || 0, weight(e, "math"));
      tgt[1][e.planet] = Math.max(tgt[1][e.planet] || 0, weight(e, "adj"));
    });
    const sum = m => Object.values(m).reduce((a, b) => a + b, 0);
    const f = sum(forW), a = sum(agW), fa = sum(forWa), aa = sum(agWa);
    return { option: o, forPlanets: Object.keys(forW).map(p => p + " " + r1(forW[p])), againstPlanets: Object.keys(agW).map(p => p + " " + r1(agW[p])),
      favour: r1(f), against: r1(a),
      score: f + a ? Math.round(100 * f / (f + a)) : 0, scoreOwnerAdjusted: fa + aa ? Math.round(100 * fa / (fa + aa)) : 0 };
  });
  const pick = key => {
    if (ordered) { for (let i = rows.length - 1; i >= 0; i--) if (rows[i][key] > 50) return rows[i].option; return rows[0].option; }
    const mx = Math.max.apply(null, rows.map(r => r[key]));
    return rows.filter(r => r[key] === mx).sort((a, b) => b.favour - a.favour)[0].option;
  };
  return { kind: cfg.kind, options: opts, weights: { strength: Object.fromEntries(Object.keys(st.S.math).map(p => [p, r1(st.S.math[p])])), strengthOwnerAdjusted: Object.fromEntries(Object.keys(st.S.adj).map(p => [p, r1(st.S.adj[p])])), parts: st.parts, flags: st.flag }, evidence: ev, rows,
    notCovered, winner: pick("score"), winnerOwnerAdjusted: pick("scoreOwnerAdjusted"),
    tallyLine: "EVIDENCE TALLY " + rows.map(r => r.option + " " + r.score).join(", ") };
}

function render(r) {
  const L = ["# SUJ STRENGTH TALLY, " + r.kind + " options", ""];
  L.push("Real strength S of each planet, 0 to 100, with its parts. Shadbala percent, D1 dignity, D9 dignity, Vimshopaka, subject varga.");
  Object.keys(r.weights.strength).forEach(p => {
    const x = r.weights.parts[p];
    L.push("- " + p.padEnd(8) + "S " + String(r.weights.strength[p]).padEnd(6) + (x.proxy ? "node, takes " + x.proxy : "Shadbala " + x.shadbalaPercent + ", D1 " + x.d1 + ", D9 " + x.d9 + ", Vimshopaka " + x.vimshopaka + (x.subjectVarga != null ? ", varga " + x.subjectVarga : "")));
  });
  L.push("", "Evidence table. Check every placement and type.");
  r.evidence.forEach(e => { const s = r.weights.strength[e.planet]; const m = e.mult == null ? 1 : e.mult; L.push("- " + e.side.toUpperCase() + " " + e.option + " | " + e.planet + " " + e.type + (e.klass ? " " + e.klass : "") + " weight " + r1((e.type === "weakness" ? 100 - s : s) * m) + (m !== 1 ? " factor " + m : "") + (r.weights.flags[e.planet] ? " " + r.weights.flags[e.planet] : "") + " | " + e.factor); });
  L.push("", "Per option");
  r.rows.forEach(x => L.push("- " + x.option + ", favour " + x.favour + " from " + (x.forPlanets.join(", ") || "none") + ", against " + x.against + " from " + (x.againstPlanets.join(", ") || "none") + ", score " + x.score + ", owner adjusted score " + x.scoreOwnerAdjusted));
  L.push("", "Winner " + r.winner + ". Winner on the owner adjusted weights " + r.winnerOwnerAdjusted + (r.winner === r.winnerOwnerAdjusted ? ", the two agree." : ", the two differ, state it as a counter point."));
  if (r.notCovered.length) L.push("", "Not covered by the owner's rule, weight zero, " + r.notCovered.join(", ") + ". They stay outside the owner's classes in the natal tally. Laghu Parashari calls the 3rd and 11th lords doshi and the 2nd and 12th lords sama, but only for the dasha of that planet, see functional_nature.js.");
  L.push("", r.tallyLine);
  return L.join("\n");
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  const arg = argv.find(a => a.trim().startsWith("{"));
  if (!arg) { console.error("Usage: strength_tally.js '{json}' [--json]"); process.exit(2); }
  const res = tally(JSON.parse(arg));
  console.log(argv.indexOf("--json") >= 0 ? JSON.stringify(res, null, 1) : render(res));
}
module.exports = { tally, render };
