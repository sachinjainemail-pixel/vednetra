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

## Pending

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
