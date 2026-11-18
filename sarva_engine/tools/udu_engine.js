/*
 * SARVA engine, Udu column on the Udu corpus. Used by promise_layer.js when the corpus is installed, see udu_rules.js.
 *
 * It follows the Udu document as far as a program can. The Moon nakshatra rules are read first, then the rules of the graha that drives the question, in the files the question routes to.
 * A rule fires only when its placement matches the chart, the nakshatra, the pada, the graha, the house lord, and every condition of its IF line that can be tested is true.
 * A rule whose IF line holds a condition this program cannot test is not summed. It is counted as nearly fired and left out, as the document asks, and the count is printed.
 * Weight equals polarity times confidence times specificity. Mixed rules weigh 0. A pada rule overrules a house or sign rule of the opposite polarity for the same graha, and the overruled rule is named.
 * The sums are printed rule by rule with the arithmetic. No rule is paraphrased, an id is cited only when the rule fired.
 *
 * SARVA reconciliation, the Udu document gives bands and no option choice. The cell is the option with the highest sum of DIRECT rules, rules whose THEN or IF line names the option, and where no option has a
 * direct rule, the option with the highest sum of LINK rules, rules of a graha that carries the option houses. A tie goes to the option with the pada level rule, then to the first listed, and says so.
 * A UDU rule is never cited for a timing claim. The period test uses the computed Vimshottari and adds no weight.
 */
const U = require("./udu_rules.js");
const NAKS = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"];
const PL = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
const PLRX = "(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)";
const ORD = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12 };
const STOP = new Set(["women", "woman", "female", "child", "children", "mother", "father", "husband", "wife", "young", "people", "public", "money", "health", "body", "mind", "head", "family", "relative", "relatives", "job", "jobs", "service", "services", "specialist", "professional", "profession", "practitioner", "employee", "worker", "officer", "own", "general", "doctor", "medical", "work", "career", "sector", "company", "sale", "dealer", "owner", "type", "business?"]);

// ---------------------------------------------------------------- chart facts
function facts(C) {
  const F = { pl: {}, C };
  PL.forEach(n => { const p = C.P[n]; if (!p) return; F.pl[n] = { n, nk: U.nakKey(p.nakshatra), pada: p.pada, house: p.house, sign: p.sign, p }; });
  const lon = C.ch.ascendant.lon, w = 360 / 27;
  F.asc = { nk: U.nakKey(NAKS[Math.floor(lon / w)]), pada: Math.floor((lon % w) / (w / 4)) + 1 };
  F.moon = F.pl.Moon;
  return F;
}
const conj = (F, a, b) => F.pl[a] && F.pl[b] && F.pl[a].sign === F.pl[b].sign;
const aspects = (F, by, target) => F.pl[by] && F.pl[target] && by !== target && F.C.grahaAsp(by, F.pl[target].house);

// ---------------------------------------------------------------- the IF line
function listOf(txt) { const m = txt.match(new RegExp(PLRX, "g")) || []; return m; }
// returns { known:boolean, ok:boolean }. known false means the IF line holds a condition this program cannot test.
function evalIf(r, subject, F) {
  let t = " " + r.if.replace(/[()]/g, " ") + " ";
  let ok = true;
  const sub = subject;
  const take = (rx, fn) => { t = t.replace(rx, (...m) => { const v = fn(m); if (v === false) ok = false; return " "; }); };
  if (sub) {
    take(new RegExp("aspected or conjunct (?:by )?((?:the )?" + PLRX + "(?:(?:,| or| and)(?: the)? " + PLRX + ")*)", "gi"), m => { const L = listOf(m[1]); const f = x => aspects(F, x, sub) || conj(F, x, sub); return /\band\b/i.test(m[1]) ? L.every(f) : L.some(f); });
    take(new RegExp("aspected by ((?:the )?" + PLRX + "(?:(?:,| or| and)(?: the)? " + PLRX + ")*)", "gi"), m => { const L = listOf(m[1]); const f = x => aspects(F, x, sub); return /\band\b/i.test(m[1]) ? L.every(f) : L.some(f); });
    take(new RegExp("(?:conjunct|conjoined with|joined (?:by|with)|together with|with) ((?:the )?" + PLRX + "(?:(?:,| or| and)(?: the)? " + PLRX + ")*)", "gi"), m => { const L = listOf(m[1]); const f = x => conj(F, x, sub); return /\band\b/i.test(m[1]) ? L.every(f) : L.some(f); });
    take(/in the (\d+)(?:st|nd|rd|th) house/gi, m => F.pl[sub].house === Number(m[1]));
    take(/in house (\d+)/gi, m => F.pl[sub].house === Number(m[1]));
    take(/\bdebilitated\b/gi, () => /Debilitated/i.test(F.pl[sub].p.dignity || ""));
    take(/\bexalted\b/gi, () => /Exalted/i.test(F.pl[sub].p.dignity || ""));
    take(/\bretrograde\b/gi, () => !!F.pl[sub].p.retrograde);
    take(/\bcombust\b/gi, () => !!F.pl[sub].p.combust);
  }
  // the sex of the native. The corpus has sex specific rules, the IF line then says male or female.
  const ifl = r.if.toLowerCase(); const g = (F.C.input.gender || "").toLowerCase();
  if (g === "male" || g === "female") {
    const wantsF = /\b(female|woman|women|girl|girls|wife|daughter)\b/.test(ifl) && /\b(born|native|person|she|her|female|woman|girl)\b/.test(ifl), wantsM = /\b(male|man|men|boy)\b/.test(ifl.replace(/\bfemale\b/g, " ")) && /\b(born|native|person|he|his|male|man|boy)\b/.test(ifl.replace(/\bfemale\b/g, " "));
    if (wantsF && !wantsM && g !== "female") ok = false; if (wantsM && !wantsF && g !== "male") ok = false;
  }
  // a sign named in the IF line, such as the Libra portion of Vishakha or Rahu in Ashlesha (Cancer), must be the sign of the graha
  if (sub && F.pl[sub]) {
    const SG = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
    const named = SG.filter(x => new RegExp("\\b" + x + "\\b").test(r.if)); const mine = SG[F.pl[sub].sign];
    if (named.length && named.indexOf(mine) < 0 && !/\bnavamsh?a\b/i.test(r.if)) ok = false;
  }
  // the placement phrase itself, already tested by the trigger
  t = t.replace(/(?:the )?(?:Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces) portion of/gi, " ");
  t = t.replace(new RegExp(PLRX + " in [A-Z][A-Za-z ]*?(?: pada \\d)?(?=[ ,.;]| $)", "g"), " ").replace(/pada \d/gi, " ");
  const left = t.toLowerCase();
  const UNK = /(aspect|conjunct|\bwith\b|transit|dasha|dasa|navamsha|navamsa|decanate|degree|yoga|\bwhen\b|during|period|\bage\b|eclipse|\bhouse|\blord|\bsign\b|\bnot\b|without|\bif\b|\bonly\b|lagna|ascendant|\bportion|\bhalf\b|\bpart of)/;
  return { known: !UNK.test(left), ok };
}

// ---------------------------------------------------------------- does a rule fire
function fires(r, F) {
  if (!r.nk && !r.planet) return { st: "general" };
  let subject = null, trig = false;
  if (r.planet && r.nk) { const p = F.pl[r.planet]; if (!p) return { st: "no" }; subject = r.planet; trig = p.nk === r.nk && (!r.pada || p.pada === r.pada); }
  else if (r.nk && r.house) {
    if (/\bascendant\b|\blagna\b/i.test(r.if) && r.house === 1) trig = F.asc.nk === r.nk && (!r.pada || F.asc.pada === r.pada);
    else if (/\blord\b/i.test(r.if)) { const l = F.C.houseLord(r.house); subject = l; trig = !!F.pl[l] && F.pl[l].nk === r.nk && (!r.pada || F.pl[l].pada === r.pada); }
    else { const here = PL.filter(n => F.pl[n] && F.pl[n].house === r.house && F.pl[n].nk === r.nk); trig = here.length > 0; subject = here[0] || null; }
  } else if (r.nk && !r.planet) {
    const m = r.if.match(new RegExp("\\b" + PLRX + " in [A-Z]"));
    if (m && F.pl[m[1]]) { subject = m[1]; trig = F.pl[m[1]].nk === r.nk && (!r.pada || F.pl[m[1]].pada === r.pada); }
    else if (/\bascendant\b|\blagna\b/i.test(r.if)) trig = F.asc.nk === r.nk && (!r.pada || F.asc.pada === r.pada);
    else { subject = "Moon"; trig = F.moon.nk === r.nk && (!r.pada || F.moon.pada === r.pada); }
  } else return { st: "other" };
  if (!trig) return { st: "no" };
  const e = evalIf(r, subject, F);
  if (!e.known) return { st: "unresolved", subject };
  return e.ok ? { st: "fire", subject } : { st: "no", subject };
}

// ---------------------------------------------------------------- routing and keywords
const ROUTE = { medical: ["career", "education", "nature"], degree: ["education", "career", "nature"], profession: ["career", "wealth", "nature"], business: ["career", "wealth", "nature"], disease: ["health", "body", "longevity"], income: ["wealth", "career", "property"], relationship: ["marriage", "relations", "family", "progeny", "longevity"], children: ["progeny", "family"], siblings: ["family", "progeny"], parents: ["family", "longevity", "relations"], default: ["core", "nature"] };
function routeFor(prof, type) { if (type === "children" || type === "siblings" || type === "parents") return ROUTE[type].concat(["core"]); const c = prof ? (/^deg\./.test(prof.id) ? "degree" : prof.cat) : "default"; return (ROUTE[c] || ROUTE.default).concat(["core"]); }
function stems(entry) {
  const words = new Set();
  [entry.name].concat(entry.aliases || [], entry.bnn_keywords || []).forEach(a => String(a).toLowerCase().replace(/[^a-z ]/g, " ").split(/\s+/).forEach(w => { if (w.length >= 4 && !STOP.has(w)) words.add(w.replace(/(ists|ist|ics|ic|ing|ers|er|ions|ion|es|s)$/, "").slice(0, 9)); }));
  return Array.from(words).filter(w => w.length >= 4);
}
const mention = (txt, st) => st.some(s => new RegExp("\\b" + s, "i").test(txt));
const NUMW = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
function countAgree(r, opt) {
  // sons, daughters, brothers, sisters. +1 when the rule names exactly the kinds the option holds, +0.5 for a partial, 0 otherwise. A negated rule flips the sign.
  const kids = opt.type === "children"; const maleW = kids ? "sons?|boys?" : "brothers?", femW = kids ? "daughters?|girls?" : "sisters?";
  const t = r.then + " " + r.if; const hasM = new RegExp("\\b(" + maleW + ")\\b", "i").test(t), hasF = new RegExp("\\b(" + femW + ")\\b", "i").test(t);
  if (!hasM && !hasF) return null;
  const neg = /\b(no|without|loss of|lose|death of|deprived of|lacks?|denied|childless|few)\b[^.]{0,30}\b(sons?|daughters?|brothers?|sisters?|children|issue)\b/i.test(t);
  let a = (hasM === (opt.m > 0) && hasF === (opt.f > 0)) ? 1 : ((hasM && opt.m > 0) || (hasF && opt.f > 0)) ? 0.5 : 0;
  const nm = t.match(new RegExp("\\b(one|two|three|four|five|six|\\d)\\s+(" + maleW + "|" + femW + ")\\b", "i"));
  if (nm) { const n = NUMW[nm[1].toLowerCase()] || Number(nm[1]); const isM = new RegExp("^(" + maleW + ")$", "i").test(nm[2]); const have = isM ? opt.m : opt.f; a = have === n ? Math.max(a, 1) : 0; }
  return neg ? -a : a;
}

const DOMAIN = { medical: /\b(medic|doctor|physician|surgeon|surgery|hospital|healer|healing|nurs|pharm|dental|dentist|clinic|treat)/i, degree: /\b(educat|study|studies|degree|learning|school|college|scholar|teacher|exam)/i, profession: /\b(career|job|profession|work|service|employ|occupation|post|position|vocation)/i, business: /\b(business|trade|trader|shop|merchant|enterprise|commerce|self.employ|dealer)/i, income: /\b(income|wealth|money|earn|gain|profit|rich|poor|fortune)/i, disease: /\b(disease|illness|ailment|ill health|pain|disorder|infection|fever|ache|weak)/i };
const domainOf = prof => prof ? (/^deg\./.test(prof.id) ? "degree" : prof.cat) : null;
// ---------------------------------------------------------------- scoring
function collect(C, L, q, optsParsed, helpers) {
  const F = facts(C); const U_ = U.load().all; const fired = new Map(), nearly = new Map(), general = new Map();
  const routes = new Set(); const perOpt = optsParsed.map(o => { const prof = o.type === "entry" ? helpers.profileOf(L, o) : null; const route = routeFor(prof, o.type); route.forEach(x => routes.add(x)); return { o, prof, route }; });
  U_.forEach(r => { if (!routes.has(r.ev)) return; const f = fires(r, F); if (f.st === "fire") fired.set(r.id, Object.assign({ r }, f)); else if (f.st === "unresolved") nearly.set(r.id, Object.assign({ r }, f)); });
  return { F, perOpt, fired, nearly };
}
function overrule(list) {
  const named = [];
  const byPl = {}; list.forEach(x => { const k = x.r.planet || x.subject || "-"; (byPl[k] = byPl[k] || []).push(x); });
  const keep = [];
  Object.keys(byPl).forEach(k => { const g = byPl[k]; const pada = g.filter(x => x.r.pada && x.r.pol !== "~");
    g.forEach(x => { const over = pada.find(p => p.r.pol !== x.r.pol && x.r.spec <= 0.6 && x.r.pol !== "~"); if (over) named.push(x.r.id + " overruled by pada rule " + over.r.id); else keep.push(x); }); });
  return { keep, named };
}
function scoreOption(info, coll, opt, S, mode, helpers) {
  const { o, prof } = info; const st = prof ? stems(prof) : [];
  const rows = [];
  coll.fired.forEach(({ r, subject }) => {
    if (info.route.indexOf(r.ev) < 0) return;
    let kind = null, agree = 1;
    if (o.type === "children" || o.type === "siblings") { const a = countAgree(r, o); if (a === null) return; kind = "direct"; agree = a; }
    else if (o.type === "parents") {
      const t = r.then + " " + r.if; const fa = /\bfather\b/i.test(t), mo = /\bmother\b/i.test(t); if (!fa && !mo) return;
      const gone = /(\bdeath\b|\bdies\b|\bdied\b|early death|orphan|loses? (his|her) (father|mother)|loss of (the )?(father|mother)|premature death)/i.test(t) && !/\b(either|or\b[^.]{0,40}(death|dies|died)|(death|dies|died)[^.]{0,40}\bor\b)/i.test(t);
      const lives = /(long.lived|lives long|long life|longevity|survives?|supports? (him|her)|protect)/i.test(t);
      if (r.pol === "~" || (!gone && !lives)) return;
      // a malefic rule that names death or loss supports "gone" and weighs against "alive". A benefic rule that names long life supports "alive".
      [["father", fa, o.father], ["mother", mo, o.mother]].forEach(([who, named, claimsAlive]) => {
        if (!named) return;
        let sign = 0;
        if (r.pol === "-" && gone) sign = claimsAlive ? -1 : 1; else if (r.pol === "+" && lives) sign = claimsAlive ? 1 : -1;
        if (sign) rows.push({ r, subject, kind: "direct", agree: sign * (r.w < 0 ? -1 : 1), who });
      });
      return;
    }
    else if (st.length && mention(r.then + " " + r.if, st)) kind = "direct";
    else if (S && S.indexOf(r.planet || subject) >= 0 && r.planet && DOMAIN[domainOf(prof)] && DOMAIN[domainOf(prof)].test(r.then)) kind = "link";
    if (!kind || agree === 0) return;
    rows.push({ r, subject, kind, agree });
  });
  const ov = overrule(rows); const kept = ov.keep;
  const dir = kept.filter(x => x.kind === "direct"), lnk = kept.filter(x => x.kind === "link");
  const sum = a => a.reduce((s, x) => s + x.r.w * x.agree, 0);
  return { rows: kept, direct: dir, link: lnk, dsum: sum(dir), lsum: sum(lnk), named: ov.named, pada: kept.filter(x => x.r.pada && x.r.w !== 0).length };
}
const f2 = x => (Math.round(x * 100) / 100).toFixed(2);
const bandOf = t => t >= 3 ? "yes certain" : t >= 1 ? "yes with a condition" : t > -1 ? "mixed" : t > -3 ? "difficult" : "no";

// parents. A parent is called gone only when a firing rule of the corpus about that parent names death, loss or separation with weight, never from a bare placement, and the rule is malefic.
function runUduCorpus(C, L, q, mode, helpers) {
  const optsParsed = q.options.map(helpers.parseOption);
  const coll = collect(C, L, q, optsParsed, helpers);
  const out = optsParsed.map((o, i) => {
    const info = coll.perOpt[i];
    const S = info.prof ? helpers.promiseSet(C, info.prof).S : (o.type === "children" ? ["Jupiter", C.houseLord(5)] : o.type === "siblings" ? ["Mars", C.houseLord(3), C.houseLord(11)] : o.type === "parents" ? ["Sun", "Moon"] : []);
    const sc = scoreOption(info, coll, o, S, mode, helpers);
    return Object.assign({ o, prof: info.prof, S, route: info.route }, sc);
  });
  const anyDirect = out.some(x => Math.abs(x.dsum) > 1e-9);
  out.forEach(x => { x.total = anyDirect ? x.dsum + x.lsum * 0.001 : x.lsum; x.basis = anyDirect ? "direct rules" : "link rules"; });
  return { out, coll, anyDirect };
}
function pickBest(out) {
  const best = Math.max.apply(null, out.map(x => x.total));
  const top = out.filter(x => Math.abs(x.total - best) < 1e-9);
  if (top.length === 1) return { r: top[0], tie: false };
  // Law 3 for the parents. No decisive rule of loss fired, so there is no promise of loss, and the option with most parents alive is the reading.
  if (top.every(x => x.o.type === "parents")) { const al = x => (x.o.mother ? 1 : 0) + (x.o.father ? 1 : 0); const m = Math.max.apply(null, top.map(al)); const t3 = top.filter(x => al(x) === m); return { r: t3[0], tie: false, law3: true }; }
  const pm = Math.max.apply(null, top.map(x => x.pada)); const t2 = top.filter(x => x.pada === pm);
  if (t2.length === 1) return { r: t2[0], tie: false, byPada: true };
  return { r: top[0], tie: true };
}
// the nearest rules, used only when no rule of the routed files names or links any option. The janma nakshatra rules of the routed files.
function nearest(C, coll, route) {
  const F = coll.F; return Array.from(coll.fired.values()).filter(x => x.r.nk === F.moon.nk && !x.r.planet && route.indexOf(x.r.ev) >= 0 && x.r.pol !== "~").slice(0, 4);
}
module.exports = { runUduCorpus, pickBest, nearest, facts, fires, evalIf, f2, bandOf, stems };
