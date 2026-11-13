#!/usr/bin/env node
/*
 * SUJ engine, STRENGTH TALLY. Implements the owner's decision of round 6 for questions where evidence is both for and
 * against an option. The owner said to see whether the planets in favour or the planets in opposition are stronger,
 * and to decide on the strength of the planets on each side. So the tally weighs planets by their strength and does not
 * count factors.
 *
 * Rules as built
 *   1. Every piece of evidence names ONE planet, a side (for or against), an option, and a short factor text.
 *   2. Per option and side, each planet counts ONCE however many factors it brings. A planet can stand on both sides.
 *   3. A planet's weight is its Shadbala percent against the Santhanam minimum from Vednetra, the owner's first basis of
 *      strength. Rahu and Ketu have no Shadbala, so the Shadbala percent of their sign lord stands in for them and the
 *      row is flagged. This node proxy is the engine author's proposal. The owner adjusted weight is also computed,
 *      retrograde cheshta at 60 virupa and combust cheshta at zero, and shown beside, as in planet_strength.js.
 *   4. The score of an option is its favour weight divided by favour plus against weight, as a whole number from 0 to 100.
 *   5. For options with no order the highest score wins. A tie goes to the larger favour weight.
 *   6. For ORDERED options such as education levels, list them lowest first. Evidence for an option supports that option and
 *      every lower one. Evidence against an option means the native does not reach it, so it opposes that option and every
 *      higher one. The answer is the highest option whose score is above 50. If none is, the lowest.
 *   Which planet belongs on which side is a judgement of the analysis. The tool prints the evidence table so that the
 *   owner can check every placement.
 *
 * Usage
 *   node suj_engine/tools/strength_tally.js '{"gender":"female","date":"1993-01-06","time":"07:10:00","tz":5.5,"lat":27.1333,"lon":81.9667,
 *     "kind":"ordered","options":["High school","Intermediate","Graduation","Post graduation"],
 *     "evidence":[{"option":"Post graduation","side":"for","planet":"Mercury","factor":"5th lord from Moon, karaka"}, ...]}' [--json]
 * kind is ordered or choice. Prints a ready EVIDENCE TALLY line for the answer.
 */
const { analyse } = require("./planet_strength");

function tally(cfg) {
  const base = analyse(Object.assign({}, cfg, { topic: undefined, houses: undefined, karakas: undefined, candidates: ["Sun", "Moon"] }));
  const pct = {}, adj = {}, flag = {};
  ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"].forEach(p => {
    pct[p] = base.rows[p].step1.percent;
    const oa = base.rows[p].step4 && base.rows[p].step4.ownerAdjusted;
    adj[p] = oa && oa.percent != null ? oa.percent : base.rows[p].step1.percent;
  });
  ["Rahu", "Ketu"].forEach(n => {
    const lord = base.rows[n].step2 && base.rows[n].step2.signLord ? base.rows[n].step2.signLord : null;
    pct[n] = lord ? pct[lord] : 0; adj[n] = lord ? adj[lord] : 0; flag[n] = "node, weight of sign lord " + lord;
  });
  const opts = cfg.options, ordered = cfg.kind === "ordered";
  const ev = cfg.evidence || [];
  ev.forEach(e => { if (opts.indexOf(e.option) < 0) throw new Error("Evidence names an unknown option " + e.option); if (pct[e.planet] == null) throw new Error("Unknown planet " + e.planet); });
  const rows = opts.map((o, i) => {
    const forPl = new Set(), agPl = new Set();
    ev.forEach(e => {
      const j = opts.indexOf(e.option);
      if (e.side === "for") { if (ordered ? j >= i : j === i) forPl.add(e.planet); }
      else { if (ordered ? j <= i : j === i) agPl.add(e.planet); }
    });
    const sum = (s, m) => Array.from(s).reduce((a, p) => a + m[p], 0);
    const f = sum(forPl, pct), a = sum(agPl, pct), fa = sum(forPl, adj), aa = sum(agPl, adj);
    return { option: o, forPlanets: Array.from(forPl), againstPlanets: Array.from(agPl), favour: Math.round(f * 100) / 100, against: Math.round(a * 100) / 100,
      score: f + a ? Math.round(100 * f / (f + a)) : 0, scoreOwnerAdjusted: fa + aa ? Math.round(100 * fa / (fa + aa)) : 0 };
  });
  const pick = key => {
    if (ordered) { for (let i = rows.length - 1; i >= 0; i--) if (rows[i][key] > 50) return rows[i].option; return rows[0].option; }
    const mx = Math.max.apply(null, rows.map(r => r[key]));
    return rows.filter(r => r[key] === mx).sort((a, b) => b.favour - a.favour)[0].option;
  };
  return { kind: cfg.kind, options: opts, weights: { shadbalaPercent: pct, ownerAdjustedPercent: adj, flags: flag }, evidence: ev, rows,
    winner: pick("score"), winnerOwnerAdjusted: pick("scoreOwnerAdjusted"),
    tallyLine: "EVIDENCE TALLY " + rows.map(r => r.option + " " + r.score).join(", ") };
}

function render(r) {
  const L = ["# SUJ STRENGTH TALLY, " + r.kind + " options", ""];
  L.push("Evidence table. Check every placement.");
  r.evidence.forEach(e => L.push("- " + e.side.toUpperCase().padEnd(7) + e.option + " | " + e.planet + " " + r.weights.shadbalaPercent[e.planet] + " percent" + (r.weights.flags[e.planet] ? " " + r.weights.flags[e.planet] : "") + " | " + e.factor));
  L.push("", "Per option");
  r.rows.forEach(x => L.push("- " + x.option + ", favour " + x.favour + " from " + (x.forPlanets.join(" ") || "none") + ", against " + x.against + " from " + (x.againstPlanets.join(" ") || "none") + ", score " + x.score + ", owner adjusted score " + x.scoreOwnerAdjusted));
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
