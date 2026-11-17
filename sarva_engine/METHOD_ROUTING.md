# SARVA METHOD ROUTING

How each of the seven methodologies is run for one native. Paths with two dots are sibling repositories checked
out next to this one. If a sibling is not attached to the session, say so and ask, do not improvise.

Common first step. Run node sarva_engine/tools/sarva_preflight.js, it shows which of the seven columns can run in this session and what
to fix. Then collect the inputs of ENGINE_CONTRACT.md section 8. Fix the as-of date from the system clock.

Common second step, the lexicon. For every question that names a speciality, degree, profession, business, disease, income source or a relative, run
    node sarva_engine/tools/sarva_lexicon.js --options "A text|B text|C text" --family
then once per column with --column KPPRO, KCIL, SUJ, CHAWDHRI or BNN. It lists the houses, planets, cusps, KP cards and BNN rule candidates of each option and the recipe of the
question family with its pitfalls. Write the LEXICON Qn line. ENGINE_CONTRACT.md section 12 binds. The lexicon translates, each column still decides by its own rules.

Tested on 16 November 2026 with a sample native, every command below ran end to end, kpredict read, SUJ prepare.js, CHAWDHRI jyotish.sh,
and the BNN, KCIL, Quad Dasha and Udu chart runners. The notes below come from that test. Skill paths use the glob
~/.claude/skills/synced/*/ because the folder name is account specific.

## 1. KP Pro (code KPPRO)

Method. sarva_engine/knowledge/kppro/KP_PRO_PROCEDURE.md, then the booklet sections it names in KP-PRO-METHODOLOGY.txt through
KP-PRO-METHODOLOGY.index.tsv. The booklet's eight run preflight, with the plus and minus 5 minute reports and the Rule of 10 layers
written before the chart, applies to every question. The prior, the four bands and the Rule of 10 arbitration decide the cell.

Source of rules. ../KP-Pro-sutton/knowledge/kp_pro/KP-PROJECT-INSTRUCTIONS-v15.md first, then the KP-1 to KP-14
files it names. The scored CSL gate, the significator count, the fructification windows and the stability tier
are the decision parts.

Chart and numbers. True Placidus cusps from kpredict. Do not use VedNetra cusps for houses 2, 3, 5, 6, 8, 9, 11
and 12 because VedNetra falls back to Porphyry there, see ../KP-Pro-sutton/docs/FINDINGS.md.

Run.
    cd ../KP-Pro-sutton && python3 -m venv /tmp/kpvenv && /tmp/kpvenv/bin/pip install -e .
    (a fresh container has no kpredict, install it once per session, the flags come after the word read)
    kpredict read --name N --sex M|F --date YYYY-MM-DD --time HH:MM:SS --lat LAT --lon LON --tz TZ \
        --today AS_OF --events EVENT_CODES --windows
Take the KP_PRO opinion of the output. Map the question's options to the event states the KP Pro rules decide,
then pick the option the KP Pro promise and the running Dasha Bhukti Antara support. Never use the default ask
output as the cell, see ENGINE_CONTRACT.md section 6.3. Never use the ensemble choice.

## 2. KCIL (code KCIL)

Method. sarva_engine/knowledge/kcil/KCIL_PROCEDURE.md, then the parts it names in KCIL-METHODOLOGY-V2.6.txt through
KCIL-METHODOLOGY-V2.6.index.tsv. Run the chart validity check, then rectification, then the three gates, before any answer. The
sections 16, 17 and 18 locks are in the v2.6 instructions in the sibling repo.

Source of rules. ../KP-Pro-sutton/knowledge/kcil/KCIL-CUSTOM-INSTRUCTIONS-v2.6.md and the KCIL-1 to KCIL-10
files. The cuspal sub sub lord is the verdict.

Chart and numbers. Khullar ayanamsa by formula, Placidus, geocentric latitude, nutation applied, true nodes,
resolved to Prana. Cast with the vednetra-kcil skill runner (scripts/run_kcil_report.js) or with the kcil
method of kpredict. Gender is needed for the SS arc half.

Run. kpredict read as above and take the KCIL opinion, together with the KCIL report when the runner is used.
Pick the option the sub sub lord promise gates, the cuspal links and the running periods support.

## 3. SUJ engine (code SUJ)

Source of rules. suj_engine/ENGINE_CONTRACT.md, METHODOLOGY.md, STATUS.md and LEARNINGS.md, read in that order.
Engine 2.0 is the default.

Run. The full SUJ procedure of CLAUDE.md for every question.
    node suj_engine/tools/prepare.js '{"name":"N","gender":"male","date":"YYYY-MM-DD","time":"HH:MM:SS","tz":5.5,"lat":0,"lon":0,"topic":"TOPIC"}'
then planet_strength.js and strength_tally.js where the method calls for them. Write the SUJ answer for the
question to a file in the S0 to S9 layout of suj_engine/ANSWER_TEMPLATE.md and run suj_engine/tools/answer_guard.js
on it. The cell is the SUJ final answer. The SARVA reply carries a condensed block and names the file.

## 4. CHAWDHRI (code CHAWDHRI)

Source of rules. The four Chawdhri books and the Poddar Vimshottari text through the engine in ../CHAWDHRI.
Read ../CHAWDHRI/CLAUDE.md and .claude/skills/vedic-engine/SKILL.md first.

Run.
    cd ../CHAWDHRI && sh jyotish.sh --date YYYY-MM-DD --time HH:MM --lat LAT --lon LON --tz TZ \
        --gender male|female --now AS_OF --topics TOPICS --question "..."
Read the dasha_gate of every topic, the promise and the natural significations, as the engine requires. The cell
is the Chawdhri answer. The Sutton block is not the cell. Rank multiple choice options from the promise and the
gate together, never from general knowledge. The first run clones VedNetra and needs network access.

## 5. BNN (code BNN)

Chart data. The vednetra-bnn skill runner, sex is mandatory because BNN swaps the karakas by sex.
    node ~/.claude/skills/synced/*/vednetra-bnn/scripts/run_bnn_export.js '{"name":"N","sex":"male","date":"YYYY-MM-DD","time":"HH:MM:SS","tz":5.5,"lat":0,"lon":0,"question":"...","enquiryDate":"AS_OF","outFile":"bnn_export.md"}'
The runner prints a contract check. Any missing block makes the reading partial, say which. A missing block is
never estimated.

Procedure. sarva_engine/knowledge/bnn/BNN_PROCEDURE.md, then the guide sections it names in
BNN-METHOD-GUIDE.txt, found through BNN-METHOD-GUIDE.index.tsv. Follow guide section 6 in order for every question. For a
multiple choice question write the ten layers of every option before reading the chart, then screen the options, then read
the karaka frame, then time it, then rank with the tie break ladder of guide section 14. Read the department section of
guide 16 for the question.

Rules. sarva_engine/knowledge/bnn/BNN-RULES-5COLUMN.csv through the lookup tool.
    node sarva_engine/tools/bnn_rules.js --method
    node sarva_engine/tools/bnn_rules.js '{"event":"marriage","q":"Venus","limit":15}'
    node sarva_engine/tools/bnn_rules.js '{"id":"RAO-FND-009"}'
The guide writes IDs without hyphens, such as RAO EDU 003. The corpus has them with hyphens, RAO-EDU-003.
Cite the Rule ID of each rule used. Where the table's authors disagree, cite both. The cell is the rank 1 option of the
BNN procedure. ENGINE_CONTRACT.md section 7 has the grade rules and the missing file fallback.

## 6. Udu (code UDU)

Method. sarva_engine/knowledge/udu/UDU_PROCEDURE.md, then the document sections it names in UDU-METHODOLOGY.txt through
UDU-METHODOLOGY.index.tsv. Rules. The nine corpus files UDU-*.md in sarva_engine/knowledge/udu, routed by question as in
document section 5. Not yet supplied, see knowledge/udu/README.md, so the cell is NOT RUN UDU RULES MISSING.

Chart. The vednetra-ududaya skill runner, gender and birth time required, Lahiri only.
    node ~/.claude/skills/synced/*/vednetra-ududaya/scripts/run_ududaya_export.js '{"outFile":"/tmp/udu_report.md","name":"N","gender":"male","date":"YYYY-MM-DD","time":"HH:MM:SS","tz":5.5,"lat":0,"lon":0,"place":"P"}'
Always pass outFile, the runner otherwise writes to a Windows path D:\Books_Master and creates a stray folder named D: in the
current directory. For a past event recast the chart on the event date. Dasha dates come from the report, the pratyantar is counted by the engine
and said so.

## 7. Quad Dasha (code QUAD)

Method. sarva_engine/knowledge/quad/QUAD_PROCEDURE.md and QUAD-REPORT-CONTRACT.md. Rules. Sections 3 to 19 of the Quad methodology
file, not yet supplied, see knowledge/quad/README.md, so the cell is NOT RUN QUAD RULES MISSING.

Chart and dashas. The vednetra-quad skill runner.
    node ~/.claude/skills/synced/*/vednetra-quad/scripts/run_quad_dasha.js --selftest
    node ~/.claude/skills/synced/*/vednetra-quad/scripts/run_quad_dasha.js '{"name":"N","date":"YYYY-MM-DD","time":"HH:MM","tz":5.5,"lat":0,"lon":0,"asOf":"AS_OF"}'
The self test must print RESULT READY. The runner saves its report in the skill's charts folder and prints the path, read it from
there. In the sample test the KCD and Chara rows shifted within plus or minus 5 minutes, so those rows are withdrawn as UNSTABLE. Without a birth time read only the Chara section. Do not use VedNetra's own Char Dasha or
Yogini cards.

## Output per question

For each question write seven blocks in the order above, then move to the next question. After the last question
write the final table. ANSWER_TEMPLATE.md has the exact lines.
