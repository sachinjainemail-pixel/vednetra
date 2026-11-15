# SARVA METHOD ROUTING

How each of the five methodologies is run for one native. Paths with two dots are sibling repositories checked
out next to this one. If a sibling is not attached to the session, say so and ask, do not improvise.

Common first step. Collect the inputs of ENGINE_CONTRACT.md section 8. Fix the as-of date from the system clock.

## 1. KP Pro (code KPPRO)

Source of rules. ../KP-Pro-sutton/knowledge/kp_pro/KP-PROJECT-INSTRUCTIONS-v15.md first, then the KP-1 to KP-14
files it names. The scored CSL gate, the significator count, the fructification windows and the stability tier
are the decision parts.

Chart and numbers. True Placidus cusps from kpredict. Do not use VedNetra cusps for houses 2, 3, 5, 6, 8, 9, 11
and 12 because VedNetra falls back to Porphyry there, see ../KP-Pro-sutton/docs/FINDINGS.md.

Run.
    cd ../KP-Pro-sutton && pip install -e .
    kpredict read --name N --sex M|F --date YYYY-MM-DD --time HH:MM:SS --lat LAT --lon LON --tz TZ \
        --today AS_OF --events EVENT_CODES --windows
Take the KP_PRO opinion of the output. Map the question's options to the event states the KP Pro rules decide,
then pick the option the KP Pro promise and the running Dasha Bhukti Antara support. Never use the default ask
output as the cell, see ENGINE_CONTRACT.md section 6.3. Never use the ensemble choice.

## 2. KCIL (code KCIL)

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

Rules. sarva_engine/knowledge/bnn/BNN-RULES-5COLUMN.csv through the lookup tool.
    node sarva_engine/tools/bnn_rules.js --method
    node sarva_engine/tools/bnn_rules.js '{"event":"marriage","q":"Venus","limit":15}'
    node sarva_engine/tools/bnn_rules.js '{"id":"RAO-DOM-001"}'
Read the General method rules first, then the event group. BNN reads karakas and not houses. Read a crowded sign
one pair at a time and keep the contradictions. Cite the Rule ID of each rule used. Where the table's authors
disagree, cite both. The cell is the option the cited rules and the chart support best, with the transit timing
check that ARI-TIM and RAO-FND describe. ENGINE_CONTRACT.md section 7 has the missing file fallback.

## Output per question

For each question write five blocks in the order above, then move to the next question. After the last question
write the final table. ANSWER_TEMPLATE.md has the exact lines.
