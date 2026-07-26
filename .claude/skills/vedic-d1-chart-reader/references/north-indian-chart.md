# Reading a North Indian D1 / Rashi chart image

## The fixed-layout principle

A North Indian chart is a square with both diagonals drawn and an inner diamond
(rhombus) connecting the midpoints of the four sides. This makes **12 cells
whose positions never change**. Because the houses are fixed, the software does
**not** print house numbers — instead it prints, inside each cell, the **number
of the zodiac sign** occupying that house (1 = Aries … 12 = Pisces), plus any
planet glyphs that fall in that house.

So reading the chart is three tasks:
1. Read the **sign-number in the top-centre cell** → that is the Ascendant sign.
2. Read the sign-number in every other cell (they must run consecutively).
3. Decide **which cell each planet glyph sits in**.

## Cell positions (memorise this map)

```
        ┌───────────────────────────────────────┐
        │ ╲          │    H1    │          ╱ │
        │   ╲   H2   │  (Lagna) │   H12  ╱   │
        │ H3   ╲     │          │     ╱  H11 │
        │        ╲   │          │   ╱        │
        │ ─────────╲ │          │ ╱───────── │
        │ H4         ╳ (centre) ╳        H10 │
        │ ─────────╱ │          │ ╲───────── │
        │        ╱   │          │   ╲        │
        │ H5   ╱     │          │     ╲  H9  │
        │   ╱   H6   │    H7    │   H8   ╲   │
        │ ╱          │          │          ╲ │
        └───────────────────────────────────────┘
```

Authoritative positions (this list wins over the sketch above):

| Cell | Position in the square |
|------|------------------------|
| **H1** | top-centre diamond (points down to centre) — **always the Ascendant** |
| H2 | top-left triangle, along the **top** edge |
| H3 | upper-left triangle, along the **left** edge |
| H4 | left-centre diamond (points right to centre) |
| H5 | lower-left triangle, along the **left** edge |
| H6 | bottom-left triangle, along the **bottom** edge |
| H7 | bottom-centre diamond (points up to centre) |
| H8 | bottom-right triangle, along the **bottom** edge |
| H9 | lower-right triangle, along the **right** edge |
| H10 | right-centre diamond (points left to centre) |
| H11 | upper-right triangle, along the **right** edge |
| H12 | top-right triangle, along the **top** edge |

Houses run **counter-clockwise** starting from the top-centre: H1 (top-centre)
→ H2 (top-left) → H3 (left-upper) → H4 (left-centre) → H5 (left-lower) → H6
(bottom-left) → H7 (bottom-centre) → H8 (bottom-right) → H9 (right-lower) → H10
(right-centre) → H11 (right-upper) → H12 (top-right).

## Signs and the Ascendant

The sign-numbers increase by exactly **+1** counter-clockwise, in step with the
houses. So the moment you read House 1's number you know all twelve:

> If House 1 shows **5** (Leo), then H2=6, H3=7, H4=8 … wrapping H8=12, H9=1,
> H10=2, H11=3, H12=4.

**Consistency check:** read all twelve printed numbers and confirm they form a
consecutive run (wrapping 12→1) as you go counter-clockwise. If they don't, a
cell was misread — fix it before continuing.

Sign numbers → names: 1 Aries, 2 Taurus, 3 Gemini, 4 Cancer, 5 Leo, 6 Virgo,
7 Libra, 8 Scorpio, 9 Sagittarius, 10 Capricorn, 11 Aquarius, 12 Pisces.

## THE decisive rule for placing planets

**A planet belongs to whichever yellow-bordered cell its glyph physically sits
in — full stop.** The diagonal boundary lines split each corner of the square
into two different houses, so two cells can share a corner and look adjacent
while being different houses.

Do **not** assign a planet by:
- the sign-number it looks nearest to — a cell's sign-number and its planets are
  often pushed to *opposite* sides of the same triangle, so a planet can sit
  right beside the **neighbouring** house's number yet still be across the
  boundary line;
- astrological plausibility — never reason "Venus can't be far from the Sun, so
  it must be in that house." Geometry decides; astrology is only a later
  cross-check.

> **Worked correction (real case):** a Venus glyph in the bottom-right corner
> sat visually close to the "12" (House 8) label, and its small Sun-elongation
> made Pisces look tidy — but the glyph was on the far side of the diagonal, in
> the House 9 cell (Aries). House 9 was correct. When geometry and "tidiness"
> disagree, geometry wins.

When a glyph is genuinely near a diagonal, trace the yellow line and ask which
side of it the centre of the glyph falls on. That side's cell is the house.

## Degrees

The small number at a glyph's **upper right** is the planet's degree **within
its sign** (0–29). Charting software almost always **truncates** (floors) this
value, so a printed "20" means the true longitude is in [20°, 21°). Keep it as
the integer shown; Part B relies on this truncation convention.

The Ascendant degree may be printed next to a "ल" (Lagna) marker inside House 1,
or shown separately — record it the same way.

## Planet → house → the output

Derive each planet's **house number** from its sign using whole-sign houses:
House 1 is the Ascendant's whole sign, and the house number of a planet is
`((planet_sign_index − ascendant_sign_index) mod 12) + 1`. Report houses in the
human-readable table; the JSON only needs sign + degree (+ conditions).

See `glyphs.md` for the planet-letter table and the condition-symbol legend, and
`../assets/example_chart.json` for a complete, correct extraction to model your
output on.

## Final sanity checks
- Twelve sign-numbers read consecutively (wrapping) counter-clockwise.
- Rahu and Ketu are exactly 6 houses / 180° apart and share the same degree.
- Any planet you marked combust (अस्त) is within ~10–15° of the Sun.
- The Ascendant sign equals the sign-number in the top-centre cell.
If a check fails, the likeliest cause is a mis-placed planet or a misread
cell — revisit the image rather than trusting the first pass.
