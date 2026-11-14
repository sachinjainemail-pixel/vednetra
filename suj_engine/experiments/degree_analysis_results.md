# Does the degree of the planets explain the errors? Kundali 892, Kundali 2, Kundali 3

Round 17, the owner's question. Tools degree_capacity.js, the degree option of strength_tally.js and of event_rank.js, data/degree_factors.json. Script degree_analysis.js, outputs
degree_analysis_output.txt and degree_analysis_nodes_output.txt. The true answers were known, so this is a diagnosis and not a test.

Degree is read as the Baladi avastha. Yuva full, Kumara half, Bala and Vriddha a quarter, Mrita none, bands reversed in even signs. The numeric factors are the engine author's reading, the
attached library does not hold them. From the library only the flags are taken, gandanta, pushkara bhaga and pushkara pada. Every weight of a planet is multiplied by its factor.

## Summary

| | Without degree | With degree | With degree and the nodes too |
|---|---|---|---|
| AUC over 14 hypotheses, 40 pairs | 0.46 | 0.55 | 0.60 |
| Hypotheses above 50 | 1 | 4 | 8 |
| Mean score of the true ones | 39.1 | 40.8 | 49.9 |
| Mean score of the false ones | 40.3 | 38.8 | 44.0 |

Direction of the change for the 14 hypotheses, toward the truth 7, away from it 7. That is chance. The standard error of an AUC from 40 pairs is about 0.09, so none of these differences is
significant. The variant with the nodes raises almost every score, true and false, because the nodes are natural malefics that mostly stand on the against side, and shrinking their weight
raises everything. Its AUC of 0.60 is not a signal.

## Question by question

Kundali 892, female, 6 January 1993, Gonda.
1 Education. Truth post graduation. Jupiter 20.1 Virgo Kumara, Mercury 11.5 Sagittarius Kumara and combust, Mars the 5th lord 24.6 Gemini Mrita, Sun the 9th lord 22.0 Sagittarius Vriddha. The
  5th lord has no capacity and the 9th lord a quarter, so degree says higher education is weak. The truth is the opposite. Score 48 to 47. Degree does not explain this error, it deepens it.
2 Marriage. Truth married. Mars the occupant of the 7th is Mrita and Mercury the 7th lord is Kumara and combust. The friction of Mars is muted. Score 43 to 53. Degree helps, and this answer was right already.
3 Work. Truth not working. Mercury, Saturn and Jupiter are all Kumara, Mars Mrita. When every planet of the chain is in one band the shares do not change. Score 31 to 32. No effect.
4 Siblings. Truth two brothers and two sisters. Mars the karaka 24.6 Gemini Mrita and retrograde, so the brothers' karaka has no capacity, yet there are two brothers. Score 29 to 23. The wrong direction.
5 Father. Truth not alive. The Sun, karaka and 9th lord, is Vriddha at 22.0, a quarter. Score 45 to 40. Right direction, the only clear hit.
5 Mother. Truth alive. Moon 19.7 Taurus Kumara, Jupiter the 4th lord Kumara. Score 34 to 30. Wrong direction.

Kundali 2, female, 7 November 1991, New Delhi.
1 Profession. Truth lawyer. Jupiter 16.6 Leo Yuva, full capacity. Saturn 7.4 Vriddha, Mercury 10.1 Vriddha, Venus 4.1 Mrita, Moon 29.4 Mrita, combust and in sandhi. Working 47 to 57, doctor 40 to 27, lawyer
  51 to 53, astrologer 45 to 56. Three of four move the right way, but the astrologer overtakes the lawyer, 56 against 53, so the profession answer becomes astrologer, still wrong. With the nodes too, lawyer 70,
  astrologer 63, working 57, which gives the true answer.
2 Marriage quality. Truth very happy. Venus the karaka is Mrita at 4.1, Jupiter the karaka for a woman is Yuva. Married 39 to 37, happy 33 to 34. No help. With the nodes too, 61 and 53.
3 Event of 3 May 2021. Dasha lords Mercury Vriddha, Venus Mrita, Mercury, Sun Vriddha, Moon Mrita. Venus, the karaka of marriage, has no capacity, so marriage falls from 1.76 to 0.29, but child birth rises only
  from 0.66 to 0.16, level with accident. Marriage is still first. Has a child, 36 to 46. Degree explains why marriage should not lead, not why the child should.

Kundali 3, female, 12 November 2000, Indore.
1 Marital status. Truth divorced. The 7th lord Sun is 26.4 Libra Mrita, the karaka Venus is Bala at 5.2, Jupiter is Yuva. The marriage's own results have almost no capacity, which fits a short marriage, but the
  engine has no rule that turns that into a divorce. Married 31 to 28.
2 Event of 7 December 2022. Rahu is the Mahadasha and Antardasha lord and stands in the 5th, which is why child birth leads, 3.14. The nodes keep the factor 1. If the bands are applied to Rahu, 24.4 Gemini, Mrita,
  child birth falls to 0.64 and marriage stays 0.43. Child birth is still first but the lead shrinks from 2.7 to 0.2. Most of this error is the weight of an unpenalised node.

## What the degree does and does not do

1. It explains part of Kundali 3's event error, through Rahu, and part of Kundali 2's, through Venus Mrita. It does not explain Kundali 892's education, siblings and mother, where it points the wrong way.
2. Two of the library's own degree rules disagree. Kundali 3's Moon at 2.05 Taurus is Mrita by the Baladi bands, capacity zero, and sits 0.9 from the exact exaltation point at 3 Taurus. Shadbala counts the
   second and the Baladi bands the first.
3. Mrita Mars in Kundali 892 at 24.6 and two brothers, Mrita Venus in Kundali 2 and a very happy marriage, argue against reading Mrita as zero capacity. These are single cases.
4. Nothing here justifies adopting the factors. The option stays off by default.
