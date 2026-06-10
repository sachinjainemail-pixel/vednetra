# VedNetra — Host-Ready Package

A complete, self-contained Vedic astrology web app. **No build step. No dependencies. Pure static files.**

## Files

| File | Purpose |
|---|---|
| `index.html` | Main HTML shell (loads `styles.css?v=4`, `app.js?v=4`) |
| `app.js` | All application logic |
| `styles.css` | All styles incl. full mobile layout |
| `service-worker.js` | Offline cache (network-first, auto-updating) |
| `manifest.webmanifest` | PWA install manifest |
| `icon.svg` | App icon |
| `404.html` | SPA fallback (copy of index.html) |
| `.nojekyll` | Disables Jekyll on GitHub Pages |
| `_redirects` | Netlify SPA fallback rule |

## Deploy

- **Netlify:** https://app.netlify.com/drop → drag this folder in
- **GitHub Pages:** push files to repo root → Settings → Pages → Source: main/root
- **Vercel:** `npx vercel` in this folder
- **Cloudflare Pages:** upload the zip
- **Own server:** drop in web root, serve over HTTPS

## Auto-update behaviour (important)

This build solves the "stale cache on mobile" problem three ways:

1. **Versioned asset URLs** — `styles.css?v=4` / `app.js?v=4`. Bump `v=` in `index.html`
   whenever you change CSS/JS to force every browser to fetch fresh.
2. **Network-first service worker** — always fetches the latest from the network when
   online; cache is used only when offline.
3. **Auto-reload on update** — when a new service worker activates, open pages reload
   themselves once. No manual cache clearing needed.

After any future edit: bump `?v=N` in index.html AND `CACHE_NAME` in service-worker.js.

## Local testing

```
npx serve . -l 4173
```

## Notes
- HTTPS required for service worker in production (GitHub Pages/Netlify/Vercel/Cloudflare all auto-provide it).
- Saved charts live in browser localStorage. Use Export/Import library to move between devices.
- Fully mobile-responsive: single-column layout, full-screen Chart Setup dialog, 44px tap targets, no horizontal scroll.
