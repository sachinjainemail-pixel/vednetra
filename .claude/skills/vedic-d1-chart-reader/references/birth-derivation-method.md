# Reverse-deriving birth date & time — the method

The goal: given only the sidereal (Lahiri) sign + degree of every planet and the
Lagna, recover **when** the native was born. `scripts/derive_birth.py` automates
all of this; this file explains what it does and why, so you can interpret its
output and troubleshoot.

## Why it works

Planets move at wildly different speeds. That spread is what lets a static chart
name a moment in time:

- **Saturn** crosses a sign in ~2.5 years, **Jupiter** in ~1 year. The *pair* of
  signs they occupy repeats only about **once every ~19–20 years** (their
  synodic cycle), and the exact pairing shown on a chart typically has just one
  or two candidate windows in a century.
- **The Sun** takes ~30 days per sign → fixes the **month**.
- **Mars, Mercury, Venus** move ~0.5–1.5°/day → their exact degrees fix the
  **day**.
- **The Moon** moves ~13°/day → confirms the day and helps with the hour.
- **The Ascendant** advances ~1° every 4 minutes (a whole sign every ~2 hours)
  → fixes the **time of day**.

Because the *combination* of all fast-planet degrees recurs only on the scale of
tens of thousands of years, the derived **date is unique**. The **time is
tentative** only because the Ascendant's clock time depends on the birthplace's
latitude/longitude, which a chart image doesn't carry.

## The 8 steps (as automated)

1. **Saturn's sign** → scan history for every window Saturn sits in it.
2. **Jupiter's sign** → scan for every window Jupiter sits in it, noting Saturn's
   sign during each.
3. **Match** the two → keep only intervals where *both* signs hold at once.
4. Those intervals are the **candidate years** (usually 1–2 in a century).
5. **The Sun's sign** discards candidate windows where the Sun isn't in the
   charted sign; then **Mars + Mercury + Venus** whole-degrees select the exact
   **day** (the script scores each day by total angular error and requires the
   floors to match).
6. **The Moon's** sign/degree confirms that day.
7. **The Ascendant** degree gives the **time**: the script finds when that Lagna
   degree rises, per candidate birthplace, and reports an IST range.
8. **Cross-check:** recompute the entire chart at the derived instant and compare
   every body's sign, degree, house, and condition (retrograde/combust) against
   the image. A correct derivation matches on all of them.

Step 8 is the real proof. If it matches fully, steps 1–7 were right; if one row
is off, that row points at either a misreading (Part A) or, for the Moon, the
unknown birthplace (see below).

## The degree-truncation convention

Software almost always **truncates** the printed degree (20.86° → "20"). The
script matches on the floor accordingly. Three planets in the bundled example
prove the convention (Venus 4.77→"4", Mercury 20.86→"20", Uranus 9.53→"9";
rounding would have shown 5, 21, 10). If you ever confirm a chart *rounds*
instead, pass `--round`.

This convention is also a bonus **constraint on the birthplace**: a charted
Moon that only floors correctly at some longitudes means the true Moon degree is
in the upper part of its bin, which happens a few minutes later — and for the
Lagna to still read its charted degree at that later instant, the birthplace
longitude is pinned to a region. The script reports the "most-consistent
birthplace longitude" from exactly this logic.

## Why the time is a range, not a minute

The Ascendant depends on where on Earth the native was born. Two people born the
same minute in Mumbai and Kolkata have different Ascendants; conversely, the same
Ascendant degree rises at different clock times in different cities. The script
therefore solves the Lagna-rise time for a spread of Indian cities and reports
the range. **Report the time as that range and say it is tentative** until the
user supplies the birth city — then it resolves to the minute.

## Troubleshooting

| Symptom | Likely cause / fix |
|---------|--------------------|
| Step 1–4 finds no window | Jupiter or Saturn sign misread in Part A; or search range too narrow — widen `search_from_year`/`search_to_year`. |
| Step 5–6 finds no exact day | A fast-planet (Sun/Mars/Mercury/Venus) degree or sign misread; re-extract those glyphs. |
| One planet is "X" in Step 8 | That single planet was misread — recheck its cell and degree in the image. |
| Moon is "X" at some cities but OK at others | Normal — reflects the unknown birthplace; take the city where the whole chart matches as the birth-region clue. |
| Retrograde/combust disagree with the chart | Re-examine the glyph's symbol against `glyphs.md`; the ephemeris values in Step 8 are authoritative for these two. |

## Assumptions
- **Lahiri (Chitrapaksha)** ayanamsha, sidereal.
- Built-in Moshier ephemeris (`pyswisseph`) — arc-second accuracy, no data files.
- Whole-sign houses.
- Times reported in **IST**; change the reference locations for other regions.
