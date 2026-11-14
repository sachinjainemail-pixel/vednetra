/* SUJ engine, ENGINE CONFIG. One place that decides which configuration every tool runs. Version 2.0 is the default.
 * resolve(cfg) returns a copy of cfg with the engine defaults filled in for the keys the caller did not set. cfg.engine "legacy" gives the round 12 configuration,
 * with degree and nakshatra off, which is only for reproducing old results. A key the caller sets, true or false, always wins. */
const fs = require("fs"), path = require("path");
const CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "engine_config.json"), "utf8"));
function resolve(cfg) {
  const out = Object.assign({}, cfg);
  const legacy = out.engine === "legacy";
  Object.keys(CONFIG.defaults).forEach(k => { if (out[k] === undefined) out[k] = legacy ? (k === "nodeDegree" ? undefined : false) : CONFIG.defaults[k]; });
  out.engineVersion = legacy ? "legacy" : CONFIG.version;
  return out;
}
module.exports = { resolve, CONFIG, version: CONFIG.version };
