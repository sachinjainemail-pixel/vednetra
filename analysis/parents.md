## PARENTS

**n = 35 entries; 34 usable** (chart [793] is a mislabeled "sweet shop" answer — excluded).

Outcome distribution (buckets: both-alive / only-father / only-mother / neither):

| Bucket | Count | Share | Charts |
|---|---|---|---|
| both-alive | 25 | 74% | 753,757,761,763,764,765,768,771,780,781,788,789,792,794,795,800,801,802,803,811,813,816,819,822,825 |
| only-mother (father dead) | 6 | 18% | 767,777,790,808,814,815 |
| neither | 3 | 9% | 762,782,823 |
| only-father (mother dead) | 0 | 0% | — |

**Headline:** the sample is overwhelmingly both-alive (posters skew young). "Always both-alive" already scores **25/34 = 74%**. The real challenge is detecting the 9 "someone-dead" charts, and the data shows the classical afflictions are *sensitive but not specific* — they fire almost as often on living-parent charts. **only-father never occurs**, so a good rule should never predict it.

### Diagnostic factors (ranked)

1. **Base rate (both-alive).** The single strongest predictor. Nothing below beats defaulting to both-alive unless it is high-precision.

2. **Father-affliction STACKING (Sun tied to Saturn/Ketu by conjunction, + 9th-lord-in-8th, + Sun debilitated).** When **two or more** of these co-occur, father-death is reliable: fires on 808 (Sun+Saturn+Ketu conj in 11th, 9L Mars in 8th → 3 signals) and 814 (9L Saturn in 8th + Saturn opposes Sun → 2 signals), **both father-dead, zero false positives** across all 34. Precision 100%, recall only 2/9.

3. **Single Sun affliction (Saturn conj/opposition, Ketu conjunction, or Sun debilitated).** Present in 6/9 someone-dead charts (767 Saturn opp Sun; 790 Sun+Saturn conj; 808 & 814 as above; 815 Sun+Ketu in 12th; 782 Sun debilitated in Libra). BUT the identical signature appears in ~8/25 both-alive charts — 765 (Sun+Saturn conj, both alive), 800 & 801 & 825 (Sun+Saturn conj, all both alive), 795 (Sun+Ketu conj, both alive), 789 (Sun debilitated, both alive), 780 & 788 (Saturn opposes Sun, both alive). So a *single* Sun affliction is **not** decisive — treat as "reduced confidence," never a flip.

4. **9th lord in a dusthana.** 9th lord in the 8th specifically co-occurs with father-death (808, 814) and is rare among both-alive; 9th lord in 6th/12th is common in both groups and carries no signal (761, 764 both-alive have it).

5. **Mother side is unreliable.** Moon–Ketu/Rahu axis and Moon opposed by Mars look like classic mother-affliction but overfire badly: chart 800 has Moon+Ketu in H1 opposed by exalted Mars **and Rahu**, yet the native lives with both living parents. Mother-death never appears alone in this sample.

6. **"Neither" is essentially undetectable.** The 3 both-dead charts contradict the karakas: 762 has Moon in **own** sign in the 9th, 823 has Moon **exalted** in the 4th — both textbook "mother thriving," yet mother is dead. Only 782 shows a real signal (Sun debilitated + 9th-lord combust). These are almost certainly older natives; natal affliction can't encode the native's age.

### Decision procedure

For a new chart:
1. **Default = both parents alive.**
2. Count **Father-Signals (FS)** — how many of these are true:
   - Sun debilitated (in Libra);
   - Sun in the same house as Saturn (conjunction);
   - Sun in the same house as Ketu or Rahu;
   - Saturn exactly opposite Sun (Saturn's house + 6 = Sun's house);
   - 9th lord placed in the **8th** house.
3. If **FS ≥ 2** → predict **father not alive (only-mother)**.
4. **Never predict "only father."** If you see heavy Moon/4th-lord affliction *and* FS ≥ 2, upgrade to **neither**; Moon affliction on its own → keep the current call (do not act on it).
5. Otherwise → **both alive.**

### Back-test result

Applying the procedure to all 34:
- 25/25 both-alive kept correct (no chart reaches FS ≥ 2 falsely).
- 2/6 only-mother caught (808, 814); 4 missed (767, 777, 790, 815 each have only 1 Sun-signal).
- 0/3 neither caught (762, 782, 823 stay "both alive").

**Exact-bucket hit-rate: 27/34 = 79%** (vs 74% for the naive "always both-alive"). Net gain +2 natives, **no false positives**.

Alive-vs-someone-dead view: the FS ≥ 2 flag has **precision 100%, recall 22%** (2 of 9 dead-parent charts).

Miss list: 767, 777, 790, 815 (father dead, only one Sun-signal each — below threshold); 762, 782, 823 (parents dead but chart karakas look healthy / older natives).

### Highest-signal rules

1. **Sun conjunct BOTH Saturn and Ketu, with 9th lord in the 8th → father dead.** Chart 808 (Sun+Saturn(comb)+Ketu in Gemini H11; 9L Mars in Pisces H8). Poster's own reason cited exactly this.
2. **9th lord in the 8th + Saturn opposite Sun → father dead.** Chart 814 (9L Saturn own in Capricorn H8; Saturn's 7th aspect back onto Sun in H2). Father died 2025.
3. **Sun debilitated + 9th lord combust → parents dead.** Chart 782 (Sun debilitated in Libra H1; 9L Mercury combust in same house). Both parents deceased.
4. **A single Sun–Saturn conjunction means little.** 5 charts have it: 765, 800, 801, 825 (all both alive) vs 790, 808 (father dead). Do not flip on it alone.

### Caveats

- Only 9 "someone-dead" charts and **zero** "only-father" — the negative classes are tiny; the FS ≥ 2 rule rests on just 2 confirming charts, so its 100% precision is fragile.
- The dominant confound is **age**: both-dead natives are likely older, and the natal chart cannot express how much time has passed. Charts 762 and 823 (own/exalted parental karakas, yet parents dead) show classical rules failing for this reason.
- Recall on parent loss is genuinely low (~22%). Beyond the base rate, this topic is close to unpredictable from the natal chart alone; be honest that "both alive" is the safe answer and only override on stacked Sun/9th-lord affliction.
