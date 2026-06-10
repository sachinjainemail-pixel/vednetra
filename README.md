# VedNetra — Host-Ready Package

Self-contained Vedic astrology web app. No build step. No dependencies. Pure static files.

## Files
- `index.html`, `app.js`, `styles.css` — the app (loads `?v=5` assets)
- `service-worker.js` — offline cache (network-first, auto-updating)
- `manifest.webmanifest`, `icon.svg` — PWA install
- `404.html` — SPA fallback (copy of index.html)
- `.nojekyll` — GitHub Pages: skip Jekyll
- `_redirects` — Netlify SPA fallback

## Deploy
- **Netlify:** https://app.netlify.com/drop → drag this folder in
- **GitHub Pages:** push files to repo root → Settings → Pages → main/root
- **Vercel:** `npx vercel` in this folder
- **Cloudflare Pages:** upload the folder

## Local test
```
npx serve . -l 4173
```
Open http://localhost:4173/

## Notes
- HTTPS required for the service worker in production (all hosts above auto-provide it).
- Saved charts live in browser localStorage — use Export/Import library to move between devices.
- Fully mobile-responsive: full-screen Chart Setup dialog, single-column charts, 44px tap targets.
- After future edits: bump `?v=N` in index.html AND `CACHE_NAME` in service-worker.js so clients auto-update.
