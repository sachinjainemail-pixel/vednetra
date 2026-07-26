# Planet glyphs and condition symbols

## Planet abbreviations (first Hindi letter of the name)

Each planet is shown as the first letter (or first two, for the outers) of its
Sanskrit/Hindi name. The colour is decorative; rely on the letter.

| Glyph | Devanagari | Planet | Sanskrit name |
|-------|-----------|--------|---------------|
| सू | सूर्य | **Sun** | Surya |
| च | चंद्र | **Moon** | Chandra |
| मं | मंगल | **Mars** | Mangal |
| बु | बुध | **Mercury** | Budha |
| गु | गुरु / बृहस्पति | **Jupiter** | Guru / Brihaspati |
| शु | शुक्र | **Venus** | Shukra |
| श | शनि | **Saturn** | Shani |
| रा | राहु | **Rahu** (north node) | Rahu |
| के | केतु | **Ketu** (south node) | Ketu |
| यू | यूरेनस | **Uranus** | (transliteration) |
| ने | नेप्च्यून | **Neptune** | (transliteration) |
| प्लू | प्लूटो | **Pluto** | (transliteration) |
| ल | लग्न | **Lagna / Ascendant** marker | Lagna |

Notes:
- **श (Saturn) vs शु (Venus):** the difference is the trailing ुvowel. शु = Venus,
  plain श = Saturn. Read carefully — this is the easiest glyph pair to confuse.
- **च is Moon** (Chandra), not Mercury. Mercury is बु.
- **ल (Lagna)** is not a planet; it marks the exact Ascendant point and its
  degree, and always sits in House 1.
- Software varies: some use बृ for Jupiter or र for Rahu. Map by the name's first
  letter if you see a variant.

## Condition symbols (the peach legend box)

Charts print a legend at the bottom. The symbols attach to a planet glyph (often
as a superscript/adjacent mark) and mean:

| Symbol | Devanagari | Meaning | Notes |
|--------|-----------|---------|-------|
| `*` | वक्री | **Retrograde** (vakri) | Rahu & Ketu are always retrograde, so they usually carry it |
| `^` | अस्त | **Combust** (asta) | planet too close to the Sun; happens to Mercury/Venus/Mars/Jupiter/Saturn, never the Moon-nodes |
| `□` | वर्गोत्तम | **Vargottama** | same sign in D1 and D9 |
| `↑` | उच्च | **Exalted** (uccha) | |
| `↓` | नीच | **Debilitated** (neecha) | |

Watch the difference between `^` (अस्त, combust) and `↑` (उच्च, exalted) — they
are different symbols with very different meanings. If unsure which a mark is,
cross-check: a combust planet is within ~10–15° of the Sun's longitude; an
exalted planet is in its known exaltation sign (Sun–Aries, Moon–Taurus,
Mars–Capricorn, Mercury–Virgo, Jupiter–Cancer, Venus–Pisces, Saturn–Libra).

## Recording conditions

In the JSON, put a `conditions` array on any planet that carries a symbol, using
lower-case keywords: `"retrograde"`, `"combust"`, `"vargottama"`, `"exalted"`,
`"debilitated"`. Omit the array when there is none. Part B independently
recomputes retrograde and combust from the ephemeris, so those two also act as a
cross-check on your reading.
