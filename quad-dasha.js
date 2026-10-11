/* =====================================================================
 * QUAD DASHA — a dedicated VedNetra export for the
 *   "SHREE GANESHA JI SHRI SARASWATI JI BLESSED QUAD DASHA" project.
 *
 * Emits ONE markdown report carrying everything that project needs to read a
 * chart without any further computation:
 *   Vimshottari (nakshatra, 120y) · Chara (rashi, Jaimini, K.N. Rao) ·
 *   Kaal Chakra (rashi, 83-100y, BPHS Ch.46/51/64) · Yogini (36y + Goel's
 *   progressed lagna), plus the chart-derived reading frames the four schools
 *   need (Laghu Parashari lordship classes, sambandha, Pachaka/Bodhaka/
 *   Karaka/Vedhaka, maraka hierarchy, longevity class, Jaimini karakas and
 *   rajayogas with the navamsa filter, KCD house activation), a birth-time
 *   STABILITY table, and the base-rate appendix.
 *
 * ARCHITECTURE — deliberate, do not "simplify".
 *   This file takes from VedNetra ONLY the ephemeris and the Ascendant
 *   (chart.planets[].lon, chart.ascendant.lon, chart.date, chart.ayanamsa).
 *   EVERY dasha quantity is computed here. Three reasons:
 *     1. a VedNetra change cannot silently move a dasha boundary;
 *     2. the seven non-negotiable corrections this project settled against
 *        primary text (see CORRECTIONS below) stay enforced in one place;
 *     3. the output stays reproducible against the project's Python engine
 *        `quad_dasha.py`, which carries the same eight self-tests.
 *   VedNetra's own Char Dasha and Yogini sections use different conventions
 *   and are NOT used here. §0 prints the divergence.
 *
 * CORRECTIONS ENFORCED (each settled against primary text; §0 asserts them)
 *   1. KCD balance is against the WHOLE package span (100/85/83/86),
 *      never against the first dasha.            [BPHS 46/92-93]
 *   2. KCD has NINE antardasas per dasha, not twelve -- the nine signs of the
 *      native's OWN package, cycled to open on the dasha sign, each
 *      dasha_yrs*antar_yrs/span.                 [BPHS Ch.64, 27/27 cells]
 *   3. The KCD package REPEATS when exhausted; it does not advance to the next
 *      pada's package (deha/jiva are natal invariants).
 *   4. Chara length-counting goes in groups of THREE: Ar/Ta/Ge forward,
 *      Cn/Le/Vi reverse, Li/Sc/Sg forward, Cp/Aq/Pi reverse.
 *                                                [Rao's own worked table]
 *   5. Chara: no +-1y for exaltation/debilitation, no fractional years;
 *      max 12, min 1, never 0.
 *   6. Seven Chara karakas, never eight.
 *   7. Lahiri ayanamsa only.
 *
 * NO PREDICTIVE CLAIM IS MADE. 52 pre-registered tests of the interpretive
 * rules of all four systems came out at chance (mean lift 0.960, smallest
 * p 0.110). This file computes periods and prints the frames; §13 carries the
 * base rates and §14 the limits.
 *
 * Exposes: globalThis.VNQuadDasha = { markdown, selftest, version, engines }
 * ===================================================================== */
(function () {
  "use strict";

  var VERSION = "1.0.0";

  // ---------------------------------------------------------------- basics
  var SIGNS = ["Ar","Ta","Ge","Cn","Le","Vi","Li","Sc","Sg","Cp","Aq","Pi"];
  var SIGN_FULL = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra",
                   "Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
  var NAK = ["Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra",
             "Punarvasu","Pushya","Ashlesha","Magha","P.Phalguni","U.Phalguni",
             "Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Moola",
             "P.Ashadha","U.Ashadha","Shravana","Dhanishtha","Shatabhisha",
             "P.Bhadrapada","U.Bhadrapada","Revati"];
  var LORD = ["Ma","Ve","Me","Mo","Su","Me","Ve","Ma","Ju","Sa","Sa","Ju"];
  var PNAMES = ["Su","Mo","Ma","Me","Ju","Ve","Sa","Ra","Ke"];
  var PFULL = { Su:"Sun", Mo:"Moon", Ma:"Mars", Me:"Mercury", Ju:"Jupiter",
                Ve:"Venus", Sa:"Saturn", Ra:"Rahu", Ke:"Ketu" };
  var VN2K = { Sun:"Su", Moon:"Mo", Mars:"Ma", Mercury:"Me", Jupiter:"Ju",
               Venus:"Ve", Saturn:"Sa", Rahu:"Ra", Ketu:"Ke" };
  // Parasari aspects: offsets in signs from the occupied sign
  var PASP = { Su:[6], Mo:[6], Ma:[3,6,7], Me:[6], Ju:[4,6,8], Ve:[6],
               Sa:[2,6,9], Ra:[4,6,8], Ke:[4,6,8] };
  // Jaimini rashi drishti: movable<->fixed except adjacent; dual<->dual
  var JASP = (function () {
    var out = {}, i, j;
    for (i = 0; i < 12; i++) {
      out[i] = [];
      if (i === 0 || i === 3 || i === 6 || i === 9) {
        [1,4,7,10].forEach(function (t) { if (t !== (i + 1) % 12) out[i].push(t); });
      } else if (i === 1 || i === 4 || i === 7 || i === 10) {
        [0,3,6,9].forEach(function (t) { if (t !== (i + 11) % 12) out[i].push(t); });
      } else {
        [2,5,8,11].forEach(function (t) { if (t !== i) out[i].push(t); });
      }
    }
    return out;
  }());
  var EXALT = { Su:0, Mo:1, Ma:9, Me:5, Ju:3, Ve:11, Sa:6 };
  var DEBIL = { Su:6, Mo:7, Ma:3, Me:11, Ju:9, Ve:5, Sa:0 };
  var MULA   = { Su:4, Mo:1, Ma:0, Me:5, Ju:8, Ve:6, Sa:10 };
  var NATFRIEND = [["Su","Mo"],["Su","Ma"],["Su","Ju"],["Ma","Ju"],
                   ["Me","Ve"],["Ve","Sa"]];   // Atmasambandhi pairs (LP)

  // -------------------------------------------------- exact rationals
  // Every dasha length in all four systems is rational with integer terms
  // (KCD: KY*KY/span; Vimshottari: VY*VY/120; Yogini: len*yr*10/365; Chara:
  // whole years). Floats would make "the antardasas sum exactly to the dasha"
  // untestable, so the arithmetic is kept exact and only printing rounds.
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
  function R(n, d) {
    if (d === undefined) d = 1;
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d);
    return { n: n / g, d: d / g };
  }
  function radd(a, b) { return R(a.n * b.d + b.n * a.d, a.d * b.d); }
  function rsub(a, b) { return R(a.n * b.d - b.n * a.d, a.d * b.d); }
  function rmul(a, b) { return R(a.n * b.n, a.d * b.d); }
  function rcmp(a, b) { return a.n * b.d - b.n * a.d; }
  function rnum(a) { return a.n / a.d; }
  function rzero() { return R(0, 1); }

  // ------------------------------------------------------- formatting
  function pad(s, n) { s = String(s); while (s.length < n) s += " "; return s; }
  function lpad(s, n) { s = String(s); while (s.length < n) s = " " + s; return s; }
  function signOf(lon) { return Math.floor(norm360(lon) / 30); }
  function degIn(lon) { return norm360(lon) % 30; }
  function norm360(x) { x = x % 360; return x < 0 ? x + 360 : x; }
  function fmtDeg(lon) {
    var s = signOf(lon), dd = degIn(lon), d = Math.floor(dd),
        m = Math.floor((dd - d) * 60), sec = Math.round((((dd - d) * 60) - m) * 60);
    if (sec === 60) { sec = 0; m += 1; }
    if (m === 60) { m = 0; d += 1; }
    return SIGNS[s] + " " + lpad(d, 2) + "°" + lpad(m < 10 ? "0" + m : m, 2) + "'" + lpad(sec < 10 ? "0" + sec : sec, 2) + '"';
  }
  function nakPada(lon) {
    var kal = norm360(lon) * 60, n = Math.floor(kal / 800), r = kal - n * 800,
        q = Math.floor(r / 200) + 1;
    return { nak: NAK[n % 27], idx: n % 27, pada: q, inPada: r - (q - 1) * 200 };
  }
  function varga(lon, div) { return Math.floor((signOf(lon) * div + Math.floor(degIn(lon) / (30 / div))) % 12); }
  function ymd(yrs) {
    var y = Math.floor(yrs), m = (yrs - y) * 12, mo = Math.floor(m),
        d = Math.round((m - mo) * 30);
    if (d >= 30) { d = 0; mo += 1; }
    if (mo >= 12) { mo = 0; y += 1; }
    return y + "y " + mo + "m " + d + "d";
  }
  function houseFrom(fromSign, sign) { return ((sign - fromSign + 12) % 12) + 1; }

  // =====================================================================
  // 1. VIMSHOTTARI   (BPHS Ch.46 sl.12-16, Ch.51 sl.1-2)
  // =====================================================================
  var VLORDS = [["Ke",7],["Ve",20],["Su",6],["Mo",10],["Ma",7],
                ["Ra",18],["Ju",16],["Sa",19],["Me",17]];
  var VIDX = {}, VY = {};
  VLORDS.forEach(function (p, i) { VIDX[p[0]] = i; VY[p[0]] = p[1]; });

  function vimshottari(moon, years) {
    years = years || 120;
    var kal = norm360(moon) * 60, n = Math.floor(kal / 800);
    // the elapsed fraction of the nakshatra, kept exact in arc-seconds
    var elapsedSec = Math.round((kal - n * 800) * 60);     // of 48000
    var first = VLORDS[n % 9][0];
    var bal = rmul(R(VY[first], 1), R(48000 - elapsedSec, 48000));
    var mds = [[first, rzero(), bal]], tt = bal, i = VIDX[first];
    while (rcmp(tt, R(years, 1)) < 0) {
      i = (i + 1) % 9;
      var L = VLORDS[i][0];
      mds.push([L, tt, R(VY[L], 1)]);
      tt = radd(tt, R(VY[L], 1));
    }
    var rows = [];
    mds.forEach(function (md) {
      var L = md[0], st = md[1], ln = md[2], k, ads = [];
      for (k = 0; k < 9; k++) {
        var A = VLORDS[(VIDX[L] + k) % 9][0];
        ads.push([A, R(VY[L] * VY[A], 120)]);
      }
      if (rcmp(ln, R(VY[L], 1)) < 0) {                 // partial first MD
        var el = rsub(R(VY[L], 1), ln), acc = rzero(), keep = [];
        ads.forEach(function (ad) {
          var nx = radd(acc, ad[1]);
          if (rcmp(nx, el) <= 0) { acc = nx; return; }
          keep.push([ad[0], rcmp(acc, el) >= 0 ? ad[1] : rsub(nx, el)]);
          acc = nx;
        });
        ads = keep;
      }
      var t = st;
      ads.forEach(function (ad) {
        rows.push({ md: L, ad: ad[0], start: t, end: radd(t, ad[1]), len: ad[1] });
        t = radd(t, ad[1]);
      });
    });
    return { rows: rows, nak: NAK[n % 27], first: first, balance: bal };
  }

  // =====================================================================
  // 2. CHARA DASHA   (K.N. Rao; BPHS Ch.46 sl.155-167)
  // =====================================================================
  var DIRECT_LAGNA = [0,4,5,6,10,11];   // Ar Le Vi Li Aq Pi -> forward order

  // CORRECTION 4: the counting direction is by GROUPS OF THREE, not by sign
  // parity. Validated 53/54 against the sequences Rao prints. Reading it as
  // two groups of six, or as odd/even signs, produces errors of exactly
  // 12 - correct.
  function charaForward(R_) { return Math.floor(R_ / 3) % 2 === 0; }

  function strongerOf(sg, deg, p, q) {
    function company(x) {
      var c = 0;
      PNAMES.forEach(function (k) { if (k !== x && sg[k] === sg[x]) c++; });
      return c;
    }
    var cp = company(p), cq = company(q);
    if (cp !== cq) return cp > cq ? sg[p] : sg[q];
    return deg[p] >= deg[q] ? sg[p] : sg[q];
  }

  function charaLen(R_, sg, deg) {
    var fwd = charaForward(R_), tgt, a, b;
    function cnt(x, y) { return fwd ? (((y - x + 12) % 12) + 1) : (((x - y + 12) % 12) + 1); }
    if (R_ === 7) {                               // Scorpio: Mars AND Ketu
      a = sg.Ma; b = sg.Ke;
      if (a === 7 && b === 7) return 12;
      tgt = (a === 7) ? b : (b === 7 ? a : strongerOf(sg, deg, "Ma", "Ke"));
    } else if (R_ === 10) {                       // Aquarius: Saturn AND Rahu
      a = sg.Sa; b = sg.Ra;
      if (a === 10 && b === 10) return 12;
      tgt = (a === 10) ? b : (b === 10 ? a : strongerOf(sg, deg, "Sa", "Ra"));
    } else {
      tgt = sg[LORD[R_]];
    }
    if (tgt === R_) return 12;
    return Math.max(1, cnt(R_, tgt) - 1);        // CORRECTION 5
  }

  function chara(lagnaSign, sg, deg, years) {
    years = years || 120;
    var direct = DIRECT_LAGNA.indexOf(lagnaSign) >= 0, order = [], i;
    for (i = 0; i < 12; i++) order.push(direct ? (lagnaSign + i) % 12 : (lagnaSign - i + 12) % 12);
    var out = [], t = 0, guard = 0;
    while (t < years && guard < 60) {
      for (i = 0; i < 12 && t < years; i++) {
        var L = charaLen(order[i], sg, deg);
        out.push({ sign: order[i], start: t, end: t + L, years: L });
        t += L;
      }
      guard++;
    }
    return { rows: out, direct: direct, order: order };
  }

  function charaSubs(rashi, length, lagnaSign) {
    // Rao: the rashi's OWN sub-period comes LAST; same direction as the majors.
    var direct = DIRECT_LAGNA.indexOf(lagnaSign) >= 0, order = [], i;
    for (i = 1; i < 12; i++) order.push(direct ? (rashi + i) % 12 : (rashi - i + 12) % 12);
    order.push(rashi);
    var each = R(length, 12);
    return order.map(function (x, k) {
      return { sign: x, start: rmul(R(k, 1), each), len: each };
    });
  }

  // =====================================================================
  // 3. KAAL CHAKRA   (BPHS Ch.46 sl.84-95, Ch.51, Ch.64)
  // =====================================================================
  var KY = { Ar:7, Ta:16, Ge:9, Cn:21, Le:5, Vi:9, Li:16, Sc:7, Sg:10, Cp:4, Aq:4, Pi:10 };
  var DP = {
    Aries:   [["Ar","Ta","Ge","Cn","Le","Vi","Li","Sc","Sg"], "Ar", "Sg"],
    Taurus:  [["Cp","Aq","Pi","Sc","Li","Vi","Cn","Le","Ge"], "Cp", "Ge"],
    Gemini:  [["Ta","Ar","Pi","Aq","Cp","Sg","Ar","Ta","Ge"], "Ta", "Ge"],
    Cancer:  [["Cn","Le","Vi","Li","Sc","Sg","Cp","Aq","Pi"], "Cn", "Pi"],
    Leo:     [["Sc","Li","Vi","Cn","Le","Ge","Ta","Ar","Pi"], "Sc", "Pi"],
    Virgo:   [["Aq","Cp","Sg","Ar","Ta","Ge","Cn","Le","Vi"], "Aq", "Vi"],
    Libra:   [["Li","Sc","Sg","Cp","Aq","Pi","Sc","Li","Vi"], "Li", "Vi"],
    Scorpio: [["Cn","Le","Ge","Ta","Ar","Pi","Aq","Cp","Sg"], "Cn", "Sg"]
  };
  DP.Sagittarius = DP.Aries;  DP.Capricorn = DP.Taurus;
  DP.Aquarius    = DP.Gemini; DP.Pisces    = DP.Cancer;
  var NGROUP = {
    1: ["Ashwini","Punarvasu","Hasta","Moola","P.Bhadrapada"],
    2: ["Bharani","Pushya","Chitra","P.Ashadha","U.Bhadrapada"],
    3: ["Krittika","Ashlesha","Swati","U.Ashadha","Revati"],
    4: ["Rohini","Magha","Vishakha","Shravana"],
    5: ["Mrigashira","P.Phalguni","Anuradha","Dhanishtha"],
    6: ["Ardra","U.Phalguni","Jyeshtha","Shatabhisha"]
  };
  var QMAP = {
    1: ["Aries","Taurus","Gemini","Cancer"],          // Savya   100/85/83/86
    2: ["Leo","Virgo","Libra","Scorpio"],
    3: ["Sagittarius","Capricorn","Aquarius","Pisces"],
    4: ["Scorpio","Libra","Virgo","Leo"],             // Apsavya  86/83/85/100
    5: ["Cancer","Gemini","Taurus","Aries"],
    6: ["Pisces","Aquarius","Capricorn","Sagittarius"]
  };
  var GATI = { "Vi>Cn":"Mandooki", "Le>Ge":"Mandooki",
               "Le>Cn":"Markati",  "Cn>Le":"Markati",
               "Pi>Sc":"Simhavalokana", "Sg>Ar":"Simhavalokana" };
  // Energy level (SMS): mutable > fixed > movable; fiery > airy > watery > earthy
  var KENERGY = { Sg:1, Le:2, Ge:2, Ar:3, Aq:3, Li:4, Pi:4, Sc:5, Vi:5, Cn:6, Ta:6, Cp:7 };
  var KBENEFIC = { Vi:"most benefic", Pi:"next benefic", Ta:"mildly benefic",
                   Ge:"mildly benefic", Cn:"mildly benefic", Li:"mildly benefic",
                   Sc:"neutral", Sg:"neutral", Le:"slightly malefic",
                   Cp:"slightly malefic", Aq:"slightly malefic", Ar:"most malefic" };

  function nakGroup(nk) {
    for (var g in NGROUP) if (NGROUP[g].indexOf(nk) >= 0) return Number(g);
    throw new Error("nakshatra not in any KCD group: " + nk);
  }

  function kcdPackage(moon) {
    var np = nakPada(moon), g = nakGroup(np.nak), direct = g <= 3;
    var name = QMAP[g][np.pada - 1], d = DP[name];
    var seq = d[0].slice(), deha = d[1], jeeva = d[2];
    var span = seq.reduce(function (a, s) { return a + KY[s]; }, 0);
    if (!direct) { seq.reverse(); var t = deha; deha = jeeva; jeeva = t; }
    // CORRECTION 1: balance against the WHOLE span, not the first dasha
    var past = R(Math.round(np.inPada * 3600), 3600);        // of 200'
    var expired = rmul(past, R(span, 200));
    return { nak: np.nak, pada: np.pada, group: g, direct: direct, dp: name,
             seq: seq, span: span, deha: deha, jeeva: jeeva,
             expired: expired, balance: rsub(R(span, 1), expired) };
  }

  function kcd(moon, years) {
    years = years || 120;
    var p = kcdPackage(moon), seq = p.seq, cum = rzero(), k = null, bal = null, n;
    for (n = 0; n < seq.length; n++) {
      if (rcmp(radd(cum, R(KY[seq[n]], 1)), p.expired) > 0) {
        k = n; bal = rsub(R(KY[seq[n]], 1), rsub(p.expired, cum)); break;
      }
      cum = radd(cum, R(KY[seq[n]], 1));
    }
    if (k === null) { k = 0; bal = R(KY[seq[0]], 1); }
    var out = [], t = rzero(), j = k + 1;
    var prev = seq[(k - 1 + seq.length) % seq.length];
    out.push({ sign: seq[k], start: rzero(), end: bal, prev: prev,
               gati: GATI[prev + ">" + seq[k]] || null, partial: true });
    t = bal;
    var guard = 0;
    while (rcmp(t, R(years, 1)) < 0 && guard < 400) {
      if (j >= seq.length) j = 0;                 // CORRECTION 3: it REPEATS
      var s = seq[j], pv = seq[(j - 1 + seq.length) % seq.length];
      out.push({ sign: s, start: t, end: radd(t, R(KY[s], 1)), prev: pv,
                 gati: GATI[pv + ">" + s] || null, partial: false });
      t = radd(t, R(KY[s], 1)); j++; guard++;
    }
    return { rows: out, pkg: p };
  }

  // CORRECTION 2: NINE antardasas, the native's own package, cycled to open on
  // the dasha sign, each dasha_yrs*antar_yrs/span. Validated 27/27 against the
  // tables BPHS Ch.64 prints. NOT Shakti Mohan Singh's twelve-sign variant.
  function kcdAntardashas(pkg, dashaSign) {
    var seq = pkg.seq, n = seq.length, i = seq.indexOf(dashaSign), out = [], k;
    for (k = 0; k < n; k++) {
      var b = seq[(i + k) % n];
      out.push({ sign: b, len: R(KY[dashaSign] * KY[b], pkg.span) });
    }
    return out;
  }

  // =====================================================================
  // 4. YOGINI   (BPHS Ch.46 sl.195-199 + V.P. Goel's progressed lagna)
  // =====================================================================
  var YOG = [["Mangala","Mo",1],["Pingala","Su",2],["Dhanya","Ju",3],["Bhramari","Ma",4],
             ["Bhadrika","Me",5],["Ulka","Sa",6],["Siddha","Ve",7],["Sankata","Ra",8]];
  var PROG = ["Ardra","Punarvasu","Pushya","Ashlesha","Magha","P.Phalguni","U.Phalguni",
              "Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Moola","P.Ashadha",
              "U.Ashadha","Shravana","Dhanishtha","Shatabhisha","P.Bhadrapada",
              "U.Bhadrapada","Revati","Rohini","Mrigashira"];
  var BRACKET = { Ashwini:"P.Bhadrapada", Bharani:"U.Bhadrapada", Krittika:"Revati" };
  var NAKSIGN = {}, NAKLORD = {};
  NAK.forEach(function (nk, i) {
    NAKSIGN[nk] = Math.floor((i * 13.3333333) / 30);
    NAKLORD[nk] = ["Ke","Ve","Su","Mo","Ma","Ra","Ju","Sa","Me"][i % 9];
  });

  function yogini(moon, years) {
    years = years || 120;
    var kal = norm360(moon) * 60, n = Math.floor(kal / 800);
    var elapsedSec = Math.round((kal - n * 800) * 60);
    var nk = NAK[n % 27];
    var yi = ((n + 1 + 3) % 8) - 1; if (yi < 0) yi = 7;
    var j = PROG.indexOf(BRACKET[nk] || nk);
    var bal = rmul(R(YOG[yi][2], 1), R(48000 - elapsedSec, 48000));
    var out = [{ yogini: YOG[yi][0], lord: YOG[yi][1], nak: PROG[j],
                 pl: NAKSIGN[PROG[j]], start: rzero(), len: bal }];
    var t = bal, k = yi, guard = 0;
    while (rcmp(t, R(years, 1)) < 0 && guard < 100) {
      k = (k + 1) % 8; j = (j + 1) % 24;
      out.push({ yogini: YOG[k][0], lord: YOG[k][1], nak: PROG[j],
                 pl: NAKSIGN[PROG[j]], start: t, len: R(YOG[k][2], 1) });
      t = radd(t, R(YOG[k][2], 1)); guard++;
    }
    return { rows: out, nak: nk, first: YOG[yi][0] };
  }

  function yoginiSubs(ylen, ylordName) {
    // 8 sub-periods, the dasha yogini's own FIRST. days = Q * P * 10.
    var i = 0;
    YOG.forEach(function (y, k) { if (y[0] === ylordName) i = k; });
    var out = [], k;
    for (k = 0; k < 8; k++) {
      var y = YOG[(i + k) % 8];
      out.push({ yogini: y[0], lord: y[1], len: R(ylen * y[2] * 10, 365) });
    }
    return out;
  }

  // =====================================================================
  // 5. CHARA KARAKAS — SEVEN, never eight (CORRECTION 6)
  // =====================================================================
  function karakas(deg) {
    var order = ["Su","Mo","Ma","Me","Ju","Ve","Sa"].slice().sort(function (a, b) {
      return deg[b] - deg[a];
    });
    var names = ["AK","AmK","BK","MK","PK","GK","DK"], out = {}, rev = {};
    names.forEach(function (nm, i) { out[nm] = order[i]; rev[order[i]] = nm; });
    return { byRole: out, byPlanet: rev, order: order };
  }

  globalThis.VNQuadDasha = globalThis.VNQuadDasha || {};
  globalThis.VNQuadDasha.engines = {
    R: R, radd: radd, rsub: rsub, rmul: rmul, rcmp: rcmp, rnum: rnum,
    SIGNS: SIGNS, SIGN_FULL: SIGN_FULL, NAK: NAK, LORD: LORD, PNAMES: PNAMES,
    PFULL: PFULL, VN2K: VN2K, PASP: PASP, JASP: JASP, KY: KY, DP: DP,
    QMAP: QMAP, GATI: GATI, KENERGY: KENERGY, KBENEFIC: KBENEFIC,
    YOG: YOG, PROG: PROG, NAKSIGN: NAKSIGN, NAKLORD: NAKLORD,
    EXALT: EXALT, DEBIL: DEBIL, MULA: MULA, NATFRIEND: NATFRIEND,
    DIRECT_LAGNA: DIRECT_LAGNA, VLORDS: VLORDS, VY: VY,
    signOf: signOf, degIn: degIn, fmtDeg: fmtDeg, nakPada: nakPada,
    varga: varga, ymd: ymd, houseFrom: houseFrom, pad: pad, lpad: lpad,
    vimshottari: vimshottari, chara: chara, charaSubs: charaSubs,
    charaLen: charaLen, charaForward: charaForward,
    kcd: kcd, kcdPackage: kcdPackage, kcdAntardashas: kcdAntardashas,
    yogini: yogini, yoginiSubs: yoginiSubs, karakas: karakas,
    version: VERSION
  };
}());

/* =====================================================================
 * PART 2 — the chart-derived READING FRAMES.
 * Everything here is computed from placement and lordship only. No rule in
 * this part has been validated: 02-RULES.md is CLASSICAL throughout and the
 * benchmark found no effect. These tables exist so the reading is done from
 * the chart rather than from memory, and so each claim can name its rule.
 * ===================================================================== */
(function () {
  "use strict";
  var E = globalThis.VNQuadDasha.engines;
  var PNAMES = E.PNAMES, LORD = E.LORD, PASP = E.PASP, JASP = E.JASP,
      houseFrom = E.houseFrom;

  var MOVABLE = [0, 3, 6, 9], FIXED = [1, 4, 7, 10];
  function signType(s) {
    return MOVABLE.indexOf(s) >= 0 ? "movable" : (FIXED.indexOf(s) >= 0 ? "fixed" : "dual");
  }

  // ---- Laghu Parashari functional classification, by LORDSHIP only --------
  // Natarajan's Chandra Kaviyam: Trikona (5, 9 and the lagna) always
  // auspicious; Kendra (4, 7, 10) neutral, with benefics owning them acquiring
  // Kendradhipatya dosha; Trishadaya (3, 6, 11) inauspicious; 2 and 7 maraka;
  // 8 deadly unless also lagna lord or placed in the 1st or 8th; 2 and 12
  // neutral. Rahu and Ketu own nothing, so they carry no functional class.
  var OJHA = { 1: 1, 4: 2, 7: 3, 10: 4, 5: 2, 9: 4, 3: -1, 6: -2, 11: -3, 8: -6, 2: 0, 12: 0 };
  var BENEFIC = ["Ju", "Ve", "Me", "Mo"];

  function lpFrame(sg, lagna) {
    var out = [];
    PNAMES.forEach(function (p) {
      var owns = [], h;
      if (p !== "Ra" && p !== "Ke") {
        for (h = 0; h < 12; h++) if (LORD[h] === p) owns.push(houseFrom(lagna, h));
      }
      var cls = [], kendra = false, trikona = false;
      owns.forEach(function (hh) {
        if (hh === 5 || hh === 9 || hh === 1) { trikona = true; cls.push(hh + " Trikona"); }
        if (hh === 4 || hh === 7 || hh === 10) { kendra = true; cls.push(hh + " Kendra"); }
        if (hh === 3 || hh === 6 || hh === 11) cls.push(hh + " Trishadaya");
        if (hh === 8) cls.push("8th deadly");
        if (hh === 2 || hh === 12) cls.push(hh + " neutral");
        if (hh === 2 || hh === 7) cls.push(hh + " MARAKA");
      });
      var mt = (E.MULA[p] !== undefined) ? houseFrom(lagna, E.MULA[p]) : null;
      var hh8 = owns.indexOf(8) >= 0;
      var hs = houseFrom(lagna, sg[p]);
      var exempt8 = hh8 && (p === "Su" || p === "Mo" || owns.indexOf(1) >= 0 ||
                            hs === 1 || hs === 8);
      out.push({
        p: p, owns: owns, classes: cls,
        yogakaraka: kendra && trikona,
        dosha: kendra && !trikona && BENEFIC.indexOf(p) >= 0,
        mulatrikonaHouse: mt, eighth: hh8, exempt8: exempt8,
        ojha: owns.reduce(function (a, hh) { return a + (OJHA[hh] || 0); }, 0),
        house: hs
      });
    });
    return out;
  }

  // ---- maraka hierarchy, in Laghu Parashari's descending order -----------
  function marakas(sg, lagna) {
    var l2 = (lagna + 1) % 12, l7 = (lagna + 6) % 12, l8 = (lagna + 7) % 12,
        l3 = (lagna + 2) % 12, l6 = (lagna + 5) % 12;
    var MAL = ["Su", "Ma", "Sa", "Ra", "Ke"], rows = [];
    function inH(s) {
      return PNAMES.filter(function (p) { return sg[p] === s; });
    }
    function mals(s, skip) {
      var r = inH(s).filter(function (p) { return MAL.indexOf(p) >= 0 && p !== skip; });
      return r.length ? r.join(" ") : "-";
    }
    rows.push(["1. 2nd lord", LORD[l2]]);
    rows.push(["2. malefic in the 2nd", mals(l2)]);
    rows.push(["3. 7th lord", LORD[l7]]);
    rows.push(["4. malefic in the 7th", mals(l7)]);
    rows.push(["5. malefic with the 2nd lord", mals(sg[LORD[l2]], LORD[l2])]);
    rows.push(["6. malefic with the 7th lord", mals(sg[LORD[l7]], LORD[l7])]);
    rows.push(["7. 8th lord", LORD[l8]]);
    rows.push(["8. 3rd lord, if with the 2nd/7th lord", LORD[l3] +
      ((sg[LORD[l3]] === sg[LORD[l2]] || sg[LORD[l3]] === sg[LORD[l7]]) ? "   <-- IT IS" : "   (not)")]);
    rows.push(["9. Saturn conjunct a maraka (DISPLACES all)",
      (sg.Sa === sg[LORD[l2]] || sg.Sa === sg[LORD[l7]] || sg.Sa === l2 || sg.Sa === l7) ? "YES" : "no"]);
    rows.push(["10. 6th lord", LORD[l6]]);
    var t = signType(lagna);
    return {
      rows: rows, lagnaType: t,
      special: t === "movable" ? "2nd & 7th lords"
             : t === "fixed" ? "3rd & 8th lords" : "7th & 11th lords"
    };
  }

  // ---- longevity class from the sign-types of the lagna lord and 8th lord -
  function longevity(sg, lagna) {
    var ll = LORD[lagna], l8 = LORD[(lagna + 7) % 12];
    var a = signType(sg[ll]), b = signType(sg[l8]);
    // same types give that type; different types give the third
    var t = (a === b) ? a : ["movable", "fixed", "dual"].filter(function (x) {
      return x !== a && x !== b;
    })[0];
    return {
      lagnaLord: ll, eighthLord: l8, a: a, b: b, resultType: t,
      cls: t === "movable" ? "LONG" : (t === "dual" ? "MIDDLE" : "SHORT")
    };
  }

  // ---- sambandha, in Laghu Parashari's descending order of power ---------
  function aspects(sg, p, target) {
    var offs = PASP[p] || [6];
    for (var i = 0; i < offs.length; i++) {
      if ((sg[p] + offs[i]) % 12 === target) return true;
    }
    return false;
  }
  function sambandha(sg, p, q) {
    if (p === q) return "-";
    var ownP = [], ownQ = [], h;
    for (h = 0; h < 12; h++) {
      if (LORD[h] === p) ownP.push(h);
      if (LORD[h] === q) ownQ.push(h);
    }
    if (ownP.indexOf(sg[q]) >= 0 && ownQ.indexOf(sg[p]) >= 0) return "EXCHANGE";
    var mutual = aspects(sg, p, sg[q]) && aspects(sg, q, sg[p]);
    if (mutual && (ownP.indexOf(sg[p]) >= 0 || ownQ.indexOf(sg[q]) >= 0)) return "mutual aspect, one in own house";
    if (mutual) return "mutual aspect";
    if (aspects(sg, p, sg[q]) || aspects(sg, q, sg[p])) return "one-way aspect";
    if (sg[p] === sg[q]) return "same house";
    var d = ((sg[q] - sg[p] + 12) % 12) + 1;
    if (d === 4 || d === 7 || d === 10) return "mutual kendra";
    if (d === 5 || d === 9) return "mutual trikona";
    return "UNRELATED";
  }
  function sadharmi(p, q, lagna) {
    // same functional character: the pairs are the 1&7, 2&12, 3&11, 4&10,
    // 5&9 and 6&8 lords
    var PAIRS = [[1, 7], [2, 12], [3, 11], [4, 10], [5, 9], [6, 8]];
    var hp = [], hq = [], h, i;
    for (h = 0; h < 12; h++) {
      if (LORD[h] === p) hp.push(houseFrom(lagna, h));
      if (LORD[h] === q) hq.push(houseFrom(lagna, h));
    }
    for (i = 0; i < PAIRS.length; i++) {
      if ((hp.indexOf(PAIRS[i][0]) >= 0 && hq.indexOf(PAIRS[i][1]) >= 0) ||
          (hp.indexOf(PAIRS[i][1]) >= 0 && hq.indexOf(PAIRS[i][0]) >= 0)) return true;
    }
    return false;
  }
  function atmasambandhi(sg, p, q) {
    var i;
    for (i = 0; i < E.NATFRIEND.length; i++) {
      var f = E.NATFRIEND[i];
      if ((f[0] === p && f[1] === q) || (f[0] === q && f[1] === p)) return "natural friends";
    }
    if (E.EXALT[p] === sg[p] && E.EXALT[q] === sg[q]) return "both exalted";
    if (E.DEBIL[p] === sg[p] && E.DEBIL[q] === sg[q]) return "both debilitated";
    return "";
  }

  // ---- Pachaka / Bodhaka / Karaka / Vedhaka (Sarvartha Chintamani 131-144)
  var PBKV = {
    Su: { pachaka: "Sa", bodhaka: "Ma", karaka: "Ju", vedhaka: "Ve" },
    Mo: { pachaka: "Ve", bodhaka: "Ma", karaka: "Sa", vedhaka: "Su" },
    Ma: { pachaka: "Su", bodhaka: "Mo", karaka: "Sa", vedhaka: "Me" },
    Me: { pachaka: "Mo", bodhaka: "Ju", karaka: "Ve", vedhaka: "Ma" },
    Ju: { pachaka: "Sa", bodhaka: "Ma", karaka: "Mo", vedhaka: "Su" },
    Ve: { pachaka: "Me", bodhaka: "Ju", karaka: "Su", vedhaka: "Sa" },
    Sa: { pachaka: "Ve", bodhaka: "Mo", karaka: "Ju", vedhaka: "Ma" }
  };
  // the POSITIONAL form: each assignment activates fully at a stated distance
  var PBKV_POS = { pachaka: 6, bodhaka: 7, karaka: 9, vedhaka: 11 };
  function pbkvFor(sg, dashaLord) {
    var m = PBKV[dashaLord];
    if (!m) return null;
    return ["pachaka", "bodhaka", "karaka", "vedhaka"].map(function (role) {
      var q = m[role], d = ((sg[q] - sg[dashaLord] + 12) % 12) + 1;
      return { role: role, planet: q, distance: d, positional: d === PBKV_POS[role] };
    });
  }

  // ---- Jaimini: arudha padas, karakamsa, the ten rajayogas ---------------
  function pada(sg, lagna, houseNo) {
    // count from the house to its lord, then the same count on from the lord;
    // landing on the house itself or the 7th from it is moved to the 10th
    var hs = (lagna + houseNo - 1) % 12, l = LORD[hs],
        c = ((sg[l] - hs + 12) % 12) + 1, p = (sg[l] + c - 1) % 12;
    if (p === hs || p === (hs + 6) % 12) p = (p + 9) % 12;
    return p;
  }
  function jaiminiRajayogas(sg, lagna, kar, useNavamsa, lonD) {
    var fifth = LORD[(lagna + 4) % 12];
    var members = [["AK", kar.byRole.AK], ["AmK", kar.byRole.AmK],
                   ["PK", kar.byRole.PK], ["DK", kar.byRole.DK], ["5L", fifth]];
    function sgn(p) { return useNavamsa ? E.varga(lonD[p], 9) : sg[p]; }
    var out = [], i, j;
    for (i = 0; i < members.length; i++) {
      for (j = i + 1; j < members.length; j++) {
        var a = members[i], b = members[j];
        if (a[1] === b[1]) continue;
        var how = null;
        if (sgn(a[1]) === sgn(b[1])) how = "conjunct";
        else if (JASP[sgn(a[1])].indexOf(sgn(b[1])) >= 0) how = "mutual rashi aspect";
        if (how) out.push({ pair: a[0] + "+" + b[0], planets: a[1] + "+" + b[1], how: how });
      }
    }
    return out;
  }

  globalThis.VNQuadDasha.frames = {
    signType: signType, lpFrame: lpFrame, marakas: marakas, longevity: longevity,
    sambandha: sambandha, sadharmi: sadharmi, atmasambandhi: atmasambandhi,
    aspects: aspects, PBKV: PBKV, pbkvFor: pbkvFor, pada: pada,
    jaiminiRajayogas: jaiminiRajayogas, OJHA: OJHA, BENEFIC: BENEFIC
  };
}());

/* =====================================================================
 * PART 3 — the report builder and the self-test.
 * vnQuadDashaMarkdown(chart, input) is registered in app.js's BUILDERS map as
 * report key "quaddasha", so it is reachable from the UI card, the Markdown
 * download, VedicCore.reportFor(spec, "quaddasha") and tools/run-nobrowser.js.
 * ===================================================================== */
(function () {
  "use strict";
  var E = globalThis.VNQuadDasha.engines, F = globalThis.VNQuadDasha.frames;
  var SIGNS = E.SIGNS, SIGN_FULL = E.SIGN_FULL, PNAMES = E.PNAMES,
      PFULL = E.PFULL, LORD = E.LORD, JASP = E.JASP,
      signOf = E.signOf, degIn = E.degIn, fmtDeg = E.fmtDeg, nakPada = E.nakPada,
      varga = E.varga, ymd = E.ymd, houseFrom = E.houseFrom, pad = E.pad, lpad = E.lpad,
      R = E.R, radd = E.radd, rsub = E.rsub, rmul = E.rmul, rcmp = E.rcmp, rnum = E.rnum;

  var YEAR_DAYS = 365.25;          // ages -> calendar dates; stated in §0
  var DAY_MS = 86400000;

  // ------------------------------------------------------------ utilities
  function isoDay(dt) {
    return dt.getUTCFullYear() + "-" + lpad2(dt.getUTCMonth() + 1) + "-" + lpad2(dt.getUTCDate());
  }
  function lpad2(n) { return n < 10 ? "0" + n : String(n); }
  function dateAtAge(birth, years) {
    return new Date(birth.getTime() + years * YEAR_DAYS * DAY_MS);
  }
  function ageAt(birth, when) {
    return (when.getTime() - birth.getTime()) / (YEAR_DAYS * DAY_MS);
  }
  function table(L, head, rows) {
    L.push("| " + head.join(" | ") + " |");
    L.push("|" + head.map(function () { return "---"; }).join("|") + "|");
    rows.forEach(function (r) {
      L.push("| " + r.map(function (c) { return c === null || c === undefined ? "" : String(c); }).join(" | ") + " |");
    });
    L.push("");
  }

  // Pull ONLY the ephemeris and the Ascendant out of VedNetra's chart.
  function extract(chart) {
    var lon = {}, sg = {}, deg = {}, retro = {};
    (chart.planets || []).forEach(function (p) {
      var k = E.VN2K[p.name];
      if (!k) return;
      lon[k] = E.signOf !== undefined ? ((p.lon % 360) + 360) % 360 : p.lon;
      retro[k] = !!p.retrograde;
    });
    if (lon.Ra !== undefined && lon.Ke === undefined) lon.Ke = (lon.Ra + 180) % 360;
    lon.As = ((chart.ascendant.lon % 360) + 360) % 360;
    Object.keys(lon).forEach(function (k) { sg[k] = signOf(lon[k]); deg[k] = degIn(lon[k]); });
    var missing = PNAMES.filter(function (k) { return lon[k] === undefined; });
    if (missing.length) throw new Error("ephemeris missing: " + missing.join(", "));
    return { lon: lon, sg: sg, deg: deg, retro: retro, lagna: sg.As };
  }

  // ------------------------------------------------- the four timelines
  function runningAt(chart, X, age) {
    var out = {};
    var v = E.vimshottari(X.lon.Mo);
    v.rows.some(function (r) {
      if (rnum(r.start) <= age && age < rnum(r.end)) { out.vimMD = r.md; out.vimAD = r.ad; return true; }
      return false;
    });
    var c = E.chara(X.lagna, X.sg, X.deg);
    c.rows.some(function (r) {
      if (r.start <= age && age < r.end) { out.chara = SIGNS[r.sign]; return true; }
      return false;
    });
    var k = E.kcd(X.lon.Mo);
    k.rows.some(function (r) {
      if (rnum(r.start) <= age && age < rnum(r.end)) { out.kcd = r.sign; out.kcdGati = r.gati; return true; }
      return false;
    });
    var y = E.yogini(X.lon.Mo);
    y.rows.some(function (r) {
      if (rnum(r.start) <= age && age < rnum(radd(r.start, r.len))) {
        out.yogini = r.yogini; out.yoginiLord = r.lord; out.pl = SIGNS[r.pl]; out.progNak = r.nak; return true;
      }
      return false;
    });
    return out;
  }

  // Birth-time stability. Re-casts through VedNetra's own buildChart so the
  // perturbation goes through the same ephemeris the report was built on.
  // KCD drifts ~2.92 months per minute of birth-time error, so this table is
  // not optional: anything that moves inside the plausible error is withdrawn.
  function stability(chart, input, age, mins) {
    mins = mins || [1, 5, 15];
    var VC = globalThis.VedicCore;
    if (!VC || !VC.buildChart) return null;
    var lat = Number(input.latitude), lon = Number(input.longitude), tz = Number(input.timezone);
    var base = chart.date instanceof Date ? chart.date : new Date(chart.date);
    function at(offMin) {
      var c = VC.buildChart(new Date(base.getTime() + offMin * 60000), lat, lon, tz, { ayanamshaKey: "lahiri" });
      return runningAt(c, extract(c), age);
    }
    var ref = runningAt(chart, extract(chart), age), res = {};
    ["vimMD", "vimAD", "kcd", "chara", "yogini"].forEach(function (k) { res[k] = {}; });
    mins.forEach(function (m) {
      [1, -1].forEach(function (s) {
        var alt = at(m * s);
        Object.keys(res).forEach(function (k) {
          if (res[k][m] === undefined) res[k][m] = true;
          res[k][m] = res[k][m] && alt[k] === ref[k];
        });
      });
    });
    return { ref: ref, res: res, mins: mins };
  }

  // =====================================================================
  // THE REPORT
  // =====================================================================
  function vnQuadDashaMarkdown(chart, input) {
    var X = extract(chart), lagna = X.lagna, sg = X.sg, deg = X.deg, lon = X.lon;
    var birth = chart.date instanceof Date ? chart.date : new Date(chart.date);
    var kar = E.karakas(deg);
    var asOf = (input && input.asOfInstant) ? new Date(input.asOfInstant) : new Date();
    var askAge = ageAt(birth, asOf);
    var L = [];

    // ---------------------------------------------------------------- §0
    L.push("# QUAD DASHA EXPORT — " + ((input && input.nativeName) || "Native"));
    L.push("");
    L.push("*SHREE GANESHA JI SHRI SARASWATI JI BLESSED QUAD DASHA — VedNetra report `quaddasha`, engine v" + E.version + ".*");
    L.push("");
    L.push("> **QUAD-DASHA-VALID** — all four dasha systems computed in `quad-dasha.js`, which takes");
    L.push("> from VedNetra **only the ephemeris and the Ascendant**. The seven corrections below are");
    L.push("> enforced here, so a VedNetra change cannot move a dasha boundary. Interpretation is");
    L.push("> **CLASSICAL and unvalidated** — §13.");
    L.push("");
    L.push("## §0 CASTING HEADER");
    L.push("");
    var st = (function () { try { return vnQuadDashaSelftest(); } catch (e) { return { pass: 0, total: 0, err: e.message }; } }());
    table(L, ["field", "value"], [
      ["native", (input && input.nativeName) || "Native"],
      ["birth place", (input && input.birthPlace) || "—"],
      ["birth instant (UT)", birth.toISOString()],
      ["clock offset used (tz)", (input && input.timezone !== undefined) ? ("UT" + (Number(input.timezone) >= 0 ? "+" : "") + Number(input.timezone)) : "—"],
      ["latitude / longitude", ((input && input.latitude) || 0) + " / " + ((input && input.longitude) || 0)],
      ["ayanamsa", "Lahiri " + Number(chart.ayanamsa).toFixed(6) + "°  (correction 7: Lahiri only)"],
      ["Ascendant", fmtDeg(lon.As) + "  (" + SIGN_FULL[lagna] + ")"],
      ["report built for", isoDay(asOf) + "  (age " + askAge.toFixed(2) + ")"],
      ["age→date conversion", YEAR_DAYS + " days per year"],
      ["**SELF-TEST**", "**" + st.pass + "/" + st.total + " passed**" + (st.err ? " — " + st.err : "")]
    ]);
    L.push("**The seven non-negotiable corrections, all enforced in this build:**");
    L.push("");
    L.push("1. Kaal Chakra balance is against the **whole package span** (100/85/83/86), never the first dasha. *BPHS 46/92–93.*");
    L.push("2. Kaal Chakra has **nine** antardasas per dasha, not twelve — the nine signs of the native's own package, cycled to open on the dasha sign. *BPHS Ch.64, 27/27 printed cells.*");
    L.push("3. The Kaal Chakra package **repeats** when exhausted; it does not advance to the next pada's package.");
    L.push("4. Chara length-counting goes in groups of **three**: Ar/Ta/Ge forward, Cn/Le/Vi reverse, Li/Sc/Sg forward, Cp/Aq/Pi reverse. *Rao's own worked table.*");
    L.push("5. Chara: no ±1y for exaltation/debilitation, no fractional years; max 12, min 1, never 0.");
    L.push("6. **Seven** Chara karakas, never eight.");
    L.push("7. **Lahiri** ayanamsa only — another ayanamsa reorders the karakas.");
    L.push("");
    L.push("**Divergence from VedNetra's own dasha sections, measured.** VedNetra's *Char Dasha* card");
    L.push("takes its counting direction from **sign parity** and ignores the Scorpio/Aquarius");
    L.push("co-lordships; against the sequence K.N. Rao prints for Queen Elizabeth II it scores");
    L.push("**8/12**, with three lengths out by exactly `12 − correct`, while this engine scores **12/12**.");
    L.push("Its *Yogini* card has no progressed lagna, and it has no Kaal Chakra at all. **Read the");
    L.push("four timelines below, not those cards.**");
    L.push("");

    // ---------------------------------------------------------------- §1
    L.push("## §1 CHART — nine grahas");
    L.push("");
    table(L, ["graha", "sidereal", "house", "nakshatra", "pada", "in-pada", "nak lord", "D-9", "D-7", "D-3", "R", "karaka"],
      PNAMES.map(function (p) {
        var np = nakPada(lon[p]);
        return [PFULL[p], fmtDeg(lon[p]), houseFrom(lagna, sg[p]),
                np.nak, np.pada, Math.round(np.inPada) + "' of 200'", E.NAKLORD[np.nak],
                SIGNS[varga(lon[p], 9)], SIGNS[varga(lon[p], 7)], SIGNS[varga(lon[p], 3)],
                X.retro[p] ? "R" : "", kar.byPlanet[p] || ""];
      }));
    L.push("Rashi occupancy: " + SIGNS.map(function (s, i) {
      var occ = PNAMES.filter(function (p) { return sg[p] === i; });
      return occ.length ? (s + "[" + occ.join(" ") + "]") : null;
    }).filter(Boolean).join("  ·  "));
    L.push("");

    // ---------------------------------------------------------------- §2
    L.push("## §2 CHARA KARAKAS (seven) and the Jaimini frame");
    L.push("");
    table(L, ["role", "graha", "degree in sign", "rashi", "navamsa", "house from lagna"],
      ["AK", "AmK", "BK", "MK", "PK", "GK", "DK"].map(function (r) {
        var p = kar.byRole[r];
        return [r, PFULL[p], deg[p].toFixed(4), SIGNS[sg[p]], SIGNS[varga(lon[p], 9)], houseFrom(lagna, sg[p])];
      }));
    var akNav = varga(lon[kar.byRole.AK], 9), dkNav = varga(lon[kar.byRole.DK], 9);
    table(L, ["derived point", "sign", "note"], [
      ["Karakamsa (AK's navamsa)", SIGNS[akNav], "the Swamsa; read the chart from here"],
      ["DKN (DK's navamsa)", SIGNS[dkNav], "Rao uses DK and DKN together for marriage and for death"],
      ["Arudha Lagna (AL)", SIGNS[F.pada(sg, lagna, 1)], "the image, as against the self"],
      ["Upapada (UL, 12th pada)", SIGNS[F.pada(sg, lagna, 12)], "marriage; Rao reads the 7th from it too"],
      ["Darapada (A7)", SIGNS[F.pada(sg, lagna, 7)], "spouse"],
      ["Putrapada (A5)", SIGNS[F.pada(sg, lagna, 5)], "children"],
      ["Karmapada (A10)", SIGNS[F.pada(sg, lagna, 10)], "career"]
    ]);
    var ry1 = F.jaiminiRajayogas(sg, lagna, kar, false, lon);
    var ry9 = F.jaiminiRajayogas(sg, lagna, kar, true, lon);
    L.push("**The ten Jaimini rajayogas** — AK, AmK, PK, DK and the 5th lord taken pairwise.");
    L.push("Rao's structural filter: *count them in D-1, then count again in D-9; what survives in the");
    L.push("navamsa is what is effective.*");
    L.push("");
    table(L, ["pair", "planets", "in D-1", "in D-9 (the filter)"],
      (function () {
        var all = {}, rows = [];
        ry1.forEach(function (r) { all[r.pair] = all[r.pair] || { planets: r.planets }; all[r.pair].d1 = r.how; });
        ry9.forEach(function (r) { all[r.pair] = all[r.pair] || { planets: r.planets }; all[r.pair].d9 = r.how; });
        Object.keys(all).forEach(function (k) {
          rows.push([k, all[k].planets, all[k].d1 || "—", all[k].d9 ? "**" + all[k].d9 + "**" : "—"]);
        });
        return rows.length ? rows : [["(none)", "—", "—", "—"]];
      }()));
    var amk = kar.byRole.AmK, ak = kar.byRole.AK;
    var amkFromAk = ((sg[amk] - sg[ak] + 12) % 12) + 1;
    var amkNavFromAk = ((varga(lon[amk], 9) - varga(lon[ak], 9) + 12) % 12) + 1;
    table(L, ["Rao's AmK career board (from the LAGNA, not Karakamsa)", "value"], [
      ["AmK", PFULL[amk] + " in " + SIGNS[sg[amk]] + ", house " + houseFrom(lagna, sg[amk])],
      ["step 1 — placement (Kendra/Trikona/11th = smooth career)",
        ([1, 4, 7, 10, 5, 9, 11].indexOf(houseFrom(lagna, sg[amk])) >= 0) ? "YES, house " + houseFrom(lagna, sg[amk]) : "no, house " + houseFrom(lagna, sg[amk])],
      ["step 2 — aspects on AmK (the nature of the career's problems)",
        PNAMES.filter(function (q) { return q !== amk && F.aspects(sg, q, sg[amk]); }).map(function (q) { return PFULL[q]; }).join(", ") || "none"],
      ["step 3 — conjunctions with AmK (the character of the career)",
        PNAMES.filter(function (q) { return q !== amk && sg[q] === sg[amk]; }).map(function (q) { return PFULL[q]; }).join(", ") || "none"],
      ["AmK from AK, in D-1", amkFromAk + ((amkFromAk === 6 || amkFromAk === 8 || amkFromAk === 12) ? "  (6/8/12 — Rao: struggle)" : "")],
      ["AmK from AK, in D-9", amkNavFromAk + ((amkNavFromAk === 10) ? "  (the 10th — by Rao's research the best position of all)" : "")]
    ]);
    L.push("Jaimini rashi drishti, for every occupied sign:");
    L.push("");
    SIGNS.forEach(function (s, i) {
      if (!PNAMES.some(function (p) { return sg[p] === i; })) return;
      L.push("- **" + SIGN_FULL[i] + "** aspects " + JASP[i].map(function (t) { return SIGN_FULL[t]; }).join(", "));
    });
    L.push("");

    // ---------------------------------------------------------------- §3
    L.push("## §3 LAGHU PARASHARI READING FRAME — functional classification by LORDSHIP");
    L.push("");
    var lp = F.lpFrame(sg, lagna);
    table(L, ["graha", "owns (houses from lagna)", "class", "house", "Yogakaraka", "Kendradhipatya dosha", "mulatrikona house", "Ojha"],
      lp.map(function (r) {
        return [PFULL[r.p], r.owns.join(", ") || "—",
                r.classes.join("; ") || "no lordship",
                r.house, r.yogakaraka ? "**YES**" : "",
                r.dosha ? "**YES**" : "",
                r.mulatrikonaHouse === null ? "—" : r.mulatrikonaHouse,
                r.ojha];
      }));
    L.push("Strength gradients, both ascending: Kendras 1 < 4 < 7 < **10**; Trikonas 1 < 5 < **9**;");
    L.push("Trishadayas 3 < 6 < **11**. Dosha intensity among benefics descends Jupiter > Venus >");
    L.push("Mercury > waxing Moon. Sun and Moon are exempt from the 8th-lordship blemish, as is the");
    L.push("lagna lord and an 8th lord sitting in the 1st or the 8th.");
    L.push("");
    lp.filter(function (r) { return r.eighth; }).forEach(function (r) {
      L.push("- **8th lordship:** " + PFULL[r.p] + (r.exempt8 ? " — **exempt** (lagna lord, or Sun/Moon, or placed in the 1st/8th)" : " — not exempt; deadly evil as the text has it"));
    });
    L.push("");
    L.push("**★ The delivery engine (LP v.29).** *“The results that are to be given by them will be");
    L.push("forthcoming only from the Antardasa that comes after the own Antardasa of the Mahadasa");
    L.push("lord.”* A dasha lord **cannot deliver in its own bhukti** — it delivers through the");
    L.push("sub-lords. Kendra lords give their good in the bhuktis of Trikona lords and Trikona lords");
    L.push("in the bhuktis of Kendra lords.");
    L.push("");
    var mk = F.marakas(sg, lagna);
    L.push("### Maraka hierarchy, descending (LP) — lagna is " + mk.lagnaType + ", so the special pair is the " + mk.special);
    L.push("");
    table(L, ["rank / rule", "resolved for this chart"], mk.rows);
    var lg = F.longevity(sg, lagna);
    table(L, ["longevity (sign-type pair of the lagna lord and the 8th lord)", "value"], [
      ["lagna lord", PFULL[lg.lagnaLord] + " in a " + lg.a + " sign"],
      ["8th lord", PFULL[lg.eighthLord] + " in a " + lg.b + " sign"],
      ["resulting type", lg.resultType],
      ["**class**", "**" + lg.cls + "**  (movable = long, dual = middle, fixed = short)"]
    ]);
    L.push("> The book that gives this chain tests it on a real death and **marks itself 3 of 5 rules");
    L.push("> correct** — its longevity class said “middle life” and the native died at 89. **No date for");
    L.push("> a death is produced by this report, at any confidence.**");
    L.push("");
    var vsRel = F.sambandha(sg, "Ve", "Sa");
    L.push("**The Venus–Saturn inversion (LP).** Venus and Saturn give each other's results in each");
    L.push("other's dasha-bhukti **only when unrelated**. Here they are: **" + vsRel + "**" +
      (vsRel === "UNRELATED" ? " — so the inversion applies." : " — so the inversion does not apply."));
    L.push("");

    // ---------------------------------------------------------------- §4
    L.push("## §4 SAMBANDHA MATRIX — the gate every school turns on");
    L.push("");
    L.push("Descending power: mutual exchange of houses > mutual aspect with one in its own house >");
    L.push("aspect by dispositor > occupation of the same house > failing all four, mutual Kendra or");
    L.push("Trikona. **Relationship, not the lords' own quality, is what decides delivery** — the");
    L.push("deepest agreement in the corpus (`02-RULES.md §5.3`).");
    L.push("");
    var seven = ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke"];
    table(L, [""].concat(seven), seven.map(function (p) {
      return [("**" + p + "**")].concat(seven.map(function (q) {
        if (p === q) return "·";
        var s = F.sambandha(sg, p, q);
        return s === "EXCHANGE" ? "**EXCH**" : s === "UNRELATED" ? "unrel" : s
          .replace("mutual aspect, one in own house", "mut-asp-own")
          .replace("mutual aspect", "mut-asp")
          .replace("one-way aspect", "1way")
          .replace("same house", "same")
          .replace("mutual kendra", "kendra")
          .replace("mutual trikona", "trikona");
      }));
    }));
    var sadRows = [];
    seven.forEach(function (p, i) {
      seven.slice(i + 1).forEach(function (q) {
        var s = F.sadharmi(p, q, lagna), a = F.atmasambandhi(sg, p, q);
        if (s || a) sadRows.push([p + " – " + q, s ? "Sadharmi (same functional character)" : "", a || ""]);
      });
    });
    table(L, ["pair", "Sadharmi", "Atmasambandhi"], sadRows.length ? sadRows : [["(none)", "", ""]]);

    // ---------------------------------------------------------------- §5
    L.push("## §5 PACHAKA / BODHAKA / KARAKA / VEDHAKA — the delivery-mode layer");
    L.push("");
    L.push("*Sarvartha Chintamani* vv.131–144. **Bodhaka** gives the dasha lord's promised good even");
    L.push("with no strength of its own; **Pachaka** gives it in full; **Karaka** gives its own agenda;");
    L.push("**Vedhaka obstructs** — and obstructs whatever it conjoins or aspects. The *positional*");
    L.push("form activates fully at a stated house-distance from the dasha lord (Pachaka 6th, Bodhaka");
    L.push("7th, Karaka 9th, Vedhaka 11th); the column says whether that distance is met here.");
    L.push("");
    table(L, ["dasha lord", "Pachaka", "Bodhaka", "Karaka", "Vedhaka (BLOCKS)"],
      ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa"].map(function (p) {
        var rows = F.pbkvFor(sg, p), cell = {};
        rows.forEach(function (r) {
          cell[r.role] = PFULL[r.planet] + " (" + r.distance + (r.positional ? "° **positional**" : "") + ")";
        });
        return [PFULL[p], cell.pachaka, cell.bodhaka, cell.karaka, "**" + cell.vedhaka + "**"];
      }));
    L.push("Intra-bhukti timing: divide the planet's navamsa sign into three — first third → the result");
    L.push("falls early in the bhukti, middle → middle, last → end.");
    L.push("");

    // ---------------------------------------------------------------- §6
    var vim = E.vimshottari(lon.Mo);
    L.push("## §6 VIMSHOTTARI — 120y, nakshatra");
    L.push("");
    L.push("Birth nakshatra **" + vim.nak + "**, so the first mahadasha is **" + PFULL[vim.first] +
      "** with a balance of **" + ymd(rnum(vim.balance)) + "**.");
    L.push("");
    L.push("**The antardasa is the finest reliable level in the whole set** — 1.49y average, 96.2%");
    L.push("identity-stable at ±5 min of birth-time error (`03-EVIDENCE.md §6`).");
    L.push("");
    table(L, ["MD", "AD", "from age", "to age", "length", "from", "to"],
      vim.rows.filter(function (r) { return rnum(r.start) < 100; }).map(function (r) {
        return [PFULL[r.md], PFULL[r.ad], rnum(r.start).toFixed(2), rnum(r.end).toFixed(2),
                ymd(rnum(r.len)), isoDay(dateAtAge(birth, rnum(r.start))), isoDay(dateAtAge(birth, rnum(r.end)))];
      }));

    // ---------------------------------------------------------------- §7
    var ch = E.chara(lagna, sg, deg);
    L.push("## §7 CHARA — rashi, Jaimini, K.N. Rao's method");
    L.push("");
    L.push("Lagna " + SIGN_FULL[lagna] + " → **" + (ch.direct ? "DIRECT" : "INDIRECT") + "** order" +
      " (direct for Ar, Le, Vi, Li, Aq, Pi). Counting direction for the lengths goes in **groups of");
    L.push("three** — correction 4. **100% identity-stable at ±5 min**, the most robust level measured,");
    L.push("and the only level usable with no birth time at all.");
    L.push("");
    table(L, ["rashi", "years", "from age", "to age", "from", "to", "counted", "to its lord in"],
      ch.rows.filter(function (r) { return r.start < 100; }).map(function (r) {
        var Rn = r.sign, lord = Rn === 7 ? "Ma/Ke" : (Rn === 10 ? "Sa/Ra" : LORD[Rn]);
        return [SIGN_FULL[Rn], r.years, r.start.toFixed(2), r.end.toFixed(2),
                isoDay(dateAtAge(birth, r.start)), isoDay(dateAtAge(birth, r.end)),
                E.charaForward(Rn) ? "forward" : "reverse", lord];
      }));
    // sub-periods of the dasha running at the report date
    var chCur = ch.rows.filter(function (r) { return r.start <= askAge && askAge < r.end; })[0];
    if (chCur) {
      L.push("Sub-periods of the running **" + SIGN_FULL[chCur.sign] + "** dasha (Rao: the rashi's OWN");
      L.push("sub-period comes **last**):");
      L.push("");
      table(L, ["sub-rashi", "from age", "length", "from", "to"],
        E.charaSubs(chCur.sign, chCur.years, lagna).map(function (s) {
          var a = chCur.start + rnum(s.start), b = a + rnum(s.len);
          return [SIGN_FULL[s.sign], a.toFixed(2), ymd(rnum(s.len)), isoDay(dateAtAge(birth, a)), isoDay(dateAtAge(birth, b))];
        }));
      // Rao's karaka test for each sector, from the running dasha rashi
      L.push("**Rao's karaka placement test, from the running dasha rashi** — the event's karaka must");
      L.push("be in, or Jaimini-aspect, the dasha rashi or the relevant house from it:");
      L.push("");
      table(L, ["sector", "karaka", "house from the dasha rashi", "karaka in it?", "karaka aspects it?"],
        [["marriage", "DK", 7], ["children", "PK", 5], ["career", "AmK", 10],
         ["career (11th)", "AmK", 11], ["siblings / father", "BK", 3], ["mother", "MK", 4],
         ["disease / accident", "GK", 6], ["death", "DK", 1]].map(function (row) {
          var p = kar.byRole[row[1]], tgt = (chCur.sign + row[2] - 1) % 12;
          return [row[0], PFULL[p] + " (" + row[1] + ")", row[2] + " = " + SIGN_FULL[tgt],
                  sg[p] === tgt ? "**YES**" : "no",
                  JASP[sg[p]].indexOf(tgt) >= 0 ? "**YES**" : "no"];
        }));
      L.push("Rao's three cautions, checked here: the sub-period of a rashi **6th or 8th** from the");
      L.push("major rashi (" + SIGN_FULL[(chCur.sign + 5) % 12] + ", " + SIGN_FULL[(chCur.sign + 7) % 12] +
        ") · the **AK in the 8th** from the running period (AK " + PFULL[ak] + " is " +
        (((sg[ak] - chCur.sign + 12) % 12) + 1) + " from it) · and the **6th-house rashi's own dasha**, " +
        "which is the 2nd from the 5th and so concerns children.");
      L.push("");
    }

    // ---------------------------------------------------------------- §8
    var kc = E.kcd(lon.Mo), pkg = kc.pkg;
    L.push("## §8 KAAL CHAKRA — rashi, BPHS Ch.46/51/64");
    L.push("");
    table(L, ["field", "value"], [
      ["birth nakshatra / pada", pkg.nak + " pada " + pkg.pada + "  (group " + pkg.group + ", " + (pkg.direct ? "Savya / direct" : "Apsavya / reversed") + ")"],
      ["dasha-package", pkg.dp],
      ["package sequence", pkg.seq.join(" → ")],
      ["**purnayus** (whole span)", "**" + pkg.span + " years**"],
      ["deha (body)", pkg.deha],
      ["jeeva (life)", pkg.jeeva],
      ["expired at birth", ymd(rnum(pkg.expired)) + "   ← **computed against the WHOLE span** (correction 1)"],
      ["balance at birth", ymd(rnum(pkg.balance))]
    ]);
    L.push("**Correction 3 — the package repeats.** When the ninth dasha ends the sequence reverts to");
    L.push("the first. It does not advance to the next pada's package: deha and jeeva are natal");
    L.push("invariants and advancing would change them mid-life.");
    L.push("");
    L.push("**⚠ The dasha level only.** A KCD **bhukti** averages 1.1y while ±5 min of birth-time error");
    L.push("drifts the boundaries **1.22y** — more than the period itself. The bhukti is **unlocatable**");
    L.push("and must not be used for timing. The nine antardasas are printed below because BPHS Ch.64");
    L.push("prints them and the arithmetic is the validated part, not because they can be located.");
    L.push("");
    table(L, ["dasha", "years", "from age", "to age", "from", "to", "predecessor", "gati", "house from lagna", "house from deha", "energy", "nature"],
      kc.rows.filter(function (r) { return rnum(r.start) < 100; }).map(function (r) {
        var si = SIGNS.indexOf(r.sign);
        return [SIGN_FULL[si], E.KY[r.sign], rnum(r.start).toFixed(2), rnum(r.end).toFixed(2),
                isoDay(dateAtAge(birth, rnum(r.start))), isoDay(dateAtAge(birth, rnum(r.end))),
                r.prev, r.gati ? "**" + r.gati + "**" : "",
                houseFrom(lagna, si), houseFrom(SIGNS.indexOf(pkg.deha), si),
                E.KENERGY[r.sign] + " of 7", E.KBENEFIC[r.sign]];
      }));
    L.push("**The gaits, as BPHS names them.** *Simhavalokana* = quantum jump (signs skipped, direction");
    L.push("reverses, and a shift between the clockwise and counter-clockwise layouts); *Mandooki* =");
    L.push("fast forward; *Markati* = reorientation, always between two fast-forward dashas and always");
    L.push("involving Cancer and Leo. **Measured at lift 0.81–0.95 across every specification tried —");
    L.push("the gaits are the one thing Kaal Chakra uniquely contributes and they test at chance.**");
    L.push("");
    L.push("**★ The house-activation rule (SMS's correction of the 6/8/12 rule).** *“The mere accident");
    L.push("of placement of a sign in a particular house does not conclusively lend any benefic or");
    L.push("malefic quality. It only brings into focus the matters coming under that house.”* The two");
    L.push("house columns above are counted from the lagna **and** from the deha sign, as his R066");
    L.push("licenses.");
    L.push("");
    L.push("**★ The transposition rule (BPHS 49/36).** Everything you know about reading a chart is");
    L.push("applied with the **dasha-producing sign treated as the ascendant** — subject to the");
    L.push("foundation-chart ceiling: a rajayoga forming from the dasha sign does not materialise if");
    L.push("the natal chart holds no potential for it (cf. BPHS 76/17).");
    L.push("");
    var kcCur = kc.rows.filter(function (r) { return rnum(r.start) <= askAge && askAge < rnum(r.end); })[0];
    if (kcCur) {
      var ants = E.kcdAntardashas(pkg, kcCur.sign);
      var tot = ants.reduce(function (a, x) { return radd(a, x.len); }, R(0, 1));
      L.push("Nine antardasas of the running **" + SIGN_FULL[SIGNS.indexOf(kcCur.sign)] + "** dasha — the");
      L.push("native's own package, cycled to open on the dasha sign, each `" + E.KY[kcCur.sign] +
        " × antar / " + pkg.span + "`. They sum to **" + ymd(rnum(tot)) + "** against the dasha's " +
        E.KY[kcCur.sign] + "y — " + (rcmp(tot, R(E.KY[kcCur.sign], 1)) === 0 ? "**exact**" : "**MISMATCH**") + ".");
      L.push("");
      var acc = kcCur.start;
      table(L, ["antardasa", "length", "from age", "from", "to", "house from the dasha sign"],
        ants.map(function (a) {
          var s0 = acc, s1 = radd(acc, a.len); acc = s1;
          return [SIGN_FULL[SIGNS.indexOf(a.sign)], ymd(rnum(a.len)), rnum(s0).toFixed(2),
                  isoDay(dateAtAge(birth, rnum(s0))), isoDay(dateAtAge(birth, rnum(s1))),
                  houseFrom(SIGNS.indexOf(kcCur.sign), SIGNS.indexOf(a.sign))];
        }));
      L.push("> **The bhukti ceiling (SMS):** *“Notwithstanding the dignity or indignity of a bhukti");
      L.push("> sign, only such events can take place in the bhukti as are indicated/permitted by the");
      L.push("> dasha sign.”*");
      L.push("");
    }
    // the eight maraka conditions of JP 17/34-36, resolved
    L.push("The eight KCD maraka conditions (JP 17/34–36) — a sign is maraka if it holds the stated");
    L.push("graha at the stated house from the lagna. *mrityu* covers misery, fear, shame, disease,");
    L.push("bereavement, insult and confinement, not only death, and **death comes only if a maraka");
    L.push("period falls when the term of longevity is already used up**.");
    L.push("");
    table(L, ["condition", "house", "graha", "sign in that house", "graha there?"],
      [[1, "Sa"], [3, "Ju"], [6, "Ve"], [7, "Me"], [7, "Ma"], [8, "Mo"], [9, "Ra"], [12, "Su"]].map(function (c) {
        var s = (lagna + c[0] - 1) % 12;
        return ["house " + c[0] + " + " + PFULL[c[1]], c[0], PFULL[c[1]], SIGN_FULL[s],
                sg[c[1]] === s ? "**YES — maraka sign**" : "no"];
      }));

    // ---------------------------------------------------------------- §9
    var yg = E.yogini(lon.Mo);
    L.push("## §9 YOGINI — 36y cycle with V.P. Goel's progressed lagna");
    L.push("");
    L.push("Birth nakshatra **" + yg.nak + "** → starting yogini **" + yg.first + "**. The progression");
    L.push("advances the nakshatra one step per yogini; Ashwini, Bharani and Krittika are bracketed");
    L.push("onto P.Bhadrapada, U.Bhadrapada and Revati, which gives 24 steps for 24 periods over three");
    L.push("cycles. The **progressed lagna (PL)** is the sign of the progression nakshatra.");
    L.push("");
    table(L, ["yogini", "lord", "years", "from age", "to age", "from", "to", "progression nakshatra", "PL", "natal lagna falls in"],
      yg.rows.filter(function (r) { return rnum(r.start) < 100; }).map(function (r) {
        var end = radd(r.start, r.len);
        return [r.yogini, PFULL[r.lord], rnum(r.len).toFixed(2), rnum(r.start).toFixed(2), rnum(end).toFixed(2),
                isoDay(dateAtAge(birth, rnum(r.start))), isoDay(dateAtAge(birth, rnum(end))),
                r.nak, SIGNS[r.pl], "house " + houseFrom(r.pl, lagna) + " of the progress chart"];
      }));
    var ygCur = yg.rows.filter(function (r) { return rnum(r.start) <= askAge && askAge < rnum(radd(r.start, r.len)); })[0];
    var natNakLord = E.NAKLORD[yg.nak];
    L.push("**★ Goel's three reference points**, resolved for this chart:");
    L.push("");
    table(L, ["reference point", "value"], [
      ["1. the birth nakshatra lord in the BIRTH chart",
        PFULL[natNakLord] + " in " + SIGN_FULL[sg[natNakLord]] + ", house " + houseFrom(lagna, sg[natNakLord]) +
        ", karaka " + (kar.byPlanet[natNakLord] || "—")],
      ["2. that lord in the PROGRESS chart",
        ygCur ? (PFULL[natNakLord] + " is house " + houseFrom(ygCur.pl, sg[natNakLord]) + " from the progressed lagna " + SIGNS[ygCur.pl]) : "—"],
      ["3. the DASHA lord's relation to it",
        ygCur ? (PFULL[ygCur.lord] + " ↔ " + PFULL[natNakLord] + ": " + F.sambandha(sg, ygCur.lord, natNakLord)) : "—"],
      ["the 11th, Goel's house of expansion",
        "lord " + PFULL[LORD[(lagna + 10) % 12]] + "; occupied by " +
        (PNAMES.filter(function (p) { return sg[p] === (lagna + 10) % 12; }).map(function (p) { return PFULL[p]; }).join(", ") || "nobody")],
      ["the nakshatra lord's sub-period in the running dasha (Goel: it “generally fulfils the promise”)",
        ygCur ? (function () {
          var subs = E.yoginiSubs(rnum(ygCur.len), ygCur.yogini), a = ygCur.start, hit = "—";
          subs.forEach(function (s) {
            if (s.lord === natNakLord) hit = s.yogini + " / " + PFULL[s.lord] + ", from age " + rnum(a).toFixed(2) + " (" + isoDay(dateAtAge(birth, rnum(a))) + ")";
            a = radd(a, s.len);
          });
          return hit;
        }()) : "—"]
    ]);
    if (ygCur) {
      L.push("Sub-periods of the running **" + ygCur.yogini + "** (the dasha yogini's own comes first;");
      L.push("`days = Q × P × 10`). **±6-month periods — usable only with a minute-accurate birth time.**");
      L.push("");
      var ya = ygCur.start;
      table(L, ["sub-yogini", "lord", "length", "from age", "from", "to"],
        E.yoginiSubs(rnum(ygCur.len), ygCur.yogini).map(function (s) {
          var a = ya, b = radd(ya, s.len); ya = b;
          return [s.yogini, PFULL[s.lord], ymd(rnum(s.len)), rnum(a).toFixed(2),
                  isoDay(dateAtAge(birth, rnum(a))), isoDay(dateAtAge(birth, rnum(b)))];
        }));
      L.push("Goel's double-transit funnel is measured **from the progressed lagna and from the");
      L.push("nakshatra lord's position in the progress chart**: Saturn within 1 year, Jupiter within 6");
      L.push("months, Sun within 1 month, Moon within 3 days. **⚠ VACUOUS — base rates 97.8%, 98.3%,");
      L.push("92.5% and 96.6%; all four together hold at 86.6% of randomly chosen dates. Report that it");
      L.push("fired, and that this means almost nothing.**");
      L.push("");
    }

    // ---------------------------------------------------------------- §10
    L.push("## §10 THE PERIOD IN QUESTION — and the stability gate");
    L.push("");
    var stb = stability(chart, input, askAge);
    if (!stb) {
      L.push("*VedicCore.buildChart was unavailable, so the stability table could not be built. Do not");
      L.push("read any period below as located until it is.*");
      L.push("");
    } else {
      var LBL = { vimMD: "Vimshottari MD", vimAD: "Vimshottari AD", kcd: "Kaal Chakra dasha",
                  chara: "Chara dasha", yogini: "Yogini dasha" };
      var AVG = { vimMD: "13.4 y", vimAD: "1.49 y", kcd: "9.8 y", chara: "6.5 y", yogini: "4.5 y" };
      table(L, ["system", "running at " + isoDay(asOf), "avg period", "±1 min", "±5 min", "±15 min", "verdict"],
        ["vimMD", "vimAD", "kcd", "chara", "yogini"].map(function (k) {
          var v = stb.ref[k], r = stb.res[k];
          var val = k === "vimMD" || k === "vimAD" ? PFULL[v] : (k === "kcd" || k === "chara" ? SIGN_FULL[SIGNS.indexOf(v)] : v);
          var ok5 = r[5], ok15 = r[15];
          return [LBL[k], val || "—", AVG[k],
                  r[1] ? "stable" : "**SHIFTS**", ok5 ? "stable" : "**SHIFTS**", ok15 ? "stable" : "**SHIFTS**",
                  ok5 ? (ok15 ? "usable" : "usable with the flag") : "**UNSTABLE — WITHDRAW**"];
        }));
      L.push("**How to use this table.** Any system that shifts within the plausible birth-time error");
      L.push("has its claim **withdrawn in writing**, not softened. Write *“UNSTABLE — withdrawn”*, never");
      L.push("*“tentatively suggests”*. Kaal Chakra drifts **2.92 months per minute** of birth-time");
      L.push("error, so it is the row that usually fails; Chara is the row that usually holds.");
      L.push("");
      if (stb.ref.kcdGati) {
        L.push("The running Kaal Chakra dasha is entered by a **" + stb.ref.kcdGati + "** transition" +
          (stb.res.kcd[5] ? "." : " — **but the dasha itself is unstable at ±5 min, so the gait claim is withdrawn too.**"));
        L.push("");
      }
      // sector board from each running dasha sign
      var board = [];
      [["Kaal Chakra", stb.ref.kcd], ["Chara", stb.ref.chara]].forEach(function (row) {
        var si = SIGNS.indexOf(row[1]);
        if (si < 0) return;
        [["marriage / union", 7, "Ve", "D-9"], ["career", 10, "Su", "D-10"],
         ["progeny", 5, "Ju", "D-7"], ["education", 4, "Ju", "D-24"],
         ["property", 4, "Ma", "D-4"], ["vehicles", 11, "Ve", "D-16"],
         ["death / crisis", 8, "Sa", "D-1"]].forEach(function (s) {
          var tgt = (si + s[1] - 1) % 12, det = s[2];
          board.push([row[0] + " " + row[1], s[0], "1–" + s[1], SIGN_FULL[tgt],
            PFULL[LORD[tgt]], PFULL[det],
            (sg[det] === tgt || sg[det] === si) ? "**determinant present**" :
              (JASP[sg[det]].indexOf(tgt) >= 0 ? "determinant aspects it" : "—"),
            s[3]]);
        });
      });
      if (board.length) {
        L.push("### Sector board — SMS's signature relationships, counted FROM each running dasha sign");
        L.push("");
        table(L, ["dasha sign", "sector", "relation", "target sign", "its lord", "natural determinant", "determinant test", "divisional to confirm"], board);
        L.push("Base rate of the permissive form of this relationship: **66.5%**; measured lift **1.08**,");
        L.push("p = 0.11 — the only rule in 52 that pointed the right way, and still not significant.");
        L.push("It is also the least KCD-specific idea in the book: it is BPHS's house-from-the-dasha-sign");
        L.push("rule, which Chara and Vimshottari express too.");
        L.push("");
      }
      // Laghu Parashari delivery read for the running MD/AD
      var md = stb.ref.vimMD, ad = stb.ref.vimAD;
      if (md && ad) {
        var lpMd = lp.filter(function (r) { return r.p === md; })[0];
        var lpAd = lp.filter(function (r) { return r.p === ad; })[0];
        L.push("### Laghu Parashari delivery read for the running " + PFULL[md] + " – " + PFULL[ad]);
        L.push("");
        table(L, ["element", "value"], [
          ["MD " + PFULL[md], (lpMd.classes.join("; ") || "no lordship") + (lpMd.yogakaraka ? " — **YOGAKARAKA**" : "") + (lpMd.dosha ? " — Kendradhipatya dosha" : "")],
          ["AD " + PFULL[ad], (lpAd.classes.join("; ") || "no lordship") + (lpAd.yogakaraka ? " — **YOGAKARAKA**" : "") + (lpAd.dosha ? " — Kendradhipatya dosha" : "")],
          ["sambandha between them", "**" + F.sambandha(sg, md, ad) + "**"],
          ["Sadharmi?", F.sadharmi(md, ad, lagna) ? "yes — same functional character" : "no"],
          ["Atmasambandhi?", F.atmasambandhi(sg, md, ad) || "no"],
          ["LP v.29 — is this the MD lord's own bhukti?", md === ad ? "**YES — the lord cannot deliver in its own bhukti**" : "no"],
          ["Vedhaka of the MD lord", (F.pbkvFor(sg, md) || []).filter(function (r) { return r.role === "vedhaka"; }).map(function (r) {
            return PFULL[r.planet] + (r.planet === ad ? " — **and it is the AD lord: obstruction**" : "");
          })[0] || "—"],
          ["Bodhaka of the MD lord", (F.pbkvFor(sg, md) || []).filter(function (r) { return r.role === "bodhaka"; }).map(function (r) {
            return PFULL[r.planet] + (r.planet === ad ? " — **and it is the AD lord: it announces and gives**" : "");
          })[0] || "—"]
        ]);
        L.push("Read this against the master result matrix in `02-RULES.md §1.5`. The two");
        L.push("counter-intuitive cells to watch: in an **inauspicious** lord's dasha an *unrelated");
        L.push("auspicious* bhukti is **inauspicious**, and an *unrelated yogakaraka* bhukti is");
        L.push("**extremely** so. And death does not come in the bhukti of a related benefic or of any");
        L.push("yogakaraka — it comes in the bhukti of an **unrelated inauspicious** planet.");
        L.push("");
      }
    }

    // ---------------------------------------------------------------- §11
    L.push("## §11 LEVEL DISCIPLINE — what may and may not be used");
    L.push("");
    table(L, ["level", "typical length", "identity stable at ±5 min", "use it?"], [
      ["Vimshottari Mahadasha", "13.4 y", "99.0%", "yes"],
      ["**Vimshottari Antardasha**", "**1.49 y**", "**96.2%**", "**yes — the finest reliable level in the whole set**"],
      ["Vimshottari Pratyantar and below", "months", "—", "only if the birth time is known to the minute; say so"],
      ["Chara dasha", "6.5 y", "**100.0%**", "yes — and the only level usable with no birth time at all"],
      ["Kaal Chakra dasha", "9.8 y", "86.7%", "yes, with the stability flag"],
      ["**Kaal Chakra bhukti**", "1.1 y", "—", "**NO — unlocatable; ±5 min drifts it 1.22 y**"],
      ["Yogini dasha", "4.5 y", "97.1%", "yes"],
      ["Yogini sub-period", "~6 mo", "—", "only with a minute-accurate birth time"]
    ]);
    L.push("**The measured frontier:** Vimshottari's antardasa is **6.6× finer in time resolution than a");
    L.push("Kaal Chakra dasha and more stable against birth-time error at the same time.** KCD is");
    L.push("strictly dominated on both axes. For roughly one-year resolution, use the Vimshottari AD.");
    L.push("");

    // ---------------------------------------------------------------- §12
    L.push("## §12 PROMISE GATES TIMING — check this before any timing claim");
    L.push("");
    L.push("All four schools converge on it, and each states it in its own words:");
    L.push("");
    L.push("- *Laghu Parashari* v.78, the Kashmir-pony rule — **a yoga that gets no dasha in the");
    L.push("  lifetime does not fire**: *“what can the benefic combinations produce, if their periods do");
    L.push("  not operate?”*");
    L.push("- Goel — *“the progress chart cannot provide beyond the promise of the birth chart.”*");
    L.push("- Shakti Mohan Singh — the foundation-chart ceiling: a rajayoga forming from the dasha sign");
    L.push("  is *“experienced in imagination or dreams only, or very transiently”* if the foundation");
    L.push("  chart holds no potential for it. Cf. BPHS 76/17.");
    L.push("- Rao — the navamsa filter on the Jaimini rajayogas (§2 above): what survives in D-9 is what");
    L.push("  is effective.");
    L.push("");
    L.push("**Transit triggers; it does not cause.** Potential (natal) → tendency (dasha) → opportunity");
    L.push("(transit). Report a transit as a trigger only, with its base rate from §13.");
    L.push("");

    // ---------------------------------------------------------------- §13
    L.push("## §13 THE HONESTY APPENDIX — base rates, and what may not be claimed");
    L.push("");
    L.push("52 pre-registered rule tests across all four systems, on 18 charts with confirmed event");
    L.push("dates, scored against length-weighted local nulls: **mean lift 0.960, median 0.991, 22 of");
    L.push("52 lifts above 1.0, smallest p anywhere 0.110, Bonferroni threshold 0.00096.** The harness");
    L.push("detects an injected 15% effect at ~2σ, and 400 random rules give median lift 0.987 with a");
    L.push("maximum of 1.690 — the best real rule reached 1.54, the 99th percentile of noise. **No");
    L.push("effect was detected at any level in any system.**");
    L.push("");
    L.push("**A rule's base rate is part of the rule, and none of the five source books computes one.**");
    L.push("Quote the base rate whenever one of these fires:");
    L.push("");
    table(L, ["rule, as its author states it", "fires by chance"], [
      ["Rao: Jupiter touches the Putrakaraka in the Saptamsa", "**99.2%**"],
      ["Goel: Jupiter within ±6 months", "**98.3%**"],
      ["Goel: Saturn within ±1 year", "**97.8%**"],
      ["Goel: Moon within ±3 days", "**96.6%**"],
      ["SMS / JDM 12/26: deha & jeeva lords touched by a malefic", "**95.8%**"],
      ["Laghu Parashari v.29: events avoid MD == AD", "86.7%"],
      ["**Goel: ALL FOUR planets — the complete funnel**", "**86.6%**"],
      ["SMS: excitation, dasha lord ↔ Hth lord, ±30 days", "84.6%"],
      ["Yogini: dasha or nakshatra lord is a maraka", "70.9%"],
      ["KCD: sector relationship 1–7 / 1–10 / 1–5 / 1–8", "66.5%"],
      ["Rao: Jupiter → PK within 280 days (Jaimini aspects)", "64.7%"],
      ["Vimshottari: MD/AD lord is a maraka (death events)", "61.0%"],
      ["Vimshottari: MD/AD lord signifies the house (loose form)", "59.7%"],
      ["Chara: karaka in or aspecting the dasha rashi or Hth", "48.8%"],
      ["*narrow rules, where the capacity to show an effect exists:*", ""],
      ["Vimshottari: AD lord **is lord of** the house (strict)", "11.9%"],
      ["Chara: the dasha rashi **IS** the Hth from the lagna", "10.5%"],
      ["KCD: dasha sign is the Hth house from the deha sign", "9.0%"],
      ["Goel: tight funnel, all four, narrow windows", "3.0%"]
    ]);
    L.push("**This explains the authors' success claims without supposing error or bad faith.** Rao");
    L.push("reports his child-birth method was *“tested by my students on more than five hundred");
    L.push("horoscopes”* and that *“none of them failed.”* The rule's base rate is 64.7–99.2%. A rule");
    L.push("true two-thirds to ninety-nine percent of the time **will** survive 500 charts with no");
    L.push("visible failure. *“It never fails”* and *“it has no predictive content”* are the same");
    L.push("observation seen from two sides.");
    L.push("");
    L.push("**The narrow rules outperform the permissive ones, consistently.** Strict AD-lordship (null");
    L.push("11.9%) gave 1.15 where the loose form (null 59.7%) gave 0.99. **Looseness is not a safety");
    L.push("margin — it is what destroys the information. A rule with a 95% base rate can be deleted");
    L.push("from an engine with no loss.**");
    L.push("");
    L.push("**Confidence vocabulary — use exactly these four words.** **COMPUTED** (from the validated");
    L.push("engine; state it flatly) · **CLASSICAL** (the rule says X; cite the source; carries no");
    L.push("validation) · **UNSTABLE** (the period shifts within the birth-time uncertainty; withdraw");
    L.push("the claim) · **VACUOUS** (base rate above ~85% or below ~5%; report that it fired, and that");
    L.push("this means little).");
    L.push("");
    L.push("**Never** claim a validated hit rate or percentage accuracy for any of these systems, and");
    L.push("**never** predict death, terminal illness or suicide as a dated event. Longevity and maraka");
    L.push("analysis may be discussed as the classical texts frame them — including that no maraka");
    L.push("period kills before the term of life is used up — but no date.");
    L.push("");

    // ---------------------------------------------------------------- §14
    L.push("## §14 LIMITS OF THIS REPORT");
    L.push("");
    L.push("1. **Ephemeris.** Positions come from VedNetra. Against the project's Python engine");
    L.push("   (`quad_dasha.py`, PyEphem) the two casters differ by **1.4–3.5 arcminutes on the Moon** on");
    L.push("   the two validation charts — equivalent to **2.6–6.3 minutes of birth time**, i.e. up to");
    L.push("   **~18 months of Kaal Chakra drift**. Treat §10's stability row as the governing fact, and");
    L.push("   where a boundary matters, cross-check the Python engine.");
    L.push("2. **Rahu is the mean node**, ±~2° against the true node. It matters only near a sign");
    L.push("   boundary — but there it changes the Chara Aquarius/Scorpio length and the maraka board.");
    L.push("3. **Dignity, Shadbala, combustion and blemish are not computed**, and neither are most");
    L.push("   divisional charts. SMS, Rao and Goel all condition their rules on these, so the frames");
    L.push("   above are the **skeletons** of their rules, not the rules.");
    L.push("4. **The KCD bhukti is printed but unusable** (§8). So are the sector templates, the Co/Ps");
    L.push("   markers and the whole excitation apparatus that live at that level.");
    L.push("5. **The transit layer is deliberately absent.** 34 transit rules were tested and the best");
    L.push("   was indistinguishable from the best of 400 random ones. If you want transits, compute");
    L.push("   them and report them as triggers with their base rates — never as evidence for a date.");
    L.push("6. **Whole-sign houses throughout.** No bhava cusps are used anywhere in this report.");
    L.push("7. **The benchmark population** was 18 twentieth-century political and royal figures with");
    L.push("   published birth times. It cannot support a sweeping negative, and it is not a general");
    L.push("   population. The honest scope of the null is: *these specific rules, in these forms, on");
    L.push("   that population, carry no detectable information about event timing.*");
    L.push("");
    L.push("---");
    L.push("");
    L.push("*॥ श्री गणेशाय नमः ॥ ॥ श्री सरस्वत्यै नमः ॥*");
    L.push("*The computation is offered with care; the claims are kept to what was measured.*");
    return L.join("\n");
  }

  // =====================================================================
  // SELF-TEST — the same eight assertions the Python engine carries, so the
  // two engines can be held to one standard. Moon/Ascendant longitudes are
  // the PYTHON engine's values for those charts, which makes this a test of
  // the dasha arithmetic, independent of either ephemeris.
  // =====================================================================
  function vnQuadDashaSelftest() {
    var ok = [];
    // 1-2. Kaal Chakra package and balance, Indira Gandhi's Moon
    var moonI = 275.5887, moonE = 109.3703;
    var p = E.kcdPackage(moonI);
    ok.push(["KCD pkg = Aquarius/83, deha Ta jeeva Ge",
             p.dp === "Aquarius" && p.span === 83 && p.deha === "Ta" && p.jeeva === "Ge"]);
    ok.push(["KCD balance is against the WHOLE span",
             Math.abs(rnum(p.balance) - 26.84) < 0.02]);
    // 3. BPHS Ch.64: the Aries-dasha antardasas of the Aries package
    var ar = E.kcdAntardashas({ seq: E.DP.Aries[0], span: 100 }, "Ar");
    ok.push(["KCD Aries-dasha antardasas = BPHS Ch.64",
             ar.length === 9 && ar[0].sign === "Ar" &&
             ar[1].sign === "Ta" && Math.abs(rnum(ar[1].len) - 1.12) < 0.01]);
    // 4. the antardasas of every dasha sum exactly to the dasha
    var sums = true;
    ["Aries", "Taurus", "Leo"].forEach(function (nm) {
      var seq = E.DP[nm][0], span = seq.reduce(function (a, s) { return a + E.KY[s]; }, 0);
      seq.forEach(function (s) {
        var t = E.kcdAntardashas({ seq: seq, span: span }, s)
                 .reduce(function (a, x) { return radd(a, x.len); }, R(0, 1));
        if (rcmp(t, R(E.KY[s], 1)) !== 0) sums = false;
      });
    });
    ok.push(["KCD antardasas sum exactly to the dasha", sums]);
    // 5. Chara against the sequence Rao PRINTS for Queen Elizabeth II
    var lonE = { Su: 7.3948, Mo: moonE, Ma: 298.0499, Me: 341.8480, Ju: 299.6901,
                 Ve: 321.1433, Sa: 211.6169, Ra: 87.6503, As: 270.8222 };
    lonE.Ke = (lonE.Ra + 180) % 360;
    var sgE = {}, degE = {};
    Object.keys(lonE).forEach(function (k) { sgE[k] = signOf(lonE[k]); degE[k] = degIn(lonE[k]); });
    var want = [["Cp", 2], ["Sg", 1], ["Sc", 2], ["Li", 4], ["Vi", 6], ["Le", 4],
                ["Cn", 12], ["Ge", 9], ["Ta", 9], ["Ar", 9], ["Pi", 2], ["Aq", 8]];
    var got = E.chara(sgE.As, sgE, degE).rows.slice(0, 12);
    ok.push(["Chara = Rao's printed Elizabeth II sequence (12/12)",
             got.length === 12 && want.every(function (w, i) {
               return SIGNS[got[i].sign] === w[0] && got[i].years === w[1];
             })]);
    // 6. the Chara counting direction is by groups of three
    ok.push(["Chara counting direction = groups of THREE",
             [0, 1, 2, 6, 7, 8].every(function (r) { return E.charaForward(r); }) &&
             [3, 4, 5, 9, 10, 11].every(function (r) { return !E.charaForward(r); })]);
    // 7. Vimshottari: Rao names Indira Gandhi's death as Saturn-Rahu
    var v = E.vimshottari(moonI), age = (1984 - 1917) + (10 - 11) / 12 + (31 - 19) / 365.25;
    var run = v.rows.filter(function (r) { return rnum(r.start) <= age && age < rnum(r.end); });
    ok.push(["Vimshottari: Indira died in Saturn-Rahu (Rao)",
             v.nak === "U.Ashadha" && run.length === 1 && run[0].md === "Sa" && run[0].ad === "Ra"]);
    // 8. Yogini: U.Ashadha -> Sankata (Goel's table)
    var y = E.yogini(moonI);
    ok.push(["Yogini: U.Ashadha -> Sankata (Goel)", y.nak === "U.Ashadha" && y.first === "Sankata"]);
    var passed = ok.filter(function (r) { return r[1]; }).length;
    return { pass: passed, total: ok.length, rows: ok };
  }

  globalThis.VNQuadDasha.markdown = vnQuadDashaMarkdown;
  globalThis.VNQuadDasha.selftest = vnQuadDashaSelftest;
  globalThis.VNQuadDasha.stability = stability;
  globalThis.VNQuadDasha.runningAt = runningAt;
  globalThis.VNQuadDasha.extract = extract;
  globalThis.VNQuadDasha.version = E.version;
}());
