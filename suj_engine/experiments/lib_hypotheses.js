/* Shim kept so the old experiment scripts still run. The generator is now tools/hypotheses.js. The experiments name their conditions by explicit keys, a call with neither degree nor
 * nakshatra set is the old base condition A, so it runs with engine legacy, the engine default is the updated configuration since round 22. */
const H = require("../tools/hypotheses");
function run(C, ctx, hs, opts, carriersOnly) {
  const c = (C.degree === undefined && C.nakshatra === undefined && C.engine === undefined) ? Object.assign({}, C, { engine: "legacy" }) : C;
  return H.run(c, ctx, hs, opts, carriersOnly);
}
module.exports = { context: H.context, build: H.build, run };
