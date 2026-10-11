# VedNetra

A complete, self-contained Vedic astrology web application. **No build step. No dependencies. Pure static files.**

Birth chart (D-1) + all divisional charts to D-60, Vimshottari dasha (down to Prana with end times), Shadbala, Ashtakavarga, KP, Jaimini, Varshfal (by calendar year or running year), Yogas, multi-date transits, draggable Time Tool, worksheets, a downloadable VedNetra report, and the comprehensive **Chawdhri Standing Natal Report** (Sections A-S, default download). Lahiri / Raman / KP ayanamshas. Fully mobile-responsive with a clean start screen, sticky section navigation, minimisable Multi-View panels that can pop out to another monitor, and a version label on the start screen.

---

## Files

| File | Purpose |
|---|---|
| `index.html` | Main HTML shell (loads `styles.css?v=118`, `app.js?v=118`) |
| `app.js` | All application logic |
| `styles.css` | All styles (mobile + compact desktop dialog + start screen) |
| `service-worker.js` | Offline cache (network-first, auto-updating) |
| `manifest.webmanifest` | PWA install manifest |
| `icon.svg` | App icon |
| `404.html` | SPA fallback (copy of index.html) |
| `.nojekyll` | Tells GitHub Pages to serve files as-is (skip Jekyll) |
| `.gitignore` | Ignores OS / editor junk |
| `quad-dasha.js` | **QUAD DASHA engine** — Vimshottari + Chara + Kaal Chakra + Yogini, and the reading frames of all four schools. Loaded before `app.js`; takes only the ephemeris and the Ascendant from it |
| `tools/av-timing-backtest.js` | Scores the AV Engine's timing windows against dated real events |
| `tools/quad-dasha-selftest.js` | Runs the eight QUAD DASHA assertions and prints the four running periods for the two validation charts |
| `tools/cases/` | Backtest input (`events.template.json` is the format) |

---

## Deploy to GitHub Pages

### How this repo is actually deployed

GitHub Pages is set to **Deploy from a branch → `main` / `(root)`**, so GitHub's
built-in `pages build and deployment` job publishes the site on every push to
`main`. There is no Actions workflow file in this repo — nothing to maintain.

**After any edit, bump all three or clients keep the cached build:** `?v=N` on
both assets in `index.html`, and `CACHE_NAME` in `service-worker.js`.

### Option A - automatic (a custom Actions workflow, if you ever add one)

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

Current build: cache `vednetra-v118`, assets `?v=118`. Default report download: KP System Report.

---

## The QUAD DASHA export

A dedicated report (`quaddasha`) carrying **all four dasha systems** from one chart, for the
*Shree Ganesha Ji Shri Saraswati Ji Blessed Quad Dasha* project:

- **Vimshottari** (120y, nakshatra) — BPHS Ch.46/51 + *Laghu Parashari*
- **Chara** (Jaimini rashi) — K.N. Rao's method
- **Kaal Chakra** (83–100y) — BPHS Ch.46/51/64
- **Yogini** (36y) — BPHS Ch.46 + V.P. Goel's progressed lagna

plus the chart-derived reading frames each school needs (Laghu Parashari functional
classification and maraka hierarchy, sambandha matrix, Pachaka/Bodhaka/Karaka/Vedhaka,
longevity class, the seven Chara karakas with Karakamsa and the arudha padas, the ten Jaimini
rajayogas under Rao's navamsa filter, Kaal Chakra house activation from both the lagna and the
deha sign with the three gaits marked, Goel's three reference points), a **birth-time stability
gate at ±1/±5/±15 minutes**, the level-discipline table and a base-rate appendix.

**Reach it three ways:**

```bash
node tools/quad-dasha-selftest.js          # must print 8/8
node tools/run-nobrowser.js '{"date":"1917-11-19","time":"23:11:01","tz":5.5,"lat":25.45,"lon":81.85,"report":"quaddasha"}'
```
In the app: the **QUAD DASHA Export** card (Download Markdown / Copy). From a harness:
`VedicCore.reportFor(spec, "quaddasha")` and `VedicCore.quadDashaSelftest()`.

### Why it has its own engine

`quad-dasha.js` takes from this app **only the ephemeris and the Ascendant**. Every dasha
quantity is computed in that file. Three reasons: a change to `app.js` cannot silently move a
dasha boundary; the seven computational corrections the project settled against primary text
stay enforced in one reviewable place; and the output stays reproducible against the project's
Python engine, which carries the same eight self-tests.

### Known divergence from this app's own cards

Measured, not asserted. The **Char Dasha** card takes its counting direction from **sign
parity**; the rule K.N. Rao's own worked table gives is **groups of three** (Ar/Ta/Ge forward,
Cn/Le/Vi reverse, Li/Sc/Sg forward, Cp/Aq/Pi reverse). The card also ignores the Scorpio
(Mars/Ketu) and Aquarius (Saturn/Rahu) co-lordships. Against the twelve-rashi sequence Rao
*prints* for Queen Elizabeth II the card scores **8/12**, with three lengths out by exactly
`12 − correct`; `quad-dasha.js` scores **12/12**. The **Yogini Dasha** card has no progressed
lagna, and there is no Kaal Chakra card at all. The export is the one to read for all four.

### What the report does not claim

52 pre-registered tests of the interpretive rules of all four systems, on 18 charts with
confirmed event dates and scored against length-weighted local nulls, came out at chance
(mean lift 0.960, smallest p 0.110). The **casting and period arithmetic are validated**;
the **interpretation is classical and unvalidated**, and §13 of every report says so and
carries the base rates. No report dates a death.
