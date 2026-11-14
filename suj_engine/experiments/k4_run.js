#!/usr/bin/env node
/* EXPERIMENT. Kundali 4, the first blind test. Implements suj_engine/experiments/preregistration_K4.md exactly. Nothing is tuned after seeing the output. */
const fs = require("fs"), path = require("path"), cp = require("child_process");
const L = require("./lib_hypotheses");
const { rank } = require("../tools/event_rank");
const C = { gender: "male", date: "2006-02-14", time: "05:27:00", tz: 5.5, lat: 31.326, lon: 75.576, asOf: "2026-11-14" };
const ALLC = { A: {}, B: { degree: true, nakshatra: true } };
const COND = process.env.COND ? { [process.env.COND]: ALLC[process.env.COND] } : ALLC;
const LINE = { A: 39.5, B: 55.5 };
const ctx = L.context(C);
const EV = ["marriage", "relationship", "child_birth", "job_start", "health_crisis", "property", "foreign_travel"];
// ---- Q1
const d15 = []; for (let m = 0; m < 12; m++) { const y = m < 11 ? 2024 : 2025, mm = m < 11 ? m + 2 : 1; d15.push(y + "-" + String(mm).padStart(2, "0") + "-15"); }
const Q1 = [["1 Married in the 19th year", "marriage", d15], ["2 Engaged in February 2026", "marriage", ["2026-02-01", "2026-02-08", "2026-02-15", "2026-02-22"]], ["3 Live in since June 2024", "relationship", ["2024-06-01", "2024-06-15", "2024-06-29"]]];
const out = {};
for (const [cn, extra] of Object.entries(COND)) {
  console.log("\n######## CONDITION " + cn);
  const sup = Q1.map(([name, ev, dates]) => {
    let first = 0; const tops = [];
    dates.forEach(d => { const r = rank(Object.assign({}, C, extra, { on: d, events: EV, fast: true })); if (r.rows[0].event === ev) first++; tops.push(r.rows[0].event + " " + r.rows[0].score); });
    return { name, support: first / dates.length, tops };
  });
  sup.forEach(s => console.log("  Q1 " + s.name.padEnd(30) + "support " + s.support.toFixed(2) + "  top event per date: " + Array.from(new Set(s.tops.map(t => t.split(" ")[0]))).join(", ")));
  const mx = Math.max.apply(null, sup.map(s => s.support)), pick1 = mx < 0.25 ? "4 None of the above" : sup.find(s => s.support === mx).name;
  console.log("  Q1 answer under the rule: " + pick1);
  // ---- Q2
  const H = { "Education exists": [{ option: "Yes", houses: [4, 5, 9], karakas: ["Mercury", "Jupiter"], varga: 24 }], "CA": [{ option: "Yes", houses: [2, 5, 11], karakas: ["Mercury", "Saturn", "Jupiter"], varga: 24 }],
    "B Tech": [{ option: "Yes", houses: [4, 5, 6], karakas: ["Mars", "Saturn", "Rahu"], varga: 24 }], "BBA": [{ option: "Yes", houses: [5, 7, 10], karakas: ["Mercury", "Venus", "Sun"], varga: 24 }] };
  const sc = {}; Object.entries(H).forEach(([n, hs]) => { sc[n] = L.run(Object.assign({}, C, extra), ctx, hs, ["No", "Yes"], false).rows[1].score; });
  console.log("  Q2 scores " + Object.entries(sc).map(([n, v]) => n + " " + v).join(", ") + ", line " + LINE[cn]);
  let pick2; if (sc["Education exists"] < LINE[cn]) pick2 = "2 Already dropped studies"; else { const f = ["CA", "B Tech", "BBA"].sort((a, b) => sc[b] - sc[a])[0]; pick2 = "Pursuing " + f; }
  console.log("  Q2 answer under the rule: " + pick2);
  // ---- Q3
  const hs3 = [{ option: "Yes", houses: [3, 11], karakas: ["Mars"], varga: 3 }];
  const s3 = L.run(Object.assign({}, C, extra), ctx, hs3, ["No", "Yes"], false).rows[1].score;
  out[cn] = { sup, pick1, sc, pick2, s3 };
  console.log("  Q3 has siblings score " + s3 + ", line " + LINE[cn]);
}
// Ashtakavarga from the Trinetra report
cp.execFileSync("node", [path.join(__dirname, "..", "..", "tools", "run-nobrowser.js"), JSON.stringify({ name: "K4", gender: "male", date: C.date, time: C.time, tz: C.tz, lat: C.lat, lon: C.lon, place: "Jalandhar", question: "x", report: "trinetra", enquiryISO: "2026-11-14T12:00:00+05:30" })], { cwd: path.join(__dirname, "..", ".."), stdio: "pipe" });
const rep = fs.readFileSync(path.join(__dirname, "..", "..", "report_out.md"), "utf8"); fs.unlinkSync(path.join(__dirname, "..", "..", "report_out.md"));
const m = rep.match(/Ashtakavarga \(SAV per house from Lagna\):\*\* ([^\n]+)/);
const sav = {}; (m ? m[1] : "").split("·").forEach(x => { const mm = /H(\d+):(\d+)/.exec(x); if (mm) sav[mm[1]] = Number(mm[2]); });
const mean = (sav[3] + sav[11]) / 2;
console.log("\nSAV " + JSON.stringify(sav) + ". Mean of the 3rd and 11th " + mean);
const pick3 = n => (n.s3 < LINE.A ? "" : "");
Object.keys(out).forEach(cn => { const sc = out[cn].s3 < LINE[cn] ? "2 Only child" : (mean >= 31 ? "3 2 brothers 2 sisters" : mean >= 26 ? "1 2 brothers 1 sister" : "4 1 brother 1 sister"); console.log("  Q3 answer under the rule, condition " + cn + ": " + sc); });
fs.writeFileSync(path.join(__dirname, "k4_output_data_" + (process.env.COND || "AB") + ".json"), JSON.stringify({ out, sav, mean }, null, 1));
