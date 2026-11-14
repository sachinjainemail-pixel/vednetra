# The search for the mix of degree, nakshatra and pada that gets every result right

Round 19. The owner decided: 60 percent to the nakshatra and 40 percent to the planet, the degree bands on Rahu and Ketu too, and the pada numbers may be changed if that improves the results. The owner asked for the
optimal mix where all results come correctly. Script quadrant_search.js, outputs quadrant_search_family1_output.txt and quadrant_search_family2_output.txt. The true answers were known to the engine author.

## Answer in one line

No mix in the families tried makes all the results correct, and the best mix found cannot be told apart from what the same search finds on shuffled answers.

## What was searched

Targets, 14 hypotheses from the three charts, 10 true and 4 false, and the 2 dated events. Always answering true already gets 10 of 14, so accuracy is judged by the AUC, the chance that a true hypothesis
scores above a false one, 0.50 is chance, 1.00 is perfect.

Family 1, the owner's words as capacity multipliers. Every weight of a planet is multiplied by m = 0.6 n + 0.4 d. n is the real strength of the nakshatra lord as a share of 1 times the pada factor, d is the
Baladi capacity of the degree. At nakshatra share zero this reproduces round 17 exactly, which was checked. 135 settings, five Baladi sets, three values each for pushkara pada, vargottama and gandanta.
Family 2, the form built in round 18, the planet's strength blended with its nakshatra lord's at a weight, times the pada factors, then the weight times the Baladi capacity. The weight was searched too, 0, .25, .5, .6, .75, 1.
810 settings.

## Results

| | Family 1, the owner's 60 and 40 | Family 2, weight searched |
|---|---|---|
| Best AUC in the grid | 0.50 | 0.70 |
| Median AUC over the grid | 0.47 | 0.55 |
| Dated events with the true event first | 0 of 2 | 1 of 2 |
| Best line gives | 9 of 14 | 10 of 14, which is the always true score |
| What chance finds, shuffled answers, searched the same way, median of the best AUC | 0.55 | 0.68 |
| Share of shuffles that did as well as the observed best | 0.64 | 0.45 |
| Leave one chart out, pooled AUC of the held out predictions | 0.42 | 0.45 |

Reading. In family 1 the best is exactly chance. In family 2 the best, 0.70 with weight 0.6, pushkara 1.3, vargottama 1.15, gandanta 0.5, is what a search over 810 settings reaches by luck almost half the time. When the
setting is chosen on two charts and tried on the third, the AUC is 0.45, and the chosen setting changes with the chart held out, in family 2 it picks weight 0 each time, which means no nakshatra. The setting that
looks best on all three charts is the one that fits them.

## Why every result cannot come right in this family

1. The best AUC is 0.70, not 1.00, and no setting reaches the true event for both dated events. In this family the information that separates the true from the false hypotheses is not there. For example
   Kundali 892 siblings, true, scores 21 to 25 under every setting, while the false Kundali 2 astrologer scores 50 to 66. No change of a degree band or a pada factor moves one above the other, because the evidence list
   for siblings has few for entries and the planets on it are weak.
2. More parameters would fit 14 targets, but that is fitting. Fourteen yes or no targets and four free numbers already allow a chance fit to reach 0.68 in the median.

## What was done with the owner's decisions

The weight of the nakshatra lord is set to 0.6 in suj_engine/data/nakshatra_factors.json, read as blending the planet's strength with its nakshatra lord's. The bands now apply to Rahu and Ketu by default. The pada
numbers are left at 1.15, 1.15 and 0.7, since no setting was shown to be better than another outside the sample.
