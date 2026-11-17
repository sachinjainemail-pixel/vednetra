# SARVA METHODOLOGY, the all methodology comparison

Round 23 gave the rule, round 26 made it a program. Binding for every chart, in this session and in every new Claude Code session. The program is suj_engine/sarva, and the table it prints is the whole reply.

## Trigger

The word SARVA at the start of a message, or any chart with questions (a native, birth data and one or more questions) in this repository. If the owner gives a chart and questions, this applies even when the word SARVA is missing.

## What the owner wants

1. Run EVERY methodology of the registry on the chart, for EVERY question, in the back end.
2. The ONLY response is one comparison table, one row per question and one column per methodology. No steps, no analysis, no sections, no bullets, no explanation. The table is printed by `index.js table` and by nothing else, and it is not printed when its guard fails.
3. The SUJ analysis is still done in full in the back end, its draft still passes answer_guard.js, but the reply carries only the table. CLAUDE.md rules about closing bullets do not apply to the SARVA reply.
4. Do not commit anything unless the owner asks.

## The procedure, every time

1. Write chart.json in the scratchpad. The questions and options are copied from the owner's text character for character, in the owner's language, and the owner's raw text goes in the field post. The tool checks that every option is a substring of post. Never translate, reword, reorder or shorten an option. Give the chart number in number when the chart belongs to a group.
2. `node suj_engine/sarva/index.js run chart.json --out DIR --asof DATE`. It classifies each question (education, marriage, children, work, residence, siblings, parents, or a dated event), runs Shri Jha Ji, Poddar and KP Pro on the options exactly as written, writes the dossiers for SUJ, Chawdhri and the Vednetra KP skill, prints which questions have no validated rule, and writes picks.template.json.
3. Read the dossiers and fill picks.json. This is the reader's step, for SUJ, Chawdhri and the Vednetra KP skill, which give evidence and no pick, and for any Poddar tie. Each pick is one of the options verbatim. Rules for the reader in the section below.
4. `node suj_engine/sarva/index.js table chart.json --out DIR --picks picks.json`. If the guard fails, fix the picks and run it again. Send the printed table as the reply, and nothing with it.
5. After the owner reports the true answers, write truths.json with the owner's option text and run `index.js score ... --record`. Then record the case as in CLAUDE.md, with the SARVA picks under otherMethods, and update LEARNINGS.md and STATUS.md. The scoreboard is suj_engine/cases/sarva_scores.json.

## The registry, suj_engine/sarva/registry.json

SUJ (analyst), Shri Jha Ji (auto), Chawdhri (analyst), Poddar (auto, ties go to the reader), KP Pro (auto), Vednetra KP skill (analyst), Other Vednetra skills (report only, they say not run until the owner decides how they are read). The owner adds a row, and every later table gets the column. A column is never dropped. If every cell of a column says not run for one reason, the table shows it as one line.
Repositories sit next to this one, SARVA_ROOT overrides. A missing repository gives not run. Attach it with add_repo first.

## What the program refuses, and why. Each line is a mistake of Kundali 893

| Guard | Refuses | Origin |
|---|---|---|
| G1 verbatim | a pick that is not one of the owner's options, an option that is not in the owner's post | the options were put into English for two engines, Poddar could not read the childless and marriage kind options and answered from a flat prior |
| G2 no chain | a reader's note that leans on another question, unless dependsOn declares it, and then the cell shows dep | questions 2 and 3 were answered from the wrong reading of question 5 |
| G3 flags | any flag outside the registry. Tie, unreadable option, no rule, read, shortlist, seen and dep always show in the cell | the table must never look surer than the engines |
| G4 dated | a reader's pick on a dated question that does not record both transit gates | the double gate alone hid a child birth on two charts |
| G5 complete | a missing cell | no column is dropped, and a failed engine says not run with a reason |
| G6 style | a table with a character the owner does not want | the owner's style rule |
| G7 SUJ draft | a SUJ pick whose draft does not pass answer_guard.js with the owner's options | the guard must not be bypassed |

Other protections in the program. The first option of a tie is never a pick, the cell says tie. A reader's override of an automatic tie says read. An unreadable option makes the cell say incomplete, unmapped or stop. A question with no validated rule, data/no_rule_topics.json, says no rule in every column but Shri Jha Ji, which holds the rules. An engine that already holds the true answers of the chart in its own data, Poddar practice charts, the KP Pro backtest, a recorded SUJ case, says seen, and the scoreboard does not count it. A first pick that equals the truth is a hit, a tie that contained the truth is a tie hit and never a hit, a second place is counted apart, a column not run is not counted as wrong.

## Rules for the reader of the dossiers

1. SUJ. Read every question's dossier as in CLAUDE.md, with all of LEARNINGS.md G1 to G16. A dated question is read under both gates, and the pick records them as gates double and single true.
2. Chawdhri. Follow the section Multiple choice and dated questions in its skill. An adverse lean is not the outcome, a closed gate is not a denial, past firing windows mean the event could have happened already, the engine has no topic for an accident or a jail, and the books give a trigger for marriage only.
3. Vednetra KP skill. Read the CSL promise board B4 and the event group scan B5. Note that the app denies a CSL that stands in the star of Rahu or Ketu as retrograde, which is a known disagreement with the KP Pro engine, see STATUS round 25.
4. Poddar. Break a tie from the chart reading, and mark it read. The first option is never a pick.
5. Residence is read from the 4th house. A foreign window is travel and not an address, G14.
6. No reading uses the answer of another question. If two answers must agree, say nothing, the table shows what each engine said.
7. Do not invent a rule to separate options. If the evidence cannot separate them the reader still names one option, as the contract says always decide, and the cell says no basis or no rule beside it.

## Rules for the back end

1. Intake as in CLAUDE.md. If the birth data is missing ask for it in one short message, nothing else.
2. As of date is the system date. Dated events are run at that date in every engine that can.
3. Computations come from Vednetra or the methodology's own tool. Nothing by hand, nothing from memory, nothing copied from another column.
4. Nothing is written into a repository. run-nobrowser.js writes report_out.md into the repository root, delete it. Do not commit birth data, charts, tables or outputs unless the owner asks.
5. A table is not an accuracy claim. The scoreboard prints the chance level beside every column. On Kundali 893 the best column was level with chance.

## Reply format

A code block with space aligned columns and a line of the equal sign under the header, three engines to a block, the question column repeated. No markdown table, its separator needs the hyphen. Cells hold the option text, with the characters the owner does not want turned into spaces, and the flags. One legend line follows, only for flags that appear. The owner's style rule applies, none of these characters ( ) ! ; : em dash, curly quotes, / - # * ~ .

## Tests

`node suj_engine/tests/sarva_selftest.js` prints 26 of 26. Every guard above has a test, and so does the scoreboard.
