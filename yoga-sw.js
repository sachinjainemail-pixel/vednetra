/* Yoga-Fi service worker — minimal offline cache so the app is installable
   and works from the home screen. Network-first, falls back to cache. */
const CACHE = "yoga-fi-v1";
const ASSETS = ["./", "index.html", "yoga.html", "yoga.webmanifest",
  "yoga-icon-192.png", "yoga-icon-512.png", "yoga-apple-touch.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); return r; })
      .catch(() => caches.match(e.request).then((c) => c || caches.match("index.html")))
  );
});
