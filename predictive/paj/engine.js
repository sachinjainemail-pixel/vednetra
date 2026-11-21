"use strict";
// PAJ engine: Parashari, Ashtakavarga and Jaimini rules applied to modern life-event questions.
// Scoring is rule based and every point is recorded as a reason so the answer can be traced.
const KB = require("./kb.json");
const { cast, SHORT, CLASSICAL } = require("./chart.js");

const HOUSE_HI = { 1: "पहले", 2: "दूसरे", 3: "तीसरे", 4: "चौथे", 5: "पांचवें", 6: "छठे", 7: "सातवें",
  8: "आठवें", 9: "नौवें", 10: "दसवें", 11: "ग्यारहवें", 12: "बारहवें" };
const HEALTH_NOTE = "यह केवल ज्योतिषीय संकेत है, चिकित्सा निदान नहीं। सही जांच और इलाज के लिए डॉक्टर से मिलें।";
const DOMAIN_KEY = { profession: "professions", course: "courses", disease: "diseases" };
const KARAKA_FOR = { profession: "AmK", course: "AmK", disease: "AK" };

const houseSign = (c, h) => (c.lagnaSign + h - 1) % 12;
const ph = (k) => KB.planetHi[k] || k;

function dignityPoints(p) {
  const d = (p.dignity || "").toLowerCase();
  if (d.startsWith("exalted") || d.startsWith("own")) return 1;
  if (d.startsWith("debilitated")) return -1;
  return 0;
}

// Activity of the running dasha at a moment: mahadasha and antardasha lords.
function dashaAt(c, t) {
  for (const md of c.dashas) {
    if (t >= md.start && t < md.end) {
      const ad = md.ads.find(a => t >= a.start && t < a.end) || md.ads[0];
      return { md: md.lord, ad: ad.lord };
    }
  }
  return { md: null, ad: null };
}

function scorePlanets(c, planets, houses, karakaKey, dasha) {
  let score = 0;
  const reasons = [];
  for (const k of planets) {
    const p = c.planets[k];
    if (!p) continue;
    for (const h of houses) {
      if (p.lordships.includes(h)) {
        score += 2;
        reasons.push([2, `${ph(k)} ${HOUSE_HI[h]} भाव का स्वामी है`]);
      }
    }
    if (houses.includes(p.house)) {
      score += 1;
      reasons.push([1, `${ph(k)} ${HOUSE_HI[p.house]} भाव में बैठा है`]);
    }
    const d = dignityPoints(p);
    if (d) {
      score += d;
      reasons.push([Math.abs(d), d > 0 ? `${ph(k)} उच्च या स्वराशि में है` : `${ph(k)} नीच राशि में है`]);
    }
    if (dasha.md === k) {
      score += 3;
      reasons.push([3, `अभी ${ph(k)} की महादशा चल रही है`]);
    } else if (dasha.ad === k) {
      score += 2;
      reasons.push([2, `अभी ${ph(k)} की अंतर्दशा चल रही है`]);
    }
    if (karakaKey && c.karakas[karakaKey] === k) {
      score += 2;
      reasons.push([2, `जैमिनी के ${karakaKey} कारक ${ph(k)} हैं`]);
    }
    if (houses.length && c.bav[k]) {
      const avg = houses.reduce((a, h) => a + c.bav[k][houseSign(c, h)], 0) / houses.length;
      if (avg >= 4) {
        score += 1;
        reasons.push([1, `अष्टकवर्ग में ${ph(k)} के बिंदु इन भावों में मज़बूत हैं`]);
      }
    }
  }
  reasons.sort((a, b) => b[0] - a[0]);
  return { score, reasons: reasons.map(r => r[1]) };
}

// Chooses one option from the knowledge base for a profession, course or disease question.
// options is an array of KB labels. If it is empty every KB entry is a candidate.
function answerDomain(c, domain, options, asOf) {
  const table = KB[DOMAIN_KEY[domain]];
  const when = asOf ? Date.parse(asOf) : Date.parse(c.birthIso);
  const dasha = dashaAt(c, when);
  const labels = options && options.length ? options : Object.keys(table);
  const rows = [];
  for (const label of labels) {
    const entry = table[label];
    if (!entry) throw new Error(`विकल्प ज्ञान आधार में नहीं है: ${label}`);
    const raw = scorePlanets(c, entry.planets, entry.houses, KARAKA_FOR[domain], dasha);
    const norm = raw.score / Math.max(entry.planets.length, 1);
    rows.push({ label, hi: entry.hi, score: Math.round(norm * 100) / 100, reasons: raw.reasons });
  }
  // Highest score wins. A tie goes to the option listed first.
  let best = rows[0];
  for (const r of rows) if (r.score > best.score) best = r;
  const entry = table[best.label];
  const planetsTxt = entry.planets.map(ph).join(", ");
  const housesTxt = entry.houses.map(h => `${HOUSE_HI[h]} भाव`).join(", ");
  const l1 = `${entry.hi} के लिए कारक ग्रह ${planetsTxt} हैं और ${housesTxt} से जुड़े हैं।`;
  const why = best.reasons.slice(0, 2);
  const l2 = why.length ? `इस कुंडली में ${why.join(" और ")}।` : "इस कुंडली में मुख्य कारक इसी विकल्प की ओर झुकते हैं।";
  return { choice: best.label, hi: entry.hi, score: best.score, lines: [l1, l2], table: rows, dasha };
}

// Yes or no for a life event in a date window. Looks at every antardasha overlapping the window.
function eventWindow(c, event, fromIso, toIso, gender) {
  const ev = KB.events[event];
  const male = String(gender || "").toLowerCase().startsWith("m");
  const karaka = male ? ev.karaka_male : ev.karaka_female;
  const keyPlanets = new Set([karaka]);
  for (const k of Object.keys(c.planets)) {
    const p = c.planets[k];
    if (ev.houses.some(h => p.lordships.includes(h)) || ev.houses.includes(p.house)) keyPlanets.add(k);
  }
  const from = Date.parse(fromIso), to = Date.parse(toIso);
  let best = { score: 0, md: null, ad: null };
  for (const md of c.dashas) {
    if (md.end < from || md.start > to) continue;
    for (const ad of md.ads) {
      if (ad.end < from || ad.start > to) continue;
      let sc = 0;
      if (keyPlanets.has(md.lord)) sc += 2;
      if (keyPlanets.has(ad.lord)) sc += 1;
      const jk = c.karakas[ev.jaimini];
      if (jk === md.lord || jk === ad.lord) sc += 1;
      if (sc > best.score) best = { score: sc, md: md.lord, ad: ad.lord };
    }
  }
  const hit = best.score >= 2;
  const l1 = hit ? "उत्तर हाँ" : "उत्तर नहीं";
  let l2;
  if (best.md) {
    l2 = `${ev.hi} के लिए इस अवधि में ${ph(best.md)} महादशा और ${ph(best.ad)} अंतर्दशा का संबंध ${ev.houses[0]}वें भाव या उसके कारक से बनता है।`;
    if (!hit) l2 = `${ev.hi} के लिए इस अवधि में ${ph(best.md)} महादशा और ${ph(best.ad)} अंतर्दशा का संबंध ${ev.houses[0]}वें भाव या उसके कारक से कमज़ोर है।`;
  } else {
    l2 = `${ev.hi} के लिए इस अवधि में कोई सहायक महादशा या अंतर्दशा नहीं मिली।`;
  }
  return { hit, lines: [l1, l2], best };
}

module.exports = { cast, answerDomain, eventWindow, HEALTH_NOTE, KB, dashaAt };
