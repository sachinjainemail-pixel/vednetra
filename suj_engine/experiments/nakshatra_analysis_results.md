# Nakshatra and pada impact together with the degree of the planets

Round 18, the owner asked to add the nakshatra and the nakshatra pada to the degree and see whether it helps. Script nakshatra_analysis.js, output nakshatra_analysis_output.txt. The true answers were known,
so this is a diagnosis on the same three charts and not a test.

## What was added

1. The nakshatra lord. The owner's rule of section 4.1 item 7, a planet gives the results of the lord of the nakshatra it stands in. A planet's real strength is blended half and half with the real strength of its
   nakshatra lord. The nodes blend their sign lord's strength with that of their nakshatra lord. The weight 0.5 is the engine author's reading.
2. The pada. The qualities that the library names, Sutton chapter 3, pushkara pada and vargottama multiply the strength by 1.15, gandanta by 0.7. The numbers are the engine author's, the library gives none. The
   pada dignity itself, the navamsha sign of the pada, is already inside the real strength through the D9 part.
3. In the event rank, a lord that stands in the star of a significator is linked to the event too, and each lord's share is multiplied by its pada factor.
4. The marks that the library puts on its planet in nakshatra rules, a star for good and a warning sign for bad, exist for only 0 to 4 rules per planet, so they are shown and not used.

## Result, 14 hypotheses of the three charts

| Condition | AUC | Moved toward the truth | Above 50 | True above 50 | False above 50 |
|---|---|---|---|---|---|
| base | 0.46 | | 1 | 1 | 0 |
| degree | 0.55 | 7 | 4 | 3 | 1 |
| nakshatra and pada only | 0.46 | 10 | 3 | 3 | 0 |
| degree and nakshatra and pada | 0.55 | 8 | 4 | 3 | 1 |
| the same with the degree bands on the nodes too | 0.65 | 10 | 9 | 8 | 1 |

The last row is the best, 8 of the 10 true hypotheses above 50 and 3 of the 4 false below. On the 14 it classifies 11 correctly. Why this cannot be trusted yet. The standard error of an AUC from 40 pairs is about
0.09, so 0.65 is under two standard errors from chance. Five conditions were tried on the same 14 hypotheses and the best was picked, which inflates it. The three charts are the ones the conditions were designed
by. The degree bands on the nodes are not in the classical scheme. The four numbers 0.5, 1.15, 0.7 and the Baladi factors are the engine author's. Raising nearly every score, true and false, is how the last row works.

## Event rank

K2, 3 May 2021, truth child birth. Without anything marriage 1.76 and child birth 0.66. With both, marriage 0.30, accident 0.20, child birth 0.15. Child birth falls to third. No help.
K3, 7 December 2022, truth marriage. Without anything child birth 3.14 and marriage 0.43. With both, 2.95 and 0.44. With the bands on Rahu too, child birth 0.65 and marriage 0.44. Still child birth first, but by 0.21 instead of
2.7. The error is Rahu's weight, 24.4 degrees Gemini in the 5th house, Mahadasha and Antardasha lord.

## Where it still fails

Kundali 892 siblings, true, 22. Mother alive, true, 35. Kundali 892 education 56 passes only with the nodes. Kundali 2 astrologer, false, 66, but lawyer 74 is higher.
