/*
 * Loads the Vednetra core (VedicCore) into plain Node with stub browser globals,
 * exactly as tools/run-nobrowser.js does, so SUJ engine tools can read structured
 * chart data instead of rendered markdown. All chart computation stays inside Vednetra.
 */
const fs = require("fs");
const path = require("path");

function loadVedicCore(appDir) {
  const dir = appDir ? path.resolve(appDir) : path.resolve(__dirname, "..", "..");
  const noop = () => {};
  const el = () => new Proxy({}, {
    get: (t, k) => k === "style" ? {}
      : k === "classList" ? { add: noop, remove: noop, toggle: noop, contains: () => false }
      : k === "children" ? [] : k === "dataset" ? {}
      : k === "value" || k === "textContent" || k === "innerHTML" ? ""
      : (t[k] !== undefined ? t[k] : noop),
    set: (t, k, v) => (t[k] = v, true)
  });
  const doc = {
    documentElement: el(), body: el(), head: el(), readyState: "complete", cookie: "",
    getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
    createElement: el, createTextNode: el, addEventListener: noop, removeEventListener: noop
  };
  const store = {};
  const put = (n, v) => {
    try { global[n] = v; }
    catch (e) { try { Object.defineProperty(global, n, { value: v, configurable: true, writable: true }); } catch (_) {} }
  };
  Object.entries({
    document: doc,
    navigator: { userAgent: "node", language: "en" },
    location: { href: "file:///", search: "", hash: "", pathname: "/" },
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; }, clear: () => {} },
    requestAnimationFrame: cb => setTimeout(cb, 0),
    requestIdleCallback: cb => setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 0 }), 0),
    matchMedia: () => ({ matches: false, addEventListener: noop, addListener: noop }),
    getComputedStyle: () => ({ getPropertyValue: () => "" }),
    Element: function () {}, HTMLElement: function () {}, Node: function () {}
  }).forEach(kv => put(kv[0], kv[1]));
  put("sessionStorage", global.localStorage);
  global.window = globalThis;
  Object.assign(global.window, { document: doc, addEventListener: noop, removeEventListener: noop, innerWidth: 1280, innerHeight: 900, devicePixelRatio: 1 });
  for (const f of ["trinetra-rules.js", "quad-dasha.js", "app.js"]) {
    const p = path.join(dir, f);
    if (fs.existsSync(p)) require(p);
  }
  const VC = globalThis.VedicCore;
  if (!VC || !VC.avEngineFor) throw new Error("VedicCore not found. Check the Vednetra files in " + dir);
  return VC;
}

module.exports = { loadVedicCore };
