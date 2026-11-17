#!/usr/bin/env node
// Tests of sarva_lexicon.js. Run from the repository root, node sarva_engine/tests/lexicon_test.js
const { spawnSync } = require("child_process");
const path = require("path");
const TOOL = path.join(__dirname, "..", "tools", "sarva_lexicon.js");
let fails = 0;
const run = args => { const r = spawnSync(process.execPath, [TOOL].concat(args), { encoding: "utf8" }); return { code: r.status, out: r.stdout + r.stderr }; };
const ok = (name, cond, detail) => { if (cond) console.log("PASS " + name); else { fails++; console.log("FAIL " + name + (detail ? " " + detail.slice(0, 300) : "")); } };

let r = run(["--check"]); ok("check passes", r.code === 0 && /LEXICON CHECK PASSED/.test(r.out), r.out);
r = run(["--stats"]); ok("stats show six categories", /"medical"/.test(r.out) && /"relationship"/.test(r.out) && /"income"/.test(r.out) && /"disease"/.test(r.out) && /"business"/.test(r.out) && /"profession"/.test(r.out), r.out);
r = run(["Gynecologist", "--no-bnn", "--no-cards"]); ok("english term maps", /ENTRY med\.gynecology/.test(r.out), r.out);
r = run(["डेंटिस्ट", "--no-bnn", "--no-cards"]); ok("hindi term maps", /ENTRY med\.dentistry/.test(r.out), r.out);
r = run(["पीडियाट्रिशीयन", "--no-bnn", "--no-cards"]); ok("hindi pediatrician maps", /ENTRY med\.pediatrics/.test(r.out), r.out);
r = run(["--options", "A Private job|B Government job|C Own business", "--no-bnn", "--no-cards"]); ok("job options map in order", /ENTRY prf\.pvt_job[\s\S]*ENTRY prf\.govt_job[\s\S]*ENTRY prf\.own_business/.test(r.out), r.out);
r = run(["Govt job", "--no-bnn", "--no-cards"]); ok("govt abbreviation maps to government job", /ENTRY prf\.govt_job/.test(r.out) && !/PARTIAL/.test(r.out), r.out);
r = run(["qwertyuiop zxcvb", "--no-bnn", "--no-cards"]); ok("nonsense gets NO ENTRY", /NO ENTRY/.test(r.out) && !/ENTRY [a-z]+\./.test(r.out.replace(/NO ENTRY/g, "")), r.out);
r = run(["Zebra trainer", "--no-bnn", "--no-cards"]); ok("unknown word gives a partial match warning", /PARTIAL MATCH/.test(r.out), r.out);
r = run(["Dentist", "--column", "KCIL", "--no-bnn", "--no-cards"]); ok("KCIL column does not see KP corpus text", !/\[KP\]/.test(r.out) && /\[KCIL\]/.test(r.out), r.out);
r = run(["Dentist", "--column", "KPPRO", "--no-bnn", "--no-cards"]); ok("KP column does not see KCIL corpus text", !/\[KCIL\]/.test(r.out) && /\[KP\]/.test(r.out), r.out);
r = run(["Dentist", "--no-bnn", "--no-cards"]); ok("web sentences are hints only", /HINT ONLY \[WEB\]/.test(r.out) && !/CITE\s+\[WEB\]/.test(r.out), r.out);
r = run(["Dentist", "--column", "SUJ", "--no-bnn", "--no-cards"]); ok("karaka map is labelled T4", /MAP T4\s+VEDIC/.test(r.out), r.out);
r = run(["पति का कार्यक्षेत्र", "--family", "--no-bnn", "--no-cards"]); ok("spouse profession gives the relatives recipe with rotation", /RECIPE relatives_and_family/.test(r.out) && /spouse's 10th is cusp 4/.test(r.out), r.out);
r = run(["--card", "EDU.02"]); ok("KP card prints", /Higher education/.test(r.out) && /Sun or Mars/.test(r.out), r.out);
r = run(["Diabetes", "--column", "BNN", "--no-cards"]); ok("BNN column looks up candidate rules", /CANDIDATES|NONE/.test(r.out), r.out);
const L = require("fs"); const src = JSON.parse(L.readFileSync(path.join(__dirname, "..", "knowledge", "lexicon", "sources.json"), "utf8"));
ok("no web source claims a page was read", src.sources.filter(s => s.tier === "T3").every(s => s.page_read === false));
ok("no made up urls", src.sources.every(s => !s.url || !/example/.test(s.url)));
console.log(fails ? "LEXICON TESTS FAILED " + fails : "LEXICON TESTS PASSED");
process.exit(fails ? 1 : 0);
