# SARVA ENGINE STATUS

## Round 1, this file's first entry

Built. The SARVA engine did not exist in any attached repository or synced skill before this round, so this round
created it from the owner's instruction.

- ENGINE_CONTRACT.md, the binding requirements: five methodologies only (KP Pro, KCIL, SUJ engine, CHAWDHRI, BNN),
  every question analysed under each, one finalized option per methodology, final table as the last output.
- METHOD_ROUTING.md, how to run each methodology and where its rules live.
- ANSWER_TEMPLATE.md, the exact line layout of a SARVA reply.
- tools/sarva_guard.js and tests/guard_test.js, the enforcement. Run the test with node sarva_engine/tests/guard_test.js.
- CLAUDE.md at the repository root now makes every new session in this repository recognise the SARVA engine.

## Round 2, BNN rule base installed

The owner supplied BNN-RULES-5COLUMN as csv and xlsx, 3,073 rules from 21 books. Compared row by row, identical
apart from one control character. Stored as knowledge/bnn/BNN-RULES-5COLUMN.csv with a README of coverage and data
issues. Added tools/bnn_rules.js, the lookup by event, keyword, book or Rule ID, and --method for the General method
rules. The BNN cell now rests on cited Rule IDs. The guard rejects NOT RUN BNN RULES MISSING while the csv is present
and rejects a BNN EVIDENCE line with no Rule ID. Round 1 pending item 1 is closed.

## Round 3, BNN method guide installed

The owner supplied the 54 page BNN guide, a Hindi summary of the whole BNN project instruction, steps 0 to 11, lanes,
grades and caps, the tie break ladder, the ten layer method, ten department methods, the measured backtest and 64
prohibitions. Stored with its text and a heading index. BNN_PROCEDURE.md is the English map. The contract section 7 now
requires the guide's order of work, the BNN grade in every BNN evidence line, and a rank 1 option for the cell. Four
places where the guide and the SARVA contract differ are reconciled in BNN_PROCEDURE.md, the main one being that the
guide prints two options on a rung 9 tie and SARVA must give one. The guard checks the grade word.
BNN measured accuracy per the guide is 52 of 127, 40.9 percent, chance 24.8 percent, and at or below the best fixed
answer in seven of ten departments.

## Round 4, Udu and Quad Dasha added, seven methodologies

The owner asked on 16 November 2026 for the attached methodologies to be added the way BNN was, and for the engine to be as
comprehensive as possible. The SARVA engine now has seven methodologies, KP Pro, KCIL, SUJ engine, CHAWDHRI, BNN, Udu and Quad
Dasha. The table has eight columns. Contract sections 1 to 4, 6, 7b and 7c, the routing, the template, CLAUDE.md and the guard
were updated, and the guard tests cover seven methodologies and per source presence.
- Udu. Installed the 34 page methodology document, its text and heading index, and UDU_PROCEDURE.md. The nine corpus files of
  11,683 rules were not supplied, so the Udu cell is NOT RUN UDU RULES MISSING until they are placed in knowledge/udu.
- Quad Dasha. Installed the 2 page intro file, which holds only section 1 and the reading guide, the report contract from the
  owner's vednetra-quad skill, and QUAD_PROCEDURE.md. Sections 3 to 19 were not supplied, so the Quad cell is NOT RUN QUAD RULES
  MISSING until the full file is placed at knowledge/quad/QUAD-FULL-METHODOLOGY.
- Neither document reports a measured accuracy for its READ layer worth trusting. Quad's own contract says its 52 rule tests were
  at chance. Udu reports none. This is stated in the EVIDENCE line.

## Round 5, KP Pro v15 booklet installed

The owner supplied the 33 section Hindi booklet on SHRI GANESHA BLESSED KP PRO v15. It extends the existing KP Pro column, no
column was added, the table still has eight columns. Stored with its text, section index and an English map. Contract section
7d, the routing, the template, CLAUDE.md and the guard were updated. One real conflict was found and reconciled. The contract had
barred priors as evidence for every column, while the KP Pro method itself lets a computed prior decide when the chart is
UNDECIDED. Contract section 6.3 now allows that for KP Pro only and requires PRIOR DOMINANT in the evidence line. The guard checks a
HIGH, MEDIUM or LOW word and a basis word in every KP Pro evidence line. KP 15 as a separate file and the 122 question ledger were not
supplied, the v15 instructions in the sibling repo hold the Rule of 10 mechanics.

## Round 6, KCIL v2.6 summary installed

The owner supplied the 65 page Hindi summary of KCIL v2.6. It extends the existing KCIL column, no column was added. Stored with its
text, part index and an English map. Contract section 7e, the routing, the template, CLAUDE.md and the guard were updated. The guard
checks a determinacy mark in every KCIL evidence line. One reconciliation, KCIL answers a non determinate question with two
candidates and forbids merging them, SARVA needs one cell, so the cell is the candidate its own closing rule of section 16.30 prefers
and the line names the other. The PDF holds parts 1 to 10 only and refers to a part 11 that is absent, and to a KCIL 11 RULE OF 10
file that the PDF itself says is still to be uploaded. The v2.6 instructions in the sibling repo hold sections 16 to 18.

## Round 7, finalized on the supplied material

The owner stated on 16 November 2026 that no further files will be shared and asked to finalize. Done in this round.
- End to end test of every route on a sample native taken from the skill documentation, not a real person. kpredict read, SUJ
  prepare.js, CHAWDHRI jyotish.sh, and the BNN, KCIL, Quad Dasha and Udu chart runners all ran. Quad self test 8 of 8, BNN export
  complete with all blocks, CHAWDHRI ephemeris checks passed. KCIL reported all 12 cusps as unstable for the sample, and Quad
  withdrew its Kaal Chakra and Chara rows as UNSTABLE.
- Three practical faults found and fixed in the routing. The Udu runner writes to a Windows path unless outFile is passed. kpredict
  must be installed in a virtualenv in a fresh container. The Quad report is saved inside the skill folder.
- New tools/sarva_preflight.js, shows which columns can run in the session and what to fix. New examples/format_example.txt, the
  guard accepts it with exit code 3. The guard tests now include it.
- Contract section 10 records the standing design, five columns on complete rules, Udu and Quad as standing not run columns.
- Still true, no chart has been run through a full SARVA reply yet, and no column has been scored against known answers. The
  measured records of the methodologies, all near the base rate, apply, and the owner can add true answers for a chart later,
  which would be the first measurement of the engine as a whole.

## Pending after finalization

A and B below are closed by the owner's decision, they stand as gaps. The rest are not blocking.

A. Udu corpus. The nine UDU-*.md corpus files, and ideally the four UDU-REF files and UDU-000-MANIFEST.md, go in
   knowledge/udu. Then a lookup tool like bnn_rules.js should be built against the real layout. Until then the Udu column is
   NOT RUN UDU RULES MISSING in every reply.
B. Quad Dasha full methodology, sections 3 to 19, saved as knowledge/quad/QUAD-FULL-METHODOLOGY.pdf, txt or md. Until then the
   Quad column is NOT RUN QUAD RULES MISSING in every reply. The compute layer is available now through the vednetra-quad runner.
C. As of this round two of the seven columns cannot be filled, so every SARVA reply is reported INCOMPLETE by the guard, exit
   code 3, until A and B are done.
0. The files the guide names but does not attach, LEDGER BNN, 23 BACKTEST WHATSAPP 20, 24 DEPARTMENT METHODS, 25 RULE
   OF 10 AMENDMENT, 25 BACKTEST DATASET and project files 01, 03 to 10, are not here. The guide summarises them. Say a
   missing ledger once per session. Please add them if you want the BNN column to follow them in full.
1. The csv is a rule base. If the owner has a separate step by step BNN procedure document beyond the General method
   rules, add it under knowledge/bnn/. BNN is the least tested column, no BNN reading has been checked against a
   known outcome yet.
2. No chart has been run through SARVA yet. The first live run is the first test of the routing commands, in
   particular the first run of CHAWDHRI jyotish.sh, which clones VedNetra, and pip install of kpredict.
3. kpredict has no command that prints a bare KP Pro or KCIL option for a quiz style question. The ask command is
   prior dominant. The routing therefore reads the per method opinion of the read command with the methodology's
   own rules. A dedicated per method option mapper is a candidate for the next round.
4. The sibling repositories must be attached to the session. If one is missing the engine says so and asks.

## Round 8, first live SARVA run and first scoring, prashna chart 894

The first full run of the routing on a real chart, 17 November 2026, six questions, replies in sarva_engine/runs/q894. All routes ran. kpredict needed a virtualenv install, CHAWDHRI cloned VedNetra on first run, the guard ended with exit code 3 as designed.
Results were reported by the group the same day. Truth Q1 B, Q2 A, Q3 B, Q4 B, Q5 B, Q6 C. Score out of 6. KP Pro 3, KCIL 0, SUJ 2, CHAWDHRI 1, BNN 2. Udu and Quad Dasha not run. KP Pro got Q2, Q5 and Q6, KCIL none, SUJ and BNN Q4 and Q6, CHAWDHRI Q6. No column picked the pediatrician in Q1, and only KP Pro picked the orthopedic surgeon in Q5. Six questions prove nothing and no column was retuned. An earlier entry here scored the owner's submitted answers as truth by mistake, this entry replaces it.

## Round 9, signification lexicon built on the owner's instruction

The owner asked on 17 November 2026 for combinations for every medical degree and speciality, profession, business, disease, income source and relationship, and for the engine to use them on any later chart.
Built. sarva_engine/knowledge/lexicon with 255 entries in six categories, the 202 KP PRO MAX cards and 213 row event index copied from KP-Pro-sutton, the KCIL event matrix and TA tables, core tables, one recipe per question family
with the pitfalls of the K894 chart, and a source registry with tiers. sarva_engine/tools/sarva_lexicon.js looks up options in English and Hindi, prints per column only that column's own corpus text, searches the BNN csv, flags NO ENTRY and PARTIAL MATCH,
and prints the recipe. Contract section 12, routing, template, CLAUDE.md, the guard warning for a missing LEXICON line and the preflight check were added. Tests in sarva_engine/tests/lexicon_test.js, 18 checks.
Limits, stated in the README and the contract. 255 entries is not every type that exists. The web research gave blog grade claims only and no speciality table with a classical text. Every page fetch was refused by the network policy of the session,
the owner approved a new environment with the hosts but the proxy had not picked it up, so all web claims are second hand summaries, tier T3, and cannot be cited. The medical speciality rows rest on KCIL TA lists, KP house keys and karaka lists from memory.
Nothing in it has been shown to raise accuracy. It was built after K894 was scored, so K894 cannot test it. The next chart is the first test. No weight, band or rule of any methodology was changed.

## Round 10, promise layers for Udu and Quad Dasha, all seven columns fire

The owner asked on 17 November 2026 why Udu and Quad Dasha gave no answer and told the engine to give them a promise prediction part so that all seven fire for every question.
Why they were blank. Both methods forbid answering without their rules and the rule files were never supplied, see contract sections 7b, 7c and 10.
Built. sarva_engine/tools/promise_layer.js fires both columns together for every question of a chart from the VedNetra chart and the Quad compute layer. Udu gets rules SARVA-UDU-P in the frame of its documents, Quad gets ten layers SARVA-QUAD-P and the stability gate, with handlers for sons and daughters, brothers and sisters, and parents status, English and Hindi option parsing, and option profiles from the lexicon.
Contract section 13, routing, template, CLAUDE.md, the guard, the preflight and the format examples were updated, tests in sarva_engine/tests/promise_layer_test.js, 27 checks, and the guard tests extended. A test found a real fault, Devanagari vowel signs were stripped by the text normaliser, which also affected lexicon matching, fixed.
Limits. Authored layers, not the corpus and not the READ rules, no Udu rule id cited and none invented, every cell marked PROVISIONAL. Not scored on any chart, built after K894 was scored. The parents handler is a weak handler of a kind the owner's BNN backtest found to over call loss. The count handler rests on no validated rule. Nothing was retuned.

## Round 11, the Udu corpus installed, Udu runs on its rules

The owner attached the Udu rules on 18 November 2026 as the zip UKN-RULES-BY-LIFE-EVENT. The name says UKN but the zip holds the Udu corpus and the KN timing corpus, installed in sarva_engine/knowledge/udu/ukn.
Installed. 16,008 UDU rules in 21 life event files from 7 books, 1,006 KN rules, INDEX.md, a README with the differences from the Udu document, which counted 11,683 rules in nine files.
Built. tools/udu_rules.js, parser, lookup by id, event, nakshatra, planet and text, the corpus check against INDEX.md, the KN lookup. tools/udu_engine.js, the Udu reading, routing, rule firing with the sex and sign tests, the weighing of the document, the pada overrule, nearly fired rules left out, parents by Law 3. promise_layer.js uses the corpus when it is installed. The guard accepts Udu rule ids of all seven books and treats the corpus as present, so a NOT RUN or provisional Udu cell is now an error. Preflight, examples and tests were updated, 30 new checks in sarva_engine/tests/udu_corpus_test.js.
Faults found by running the corpus on K894 and fixed before shipping. Rules for a man fired for a woman, a sign portion in a rule was ignored so two portions fired together, general words such as women matched a profession option, disease rules were counted as evidence for a speciality, and a vague rule with an either or alternative called a parent gone. No weight was retuned.
Limits. The IF lines are free text, about 30 rules per question are left out as nearly fired. Few rules name a speciality or a number of children, so those questions end in a TIE FORCED PICK. The KN corpus is stored and searchable and is not applied, UKN-04 and UKN-05 and UDU-REF-coverage were not supplied. No accuracy has been measured for Udu. The engine was written after K894 was scored.
Quad Dasha still fires through its provisional promise layer.

