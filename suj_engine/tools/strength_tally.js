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
const { analyse } = require("./planet_strength");

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
    return e.type === "weakness" ? 100 - s : s;
  };
  const opts = cfg.options, ordered = cfg.kind === "ordered";
  const ev = cfg.evidence || [];
  ev.forEach(e => {
    e.type = e.type || (e.side === "for" ? "role" : "harm");
    if (opts.indexOf(e.option) < 0) throw new Error("Evidence names an unknown option " + e.option);
    if (st.S.math[e.planet] == null) throw new Error("Unknown planet " + e.planet);
    if (["role", "harm", "weakness"].indexOf(e.type) < 0) throw new Error("Unknown type " + e.type);
    if (e.type === "weakness" && e.side !== "against") throw new Error("A weakness is evidence against, not for");
    if (e.type === "role" && e.side !== "for") throw new Error("A role is evidence for, give the type harm or weakness for evidence against");
  });
  const rows = opts.map((o, i) => {
    const forW = {}, agW = {}, forWa = {}, agWa = {};
    ev.forEach(e => {
      const j = opts.indexOf(e.option);
      const apply = e.side === "for" ? (ordered ? j >= i : j === i) : (ordered ? j <= i : j === i);
      if (!apply) return;
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
    winner: pick("score"), winnerOwnerAdjusted: pick("scoreOwnerAdjusted"),
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
  r.evidence.forEach(e => { const s = r.weights.strength[e.planet]; L.push("- " + e.side.toUpperCase() + " " + e.option + " | " + e.planet + " " + e.type + " weight " + r1(e.type === "weakness" ? 100 - s : s) + (r.weights.flags[e.planet] ? " " + r.weights.flags[e.planet] : "") + " | " + e.factor); });
  L.push("", "Per option");
  r.rows.forEach(x => L.push("- " + x.option + ", favour " + x.favour + " from " + (x.forPlanets.join(", ") || "none") + ", against " + x.against + " from " + (x.againstPlanets.join(", ") || "none") + ", score " + x.score + ", owner adjusted score " + x.scoreOwnerAdjusted));
  L.push("", "Winner " + r.winner + ". Winner on the owner adjusted weights " + r.winnerOwnerAdjusted + (r.winner === r.winnerOwnerAdjusted ? ", the two agree." : ", the two differ, state it as a counter point."));
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
