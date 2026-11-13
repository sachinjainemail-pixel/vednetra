# Rerun of Kundali 892 with the proposed planet resolution and guardrails G1 to G11

Run on 13 November 2026 with node suj_engine/experiments/rerun_892.js. Raw table in the script output. The true
answers were known when this was run, so this is not a test. It shows what the proposed procedure does.

## Procedure fixed before the run

1. Subject houses include derived houses. Father 9 and, as loss houses, 4 10 3. Mother 4 and, as loss houses, 11 5 10.
   Marriage 7 2 11 and, as loss houses, 6 8 12.
2. A planet is eligible only if planet_strength step 6 gives it three or more subject links, dasha items excluded.
3. Eligible planets are ranked by dasha involvement, which is the weighted count of strict window scan windows up to the
   as of date where the planet is Antardasha or Pratyantardasha lord, grade A weighs 2, grade B weighs 1. Ties go to
   Shadbala percent, then to link count.
4. The answer is then chosen by an EVIDENCE TALLY, one unit per distinct chart factor, counted once.

## Result of the planet resolution

| Question | Old winner | New order of eligible planets | Note |
|---|---|---|---|
| 1 Education | Jupiter | Mercury, Jupiter, Sun | Lead moves from the 4th lord to the karaka and 5th lord from the Moon |
| 2 Marriage | Venus | Saturn, Mercury, Mars | Saturn links 2nd lord, occupant of 2nd, aspect on 11th, D9 house 9, net links plus 4 |
| 3 Work | Moon | Jupiter, Saturn, Venus | Moon had 2 links and drops out. Mercury the 10th lord also drops out with 2 links |
| 4 Siblings | Saturn | Venus, Saturn, Sun | Venus sits in 3rd, lords 11th, D3 house 7 |
| 5 Father | Saturn | Saturn, Venus, Sun, Jupiter | Saturn net plus 1. Jupiter MD and Mercury AD running now are the risk planets |
| 5 Mother | Moon | Mercury, Venus, Jupiter, Mars | Moon is eligible with 2 links only and drops out, leaders net minus 1 |

Correction to an earlier statement. In the previous message I said that for parents the new order would put Jupiter and
Mercury forward. That holds only for who is running now. By the rule fixed above, Saturn leads for the father.

## Tallies

Q1 Education. Convention A, evidence against a level counts for the levels below it. Graduation 8, Post graduation 5,
Intermediate 2, High school 0. Convention B, only positive evidence counts. Post graduation 5, Graduation 4,
Intermediate 2, High school 0. The written G2 reads as convention A, which gives Graduation again. The convention must be fixed by the owner.

Q2 Marriage. Married 7, Divorced 3, Widowed 0, Unmarried 1. Married.

Q3 Work. Stage 1 engaged in work 7, not engaged 7, a tie broken by step 6, the Antardasha lord Mercury is the tenth lord and
running. Stage 2 type, Government 3, Private 2, Business 2. Government job again.

Q4 Siblings. Stage 1 total count, four in all 4, two in all 3, only child 0. Stage 2 the split between brothers and
sisters has no documented counting rule, so no units. The fallback, the leading planet Venus, gives one brother three sisters again.

Q5 Parents, checklist of ten categories applied to each parent with the same rules.
Father, alive 2, not alive 4. Mother, alive 1, not alive 6. Result Neither alive. Without the window and primary planet
categories the result is the same, father 2 against 3, mother 1 against 5.

## Score of the rerun against the true answers

Q1 Graduation wrong under convention A, right under B. Q2 right. Q3 wrong. Q4 wrong. Q5 Neither alive, wrong, the father
is right and the mother is wrong. One of five under the written rules, two of five under convention B.

## What the rerun shows

1. The eligibility rule and the derived houses fix a real defect in planet_strength.js. An unlinked planet can no longer
   win. It does not produce answers by itself.
2. Window evidence does not discriminate. The strict scan gave the mother 8 past grade A windows and the father 2, and the
   mother is alive. Windows can be required for an event to be called past. They must not be counted as evidence that the
   event happened.
3. Several steps from planet to option have no documented rule, the ordinal tally convention, employed or not, the split of
   siblings into brothers and sisters. In each the answer follows whichever convention is chosen.
4. Counting risk flags at full weight, guardrail G8, moved the father to not alive, which is right, and the mother to not
   alive, which is wrong. Both parents show risk flags in this chart, so the flags do not separate them.
5. Nothing here shows an accuracy gain. A second chart with event dates is needed before any rule is changed on evidence.
