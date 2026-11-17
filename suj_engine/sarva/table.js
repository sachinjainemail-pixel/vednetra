"use strict";
/* SARVA table builder and guard. The reply of a SARVA analysis is the output of render() and nothing else. check() returns the list of errors, and a table
 * with any error is never printed. The checks are the lessons of Kundali 893.
 *   G1 verbatim   every pick is exactly one of the options the owner wrote, and the options are in the owner's post.
 *   G2 no chain   a pick may not lean on another question. A dependency is declared in dependsOn and then shows as dep in the cell.
 *   G3 flags      a tie, an unreadable option, a no rule question, an evidence read pick all show in the cell. The table is never surer than the engines.
 *   G4 dated      a dated question needs a pick that records both transit gates.
 *   G5 complete   every column of the registry has a cell for every question, a missing one says not run with a reason.
 *   G6 style      the table holds none of the characters the owner does not want.
 *   G7 SUJ draft  a SUJ pick that names a draft has passed answer_guard.js on that draft with the owner's options.
 */
const fs = require("fs"), path = require("path"), cp = require("child_process");
const T = require("./topics");
const REG = JSON.parse(fs.readFileSync(path.join(__dirname, "registry.json"), "utf8"));
const same = (a, b) => String(a).replace(/\s+/g, " ").trim() === String(b).replace(/\s+/g, " ").trim();
const CROSS = /\b(?:question|Q)\s*\d\b|प्रश्न\s*\d/i;
const NOT_RUN = { notRun: "no reading" };

/** The cell of one engine for one question, from the automatic result and the reader's picks. Never invents a pick. */
function cellFor(col, q, auto, picks, noRule) {
  const a = (auto[col.id] || {})[q.no], p = ((picks[col.id] || picks[col.label] || {})[q.no]) || null;
  let cell;
  if (col.mode === "report") cell = { notRun: "report only" };
  else if (p && p.pick) {
    cell = { pick: p.pick, second: p.second || null, flags: (p.flags || []).slice(), tied: [], note: p.note || "", dependsOn: p.dependsOn || [], gates: p.gates || null, draft: p.draft || null, fromReader: true };
    if (col.mode === "auto" && a && a.flags) a.flags.filter(f => f !== "tie" && f !== "stop").forEach(f => { if (!cell.flags.includes(f)) cell.flags.push(f); });
    if (col.mode === "auto" && !cell.flags.includes("read")) cell.flags.push("read");
  } else if (a && a.pick) cell = { pick: a.pick, second: a.second || null, flags: (a.flags || []).slice(), tied: a.tied || [] };
  else cell = { notRun: (a && a.notRun) || (p && p.reason) || NOT_RUN.notRun };
  if (cell.pick && noRule && col.id !== "SJJ" && !cell.flags.includes("no rule")) cell.flags.push("no rule");
  if (cell.pick && cell.dependsOn && cell.dependsOn.length && !cell.flags.includes("dep")) cell.flags.push("dep");
  return cell;
}

function check(chart, qs, cells, opts) {
  const errors = [], flagsOk = new Set(REG.flags);
  if (chart.post) {
    const post = T.norm(chart.post);
    qs.forEach(q => q.options.forEach(o => { if (!post.includes(T.norm(o))) errors.push("G1 option not in the owner's post, it was reworded or translated, question " + q.no + ", " + o); }));
  }
  qs.forEach(q => {
    if (q.options.length < 2) errors.push("question " + q.no + " has fewer than two options");
    REG.columns.forEach(col => {
      const c = (cells[col.id] || {})[q.no];
      if (!c) { errors.push("G5 no cell for " + col.label + " question " + q.no); return; }
      if (c.notRun) return;
      if (!q.options.some(o => same(o, c.pick))) errors.push("G1 " + col.label + " question " + q.no + " pick is not one of the owner's options, " + c.pick);
      if (c.second && !q.options.some(o => same(o, c.second))) errors.push("G1 " + col.label + " question " + q.no + " second place is not one of the options");
      (c.flags || []).forEach(f => { if (!flagsOk.has(f)) errors.push("G3 unknown flag " + f + " in " + col.label + " question " + q.no); });
      if (c.fromReader && CROSS.test(c.note || "") && !(c.dependsOn && c.dependsOn.length)) errors.push("G2 chained inference, the note of " + col.label + " question " + q.no + " refers to another question and declares no dependsOn");
      if (c.dependsOn && c.dependsOn.some(n => n === q.no)) errors.push("G2 " + col.label + " question " + q.no + " depends on itself");
      if (q.kind.key === "dated" && c.fromReader && !(c.gates && c.gates.double === true && c.gates.single === true)) errors.push("G4 " + col.label + " dated question " + q.no + " needs gates {double:true, single:true}, the pick must record both transit gates");
      if (col.id === "SUJ" && c.draft) {
        const r = cp.spawnSync("node", [path.join(opts.sujRepo, "suj_engine", "tools", "answer_guard.js"), c.draft, "--options", q.options.join("|")], { encoding: "utf8" });
        if (!/GUARD PASSED/.test(r.stdout || "")) errors.push("G7 the SUJ draft of question " + q.no + " does not pass answer_guard.js, " + ((r.stdout || "").split("\n").find(l => /ERROR/.test(l)) || "").slice(0, 120));
      }
    });
  });
  return errors;
}

const LEGEND = {
  tie: "tie means the engine had no basis to split these options, the first is shown and is not a pick",
  read: "read means the reader chose from the evidence because the engine gives no pick",
  "no basis": "no basis means the engine says its evidence is inside chance",
  incomplete: "incomplete means an option could not be read and the pick is among the readable ones",
  "same meaning": "same meaning means the engine cannot tell some options apart",
  unmapped: "unmapped means the engine could not classify an option",
  stop: "stop means an option had no known word",
  shortlist: "shortlist means window scores of different events are on different scales",
  "no rule": "no rule means no validated rule exists for this kind of question",
  dep: "dep means the pick depends on another answer",
  seen: "seen means the engine already holds the true answers of this chart in its own data, so the pick is not a test"
};

function cellText(c) {
  if (c.notRun) return "not run " + T.display(c.notRun);
  let s = T.display(c.pick);
  if (c.second) s += ", second " + T.display(c.second);
  const fl = (c.flags || []).filter(f => f !== "not run");
  return s + (fl.length ? " " + fl.join(" ") : "");
}

/** The table, in code fences, three engines to a block. Pure text, no markdown table, the separator of one needs the hyphen. */
function render(chart, qs, cells) {
  const w = REG.blockWidth || 3, blocks = [], used = new Set(), idle = [];
  // a column in which every cell says not run for the same reason is one line and not a block of dead rows
  const cols = REG.columns.filter(c => {
    const all = qs.map(q => cells[c.id][q.no]);
    if (all.length && all.every(x => x.notRun && x.notRun === all[0].notRun)) { idle.push(c.label + " not run, " + T.display(all[0].notRun)); return false; }
    return true;
  });
  for (let i = 0; i < cols.length; i += w) {
    const part = cols.slice(i, i + w);
    const rows = qs.map(q => [q.no + " " + (q.kind.key === "dated" ? T.display(fmtDate(q.kind.date)) : q.kind.label)].concat(part.map(c => { const cell = cells[c.id][q.no]; (cell.flags || []).forEach(f => used.add(f)); return cellText(cell); })));
    const head = [T.display(chart.name || chart.id || "Chart")].concat(part.map(c => c.label));
    const width = head.map((h, k) => Math.max(h.length, ...rows.map(r => r[k].length)) + 2);
    const line = r => r.map((x, k) => x.padEnd(width[k])).join("").trimEnd();
    blocks.push("```\n" + [line(head), "=".repeat(width.reduce((a, b) => a + b, 0) - 2)].concat(rows.map(line)).join("\n") + "\n```");
  }
  const legend = Array.from(used).filter(f => LEGEND[f]).map(f => LEGEND[f]);
  const tail = legend.concat(idle.map(x => x));
  return blocks.join("\n\n") + (tail.length ? "\n\n" + tail.join(". ") + "." : "");
}
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = d => { const [y, m, dd] = d.split("-").map(Number); return dd + " " + MON[m - 1] + " " + y; };

/** The style check of the final text. */
function styleErrors(text) {
  const body = text.replace(/```/g, "");
  const bad = body.match(T.STYLE);
  return bad ? ["G6 the table holds characters the owner does not want, " + Array.from(new Set(bad)).join(" ")] : [];
}

/** Scores every column against the true answers. A first pick that equals the truth is a hit, a tie that contained the truth is a tie hit, never a hit. */
function scoreCells(chart, cells, truths) {
  const per = {};
  REG.columns.forEach(c => {
    const r = { asked: 0, hit: 0, tieHit: 0, notRun: 0, secondHit: 0, seen: 0 };
    chart.questions.forEach(q => {
      const cell = cells[c.id][q.no], tr = truths[q.no]; if (tr === undefined) return;
      if (cell.notRun) { r.notRun++; return; }
      if ((cell.flags || []).includes("seen")) { r.seen++; return; }
      r.asked++;
      const tied = (cell.flags || []).includes("tie");
      if (!tied && same(cell.pick, tr)) r.hit++;
      else if (tied && (cell.tied || []).some(o => same(o, tr))) r.tieHit++;
      else if (cell.second && same(cell.second, tr)) r.secondHit++;
    });
    per[c.id] = r;
  });
  return per;
}

module.exports = { cellFor, check, render, styleErrors, scoreCells, REG, same, cellText, LEGEND };
