"use strict";
/* SARVA adapters. One function per engine. Each takes the chart, the questions with their classification and a work folder, runs the engine on the options
 * EXACTLY as the owner wrote them, and returns { [questionNumber]: cell } where a cell is
 *   { pick, second, flags, tied, why }  or  { notRun: "short reason" }.
 * Rules learned on Kundali 893, LEARNINGS G13 to G16 and SARVA.md.
 *   1. Options are passed verbatim. An engine that returns a label it was not given is an error, not a pick.
 *   2. An engine that cannot read an option, or ties, says so in the flags. The first option of a tie is never presented as a pick.
 *   3. A dated question is run under every gate the engine has.
 *   4. Nothing is written into a repository. Every input and output goes to the work folder.
 */
const fs = require("fs"), path = require("path"), cp = require("child_process");
const T = require("./topics");

const run = (cmd, args, opt) => cp.spawnSync(cmd, args, Object.assign({ encoding: "utf8", maxBuffer: 1 << 28 }, opt || {}));
const exists = p => { try { return fs.existsSync(p); } catch (e) { return false; } };
const same = (a, b) => String(a).replace(/\s+/g, " ").trim() === String(b).replace(/\s+/g, " ").trim();
const find = (opts, label) => opts.findIndex(o => same(o, label));
const age = (chart, asOf) => (new Date(asOf + "T00:00:00Z") - new Date(chart.date + "T00:00:00Z")) / (365.2425 * 86400000);
const sexL = chart => (/^f/i.test(chart.gender) ? "F" : "M");
const timeHM = t => String(t).slice(0, 5);

// ---------------------------------------------------------------------------------------------------------------- Shri Jha Ji
function sjj(ctx) {
  const { chart, qs, repo, work, asOf } = ctx, out = {};
  const bf = path.join(work, "sjj_birth.json"), qf = path.join(work, "sjj_questions.json");
  fs.writeFileSync(bf, JSON.stringify({ name: chart.name, gender: chart.gender, date: chart.date, time: timeHM(chart.time), place: chart.place, lat: chart.lat, lon: chart.lon, tz: chart.tz }));
  fs.writeFileSync(qf, JSON.stringify(qs.map(q => ({ text: q.text, options: q.options }))));
  const r = run("node", [path.join(repo, "bin", "jyotish.js"), "answer", "--file", bf, "--questions", qf, "--now", asOf, "--json"], { cwd: repo });
  fs.writeFileSync(path.join(work, "sjj_out.json"), r.stdout || "");
  let d; try { d = JSON.parse(r.stdout); } catch (e) { qs.forEach(q => { out[q.no] = { notRun: "no output" }; }); return out; }
  qs.forEach((q, i) => {
    const res = d.results[i], mk = (d.marks || []).find(m => m.no === res.no) || (d.marks || [])[i];
    if (!res || !res.answered || !res.picked) { out[q.no] = { notRun: "not answered" }; return; }
    const flags = [];
    const notes = (res.notes || []).join(" ");
    if (/STOP/.test(notes)) flags.push("stop");
    if (res.tied && res.tied.length > 1) flags.push("tie");
    if (/no basis/i.test(res.confidence || "")) flags.push("no basis");
    const first = (mk && mk.marks ? mk.marks.filter(x => x.mark === 100) : []).map(x => q.options[x.n - 1]);
    const second = (mk && mk.marks ? mk.marks.filter(x => x.mark === 50) : []).map(x => q.options[x.n - 1]);
    const pickLabel = q.options[res.picked.n - 1];
    if (!pickLabel || !same(pickLabel, res.picked.label)) { out[q.no] = { notRun: "option text altered" }; return; }
    if (first.length > 1 && !flags.includes("tie")) flags.push("tie");
    out[q.no] = { pick: first.length ? first[0] : pickLabel, second: second[0] || null, flags, tied: first.length > 1 ? first : [], why: res.route };
  });
  return out;
}

// ---------------------------------------------------------------------------------------------------------------- Poddar
const POD_EVENT = [
  [/accident|vehicle|car |crash|एक्सीडेंट|दुर्घटना|गाड़ी|jail|prison|arrest|जेल|surgery|operation|disease|illness|बीमारी|ऑपरेशन/i, "health"],
  [/marri|wedding|विवाह|शादी/i, "marriage"],
  [/child|born|birth|daughter|संतान|पुत्र|पुत्री|बेटा|बेटी/i, "children"],
  [/job|work|promotion|नौकरी|काम/i, "career"],
  [/abroad|foreign|visa|विदेश/i, "travel"],
  [/property|house|land|मकान|जमीन|संपत्ति/i, "property"]
];
function pod(ctx) {
  const { chart, qs, repo, work, asOf } = ctx, out = {}, eng = path.join(repo, "engine");
  if (!exists(path.join(eng, "poddar.db"))) run("bash", [path.join(eng, "setup.sh")], { cwd: eng });
  qs.forEach(q => {
    if (q.kind.key === "dated") { out[q.no] = podDated(ctx, q, eng); return; }
    const topic = T.FAMILY.poddar[q.kind.key];
    if (!topic) { out[q.no] = { notRun: "no frame for this question" }; return; }
    if (q.options.some(o => /\|/.test(o))) { out[q.no] = { notRun: "option holds a bar" }; return; }
    const r = run("python3", [path.join(eng, "scripts", "mcq_predict.py"), "--topic", topic, "--sex", sexL(chart), "--age", age(chart, asOf).toFixed(2), "--options", q.options.join("|")], { cwd: eng });
    fs.writeFileSync(path.join(work, "pod_q" + q.no + ".txt"), r.stdout || r.stderr || "");
    const lines = (r.stdout || "").split("\n"), rows = [];
    lines.forEach(l => { const m = l.match(/^\s+(\d+)\s+([\d.]+)%\s+(.*?)(\s+<== final)?\s*$/); if (m) rows.push({ i: +m[1], p: +m[2], label: m[3], final: !!m[4] }); });
    if (!rows.length) { out[q.no] = { notRun: "no output" }; return; }
    const bad = rows.find(x => find(q.options, x.label) < 0 && !same(q.options[x.i] || "", x.label.trim()));
    // the engine prints the label cut at 60 characters, an index is the safe key
    const flags = [];
    const tie = lines.find(l => /^\s+TIE between options/.test(l)), unm = lines.find(l => /UNMAPPED options/.test(l));
    let tied = [];
    if (tie) { flags.push("tie"); tied = (tie.match(/options ([\d, ]+)\./) || [, ""])[1].split(",").map(s => q.options[+s.trim()]).filter(Boolean); }
    if (unm) flags.push("unmapped");
    const fin = rows.find(x => x.final);
    const sorted = rows.slice().sort((a, b) => b.p - a.p);
    out[q.no] = { pick: q.options[fin.i], second: !tie && sorted[1] ? q.options[sorted[1].i] : null, flags, tied, why: "prior from the practice charts" };
  });
  return out;
}
function podDated(ctx, q, eng) {
  const { chart, work } = ctx, date = q.kind.date;
  const rows = q.options.map(o => {
    const hit = POD_EVENT.find(([rx]) => rx.test(o));
    if (!hit) return { o, ev: null, score: null };
    const next = new Date(new Date(date + "T00:00:00Z").getTime() + 86400000 * 2).toISOString().slice(0, 10);
    const r = run("python3", [path.join(eng, "scripts", "poddar_windows.py"), "--birth", chart.date + "T" + timeHM(chart.time), "--lat", String(chart.lat), "--lon", String(chart.lon), "--tz", String(chart.tz), "--event", hit[1], "--from", date, "--to", next, "--min", "0"], { cwd: eng });
    let best = 0; (r.stdout || "").split("\n").forEach(l => { if (l[0] === "{" && /"from"/.test(l)) { try { const w = JSON.parse(l); if (w.from <= date && date <= w.to) best = Math.max(best, w.score); } catch (e) { /* skip */ } } });
    return { o, ev: hit[1], score: best };
  });
  fs.writeFileSync(path.join(work, "pod_q" + q.no + "_dated.json"), JSON.stringify(rows));
  const ok = rows.filter(x => x.score !== null);
  if (!ok.length) return { notRun: "no event frame" };
  const top = Math.max.apply(null, ok.map(x => x.score)), lead = ok.filter(x => x.score === top);
  const flags = ["shortlist"]; if (lead.length > 1) flags.push("tie");
  return { pick: lead[0].o, flags, tied: lead.length > 1 ? lead.map(x => x.o) : [], why: "window scores of different events are on different scales" };
}

// ---------------------------------------------------------------------------------------------------------------- KP Pro
function kpBin(ctx) {
  const cand = [process.env.KPREDICT, "/tmp/kpv/bin/kpredict"].filter(Boolean);
  for (const c of cand) if (exists(c)) return c;
  const w = run("which", ["kpredict"]); if (w.status === 0 && w.stdout.trim()) return w.stdout.trim();
  const venv = path.join(ctx.work, "kpv");
  if (!exists(path.join(venv, "bin", "kpredict"))) { run("python3", ["-m", "venv", venv]); run(path.join(venv, "bin", "pip"), ["install", "-q", "-e", ctx.repo]); }
  return exists(path.join(venv, "bin", "kpredict")) ? path.join(venv, "bin", "kpredict") : null;
}
function kpp(ctx) {
  const { chart, qs, work, asOf } = ctx, out = {}, bin = kpBin(ctx);
  if (!bin) { qs.forEach(q => { out[q.no] = { notRun: "install failed" }; }); return out; }
  const base = ["--sex", sexL(chart), "--date", chart.date, "--time", timeHM(chart.time), "--lat", String(chart.lat), "--lon", String(chart.lon), "--tz", String(chart.tz), "--today", asOf];
  qs.forEach(q => {
    let args;
    if (q.kind.key === "dated") args = ["dated"].concat(base, ["--event-date", q.kind.date, "--options", q.options.join(" | ")]);
    else if (T.FAMILY.kp[q.kind.key]) args = ["ask"].concat(base, ["--family", T.FAMILY.kp[q.kind.key], "--options", q.options.join(" | ")]);
    else { out[q.no] = { notRun: "no frame for this question" }; return; }
    const r = run(bin, args);
    fs.writeFileSync(path.join(work, "kpp_q" + q.no + ".txt"), r.stdout || r.stderr || "");
    const lines = (r.stdout || "").split("\n"), flags = [], tied = [];
    let sel = null;
    if (q.kind.key === "dated") {
      const rows = [];
      lines.forEach(l => { const m = l.match(/^\s+(.+?)\s+strict ([\d.]+) cover ([\d.]+) total ([\d.]+)\s+events (.*?)(\s+<== SELECTED)?\s*$/); if (m) rows.push({ label: m[1].trim(), total: +m[4], sel: !!m[6] }); });
      if (!rows.length) { out[q.no] = { notRun: "no output" }; return; }
      const top = Math.max.apply(null, rows.map(x => x.total)), lead = rows.filter(x => x.total === top);
      if (lead.length > 1) { flags.push("tie"); lead.forEach(x => tied.push(q.options.find(o => same(o, x.label)))); }
      if (lines.some(l => /^UNMAPPED options/.test(l))) flags.push("unmapped");
      sel = q.options.find(o => same(o, (rows.find(x => x.sel) || lead[0]).label));
    } else {
      let inOpts = false;
      lines.forEach(l => { if (/^options:/.test(l)) { inOpts = true; return; } if (inOpts) { const m = l.match(/^  (.+?)\s{2,}([\d.]+)%(\s+<== SELECTED)?\s*$/); if (m && m[3]) sel = q.options.find(o => same(o, m[1])); } });
      if (lines.some(l => /^INCOMPLETE/.test(l)) || lines.some(l => /could not map/.test(l))) flags.push("incomplete");
      if (lines.some(l => /^SAME MEANING/.test(l))) flags.push("same meaning");
    }
    if (!sel) { out[q.no] = { notRun: "no pick returned" }; return; }
    out[q.no] = { pick: sel, flags, tied, why: q.kind.key === "dated" ? "window coverage under both rules" : "prior of the quiz charts, chart weight 0" };
  });
  return out;
}

// ---------------------------------------------------------------------------------------------------------------- analyst dossiers
// SUJ, Chawdhri and the Vednetra KP skill give evidence and not a pick. SARVA runs them, writes the dossier and waits for the reader's pick in picks.json.
function dossiers(ctx) {
  const { chart, qs, work, asOf, root } = ctx, made = { SUJ: [], CHW: [], VKP: [] };
  const sujRepo = path.join(root, "vednetra"), base = { name: chart.name, gender: chart.gender, date: chart.date, time: String(chart.time).length === 5 ? chart.time + ":00" : chart.time, tz: chart.tz, lat: chart.lat, lon: chart.lon, asOf };
  const NR = JSON.parse(fs.readFileSync(path.join(sujRepo, "suj_engine", "data", "no_rule_topics.json"), "utf8")).topics;
  qs.forEach(q => {
    const topic = { education: "education", marriage: "marriage", children: "children", work: "work", residence: "residence", siblings: "siblings", parents: "parents", dated: "children" }[q.kind.key];
    if (!topic) return;
    const cfg = Object.assign({}, base, { topic, question: q.text, options: q.options });
    if (q.kind.key === "dated") cfg.on = q.kind.date;
    const r = run("node", ["--max-old-space-size=6000", path.join(sujRepo, "suj_engine", "tools", "prepare.js"), JSON.stringify(cfg)], { cwd: sujRepo });
    const f = path.join(work, "SUJ_q" + q.no + ".txt"); fs.writeFileSync(f, r.stdout || r.stderr || ""); made.SUJ.push(f);
  });
  // Chawdhri, once at the reading date and once at every dated question, all topics of the questions in one report
  const chwRepo = path.join(root, "CHAWDHRI");
  if (exists(chwRepo)) {
    const topics = Array.from(new Set(qs.map(q => ({ education: "education", marriage: "marriage", work: "career", children: "children", residence: "foreign", dated: "marriage,children,career,foreign" }[q.kind.key])).filter(Boolean).join(",").split(",")));
    const dates = [asOf].concat(qs.filter(q => q.kind.key === "dated").map(q => q.kind.date));
    dates.forEach(dt => {
      const r = run("sh", [path.join(chwRepo, "jyotish.sh"), "--date", chart.date, "--time", timeHM(chart.time), "--lat", String(chart.lat), "--lon", String(chart.lon), "--tz", String(chart.tz), "--gender", chart.gender, "--now", dt, "--back", "40", "--topics", topics.join(","), "--question", "sarva", "--json"], { cwd: chwRepo, env: Object.assign({}, process.env, { NODE_OPTIONS: "--max-old-space-size=6000" }) });
      const f = path.join(work, "CHW_" + dt + ".json"); fs.writeFileSync(f, r.stdout || "");
      try {
        const d = JSON.parse(r.stdout), L = ["Chawdhri gate summary at " + dt, "Reading rules, an adverse lean is not the outcome, a closed gate is not a denial, past firing windows mean the event could have happened already."];
        Object.entries(d.topic_analysis || {}).forEach(([t, v]) => { const g = v.dasha_gate || {}, rn = g.running || {}; L.push(t + " gate " + (rn.status || "n/a") + ", tie " + rn.tie + " against cut off " + g.open_cutoff + ", past windows " + ((g.past_windows || {}).count || 0) + ", certainty " + ((v.certainty || {}).direction || "n/a") + " " + ((v.certainty || {}).confidence_level || "")); });
        fs.writeFileSync(f.replace(/\.json$/, ".txt"), L.join("\n") + "\n"); made.CHW.push(f.replace(/\.json$/, ".txt"));
      } catch (e) { /* the raw file stays */ }
    });
  }
  // the Vednetra KP skill report
  const sk = skillDir("vednetra-kp");
  if (sk) {
    const f = path.join(work, "VKP_report.md");
    run("node", [path.join(sk, "scripts", "run_vednetra.js"), JSON.stringify({ name: chart.name, gender: chart.gender, date: chart.date, time: base.time, tz: chart.tz, lat: chart.lat, lon: chart.lon, place: chart.place, section: "viewA-kpreport", outFile: f })], { cwd: work });
    if (exists(f)) made.VKP.push(f);
  }
  return made;
}
function skillDir(name) {
  const roots = ["/root/.claude/skills", "/root/.claude/skills/synced"];
  for (const r of roots) {
    if (!exists(r)) continue;
    if (exists(path.join(r, name, "scripts", "run_vednetra.js"))) return path.join(r, name);
    try { for (const d of fs.readdirSync(r)) { const p = path.join(r, d, name); if (exists(path.join(p, "scripts", "run_vednetra.js"))) return p; } } catch (e) { /* skip */ }
  }
  return null;
}

/** Does an engine already hold the true answers of this chart in its own data? Then its pick is not a test, and the scoreboard must not count it. Round 26, after chart 893 was added to the
 * Poddar practice charts and the KP Pro backtest and the very next run of the same chart came out of a prior that contained its own answers. chart.number is the number of the chart in the groups. */
function seen(colId, chart, root) {
  const n = chart.number; if (!n) return false;
  if (colId === "POD") return ["charts", path.join("trinetra", "charts")].some(d => exists(path.join(root, "poddar-engine", "engine", "practice", d, n + ".json")));
  if (colId === "KPP") { try { return new RegExp("_mk\\(" + n + ",").test(fs.readFileSync(path.join(root, "KP-Pro-sutton", "src", "kpredict", "backtest", "dataset.py"), "utf8")); } catch (e) { return false; } }
  if (colId === "SUJ") { try { return JSON.parse(fs.readFileSync(path.join(root, "vednetra", "suj_engine", "cases", "cases.json"), "utf8")).cases.some(c => c.id === "K" + n && (c.questions || []).some(q => !q.pending)); } catch (e) { return false; } }
  return false;
}

module.exports = { sjj, pod, kpp, dossiers, skillDir, seen, same, find };
