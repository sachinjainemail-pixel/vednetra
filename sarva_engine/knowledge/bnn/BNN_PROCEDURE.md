# BNN procedure for the SARVA engine

Working summary of BNN-METHOD-GUIDE.pdf, the owner's 54 page Hindi guide to the SHREE GANESH JI BLESSED BNN project
(dated 15 November 2026). The guide is the authority. This summary is the English map of it, written by the engine
author, and the guide wins on any difference. The text of the guide is in BNN-METHOD-GUIDE.txt and its heading index
with line numbers is in BNN-METHOD-GUIDE.index.tsv. For every question read the guide sections named below, do not work
from this summary alone. All 123 rule IDs the guide cites were checked and exist in BNN-RULES-5COLUMN.csv.

## The five points to hold on every page (guide section 1)

1. Read karakas, not houses. Counting houses from the Lagna and using house lords is forbidden.
2. Time comes from Vimshottari and transit. Vimshottari says when, BNN says what.
3. A verdict is written only when its rule was searched in this very conversation, quoted word for word with its ID.
4. Every sieve prints its pass rate. A sieve that gives the same result on every chart is a fault.
5. Every department prints its measured accuracy, so the reader sees whether that lane has ever been right.

## Corpus and priority (section 2)

3,073 rules. Rao's four books win, then a worked chart over prose, then Tier 2, then Tier 3. Negandhi, Naik, Bang and
Gopalakrishnan do not count as independent confirmation. SAI part 1 rejects the Lagna and part 2 counts from it, so
part 2 is never cited. GUP chapters 2 to 6 are not corpus. The Parashari parts of PRK are not BNN. Input is the
VedNetra BNN Chart Export, blocks A to H1, sex is mandatory. Transit dates are computed from the verified VedNetra
panchang and never written from memory. For a past event the chart is recast on the date of the event as the enquiry
date (section 2.5).

## Lanes and grades (section 4)

Lane A BNN transit, Jupiter clock, crossings, stations. Lane B Vimshottari, who holds the door. Lane C fast triggers
of Sun and Moon. Lane D navamsa, optional, agreement lifts a grade one rung and absence never lowers it. Lanes are
never averaged, disagreement is information.

Grades are CONFIRMED, INDICATED, POSSIBLE, OPEN and DENIED, conditions in guide 4.2. Caps in guide 4.3: a dated verdict is
never CONFIRMED if the scan surface is narrower than the screen, a sieve with pass rate above 60 or below 5 percent caps
at POSSIBLE, ten layers written after reading the chart cap at POSSIBLE, and a department that loses to its best fixed
answer caps at POSSIBLE. A department at or below chance is OPEN and the engine says the lane does not work.

## Order of work for every question (guide section 6, never reorder)

0 ledger, 0a open the corpus and search (here: bnn_rules.js), 0b load the named method register for the question,
0b1 write the ten layers for every option before touching the chart, 0c for multiple choice screen the options first,
0d declare the scan surface, 0e declare the connection set 1 5 9 and 3 7 11 and 2 12 (4 6 8 10 are never connections),
0f one line of the department's measured accuracy, 1 identity and sex check, 2 exchanges, 3 read the karaka frame, 4 keep
planets apart and do not blend a crowded sign, 5 search and quote rules, 6 strength relief and cancellation, 7 prerequisite
test and chain, 7a promise ledger, 7c ten layer test, 8 delivery window test, 8b window map, 8c scale rule for counts and
ages, 9 timing on lanes A B C D, 9a candidates built by sieve, 9b sieve self check, 9c pass rates, 9d order survivors by
the promise word, 10 grade, 10a tie break ladder, 11 write the answer.

## Multiple choice (guide 13.3, section 16)

Name each option's own karaka from the retrieved corpus, test it in this chart, remove an option whose own karaka is
exalted, supported and untouched by Saturn, Rahu and Ketu, then read the subject karaka and rank the survivors. Print the
screening table. Among survivors the combination that names more planets is more direct. An option the register does
not name is OPEN and is not given the nearest planet silently.

## Tie break ladder (guide section 14)

Rung 0 screening, 0a one full surface, 0b promise word, 0c sieve pass rate 100 or 0 percent voids the comparison, 0d event
polarity, 0e ten layer count, 1 the rule that names the outcome most directly, 2 source tier, 3 presence over aspect
(guide 4B.2), 3a connection class, 4 delivery window, 4a lane B delivery set, 4b node entry freshness, 5 isolation and
node position, 6 dignity for quality only, 7 trine weight, 8 degree order, 9 none.

## Ten layers (guide section 17)

For each option write ten plain words preconditions before reading the chart, tested by four refusal tests (outcome,
anchor, direction, reading). Lane L N is the one that decides, karaka based, counting only SATISFIED layers. Lane L H
follows the source document and never decides and is never averaged with L N. If the tables for L H are absent print NOT
RUN. Rank by the number of SATISFIED layers, a lead of under two layers is narrow but is still named. The method is
unmeasured as of the guide, so on its own it caps at POSSIBLE.

## Department methods (guide section 16)

Education 16.1, profession 16.2, marital status 16.3, children 16.4 (decide marriage first), parents 16.5, siblings 16.6,
residence and foreign settlement 16.7, disease 16.8, dated events 16.9, stature and marks 16.10. Read the department
section of the guide for the question and use its listed rule IDs.

## Measured accuracy (guide 15.2, from the owner's own backtest, 20 charts and 127 questions)

First version 41 of 127, 32.3 percent. After eleven corrections 52 of 127, 40.9 percent, chance 24.8 percent. Marriage
9 of 19 and dated events 4 of 8 are above the best fixed answer. Parents, education, residence, children, siblings,
profession and disease are at or below it, so their grades cap at POSSIBLE. The best fixed answers per department summed to 47.2
percent, above the engine's 40.9 percent. Say this in the EVIDENCE line of any BNN cell for those departments.

## Honest date limits (guide 18.2)

Birth time to the minute with blocks E and H, one week. To the hour, one month. Half a day or rectified, one quarter. No
birth time, at most one quarter and lane B closed. Always give both ends of the window.

## How SARVA reconciles the guide with the SARVA contract

The guide and the SARVA contract differ in four places. SARVA wins in the table, the guide's own result is kept in the
EVIDENCE line.

1. The guide answers with one or two ranked answers. The SARVA BNN cell is the rank 1 option only.
2. The guide prints both options and grades POSSIBLE when the ladder ties through rung 9. The SARVA cell must be one
   option. On a rung 9 tie the cell is the option that is ahead on the most rungs from 0 to 8, then the option whose
   outcome rule names more planets, then the option listed first. The EVIDENCE line then says LADDER TIE FORCED PICK so
   the reader knows BNN itself found no separator.
3. A grade of OPEN or POSSIBLE is not a blank. The cell is still the best supported option and the grade is in the
   EVIDENCE line.
4. The guide's side table that compares the ten layer score with Chawdhri and Sutton is NOT RUN under SARVA, because no
   methodology reads another's verdict. The guide's closing line of colloquial Hindi per question is optional in SARVA.

## Not supplied

The guide names LEDGER BNN, files 23 BACKTEST WHATSAPP 20, 24 DEPARTMENT METHODS, 25 RULE OF 10 AMENDMENT and 25
BACKTEST DATASET, and the project files 01 and 03 to 10. They are summarised in the guide and not attached. Step 0 of
the guide says to state a missing ledger once, do that, and do not invent ledger lines.
