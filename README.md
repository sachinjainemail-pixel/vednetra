# VedNetra — Host-Ready Package

A complete, self-contained Vedic astrology web application. **Zero build step. No dependencies. Pure static files.**

## What's inside

| File | Purpose |
|---|---|
| `index.html` | Main HTML shell |
| `app.js` | All application logic (~770 KB) |
| `styles.css` | All styles, including mobile (~155 KB) |
| `service-worker.js` | Offline cache (PWA) |
| `manifest.webmanifest` | PWA install manifest |
| `icon.svg` | App icon |
| `404.html` | SPA fallback (copy of index.html) |
| `.nojekyll` | Disables Jekyll processing on GitHub Pages |
| `_redirects` | Netlify SPA fallback rule |

---

## Hosting options

### 1. GitHub Pages
1. Create a new GitHub repo (e.g. `vednetra`)
2. Push **all the files above** to the root of the `main` branch
3. Go to **Settings → Pages → Source: `main` branch / root** → Save
4. Wait ~30 seconds. Site is live at `https://<your-user>.github.io/vednetra/`

### 2. Netlify (drag & drop)
1. Go to https://app.netlify.com/drop
2. Drag this **entire folder** onto the drop zone
3. Done. Live in ~10 seconds. Custom domain optional.

### 3. Vercel
1. Run `npx vercel` inside this folder (one-time login)
2. Accept defaults
3. Live in ~20 seconds

### 4. Cloudflare Pages
1. Go to Cloudflare Pages dashboard → "Upload assets"
2. Upload this folder
3. Live in ~30 seconds

### 5. Any static host (S3, Firebase, Surge, etc.)
Upload everything to the root of your bucket / site directory. Set `index.html` as the default doc.

### 6. Your own server (Nginx / Apache)
- Drop the folder into your web root (e.g. `/var/www/vednetra/`)
- Configure HTTPS (the service worker requires it for production)
- Ensure all paths under `/` serve from `index.html` as fallback

---

## Local testing before deploy

```bash
# Option A: Node (any version)
npx serve . -l 4173

# Option B: Python
python -m http.server 4173

# Option C: Live Server in VS Code
```

Open `http://localhost:4173/`

---

## Important notes

1. **HTTPS required for service worker** — Most hosts above (GitHub Pages, Netlify, Vercel, Cloudflare) provide HTTPS automatically. On a self-hosted server, install a TLS cert (Let's Encrypt is free).

2. **No CORS-blocked APIs** — Everything runs in the browser. The only optional external call is the geocoding lookup for birth-place coordinates (when user clicks "Search and populate lat/long"). That call goes to Nominatim/OpenStreetMap.

3. **localStorage is the database** — All saved charts, defaults, and preferences are kept in the browser's localStorage. Nothing is server-side. Users on different devices have separate libraries; use the **Export library / Import library** buttons to move charts between devices.

4. **Cache busting after updates** — When you update files, bump the `CACHE_NAME` version at the top of `service-worker.js` (e.g. `vednetra-v03` → `vednetra-v04`). This forces all clients to fetch fresh files on their next visit.

5. **Mobile-ready** — The app is fully responsive. Phones (≤720px) get single-column layout, larger tap targets, simplified header, full-screen dialog, and touch-friendly resize.

6. **PWA install** — Users can "Add to Home Screen" on iOS/Android and use VedNetra like a native app, fully offline after first load.

---

## Current build info

- **Version:** Mobile-optimized build (cache `vednetra-v03`)
- **Key features:** Multi-format Quick Birth parser, draggable worksheet panels, full-screen mode, Time Tool, Ashtakavarga, Shadbala, KP, Varshfal, Yogas
- **Lines of code:** ~21k JS, ~7.5k CSS
- **Total payload:** ~960 KB uncompressed (≈260 KB gzipped)

---

Built with VedNetra. Vedic astrology, modern UX.
