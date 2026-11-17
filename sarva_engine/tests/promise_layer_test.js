#!/usr/bin/env node
// Tests of promise_layer.js. Run from the repository root, node sarva_engine/tests/promise_layer_test.js
const assert = require("assert");
const { fire, parseOption } = require("../tools/promise_layer.js");
let n = 0; const ok = (name, c, d) => { assert.ok(c, name + (d ? " " + String(d).slice(0, 300) : "")); n++; console.log("PASS " + name); };

const cfg = { name: "T", gender: "female", date: "1980-12-08", time: "04:38:00", tz: 5.5, lat: 23.588, lon: 72.3693, asOf: "2026-11-17", questions: [
  { id: "Q1", text: "Education", options: ["A Gynecologist", "B Pediatrician", "C Dentist", "D Skin specialist"] },
  { id: "Q2", text: "present profession", options: ["A Private job", "B Government job", "C Own business"] },
  { id: "Q3", text: "siblings including the native", options: ["A एक बहन + एक भाई", "B दो बहन + एक भाई", "C एक बहन + दो भाई"] },
  { id: "Q4", text: "Children", options: ["A एक पुत्र", "B दो पुत्र", "C दो पुत्रियाँ"] },
  { id: "Q6", text: "present status of parents", options: ["A केवल माताजी जीवित हैं।", "B केवल पिताजी जीवित हैं।", "C माता-पिता दोनों जीवित हैं।"] },
  { id: "Q7", text: "unknown", options: ["A Zebra trainer qwerty", "B Xylophone fixer zzz"] }
] };
const r1 = fire(cfg), r2 = fire(cfg);
ok("deterministic", r1.text === r2.text);
ok("both columns fire for every question", cfg.questions.every(q => new RegExp("METHOD UDU " + q.id).test(r1.text) && new RegExp("METHOD QUAD " + q.id).test(r1.text)));
cfg.questions.forEach(q => {
  const labels = q.options.map(o => parseOption(o).label);
  ["UDU", "QUAD"].forEach(c => { const m = r1.text.match(new RegExp("RESULT " + q.id + " " + c + " (\\S+)")); ok(q.id + " " + c + " returns one of the options", m && labels.indexOf(m[1]) >= 0, m && m[1]); });
});
ok("every EVIDENCE line carries PROVISIONAL", (r1.text.match(/EVIDENCE Q\d+ (UDU|QUAD) PROVISIONAL/g) || []).length === cfg.questions.length * 2);
ok("Udu evidence names SARVA-UDU-P and no Udu rule id", /EVIDENCE Q1 UDU .*SARVA-UDU-P/.test(r1.text) && !/\b(ASH|RBS|AVA|TRI|TAM|NAT)-(\d-)?\d{4}\b/.test(r1.text));
ok("Quad evidence names SARVA-QUAD-P and a confidence word", /EVIDENCE Q1 QUAD .*SARVA-QUAD-P.*COMPUTED/.test(r1.text));
ok("options without an entry say so and still return an answer", /NO ENTRY/.test(r1.text) && /RESULT Q7 UDU [AB]/.test(r1.text));
ok("a Quad layer shared by all options is voided", /VACUOUS L/.test(r1.text));
ok("Quad prints the stability gate", /Stability at plus and minus 5 and 15 minutes/.test(r1.text));
const p1 = parseOption("B दो बहन + एक भाई"); ok("hindi siblings parse", p1.type === "siblings" && p1.f === 2 && p1.m === 1 && p1.label === "B", JSON.stringify(p1));
const p2 = parseOption("C दो पुत्रियाँ"); ok("hindi daughters parse", p2.type === "children" && p2.f === 2 && p2.m === 0, JSON.stringify(p2));
const p3 = parseOption("A One son"); ok("english son parse", p3.type === "children" && p3.m === 1, JSON.stringify(p3));
const p4 = parseOption("A केवल माताजी जीवित हैं।"); ok("mother only parse", p4.type === "parents" && p4.mother === true && p4.father === false, JSON.stringify(p4));
const p5 = parseOption("C माता-पिता दोनों जीवित हैं।"); ok("both parents parse", p5.type === "parents" && p5.mother && p5.father, JSON.stringify(p5));
const p6 = parseOption("B Orthopedic surgeon"); ok("an ordinary option is an entry", p6.type === "entry", JSON.stringify(p6));
const rules = fire({ gender: "male", date: "1990-01-01", time: "10:00:00", tz: 5.5, lat: 28.6, lon: 77.2, asOf: "2026-11-17", questions: [{ id: "Q1", text: "t", options: ["A Government job", "B Own business"] }] }, { rules: true });
ok("the rule table can be printed", /RULE TABLE/.test(rules.text) && /SARVA-QUAD-P-L10/.test(rules.text) && /SARVA-UDU-P-U6/.test(rules.text));
console.log("PROMISE LAYER TESTS PASSED " + n);
