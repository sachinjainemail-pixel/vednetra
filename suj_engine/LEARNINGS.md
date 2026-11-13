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
   Differences between the owner's three classes and Laghu Parashari, for the owner to settle. The library puts the 3rd and 11th
   lords among the doshi, LP-023-16, the 2nd and 12th lords among the sama, LP-024-18, and the 8th lord among the doshi too. The
   owner's classes put 6 8 12 as harmful and say nothing of 2 3 11.

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

## What the new tools do and do not do

- functional_nature.js gives the Laghu Parashari class of each planet for dasha results. Connections to the yogakarakas are shown only as
  same sign, exchange or aspect either way, the library's four sambandha types are not all coded. Rahu and Ketu are not classified.
- strength_tally.js weighs the planets for and against each option by their real strength, the owner's rule of rounds 6 and 7.
  It cannot decide which side or type a planet belongs to, that stays with the analysis. Self test in tests/strength_selftest.js.
- window_scan.js lists candidate dasha and double transit windows. On this chart the wide view gave 72 to 142 windows
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
