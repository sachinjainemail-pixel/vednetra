# SUJ ENGINE LEARNINGS FROM TESTED CHARTS

Read this file before answering any question under the SUJ engine. It is written by the engine author from the
owner's reported results. Nothing here replaces or rewrites the owner's methodology in METHODOLOGY.md. These are
working guardrails that stop the engine from breaking its own methodology, and hypotheses to test. Everything marked
proposed awaits the owner's confirmation. Cases live in suj_engine/cases/cases.json and the scoreboard is
node suj_engine/tools/cases_report.js.

## Case 1. Kundali 892, female, 6 January 1993, 07:10, Gonda. Reported 13 November 2026

| Q | Topic | Engine answered | True answer | Result |
|---|---|---|---|---|
| 1 | Education | Graduation | Post graduation | wrong |
| 2 | Marital status | Married | Married | right |
| 3 | Work type | Government job | Unemployed | wrong |
| 4 | Siblings including native | One brother three sisters | Two brothers two sisters | wrong |
| 5 | Parents | Both alive | Mother alive, father not | wrong |

One of five, 20 percent. Chance for four options is 25 percent. Five answers on one chart cannot show skill or lack
of it. What the case does show is how the engine went wrong, and that is what is recorded below.

## What went wrong, as error tags

- prior_override. The engine chose by typicality, a base rate, or the safe middle option, against indicators it had
  itself found. This happened in questions 1, 3 and 5. Each time the true answer sat on the side of the engine's own
  indicators.
- capacity_vs_status. A strong natal promise, here the tenth house, was read as proof that the event is in progress.
  The promise shows capacity. Whether the native is in the situation needs its own status evidence (question 3).
- invented_rule. The sibling count was decided by a planet and sign gender heuristic that is not in the owner's
  methodology, not in the rule library and not from a cited text (question 4).
- flag_dismissed. A risk or counter indicator was listed, then set aside by pointing to a protective factor, without
  counting both sides (question 5).
- winner_mapping. The planet strength winner was named, then a result was attached to it by feel and used to overrule
  indicators. The result of the winner must be derived from its lordships, placement, nakshatra lord and dasha for the
  event at hand (question 5).

## Guardrails now in force

G1 Decide only on counted chart evidence. Typicality, base rates, what is common and the safe choice are not
   evidence. answer_guard.js version 2 fails an answer that uses such wording.
G2 OWNER DECISION, rounds 6 and 7. Evidence for and against an option is weighed by the REAL STRENGTH of the planets on each side,
   not by counting factors. Each piece of evidence names one planet, a side, a type and an option. A planet counts once per
   side, with its largest weight. Owner's example of round 7. The Sun is the 9th lord, which speaks for the option, but the
   Sun is debilitated in D9, so it is a weak 9th lord. Its weight for is weaker than its weight against. The rule built from
   it, applied to every case.
   1. Real strength S of a planet, 0 to 100, is the mean of the owner adjusted Shadbala percent halved and cut at 100, the D1
      sign dignity, the D9 dignity, the Vimshopaka Shadvarga share, and the subject varga when there is one, the house good
      or not and the dignity. The parts and the equal weights are the engine author's reading of the owner's six steps and
      await the owner.
   2. role. The planet carries something favourable, a lordship, karaka, placement, benefic aspect. Weight S. A weak planet is
      a weak carrier, so a debilitated 9th lord helps little.
   3. harm. The planet damages the subject from outside, a malefic aspect or conjunction. Weight S. A strong malefic harms
      more and a weak malefic harms less.
   4. weakness. The planet's own condition damages the role it carries, debilitation, combustion, enemy sign, 6 8 12
      placement, bad varga house. Weight 100 minus S. A strong planet has little weakness to count and a weak one a lot.
   5. A planet that is both carrier and weak counts S for and 100 minus S against. S below 50 turns it against, as in the
      owner's Sun. S above 50 keeps it for.
   6. OWNER'S RULE OF ROUND 8. An ASPECT always works by the planet's NATURAL significations, whatever houses it lords for this
      ascendant. HOUSE OWNERSHIP works by the houses owned, most beneficial for a trine lord, somewhat beneficial for a kendra
      lord, harmful for a trik lord. A planet that lords a house and also aspects, such as Saturn, is therefore two separate pieces
      of evidence that may point opposite ways. Saturn in the Lagna chart of Kundali 892 lords the 2nd and 3rd, which the owner's
      three classes do not cover, while its aspect is a natural malefic aspect against. It is not the same strength delivering
      both results, which was the engine author's earlier wording and was wrong. strength_tally.js now takes the types lordship
      and aspect and works out the side itself. For lordship it checks that the planet really lords the house, from the Lagna or
      from the Moon. Trine houses 1 5 9 weigh S times 1.0 for, kendra 4 7 10 weigh S times 0.5 for, trik 6 8 12 weigh S times 1.0
      against. The factors 1.0 and 0.5 are the engine author's reading of most and somewhat. Houses 2 3 11 are outside the owner's
      three classes and carry no weight until the owner says. Natural nature for aspects, Jupiter and Venus benefic, Sun Mars
      Saturn Rahu Ketu malefic, the Moon benefic from Shukla 6th tithi to Krishna 10th tithi, Mercury benefic unless it shares a
      sign with a malefic.
   7. Rahu and Ketu take the S of their sign lord and are flagged. This proxy is the engine author's proposal.
   The score of an option is the share of strength in its favour, 0 to 100. Use node suj_engine/tools/strength_tally.js, which
   prints the S table, the evidence table and the EVIDENCE TALLY line. Options with no order, the highest score wins and a tie
   goes to the larger favour weight. The guard checks the line against the final answer. Which planet stands on which side
   and of which type is the analyst's judgement and shows in the evidence table so that it can be corrected.
G12 DASHA RESULTS. The owner said to take dasha results from the Laghu Parashari rules. A dasha lord gives the results of the houses
   it owns, not its natural nature. Run node suj_engine/tools/functional_nature.js, which prints for the Lagna the class of each
   planet, trikonesha, kendresha, trishadayesha, the sama lords of 2 and 12, the marakesha, the yogakaraka by the library's own
   test LP-085-5, the kendradhipatya dosha and whether it is triggered, LP-023-16 and LP-054-3, and the role of the running
   Mahadasha, Antardasha and Pratyantardasha lords. In dasha a benefic promotes and a malefic obstructs, LP-085-3, unless a
   malefic is connected to a yogakaraka, LP-086-1, when it gives the yoga's fruit in proportion to its own strength and keeps its
   marakatva, LP-086-2. A maraka's dasha gives auspicious fruit first and inauspicious later, LP-085-8. The answer states these on
   a DASHA LORDS line in S6, which the guard requires.
   RAHU AND KETU, round 10. The library has direct rules, sloka 13 of Laghu Parashari. The nodes own no sign, so no sign lordship,
   exaltation or debilitation, LP-060-2. They are judged by the house occupied and the planet they sit with, LP-056-6. The node
   becomes the lord of the house it occupies. With a companion planet the result follows that planet read through its houses. Alone
   it follows the house, LP-062-1. Alone in a trikona it is shubha, in the 8th shubha, in a kendra sama, in the 2nd or 7th
   marakesha, in the 12th sama but vyayakaraka, in 3 6 11 papi. It doubles the result of the lord of the house it occupies,
   LP-057-2. In a kendra or trikona conjoined with a kendresha or trikonesha it is a yogakaraka, LP-057-2 and LP-062-2, with
   conjunction only and no aspect, LP-057-4. In the 2nd or 7th with a benefic that lords the 2nd or 7th it is certainly a marakesha,
   LP-062-3. With the Sun or the Moon the house verdict is used, LP-058-3. functional_nature.js codes all of this. Kundali 892, Rahu
   alone in the 12th is sama but vyayakaraka and doubles Mars, Ketu in the 6th with the Moon is papi and increases the 6th house's
   results, destruction of enemies.
   OWNER DECISION, round 9. Laghu Parashari is for dasha results ONLY, and only for the concerned planet in its own Mahadasha,
   Antardasha, Pratyantardasha, Sookshma or Prana. It does not enter the natal strength tally. In the natal tally the owner's
   own classes govern, trine most beneficial, kendra somewhat, trik harmful, aspects by natural nature. So the library's calling
   the 3rd and 11th lords doshi and the 2nd and 12th lords sama applies when that planet's dasha runs, and not to the natal
   promise. Houses 2, 3 and 11 stay outside the owner's classes in the natal tally and carry no weight. functional_nature.js
   prints all five dasha levels.

G13 STATUS RULE AND DEATH, round 23, owner approved. A promise is capacity, so a strong karaka or Lagna lord does not count against an event that has a running dasha and a window, the entry is marked capacity true and the tally is run with statusEvent true. The Vednetra day
   verdict is not evidence against an unpleasant event. native_death is an event preset and prepare.js has the topic death. On Kundali 5, 19 September 2022, event_rank with native_death gives native_death 1.0, foreign_travel 0.8, child_birth 0.73, health_crisis 0.72, so the truth
   comes first. This was written after the truth was known and is not a test. The strict native_death windows still do not cover the date, the first is 22 April 2023, and the widest views were not checked. Child sex, tools/child_sex.js, sign parity leans daughters, planet gender sons, for Kundali 5 the
   first was right. Both stay out of the tally, log both on the next child question.
G3 Every flag against the leading option appears on the COUNTER EVIDENCE line and is counted in the tally. A flag may
   be answered by a protective factor only if that factor is counted on the other side. The guard requires the line.
G4 A natal promise is capacity. For status questions, working or not, married or not, parent alive or not, tally the
   promise and the status indicators separately and let the status tally decide. A candidate window from the window
   scan is needed for an event to be called past. A window alone does not prove it. In case 1 a grade A job window
   existed in 2025 and the true answer was unemployed.
G5 Ordered options such as education levels. List them lowest first. Evidence for a level supports that level and every lower
   one. Evidence against a level means the native does not reach it, so it opposes that level and every higher one. The answer
   is the highest level whose strength share is above 50, or the lowest level when none is. This is how strength_tally.js
   works and how answer_guard.js with --ordinal checks. It follows the owner's decision of round 6 on question 1.
G6 Count questions such as the number of siblings. Use only documented counting indicators, the occupants and
   aspects of the sibling houses, the Ashtakavarga of those houses, the karaka and the sign type of the karaka, D3.
   Do not decide by planet or sign gender counting unless a rule is found by rules_lookup.js or cited from a classical
   text. If a classification is not backed, it may be mentioned but must not enter the tally.
G7 Winner mapping. After planet_strength.js, write the winner's result from facts: the houses it rules, the house it
   occupies, its nakshatra lord, its dispositor and its dasha level for this event. The winner decides between
   conflicting results of the candidate planets. It does not cancel indicators that belong to other significators.
G8 Negative events are not discounted for being unpleasant. Loss, separation and not working carry the same weight as
   their opposites. Flags of risk count in full.
G9 Run rules_lookup.js for every question and list the rule ids on the RULES CITED line. The library is thin outside
   the nakshatra placements, and for parents or siblings it holds almost nothing. When it holds nothing, the line says so.
G10 Run window_scan.js in the strict view first and weigh it on the WINDOW SCAN line in S6. Use prepare.js to run the
   mandatory tools in one go.
G11 After every owner reported result, add the case to cases.json, run cases_report.js, and extend this file.
   Ask the owner for the dates of events together with the true answers whenever they are known, for example the
   marriage date, the date a parent was lost, the year a job started, because dates are the only way to test the window
   scan itself.

## Hypotheses to test on the next charts. Not rules

H1 In case 1 every miss had the true answer on the side of the engine's own flags. If the next charts show the same,
   the tally rule G2 should become the main decider and the planet strength winner a tie breaker only.
H2 Ordinal. The true level was the highest level whose chain was supported. Under the owner's real strength rule and the
   evidence listed for Kundali 892, Graduation scores 65 and Post graduation 39, so the rule gives Graduation again. With the
   earlier Shadbala only weights the scores were the same, 65 and 39. The result did not change when Rahu was removed from both sides. Whether the planets were placed on the
   right sides is for the owner to check in the evidence table.
H3 Counts. The larger family coincided with a very high Ashtakavarga on the 11th house, 38 against an average of
   about 28, and the karaka Mars in a dual sign. Record Ashtakavarga and karaka sign in each sibling case.
H4 Parents. The true loss was the father. The chart showed Jupiter, lord of the father's 8th, in the father's 2nd,
   Saturn and Rahu aspecting the father's 8th, and a strict window Rahu Mercury in 2010 and 2011 with Jupiter in
   Pisces and Saturn in Virgo on the house, plus a grade A window in November 2022 and a grade A window in
   2025. The true date is not known. If the owner gives it, it will show which window was right.
H5 Not working with a strong tenth house. The chart had Saturn in the 2nd, the tenth lord combust, D10 Sun and Moon
   in the 12th, D10 Mercury in the 8th and the D10 10th house empty. Test whether such a set marks a homemaker
   pattern in further female charts.

H6 Calibration. In the round 12 rerun of Kundali 892 every hypothesis scored under 50 in the strength tally, including marriage. The line at 50 does
   not fit the way the evidence is generated, which has more entries against than for, and the real strength S sits near 45 to 50 for most planets. On
   this chart a line near 40 would separate four of six answers. This is one chart and must not be used to set the line. Collect the scores of many
   charts with the true answers and set the line from them. Until then a score under 50 is not read as a no. See experiments/rerun_892_round12_results.md.
   UPDATE after the second chart, Kundali 2. The hypothesis scores of both charts, 13 hypotheses, 9 true and 4 false, have a mean of 40.0 for the true and
   40.3 for the false, and the chance that a true one outscores a false one is 0.50 over 36 pairs, exactly chance. The line near 40 that looked useful on
   chart 892 does not hold, three of the true hypotheses of Kundali 2 scored 39, 36 and 33. So the strength tally score, as built, carries no signal
   on two charts. This is the finding that matters more than any single answer. Do not set a line. Revisit the construction of the score, the
   weakness double count, the S composite and the 1.0 and 0.5 factors, against many charts before trusting it. node suj_engine/tools/cases_report.js prints this table.
   UPDATE after the third chart, Kundali 3. 14 hypotheses, 10 true and 4 false, mean 39.1 for the true and 40.3 for the false, AUC 0.46 over 40 pairs, a little under chance. One of 14 is above
   50. Kundali 3 Married scored 31 and she did marry on 7 December 2022. The strength tally score still has no signal on three charts.
H10 Conjunction with the house lord. Kundali 3, the marriage was on 7 December 2022, Mahadasha Rahu, Antardasha Rahu, Pratyantardasha Mercury, Sookshma Jupiter, Prana Venus. No scan view covered the date for
   marriage, not even the widest, and the event rank put child birth first. In the chart the 7th lord Sun is debilitated in Libra with Mercury, so the Pratyantardasha lord is conjunct the 7th lord. Jupiter
   in the Sookshma is the karaka and Venus in the Prana is the karaka. The owner's method, section 2.3.2 item 6, reads a conjunction with the house lord, and the scan counts a planet only when it lords or
   occupies an event house, is a karaka, or is a varga key house lord or occupant. A planet conjunct a house lord is not a link. Adding it is an engine change that the owner has not yet approved. The owner is asked.
   Window scan on the dates of events that really happened, two dates, none covered by the strict views and one by the widest.
H11 Degree and capacity, round 17, at the owner's request. Planet degree read as the Baladi avastha, Yuva full, Kumara half, Bala and Vriddha a quarter, Mrita none, reversed in even signs. The factors are the
   engine author's reading, the library does not hold them. Over the three charts, 14 hypotheses, AUC 0.46 without, 0.55 with, 0.60 with the bands also on the nodes. Direction toward the truth in 7 of 14, chance. It
   helps in Kundali 892 marriage, the father, and most of Kundali 2's profession hypotheses, and Kundali 3's event, where Rahu's unpenalised weight caused the error. It points the wrong way in 892's education,
   siblings and mother. Two degree rules also disagree, Mrita by the bands and near the exact exaltation point by Shadbala, Kundali 3's Moon. See experiments/degree_analysis_results.md. The option stays off by default. Needs
   the owner, the factors, whether the nodes take the bands, and whether a Mrita planet at 29 or at 0 degrees should be read as zero.
H12 Nakshatra and pada with the degree, round 18. Half the weight to the nakshatra lord's real strength, pushkara pada and vargottama times 1.15, gandanta times 0.7, all the engine author's numbers. 14 hypotheses of three
   charts. AUC base 0.46, degree 0.55, nakshatra and pada alone 0.46, both 0.55, both with the degree bands on Rahu and Ketu 0.65, in that last case 8 of the 10 true hypotheses are above 50 and 3 of the 4 false are not. The last
   row is suggestive and not yet believable. Under two standard errors from chance, five conditions tried on the same hypotheses, the nodes outside the classical scheme, and it works by raising nearly every score. It does
   not fix the event rank, Kundali 2 stays marriage first, Kundali 3 is nearly fixed only when Rahu takes the bands. See experiments/nakshatra_analysis_results.md. The honest test is a new chart answered blind with the
   conditions fixed beforehand. Needs the owner, the weight 0.5, the three pada factors, and whether the nodes take the bands.
H13 The search for the mix, round 19. The owner decided 60 percent nakshatra and 40 percent the planet, the bands on Rahu and Ketu, and the pada numbers free to tune, and asked for the mix where every result is correct. Two families
   were searched, 135 and 810 settings, on 14 hypotheses and 2 dated events. Best AUC 0.50 in the owner's multiplier reading and 0.70 in the blend reading. No setting gets the true event first for both dates. Shuffled
   answers searched the same way give a median best of 0.55 and 0.68, and 45 percent of the shuffles do as well as the observed 0.70. Leave one chart out gives 0.42 and 0.45. So there is no demonstrated quadrant. A mix that fits all
   fourteen cannot be found in this family, and one that appeared to would be a fit to these charts. A first version of the search put the capacity into S itself and reported a worse AUC, found to be a mistake by the check that
   the script reproduces round 17 at nakshatra share zero, which it now does exactly. See experiments/quadrant_search_results.md. Set in the data, nakshatra weight 0.6, bands on the nodes by default.
H14 Kundali 4, the first blind test of the updated engine, reported 14 November 2026. Right on marital status, none of the above, and on education, already dropped studies. Wrong on siblings, the native has one sister, the engine said only child. Blind total
   3 of 8. The two hits do not show skill. All five hypothesis scores were under their lines, so the rules said no each time and the truth happened to be a negative answer twice. The one true hypothesis, has siblings, scored the lowest of the five in the updated
   engine, 21. The Ashtakavarga count rule would have said 2 brothers 2 sisters, also wrong, and H3 is contradicted, the 11th house has 35 points here and 38 in Kundali 892 while the families have 2 and 4 children.
   Topic bias. Scoring each hypothesis type on 24 random charts, with no true answers, gives a null mean of 27.8 for has siblings, 32.4 for a happy marriage, and 36 to 46 for the rest. A fixed line, the median of all scores, is wrong for a low scoring topic.
   Read against its own type, as a z score, the updated engine has AUC 0.78 over 80 pairs of 18 hypotheses, the raw scores 0.66, and on Kundali 4 alone 0.75 over 4 pairs. This idea came after the truth of Kundali 4 was known, the null has only 24 charts and some
   of its standard deviations are small, so it is promising and not confirmed. Fixed beforehand for the next blind chart, the null in experiments/null_distribution.json and the rule z above 0 means yes, it would be the first fair test. tools/z_report.js prints it.
H15 Kundali 5, male, 29 January 1983, 14:45, Mumbai, reported 14 November 2026. Blind for the existence call, the z reading and the null were fixed before the chart. Truth, two daughters, and the native died on 19 September 2022.
   Engine under the written rules, two sons and foreign travel, none right. Asked afterwards for the top two, two sons and one son one daughter, foreign travel and death, so the death answer was second. Blind total 3 of 10.
   Question 1. Has a child scored 61, z 1.16, read as yes, and the native has children, so the existence call was right. The count and sex have no validated rule, the tally gave the three child options the same 61 and the TIE BREAK used planet gender,
   Mars and Jupiter male planets and no female planet in the chain, which was wrong. The counter evidence line had named the even signs, Virgo as the 5th sign, Scorpio as the karaka sign, and D7 Jupiter in Cancer, and those pointed to daughters. One chart,
   so sign parity is a hypothesis to test and planet gender is a proposed rule that failed once. Next sex of child question, log both readings before the truth is shown.
   Question 2. The native was not alive after 19 September 2022 and the engine did not have death as an event. The event rank on that date put health_crisis first, 1.2 against foreign travel 1.08, and the answer still chose foreign travel because the tally was built with
   hand typed entries. Three faults. First, Saturn exalted and the strong Lagna lord were counted against death, which reads the strength of the longevity promise as proof of status, the capacity_vs_status error of G4. Second, the Vednetra day verdict favourable was counted
   against death, but that verdict is about net benefit and does not name the kind of event. Third, Saturn is the natural karaka of the 8th and of death and was the Sookshma and Prana lord on the day, with Jupiter the 8th lord in the Antardasha and Pratyantardasha and Ketu in the 8th, and the
   winner mapping took Saturn as a foreign travel planet only through the 9th lord. Proposed changes, awaiting the owner. Add a death event to data/events.json with houses 8 and 2 7 as maraka houses and Saturn as karaka. Run the event rank with health_crisis and death among the options
   whenever the options include death. Do not count the strength of a promise against an event that has a running dasha and a window. Do not use the day engine verdict as evidence against an unpleasant event, G8.
H7 Window scan and the subject varga. Kundali 2, the child was born on 3 May 2021, Mercury Mahadasha, Venus Antardasha, Mercury Pratyantardasha, Sun Sookshma. No
   strict window for child birth covered the date, because the scan reads D1 houses only. In D7, the varga of children, Mercury sits in the 5th house, Venus is
   exalted in the D7 Lagna. On the transit side Jupiter was in Aquarius, the 5th from the Moon, and the Sun was in Aries, the 5th from the Lagna. The owner's method
   reads the Lagna, Moon and Sun charts, section 2.1, and the subject varga, section 3. The scan uses neither the Moon chart for transits nor the subject varga for the
   dasha significators. One case. If the next chart shows the same, extend the scan. The owner is asked whether to extend it now.
   DONE in round 14 at the owner's word. window_scan.js now adds the occupants and sign lords of the key houses of the subject varga to the dasha significators and tests the
   double transit from the Lagna, the Moon and the Sun, in the same reference chart. RESULT on Kundali 2, 3 May 2021. Strict double transit, still no window for any option. Wide
   view, double transit, marriage grade A via the Lagna, child birth none. Only with gate single, Jupiter or Saturn alone in a reference, does child birth appear, grade B via the Moon
   and Sun, while marriage and accident also appear, marriage at grade A. So the engine would still choose marriage. The reason is plain. Jupiter stood on the 5th from the Moon but
   Saturn did not, and the Venus Antardasha is not a child significator. The extension cost discrimination. Strict past windows in Kundali 2 are now marriage 51 all at grade A, child 21,
   accident 27, mother in law 19. A tool that flags marriage 51 times cannot tell a marriage from a child.
H9 Event rank by directness, round 15, agreed by the owner. Grade the dasha by how directly the running lords tie to the event, and divide a planet's links among the events it serves, so a planet
   that serves many events gives each only a share. Built as event_rank.js, method written before it was run on any chart. Run on Kundali 2, 3 May 2021, Mahadasha Mercury, Antardasha Venus,
   Pratyantardasha Mercury, Sookshma Sun. Marriage 1.76, accident 0.86, mother in law 0.70, child birth 0.66. Marriage still first and the true event, child birth, last. Venus is a karaka
   of marriage for a woman and sits in the D9 7th, and Mercury lords the 7th, so the links point to marriage. Mercury in the D7 5th is the only link to the child. Not tuned to this chart. One
   thing the tool cannot know is that she was probably married before 2021, since the answers say a very happy marriage and a child, but the marriage date was not given. The next chart,
   answered before the truth is shown, is the first fair test of the rank.
H8 A professional hypothesis. In Kundali 2 the lawyer hypothesis, 9th and 10th with Jupiter, Saturn and Mercury, scored 51 against astrologer 45 and doctor 40, the
   only one over 50, and was the true profession. The mapping of professions to houses and karakas was fixed by the engine author before the run and is a proposal. One case.

## Engine 2.0 is the default, round 22

All the learnings from Kundali 892, 2, 3 and 4 are now in the default configuration, data/engine_config.json. Guardrails G1 to G12 apply as before. What changed in practice is
that a new session needs no flags, prepare.js runs the updated engine and prints the ENGINE VERSION line and the HYPOTHESIS SCORES. Two things stay unproven and must be said in an answer
that uses them. The z reading of hypothesis scores is provisional. The Baladi and pada numbers are the author's. The engine has no rule for counting siblings or children and none for divorce, so an
answer on those rests on the chain evidence only and must not claim more.

## What the new tools do and do not do

- functional_nature.js gives the Laghu Parashari class of each planet for dasha results. Connections to the yogakarakas are shown only as
  same sign, exchange or aspect either way, the library's four sambandha types are not all coded. Rahu and Ketu are not classified.
- strength_tally.js weighs the planets for and against each option by their real strength, the owner's rule of rounds 6 and 7.
  It cannot decide which side or type a planet belongs to, that stays with the analysis. Self test in tests/strength_selftest.js.
- window_scan.js, from round 12, adds Rahu and Ketu as significators by the Laghu Parashari sloka 13 rules. On Kundali 892 this raised the
  strict windows to 8 to 29 per event, the mother's loss had 29 of 29 at grade A, and the mother is alive. With nodes the scan separates
  even less. Use nodes false to see the view without them and treat both lists as candidates only.
- window_scan.js, from round 11, goes down to Sookshma and lists the Sookshma significators inside each window. Prana is left out.
  It lists candidate dasha and double transit windows. On this chart the wide view gave 72 to 142 windows
  per event, so it separates nothing. The strict view gives 5 to 18 and is usable, but the same period, 2010 and
  2011, showed up for the father, for marriage, for a job and for education. It finds candidates. It does not
  decide an answer.
- rules_lookup.js cites the library. The library has 1,561 rules, almost all about planets in nakshatras and the
  Laghu Parashari yoga tables. It has nothing on counting siblings or on parents' longevity.
- cases_report.js keeps the scoreboard. It makes it visible whether the same error tags keep coming back.
- answer_guard.js version 2 enforces the process. It cannot check that the evidence counted is right. That still
  depends on the analysis.
- None of this has been shown to raise accuracy. It makes the process auditable and removes the specific habits that
  produced the misses. The README of this repository records that 52 pre registered tests of classical rules came
  out at chance level, and the engine's first score is consistent with that.
