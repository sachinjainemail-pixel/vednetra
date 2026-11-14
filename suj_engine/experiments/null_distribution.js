#!/usr/bin/env node
/* EXPERIMENT, round 21. A label free calibration. Each hypothesis type is scored on N random charts, random dates between 1975 and 2008, random times, random places in India, so we learn what score
 * a typical chart gives that type, whatever the truth. A native's score can then be read as a z score against its own type, which removes the topic bias, siblings for example always score low.
 * No true answers are used. Seeded, repeatable. Usage  N=24 NODE_OPTIONS=--max-old-space-size=6000 node null_distribution.js */
const L = require("./lib_hypotheses");
const N = Number(process.env.N || 24);
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = mulberry(20261121);
const TYPES = {
  "Education exists": [[{ option: "Yes", houses: [4, 5, 9], karakas: ["Mercury", "Jupiter"], varga: 24 }]], "CA": [[{ option: "Yes", houses: [2, 5, 11], karakas: ["Mercury", "Saturn", "Jupiter"], varga: 24 }]],
  "B Tech": [[{ option: "Yes", houses: [4, 5, 6], karakas: ["Mars", "Saturn", "Rahu"], varga: 24 }]], "BBA": [[{ option: "Yes", houses: [5, 7, 10], karakas: ["Mercury", "Venus", "Sun"], varga: 24 }]],
  "Married": [[{ option: "Yes", houses: [7], karakas: ["Venus", "Jupiter"], varga: 9 }]], "Happy marriage": [[{ option: "Yes", houses: [7, 2], karakas: ["Venus", "Jupiter"], varga: 9 }]],
  "Working": [[{ option: "Yes", houses: [10], karakas: ["Saturn"], varga: 10 }]], "Doctor": [[{ option: "Yes", houses: [6, 10], karakas: ["Sun", "Mars"], varga: 10 }]],
  "Lawyer": [[{ option: "Yes", houses: [9, 10], karakas: ["Jupiter", "Saturn", "Mercury"], varga: 10 }]], "Astrologer": [[{ option: "Yes", houses: [8, 9, 10], karakas: ["Jupiter", "Mercury", "Ketu"], varga: 10 }]],
  "Has siblings": [[{ option: "Yes", houses: [3, 11], karakas: ["Mars"], varga: 3 }]], "Father alive": [[{ option: "Yes", houses: [9, 4], from: 9, karakas: ["Sun"], varga: 12 }]],
  "Mother alive": [[{ option: "Yes", houses: [4, 11], from: 4, karakas: ["Moon"], varga: 12 }]], "Has a child": [[{ option: "Yes", houses: [5], karakas: ["Jupiter"], varga: 7 }]]
};
// the ephemeris cache in app.js never empties and a long run hits the limit of a Map, so every random chart runs in its own process
const charts = [];
for (let i = 0; i < N; i++) {
  const y = 1975 + Math.floor(rnd() * 34), m = 1 + Math.floor(rnd() * 12), d = 1 + Math.floor(rnd() * 28), hh = Math.floor(rnd() * 24), mm = Math.floor(rnd() * 60);
  charts.push({ gender: rnd() < 0.5 ? "female" : "male", date: y + "-" + String(m).padStart(2, "0") + "-" + String(d).padStart(2, "0"), time: String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0") + ":00", tz: 5.5, lat: 8 + rnd() * 24, lon: 69 + rnd() * 19, asOf: "2026-11-14" });
}
if (process.env.ONE !== undefined) {
  const C = charts[Number(process.env.ONE)], ctx = L.context(C), r = {};
  for (const [name, hs] of Object.entries(TYPES)) {
    r[name] = { A: L.run(Object.assign({}, C), ctx, hs[0], ["No", "Yes"], false).rows[1].score, B: L.run(Object.assign({}, C, { degree: true, nakshatra: true }), ctx, hs[0], ["No", "Yes"], false).rows[1].score };
  }
  console.log("RESULT " + JSON.stringify(r)); process.exit(0);
}
const cp = require("child_process");
const res = {}; Object.keys(TYPES).forEach(k => { res[k] = { A: [], B: [] }; });
let next = 0, running = 0, done = 0;
function launch() {
  while (running < 4 && next < N) {
    const i = next++; running++;
    const c = cp.spawn("node", ["--max-old-space-size=3000", __filename], { env: Object.assign({}, process.env, { ONE: String(i) }) });
    let buf = ""; c.stdout.on("data", d => { buf += d; });
    c.on("close", () => { running--; done++; const m = buf.match(/RESULT (.*)/); if (m) { const r = JSON.parse(m[1]); Object.entries(r).forEach(([k, v]) => { res[k].A.push(v.A); res[k].B.push(v.B); }); } if (done === N) finish(); else launch(); });
  }
}
function finish() {
const ms = a => { const m = a.reduce((x, y) => x + y, 0) / a.length; const sd = Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1)); return { m, sd }; };
const out = {}; console.log("Null distribution over " + N + " random charts, mean and standard deviation of the score");
Object.entries(res).forEach(([k, v]) => { const a = ms(v.A), b = ms(v.B); out[k] = { A: a, B: b }; console.log(k.padEnd(18) + "base mean " + a.m.toFixed(1) + " sd " + a.sd.toFixed(1) + "    updated mean " + b.m.toFixed(1) + " sd " + b.sd.toFixed(1)); });
require("fs").writeFileSync(__dirname + "/null_distribution.json", JSON.stringify({ N, out }, null, 1));
}
launch();
