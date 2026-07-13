# EDUCATION

**n = 50 natives** (Raman charts with confirmed answers).

**Outcome distribution (bucketed):**
- **below-graduate** (8th/10th/12th/diploma): **13** — 752,754,758,762,764,768,773,788,820,824,826,829,830
- **graduate** (BA/BCom/BSc/BBA): **10** — 755,763,767,771,781,782,789,790,798,823
- **professional-or-higher** (BTech/BE/MBA/CA/MA/MSc/LLB/medical/PG): **27** — 753,757,761,765,772,774,777,780,792,793,794,795,796,800,801,802,803,804,811,813,814,815,816,819,822,825,827

Key base-rate fact: **54% of the sample is professional-or-higher** (engineering + MBA/CA dominate). "Professional" is therefore the correct *default* unless the chart shows clear weakness markers.

---

### Diagnostic factors (ranked)

1. **Mercury exalted/own AND not combust → professional (strongest clean signal).** 5/5 hit: 761(exa,LLB), 795(exa,BTech-MBA), 804(exa,PG), 815(exa,BCom+CA), 825(own,PG-MBA). Note the *combust* caveat: Mercury exalted-but-combust does NOT confer it — 762(exa+comb→10th), 829(exa+comb→10th).

2. **Jupiter exalted/own → professional.** 10/13 hit (753,757,772,774,777,801,802,811,816,803). Misses: 768 (exa+retro H11 → 10th, "thagi" yoga), 771 (exa → only graduate), 823 (own → BA, poverty).

3. **Jupiter debilitated (Capricorn) → NOT professional (below/graduate).** 7/8: 764,773,788,820 (below); 767,790,798 (graduate). Only miss: 813 (deb → PG anomaly).

4. **5th lord debilitated / combust / in dusthana (6-8-12), or ≥2 malefics packed in the 5th → below-graduate.** 758(Sat deb H8→12th), 824(Ven deb→12th), 752(Sun+Sat+debMerc in 5th→12th), 788(Mars comb H6→10th).

5. **Mercury debilitated OR combust+retrograde, with no strong Jupiter → caps at/below graduate.** 752,754,826,829,830 (below); 755,798 (graduate).

6. **9th-lord exalted/own or a benefic/exalted planet tenanting the 9th** lifts toward higher study (761 9L Me exa H12→LLB; 774 9L Me exa in 9th→Civil; 827 exa Sun in 9th→CS). Weakly predictive alone (false-positives 824, 829).

---

### Decision procedure

Compute an **Education Strength Score S = J + M + L + B**:

- **J (Jupiter):** exalted/own = **+3**; debilitated = **−3**; else 0. (−1 more if combust.)
- **M (Mercury):** exalted/own AND not combust = **+2**; debilitated OR (combust+retro) = **−2**; combust only = **−1**; exalted/own but combust = net **−1**; else 0.
- **L (5th lord):** if 5th lord ≠ Jupiter: exalted/own +2, debilitated −2, else 0. Then house: +1 if in 5th/9th, −1 if in 6/8/12 or combust. If 5th lord *is* Jupiter, use house term only (dignity already in J). Clamp to [−3,+3].
- **B (boosters, +1 each, cap +2):** (a) 9th lord exalted/own OR unafflicted benefic/exalted planet in 9th; (b) exalted planet or Jupiter/Moon in the 5th; (c) a real education yoga (benefic Panchamahapurusha, trikona-lord Parivartana, Bhadra = Mercury exa/own in a kendra).

**Bucket:** S ≤ −1 → **below-graduate**; S = 0 or +1 → **graduate**; S ≥ +2 → **professional-or-higher**.

---

### Back-test result

**Exact bucket: 27/50 (54%). Within-one-bucket: 47/50 (94%).** Only 3 charts miss by two buckets.

By bucket: below 9/13, graduate 3/10, professional 15/27.

**Miss list (exact):**
- *Below predicted higher:* 762(→grad; many exaltations yet 10th), 824(→grad; Jup in 9th false-positive), 829(→grad; exa-Merc combust), **768(→prof, off-2; exalted-retro Jupiter "thagi" yoga)**.
- *Graduate predicted wrong:* 755,767,790,798(→below; all weak charts that still cleared a degree), 771,789,823(→prof; strong markers but stopped at graduate — 823 by poverty per FACT).
- *Professional predicted lower:* 765,780,792,793,794,796,803,819,822,827(→grad; weak-to-average charts that reached prof via single yogas/base-rate), **813(→below, off-2; deb-Jupiter chart yet PG), 814(→below, off-2; combust-retro Mercury yet MA)**.

The systematic bias: the model under-calls the huge professional bucket — many engineers/MBAs here have unremarkable charts and reach professional on the sample's high base rate rather than on strong classical markers.

---

### Highest-signal rules

1. **Mercury exalted/own & not combust ⇒ professional.** 5/5 (761,795,804,815,825).
2. **Jupiter exalted/own ⇒ professional.** 10/13 (753,757,772,774,777,801,802,803,811,816).
3. **Jupiter debilitated (Capricorn) ⇒ not professional** (below/graduate). 7/8 (764,767,773,788,790,798,820).
4. **5th lord debilitated/combust OR 5th house holds ≥2 malefics ⇒ below-graduate.** 752,758,788,824.
5. **Mercury debilitated or combust+retrograde with a non-strong Jupiter ⇒ ≤ graduate.** 752,754,826,829,830.
6. **Default to professional** when none of rules 3–5 fire (sample base rate 54%).

---

### Caveats

- **Graduate is the weak bucket (3/10).** It is a narrow middle band; "graduate" actuals scatter to both extremes (798,767 look weak; 771,823 look strong), so it is intrinsically hard to isolate.
- **Combustion flips exaltation.** Exalted-but-combust Mercury/Jupiter behaves *weakly* (762, 829, 768) — the model already docks combustion, but three misses still trace to it.
- **External facts override the chart.** 823 (own-Jupiter) stopped at BA purely due to family poverty (stated FACT); no chart rule recovers this.
- **True anomalies (813, 814):** genuinely weak charts (deb Jupiter / combust-retro Mercury) that produced PG/MA. These are the only off-by-two misses and are not fixable without over-fitting.
- **Dasha timing** (Maha@2026, study-period lord) is cited in several REASONs but was not usable as a systematic factor without birth dates; it likely explains some residual misses.
- Sample skews heavily technical (engineering/MBA), so the 54% professional base rate — and hence the "default professional" rule — may not transfer to a general population.
