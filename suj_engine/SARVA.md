# SARVA METHODOLOGY, the all methodology comparison

Added in round 23 by the owner. Binding for every chart, in this session and in every new Claude Code session.

## Trigger

The word SARVA at the start of a message, or any chart with questions (a native, birth data and one or more questions) in this
repository. If the owner gives a chart and questions, this applies even when the word SARVA is missing.

## What the owner wants

1. Run EVERY methodology in the registry below on the chart, for EVERY question, in the back end.
2. The ONLY response is one comparison table. One row per question, one column per methodology. No steps, no analysis,
   no sections, no bullets, no explanation. All calculation and analysis stay in the back end.
3. This replaces the SUJ answer layout for the reply. The SUJ analysis is still done in full in the back end, and its
   draft still passes node suj_engine/tools/answer_guard.js, but the reply carries only the table. The rule of CLAUDE.md that
   every answer ends with closing bullets does not apply to the SARVA reply.

## Registry of methodologies

Each column is one entry. Every repository sits next to this one under /home/user. If a repository is not present in the
session, attach it with add_repo before running. Run each in its own working directory and write every input and output to
the scratchpad directory, never into a repository.

| Column | Where | How to run |
|---|---|---|
| SUJ | this repository, suj_engine | As in CLAUDE.md. prepare.js for every question, planet_strength.js for conflicting planets, event_rank.js and window_scan.js for a dated event, strength_tally.js for options, answer_guard.js on the draft. One option per question. |
| Shri Jha Ji | Shri-Jha-Ji | node bin/jyotish.js answer --file birth.json --questions q.json --now AS_OF. birth.json holds name, gender, date, time, place, lat, lon, tz. q.json is a list of text and options. Cell is the first place of the marks and the second place when the engine gives one. If it prints a stop sign for an option with no known word, reword that option with common words in the scratchpad copy of q.json and run again, never edit the repository. |
| Chawdhri | CHAWDHRI | sh jyotish.sh --date --time --lat --lon --tz --gender --now AS_OF --back 40 --topics education,marriage,career,children,foreign --json, and again with --now set to the date of any dated event. It gives evidence and no pick. Read promise, dasha_gate and the Sutton block and choose the option the evidence supports. Mark that cell read. |
| Poddar | poddar-engine | Follow .claude/skills/poddar-engine/SKILL.md and engine/00-START-HERE.md. Run engine/setup.sh first. Chart inventory, promise, timing by its dasha systems, gochara, then choose the option. |
| KP Pro | KP-Pro-sutton | pip install -e . in a venv, then kpredict ask --sex --date --time --place (or --lat --lon --tz) --family FAMILY --options "A) ... | B) ..." for each question, and kpredict read with --windows for a dated event. KP Pro, KCIL and KP Pro Max are read by its ensemble. |
| Vednetra skills | Skill tool | Every skill whose name starts anthropic-skills:vednetra- (5in1, bnn, bphs, kcil, kp, mediastro, quad, sav, trinetra, ududaya, ukn) plus anthropic-skills:predictive-engine and anthropic-skills:vedic-d1-chart-reader, when the Skill list of the session offers them. One column each. Chart numbers come from node tools/run-nobrowser.js. |

If the registry grows, the owner adds a row here and every later table gets the new column. Never drop a column.

## Rules for the back end

1. Intake as in CLAUDE.md. If the birth data is missing ask for it in one short message, nothing else.
2. As of date is the system date. Dated events ("what happened on DATE") are run at that date in every methodology.
3. Same question text and same options in every methodology. Options are never reordered.
4. Every column gives exactly one option per question, or one concrete answer if there are no options. A methodology that
   gives no pick of its own (Chawdhri, Poddar) is read from its evidence by the analyst and the cell says read.
5. Each methodology keeps its own rules. Do not blend schools, do not carry a result of one methodology into another.
   Chawdhri keeps its own scope rule, so SARVA only orchestrates the runs and never changes what a methodology does.
6. If a methodology cannot be run (missing repository, install failure, no network) the cell says not run and a short
   reason of two or three words. Never fill a cell from memory or by copying another column.
7. Computations always come from Vednetra or the methodology's own tool. Nothing by hand.
8. run-nobrowser.js writes report_out.md into the repository root. Delete it after every run. Do not commit birth data,
   charts, tables or outputs unless the owner asks. Commit and push only when the owner asks.
9. After the owner reports true answers, record the case as in CLAUDE.md and add one line per methodology to the
   scoreboard so the columns can be compared. A table is not an accuracy claim and the reply must not imply one.

## Reply format

The reply is a code block, so the columns stay aligned, and nothing else. Optional first line with the native name or chart
number. Four columns at most per block. If there are more methodologies than four, send several blocks one after another with
the question column repeated. Cells hold the option text exactly as given in the question, and:

- second place after a comma and the word second, only when the methodology prints one, for example MBA, second MA
- tie, no basis, or read added after the option when the methodology says so, because the table must not look surer than it is
- not run with a short reason when a column could not be produced

One legend line under the table is allowed only if one of these flags appears. Nothing else is written.

The owner's style rule applies to the reply: none of these characters ( ) ! ; : em dash, curly quotes, / - # * ~ . A
code block with space aligned columns and a line of the equal sign under the header keeps the table inside that rule. Do not
use a markdown table, its separator row needs the hyphen.

Example of the shape only, values are not a result.

```
Kundali 893     SUJ          Shri Jha Ji    Chawdhri       Poddar
==================================================================
1 Education     MBA          MA tie         MBA read       MBA
2 Marriage      Inter caste  Unmarried      Unmarried read not run no network
```
