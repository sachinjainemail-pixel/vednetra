# VedNetra

A complete, self-contained Vedic astrology web application. **No build step. No dependencies. Pure static files.**

Birth chart (D-1) plus all divisional charts to D-60, Vimshottari dasha, Shadbala, Ashtakavarga, KP, Jaimini, Varshfal (with year ranges), Yogas, multi-date transits, a draggable Time Tool, worksheets, and a full downloadable VedNetra report — all computed in the browser. Raman / Lahiri / KP ayanamshas. Fully mobile-responsive with a clean start screen and section navigation.

---

## Files

| File | Purpose |
|---|---|
| `index.html` | Main HTML shell (loads `styles.css?v=9`, `app.js?v=9`) |
| `app.js` | All application logic |
| `styles.css` | All styles (mobile + compact desktop dialog + start screen) |
| `service-worker.js` | Offline cache (network-first, auto-updating) |
| `manifest.webmanifest` | PWA install manifest |
| `icon.svg` | App icon |
| `404.html` | SPA fallback (copy of index.html) |
| `.nojekyll` | Tells GitHub Pages to serve files as-is (skip Jekyll) |
| `.gitignore` | Ignores OS / editor junk |
| `.github/workflows/deploy.yml` | Auto-deploys to GitHub Pages on every push to `main` |

---

## Deploy to GitHub Pages

### Option A — automatic (recommended; uses the included Actions workflow)

1. Create a new repository on GitHub (e.g. `vednetra`).
2. Push these files to the **`main`** branch:
   ```bash
   cd VedNetra-github
   git init
   git add .
   git commit -m "VedNetra deploy"
   git branch -M main
   git remote add origin https://github.com/<your-username>/vednetra.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. The included workflow publishes the site automatically.
5. Live at `https://<your-username>.github.io/vednetra/` in ~1 minute. Every future `git push` redeploys.

### Option B — classic branch deploy (no Actions)

1. Push the files to `main` as above.
2. **Settings → Pages → Source: Deploy from a branch → Branch: `main` / `/ (root)`** → Save.
3. Live at `https://<your-username>.github.io/vednetra/` in ~1 minute.

---

## Local testing

```bash
npx serve . -l 4173
# or
python -m http.server 4173
```
Open http://localhost:4173/

---

## Notes

- **HTTPS** is provided automatically by GitHub Pages (required for the service worker / offline mode).
- **Saved charts** live in the browser's localStorage. Use the in-app **Export / Import library** to move charts between devices or browsers.
- **Updating after edits:** bump `?v=N` in `index.html` (both `styles.css` and `app.js`) **and** `CACHE_NAME` in `service-worker.js`. Clients then fetch fresh files automatically — no manual cache clearing.
- **Mobile:** clean start screen (logo, name, Create/Select buttons), sticky section navigation with a Home option, full-screen Chart Setup dialog, single-column charts, 44px tap targets. Users can "Add to Home Screen" to install as a PWA.

---

Current build: cache `vednetra-v09`, assets `?v=9`.
