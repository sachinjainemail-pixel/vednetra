#!/usr/bin/env node
/*
 * SARVA engine preflight. Run it first in every SARVA session.
 *
 *   node sarva_engine/tools/sarva_preflight.js
 *
 * It checks the tools and the rule sources of all seven methodologies and prints which columns can run, which are run with a
 * standing gap, and what to fix. Exit code 0 when all seven can run or only the known standing gaps remain, 1 when a tool that a
 * column needs is missing.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..", "..");
const KNOW = path.join(ROOT, "sarva_engine", "knowledge");
const HOME_PARENT = path.join(ROOT, "..");
const has = p => fs.existsSync(p);
const run = (cmd, args) => { try { return spawnSync(cmd, args, { encoding: "utf8", timeout: 20000 }); } catch (e) { return { status: 1 }; } };

function skillsDir() {
  const base = path.join(os.homedir(), ".claude", "skills", "synced");
  if (!has(base)) return null;
  const d = fs.readdirSync(base).map(n => path.join(base, n)).filter(p => fs.statSync(p).isDirectory());
  return d.find(p => has(path.join(p, "vednetra-bnn"))) || d[0] || null;
}
const SK = skillsDir();
const sibling = n => [path.join(HOME_PARENT, n), path.join(HOME_PARENT, n.toLowerCase())].find(has) || null;
const kpRepo = sibling("KP-Pro-sutton"), chRepo = sibling("CHAWDHRI");

function kpredictCmd() {
  const venvs = ["/tmp/kpvenv/bin/kpredict", "/tmp/claude-0/kpvenv/bin/kpredict", path.join(os.homedir(), "kpvenv", "bin", "kpredict")];
  const v = venvs.find(has);
  if (v) return v;
  return run("kpredict", ["-h"]).status === 0 ? "kpredict" : null;
}

const checks = [];
const add = (col, name, ok, fix) => checks.push({ col, name, ok: !!ok, fix });

const node = run("node", ["--version"]), py = run("python3", ["--version"]);
add("ALL", "node 18 or later", node.status === 0 && parseInt((node.stdout || "v0").slice(1)) >= 18, "install Node 18 or later");
add("ALL", "python3", py.status === 0, "install Python 3");

add("KPPRO", "sibling repo KP-Pro-sutton attached", kpRepo, "attach the KP-Pro-sutton repository to the session");
add("KPPRO", "kpredict installed", kpredictCmd(), "cd KP-Pro-sutton, python3 -m venv /tmp/kpvenv, /tmp/kpvenv/bin/pip install -e .");
add("KPPRO", "KP Pro v15 instructions and booklet", kpRepo && has(path.join(kpRepo, "knowledge", "kp_pro", "KP-PROJECT-INSTRUCTIONS-v15.md")) && has(path.join(KNOW, "kppro", "KP-PRO-METHODOLOGY.txt")), "restore knowledge files");
add("KCIL", "KCIL v2.6 instructions and summary", kpRepo && has(path.join(kpRepo, "knowledge", "kcil", "KCIL-CUSTOM-INSTRUCTIONS-v2.6.md")) && has(path.join(KNOW, "kcil", "KCIL-METHODOLOGY-V2.6.txt")), "restore knowledge files");
add("KCIL", "vednetra-kcil skill", SK && has(path.join(SK, "vednetra-kcil", "scripts", "run_kcil_report.js")), "sync the vednetra-kcil skill into the account");
add("SUJ", "suj_engine tools", has(path.join(ROOT, "suj_engine", "tools", "prepare.js")), "restore suj_engine");
add("CHAWDHRI", "sibling repo CHAWDHRI attached", chRepo, "attach the CHAWDHRI repository to the session");
add("CHAWDHRI", "jyotish.sh present", chRepo && has(path.join(chRepo, "jyotish.sh")), "restore the CHAWDHRI repository");
add("BNN", "BNN rule csv and method guide", has(path.join(KNOW, "bnn", "BNN-RULES-5COLUMN.csv")) && has(path.join(KNOW, "bnn", "BNN-METHOD-GUIDE.txt")), "restore knowledge files");
add("BNN", "vednetra-bnn skill", SK && has(path.join(SK, "vednetra-bnn", "scripts", "run_bnn_export.js")), "sync the vednetra-bnn skill into the account");
const uduFiles = ["UDU-vivah-sambandh.md", "UDU-karya-dhan.md", "UDU-arogya-ayu.md", "UDU-vidya-swabhav.md", "UDU-santan-parivar.md", "UDU-dharma-upay.md", "UDU-samay-muhurat.md", "UDU-yatra-shatru.md", "UDU-mool-tattva.md"];
const uduCorpus = uduFiles.every(f => has(path.join(KNOW, "udu", f)));
add("UDU", "vednetra-ududaya skill", SK && has(path.join(SK, "vednetra-ududaya", "scripts", "run_ududaya_export.js")), "sync the vednetra-ududaya skill into the account");
add("QUAD", "vednetra-quad skill", SK && has(path.join(SK, "vednetra-quad", "scripts", "run_quad_dasha.js")), "sync the vednetra-quad skill into the account");
const quadFull = ["pdf", "txt", "md"].some(e => has(path.join(KNOW, "quad", "QUAD-FULL-METHODOLOGY." + e)));
const layerOk = has(path.join(__dirname, "promise_layer.js")) && (() => { try { const r = run(process.execPath, [path.join(__dirname, "promise_layer.js"), JSON.stringify({ gender: "female", date: "1990-01-01", time: "10:00:00", tz: 5.5, lat: 28.6, lon: 77.2, asOf: "2026-11-17", questions: [{ id: "Q1", text: "t", options: ["A Government job", "B Own business"] }] })]); return r.status === 0 && /RESULT Q1 QUAD/.test(r.stdout); } catch (e) { return false; } })();

const lexTool = spawnSync(process.execPath, [path.join(__dirname, "sarva_lexicon.js"), "--check"], { encoding: "utf8", timeout: 20000 });
const lexOk = lexTool.status === 0;
if (!lexOk) console.log("LEXICON check failed. Fix, run node sarva_engine/tools/sarva_lexicon.js --check and rebuild with python3 sarva_engine/tools/lexicon_build/build_lexicon.py. " + String(lexTool.stdout || lexTool.stderr).trim().split("\n")[0]);
else console.log("LEXICON " + String(lexTool.stdout).trim());
const cols = ["KPPRO", "KCIL", "SUJ", "CHAWDHRI", "BNN", "UDU", "QUAD"];
const names = { KPPRO: "KP Pro", KCIL: "KCIL", SUJ: "SUJ engine", CHAWDHRI: "CHAWDHRI", BNN: "BNN", UDU: "Udu", QUAD: "Quad Dasha" };
let hard = 0;
console.log("SARVA PREFLIGHT");
if (SK) console.log("skills folder " + SK);
checks.forEach(c => { if (!c.ok) { hard++; console.log("MISSING " + c.col + " " + c.name + ". Fix, " + c.fix + "."); } });
console.log("");
cols.forEach(c => {
  const tools = checks.filter(x => (x.col === c || x.col === "ALL") && !x.ok).length === 0;
  let state = tools ? "CAN RUN" : "TOOLS MISSING";
  if (c === "UDU") state = tools ? (uduCorpus ? "CAN RUN" : (layerOk ? "RUNS THE PROVISIONAL PROMISE LAYER, the nine corpus files are not installed, the cell is marked PROVISIONAL" : "STANDING GAP, the promise layer failed its self run, cell is NOT RUN UDU RULES MISSING")) : "TOOLS MISSING";
  if (c === "QUAD") state = tools ? (quadFull ? "CAN RUN" : (layerOk ? "RUNS THE PROVISIONAL PROMISE LAYER, the Quad READ rules are not installed, the cell is marked PROVISIONAL" : "STANDING GAP, the promise layer failed its self run, cell is NOT RUN QUAD RULES MISSING")) : "TOOLS MISSING";
  console.log(names[c].padEnd(11) + state);
});
console.log("");
console.log("Expected guard result for a complete reply with the provisional promise layers, exit code 0 with a NOTE naming UDU and QUAD. Exit code 3 only if a cell falls back to NOT RUN.");
process.exit(hard ? 1 : 0);
