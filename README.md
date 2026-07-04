# VedNetra

A complete, self-contained Vedic astrology web application. **No build step. No dependencies. Pure static files.**

Birth chart (D-1) + all divisional charts to D-60, Vimshottari dasha (down to Prana with end times), Shadbala, Ashtakavarga, KP, Jaimini, Varshfal (by calendar year or running year), Yogas, multi-date transits, draggable Time Tool, worksheets, a downloadable VedNetra report, and the comprehensive **Chawdhri Standing Natal Report** (Sections A-S, default download). Lahiri / Raman / KP ayanamshas. Fully mobile-responsive with a clean start screen, sticky section navigation, minimisable Multi-View panels that can pop out to another monitor, and a version label on the start screen.

---

## Files

| File | Purpose |
|---|---|
| `index.html` | Main HTML shell (loads `styles.css?v=18`, `app.js?v=18`) |
| `app.js` | All application logic |
| `styles.css` | All styles (mobile + compact desktop dialog + start screen) |
| `service-worker.js` | Offline cache (network-first, auto-updating) |
| `manifest.webmanifest` | PWA install manifest |
| `icon.svg` | App icon |
| `404.html` | SPA fallback (copy of index.html) |
| `.nojekyll` | Tells GitHub Pages to serve files as-is (skip Jekyll) |
| `.gitignore` | Ignores OS / editor junk |
| `.github/workflows/deploy.yml` | Auto-deploys to GitHub Pages on every push to `main` |
| `yoga.html` | **Sattva** — a standalone Yoga & Ayurveda app (self-contained; open directly) |

---

## Sattva — Yoga &amp; Ayurveda app

`yoga.html` is a separate, self-contained single-file app (inline CSS + JS, no build, no dependencies). Open it directly at `/yoga.html`.

It personalises yoga around your Ayurvedic **dosha**:

- **Dosha quiz** — a 10-question quiz maps your Vata / Pitta / Kapha balance.
- **My Dosha** — your constitution with balance meters, a rebalancing plan, and a daily routine (dinacharya).
- **Yoga** — dosha-aligned sequences with a full-screen **guided practice player**: pose timer, progress ring, breath pacer, prev/next, and pause.
- **Asanas** — an illustrated reference of **50 essential poses**, each drawn as a self-contained human-figure SVG (generated from a parametric pose engine), grouped into Standing/Balancing, Seated/Twisting and Backbends/Inversions, with Sanskrit name, benefit and how-to in a detail modal.
- **Breathe** — breathing exercises / pranayama (box, 4·7·8, coherent, calming, energising, Nadi Shodhana, Bhramari, Sheetali) with a visual pacer.
- **Meditate** — guided meditations (breath awareness, body scan, loving-kindness, yoga nidra, So-Hum, morning clarity) with a timed player, on-screen prompts and breathing anchor.
- **Panchang** — a computed daily Vedic almanac: tithi, nakshatra, yoga, karana, vara, moon phase and Rahu Kaal, with a daily alignment note (approximate; Lahiri ayanamsa).
- **Ayurveda** — per-dosha foods to favour/reduce, herbs, daily rituals, and seasonal tips.
- **Food** — "food to eat" guidance: what to eat right now by time of day, a full-day meal plan, tastes to favour, and a favour/reduce board per dosha.
- **Herbs** — a herbal-recommendations library (ashwagandha, triphala, brahmi, turmeric, tulsi, ginger, amla, shatavari, trikatu, licorice) with benefits, usage and cautions in a detail modal.
- **DIYs** — Ayurvedic home remedies (abhyanga oil, ubtan mask, tongue scraping + oil pulling, hair oil, dry brushing, CCF tea) with ingredients, steps and cautions.
- **Recipes** — dosha-friendly health recipes (kitchari, golden milk, CCF tea, stewed apples, mung soup, ojas balls) with ingredients and method.
- **Ayurvedic tip of the day** — a rotating daily tip featured on the Home screen and the Panchang view.
- **Premium services** — 1:1 expert counselling, a 21-day diet program, a one-day workshop, and a customised diet chart, alongside the freemium tiers (demo only).
- **Progress** — sessions, minutes, day streak, and a 3-week activity heatmap (stored in `localStorage`; nothing is uploaded).
- **Premium** — a freemium tier layout (Sattva Plus subscription, one-time courses like a *30-Day Dosha Reset*, live sessions) illustrating monetisation. Demo only — no real payments.

All wellness content is educational and not a substitute for professional medical advice.

---

## Deploy to GitHub Pages

### Option A - automatic (recommended; uses the included Actions workflow)

1. Create a repository on GitHub (e.g. `vednetra`).
2. Push these files to the `main` branch:
   ```bash
   cd VedNetra-github
   git init
   git add .
   git commit -m "VedNetra deploy"
   git branch -M main
   git remote add origin https://github.com/<your-username>/vednetra.git
   git push -u origin main
   ```
3. On GitHub: **Settings -> Pages -> Build and deployment -> Source: GitHub Actions**.
4. The included workflow publishes the site automatically.
5. Live at `https://<your-username>.github.io/vednetra/` in ~1 minute. Every future push redeploys.

### Option B - classic branch deploy (no Actions)

1. Push the files to `main` as above.
2. **Settings -> Pages -> Source: Deploy from a branch -> Branch: `main` / `/ (root)`** -> Save.
3. Live at `https://<your-username>.github.io/vednetra/` in ~1 minute.

### Option C - upload via the GitHub website (no command line)

1. Open your `vednetra` repo on github.com -> **Add file -> Upload files**.
2. Drag in ALL files from this folder (including the hidden `.nojekyll`, `.github/` folder).
3. Commit. Then **Settings -> Pages** as in Option A or B.

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
- **Saved charts** live in the browser's localStorage. Use the in-app **Export / Import library** to move charts between devices.
- **Updating after edits:** bump `?v=N` in `index.html` (both `styles.css` and `app.js`) AND `CACHE_NAME` in `service-worker.js`. Clients then fetch fresh files automatically.
- **Mobile:** clean start screen, sticky section navigation with a Home button, full-screen Chart Setup dialog, single-column charts, 44px tap targets, minimisable + pop-out Multi-View panels. "Add to Home Screen" installs it as a PWA.

---

Current build: cache `vednetra-v18`, assets `?v=18`. Default report download: Standing Natal Report (Chawdhri).

