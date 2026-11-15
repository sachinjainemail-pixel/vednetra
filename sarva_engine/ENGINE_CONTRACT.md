# SARVA ENGINE CONTRACT

Binding requirements from the owner. Any answer given under the name SARVA engine must satisfy all of them,
in every session, for every chart. This file is read by CLAUDE.md at the repository root, so a new Claude Code
session picks it up with no reminder.

## 1. The five methodologies, and only these

The SARVA engine runs exactly five methodologies, always in this order.

| No | Code | Methodology | Where it lives |
|---|---|---|---|
| 1 | KPPRO | KP Pro | sibling repo KP-Pro-sutton, knowledge/kp_pro and src/kpredict methods/kp_pro.py |
| 2 | KCIL | KCIL | sibling repo KP-Pro-sutton, knowledge/kcil and src/kpredict methods/kcil.py |
| 3 | SUJ | SUJ engine | this repo, suj_engine |
| 4 | CHAWDHRI | CHAWDHRI | sibling repo CHAWDHRI, run with jyotish.sh |
| 5 | BNN | BNN, Bhrigu Nandi Nadi | chart export by the vednetra-bnn skill, rules in the owner's BNN rule files, see METHOD_ROUTING.md |

No sixth methodology is ever run, cited or used as a tie breaker. That excludes Poddar, Sudarshan, Shri Jha Ji,
Trinetra, BPHS lens skills, UKN, Ududaya, SAV, Jaimini, Yogini, Chara and any lens not in the table. Charts
come from VedNetra and the sibling engines, that is tooling and not a methodology. If a question seems to need
another methodology, say so and ask the owner. Do not add it.

## 2. Every question under every methodology

For each question, with its options if any, the engine analyses the question separately under each of the five
methodologies, in the table order. No methodology is skipped, merged, shortened to a line, or answered from
another methodology's result. Each methodology follows its own source rules in full. SARVA adds no rule of its
own to a methodology and removes none.

## 3. One finalized option per methodology per question

Each methodology ends each question with exactly one finalized option, the option its own analysis supports
best. With options, the cell is one of the given options. Without options, the cell is one concrete answer. A
methodology never returns two options, a range, or a refusal to choose. Where a methodology's own evidence is
thin, it still names its single best option and says in the EVIDENCE line how thin the evidence is.

The one exception is the BNN rule files rule in section 7.

## 4. The final output is a table

After all questions are analysed, the last block of the reply is one table. One row per question, in question
order. Columns exactly: Question, KP Pro, KCIL, SUJ engine, CHAWDHRI, BNN. Each cell holds the finalized option
of that methodology for that question. The table is the final output, nothing follows it. The engine adds no
sixth column, no majority vote, no blended answer and no overall winner unless the owner asks for one in that
session.

Where methodologies disagree, the table shows the disagreement as it is. It is never smoothed.

## 5. Isolation between methodologies

1. Each methodology casts and reads its own chart on its own settings. KP Pro uses the KP ayanamsa, true
   Placidus and mean nodes. KCIL uses the Khullar ayanamsa, true nodes, geocentric latitude and sub sub lords.
   SUJ, CHAWDHRI and BNN take chart numbers from VedNetra. A report cast for one methodology is never fed to
   another.
2. No methodology reads another methodology's verdict before it finishes its own. The five are decided
   independently and only then placed in the table.
3. The CHAWDHRI repository's own rule still holds when its engine is run. Its engine uses its own sources only.
   SARVA calls it as a whole and does not mix the other four into it.
4. The Sutton nakshatra layer of the CHAWDHRI engine is a second opinion inside that engine. The CHAWDHRI cell
   is the Chawdhri answer and not the Sutton block.

## 6. Evidence rules that hold for all five

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
