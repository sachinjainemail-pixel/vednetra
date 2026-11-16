# SARVA ENGINE CONTRACT

Binding requirements from the owner. Any answer given under the name SARVA engine must satisfy all of them,
in every session, for every chart. This file is read by CLAUDE.md at the repository root, so a new Claude Code
session picks it up with no reminder.

## 1. The seven methodologies, and only these

The SARVA engine runs exactly seven methodologies, always in this order. The owner set five at the start and added the
sixth and seventh on 16 November 2026, see STATUS.md.

| No | Code | Column | Methodology | Where it lives |
|---|---|---|---|---|
| 1 | KPPRO | KP Pro | KP Pro | sibling repo KP-Pro-sutton, knowledge/kp_pro and src/kpredict methods/kp_pro.py |
| 2 | KCIL | KCIL | KCIL | sibling repo KP-Pro-sutton, knowledge/kcil and src/kpredict methods/kcil.py |
| 3 | SUJ | SUJ engine | SUJ engine | this repo, suj_engine |
| 4 | CHAWDHRI | CHAWDHRI | CHAWDHRI | sibling repo CHAWDHRI, run with jyotish.sh |
| 5 | BNN | BNN | BNN, Bhrigu Nandi Nadi | sarva_engine/knowledge/bnn, chart export by the vednetra-bnn skill |
| 6 | UDU | Udu | Shree Ganesha Blessed Udu, also UduDaya | sarva_engine/knowledge/udu, chart report by the vednetra-ududaya skill |
| 7 | QUAD | Quad Dasha | Quad Dasha, Vimshottari Chara Kaal Chakra Yogini | sarva_engine/knowledge/quad, chart report by the vednetra-quad skill |

No eighth methodology is ever run, cited or used as a tie breaker. That excludes Poddar, Sudarshan, Shri Jha Ji, Trinetra,
BPHS lens skills, UKN, SAV and any lens not in the table. Chara, Kaal Chakra, Yogini and Laghu Parashari run only inside the Quad
Dasha column, never as columns of their own. Charts come from VedNetra and the sibling engines, that is tooling and not a
methodology. If a question seems to need another methodology, say so and ask the owner. Do not add it.

## 2. Every question under every methodology

For each question, with its options if any, the engine analyses the question separately under each of the seven
methodologies, in the table order. No methodology is skipped, merged, shortened to a line, or answered from
another methodology's result. Each methodology follows its own source rules in full. SARVA adds no rule of its
own to a methodology and removes none.

## 3. One finalized option per methodology per question

Each methodology ends each question with exactly one finalized option, the option its own analysis supports
best. With options, the cell is one of the given options. Without options, the cell is one concrete answer. A
methodology never returns two options, a range, or a refusal to choose. Where a methodology's own evidence is
thin, it still names its single best option and says in the EVIDENCE line how thin the evidence is.

The one exception is the missing rule files rule in section 7, which covers BNN, Udu and Quad Dasha.

## 4. The final output is a table

After all questions are analysed, the last block of the reply is one table. One row per question, in question
order. Columns exactly: Question, KP Pro, KCIL, SUJ engine, CHAWDHRI, BNN, Udu, Quad Dasha. Each cell holds the finalized option
of that methodology for that question. The table is the final output, nothing follows it. The engine adds no
eighth column, no majority vote, no blended answer and no overall winner unless the owner asks for one in that
session.

Where methodologies disagree, the table shows the disagreement as it is. It is never smoothed.

## 5. Isolation between methodologies

1. Each methodology casts and reads its own chart on its own settings. KP Pro uses the KP ayanamsa, true
   Placidus and mean nodes. KCIL uses the Khullar ayanamsa, true nodes, geocentric latitude and sub sub lords.
   SUJ, CHAWDHRI and BNN take chart numbers from VedNetra. Udu casts on Lahiri only. Quad Dasha casts on Lahiri with its own
   dasha engine and whole sign houses. A report cast for one methodology is never fed to another.
2. No methodology reads another methodology's verdict before it finishes its own. The seven are decided
   independently and only then placed in the table.
3. The CHAWDHRI repository's own rule still holds when its engine is run. Its engine uses its own sources only.
   SARVA calls it as a whole and does not mix the other four into it.
4. The Sutton nakshatra layer of the CHAWDHRI engine is a second opinion inside that engine. The CHAWDHRI cell
   is the Chawdhri answer and not the Sutton block.

## 6. Evidence rules that hold for all seven

1. Charts, dashas, divisional charts and transits come from the tools of the methodology. Never by hand and
   never from memory.
2. Check the promise and also the time status for every event, already happened, happening now or due in the
   future, using the system date as the as-of date.
3. A chosen option rests on counted chart evidence. Typicality, base rates, cohort priors and the safe choice
   are not evidence. In particular the kpredict ask command at its default setting returns the cohort prior
   because the measured chart weight is 0. That output is never a KP Pro or KCIL cell. Use the per method
   opinion of the read command and the methodology's own rules.
4. Never retune a weight, band or rule because of one chart.

## 7. BNN, rule base and method guide

BNN rests on two owner supplied files under sarva_engine/knowledge/bnn/.
1. BNN-RULES-5COLUMN.csv, 3,073 rules from 21 books, read with node sarva_engine/tools/bnn_rules.js.
2. BNN-METHOD-GUIDE.pdf with its text BNN-METHOD-GUIDE.txt and index BNN-METHOD-GUIDE.index.tsv, the owner's 54 page
   guide to the procedure. BNN_PROCEDURE.md is the English map of it. The guide wins on any difference.

Requirements.
1. The BNN procedure of the guide is followed in its own order, steps 0 to 11 of guide section 6. Read the guide
   sections for the question's department, guide section 16, before reading the chart. The BNN tie break ladder, the
   grades and the grade caps apply as the guide states them.
2. Every BNN claim rests on a rule searched in the session and quoted by Rule ID. The engine never reads BNN from
   memory or from general knowledge of Bhrigu Nandi Nadi.
3. BNN reads karakas and not houses. Time comes from Vimshottari and transit on a verified panchang. Sex is mandatory.
4. The BNN cell is the rank 1 option of the BNN procedure, one option, see BNN_PROCEDURE.md for how SARVA reconciles the
   guide where the guide would print two answers. A ladder tie is shown in the EVIDENCE line as LADDER TIE FORCED PICK.
5. The BNN EVIDENCE line carries the BNN grade, one of CONFIRMED, INDICATED, POSSIBLE, OPEN or DENIED, and at least one
   Rule ID, and for a department that is at or below its best fixed answer says so.
6. Where authors in the rule base disagree, cite both and decide on the chart. The later rule that says it settles the
   point wins over the earlier one.
7. BNN does not read another SARVA methodology's verdict. The guide's comparison with Chawdhri and Sutton is NOT RUN.
8. A BNN chart export block that is missing makes the reading partial. Say which block. Never estimate it.
9. Only if the rule csv is absent from the session, the engine states it once, asks the owner for it, and fills the BNN
   cell with the exact text NOT RUN BNN RULES MISSING. The guard accepts that text only while the csv is absent and
   reports the answer as incomplete. With the csv present the text is an error.

## 7b. Udu, rules and method

Method document sarva_engine/knowledge/udu/UDU-METHODOLOGY.pdf with its text, heading index and the English map
UDU_PROCEDURE.md. The document wins on any difference.
1. Udu answers only from its own rule corpus, 11,683 rules in nine files UDU-*.md. Every Udu claim carries a Rule ID. The
   engine never answers Udu from general astrology and never invents a rule, which the document calls the one real failure.
2. The seven laws apply in order, the routing table of the document picks the corpus file, UDU-REF-coverage.md is read first,
   and the weighing formula of the document with the arithmetic shown fixes the verdict. The period test is a gate.
3. The Udu cell is the option with the highest weighted sum, one option. A tie goes to the option with the pada level rule. The
   EVIDENCE line carries a Udu Rule ID such as ASH-1467 and says that no accuracy has been measured for Udu.
4. Gender and birth time are required. Lahiri only. The chart comes from the vednetra-ududaya skill.
5. The corpus files are not in the repository yet. The guard treats the corpus as present only when all nine files exist in
   sarva_engine/knowledge/udu. Until then the Udu cell is the exact text NOT RUN UDU RULES MISSING, and the guard reports the
   reply as incomplete. Never fill the Udu cell from memory.

## 7c. Quad Dasha, rules and method

Sources sarva_engine/knowledge/quad/QUAD-METHODOLOGY-INTRO.pdf (section 1 only), QUAD-REPORT-CONTRACT.md and the English map
QUAD_PROCEDURE.md.
1. Chart and all four dasha systems come from the vednetra-quad runner after its self test prints RESULT READY, with asOf set
   to the date the question is about. That is the validated COMPUTE layer.
2. The READ rules of Chara, Kaal Chakra, Yogini and Laghu Parashari, and the Rule of 10 option test, are in sections 3 to 19 of
   the Quad methodology file, which has not been supplied. The guard treats the Quad rules as present only when
   sarva_engine/knowledge/quad/QUAD-FULL-METHODOLOGY.pdf, .txt or .md exists. Until then the Quad cell is the exact text
   NOT RUN QUAD RULES MISSING and the reply is reported as incomplete.
3. When the file is present the report contract binds. The levels licensed, the stability gate, the four confidence words
   COMPUTED, CLASSICAL, UNSTABLE and VACUOUS in the EVIDENCE line, no death dating, no claim of a validated hit rate.
   The cell is the option the Rule of 10 ranks first.

## 8. Inputs the engine needs

Native name, gender (mandatory, BNN and KCIL both depend on it), date of birth, time of birth with seconds if
known and how sure the time is, place of birth with latitude, longitude and the time zone in force on that date,
and the questions with their options. The as-of date is the system date. If birth data is missing, ask in one
short message and then proceed. Unknown places are never guessed.

## 9. Guard

Write the draft reply to a file and run node sarva_engine/tools/sarva_guard.js on it before sending. The SUJ
part of each question is also checked by suj_engine/tools/answer_guard.js, which the SARVA guard runs when the
SUJ answer file is named. See ANSWER_TEMPLATE.md.

## 10. Persistence

These requirements are stored in the repository and loaded through CLAUDE.md. They hold in this session and in
every new session. They change only when the owner changes them, and STATUS.md records each change.
