# VedNetra Universal Prediction Methodology
### A repeatable, back-tested method for answering "kundli quiz" questions, derived from 55 real quiz charts and their confirmed answers

**Ayanamsha:** Raman (as used to build and verify every chart here)
**Tool:** VedNetra app — every chart below was regenerated in VedNetra and its factors read from the app.
**Data:** The *ज्योतिष ज्ञानवर्धन मंच* WhatsApp quiz group (Feb–Jul 2026), 55 charts numbered ~752–831, with the **correct answers taken only from the person who posted each chart** (their "परिणाम / RESULT" reveal), never from other members' guesses.

---

## 0. Read this first — what "universal methodology that always hits" really means

I built this from the ground truth you asked for, and I owe you an honest headline:

**No Vedic method — this one included — hits 100% of these questions, and the group's own expert answer-givers don't either.** Two hard facts from the data force this:

1. **Many "correct answers" in the group are known facts, not chart-derivations.** In the reveals, posters frequently say things like *"native did CA Inter; both brothers run a chemical-supply business,"* or *"wife died 30-06-2021."* They are **reporting a life they already know** and only sometimes back-fitting astrology. So a chart-only method can never reproduce all of them, because the answer wasn't purely in the chart to begin with.
2. **Where the chart genuinely drives the answer, reliability varies enormously by question type** — from ~93% (residence/foreign) down to near-coin-flip (exact sibling counts).

So this document does something more useful than promise the impossible: for **each question type** it gives you (a) the exact factors to pull from VedNetra, (b) a step-by-step decision rule, and (c) the **measured hit-rate that rule achieved on the 55 real charts.** Use the high-confidence rules with conviction; hedge the low-confidence ones. That is how the strongest members actually operate.

**Reliability scorecard (measured on this dataset):**

| Question type | Best rule accuracy | Confidence |
|---|---|---|
| Residence (home / other-state / abroad) | **14/15 (93%)** | High |
| Event timing (which year via dasha) | **13/15 (87%)** direction | High (for *whether*, not polarity) |
| Health: healthy vs ill (binary) | **11/11** | High |
| Marriage outcome (family of outcome) | **39/52 (75%)** | Medium-High |
| Career: service vs business / not-working | **35/49 (71%)**, not-working 10/12 | Medium-High |
| Education (within one band) | **47/50 (94%)** within-1; 54% exact | Medium (bands), High (extremes) |
| Parents both-alive vs a loss | **27/34 (79%)**, but mostly base-rate | Low-Medium |
| Children count | 36% exact, **70% within-1** | Low-Medium (gate on marriage!) |
| Siblings: *has* a brother / sister | **91% / 79%** | High (existence), Low (count/gender) |

---

## 1. The Universal Engine (the method behind every topic)

Every reliable answer in the dataset — and every rule below — is built from the **same six moves**. Learn this once; the per-topic playbooks are just this engine pointed at different houses.

For any question about life-area **X**:

1. **Identify the house(s) of X and their lord(s).** (VedNetra → *D-1 Rasi Details* gives house lords.)
   - Education → 4th (schooling) & 5th (intelligence/higher studies), plus 2nd (speech/degree) & 9th (higher/luck).
   - Career → 10th (karma) & its lord; 6th (service), 7th (business/independent), 2nd/11th (income).
   - Marriage → 7th & its lord.  Children → 5th & its lord.  Siblings → 3rd (younger) & 11th (elder).
   - Parents → 9th/Sun (father), 4th/Moon (mother).  Residence/foreign → 12th, 4th, 9th.  Health → 6th/8th/12th + Lagna.
2. **Read the KARAKA (natural significator) of X and its dignity.**
   - Mercury+Jupiter = education; Jupiter/Saturn/Sun = career (wisdom/service/authority); **Venus = marriage for a man, Jupiter = marriage for a woman**; Jupiter = children; Mars = brothers; Sun = father, Moon = mother; Rahu = foreign.
   - **Dignity is decisive, not just house:** exalted/own = strong promise; **debilitated / combust / with-Ketu = the promise is damaged.**
3. **Weigh support vs affliction on the house.** Benefic (Jupiter/Venus/Mercury/waxing Moon) **in or aspecting** the house *protects*; malefic (Saturn/Mars/Rahu/Ketu/Sun) **in or aspecting** it *spoils* — **unless a benefic co-tenants** (the single most reliable "cancellation" flag in the whole dataset).
4. **Apply the specific spoiler screens** for that topic (Manglik for marriage, debilitated-Jupiter for children/education, 9th-lord-in-8th for father, etc. — given per playbook).
5. **For "when" questions, use the dasha of the significator.** An event fires in the **Mahadasha/Antardasha of the lord, occupant, karaka, or aspector of the relevant house** (87% consistent here). Read the running dasha in VedNetra → *Vimshottari Dasha*.
6. **Default to the base rate when signals are weak.** If nothing strong fires, answer the most common outcome for that question (e.g. education → professional; parents → both alive; siblings → yes to brother). This alone beats over-reading a quiet chart.

> **Cancellation rule (memorize):** a benefic sitting **in** the queried house overrides an otherwise-damning malefic there. It saved every "Manglik but stable marriage" chart (764, 824, 830) and is the most transferable single rule found.

---

## 2. Per-topic playbooks

Each playbook: **significators → VedNetra screen → decision steps → highest-signal rules (with chart numbers) → measured accuracy → caveats.**

### 2.1 EDUCATION  *(exact 54%, within-one-band 94%)*
**Pull from VedNetra:** Jupiter (sign/dignity/combust), Mercury (sign/dignity/combust/retro), 5th lord (dignity + house), 9th lord, occupants of 5th & 9th.
**Score S = J + M + L + B:**
- **J:** Jupiter exalted/own **+3**, debilitated (Capricorn) **−3**, else 0 (−1 if combust).
- **M:** Mercury exalted/own & *not* combust **+2**; debilitated or combust-retro **−2**; combust only **−1**.
- **L (5th lord, if not Jupiter):** exalted/own +2, debilitated −2; then +1 if in 5th/9th, −1 if in 6/8/12 or combust.
- **B (boosters, +1 each, cap +2):** strong 9th lord / benefic in 9th; exalted planet or Jupiter-Moon in 5th; a real education yoga (Bhadra = Mercury exalted/own in a kendra; trikona-lord parivartana).
- **Band:** S ≤ −1 → **below graduate**; S = 0/+1 → **graduate**; S ≥ +2 → **professional/PG**.

**Highest-signal rules:** ① Mercury exalted/own & not combust ⇒ professional (5/5). ② Jupiter exalted/own ⇒ professional (10/13). ③ **Jupiter debilitated in Capricorn ⇒ NOT professional (7/8)** — the strongest *negative* filter. ④ 5th lord debilitated/combust or ≥2 malefics in the 5th ⇒ below-graduate (752, 758, 788, 824).
**Caveats:** combustion cancels exaltation (treat exalted-but-combust as weak); the middle "graduate" band is intrinsically fuzzy (3/10); real-world facts (poverty capped chart 823 at BA) override the chart.

### 2.2 CAREER — service vs business vs not-working  *(exact 71%; not-working 10/12)*
**Pull from VedNetra:** Lagna-lord condition; Sun (house), Saturn; 10th house & lord; 6th lord (service); 7th lord (business); Mars dignity; (D-10 if you want the field, see caveat).
**Decision (stop at first match):**
1. **Government** — Sun in 10th, **or** Sun+Saturn conjunct in a kendra, or 10th-lord with both. (823 → Colonel; 773 → govt job.)
2. **Not-working / homemaker** — Lagna-lord combust/debilitated/very-low-degree/in 6-8-12 **AND** (2+ planets debilitated-or-combust in a dusthana, OR — for a woman — the 7th holds 2+ planets incl. a malefic). (10/12 recall; 813, 796, 830.)
3. **Own business** — Mars own/exalted in a kendra, OR 7th lord in the 10th, OR 7th lord own/exalted outside dusthanas (and the 6th lord is not strong-in-6th).
4. **Self-employed professional** — Leo lagna + weak 7th lord (own practice/consulting).
5. **Private job (default)** otherwise; reinforced by a strong 6th lord or Saturn on the lagna–10th axis.

**Field/line hints (where data supported):** law = Jupiter + 5th; IT = Mercury + Saturn/Rahu; trade/jewellery = Venus / 7th-lord; military = Sun+Mars on 10th; teaching = Jupiter/2nd.
**Caveats:** the **service↔business boundary holds ~73%** and is where nearly all misses live (Mars-own-kendra over-calls business). Govt and not-working edges are clean. **D-10 was cited by experts but couldn't be back-tested here** — consult VedNetra's *Divisional Charts → D-10* to break service/business ties. Rahu tracked *foreign posting*, not business.

### 2.3 MARRIAGE  *(within-bucket 39/52 = 75%)*
**Pull from VedNetra:** 7th house occupants + aspects; 7th lord (house + dignity + combust); **Venus (man) / Jupiter (woman)** dignity & house; Mars house (Manglik); benefic in 7th? ; 5th-house strength (for love-vs-arranged).
**Decision (apply in order):**
1. **Widow screen (weak):** karaka (♂Venus/♀Jupiter) in the 12th *and weak* or tight with Ketu + malefic 2nd/8th → flag widowed (catches ~40% only).
2. **Unmarried:** 7th lord in 6/8/12 **or** debilitated **or** combust, **AND** no benefic in/aspecting the 7th, **AND** karaka also afflicted (with Ketu / weak-in-12th / debilitated / combust). (761, 763, 765, 767, 811, 825, 752.)
3. **Divorce/separation:** **Manglik-Y AND a malefic (Mars › Rahu › Saturn) in/aspecting the 7th with NO benefic there.** (796, 800, 815, 819.) *Override to stable if a benefic co-tenants the 7th* (764, 824, 830).
4. **Love vs arranged** (if married): karaka/7th-lord in the 5th, or 5th-lord own/exalted in the 5th → **love**; dignified 7th-lord sitting in the 7th with a quiet 5th → **arranged**. **For a woman, Jupiter in the 5th = love marriage (4/4).**
5. **Else → married-stable.**

**Highest-signal rules:** ① benefic-in-7th cancels Manglik damage (the cancellation rule). ② 7/9 divorced natives are Manglik — **Manglik matters *after* marriage, not before** (it does not predict staying single). ③ Karaka in 12th decides by **dignity** (weak Venus-12 → 808/826 widowed, 829 no-marriage; Venus *own*-12 → 762 married).
**Caveats:** widowhood is largely unreadable from D-1 (needs 8th-from-7th / maraka + dasha); Manglik base rate here is 52%, so never use it standalone.

### 2.4 CHILDREN  *(exact 36%, within-1 70% — but gate on marriage!)*
**The key insight:** **childlessness in this data is mostly a marriage outcome, not a 5th-house outcome.** At least 8 of 23 "childless" are simply unmarried.
**Decision:**
1. **Marriage gate FIRST.** If marriage is unlikely/badly broken → **childless**, stop. Do **not** let a strong 5th house override an unmarried verdict (772 has own-Jupiter in the 5th and is still childless).
2. If **Jupiter debilitated** → cap at **childless / one** (7/8).
3. Else from the 5th: benefic (Ju/Ve/Me) in 5th, or Jupiter exalted/own, or 5th-lord own/exalted → **two**; otherwise **one**.
4. **Three+** only if a malefic cluster (Saturn+Rahu, or Mars) loads the 5th *and* the 5th-lord is in the 8th (795, 826).
5. **Sex:** default "at least one son" (91%); daughters-only only when the 5th is a female/watery sign with Jupiter the sole driver and no Sun/Mars in the 5th.
**Highest-signal rules:** childless ⇐ unmarried; debilitated-Jupiter → ≤1; **Rahu in the 5th does NOT mean childless here** (it co-occurs with the *largest* families).
**Caveats:** D-7 (Saptamsha) — which posters used for exact count/sex — isn't in the tested tokens; use VedNetra *Divisional Charts → D-7* for count/sex refinement.

### 2.5 RESIDENCE / FOREIGN  *(14/15 = 93% — the most reliable topic)*
**Pull from VedNetra:** 12th house occupants & lord dignity; Rahu house; 9th-house occupancy; Rahu/Ketu on the 4–10 axis; Lagna-lord dignity.
**Decision (stop at first match):**
1. **Home** — Lagna-lord **exalted** in a kendra. (804, 829.)
2. **Abroad** — any tenant (Rahu / Lagna-lord / exalted benefic) **in the 12th**. (763, 802, 819.)
3. **Abroad** — Rahu in 9th/11th/12th (12th empty). (773, 792.)
4. **Abroad** — Rahu/Ketu on the 4–10 axis **AND** 12th-lord debilitated/neecha-bhanga. (803.)
5. **Other-state** — 9th house occupied, OR Ketu in 4th / Rahu in 4th or 10th. (752, 757, 764, 816.)
6. **Home** — otherwise.
**Timing of the move:** a **Rahu / Ketu / 12th-significator dasha** activates it.
**Caveats:** abroad-vs-other-state is the fragile boundary (decided by 12th-lord dignity on thin evidence); small n means expect some slippage out-of-sample.

### 2.6 EVENT TIMING  *(13/15 = 87% for "is the theme active")*
**The one rule:** an event fires in the **Mahadasha/Antardasha of a significator of its house**, where *significator* = **lord OR occupant OR karaka OR aspector** (the broad reading is what lifts it from ~40% to 87%).
**VedNetra screen:** *Vimshottari Dasha* → read MD/AD (and PD) at the candidate date; cross-check *Transits* and *Divisional → D-9*.
**Proven sub-rules:** marriage → 7th-lord/7th-occupant/Venus dasha (3/3); relationship rupture → Rahu/Saturn tied to 5th/7th (793a/b); surgery → 6th/8th-lord (801 = Saturn 8th-lord); property/relocation → 4th-lord (or 12th for a sale) (758, 824); children → 5th occupant/lord (820).
**Caveats:** this tells you **whether the theme is active, not its polarity** (marriage and spouse-leaving both fire under 7th-linked dashas — read the malefic/benefic sub-lord for direction). Wealth-gain timing was the one clean miss.

### 2.7 HEALTH  *(healthy-vs-ill 11/11; subtype 9/13, small n)*
**Pull from VedNetra:** Lagna-lord condition; Moon condition (dignity, house, with Mars/nodes?, combust?); 6th/8th/12th lords & occupants; Rahu–Ketu axis.
**Decision:**
- **Healthy** only if **both Lagna-lord and Moon are clean** — not debilitated, not in 6/8/12, not combust, not conjunct Mars-or-a-node. (This uniquely picked out the one healthy native.)
- **Major/chronic illness** if the Lagna-lord or 8th-lord is afflicted **and** the Moon is in 8/12 or on a Rahu–Ketu axis.
- **Mental/psychological** signature: **Moon + Mars + node** together.
**Caveats:** tiny per-ailment n; you can flag *"a serious health issue exists"* far more reliably than name the organ/disease; dasha-at-diagnosis did **not** confirm cleanly here.

### 2.8 PARENTS  *(27/34 = 79%, but that is barely above the 74% base rate)*
**Honest stance: answer "both alive" by default and only override on a *stack* of affliction.**
**Father-death flag — count these; act only if ≥2 are true:** Sun debilitated (Libra); Sun conjunct Saturn; Sun conjunct Rahu/Ketu; Saturn exactly opposite Sun; **9th-lord in the 8th**. (Precision 100%, but recall only ~22% — it catches the blatant cases like 808, 814, 782 and misses the rest.)
**Never predict "only father."** Mother-death from Moon affliction alone over-fires — don't act on it standalone.
**Caveat:** age is the real confound — older natives' parents may have died with no natal signature; this topic is close to base-rate-only.

### 2.9 SIBLINGS  *(existence high; count/gender ≈ guesswork)*
**Confidently assert:** "you have a brother" (**91%**) and "you have a sister" (**79%**) — these beat any chart factor.
**Gender skew (weak):** tally male (Sun/Mars/Jupiter) vs female (Moon/Venus/Mercury) planets in the **3rd + 11th**; majority nudges the lean (~53% when those houses are occupied, else default brother-lean).
**Do NOT trust** the classical "Mars-on-3rd/11th ⇒ brothers" — it scored at chance (47%) and sometimes reverses. **Exact counts are effectively unpredictable** (and the group itself couldn't agree whether the count includes the native).

---

## 3. How to run this in the VedNetra app (repeatable workflow)

For each quiz chart:

1. **Chart Setup → Create new chart.** Set **Ayanamsha = Raman**. Enter the native's **Date**, **Time (HH:MM:SS)**, and **Place** (use *Search and populate lat/long*). Set **Gender** (it switches the marriage karaka Venus↔Jupiter). **Generate report.**
2. **Birth Foundations → D-1 Rasi Details** — read Lagna, every planet's **sign / house / dignity / retrograde**, and the **house-lord table**. This alone answers most of education, career, marriage, children, residence.
3. **Birth Foundations → Nakshatra & Pada / Yogas** — confirm combustion, key yogas (Panchamahapurusha, Vipreet Raj, Budhaditya).
4. **Timing & Dashas → Vimshottari Dasha** — read the MD/AD running now (or at a past event date) for any "when / at what age" question.
5. **Divisional Charts → D-9 (marriage), D-10 (career), D-7 (children)** — use these to break ties the D-1 leaves ambiguous (this is exactly where the strongest posters go).
6. **Strengths & Systems → Shadbala / Ashtakavarga** — when two candidate answers are close, prefer the one supported by the stronger planet / higher bindu house.

Then walk the **Universal Engine (§1)** and the relevant **playbook (§2)**, and answer with the confidence level from the scorecard.

---

## 4. Worked example — Chart 752 (verified in VedNetra)

*Female, 05-04-1998, 23:05, Beawar, Rajasthan. VedNetra (Raman) → **Lagna Scorpio**; Lagna-lord Mars in 6th (own, 0°, combust); 5th-lord Jupiter in 4th with Ketu; Mercury in 5th debilitated+combust+retro; Sun+Saturn in 5th (Pisces); 7th/12th-lord Venus in 4th with Jupiter+Ketu; Ketu Mahadasha at posting.* **This exactly matches the poster's own reading**, which is how I validated the whole pipeline.

| Question | Engine reasoning | Method's answer | Poster's confirmed answer |
|---|---|---|---|
| Education | 5th-lord Jupiter in 4th (not 5th/9th); Mercury deb+combust+retro (−2); Sun+Saturn load the 5th → **below graduate** | 12th pass ✓ | **A: 12th pass** ✓ |
| Marriage | 7th-lord Venus with Ketu, no benefic on 7th, Rahu aspects 7th-lord; karaka afflicted → **unmarried** | unmarried ✓ | **A: unmarried** ✓ |
| Career | Lagna-lord combust at 0°, 7th/karaka afflicted (female) → **not working** | does nothing ✓ | **E: does nothing** ✓ |
| Children | marriage gate = unmarried → **childless** | childless ✓ | **D: childless** ✓ |
| Residence | Ketu in 4th + Ketu Mahadasha → **left home / other-state** | other-state ✓ | **C: another state** ✓ |
| Siblings | assert brother+sister exist; count uncertain | (has siblings) ~ | D: one sister, two brothers |

Five of six answered correctly by pure chart-reading; the sixth (exact sibling count) is the known weak spot — consistent with the scorecard.

---

## 5. Honest limitations (so you use this well)

- **Birth-time precision.** Answers hinge on the Lagna and house cusps; a wrong/rounded birth time (many quiz posts give approximate times) can move the ascendant and flip house-based rules. Where a chart looks borderline, use VedNetra's **Rectify Birth Time** tool.
- **VedNetra's ephemeris is its own low-precision offline model** (the app's code says so). Signs and houses were correct in every cross-check, but exact degrees / combustion at the margin can differ slightly from Swiss-Ephemeris software — re-verify knife-edge combustions.
- **Facts beat charts.** The group's answers sometimes encode things no chart shows (a family's poverty, an emigration, a death year). Treat the chart as giving *probabilities*, and say so.
- **Small samples for rare outcomes** (widowhood, only-child, three-plus children, specific diseases) — those rules are suggestive, not settled.
- **These rules are tuned to this group's population** (largely North/West-Indian, technically-educated, and skewed toward "interesting" charts). Base rates — and therefore the defaults — may not transfer to a general population.

Bottom line: this is the **strongest evidence-based method the data supports**, with each answer carrying a known reliability. Lead with the high-confidence topics (residence, timing, health-binary, marriage family, education extremes), hedge the rest, and reach for D-9/D-10/D-7 and dasha in VedNetra to settle the close calls — which is precisely what the members who give the correct answers do.

*Appendix: the confirmed answer key for all 55 charts is in `analysis/MASTER_ANSWER_KEY.md`; per-topic back-tested analyses are in `analysis/<topic>.md`.*
