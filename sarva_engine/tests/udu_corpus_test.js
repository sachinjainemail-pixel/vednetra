#!/usr/bin/env node
// Tests of the Udu corpus tools. Run from the repository root, node sarva_engine/tests/udu_corpus_test.js
const assert = require("assert");
const U = require("../tools/udu_rules.js");
const UE = require("../tools/udu_engine.js");
const PL = require("../tools/promise_layer.js");
let n = 0; const ok = (name, c, d) => { assert.ok(c, name + (d ? " " + String(d).slice(0, 300) : "")); n++; console.log("PASS " + name); };

ok("corpus installed", U.present());
const st = U.stats();
ok("16,008 rules in 21 life event files", st.total === 16008 && Object.keys(st.perEvent).length === 21, JSON.stringify(st.total));
ok("seven books", Object.keys(st.books).length === 7, JSON.stringify(st.books));
ok("rule ids are unique", new Set(U.load().all.map(r => r.id)).size === 16008);
ok("1,006 unique KN rules with a 610 rule machinery file", new Set(U.loadKN().map(k => k.id)).size === 1006 && U.loadKN().filter(k => k.protocol === "MACHINERY").length === 610);
[["Ashwini", "Ashvini"], ["Jyeshtha", "Jyeshta"], ["Purva Ashadha", "Purvashadha"], ["Moola", "Mula"], ["Shatabhisha", "Satabhisha"], ["Swati", "Svati"], ["Aridra", "Ardra"], ["Purva Phalguni", "Purvaphalguni"], ["Dhanishta", "Dhanishtha"]].forEach(([a, b]) => ok("nakshatra spelling " + a + " equals " + b, U.nakKey(a) === U.nakKey(b)));
const r = U.load().byId.get("AVA-2-0092");
ok("rule fields and the weight formula, pada 1.5 x stated 1.0 x benefic 1", r && r.nak === "Ashvini" && r.pada === 2 && r.planet === "Moon" && r.w === 1.5 && r.if.indexOf("aspected by Venus") > 0, JSON.stringify(r));
ok("a mixed rule weighs 0", U.load().all.filter(x => x.pol === "~").every(x => x.w === 0));
ok("a classical rule carries 1.2", U.load().all.find(x => x.conf === "classical" && x.pol === "+" && !x.pada && !x.planet).w === 1.2);
ok("query by nakshatra, planet and pada", U.query({ ev: "marriage", nak: "Ashvini", planet: "Moon", pada: 2 }).some(x => x.id === "AVA-2-0092"));

const cfgF = { gender: "female", date: "1980-12-08", time: "04:38:00", tz: 5.5, lat: 23.588, lon: 72.3693, asOf: "2026-11-17" };
const CF = PL.cast(cfgF), FF = UE.facts(CF);
const byId = id => U.load().byId.get(id);
ok("the Moon nakshatra rule of the chart fires, Jyeshtha pada 3", UE.fires(byId("AVA-2-8503"), FF).st === "fire");
ok("a sex specific rule for a male does not fire for a woman", UE.fires(byId("RBS-1-1555"), FF).st === "no");
const FM = UE.facts(PL.cast(Object.assign({}, cfgF, { gender: "male" })));
ok("the same rule fires for a man", UE.fires(byId("RBS-1-1555"), FM).st === "fire");
ok("a sign qualifier is tested, Venus in the Libra portion of Vishakha fires and the Scorpio portion does not", UE.fires(byId("ASH-1299"), FF).st === "fire" && UE.fires(byId("ASH-1300"), FF).st === "no");
ok("a rule with an untestable condition is left out and counted", U.load().all.some(x => UE.fires(x, FF).st === "unresolved"));

const q = { id: "Q1", text: "present profession", options: ["A Private job", "B Government job", "C Own business"] };
const res = PL.fire(Object.assign({ questions: [q, { id: "Q2", text: "parents", options: ["A केवल माताजी जीवित हैं।", "B केवल पिताजी जीवित हैं।", "C माता-पिता दोनों जीवित हैं।"] }] }, cfgF));
ok("Udu fires on the corpus and cites a Udu rule id for every question", /EVIDENCE Q1 UDU corpus rules [A-Z]/.test(res.text) && /EVIDENCE Q2 UDU corpus rules [A-Z]/.test(res.text));
ok("no provisional wording in a corpus Udu cell", !/EVIDENCE Q\d UDU PROVISIONAL/.test(res.text));
ok("the arithmetic is printed rule by rule", /direct sum -?\d+\.\d\d, link sum -?\d+\.\d\d, counted/.test(res.text));
ok("nearly fired rules are named in count", /nearly fired and left out \d+/.test(res.text));
ok("parents with no decisive rule of loss read both alive by Law 3", /RESULT Q2 UDU C/.test(res.text) && /LAW 3 NO PROMISE OF LOSS/.test(res.text), res.text.match(/EVIDENCE Q2 UDU[^\n]*/)[0]);
ok("no timing claim is cited from a UDU rule", !/Law 3 period test[^\n]*\b(ASH|AVA-2|RBS-\d|TRI|TAM-RA|NAT)-\d{4}/.test(res.text));
const auth = PL.fire(Object.assign({ questions: [q] }, cfgF), { authoredUdu: true });
ok("the authored layer is still available when asked for", /UDU PROVISIONAL/.test(auth.text) && /SARVA-UDU-P/.test(auth.text));
console.log("UDU CORPUS TESTS PASSED " + n);
