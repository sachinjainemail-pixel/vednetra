#!/usr/bin/env node
/* SUJ engine, Z REPORT. Reads cases.json and experiments/null_distribution.json. Turns each hypothesis score into a z score against the null distribution of its own type, the score that type
 * gets on random charts, which removes the topic bias, for example siblings always scoring low. Prints the AUC of the z scores against the truth. The null distribution uses no true answers.
 * Post hoc caution. This idea came after the true answers of Kundali 4 were known, and the null distribution was computed after. The first fair test is the next blind chart with the null fixed beforehand. */
const fs = require("fs"), path = require("path");
const D = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "cases", "cases.json"), "utf8"));
const NULL = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "experiments", "null_distribution.json"), "utf8"));
const rows = [];
D.cases.forEach(c => (c.hypotheses || []).forEach(h => { const n = NULL.out[h.name]; if (!n) return; rows.push({ case: c.id, name: h.name, truth: h.truth, zA: (h.score - n.A.m) / n.A.sd, zB: h.scoreB != null ? (h.scoreB - n.B.m) / n.B.sd : null }); }));
const auc = (rs, k) => { const y = rs.filter(r => r.truth && r[k] != null), n = rs.filter(r => !r.truth && r[k] != null); let w = 0, c = 0; y.forEach(a => n.forEach(b => { c++; w += a[k] > b[k] ? 1 : (a[k] === b[k] ? 0.5 : 0); })); return c ? (w / c).toFixed(2) + " over " + c + " pairs" : "none"; };
console.log("Null distribution from " + NULL.N + " random charts. Hypotheses with a null " + rows.length + ", true " + rows.filter(r => r.truth).length + ", false " + rows.filter(r => !r.truth).length + ". The PG level hypothesis of Kundali 892 has no null and is left out.");
console.log("AUC of the raw scores   base " + auc(rows.map(r => Object.assign({}, r, { zA: null })), "zA") + " is not defined here");
const raw = []; D.cases.forEach(c => (c.hypotheses || []).forEach(h => { if (NULL.out[h.name]) raw.push({ truth: h.truth, a: h.score, b: h.scoreB }); }));
console.log("AUC of the raw scores   base " + auc(raw, "a") + ", updated " + auc(raw.filter(r => r.b != null), "b"));
console.log("AUC of the z scores     base " + auc(rows, "zA") + ", updated " + auc(rows, "zB"));
const k4 = rows.filter(r => r.case === "K4");
console.log("Kundali 4 alone, blind, z scores  base " + auc(k4, "zA") + ", updated " + auc(k4, "zB"));
console.log("\nz scores");
rows.forEach(r => console.log("  " + (r.case + " " + r.name).padEnd(26) + (r.truth ? "TRUE " : "false") + "  base " + r.zA.toFixed(2).padStart(6) + "  updated " + (r.zB == null ? "  none" : r.zB.toFixed(2).padStart(6))));
