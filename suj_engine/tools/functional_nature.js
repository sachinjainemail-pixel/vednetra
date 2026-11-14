#!/usr/bin/env node
/*
 * SUJ engine, FUNCTIONAL NATURE FOR DASHA RESULTS. The owner said, round 9, that Laghu Parashari is for dasha results ONLY, for the
 * planet concerned, in its own Mahadasha, Antardasha, Pratyantardasha, Sookshma or Prana. It does not feed the natal strength
 * tally, where the owner's own classes govern. A planet gives the results of the houses it owns in its dasha, and that is separate
 * from its natural nature, which governs its aspects. This tool prints, for the Lagna of the native, the Laghu Parashari class of every planet and the role of the
 * running Mahadasha, Antardasha and Pratyantardasha lords. Houses and positions come from Vednetra.
 *
 * Rules used, all from suj_engine/rules/rules_index.json
 *   LP-023-9, 023-13, 023-15  kendresha 1 4 7 10, trikonesha 5 9, trishadayesha 3 6 11
 *   LP-023-16   dosha type 1 is owning 3 6 8 or 11. Dosha type 2 is kendradhipatya dosha, a benefic owning a kendra. The benefics
 *               are Jupiter, Venus, Mercury only when it shares a sign with a malefic, and the Moon.
 *   LP-024-13   yogakaraka, the planet that gives exceedingly auspicious results, a kendresha and a trikonesha in mutual relation
 *   LP-024-18   houses 2 and 12 and their lords are sama, neither auspicious nor inauspicious
 *   LP-024-7, 8 the 2nd and the 7th are maraka houses and their lords are marakesha
 *   LP-052-4    the kendradhipatya dosha is strongest for Jupiter and Venus
 *   LP-054-3    the dosha is triggered only when the planet owns a kendra AND stands in a kendra in a sign not its own, order
 *               Jupiter and Venus, then Mercury, then Moon, the 7th is the most dangerous kendra
 *   LP-085-5    yogakaraka test used in the library's own table, a trikonesha whose other sign is not the 3rd, 6th or 11th
 *   LP-085-3, 085-2, 086-1, 086-2  in dasha, benefic planets are promoters, malefic planets are obstructers, but a malefic
 *               connected to the yogakarakas gives the yoga's fruit in proportion to its own strength, and does not lose its
 *               marakatva. LP-085-8, a maraka's dasha gives auspicious fruit first and inauspicious later.
 * Differences from the owner's three classes, which govern the strength tally. The owner says trine most beneficial, kendra
 * somewhat, trik 6 8 12 harmful. Laghu Parashari puts the 3rd and 11th lords among the doshi, and the 2nd and 12th lords among
 * the sama. The owner has settled it, round 9. The owner's classes are for the natal tally and Laghu Parashari is for the dasha
 * of the planet concerned. The tool prints both columns only so that they can be seen side by side.
 * Connection, sambandha, is shown only as sharing a sign, a sign exchange, or an aspect either way. For the planets, that is the
 * engine author's simplification. For Rahu and Ketu the library says conjunction only, LP-057-4 and LP-062-2.
 *
 * RAHU AND KETU, round 10, from the direct rules of Laghu Parashari sloka 13, pages 56 to 62.
 *   LP-060-2, LP-061-3  the nodes own no sign, so no sign lordship, no exaltation, no debilitation. Judge them only by the house
 *                       occupied and by the planet they are conjoined with.
 *   LP-056-6            first the house occupied, then judge it by the Parashari classes kendra, trikona, trika, maraka, and the
 *                       node inherits that verdict. Then the conjoined planet, read through the houses it lords.
 *   LP-062-1            the ready reckoner. The node becomes the lord of the house it occupies. With a companion planet its result
 *                       follows that planet. Alone, it follows the house. Alone in a trikona it is shubha, in the 8th shubha, in a
 *                       kendra sama, in the 2nd or 7th marakesha, in the 12th sama but vyayakaraka, in 3 6 11 papi. Rahu is
 *                       held cruel and Ketu sama or shubha.
 *   LP-057-2            the node doubles the result of the lord of the house it occupies. In a kendra or trikona and conjoined with a
 *                       kendresha or trikonesha it is a yogakaraka. With a karaka it turns karaka, with a maraka it turns maraka.
 *   LP-062-3            in the 2nd or 7th with a benefic that lords the 2nd or 7th, it is certainly a marakesha.
 *   LP-058-3            the author's own override. With the Sun or the Moon the node cannot give Sun like or Moon like results, so the
 *                       house verdict is used. Rahu in the 7th is inauspicious for the spouse, in the 5th for progeny, and in 3 6 11
 *                       the node increases the results of those houses.
 *
 *   node suj_engine/tools/functional_nature.js '{"gender":"female","date":"1993-01-06","time":"07:10:00","tz":5.5,"lat":27.1333,"lon":81.9667,"asOf":"2026-11-13"}'
 */
const fs = require("fs");
const path = require("path");
const { loadVedicCore } = require("./vednetra_loader");
const KB = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "significations.json"), "utf8"));
const SEVEN = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
const ASPECT = { Sun: [7], Moon: [7], Mercury: [7], Venus: [7], Mars: [4, 7, 8], Jupiter: [5, 7, 9], Saturn: [3, 7, 10] };
const houseFrom = (sign, ref) => ((sign - ref + 12) % 12) + 1;
const owned = p => KB.ownSigns[p] || [];

function nature(cfg) {
  const VC = loadVedicCore(cfg.appDir);
  const t = String(cfg.time).length === 5 ? cfg.time + ":00" : cfg.time;
  const chart = VC.avEngineFor({ name: "x", gender: cfg.gender || "unspecified", birthISO: cfg.date + "T" + t, tz: Number(cfg.tz), lat: Number(cfg.lat), lon: Number(cfg.lon), place: "" }).chart;
  const P = chart.planetsByName, lagna = chart.ascendant.sign;
  const asOf = cfg.asOf ? new Date(cfg.asOf) : new Date();
  const stack = VC.findDashaStack(chart.vimshottari.timeline, asOf);
  const malefics = ["Sun", "Mars", "Saturn", "Rahu", "Ketu"];
  const mercuryPapa = malefics.some(m => P[m].sign === P.Mercury.sign);
  const rows = {};
  SEVEN.forEach(pl => {
    const houses = owned(pl).map(s => houseFrom(s, lagna)).sort((a, b) => a - b);
    const kendresha = houses.filter(h => [1, 4, 7, 10].indexOf(h) >= 0), trikonesha = houses.filter(h => [5, 9].indexOf(h) >= 0 || h === 1);
    const trishaday = houses.filter(h => [3, 6, 11].indexOf(h) >= 0), sama = houses.filter(h => [2, 12].indexOf(h) >= 0), eighth = houses.indexOf(8) >= 0;
    const marakaLord = houses.filter(h => [2, 7].indexOf(h) >= 0);
    const benefic = pl === "Jupiter" || pl === "Venus" || pl === "Moon" || (pl === "Mercury" && mercuryPapa);
    const trik = houses.filter(h => [6, 8, 12].indexOf(h) >= 0);
    // yogakaraka by LP-085-5, a trikonesha 5 or 9 whose other sign is not in 3 6 11. A lagna lord that is also a trikonesha counts the same way.
    const trik59 = houses.filter(h => h === 5 || h === 9);
    const yogakaraka = trik59.length > 0 && trishaday.length === 0;
    const ownKendraAndTrikona = kendresha.some(h => h !== 1) && trik59.length > 0;
    const dosha1 = houses.filter(h => [3, 6, 8, 11].indexOf(h) >= 0);
    const kendraOwner = kendresha.length > 0;
    const posHouse = P[pl].house, inKendra = [1, 4, 7, 10].indexOf(posHouse) >= 0, ownSign = owned(pl).indexOf(P[pl].sign) >= 0;
    const dosha2 = benefic && kendraOwner;
    const triggered = dosha2 && inKendra && !ownSign;
    const order = { Jupiter: 1, Venus: 1, Mercury: 2, Moon: 3 }[pl];
    let role = "neutral";
    if (yogakaraka || ownKendraAndTrikona) role = "sadhaka, promoter, yogakaraka";
    else if (trikonesha.length && trishaday.length === 0) role = "sadhaka, promoter";
    else if (trishaday.length || eighth) role = "badhaka, obstructer unless connected to a yogakaraka";
    rows[pl] = { houses, kendresha, trikonesha, trishaday, sama, eighth, marakaLord, trik, owner: (() => { const c = []; if (trikonesha.length) c.push("most beneficial, trine " + trikonesha.join(" ")); if (kendresha.some(h => h !== 1)) c.push("somewhat beneficial, kendra " + kendresha.filter(h => h !== 1).join(" ")); if (trik.length) c.push("harmful, trik " + trik.join(" ")); return c.length ? c.join(" and ") : "not covered"; })(),
      yogakaraka: yogakaraka || ownKendraAndTrikona, dosha1, dosha2, triggered, doshaOrder: order, in: posHouse + " in " + P[pl].signName + (ownSign ? ", own sign" : ""), role };
  });
  // Rahu and Ketu by LP-056-6, LP-062-1, LP-057-2, LP-062-3, LP-058-3
  const nodeRows = {};
  ["Rahu", "Ketu"].forEach(n => {
    const h = P[n].house;
    let hv, hwhy;
    if ([1, 5, 9].indexOf(h) >= 0) { hv = "shubha"; hwhy = "trikona house " + h; }
    else if (h === 8) { hv = "shubha"; hwhy = "the 8th, an 8th lord in the 8th is reckoned good"; }
    else if (h === 2 || h === 7) { hv = "marakesha"; hwhy = "the " + h + (h === 2 ? "nd" : "th") + " house, a maraka house"; }
    else if (h === 4 || h === 10) { hv = "sama"; hwhy = "kendra house " + h; }
    else if (h === 12) { hv = "sama but vyayakaraka, a causer of expenditure"; hwhy = "the 12th house"; }
    else { hv = "papi"; hwhy = "trishaday house " + h; }
    const comp = SEVEN.filter(q => P[q].sign === P[n].sign);
    const lum = comp.filter(q => q === "Sun" || q === "Moon");
    const usable = comp.filter(q => q !== "Sun" && q !== "Moon");
    let verdict = hv, basis = "alone, follows the house, LP-062-1";
    if (usable.length) {
      verdict = usable.map(q => q + ", " + rows[q].role + (rows[q].marakaLord.length ? ", marakesha" : "")).join(" and ");
      basis = "with " + usable.join(" and ") + ", follows the companion read through its houses, LP-056-6 and LP-062-1";
    } else if (lum.length) {
      basis = "with " + lum.join(" and ") + ", the node cannot give " + lum.join(" or ") + " like results, so the house verdict is used, LP-058-3";
    }
    const kendraTrikona = [1, 4, 5, 7, 9, 10].indexOf(h) >= 0;
    const ykWith = usable.filter(q => rows[q].kendresha.length || rows[q].trikonesha.length);
    const yogakaraka = kendraTrikona && ykWith.length > 0;
    const benefics = ["Jupiter", "Venus", "Moon", "Mercury"];
    const certainMaraka = (h === 2 || h === 7) && comp.some(q => benefics.indexOf(q) >= 0 && (rows[q].houses.indexOf(2) >= 0 || rows[q].houses.indexOf(7) >= 0));
    const houseLord = KB.ownSigns && (Object.keys(KB.ownSigns).find(q => KB.ownSigns[q].indexOf((chart.ascendant.sign + h - 1) % 12) >= 0) || null);
    const notes = [];
    if (h === 7) notes.push("Rahu or Ketu in the 7th is inauspicious for the spouse whatever else, LP-058-3");
    if (h === 5) notes.push("a node in the 5th brings misfortune in progeny, LP-058-3");
    if ([3, 6, 11].indexOf(h) >= 0) notes.push("a node in the " + h + "th increases that house's results, LP-058-3, " + ({ 3: "courage", 6: "destruction of enemies", 11: "gain of wealth" })[h]);
    if (n === "Rahu") notes.push("Rahu is held cruel, LP-062-1"); else notes.push("Ketu is held sama or shubha, LP-062-1");
    let role = verdict;
    if (!usable.length) role = hv.indexOf("shubha") === 0 ? "sadhaka, promoter" : (hv.indexOf("papi") === 0 ? "badhaka, obstructer" : (hv === "marakesha" ? "marakesha" : "neutral" + (h === 12 ? " but a causer of expenditure" : "")));
    else role = usable.map(q => rows[q].role.split(",")[0]).join(" and ") + (usable.some(q => rows[q].marakaLord.length) ? ", marakesha" : "");
    if (yogakaraka) role = "yogakaraka, " + role;
    if (certainMaraka) role = "certainly marakesha, " + role;
    nodeRows[n] = { house: h, houseVerdict: hv, houseWhy: hwhy, companions: comp, basis, verdict, role, yogakaraka, certainMaraka, doubles: houseLord, notes };
  });
  // connections among yogakarakas and the planet
  const yk = SEVEN.filter(p => rows[p].yogakaraka);
  const conn = (a, b) => {
    const out = [];
    if (P[a].sign === P[b].sign) out.push("same sign");
    if (owned(a).indexOf(P[b].sign) >= 0 && owned(b).indexOf(P[a].sign) >= 0) out.push("sign exchange");
    if ((ASPECT[a] || []).indexOf(houseFrom(P[b].sign, P[a].sign)) >= 0) out.push(a + " aspects " + b);
    if ((ASPECT[b] || []).indexOf(houseFrom(P[a].sign, P[b].sign)) >= 0) out.push(b + " aspects " + a);
    return out;
  };
  const connections = {};
  SEVEN.forEach(p => { connections[p] = yk.filter(y => y !== p).map(y => ({ with: y, how: conn(p, y) })).filter(x => x.how.length); });
  return { lagna: VC.SIGNS[lagna].name, asOf: asOf.toISOString().slice(0, 10), dasha: stack.map(x => ({ level: x.level, lord: x.lord, from: x.start.toISOString().slice(0, 10), to: x.end.toISOString().slice(0, 10) })), rows, nodes: nodeRows, yogakarakas: yk, connections, mercuryPapaYuta: mercuryPapa };
}

function render(r) {
  const L = ["# SUJ FUNCTIONAL NATURE by Laghu Parashari, Lagna " + r.lagna + ", as of " + r.asOf, ""];
  L.push("Yogakarakas by the library's own test, LP-085-5 " + (r.yogakarakas.join(", ") || "none") + ". Mercury " + (r.mercuryPapaYuta ? "shares a sign with a malefic, so it counts as a benefic for the dosha" : "does not share a sign with a malefic"));
  L.push("");
  SEVEN.forEach(p => {
    const x = r.rows[p];
    const bits = [];
    if (x.trikonesha.length) bits.push("trikonesha " + x.trikonesha.join(" "));
    if (x.kendresha.length) bits.push("kendresha " + x.kendresha.join(" "));
    if (x.trishaday.length) bits.push("trishadayesha " + x.trishaday.join(" "));
    if (x.eighth) bits.push("ashtamesha");
    if (x.sama.length) bits.push("sama lord " + x.sama.join(" "));
    if (x.marakaLord.length) bits.push("marakesha " + x.marakaLord.join(" "));
    if (x.dosha1.length) bits.push("dosha type 1 for " + x.dosha1.join(" "));
    if (x.dosha2) bits.push("kendradhipatya dosha" + (x.triggered ? " TRIGGERED, placed in a kendra not in its own sign, strength order " + x.doshaOrder : ", not triggered"));
    L.push("- " + p.padEnd(8) + "owns " + x.houses.join(" ") + ", stands in " + x.in + ". " + bits.join("; ") + ". Owner's class " + x.owner + ". Dasha role " + x.role + ".");
  });
  L.push("", "Rahu and Ketu, from the house they occupy and the planet they sit with, never from a sign, LP-060-2");
  ["Rahu", "Ketu"].forEach(n => { const x = r.nodes[n];
    L.push("- " + n.padEnd(6) + "stands in house " + x.house + ", " + x.houseWhy + ", house verdict " + x.houseVerdict + ". " + x.basis + ". Result " + x.verdict + ". Dasha role " + x.role + (x.yogakaraka ? ". Nodal yogakaraka, LP-057-2" : "") + (x.certainMaraka ? ". Certain marakesha, LP-062-3" : "") + ". Doubles the result of " + (x.doubles || "the lord of that house") + ", LP-057-2. " + x.notes.join(". ") + "."); });
  L.push("", "Connections of each planet with the yogakarakas, shown as same sign, exchange or aspect either way");
  SEVEN.forEach(p => { if (r.connections[p].length) L.push("- " + p + " " + r.connections[p].map(c => c.with + " by " + c.how.join(", ")).join("; ")); });
  L.push("", "Running dasha at the as of date, all five levels");
  const LEVEL = { MD: "Mahadasha", AD: "Antardasha", PD: "Pratyantardasha", SD: "Sookshma", PR: "Prana" };
  r.dasha.forEach(d => { const x = r.rows[d.lord]; L.push("- " + (LEVEL[d.level] || d.level) + " " + d.lord + " " + d.from + " to " + d.to + (x ? ", " + x.role + (x.triggered ? ", kendradhipatya dosha triggered" : "") + (x.marakaLord.length ? ", marakesha" : "") : ", node, " + r.nodes[d.lord].role)); });
  L.push("", "Reading rules. A malefic dasha obstructs, LP-085-3, unless the planet is connected to a yogakaraka, then it gives the yoga's fruit in proportion to its own strength, LP-086-1, and its marakatva stays, LP-086-2. A maraka's dasha gives auspicious fruit first and inauspicious later, LP-085-8.");
  return L.join("\n");
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  const arg = argv.find(a => a.trim().startsWith("{"));
  if (!arg) { console.error("Usage: functional_nature.js '{json}' [--json]"); process.exit(2); }
  const res = nature(JSON.parse(arg));
  console.log(argv.indexOf("--json") >= 0 ? JSON.stringify(res, null, 1) : render(res));
}
module.exports = { nature, render };
