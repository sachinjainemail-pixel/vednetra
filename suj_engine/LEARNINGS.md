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
G2 Every answer carries an EVIDENCE TALLY line in S8 with a whole number for every option. One unit is one distinct
   chart factor from the methodology that points at the option, for example a house, a lord, the karaka, the Nth house
   from them, D9, the subject varga, a dasha window, a transit, a rule from the library. A factor seen in the Lagna
   chart and the Moon chart is counted once and noted. The final answer is the option with the highest number. A tie
   needs a TIE BREAK line naming the deciding step of METHODOLOGY.md section 5.4. The guard checks this.
G3 Every flag against the leading option appears on the COUNTER EVIDENCE line and is counted in the tally. A flag may
   be answered by a protective factor only if that factor is counted on the other side. The guard requires the line.
G4 A natal promise is capacity. For status questions, working or not, married or not, parent alive or not, tally the
   promise and the status indicators separately and let the status tally decide. A candidate window from the window
   scan is needed for an event to be called past. A window alone does not prove it. In case 1 a grade A job window
   existed in 2025 and the true answer was unemployed.
G5 Ordinal options such as education levels. Evaluate each level with its own chain of houses, lords, varga and
   dasha window. Do not pick the middle by default. Proposed, from one case: where the chains of two levels are level
   in the tally, the higher level wins, because the lower level is already contained in the higher one.
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
H2 Ordinal. The true level was the highest level whose chain was supported. Test it on further education, wealth
   and rank questions.
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
