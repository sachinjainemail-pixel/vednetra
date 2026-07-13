# HEALTH

n = 13 records (12 distinct natives; chart [829] appears twice for two different questions).

## Outcome distribution

| Bucket | Count | Records |
|---|---|---|
| Healthy | 1 | 764 |
| Cancer / malignant tumor (native) | 4 | 774, 782, 796, 762 (mouth ca + mental) |
| Mental illness (depression / psychiatric) | 3 | 824, 827, 762 (also mental) |
| Chronic endocrine–metabolic (thyroid, diabetes/BP) | 2 | 813, 826 |
| Congenital / structural deformity | 1 | 808 |
| Neuro (childhood fits/seizures) | 1 | 829a |
| Relational — illness of a family member, not native | 2 | 798 (brother's cancer), 829b (mother's operation) |

Base rate is lopsided: 12 of 13 answers involve some ailment (native or family), only **one** clean "Healthy." So a lazy "predict illness" scores ~92% on the binary — the real test is calling the **subtype** and correctly spotting the single healthy chart. Treat everything below as suggestive signatures, not a hardened rule; n per subtype is 1–4.

---

## Diagnostic factors (ranked)

**1. Lagna-lord in a dusthana (6/8/12) OR debilitated → serious / chronic disease of the body.** Strongest single signal.
- 774 LL Sa **H8**; 782 LL Ve **deb H12**; 796 LL Ma **H12**; 813 LL Ju **deb H11 (deb)**; 808 LL Su H11 combust with Sa+Ke.
- Contrast the healthy chart **764**: LL Moon in **H2**, not debilitated, not combust → clean. This is the clearest discriminator between the one healthy native and the ill ones.

**2. Moon in a dusthana (6/8/12) or conjunct/afflicted by Mars + a node → major illness, with a mental flavour when Mars/nodes touch the Moon.**
- Moon in 8/12: 774 Moon H8, 796 Moon H12, 813 Moon H8 (combust).
- Moon + Mars + node: **824** Moon H7 with **Mars(deb) + Rahu** = depression; **827** Moon H5 with **Mars(R) + Ketu** = psychiatric swings. This Moon+Mars+node stamp is the best "mental" marker in the set.
- Healthy 764: Moon in H2 with Rahu but **no Mars** and not in a dusthana → stays healthy. So Rahu-on-Moon alone is not enough; it needs Mars and/or a dusthana.

**3. Heavily loaded 8th or 12th (3+ occupants, or lagna-lord + 8th-lord + node together) → cancer / malignant tumor.**
- 796: **stellium Su+Mo+Ma in H12** (Mars is also 8th-lord) + Rahu on the 3/9 axis → 3rd-stage breast cancer.
- 774: LL(Sa) **and** Moon both in **H8**, node on 3/9 → brain-tumor cancer.
- 782: LL(Ve, also 8th-lord) **deb in H12**, node on 6/12 → mouth cancer.
- 813: triple occupancy of **H8 (Su+Mo+Me, all afflicted)** → but here it manifested as thyroid, not cancer (see caveats).

**4. Rahu–Ketu across the 3/9 or 6/12 axis co-present with factor 3 → tips "major/8th-house tumor" toward cancer specifically.**
- 762 Ra H3/Ke H9; 774 Ra H9/Ke H3; 782 Ra H12/Ke H6; 796 Ra H3/Ke H9. All four cancer natives carry the node axis on 3/9 or 6/12.

**5. Lagna-lord afflicted by a Saturn+Ketu (malefic) conjunction → congenital / structural deformity.**
- 808: LL Sun in H11 sitting with **Saturn(combust) + Ketu**; poster's own REASON = "malefic stellium in karaka sign, Ascendant lord afflicted." → deformity in both hands. Only 1 case, but the poster's stated logic matches.

**6. Active Mahadasha/Antardasha of a 6/8/12 lord at diagnosis → timing trigger.** Weak here because most "Maha@2026" values don't line up with the actual (earlier) diagnosis dates, and dasha-at-birth balance isn't the event dasha. Where checkable it's loose: 782 diagnosed Dec-2023 under Saturn maha (Sa is 4th/5th lord, not 6/8/12) — does **not** confirm the classical timing rule. Treat dasha as low-confidence for this file.

---

## Decision procedure

Apply in order; stop at the first that fires.

1. **Healthy check.** Is the lagna-lord (a) not debilitated, (b) not in 6/8/12, (c) not combust/not conjunct a malefic, AND is the Moon (a) not in 6/8/12 and (b) not conjunct Mars or a node? If BOTH clean → **Healthy**.
2. **Mental.** Moon conjunct Mars **and** a node (Rahu/Ketu), or Moon+node in a kendra/trikona with the mind-significators (Moon/Mercury) afflicted → **Mental illness (depression/psychiatric)**.
3. **Cancer / malignant tumor.** Lagna-lord AND (Moon OR 8th-lord) in 8/12 (or a 3+ stellium in 8/12), PLUS Rahu–Ketu on the 3/9 or 6/12 axis → **Cancer**.
4. **Chronic endocrine/metabolic.** Lagna-lord debilitated + 8th house loaded (Sun/Moon/Mercury), without the full cancer node-axis signature → **Chronic (thyroid / diabetes / BP)**.
5. **Congenital/structural.** Lagna-lord conjunct Saturn+Ketu (malefic stellium) → **Deformity / structural**.
6. **Else** → generic **chronic ailment present** (subtype unresolved; often neuro if Moon/Mercury afflicted, e.g. debilitated Moon + Rahu in 6th).
7. **Relational flag.** If the native's own lagna-lord/Moon are *clean* but the 6th (illness) or 4th/Moon (mother) or 11th/3rd (siblings) lord is afflicted, the illness may belong to a **family member, not the native** — lower confidence.

---

## Back-test result

Scored against CORRECT. "Exact" = right subtype bucket; "within-bucket" = correctly called healthy-vs-ill for the native's own body.

| # | Predicted | Actual | Exact? |
|---|---|---|---|
| 764 | Healthy (step 1) | Healthy | ✔ |
| 774 | Cancer (step 3) | Cancer (brain) | ✔ |
| 782 | Cancer (step 3) | Cancer (mouth) | ✔ |
| 796 | Cancer (step 3) | Cancer (breast) | ✔ |
| 824 | Mental (step 2) | Depression | ✔ |
| 827 | Mental (step 2) | Psychiatric (borderline) | ✔ |
| 813 | Chronic endocrine (step 4) | Thyroid | ✔ |
| 826 | Chronic (step 6) | Diabetes/BP + ear | ✔ (bucket) |
| 808 | Deformity (step 5) | Deformity both hands | ✔ |
| 762 | Cancer flagged, missed the *dual* mental dx | Mouth cancer + mental | ◑ partial |
| 829a | Generic chronic/neuro (step 6) | Childhood fits/seizures | ◑ partial |
| 798 | Relational flag (step 7) | Brother's cancer | ◑ (called relational, not exact organ) |
| 829b | Relational flag (step 7) | Mother's operation | ◑ (called relational) |

- **Exact subtype: 9/13** (764, 774, 782, 796, 824, 827, 813, 826, 808).
- **Partial: 4/13** (762 caught cancer but not the co-morbid mental; 829a caught "ailment present" but not the exact neuro label; 798 & 829b correctly flagged as *relational* rather than the native's own body, which is the right call but not an organ-level answer).
- **Native-own healthy-vs-ill binary: 11/11 correct** (all 11 native-body questions classified on the right side; the 2 relational cases excluded).

**Miss analysis.**
- **762** is the instructive exception: lagna-lord Mars is **exalted in H3** (clean by step 1), yet the native has cancer AND mental illness. The disease shows instead through the **combust exalted 8th-lord Mercury** and the 3/9 node axis. Lesson: a strong lagna-lord does **not** rule out disease if the 8th-lord is combust/afflicted — add "8th-lord combust or debilitated" to the cancer/major screen.
- **798 / 829b** are not native-illness at all (brother, mother). Their charts have relatively clean lagna-lord/Moon, which is *why* the disease displaces to the 11th/3rd (siblings) or 4th/Moon (mother). The procedure only catches these via the relational flag — genuinely hard to call the exact relative from the chart alone.
- **829a** (same chart as 829b): lagna-lord Mercury is exalted but **combust + retrograde**, Moon **debilitated in H3**, Rahu in H6 — enough to say "childhood affliction present," but the file gives no crisp seizure signature to isolate it from other neuro problems.

---

## Highest-signal rules

1. **Clean lagna-lord + clean Moon = healthy.** The lone healthy chart (764) is the only one where the lagna-lord is un-afflicted (Moon H2, not deb/comb) AND the Moon avoids Mars/node/dusthana. Every ill native fails at least one of these. (support: 764 vs. 774/782/796/813/808 all failing).
2. **Lagna-lord OR 8th-lord in 8/12 (esp. debilitated), with the Moon also in 8/12 → cancer/tumor.** 3 of 4 native-cancer charts: 774 (LL+Moon H8), 782 (LL/8L deb H12), 796 (LL+Moon H12, 8L in stellium).
3. **Rahu–Ketu on the 3/9 or 6/12 axis is present in 100% of cancer natives here** (762, 774, 782, 796) — a useful confirmer, not a standalone trigger (764 also has a node in H2/H8 but stays healthy, so it needs rule 2 to fire).
4. **Moon + Mars + node (Rahu/Ketu) together = mental illness.** 824 (Moon+Mars+Rahu H7 → depression) and 827 (Moon+Mars+Ketu H5 → psychiatric). Both hit; no false positive among the healthy/other charts.
5. **Debilitated lagna-lord + a loaded 8th house (Sun/Moon/Mercury) → chronic endocrine (thyroid/metabolic).** 813: LL Jupiter deb + Su/Mo/Me all in H8 → lifelong thyroid.
6. **Lagna-lord boxed with Saturn + Ketu → congenital structural deformity** (808, and matches the poster's own stated reasoning).

---

## Caveats

- **n = 13, badly unbalanced.** Only ONE healthy native, and most subtypes have 1–2 examples (deformity, neuro, thyroid = n of 1 each). Rules 1, 4, 5 rest on single or double cases; do not over-trust them. The 9/13 "exact" rate is optimistic because rules were partly fit on the same natives.
- **Cancer vs. non-cancer major illness is not cleanly separable in this data.** Chart 813 has the classic loaded-8th signature (three planets in the 8th) yet manifested as **thyroid, not cancer**; chart 762 has a *strong* lagna-lord yet got cancer. So the 8th-house load tells you "major chronic disease," not reliably "cancer" — the node-axis (rule 3) and dusthana lagna-lord (rule 2) are what nudge it toward cancer, and even that is only 4 data points.
- **Organ/location is largely unresolved by the chart tokens.** Mouth cancers (762, 782) vs brain (774) vs breast (796) don't share a clean 2nd-house / karaka differentiator in this file; I could not derive a reliable "which organ" rule.
- **Dasha timing is the weakest link.** The provided dashas are birth-balance and mid-2026 values, which mostly post-date the actual diagnoses; where checkable they do **not** confirm the classical "6/8/12-lord dasha at diagnosis" rule (e.g. 782 diagnosed under a Saturn maha that rules the 4th/5th). I did not rely on dasha for any prediction.
- **Relational cases (798 brother, 829b mother) are a real trap:** a comparatively clean native chart can still yield an "illness" answer that belongs to a relative. Without knowing the question was about the native vs family, the exact answer is not derivable — only the relational *flag* is.
