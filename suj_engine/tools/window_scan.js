#!/usr/bin/env node
/*
 * SUJ engine, WINDOW SCAN. Finds the dasha windows, past and future, in which the significators of an event are
 * running AND the transits of Jupiter and Saturn (the double transit), with Rahu, Ketu and Sun noted, fall on the
 * houses of that event. It exists because a natal promise alone cannot say whether an event has already happened.
 * Pillars b and c of the owner's methodology (dasha timing validated by transits of Sat, Jup, Rah, Ket, Sun).
 *
 * It finds candidate periods. It does not decide an answer. The answer must still weigh the windows with the rest
 * of the analysis. Every chart quantity comes from Vednetra through vednetra_loader.js.
 *
 * Usage:
 *   node suj_engine/tools/window_scan.js '{"gender":"female","date":"1993-01-06","time":"07:10:00","tz":5.5,
 *        "lat":27.1333,"lon":81.9667,"event":"father_loss","asOf":"2026-11-13"}'
 * Optional fields: from, to (YYYY-MM-DD, default birth and asOf plus 3 years), houses and karakas to override the
 * preset, minDasha (default 2, levels MD AD PD whose lord is a significator), stepDays (default 1, the Sookshma level needs
 * a day by day look),
 * strict true to require AD and PD both to be significators and the transits to fall on the FIRST house of the
 * preset only (the primary house of the event). Strict mode is the narrow view. The default is the wide view.
 * Add --json for structured output.
 *
 * ROUND 14, the owner's method, sections 2.1 and 3. Two extensions.
 *   Subject varga. The occupants of the key houses of the event's divisional chart, D9 for marriage, D7 for children, D10 for work, D24 for
 *   education, D3 for siblings, D12 for parents, and the lords of their signs there, are added to the dasha significators. Reasons are listed.
 *   varga false switches it off.
 *   Sudarshan transits. The transits of Jupiter and Saturn are tested on the event houses counted from the Lagna, from the Moon and from the Sun, the
 *   three charts. The double transit must hold in the SAME reference chart. Windows say which reference passed. refs, a list such as ["Lagna"],
 *   restricts it. gate single asks for only Jupiter or Saturn in a reference, a wider view.
 *
 * Rahu and Ketu as significators, round 12, by the direct rules of Laghu Parashari sloka 13. The nodes own no sign, LP-060-2, so a node
 * is a significator of the event only when
 *   it occupies an event house, the node then becomes the lord of that house, LP-062-1, or
 *   it is conjoined with a significator planet other than the Sun or the Moon, and follows that planet, LP-056-6, LP-057-1, LP-058-3, or
 *   the lord of the sign it occupies is a significator, because the node doubles the result of that lord, LP-057-2.
 * Conjunction only, never aspect, LP-057-4. Each node that enters is listed with its reason. nodes false switches this off.
 *
 * Levels. The scan goes down to SOOKSHMA, the fourth level, round 11. Prana, the fifth, is left out by the owner's choice. The
 * grade and the window are still fixed by Mahadasha, Antardasha and Pratyantardasha. Inside each window the tool lists the
 * Sookshma periods in which the Sookshma lord is also a significator, because those are the sharpest days of the window.
 *
 * Grades. A means three dasha levels are significators and Jupiter and Saturn both fall on the event houses.
 * B means at least two dasha levels, one of them AD or PD, and Jupiter and Saturn both fall on the event houses.
 * Windows are also tagged when Rahu, Ketu or Sun fall on the event houses.
 */
const fs = require("fs");
const path = require("path");
const { loadVedicCore } = require("./vednetra_loader");

const KB = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "significations.json"), "utf8"));
const EVENTS = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "events.json"), "utf8"));
const SIGN_NAMES = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const ASPECTS = { Jupiter: [1, 5, 7, 9], Saturn: [1, 3, 7, 10], Rahu: [1, 5, 7, 9], Ketu: [1, 5, 7, 9], Sun: [1, 7] };
const houseFrom = (sign, ref) => ((sign - ref + 12) % 12) + 1;
const signLord = s => { for (const p of Object.keys(KB.ownSigns)) if (KB.ownSigns[p].indexOf(s) >= 0) return p; return null; };
const iso = d => new Date(d).toISOString().slice(0, 10);

function scan(cfg) {
  const VC = loadVedicCore(cfg.appDir);
  const t = String(cfg.time).length === 5 ? cfg.time + ":00" : cfg.time;
  const built = VC.avEngineFor({ name: cfg.name || "Native", gender: cfg.gender || "unspecified",
    birthISO: cfg.date + "T" + t, tz: Number(cfg.tz), lat: Number(cfg.lat), lon: Number(cfg.lon), place: cfg.place || "" });
  const chart = built.chart, P = chart.planetsByName, lagna = chart.ascendant.sign;
  const preset = cfg.event ? EVENTS[cfg.event] : null;
  if (cfg.event && !preset) throw new Error("Unknown event " + cfg.event + ". Known: " + Object.keys(EVENTS).filter(k => k[0] !== "_").join(", "));
  const houses = cfg.houses || (preset && preset.houses) || [];
  const female = String(cfg.gender || "").toLowerCase().startsWith("f");
  const karakas = cfg.karakas || (preset && (preset.karakas || (female ? preset.karakasFemale : preset.karakasMale))) || [];
  const allSigns = houses.map(h => (lagna + h - 1) % 12);
  const targetSigns = cfg.strict ? allSigns.slice(0, 1) : allSigns;
  // dasha significators: lords of the event houses, occupants of those houses, and the karakas
  const sig = new Set(karakas);
  allSigns.forEach(s => { sig.add(signLord(s)); });
  chart.planets.forEach(p => { if (allSigns.indexOf(p.sign) >= 0) sig.add(p.name); });
  // subject varga, round 14
  const vargaReasons = [];
  if (cfg.varga !== false && preset && preset.varga) {
    const vc = VC.makeVargaChart(chart, preset.varga);
    (preset.vargaHouses || []).forEach(vh => {
      const ksign = (vc.ascendant.sign + vh - 1) % 12, vl = signLord(ksign);
      if (vl && !sig.has(vl)) { sig.add(vl); vargaReasons.push(vl + " lords the D" + preset.varga + " house " + vh); }
      vc.planets.filter(q => q.sign === ksign).forEach(q => { if (!sig.has(q.name)) { sig.add(q.name); vargaReasons.push(q.name + " occupies the D" + preset.varga + " house " + vh); } });
    });
  }
  // Rahu and Ketu by Laghu Parashari sloka 13
  const nodeReasons = {};
  if (cfg.nodes !== false) {
    ["Rahu", "Ketu"].forEach(n => {
      const why = [];
      if (allSigns.indexOf(P[n].sign) >= 0) why.push("occupies an event house, so it becomes the lord of that house, LP-062-1");
      const comp = chart.planets.filter(q => q.name !== n && q.name !== "Rahu" && q.name !== "Ketu" && q.sign === P[n].sign && sig.has(q.name) && q.name !== "Sun" && q.name !== "Moon").map(q => q.name);
      if (comp.length) why.push("conjoined with " + comp.join(" and ") + ", follows the companion, LP-056-6");
      const lord = signLord(P[n].sign);
      if (lord && sig.has(lord)) why.push("sits in the sign of " + lord + ", a significator, and doubles its result, LP-057-2");
      if (why.length) { nodeReasons[n] = why; sig.add(n); }
    });
  }
  const sigList = Array.from(sig);

  const birth = new Date(chart.vimshottari.timeline[0].start); // dasha spans from before birth, scan from birth date
  const birthDate = new Date(cfg.date + "T00:00:00Z");
  const asOf = cfg.asOf ? new Date(cfg.asOf) : new Date();
  const from = cfg.from ? new Date(cfg.from) : birthDate;
  const to = cfg.to ? new Date(cfg.to) : new Date(asOf.getTime() + 3 * 365.25 * 86400000);
  const minDasha = cfg.minDasha || 2, step = (cfg.stepDays || 1) * 86400000;
  const tl = chart.vimshottari.timeline;

  // reference charts for the transits, Sudarshan
  let refs = [{ name: "Lagna", sign: lagna }, { name: "Moon", sign: P.Moon.sign }, { name: "Sun", sign: P.Sun.sign }];
  if (cfg.refs) refs = refs.filter(r => cfg.refs.indexOf(r.name) >= 0);
  const seenSign = {}; refs = refs.filter(r => { if (seenSign[r.sign] !== undefined) { refs.find(q => q.sign === r.sign).name += " and " + r.name; return false; } seenSign[r.sign] = true; return true; });

  const samples = [];
  for (let ms = from.getTime(); ms <= to.getTime(); ms += step) {
    const d = new Date(ms);
    const stack = VC.findDashaStack(tl, d);
    if (stack.length < 4) continue;
    const lords = stack.slice(0, 3).map(x => x.lord);
    const sd = stack[3].lord;
    const hit = lords.map(l => sig.has(l));
    const dashaCount = hit.filter(Boolean).length;
    if (dashaCount < minDasha || !(hit[1] || hit[2])) continue;
    if (cfg.strict && !(hit[1] && hit[2])) continue;
    const tc = VC.buildChart(d, Number(cfg.lat), Number(cfg.lon), Number(cfg.tz));
    const tp = {}; tc.planets.forEach(p => { tp[p.name] = p; });
    let found = null;
    for (const ref of refs) {
      const tsigns = cfg.strict ? [(ref.sign + houses[0] - 1) % 12] : houses.map(h => (ref.sign + h - 1) % 12);
      const on = {};
      for (const pl of Object.keys(ASPECTS)) {
        const hits = tsigns.filter(ts => ASPECTS[pl].indexOf(houseFrom(ts, tp[pl].sign)) >= 0);
        if (hits.length) on[pl] = hits.map(ts => houseFrom(ts, ref.sign));
      }
      const pass = cfg.gate === "single" ? (on.Jupiter || on.Saturn) : (on.Jupiter && on.Saturn);
      if (pass) { if (!found) found = { names: [ref.name], on }; else found.names.push(ref.name); }
    }
    if (!found) continue;
    const on = found.on;
    const extra = ["Rahu", "Ketu", "Sun"].filter(x => on[x]);
    samples.push({ ms, lords, sd, sdHit: sig.has(sd), dashaCount, hit, extra, jup: on.Jupiter || [], sat: on.Saturn || [], via: found.names.join(" and "),
      tj: SIGN_NAMES[tp.Jupiter.sign], ts: SIGN_NAMES[tp.Saturn.sign] });
  }
  // merge consecutive samples with the same chain and the same transit picture
  const windows = [];
  for (const s of samples) {
    const key = s.lords.join(">") + "|" + s.tj + "|" + s.ts + "|" + s.via;
    const last = windows[windows.length - 1];
    let w = last;
    if (last && last.key === key && s.ms - last.endMs <= 3 * step) { last.endMs = s.ms; last.extra = Array.from(new Set(last.extra.concat(s.extra))); }
    else { w = { key, startMs: s.ms, endMs: s.ms, lords: s.lords, dashaCount: s.dashaCount, extra: s.extra.slice(), jup: s.jup, sat: s.sat, via: s.via, tj: s.tj, ts: s.ts, sdRuns: [] }; windows.push(w); }
    if (s.sdHit) {
      const lr = w.sdRuns[w.sdRuns.length - 1];
      if (lr && lr.lord === s.sd && s.ms - lr.endMs <= 3 * step) lr.endMs = s.ms; else w.sdRuns.push({ lord: s.sd, startMs: s.ms, endMs: s.ms });
    }
  }
  windows.forEach(w => {
    w.grade = w.dashaCount === 3 ? "A" : "B";
    w.start = iso(w.startMs); w.end = iso(w.endMs);
    w.sookshma = w.sdRuns.map(x => ({ lord: x.lord, start: iso(x.startMs), end: iso(x.endMs) }));
    w.ageStart = Math.round((w.startMs - birthDate.getTime()) / 31557600000 * 10) / 10;
    w.timeStatus = w.endMs < asOf.getTime() ? "PAST" : (w.startMs <= asOf.getTime() ? "RUNNING" : "FUTURE");
  });
  return {
    event: cfg.event || "custom", strict: !!cfg.strict, houses, targetSigns: targetSigns.map(s => SIGN_NAMES[s]), significators: sigList, karakas,
    vargaReasons, nodeReasons, lagna: SIGN_NAMES[lagna], asOf: iso(asOf), from: iso(from), to: iso(to), windows
  };
}

function render(r) {
  const L = [];
  L.push("# SUJ WINDOW SCAN, event " + r.event + (r.strict ? ", strict view" : ", wide view"));
  L.push("Lagna " + r.lagna + ". Event houses " + r.houses.join(", ") + " = signs " + r.targetSigns.join(", ") + ". Dasha significators " + r.significators.join(", ") + ".");
  (r.vargaReasons || []).length && L.push("From the subject varga " + r.vargaReasons.join("; ") + ".");
  Object.keys(r.nodeReasons || {}).forEach(n => L.push(n + " is a significator, " + r.nodeReasons[n].join("; ") + "."));
  L.push("Levels Mahadasha, Antardasha, Pratyantardasha and Sookshma. Prana is not scanned.");
  L.push("Scan " + r.from + " to " + r.to + ", as of " + r.asOf + ". Windows found " + r.windows.length + ". Grades A or B only, see the header of the tool.");
  for (const status of ["PAST", "RUNNING", "FUTURE"]) {
    const w = r.windows.filter(x => x.timeStatus === status);
    L.push("", "## " + status + " windows " + w.length);
    w.forEach(x => L.push("- " + x.grade + " " + x.start + " to " + x.end + ", age " + x.ageStart + ", MD AD PD " + x.lords.join(" ") +
      ", via " + x.via + ", Jupiter in " + x.tj + " on houses " + x.jup.join(",") + ", Saturn in " + x.ts + " on houses " + x.sat.join(",") +
      (x.extra.length ? ", also " + x.extra.join(" ") : "") +
      (x.sookshma.length ? ". Sookshma significators " + x.sookshma.map(q => q.lord + " " + q.start + " to " + q.end).join(", ") : ". No Sookshma significator inside")));
  }
  return L.join("\n");
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  const arg = argv.find(a => a.trim().startsWith("{"));
  if (!arg) { console.error("Usage: window_scan.js '{json}' [--json]"); process.exit(2); }
  const res = scan(JSON.parse(arg));
  console.log(argv.indexOf("--json") >= 0 ? JSON.stringify(res, null, 1) : render(res));
}
module.exports = { scan, render };
