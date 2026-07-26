---
name: vedic-d1-chart-reader
description: >-
  Extract structured data from a North Indian Vedic D1 / Rashi (birth) chart
  IMAGE, and optionally reverse-derive the native's birth date and tentative
  birth time from it. Use whenever the user shares a diamond-shaped North Indian
  kundali / Rashi / D1 / lagna chart picture and wants its houses, zodiac signs,
  planets, degrees, or conditions (retrograde, combust, exalted, debilitated,
  vargottama) pulled out — or asks "what birth date/time does this chart
  correspond to", "recover/derive the birth details from this kundali", or
  "turn this chart into JSON". Trigger on Hindi single-letter planet glyphs
  (के गु च श सू बु रा मं शु), on charts with a peach legend box
  (वक्री/अस्त/वर्गोत्तम/उच्च/नीच), and on any request to read, digitize, or
  back-solve a North Indian horoscope image, even if the user never says
  "Vedic" or "D1". This reads a chart IMAGE or reverse-engineers birth data
  FROM a chart — NOT for interpreting a chart whose birth details are already
  known (a different skill).
---

# Vedic D1 (Rashi) Chart Reader

Two capabilities that can be used separately or as a pipeline:

- **Part A — Extract:** turn a North Indian D1 chart image into structured data
  (12 houses, signs, planets, degrees, conditions).
- **Part B — Derive:** from that extracted data, reverse-solve the birth
  **date** (exact) and **tentative time** using a real Lahiri ephemeris.

If the user hands you an image and asks for birth date/time, do **Part A then
Part B**. If they only want the chart digitized, stop after Part A. If they
already have the extracted numbers, go straight to Part B.

---

## Part A — Read the chart image

North Indian charts are **fixed-layout**: the 12 house cells never move, so the
*number printed in a cell is the zodiac sign* sitting in that house, not the
house number. Extraction is therefore mostly about (1) reading which sign-number
is in the top-centre cell, and (2) deciding which cell each planet glyph lives
in. Two rules make or break accuracy — read `references/north-indian-chart.md`
in full before your first extraction:

1. **House 1 is always the top-centre diamond.** The sign-number there is the
   Ascendant. Signs then increase by 1 going counter-clockwise, so once you have
   House 1's sign every other house follows automatically. Use this as a
   consistency check: the twelve numbers must read consecutively 1–12 (wrapping)
   around the houses.

2. **A planet's house is whichever yellow-bordered cell its glyph physically sits
   in — nothing else.** The diagonal lines split each corner into two separate
   houses; a glyph on the far side of a diagonal belongs to the *other* house
   even when it looks visually close to a neighbouring cell's sign-number. Never
   assign a planet by nearest number, and never let astrological plausibility
   (e.g. Venus's distance from the Sun) override the pixel geometry. This is the
   single most common extraction error.

**Planet glyphs** are the first Hindi letter of each planet, and the small
number at a glyph's upper-right is its **degree within the sign** (software
almost always *truncates*, so "20" means 20°–21°). Symbols next to a glyph mark
its condition. The full glyph table and legend are in `references/glyphs.md` —
consult it for every extraction so you don't guess.

### Output format (Part A)

Produce **both** a house table and a JSON object. The JSON is what Part B
consumes, so it must use canonical English sign names and integer degrees:

```json
{
  "chartType": "D1_Rashi",
  "style": "north_indian",
  "ascendant": { "sign": "Leo", "degree": 28 },
  "planets": {
    "Sun":     { "sign": "Aquarius", "degree": 20 },
    "Moon":    { "sign": "Cancer",   "degree": 21 },
    "Mars":    { "sign": "Aries",    "degree": 25 },
    "Mercury": { "sign": "Aquarius", "degree": 20, "conditions": ["combust"] },
    "Jupiter": { "sign": "Leo",      "degree": 20, "conditions": ["retrograde"] },
    "Venus":   { "sign": "Aries",    "degree": 4 },
    "Saturn":  { "sign": "Gemini",   "degree": 12, "conditions": ["retrograde"] },
    "Rahu":    { "sign": "Aries",    "degree": 20, "conditions": ["retrograde"] },
    "Ketu":    { "sign": "Libra",    "degree": 20, "conditions": ["retrograde"] },
    "Uranus":  { "sign": "Aquarius", "degree": 9 },
    "Neptune": { "sign": "Capricorn","degree": 20 },
    "Pluto":   { "sign": "Scorpio",  "degree": 28 }
  }
}
```

Include the house number for each planet in the human-readable table (derived
from the Ascendant via whole-sign houses), and list any conditions. A complete
worked example lives in `assets/example_chart.json`.

### Sanity checks before you trust an extraction
- The twelve sign-numbers read consecutively around the houses (wrapping 12→1).
- Rahu and Ketu are exactly six houses / 180° apart and share the same degree.
- A planet flagged combust (अस्त) is within ~10–15° of the Sun's longitude.
- If any of these fail, re-examine the image — usually a house was misassigned.

---

## Part B — Derive birth date & tentative time

The physics: **Jupiter and Saturn are slow**, so the two signs they occupy
pin the birth to a few candidate windows across a century. **The Sun** picks the
month, the **fast planets** (Mars, Mercury, Venus) pick the exact day, the
**Moon** confirms the day, and the **Ascendant degree** gives the time of day.
Because this exact multi-planet pattern recurs only on the scale of tens of
thousands of years, the **date is unique and certain**; the **time is
"tentative"** because the Ascendant's clock time depends on the birthplace,
which a chart image doesn't record.

Do not attempt this from memory — planetary transit dates must come from an
ephemeris. Use the bundled script, which implements the whole method (this is
also the 8-step manual procedure spelled out in
`references/birth-derivation-method.md`):

```bash
pip install pyswisseph          # once; built-in Moshier ephemeris, no data files
python scripts/derive_birth.py chart.json
```

where `chart.json` is the Part A output. With no argument the script runs the
bundled worked example (the chart that derives **1950–2025 → 4 March 2004,
~evening IST**). Flags:
- `--round` if you know a particular software rounds rather than truncates degrees.
- Widen/narrow the hunt by adding `"search_from_year"` / `"search_to_year"` to
  the JSON (default 1900–2025). If the native is clearly young or old, narrowing
  speeds things up; if step 1 finds no window, widen it.
- Add `"reference_locations": [["City", lat, lon], ...]` to solve the Lagna time
  for specific candidate birthplaces.

### Reading the script output
- **STEP 1-4** lists every Jupiter-in-X & Saturn-in-Y overlap window found.
- **STEP 5-6** prints the single derived **date of birth** and the Moon check.
- **STEP 7** prints the Lagna-rise time per city and a **tentative IST range**.
- **STEP 8** prints a full computed-vs-chart table and `FULL CHART MATCH`.
  Aim for `True`; it also reports the birthplace *longitude* that best
  reconciles the time-dependent bodies (Moon + Lagna) — a genuine clue to the
  native's birth region.

If `FULL CHART MATCH` is `False`, the mismatched rows tell you what's wrong:
a single planet off by a sign/degree almost always means that planet was
misread in Part A (re-extract it); a Moon that only floors correctly at some
longitudes is normal and simply reflects the unknown birthplace.

### How to report Part B to the user
State the **date of birth** plainly and with confidence. Give the **time as a
range** (e.g. "~6:45–7:15 PM IST"), explain it is tentative pending the exact
birthplace, and show the Step-8 verification table so the fit is transparent.
Never present the tentative time with false precision.

---

## Scope & assumptions
- **Ayanamsha: Lahiri (Chitrapaksha)**, sidereal — the standard for these charts.
- Handles the 9 classical grahas plus Uranus/Neptune/Pluto and the Lagna.
- Whole-sign houses (House 1 = Ascendant's whole sign), matching North Indian
  D1 convention.
- Times are computed and reported in **IST** by default; adjust if the native is
  known to be born elsewhere.
