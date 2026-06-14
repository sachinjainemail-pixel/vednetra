# VedNetra

A complete, self-contained Vedic astrology web application. **No build step. No dependencies. Pure static files.**

Birth chart (D-1) + all divisional charts to D-60, Vimshottari dasha (down to Prana with end times), Shadbala, Ashtakavarga, KP, Jaimini, Varshfal (year ranges), Yogas, multi-date transits, draggable Time Tool, worksheets, a downloadable VedNetra report, and the comprehensive **Chawdhri Standing Natal Report** (Sections A–S). Lahiri / Raman / KP ayanamshas. Fully mobile-responsive with a clean start screen, sticky section navigation, and minimisable Multi-View panels.

---

## Files

| File | Purpose |
|---|---|
| `index.html` | Main HTML shell (loads `styles.css?v=14`, `app.js?v=14`) |
| `app.js` | All application logic |
| `styles.css` | All styles (mobile + compact desktop dialog + start screen) |
| `service-worker.js` | Offline cache (network-first, auto-updating) |
| `manifest.webmanifest` | PWA install manifest |
| `icon.svg` | App icon |
| `404.html` | SPA fallback (copy of index.html) |
| `lg-remote.html` | Standalone mobile LG (webOS) TV remote — see below |
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
- **Mobile:** clean start screen (logo, name, Create/Select buttons), sticky section navigation with a Home button, full-screen Chart Setup dialog, single-column charts, 44px tap targets, and minimisable Multi-View panels. "Add to Home Screen" installs it as a PWA.

---

## LG TV Remote (`lg-remote.html`)

A self-contained, mobile-first remote control for **LG webOS smart TVs**. No build, no
dependencies, no server — your phone talks straight to the TV over your Wi-Fi using the
webOS **SSAP** WebSocket protocol. Open `lg-remote.html` directly (or "Add to Home Screen").

**Features:** power-off, volume/mute, channel, D-pad + OK/Back/Home/Exit, playback &
colour keys, number pad, HDMI input switching, a Magic-Remote **touchpad** (drag to move,
tap to click), on-screen text entry, and a live list of the **apps installed on your TV**.
The pairing key is saved in `localStorage`, so it reconnects automatically after the first time.

**Setup (one time):**
1. Put your phone and TV on the **same Wi-Fi**, and enable **Mobile TV On / LG Connect Apps**
   in the TV's network settings.
2. Find the TV's **IP** (Settings → General → Network) and enter it in the remote's ⚙︎ panel.
3. If you opened this page over **https**, tap **① Accept TV certificate** first (the TV uses a
   self-signed cert on port 3001; accepting it once is required and is safe on your own network).
   Served over plain **http** (e.g. `localhost`) it uses port 3000 and needs no cert step.
4. Tap **Connect**, then press **Accept** on the TV's pairing prompt with the physical remote — once.

**Limitations:** LG webOS only; same-LAN only; the protocol can turn the TV *off* but not back
*on* (that needs Wake-on-LAN, which browsers can't send).

---

Current build: cache `vednetra-v14`, assets `?v=14`.
