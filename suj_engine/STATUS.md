# SUJ ENGINE BUILD STATUS

## Phase 0. Absorb (done)

- Methodology saved in METHODOLOGY.md.
- Binding requirements saved in ENGINE_CONTRACT.md.
- Rule workbook saved in rules/Sutton_and_LaghuParashari_Rules.xlsx and converted to rules/rules_index.json.
  Sheets: Sutton The Nakshatras 1,083 rules, Umesh Laghu Parashari 478 rules, total 1,561.
  Fields per rule: rule_id, description, events, exact_rule, effect, combination, source, page.
  Event tags in the data: Career, Marriage, Children, Wealth, Education, Health, Longevity, Property,
  Parents, Litigation, Travel, Spirituality, Personality, Timing, General.
- Vednetra runs without a browser. quad-dasha-selftest prints 8 of 8. The trinetra report was generated
  for a test chart.
- CLAUDE.md at the repository root makes new sessions recognise the SUJ engine.

## Round 2. Knowledge base 1, dominant house (done)

- Rule written into METHODOLOGY.md section 2.0 and ENGINE_CONTRACT.md requirement 10.
- Tool built: suj_engine/tools/stellium.js with the Vednetra loader and data/significations.json.
  It scans the Lagna, Moon and Sun charts, finds every house with two or more planets, marks the dominant
  house, and lists for each planet the natural significations, the functional significations from the houses it
  lords, functional role, dignity, retrograde, combust, nakshatra and Navamsha. It also links the result to the
  question house.
- Tested on two charts. Positions agree with Vednetra's own report for the same chart. One test chart has a four
  planet house and one has only two planet houses, and both are handled.
- Four assumptions are recorded as proposals in METHODOLOGY.md section 2.0, awaiting owner confirmation.
- The significations table is a working table written for this engine and is editable. It is not yet reviewed
  by the owner.
- Moon benefic test now follows the owner's rule, Shukla 6th tithi to Krishna 10th tithi. Vednetra's own
  naturalNature uses a different Moon brightness test, so the two can differ for a Moon near those limits.

## Round 3. Knowledge base 2, planet strength and conflict resolution (done)

- Owner's rule and the six step Hindi method saved word for word in METHODOLOGY.md section 5, with an English
  rendering and the engine's resolution procedure.
- Tool built: suj_engine/tools/planet_strength.js with data/topics.json. For the seven planets it gives Shadbala
  percent against the Santhanam minimums with all six parts, D1 dignity and sign lord condition and neecha bhanga,
  D9 and vargottama and four Vimshopaka schemes and the subject varga, retrograde and combust and graha yuddha,
  aspects and conjunctions and yogas as notes only, the subject and dasha count at any as-of date, and a
  separate node assessment. It prints the mathematical and the owner adjusted rankings side by side and resolves
  candidate planets to one winner.
- app.js received nine added lines that expose Vednetra's own Shadbala, Vimshopaka, dignity, yoga and aspect
  functions as VedicCore.sujInternals. Nothing else changed. Vednetra's self test still prints 8 of 8. The cache
  version numbers were not bumped because no screen or behaviour changed.
- Tested on one chart. Venus against Saturn for career resolves to Saturn on a two to two vote broken by step 6.
  A node candidate and a bad topic name were also tested.
- Not verified: Vednetra's Shadbala was not compared with a reference program such as Parashara's Light in this
  session. Its ephemeris is a built in analytic one with about one arc minute typical precision.
- Provisional items awaiting owner confirmation are listed in METHODOLOGY.md section 5.4.

## Round 4. Answer rules hard coded (done)

- METHODOLOGY.md section 6, contract requirements 12 to 14 and CLAUDE.md now carry the rules: always decide,
  concrete answer when no options, 2 or 3 bulleted one liners at the end.
- ANSWER_TEMPLATE.md fixes the section order S0 to S9. Version 1, built from the order of the methodology, and
  open to the owner's changes.
- answer_guard.js built and tested on one good draft and five bad ones (hedging, wrong bullet count, answer not
  in the options, bad time status, style characters). It passes the good draft and fails each bad one.
- planet_strength.js can no longer end undecided. Extra fixed deciders were added and tested on a node against
  node case with no topic.
- Activation in a new session needs these commits on the main branch, or the session opened on the working
  branch. At the end of this round they are on claude/pensive-albattani-a7wsss only.

## Round 5. First tested chart and learnings (done)

- Owner reported the true answers for Kundali 892. Engine score was 1 of 5, Married right, Education, Work type, Siblings
  and Parents wrong. Recorded in suj_engine/cases/cases.json and suj_engine/LEARNINGS.md with error tags.
- The misses had a shared pattern. The engine overrode its own indicators by typicality, read a natal promise as proof
  of status, used a rule it had made up for sibling counts, and attached a result to the planet strength winner by feel.
- Built suj_engine/tools/window_scan.js with data/events.json, a dasha and double transit window finder for past and
  future. Built rules_lookup.js for the rule library, prepare.js to run the mandatory tools in one go, cases_report.js
  for the scoreboard.
- answer_guard.js version 2 now fails answers without RULES CITED, WINDOW SCAN, EVIDENCE TALLY and COUNTER EVIDENCE lines,
  with a tally whose leader differs from the final answer, a tie without TIE BREAK, or typicality wording. Self test in
  suj_engine/tests/guard_selftest.js prints 11 of 11. ANSWER_TEMPLATE.md is version 2, ENGINE_CONTRACT.md has
  requirements 15 to 19, CLAUDE.md points to the new steps.
- Not shown. None of this has been shown to raise accuracy. The window scan gives candidates only, 5 to 18 strict windows
  per event on this chart and the same period appeared for several events. The library has nothing on sibling counts or
  parents' longevity. One chart is too few to calibrate anything. The old answers for this chart do not pass guard
  version 2 and are kept only as history in the case notes.
- Needs the owner. Confirm or correct guardrails G4 to G7 in LEARNINGS.md, give the dates of events with true answers
  for future charts, and say how a planet strength winner should map to an event result, which is an open question
  in section 5.4 of the methodology.

## Round 6. Owner decision on weighing evidence, rerun of Kundali 892 (done)

- Rerun of Kundali 892 with the proposed planet resolution is in suj_engine/experiments, results in rerun_892_results.md. Still
  one of five, and it showed that window scan counts are not evidence of an event.
- OWNER DECISION. Where evidence is for and against an option, the side with the stronger planets decides, planets weighed by
  strength and not factors counted. Built as suj_engine/tools/strength_tally.js. Planets count once per side, weight is the
  Shadbala percent with the owner adjusted figure beside it, Rahu and Ketu take their sign lord's weight as a flagged proposal,
  and the score is the share of strength in favour, 0 to 100. Ordered options take the highest level above 50.
  answer_guard.js has a new --ordinal flag. Self test prints 14 of 14. LEARNINGS.md G2 and G5, ANSWER_TEMPLATE.md and
  ENGINE_CONTRACT.md requirement 15 updated.
- Round 7, refinement by the owner. A planet's weight is its REAL strength in the role it plays. The owner's example, a debilitated Sun
  is a weak 9th lord, so its weight for is below its weight against. Built into strength_tally.js. Real strength S is the mean
  of owner adjusted Shadbala, D1 dignity, D9 dignity, Vimshopaka and the subject varga. Evidence types are role, harm and
  weakness, weights S, S and 100 minus S. Self test tests/strength_selftest.js prints 8 of 8. LEARNINGS.md G2 rewritten.
  The composite and its equal weights are the engine author's proposal and await the owner.
- Round 8, owner correction. An aspect works by the planet's natural nature and house ownership by the houses owned, trine most
  beneficial, kendra somewhat, trik harmful. My earlier statement that one strength delivers both results for Saturn was wrong.
  strength_tally.js now has the types lordship and aspect, which work out their own side. For dasha results the owner pointed to
  the Laghu Parashari rules. Built functional_nature.js, the Laghu Parashari class of every planet and of the running dasha
  lords, with the library's rule ids. answer_guard.js requires a DASHA LORDS line in S6, prepare.js runs the new tool. Self tests
  15 of 15 and strength 13 of 13. Question 1 of Kundali 892 retried with typed evidence in
  suj_engine/experiments/q1_evidence_round8.json, Graduation 63, Post graduation 43, so the answer is still Graduation.
- Round 13, second chart, Kundali 2, female, 7 November 1991, 10:50, New Delhi, with the true answers given together with the chart, so it is NOT a blind
  test. True answers lawyer, very happy marriage, child born on 3 May 2021. Engine under the written rules, Housewife, Very unhappy, Marriage, none right. Strength tally
  scores over both charts, 13 hypotheses, AUC 0.50, exactly chance, mean 40.0 for the true and 40.3 for the false. The line near 40 from chart 892 does not hold. The scan
  missed the child event because it reads only D1 houses and Lagna transits, see LEARNINGS H7. cases.json now marks each case blind or not and keeps the hypothesis scores,
  cases_report.js prints the blind score and the AUC. Added the event preset mother_in_law_loss, experiments/lib_hypotheses.js and case2_run.js.
- Round 21, the owner reported the true answers of Kundali 4. Marital status none of the above, right. Education already dropped studies, right. Siblings, the native has one sister, the engine said only child, wrong. Blind total 3 of 8. Recorded in cases.json. The two hits come from the negative lean of the
  lines and the siblings hypothesis, the only true one, scored lowest. Built experiments/null_distribution.js, the scores of each hypothesis type on 24 random charts without any true answer, and tools/z_report.js. Read as z scores against their own type, the updated engine has AUC 0.78 over 80 pairs, raw 0.66, and 0.75 on the blind Kundali 4
  alone. Post hoc and noisy, not confirmed. cases_report.js now prints the AUC of the updated engine. Next, the null and the z rule fixed before the next blind chart.
- Round 20, Kundali 4, male, 14 February 2006, 05:27, Jalandhar, the first BLIND test of the updated engine. The configuration and the decision rules were committed in experiments/preregistration_K4.md before the chart was computed.
  Answers under the rules, marital status None of the above, education Already dropped studies, siblings Only child, saved in suj_engine/cases/answers and recorded as pending in cases.json. All three passed the answer guard. The updated engine
  and the base setting give the same three answers. Every hypothesis scored under its line, the same lean to the negative side as before. event_rank.js has a fast option. A memory limit of the ephemeris cache in app.js makes long
  runs need NODE_OPTIONS=--max-old-space-size=6000. Waiting for the owner's true answers.
- Round 19, the owner decided 60 percent to the nakshatra and 40 percent to the planet degree, the Baladi bands on Rahu and Ketu, and pada numbers tunable if they improve results, and asked for the mix that gets every result
  right. Set the nakshatra weight to 0.6 and the bands on the nodes by default. Searched two families of mixes, 135 and 810 settings, with a permutation test and a leave one chart out check, experiments/quadrant_search.js. Best AUC 0.50
  in the owner's multiplier reading, 0.70 in the blend reading, 45 percent of shuffled answers do as well, held out AUC 0.42 and 0.45. No mix gets all results right and the best one cannot be told from chance. The pada numbers stay
  1.15, 1.15 and 0.7. All these options are still off by default. The only fair test is a new chart answered blind. Self tests 15, 13, 9, 11, 5, 7 and 5.
- Round 18, the owner asked to add the nakshatra and the nakshatra pada to the degree. Built data/nakshatra_factors.json and the nakshatra option in strength_tally.js, event_rank.js and window_scan.js, half weight to the nakshatra lord's real
  strength, pada factors for pushkara pada, vargottama and gandanta. Self test tests/nakshatra_selftest.js prints 5 of 5. Over the 14 hypotheses, AUC 0.46 base, 0.55 with the degree, 0.55 with the degree and the nakshatra, 0.65 when the
  degree bands are also put on Rahu and Ketu. The 0.65 is suggestive and not believable, it is picked from five conditions on the same data. All options are off by default. The next chart, answered blind with the conditions fixed
  before, is the real test. Details in experiments/nakshatra_analysis_results.md.
- Round 17, the owner asked whether the degree of the planets explains the errors. Built degree_capacity.js with data/degree_factors.json, the Baladi avastha and the library's gandanta and pushkara flags, an option degree in
  strength_tally.js and event_rank.js, and nodeDegree as a variant. Over the three charts the AUC goes 0.46 to 0.55, and 0.60 with the nodes, the direction toward the truth is 7 of 14, chance. Part of Kundali 3's event error is
  Rahu's unpenalised weight. The option is off by default and the factors are the engine author's reading. Self test tests/degree_selftest.js prints 7 of 7. Question by question in experiments/degree_analysis_results.md.
- Round 16, third chart, Kundali 3, female, 12 November 2000, 13:13, Indore, true answers given with the chart, so not blind. Divorced now, married on 7 December 2022. Engine under the written
  rules, Unmarried and Child born, none right. Married scored 31. No scan view covered the marriage date, the event rank put marriage second to child birth. Over three charts, 14 hypotheses, AUC
  0.46. Window scan on the two dates of known events, strict views 0 of 2, widest 1 of 2. cases.json keeps dateChecks, cases_report.js prints the recall. New presets eye_surgery and separation. The one
  concrete gap found, a planet conjunct a house lord is not a link, LEARNINGS H10, waits for the owner's word. Blind score unchanged, 1 of 5.
- Round 15, owner agreed that the grade should follow how directly the dasha lords tie to the event. Built suj_engine/tools/event_rank.js, which ranks candidate events for a date by
  specificity, a planet's links divided among the events it serves, summed over Mahadasha, Antardasha, Pratyantardasha and Sookshma, ties to the double then the single transit. window_scan.js now
  also returns the link reasons of each planet. Self test tests/rank_selftest.js prints 5 of 5. On Kundali 2, 3 May 2021, marriage ranks first at 1.76 and child birth last at 0.66, the true event is
  not found. Not tuned to this chart. Waiting for the next chart, to be answered blind.
- Round 14, owner said yes to extending the window scan. window_scan.js now adds subject varga significators, D9 marriage, D7 children, D10 work, D24 education, D3 siblings, D12 parents,
  and tests the double transit from the Lagna, the Moon and the Sun in the same reference, which names the reference in each window. Options varga false, refs, gate single. data/events.json
  gives each event its varga and key houses. Self test 11 of 11. On Kundali 2 the child birth of 3 May 2021 is reached only under the widest view, gate single, at grade B, while marriage is
  at grade A under the strict single and the wide double views, so the engine would still answer marriage. The strict past windows grew, marriage 51 all grade A, so discrimination fell. Recorded in
  LEARNINGS H7. Not changed, the double transit gate and the grading.
- Rerun of Kundali 892 with the engine to round 12, evidence generated by a fixed procedure. Every hypothesis scored under 50, so the answers were Graduation,
  Unmarried, Not working, Only child, Neither alive, one of five, right on work and the father only. The result is a structural lean to the
  negative side, not skill. Recorded in experiments/rerun_892_round12_results.md and in cases.json under reruns. LEARNINGS H6 says a score under 50 must not be
  read as a no until the line is calibrated on many charts with true answers. Needed from the owner, more charts with true answers and event dates.
- Round 12, owner asked to add the node verdicts to the window scan. window_scan.js now takes Rahu or Ketu as a significator only by the
  direct Laghu Parashari rules, occupying an event house, being conjoined with a significator other than the Sun or Moon, or sitting in
  the sign of a significator whose result it doubles, LP-062-1, LP-056-6, LP-057-2, never by aspect. Each node that enters is listed with
  its reason. Cost, on Kundali 892 the strict windows grew, marriage 9 to 13, father 11 to 17, mother 13 to 29 with all 29 at grade A,
  education 7 to 13, siblings 5 to 8, job unchanged at 18. A node in the list makes the whole Rahu Mahadasha, 2002 to 2020, a
  significator level, so grade A is easy to reach and the scan separates less. nodes false gives the earlier view.
- Round 11, owner asked to go down to Sookshma and leave Prana. window_scan.js now reads Mahadasha, Antardasha, Pratyantardasha and
  Sookshma, day by day. The window and its grade are still fixed at Pratyantardasha level and each window lists the Sookshma
  periods whose lord is a significator, the sharpest days. Prana is not scanned. Self test tests/window_selftest.js prints 6 of 6.
  Run time about 2 seconds per event. The Sookshma list does not make the scan discriminate better, it only gives dates.
- Round 10, owner pointed to the direct nodal rules in Laghu Parashari. functional_nature.js now classifies Rahu and Ketu by the house
  occupied and the companion planet, LP-056-6, LP-062-1, LP-057-2, LP-062-2, LP-062-3, LP-058-3, with no sign lordship, LP-060-2.
  Kundali 892, the running Pratyantardasha Rahu is alone in the 12th, sama but vyayakaraka, doubling Mars. Self test
  tests/functional_selftest.js prints 9 of 9. Aspects are not counted as sambandha for the nodes, LP-057-4. Still open, the
  window scan reads dasha to Pratyantardasha only and its significator list does not yet use these node verdicts.
- Round 9, owner decision. Laghu Parashari is for dasha results only, for the concerned planet in its own Mahadasha, Antardasha,
  Pratyantardasha, Sookshma or Prana. It does not enter the natal tally, where the owner's classes govern. Houses 2 3 11 therefore stay
  outside the classes and carry no weight in the tally. functional_nature.js now prints all five dasha levels. Still the engine
  author's reading, the factors 1.0 for trine and 0.5 for kendra.
- Question 1 of Kundali 892 under the new rule with the evidence listed by the analyst, Graduation 65, Post graduation 39. Result
  is Graduation, so the true answer is still missed. The owner is asked to check the placement of the planets in the evidence table.
- Still open, planet strength winner to event result mapping, the sibling brother and sister split, employed or not, and
  whether planet_strength.js should drop planets with fewer than three subject links and add derived houses.

## Round 22. Engine 2.0 made the default (done)

The owner asked to update the engine with all the learnings and merge it so that all future analysis follows it.
- data/engine_config.json and tools/engine_config.js. Version 2.0. Degree capacity, nakshatra and pada impact and the node bands are on by default in strength_tally.js, event_rank.js and window_scan.js. A key set by the caller wins. engine legacy gives the round 12 configuration, used by the old self tests and experiments.
- The hypothesis generator moved from experiments to tools/hypotheses.js. data/hypothesis_types.json holds the 14 types, data/null_distribution.json the null from 24 random charts. tools/score_hypotheses.js gives the raw score and z score. prepare.js prints them for yes or no topics. It reproduced the stored Kundali 4 scores, 21 for siblings and 40 for CA.
- answer_guard.js version 3 requires one ENGINE VERSION line in S8, legacy needs --allow-legacy. ANSWER_TEMPLATE.md version 3. CLAUDE.md and ENGINE_CONTRACT.md name engine 2.0 as the default.
- tests/engine_selftest.js added, 8 checks. Self tests all pass, guard 18, strength 13, functional 9, window 11, rank 5, degree 7, nakshatra 5, engine 8.
- Honest limits. The z rule is provisional, found after the Kundali 4 answers were known, updated z AUC 0.78 over 80 pairs, post hoc. The Baladi numbers and pada factors are the engine author's. No validated rule for the number of siblings or children, or for divorce. The blind score is 3 of 8. The next blind chart with the null fixed beforehand is the first fair test of the z reading.

## Round 23. Kundali 5 answered and scored (done)

- Native male, 29 January 1983, 14:45, Mumbai. Question 1 children, question 2 the event of 19 September 2022. Engine answered two sons and foreign travel, the owner reported two daughters and the native's death on 19 September 2022. Both wrong. The top two asked for afterwards were right on question 2, death was second. Recorded as K5 in cases.json, scoreboard 3 of 10 blind, AUC 0.48 raw and 0.68 for the updated engine over 88 pairs.
- Existence of children was called right by the hypothesis score, 61, z 1.16. The sex call by planet gender was wrong. The death date was missed because the engine has no death event, the event rank had health_crisis first, and the hand typed tally counted a strong longevity promise and a favourable day verdict against death. Details and proposed changes in LEARNINGS H15.
- Owner approved the three proposals, built the same round. native_death preset, topic death in prepare.js, native_death in event_rank.js. Status rule in strength_tally.js, options capacity and statusEvent. tools/child_sex.js with the two proposed readings. Self test tests/round23_selftest.js 4 of 4, the other self tests still pass, guard 18, strength 13, rank 5, engine 8, window 11. On Kundali 5, 19 September 2022, event_rank now puts native_death first, 1.0 against foreign travel 0.8, a post hoc result and not a test. Contract requirements 21 to 23, LEARNINGS G13.

## Next phases (waiting for the owner's further instructions)

- Phase 1. Question intake and event mapping (question to house, karaka, divisional chart, Nth house).
- Phase 2. Chart data layer on VedicCore (D1 Lagna, Moon and Sun charts, D9, D3, D7, D10, D12, D24, D30).
- Phase 3. The five processes A to E over each chart, with the weightage order of section 1.
- Phase 4. Divisional chart analysis.
- Phase 5. Dasha, Antardasha, Pratyantardasha across past, present and future with as-of date.
- Phase 6. Transit validation for Saturn, Jupiter, Rahu, Ketu and Sun.
- Phase 7. Rule library lookup from the 1,561 rules.
- Phase 8. Conflict resolution, single definitive answer and the closing summary section.
- Phase 9. Test charts and verification.

## Open points to confirm with the owner

1. Sun chart. The text says Rashi chart and Moon chart in section 2.1 but names the Sun chart in the process
   note, and Sudarshan means all three. Default plan is to run all three.
2. Process count. Section 2.2 lists four items, the later sub-sections give five processes (A to E). Default
   plan is to run all five.
3. Ayanamsha. The app supports Lahiri, Raman and KP. Default plan is Lahiri.
4. Numeric scale for the weightage. The text gives an order and a direction (positive or negative) but not
   point values. A scale needs to be agreed.
5. Karaka table and the key house per question type beyond the examples given.
6. The README of this repository records that 52 pre registered tests of classical interpretation rules came
   out at chance level. The engine will always give one definitive answer as required. A confidence grade
   inside the closing summary is proposed so the definitive answer is not mistaken for a proven one.
