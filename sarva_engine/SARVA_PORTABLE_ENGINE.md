# SARVA ENGINE, PORTABLE EDITION

Version 1.0, written 16 November 2026 from the repository files named in Appendix B. This document lets any capable
large language model run the SARVA engine, not only Claude Code. It does not replace the repository. It packs the
binding rules, the seven methodology procedures, the orchestration, the output grammar and the guard into one place,
and it says exactly which files and tools must still be supplied, because a language model cannot compute a horoscope
and cannot recall the rule files.

Labels used in this document.

- [OWNER] a rule that the owner set and that sits in the repository contract or in a source methodology document.
- [PORT] a portability addition written for this edition so that a different model or a different runtime can follow the
  owner's rules. It adds no astrology and changes no methodology. The owner has not yet confirmed any [PORT] item.
- [GAP] something the sources do not settle. It is stated, not filled.

Contents.

0. How to use this document
1. The binding rules
2. Inputs and intake
3. The compute plane, charts and tools
4. The knowledge bundle and how to read it
5. Orchestration, isolation and run modes
6. The seven methodology modules
7. Choosing one option, common mechanics
8. Output specification
9. Guard and self audit
10. Standing gaps and honest limits
11. Paste ready prompts
12. Failure catalogue
13. Change control and open owner decisions
Appendix A Glossary. Appendix B File manifest. Appendix C Command sheet. Appendix D Patterns. Appendix E Reconciliation table.

---

## PART 0. HOW TO USE THIS DOCUMENT

### 0.1 What SARVA is

SARVA is one engine that reads the same native and the same questions under seven Vedic astrology methodologies, always in
this order, and ends with one table where each methodology gives one finalized option per question.

| No | Code | Table column | Methodology |
|---|---|---|---|
| 1 | KPPRO | KP Pro | KP Pro v15 |
| 2 | KCIL | KCIL | KCIL v2.6, Khullar Sub Sub and Cuspal Interlinks |
| 3 | SUJ | SUJ engine | SUJ engine, Sudarshan based, engine 2.0 |
| 4 | CHAWDHRI | CHAWDHRI | Dr L R Chawdhri with Poddar Vimshottari, Sutton as a second opinion layer inside it |
| 5 | BNN | BNN | Bhrigu Nandi Nadi, rule base of 3,073 rules |
| 6 | UDU | Udu | Shree Ganesha Blessed Udu, nakshatra and pada engine |
| 7 | QUAD | Quad Dasha | Vimshottari, Chara, Kaal Chakra, Yogini under one report contract |

No eighth methodology is ever run, cited, or used as a tie breaker. [OWNER]

### 0.2 Authority and precedence

When two texts differ, the higher one wins, and the difference is named in one line of the reply.

1. The owner's live instruction in the current session.
2. sarva_engine/ENGINE_CONTRACT.md.
3. The owner's source methodology document of each methodology. Each wins over its English map. The documents are
   KP-PRO-METHODOLOGY.docx, KCIL-METHODOLOGY-V2.6.pdf, BNN-METHOD-GUIDE.pdf, UDU-METHODOLOGY.pdf, and for SUJ the
   file suj_engine/METHODOLOGY.md.
4. The English map of each document, the files named *_PROCEDURE.md.
5. This document.

If this document and the contract ever differ, the contract wins and the model must say so.

### 0.2a What this document cannot do

- It cannot compute charts. A chart, a dasha, a divisional chart, a transit or a panchang is produced by a tool and handed to
  the model. A model never casts or estimates any of them from memory or by hand. [OWNER, contract 6.1]
- It cannot replace the rule files. BNN rules are read from the csv, Udu rules from its corpus, KP Pro and KCIL rules from the
  sibling repository files, SUJ rules from suj_engine. A model that answers from general knowledge of these schools is
  breaking the engine. [OWNER]
- It cannot raise accuracy. Every measured record in the sources sits near chance, see Part 10.

### 0.3 Three capability tiers [PORT]

| Tier | The model has | What it can do | What it must still receive |
|---|---|---|---|
| 1 Agentic | A shell, the repositories, node 18 or later, python 3, network for first runs | Run everything in Appendix C, run the guard | Nothing extra, follow Part 5 and Part 6 |
| 2 Files only | The ability to read attached files, no shell | Read rules and procedures, write the reply | Chart packs made by a person or by another tool, see 3.5. The guard is run by a person or checked by hand, see 9.2 |
| 3 Plain chat | Pasted text only | Read pasted rule extracts and chart packs, write the reply | Chart packs, rule extracts selected by the lookup procedure in 4.4, the as-of date |

A model on Tier 2 or Tier 3 uses the same rules. It only changes who runs the tools.

### 0.4 Quick start, ten steps

1. Load Part 1 and Part 8 into the system prompt. They are short and always needed. Prompt text is in Part 11.
2. Run the preflight, node sarva_engine/tools/sarva_preflight.js, or ask a person to. Expect Udu and Quad Dasha as standing gaps.
3. Collect the intake of Part 2 in one short message. Fix the as-of date from the system clock.
4. Build the chart pack of each methodology with its own tool and its own settings, Part 3. Never share a pack between methodologies.
5. Give each methodology its own worker context and its own knowledge bundle, Part 4 and Part 5.
6. Each worker follows its module in Part 6 for every question and returns a worker card, 5.5.
7. The orchestrator seals the seven cards for a question before any card is read by another worker.
8. Assemble the reply in the grammar of Part 8. SUJ writes its own answer file, which passes the SUJ guard.
9. Run the SARVA guard, node sarva_engine/tools/sarva_guard.js reply.txt, or the manual audit of 9.2.
10. Send. The table is the last block of the reply and nothing follows it.

---

## PART 1. THE BINDING RULES

Each rule is numbered so a reply or an audit can cite it. All are [OWNER] unless marked.

### 1A. Scope and order

R1. Exactly seven methodologies, in this order, KP Pro, KCIL, SUJ engine, CHAWDHRI, BNN, Udu, Quad Dasha. Contract section 1.
R2. Chara, Kaal Chakra, Yogini and Laghu Parashari run only inside Quad Dasha, never as columns of their own. Contract section 1.
R3. If a question seems to need another methodology, say so and ask the owner. Do not add it. Contract section 1.
R4. Charts come from VedNetra and the sibling engines. That is tooling, not a methodology. Contract section 1.

### 1B. Every question, every methodology

R5. Every question, with its options if any, is analysed separately under each of the seven methodologies, each by its own source
    rules and its own chart settings. None is skipped, merged, shortened to a line, or answered from another methodology. SARVA adds no
    rule of its own to a methodology and removes none. Contract section 2.
R6. Each methodology ends each question with exactly one finalized option. With options, the cell is one of the given options. Without
    options, the cell is one concrete answer. Never two options, a range, or a refusal to choose. Thin evidence is stated in the
    EVIDENCE line, the choice is still made. The only exception is R14. Contract section 3.
R7. A methodology never reads another methodology's verdict before it finishes its own. The seven are decided independently and then
    placed in the table. Contract section 5.2.
R8. A chart cast for one methodology is never fed to another. Contract section 5.1.

### 1C. Output

R9. The final output is one markdown table, the last block of the reply, one row per question in order, columns exactly Question,
    KP Pro, KCIL, SUJ engine, CHAWDHRI, BNN, Udu, Quad Dasha. Each cell is that methodology's finalized option. No eighth column, no vote,
    no combined answer, no overall winner, unless the owner asks for one in that session. Nothing follows the table. Contract section 4.
R10. Where methodologies disagree, the table shows the disagreement as it is. It is never smoothed. Contract section 4.
R11. The reply avoids these characters outside the table delimiter row, ( ) ! ; : em dash, curly quotes, slash, hyphen used as a
     dash, hash, asterisk, tilde. Rule IDs such as RAO-FND-009 keep their internal hyphens. CLAUDE.md, response style.
R12. Write the draft to a file, run the guard, fix every error, then send. Contract section 9.

### 1D. Evidence

R13. Charts, dashas, divisional charts and transits come from the methodology's tool, never by hand and never from memory. Contract 6.1.
R14. BNN, Udu and Quad Dasha cells use the exact texts NOT RUN BNN RULES MISSING, NOT RUN UDU RULES MISSING and NOT RUN QUAD RULES
     MISSING only while their rule sources are absent. For BNN only while the csv is absent. For Udu only until all nine corpus files exist.
     For Quad only until QUAD-FULL-METHODOLOGY exists. No other column may use a not run text. Contract 7, 7b, 7c, 10.
R15. Check the promise and also the time status of every event, already happened, happening now, or due in the future, against the
     system date as the as-of date. Contract 6.2.
R16. A chosen option rests on counted chart evidence. Typicality, base rates, cohort priors and the safe choice are not evidence. The one
     exception is KP Pro, whose own method lets its computed prior decide only when the significator NET band is UNDECIDED, and the
     EVIDENCE line then says PRIOR DOMINANT. Contract 6.3.
R17. The kpredict ask command at its default output is never a KP Pro or KCIL cell, it never lets the chart in. Use the per method
     opinion of the read command and the methodology's rules. Contract 6.3.
R18. Never retune a weight, band or rule because of one chart. Contract 6.4.
R19. A rule is cited only if it exists in a file supplied in the session. Inventing a rule is the one real failure. Udu document, Law 0.
R20. Do not date a death. Grave questions are not refused, they are read with care. Quad contract section 8, Udu Law 4. [OWNER]

### 1E. Honesty

R21. The intake carries a LIMITS line saying these are readings under each methodology and not certainties, and naming any partial input,
     a doubtful birth time, a missing BNN block, and the two standing gaps. ANSWER_TEMPLATE.md.
R22. Never claim a validated hit rate. The measured records in Part 10 are the only figures that may be quoted.
R23. Never answer to please the owner. Judge on the analysis. User preference file and CLAUDE.md.
R24. A completed reply ends with the guard exit code 3 while the Udu and Quad standing gaps stand. That is expected, valid but
     incomplete. Contract 10.3.

### 1F. Portability rules [PORT]

P1. No tool, no chart. A model that cannot obtain a methodology's chart pack stops and asks for it. It does not compute a chart, and it
    does not write a cell for that column. See 3.5 and 13.2 on the missing sanctioned text.
P2. The as-of date comes from the runtime or from the user. A model never uses its own training date.
P3. One methodology per worker context wherever the runtime allows it, see Part 5.
P4. A model quotes rule text only from supplied files and marks every quotation with its Rule ID or section number.
P5. If the runtime cannot read Hindi, stop. KP Pro, KCIL, BNN, Udu source documents and the SUJ strength method are Hindi or
    mixed Hindi and English.

---

## PART 2. INPUTS AND INTAKE

### 2.1 Required inputs, contract section 8

| Field | Rule |
|---|---|
| Native name | Any label, used for file names |
| Gender | Mandatory. BNN swaps karakas by sex, KCIL uses it for the sub sub arc half, Udu has sex specific rules, KP Pro and SUJ use it for marriage and parent logic |
| Date of birth | Calendar date as lived at the place |
| Time of birth | With seconds if known, and how sure the time is, exact to the minute, to the hour, half a day, unknown |
| Place of birth | Name, latitude, longitude, and the time zone offset in force on that date, including any historical daylight saving |
| Questions | Each with its options if any |
| As-of date | The system date. Past event questions also get an event date, see 2.6 |

Unknown places are never guessed. Ask once, in one short message, then proceed. A birth time of unknown certainty is asked about, because
KCIL, Quad and KP Pro all change their output with it.

### 2.2 Validation before any run

1. Date and time are LOCAL clock time at the birthplace and the tool converts with the offset. Check that offset against the date. A one
   hour error moves a Kaal Chakra dasha by nearly fifteen years, Quad contract section 4.
2. Latitude and longitude are for the place and sign correct, north and east positive.
3. Gender is male or female as the tools expect it.
4. Without a birth time, BNN lane B closes, Quad reads only Chara, KCIL cannot cast a chart, KP Pro cusps are unusable. Say so in LIMITS.
5. If the chart is a quiz style set with known true answers, the owner may later add them, see 13.4.

### 2.3 Intake message template [PORT]

    To run the SARVA engine I need, in one reply
    1. Name or label, gender
    2. Date of birth, time of birth with seconds if known, and how sure the time is
    3. Place of birth, with latitude, longitude and the time zone offset on that date, or let me look them up
    4. The questions, each with its options
    5. Today's date, if my runtime cannot read a clock
    For a question about a past event, the date of that event if known.

### 2.4 Question normalisation [PORT]

Give each question an ID, Q1, Q2 and so on, in the order asked. Record for each.

- Text exactly as the owner wrote it.
- Options with labels exactly as listed. Labels are used verbatim in RESULT lines and in the table. A label with a hyphen or a slash stays as
  the owner wrote it in the file but the guard compares the strings exactly, so keep one spelling throughout.
- Option type, one of
  - nominal, one choice among unordered options
  - ordinal, options with an order such as education levels. Lowest first. SUJ treats these with its ordinal rule
  - count, a number of siblings or children. Several methodologies have no validated counting rule, see Part 6
  - yes or no
  - open, no options, answer is one concrete statement such as a named year, a named field, a person type
- Subject, the native or a relative, and which relative. KCIL turns the lagna for a relative before the event table is applied
- Department, from the table in 2.5
- Tense, past, running, future, or unspecified. Set the status question for R15
- Event date if the question concerns a past dated event

### 2.5 Department routing across methodologies

This table is the common map. The source files give the full detail.

| Department | KP Pro house group, booklet section 23 | KCIL, summary part 10 | SUJ topic key | BNN department, guide 16 | Udu corpus file, document section 5 |
|---|---|---|---|---|---|
| Marriage, spouse | 2, 7, 11 | main cusp 7 for marriage with supporting 5 and 11, divorce 6, see part 10 for the exact row | marriage_male or marriage_female | 16.3 marital status | UDU-vivah-sambandh |
| Children | 2, 5, 11 | main cusp 5 for capacity, 2 at the moment of birth | children | 16.4, decide marriage first | UDU-santan-parivar |
| Profession | 2, 6, 10, 11 | field cusp and the 10th are both main | career | 16.2 | UDU-karya-dhan |
| Wealth | 2, 11 against 8, 12 | 2 with 6 and 11 supporting | wealth | No dedicated section in guide 16. Use the general method and the rule group Wealth and finance of the csv, [GAP] | UDU-karya-dhan |
| Property | 4, 11, 12 | per table | property | 16.7 covers residence only. Use the rule group Property, land and house of the csv, [GAP] | UDU-karya-dhan |
| Education | 4, 9, 11, or 4, 9, 3 in KP 1 | 4 and 9 main for higher education | education | 16.1 | UDU-vidya-swabhav |
| Health, disease | 1, 6, 8, 12, relief 5 and 11 | 1 with 6, 8, 12 | health | 16.8 | UDU-arogya-ayu |
| Litigation | 6, 8, 11, 12 | per table | none, use closest | No dedicated section. Use the rule group Litigation and disputes of the csv, [GAP] | UDU-yatra-shatru |
| Travel, foreign | 3, 9, 12 with 9 necessary for foreign | per table | foreign | 16.7 | UDU-yatra-shatru |
| Parents | Not tabulated in booklet section 23. Read the booklet and the KP files, parents are among the questions where the chart added nothing over the prior | The relative's own lagna is turned first, for the father the 9th becomes the lagna | father, mother | 16.5 | UDU-santan-parivar |
| Siblings | Not tabulated in section 23. Same remark as parents | Per table | siblings | 16.6 | UDU-santan-parivar |
| Longevity, death | 1 and 8 with badhaka, maraka | 1 and 8 | none | The danger and death rule group, read with the guide's section 3.3 on the hardest class | UDU-arogya-ayu |

Never date a death, R20. Use the source section for the final house set, this table only locates it.

### 2.6 Past events [PORT, from the sources]

BNN guide section 2.5, Udu, and the Quad runner all recast on the event date. For a past event question the engine runs the time status
check first, then recasts where the methodology says so. KCIL rectification and the stability checks of KP Pro and Quad stay on the birth time.

---

## PART 3. THE COMPUTE PLANE, CHARTS AND TOOLS

### 3.1 Principle

Two planes. COMPUTE produces numbers with deterministic software. READ applies a methodology's rules to those numbers. A language model
works only in READ. This keeps the engine honest because the Quad contract records the compute layer as validated, 8 of 8 self tests, 27 of 27
BPHS cells, and the read layers as unvalidated.

### 3.2 Settings of each methodology, contract section 5.1

| Methodology | Ayanamsa | Houses | Nodes | Other fixed settings | Chart source |
|---|---|---|---|---|---|
| KP Pro | KP ayanamsa, Lahiri minus 6 arcminutes | True Placidus, to the degree | Mean nodes | Every point read sign, star, sub. Thirteen fixed settings of booklet section 5 | kpredict read for true Placidus cusps and VedNetra KP System Report for the rest, difference named |
| KCIL | Khullar by formula, zero year 292, computed hourly | Placidus, cusps as house starts | True nodes | Geocentric latitude, nutation applied, depth to Prana, longitude to the second. Uranus Neptune Pluto excluded | vednetra-kcil runner or the kcil method of kpredict |
| SUJ | VedNetra default, the answer states it in S0 | VedNetra whole sign house field | VedNetra | Lagna, Moon and Sun charts, D9, subject varga, Shadbala, Vimshopaka, dasha stack to Sookshma | node tools/run-nobrowser.js and the suj_engine tools |
| CHAWDHRI | VedNetra with the high precision ephemeris patch | VedNetra | VedNetra | Vimshottari only. Sutton layer separate | sh jyotish.sh in the CHAWDHRI repo |
| BNN | VedNetra | Karakas not houses | VedNetra | Sex mandatory. Panchang verified. Blocks A to H1 of the BNN Chart Export | vednetra-bnn runner, run_bnn_export.js |
| Udu | Lahiri only | VedNetra, nakshatra and pada | VedNetra | Any other ayanamsa shifts the 3 degree 20 minute pada boundary and spoils the heaviest rules | vednetra-ududaya runner, always with outFile |
| Quad Dasha | Lahiri only | Whole sign | Mean node, about 2 degrees off the true node | Seven Chara karakas never eight. Own dasha engine | vednetra-quad runner after its self test prints RESULT READY |

### 3.3 Commands, from METHOD_ROUTING.md

All paths with two dots are sibling repositories checked out next to vednetra. Skill paths use ~/.claude/skills/synced/*/ because the
folder name is account specific. Full list in Appendix C.

### 3.4 What each chart pack must contain

A pack is the tool output saved as a file. A worker rejects a pack that lacks a block and says which block is missing, never estimates it.

- KP Pro pack. KP System Report at the stated time, the same at plus and minus 5 minutes, the BALA table, true Placidus cusp sub lords of
  houses 2, 3, 5, 6, 8, 9, 11, 12 from kpredict, dasha stack at the as-of date.
- KCIL pack. Chart validity line showing all seven settings, cusp table to Prana, sub sub lords of all 12 cusps with the seconds where each
  flips inside 30 seconds, rectification results, dasha ladder to Prana.
- SUJ pack. Output of prepare.js, stellium.js, planet_strength.js, strength_tally.js, window_scan.js, functional_nature.js, rules_lookup.js.
- CHAWDHRI pack. Full report of jyotish.sh with the topics asked, the dasha_gate of each topic, the author_method block, the sutton block.
- BNN pack. The BNN Chart Export blocks A to H1, with the runner's contract check.
- Udu pack. The UduDaya report, written to a path given by outFile.
- Quad pack. The Quad report, saved in the skill's charts folder, with stability flags per system.

### 3.5 When the model cannot run tools [PORT]

1. A person or a Tier 1 model builds the packs and attaches them. The pack files carry the command line used, the date, and the exit status.
2. The model confirms each pack against 3.4 and states any missing block.
3. If a pack for KP Pro, KCIL, SUJ or CHAWDHRI is not available, the model does not write that column. It stops and asks for the pack. The
   contract allows a not run text only for BNN, Udu and Quad rule files, so a missing chart has no sanctioned cell text, see 13.2.
4. If a BNN block is missing, the reading is partial. State which block and read only what remains. Never estimate a block. [OWNER, 7.8]

### 3.6 Practical faults found in the end to end test of 16 November 2026

1. The Udu runner writes to a Windows path D:\Books_Master and creates a stray folder named D: unless outFile is passed. Always pass outFile.
2. kpredict is not installed in a fresh container. Install it in a virtualenv, python3 -m venv /tmp/kpvenv then pip install -e . inside KP-Pro-sutton.
   Flags come after the word read.
3. The Quad report is saved inside the skill folder and its path is printed, read it from there.
4. The first run of CHAWDHRI jyotish.sh clones VedNetra and needs network access and Node 18 or later.
5. In the sample test KCIL reported all 12 cusps unstable and Quad withdrew its Kaal Chakra and Chara rows as UNSTABLE. That is a normal outcome and
   goes into the EVIDENCE line.

---

## PART 4. THE KNOWLEDGE BUNDLE AND HOW TO READ IT

### 4.1 Principle

The engine's rules live in files. A model reads the files, it does not recall them. The files are large, the BNN guide text alone is about
289 KB and the BNN rule csv about 1.8 MB. So each worker gets its own bundle and uses the lookup procedure of 4.4 instead of loading everything.

### 4.2 Bundle per methodology

| Methodology | Must have, in this order | Lookup aid | Where it lives |
|---|---|---|---|
| KP Pro | KP_PRO_PROCEDURE.md, KP-PRO-METHODOLOGY.txt, KP-PROJECT-INSTRUCTIONS-v15.md, the KP files the instructions name | KP-PRO-METHODOLOGY.index.tsv, 33 section index with line numbers | sarva_engine/knowledge/kppro and KP-Pro-sutton/knowledge/kp_pro |
| KCIL | KCIL_PROCEDURE.md, KCIL-METHODOLOGY-V2.6.txt, KCIL-CUSTOM-INSTRUCTIONS-v2.6.md, KCIL files named there | KCIL-METHODOLOGY-V2.6.index.tsv, 10 part index | sarva_engine/knowledge/kcil and KP-Pro-sutton/knowledge/kcil |
| SUJ | suj_engine ENGINE_CONTRACT.md, METHODOLOGY.md, STATUS.md, LEARNINGS.md, ANSWER_TEMPLATE.md, data/topics.json, rules/rules_index.json | rules_lookup.js | vednetra/suj_engine |
| CHAWDHRI | CHAWDHRI CLAUDE.md, .claude/skills/vedic-engine/SKILL.md, docs/AUTHOR_METHOD.md, docs/COMPLEMENT.md, docs/SUTTON.md | the engine itself | CHAWDHRI repo |
| BNN | BNN_PROCEDURE.md, BNN-METHOD-GUIDE.txt, BNN-RULES-5COLUMN.csv | BNN-METHOD-GUIDE.index.tsv and tools/bnn_rules.js | sarva_engine/knowledge/bnn |
| Udu | UDU_PROCEDURE.md, UDU-METHODOLOGY.txt, nine UDU-*.md corpus files, UDU-REF-coverage.md | UDU-METHODOLOGY.index.tsv | sarva_engine/knowledge/udu, corpus NOT installed |
| Quad Dasha | QUAD_PROCEDURE.md, QUAD-REPORT-CONTRACT.md, QUAD-METHODOLOGY-INTRO.txt, QUAD-FULL-METHODOLOGY | none | sarva_engine/knowledge/quad, full file NOT installed |

The English maps are summaries written by the engine author. The owner's documents win on any difference. For every question read the
document sections the map names, do not work from the map alone. [OWNER, stated in each map]

Rule files known to be absent in the sibling checkout used for this edition, and not to be invented.

- KP 12, KP 14, KP 15 as separate files. The booklet itself says to rebuild a missing KP 12, 14 or 15 from sections 7, 8 and 9 of the instructions,
  and the v15 instructions hold the Rule of 10.
- KCIL 11 RULE OF 10 and a part 11 of the summary. The v2.6 instructions hold sections 16 to 18.
- The nine Udu corpus files, the four Udu REF files, UDU-000-MANIFEST.md.
- QUAD-FULL-METHODOLOGY, sections 3 to 19.
- The BNN files LEDGER BNN, 23 BACKTEST WHATSAPP 20, 24 DEPARTMENT METHODS, 25 RULE OF 10 AMENDMENT, 25 BACKTEST DATASET and project files 01 and 03 to 10.

### 4.3 Reading discipline

1. Read the procedure map first, then the document sections it names, by line range from the index tsv.
2. Read each rule to its last word. Udu Law 0a, every or alternative and the tail clause change the meaning.
3. For every house touched write its full karaka list. Udu Law 0b. For every nakshatra write both poles. Udu Law 0c.
4. Quote the rule and its ID in the worker's notes. Where authors disagree, cite both, and decide on the chart. BNN 7.6.
5. If a rule is not found, say so in the worker card. Reason from the nearest rules and say that this is what is done. Never fabricate.
6. A missing ledger is stated once per session. BNN guide step 0.

### 4.4 Lookup procedure for a model with a small context [PORT]

1. Use the index tsv to find the heading and line numbers for the step needed.
2. Read only that range plus a few lines either side.
3. For BNN run node sarva_engine/tools/bnn_rules.js --method once per session, then one lookup per event, with a limit. Tier 3 models are given
   the printed output.
4. For Udu, once the corpus exists, read UDU-REF-coverage.md first, then the routed file, the Moon nakshatra section, the section of the graha
   that drives the question, then the _general section, opening every category of the file especially muhurta. Law 0 and section 5.
5. Record what was read in the worker card so that an auditor can check it.

---

## PART 5. ORCHESTRATION, ISOLATION AND RUN MODES

### 5.1 Roles [PORT]

- Orchestrator. Runs intake, preflight, builds the question list, spawns workers, seals cards, assembles the reply, runs the guard.
- Seven workers, one per methodology. Each reads only its own pack and its own bundle and returns one worker card per question.
- Formatter. Turns sealed cards into the reply grammar. It changes no result.
- Auditor. Runs the guard or the manual audit. It reads no chart.

The orchestrator never edits a worker's result. If a result is out of grammar, the worker is asked to correct it.

### 5.2 Run modes and the isolation they give [PORT]

| Mode | How | Isolation of R7 | Use |
|---|---|---|---|
| A Parallel workers | Seven separate model calls or sub agents, each with its own context, pack and bundle. They never see each other's cards | Full | Preferred. Required where the owner wants the cleanest test |
| B Sealed sequence | One model, one context, seven passes in table order. After each pass the card is written to a ledger file and the model is told not to revise it. Earlier cards are not consulted in later passes | Partial. The model has seen earlier results, so leakage cannot be ruled out | Use only when A is not available. The LIMITS line must say mode B was used |
| C Single pass | One model writes all seven columns at once | None | Not recommended. If used the LIMITS line must say that isolation was not kept, and the owner should be told that R7 was not met |

Mode A and the chart isolation of R8 are the only ways to honour R7 in full. This is the most important portability point. A single language
model that has read all seven methods and then answers is not seven independent readers, and the engine cannot hide that.

### 5.3 Session start sequence

1. Load the rules of Part 1 into the orchestrator.
2. Run the preflight and note the columns that CAN RUN and the STANDING GAPS.
3. Collect the intake of Part 2.
4. Fix the as-of date.
5. Build the seven packs, each on its own settings.
6. Build each worker's bundle, 4.2.
7. Start the workers. In mode B, start pass 1.

### 5.4 Per question loop

For each question Q in order, for each methodology in table order, the worker does the following.

1. Read the question and the options. Write the layers or option states the methodology requires before it reads the chart, where it
   requires this. KP Pro R10 layers, KCIL R10 layers, BNN ten layers and Quad R10 layers are written before the chart is read and never
   changed after. [OWNER]
2. Check the promise and the time status against the as-of date. R15.
3. Apply the module of Part 6.
4. Pick one option, 7.
5. Write the EVIDENCE line and the RESULT line, Part 8.
6. Return the worker card.

### 5.5 Worker card [PORT]

    CARD  Q<n>  <METHOD CODE>
    PACK       file name and command used
    READ       list of sections or rule IDs actually read
    STATUS     ALREADY HAPPENED, HAPPENING NOW, WILL HAPPEN, or NOT APPLICABLE with reason
    ANALYSIS   the methodology's own steps in order, short
    EVIDENCE   the single evidence line in its final grammar
    RESULT     one option label, or the exact NOT RUN text
    FILE       for SUJ, the path of the SUJ answer file
    FLAGS      partial inputs, withdrawn claims, declared conflicts, time sensitivity

### 5.6 Sealing

The orchestrator stores each card as it arrives. After sealing, the card is read only by the formatter. In mode B the ledger file holds the sealed cards
and the model does not reopen it until assembly.

### 5.7 Assembly and send

1. The formatter lays out the reply per Part 8, copying EVIDENCE and RESULT lines verbatim.
2. The table cell of every pair equals the RESULT line of that pair.
3. The reply is saved to a file, the guard is run, and every error is fixed.
4. The reply is sent with the guard result stated once in the owner's terms, for example valid but incomplete, exit code 3.

### 5.8 Several questions

Each question has all seven METHOD blocks. A methodology's answer to Q2 does not depend on its answer to Q1, except where its own method says so
and that is shown in its EVIDENCE line. Example, BNN children reads marriage first, guide 16.4.

### 5.9 The orchestrator must never

- Merge, vote, average or break ties across methodologies.
- Re-run a methodology because its answer is unexpected, unless a fault in its pack or its grammar is found.
- Change a cell to make the table agree.
- Drop a column that is a standing gap.
- Add a methodology to settle a disagreement. R3.

---

## PART 6. THE SEVEN METHODOLOGY MODULES

Each module has the same shape. Purpose, inputs, order of work, decision rule, EVIDENCE line contract, reconciliation with SARVA, honest record, and
not run conditions. Order of work is condensed from the source documents. The sources win, read them.

### 6.1 KP Pro, code KPPRO

Purpose. Decide each question by KP stellar astrology as set in the owner's v15 booklet, with a prior used only where the booklet allows.

Source order of authority, booklet section 3. KP 14 first, on stability, fructification, prior, calibration and the five missed rule families.
Then KP 11 version 4 on the promise gate, KP 12 on strength and naming, KP 13 on rashi and graha nature, KP 15 on Rule of 10 mechanics only,
then the instruction text, then the numbered files, last old chat precedents. Name every conflict in one line. The VedNetra B4 verdict column
is never carried into the report because it is a script product.

Order of work.

1. Eight run preflight and the eight box gate, section 4. Runs 1 to 3 are the KP System Report at the stated time and at plus and minus 5 minutes.
   Run 4 the BALA table of six limbs. Run 5 the grain of the birth time and admissibility of every main cusp. Run 6 the plausibility prior, computed
   and written before the chart is read. Run 7 the rule family search. Run 8 the Rule of 10 layers, exactly ten per option, frozen before the chart.
   No prediction is published until all eight boxes are filled.
2. Settings, section 5. Thirteen fixed settings, among them KP ayanamsa, Placidus, sign star sub for every point, stability tier fixed, Sutton and
   Rashi and Graha nature layers mandatory, no retrograde veto, mean nodes, existence decided only by the KP 11 gate and whether it has happened only
   by the dasha window.
3. Prior and bands, section 8. Marriage prior by age and sex, parent alive prior by age, defaults for siblings, education, height, residence. Merge with
   the chart by the significator NET band, STRONG at 6 or more, PRESENT 2 to 5, UNDECIDED minus 1 to 1, ABSENT minus 2 or less. In UNDECIDED the prior
   decides and the answer is labelled PRIOR DOMINANT. In the other bands the chart decides, with high trust in STRONG and ABSENT and reduced trust in PRESENT.
4. Stability tier, section 9. TIME CRITICAL questions, horary or a window under one month, are decided by the cusp sub lord. TIME ROBUST questions,
   married or not, education, parents, are decided by the stable items. A cusp is inadmissible if its sub changes within the declared grain, and then the
   gate is advisory only. A 5 minute shift changed 240 of 240 cusp sub lords in the owner's test.
5. Promise gate, KP 11 version 4, section 10. Layer A is the cusp sub lord and the houses it signifies at weight 2. Layer B is the star lord of that sub
   lord and its houses at weight 1. The sub lord's own sub lord is not counted. GATE NET is twice A supporting minus twice A denying plus B supporting
   minus B denying. 6 or more PROMISED AND CONFIRMED, 2 to 5 PROMISED, minus 1 to 1 GATE UNDECIDED, go to the significator count and the prior, minus 2 or
   less DENIED. No OBSTRUCTED band. A node is represented by conjunction, then aspect, then star lord, then sign lord.
6. Significators and NET, section 11. Four steps per house, A planets in the star of the house occupants, B the occupants, C planets in the star of the
   house lord, D the house lord, E conjunct or aspecting planets as support. Each significator is filtered by its own sub. Ties broken by BALA, never
   intuition. NET is the rank weighted sum over the top three significators. A house signified by 7 or more planets is a noise house and drops one level.
7. Sutton nakshatra layer section 13, Rashi layer 14, Graha nature 15, BALA 16, all mandatory. BALA never creates or erases a promise.
8. Rule of 10, section 17. Ten plain word prerequisite layers per option written before any planet is read. Four refusal tests, outcome, anchor,
   direction, reading. Layer score is natal 0.7 times weighted house condition plus 0.3 times karaka strength, plus half the dasha part at 0.25, 0.35,
   0.4 for dasha, bhukti, pratyantar, plus a quarter of the transit part. SATISFIED at the chart median, 1.1 for a SUPPORT layer, 0.6 for an AFFLICT layer.
   Rank by number of SATISFIED layers, then strong planets and rajayoga, a lead under 2.0 is NARROW.
9. Arbitration with the KP spine, 17.8. A DENIED gate or failed fructification keeps an option excluded. A firm spine, one option clearly ahead on gate band
   and NET, is not changed by R10. A thin spine, two or more options in the same gate band with NET within 2, or the gate UNDECIDED, lets R10 depth break the
   tie. If still equal, BALA breaks it. An invalid or mostly UNTESTABLE layer set is NOT SEPARATED and sits out. R10 is unmeasured and provisional.
10. Fructification and transit, sections 19 and 20. Walk mahadasha order and bhukti inside each qualifying one. A qualifying window is a dasha bhukti pair where
    both lords score positive for the house group and the bhukti is the subject's. If the first qualifying window has begun, the event has happened. If none
    exists at any age, the event does not fructify in this life and that overturns the prior. Age bands from KP 14. The Sun sets the month, the Moon the day,
    Jupiter and Saturn the year band, the rising sign the hour, through star and sub of the significators. Sade Sati is read separately.
11. Event house groups, section 23. Marriage 2, 7, 11. Children 2, 5, 11. Profession 2, 6, 10, 11. Wealth 2 and 11 against 8 and 12. Property 4, 11, 12.
    Education 4, 9, 11. Health 1, 6, 8, 12. Litigation 6, 8, 11, 12. Travel 3, 9, 12. Foreign 3, 9, 12 with 9 required. Longevity 1 and 8 with
    badhaka and maraka. Profession field is read from the 10th cusp star chain.
12. The 17 mandatory rules, section 28, and the seven output blocks of section 26. The Hindi devotional style and the three time groups are not needed
    in SARVA.

Decision rule. The cell is the option the KP promise gate, the significator NET and the running dasha bhukti antara support, with R10 arbitrating under 9
above. If NET is UNDECIDED the computed prior decides and the line says PRIOR DOMINANT. The cell is the answer for the stated birth time, the first
of the three time groups. Differences at plus and minus 5 minutes go in the EVIDENCE line and the cell does not change.

Chart conflict rule. VedNetra falls back to Porphyry for intermediate cusps. Check the cusp sub lords of 2, 3, 5, 6, 8, 9, 11, 12 against true Placidus
from kpredict and name any difference as a declared conflict, booklet section 3.

EVIDENCE line must carry one confidence word HIGH, MEDIUM or LOW and one basis word CHART DECIDED, PRIOR DOMINANT or R10 DECIDED. The guard checks both.

Not applicable. Horary questions need a judgment moment and are outside SARVA. The R10 comparison with Chawdhri and Sutton is NOT RUN because
R7 forbids reading another's verdict. The Sutton layer inside KP Pro does run.

Honest record, booklet section 27. 122 questions on 20 charts. Random 24.8 percent. Prior alone 39.3. Version 13 27.0. Version 14 corrected 47.5 percent,
with 41 to 45 expected on unseen charts. On marital status, siblings, residence and parents, 55 of the 122, the chart added nothing over the prior.
Coborn count and height are declared failures answered from the prior with LOW trust. BALA and the numeric gate were not measured separately and R10 is
unmeasured.

### 6.2 KCIL, code KCIL

Purpose. Decide each question by Khullar's Sub Sub and Cuspal Interlinks, a closed system, on a chart cast on its own seven settings.

Closed system, part 3. Not used, retrograde, combustion, aspects, exaltation, debilitation, strength and Shadbala, planet age, yogas, divisional charts,
navamsa, Ashtakavarga, progressions, returns, harmonics. Outside facts such as almanac, festival or news are forbidden. KCIL is never mixed with KP. The
KP rule that a sub lord redirects the dasha lord is named and rejected.

Source priority, part 1. BTR chapter 5 first, then KAL, KTL, HOR, TA. TA is the dictionary and never a source of verdicts. Where TA and the CIL books conflict on method, the CIL books win.

Order of work.

1. Chart validity check, step zero. A chart not cast on the seven settings is not a KCIL chart. Say so and ask for a recast. A KP report or a VedNetra
   Lahiri chart is never a KCIL chart. Gender mandatory.
2. Rectification before any verdict, part 8 and v2.6 instructions section 17.1. It is an operation and not a disclaimer. Six tests, the Ascendant co-rulers
   linking 1, 7 or 10, the Ascendant SSL related to the Moon's star lord, the sex test, the Moon's co-rulers linking 1, 7 or 10, the Moon's levels
   signifying 1, 7 or 10, and the birth Prana lord signifying two of 10, 1 and 7. If all six pass at the given time stop. Otherwise cast at 0, minus and plus
   30 s, 60 s, 2 m, 4 m, 6 m, 10 m, at most 13 casts. The sex test is a hard gate. Owner's measurement, on 20 charts an average of 10.8 of 12 cusps change their sub
   sub lord within 30 seconds, and 64 percent of answers flip among the bands that pass all six. A birth time to the minute is a band and not a decision.
3. Write the Rule of 10 layers of every option before reading the chart, section 18. They lead the ranking only if so written.
4. The three promise gates, part 5. Gate 1 the Ascendant SSL links to the main cusp. Gate 2 the main cusp SSL links to the houses of the event group. Gate 3 the 11th
   cusp SSL links to the main cusp, fulfilment. Lagna and main cusp must both pass. A failed gate is an answer and a thing not in the promise is not timed.
   Direct and indirect linkage by the 2009 definition.
5. Event table and playbook, part 10. Choose the main cusp by meaning and not by number. Supporting cusps and bracketed houses count in the promise check as well as timing.
   Some events have two main cusps, unnatural death 1 and 8, higher education 4 and 9, any profession the field cusp and the 10th. Opposite results share the main cusp
   and differ in the supporting group, marriage 5 and 11, divorce 6, gain 2 and 11, loss 5 and 12. For a relative, turn the lagna first, then apply the table, the father's
   death is seen with the 9th as lagna and the native's 4th as the 8th. The five gate algorithm of the horary appendix is truth, promise, fulfilment, timing, agent, and truth is for horary only.
6. Timing, part 7. Promise, dasha, transit and progression must all agree. Five levels, Dasa, Bhukti, Antara, Sookshma, Prana. A descending ladder of permission, the Dasa permits, the Bhukti chooses, the
   Antara confirms, Sookshma and Prana start the event. A lower level cannot give what a higher one refused.
7. Competitive scoring of options, the locks of sections 16 and 17, the Rule of 10 of section 18.

Decision rule. The cuspal sub sub lord is the verdict. The cell is the option the sub sub lord promise gates, the cuspal links and the running periods support.

Determinacy. A determinate answer has no flipping material SSL, the EVIDENCE line says STABLE. A non determinate answer has two candidates, KCIL forbids merging them, SARVA needs one
cell. The cell is the candidate that the KCIL closing rule of section 16.30 prefers, the lower grade, the smaller count, the event not yet occurred, the person still alive. The EVIDENCE line says
TWO CANDIDATES, names the SSL that flips and the seconds, and names the other candidate.

No rule register, section 17.8. For height, graded build, religion, a named city, a child's sex and a relative's life span the corpus has no rule. The cell is the option the nearest real rule supports and the EVIDENCE line says NO RULE
REGISTER and names that rule.

EVIDENCE line must carry one of STABLE, TWO CANDIDATES, NO RULE REGISTER. The R10 margin CLEAR, NARROW or TIE is named when R10 decided, and a TIE goes to the section 16.30 rule.

Not applicable. Horary and the number method 1 to 2193 are outside SARVA. Rectification is inside it and its outcome goes in the EVIDENCE line. The section 17.9 honest prior line is stated once in the LIMITS line.

Honest record. Version 2.4 scored 27.6 percent on 123 questions, equal to always choosing option 1, best fixed answer per family 42.3. Determinate answers 44.4 percent against 25.1 random, non determinate 33.3. Expected on a quiz chart to the minute 2 to 3 of 6. The R10 of v2.6 is unmeasured, ranks only if its regression test shows about 8 points gain.

### 6.3 SUJ engine, code SUJ

Purpose. Decide each question by the owner's Sudarshan Paddhati method, with strength weighing, the dominant house scan and engine 2.0. This is the one methodology whose steps
the owner dictated word by word, so the source file suj_engine/METHODOLOGY.md must be attached and followed literally. Do not paraphrase, shorten or reorder it.

Identity line of the method. An experienced Vedic astrologer on Brihat Parashara Hora Shastra, Phaladeepika and Bhavartha Ratnakara. Three pillars, promise, timing by dasha antardasha pratyantardasha, validation of timing by the transit of Saturn, Jupiter, Rahu, Ketu and Sun.

Order of work, matching sections S0 to S9 of the answer.

0. Start every question with node suj_engine/tools/prepare.js. It prints the ENGINE VERSION line, the dominant house scan, the strict windows, the rule lookup, the functional nature of the dasha lords and the HYPOTHESIS SCORES for yes or no
   questions. Read suj_engine/LEARNINGS.md first, guardrails G1 to G12 apply.
1. S1 Dominant house scan, METHODOLOGY 2.0, node suj_engine/tools/stellium.js. Count planets by house in D1. Two or more is a stellium, the highest count is the dominant house. For each planet in it list natural significations,
   functional significations by lordship, functional role, condition, and Navamsha placement. Write the life theme. Check it in the Moon and Sun charts. Link it to the question.
2. S2 D1 analysis in the Lagna chart, the Moon chart and the Sun chart, METHODOLOGY 2.1 to 2.7. Five processes. A house and house lord. B the Nth house and lord from the relevant house. C the fixed karaka. D the Nth house and lord from the house occupied
   by the karaka. E the house and lord from the Kalpurusha Kundali. Process A step by step. Planets posited in the house by natural signification with Mercury conditional and the Moon benefic from Shukla 6th to Krishna 10th tithi, by lordship, by
   condition including combustion, retrogradation, degree, exaltation or debilitation, house exchange where only trikona, kendra and 2nd house exchanges are benefic, by nakshatra and pada, by aspects received counting the natural nature of the aspecting planet only,
   by conjunction counting natural and functional nature. Then Shubh Kartari or Paap Kartari, then the zodiac in the house with friendship of its lord and the D9 and subject varga house. Then the lord, with the same points plus own sign, moolatrikona, and
   yogas such as Neecha Bhanga, Viprit Raja Yoga, Shash. Weightage order of section 1, planets in the house first, then Navamsha, then the house, its lord, their Navamsha, exaltation, zodiac, nakshatra and pada, the divisional chart, then the rest. Start positive,
   then discount by the malefic factors. The line RULES CITED lists rule IDs from rules_lookup.js or states the library holds none for the event.
3. S3 D9, always, METHODOLOGY 3.1. Lagna lord of D1 in kendra, trikona, 2nd or 11th of D9. Lagna of D9 in kartari, occupants, lord. The key house for the query. No aspects in divisional charts. For marriage the karakas Venus for males, Venus and Jupiter for females, and the 7th from them.
4. S4 Subject divisional chart, METHODOLOGY 3.2. D3 karaka Mars, D7 Jupiter, D10 Saturn, D12 Sun for father and Moon for mother, D30 Saturn, D24 for education. Same checks, key house of the chart, karaka, Nth house from the karaka.
5. S5 Planet strength and conflict, METHODOLOGY 5, node suj_engine/tools/planet_strength.js whenever candidate planets conflict. Six steps in the owner's Hindi text, Shadbala percent against the Santhanam minimums, sign and house condition in D1, D9 and the subject varga,
   retrograde and combust and planetary war kept apart from the mathematical percent, aspect conjunction yoga without double counting, relation to the subject and activity in dasha. Rahu and Ketu are assessed separately. The powerful planet enforces its result.
6. S6 Dasha and time status. Past periods first, then the running, then future, down to Sookshma. The line TIME STATUS followed by exactly one of ALREADY HAPPENED, HAPPENING NOW, WILL HAPPEN. The line WINDOW SCAN from window_scan.js strict view. The line DASHA LORDS from
   functional_nature.js, Laghu Parashari for dasha results only. A natal promise is capacity, status needs windows and status indicators counted separately, guardrail G4.
7. S7 Transit validation of Saturn, Jupiter, Rahu, Ketu and Sun in the selected periods, from the Lagna, Moon and Sun charts.
8. S8 Reconciliation. Which sections agreed. The line EVIDENCE TALLY with a whole number 0 to 100 per option from strength_tally.js, the share of planet strength in favour. The line COUNTER EVIDENCE. The line ENGINE VERSION copied from prepare.js, for example ENGINE VERSION 2.0
   degree true, nakshatra true, node bands true. For yes or no questions about what the native has, quote the HYPOTHESIS SCORES raw and z, and say the z reading is provisional.
9. S9 Summary. A short recap by section, a line FINAL ANSWER with one concrete answer, then 2 or 3 bulleted one liners, the last starting with Final answer, and nothing after them.

Weighing rule, guardrail G2, the owner's decision of rounds 6 and 7. Evidence for and against an option is weighed by the real strength of the planets on each side, not by counting factors. A planet counts once per side with its largest weight. A debilitated 9th lord is a weak 9th lord. An
aspect works by the planet's natural nature. House ownership works by houses owned, trine most beneficial, kendra somewhat, trik harmful, houses 2, 3 and 11 carry no weight in the natal tally until the owner says. Laghu Parashari is for dasha results only and does not enter the natal tally.

Ordered options, G5. List lowest first. Evidence for a level supports it and every lower level, evidence against opposes it and every higher level. The answer is the highest level whose strength share is above 50, or the lowest when none is. Run the guard with the ordinal flag.

Count questions, G6. Use only documented counting indicators, the occupants and aspects of the sibling houses, Ashtakavarga of those houses, the karaka and its sign type, D3. The engine has no validated rule for the number of siblings or children and none for divorce, an answer on those rests on chain evidence only and claims nothing more.

Always decide, owner's round 4. Never write that the engine cannot differentiate, decide or determine, never call options equal. With options pick the single most suitable one. Without options give an answer as concrete as a choice. Guard v2 fails hedging language and fails wording that reasons by typicality, base rate, usually, most common, safe choice, on average, in general.

Decision rule. The cell is the FINAL ANSWER of the SUJ file, which is the option with the highest EVIDENCE TALLY number, with a TIE BREAK line naming the deciding step if two are equal.

SUJ output for SARVA. The SUJ answer is written to its own file in the S0 to S9 layout of suj_engine/ANSWER_TEMPLATE.md and passes suj_engine/tools/answer_guard.js. The SARVA reply carries a condensed block and the line SUJ FILE with the path. In SARVA the SUJ rules apply inside the SUJ column,
and for any question not named SARVA the SUJ section governs by itself.

EVIDENCE line. Name the tally numbers per option and the strongest counter evidence in one line.

Honest record. LEARNINGS.md. On Kundali 892 the engine scored 1 of 5, on Kundali 4 3 of 8 blind. The strength tally score carried no signal over the first three charts, AUC 0.46. The z reading against the type's own null, AUC 0.78 on 80 pairs, was found after the truths were known and is
provisional. The 52 pre registered rule tests recorded in the repository README came out at chance.

### 6.4 CHAWDHRI, code CHAWDHRI

Purpose. Decide each question by the engine built from four books by Dr L R Chawdhri and one Vimshottari dasha book by Sarajit Poddar, Chawdhri outranking Poddar, with Sutton's nakshatra layer as a second opinion that never changes the answer.

Scope. No KP, Nadi or BNN, Kaal Chakra, Chara, Yogini, Trinetra, Mehta, Umesh Puri, Triveni, and none of the other VedNetra report skills. The dasha is Vimshottari only. If a task seems to need another school, say so and ask first.

Standing rules.

1. An event is fructified by the houses and house lords and also by the natural significations of the planets, of the nakshatras they occupy and of the lords of those nakshatras. Never judge from houses and house lords alone. AUTHOR_METHOD section 8a.
2. A promise is never enough. Read the dasha_gate of each topic, the past firing windows, the running status, the next windows. AUTHOR_METHOD section 9b. A promised event with past firing windows could have happened already, a promised event with none and a closed running period is not yet due, said as consistency and not as fact.

Run.

    cd ../CHAWDHRI && sh jyotish.sh --date YYYY-MM-DD --time HH:MM --lat LAT --lon LON --tz TZ --gender male|female --now AS_OF --topics TOPICS --question "..."

Add --json for structured output, --back YEARS for a past tense question, --complement EVENTS for the complementing layer. Topics include education, marriage, career, children, foreign, mother, father.

Order of work.

1. Read the report layers, VedNetra's topic analysis, the book findings with page references, the author_method block, the sutton block per topic.
2. Give the promise, the running stack with each lord's houses and natural words, the running status, past firing windows with ages and the next windows.
3. Say which natural significations support or oppose the event, and when a planet that signifies the matter is weak or combust.
4. Never rank periods from one score. Put the Chawdhri score, the VedNetra score and the Sutton window verdict side by side. A gap under 1.0 is not a ranking.
5. For a multiple choice question rank the options from the promise and the gate together, never from general knowledge.
6. Flag birth time sensitivity when chart_stability says the chart moves within a 10 minute error.
7. Health and longevity keep the notice that this is not a medical finding. No death date.

Decision rule. The cell is the Chawdhri answer, the option the promise and the dasha gate together rank first. The Sutton block is not the cell, and a SUTTON DISSENTS or NO SECOND OPINION result is reported as it came inside the CHAWDHRI block and not smoothed into agreement.

EVIDENCE line. Promise and gate in one line, with the natural signification support and the birth time sensitivity.

Honest record, from the repository. A blind test on 93 quiz charts and 335 questions found the choice rules no better than chance or the most common answer for education, marriage, work and children. Timing windows hit 2 of 6 documented events against 1.9 expected by chance. Sutton has a chance level study only. Treat any prediction as a hypothesis.

### 6.5 BNN, code BNN

Purpose. Decide each question by Bhrigu Nandi Nadi as set out in the owner's 54 page guide, with every claim resting on a rule searched in the session and cited by Rule ID.

The five points to hold on every page, guide section 1.

1. Read karakas, not houses. Counting houses from the Lagna and using house lords is forbidden.
2. Time comes from Vimshottari and transit. Vimshottari says when, BNN says what.
3. A verdict is written only when its rule was searched in this very session, quoted word for word with its ID.
4. Every sieve prints its pass rate. A sieve that gives the same result on every chart is a fault.
5. Every department prints its measured accuracy.

Corpus and priority, section 2. 3,073 rules. Rao's four books win, then a worked chart over prose, then Tier 2, then Tier 3. Negandhi, Naik, Bang and Gopalakrishnan do not count as independent confirmation. SAI part 1 rejects the Lagna and part 2 counts from it, so part 2 is never cited. GUP chapters 2 to 6 are not corpus. The Parashari
parts of PRK are not BNN. Input is the VedNetra BNN Chart Export, blocks A to H1, sex mandatory. Transit dates come from the verified VedNetra panchang. For a past event recast on the date of the event as the enquiry date.

Lanes, section 4. A BNN transit, Jupiter clock, crossings, stations. B Vimshottari, who holds the door. C fast triggers of Sun and Moon. D navamsa, optional, agreement lifts one rung and absence never lowers. Lanes are never averaged.

Grades, CONFIRMED, INDICATED, POSSIBLE, OPEN, DENIED, conditions in guide 4.2. Caps, 4.3. A dated verdict is never CONFIRMED if the scan surface is narrower than the screen. A sieve with pass rate above 60 or below 5 percent caps at POSSIBLE. Ten layers written after reading the chart cap at POSSIBLE. A department that loses to its best fixed answer caps at POSSIBLE. A department at or below chance is OPEN.

Order of work, guide section 6, never reordered.

0 ledger. 0a open the corpus and search. 0b load the register for the question's department. 0b1 write the ten layers of every option before touching the chart. 0c for multiple choice screen the options first. 0d declare the scan surface. 0e declare the connection set 1 5 9, 3 7 11, 2 12, with 4 6 8 10 never connections. 0f one line of the department's measured accuracy.
1 identity and sex check. 2 exchanges. 3 read the karaka frame. 4 keep planets apart and do not blend a crowded sign. 5 search and quote rules. 6 strength relief and cancellation. 7 prerequisite test and chain, 7a promise ledger, 7c ten layer test. 8 delivery window test, 8b window map, 8c scale rule for counts and ages. 9 timing on lanes A B C D, 9a candidates by sieve, 9b sieve self check, 9c pass rates, 9d order survivors by promise word.
10 grade, 10a tie break ladder. 11 write the answer.

Rule lookup, mandatory.

    node sarva_engine/tools/bnn_rules.js --method
    node sarva_engine/tools/bnn_rules.js '{"event":"marriage","q":"Venus","limit":15}'
    node sarva_engine/tools/bnn_rules.js '{"id":"RAO-FND-009"}'

The guide writes IDs without hyphens, RAO EDU 003, the corpus has them with hyphens, RAO-EDU-003. Cite the Rule ID of each rule used. Where authors disagree, for example the female marriage karaka in ARI-GRM-022, ARI-GRM-027 and RAO-DOM-001, cite both and decide on the chart. The later rule that says it settles the point wins over the earlier one.

Multiple choice, guide 13.3 and 16. Name each option's own karaka from the retrieved rules, test it in this chart, remove an option whose own karaka is exalted, supported and untouched by Saturn, Rahu and Ketu, then read the subject karaka and rank the survivors. Print the screening table. Among survivors the combination that names more planets is more direct. An option the register does not name is OPEN and is not given the nearest planet silently.

Ten layers, guide 17. Ten plain word preconditions per option written before the chart, four refusal tests, outcome, anchor, direction, reading. Lane L N decides, counting only SATISFIED layers. Lane L H follows the source and never decides. If its tables are absent print NOT RUN. Rank by number of SATISFIED layers, a lead of under two is narrow but still named. Unmeasured, so on its own it caps at POSSIBLE.

Tie break ladder, guide 14. Rung 0 screening. 0a one full surface. 0b promise word. 0c sieve pass rate 100 or 0 voids the comparison. 0d event polarity. 0e ten layer count. 1 the rule that names the outcome most directly. 2 source tier. 3 presence over aspect, 3a connection class. 4 delivery window, 4a lane B delivery set, 4b node entry freshness. 5 isolation and node position. 6 dignity for quality only. 7 trine weight. 8 degree order. 9 none.

Department methods, guide 16. Education 16.1, profession 16.2, marital status 16.3, children 16.4, parents 16.5, siblings 16.6, residence and foreign settlement 16.7, disease 16.8, dated events 16.9, stature and marks 16.10.

Honest date limits, guide 18.2. Birth time to the minute with blocks E and H, one week. To the hour, one month. Half a day or rectified, one quarter. No birth time, at most one quarter and lane B closed. Give both ends of the window.

Decision rule. The cell is the rank 1 option of the BNN procedure, one option. How SARVA reconciles the guide.

1. The guide may print one or two ranked answers. The cell is rank 1 only.
2. If the ladder ties through rung 9 the guide prints both options and grades POSSIBLE. The cell must be one option. It is the option ahead on most rungs from 0 to 8, then the option whose outcome rule names more planets, then the option listed first. The EVIDENCE line then says LADDER TIE FORCED PICK.
3. A grade of OPEN or POSSIBLE is not a blank. The cell is still the best supported option and the grade is in the EVIDENCE line.
4. The guide's side table comparing the ten layer score with Chawdhri and Sutton is NOT RUN, R7. The closing Hindi line is optional.

EVIDENCE line. The BNN grade word and at least one Rule ID in the form AAA-BBB-NNN, for example RAO-FND-009. For a department at or below its best fixed answer, say so.

Not run. NOT RUN BNN RULES MISSING only while BNN-RULES-5COLUMN.csv is absent from the session, and the guard rejects that text while the csv is present.

Honest record, guide 15.2. 20 charts, 127 questions. First version 41 of 127, 32.3 percent. After eleven corrections 52 of 127, 40.9 percent, chance 24.8. Marriage 9 of 19 and dated events 4 of 8 are above the best fixed answer. Parents, education, residence, children, siblings, profession and disease are at or below it. The best fixed answers per department sum to 47.2 percent, above the engine's 40.9.

### 6.6 Udu, code UDU

Purpose. Decide each question by the nakshatra and pada engine that answers only from its own corpus of 11,683 rules, Lahiri only.

STATUS. The nine corpus files are not installed. Until all nine exist in sarva_engine/knowledge/udu the cell is the exact text NOT RUN UDU RULES MISSING and the EVIDENCE line says the nine corpus files are not installed. This is a standing gap decided by the owner on 16 November 2026. Everything below is the module that runs once the files exist. A model never fills the Udu cell from general astrology, because the Udu method itself forbids answering without its rules and calls a fabricated rule its one real failure.

Corpus. Ram Babu Sao part 1 (RBS-1, 2,274 rules, partial 67 percent), Avasthi (AVA-2, 2,252, partial 37), Ashok Sharma (ASH, 2,037), Ram Babu Sao part 2 (RBS-2, 1,718, partial 59), Prash Trivedi (TRI, 1,331), Tamhankar (TAM-RA, 1,091), Natarajan (NAT, 980). Partial books thin out in later pages, silence there is extraction and not astrology. Rule record fields id, book and page, cat, subj, pada, graha, house or sign trigger, cond, eff, pol, conf. Contradictions between books are kept, never merged.

Pipeline, document section 1. UduDaya report, route the question to the corpus file, apply rules by domain, weigh by polarity confidence and specificity, Law 2 chain, Law 3 dasha and transit gate, verdict.

The seven laws.

- Law 0. Every claim carries a rule ID. 0a read each rule to its last word. 0b write the full karaka list of every house touched. 0c write both poles of a nakshatra. If the corpus is silent say so and reason from the nearest rules and say that this is done.
- Law 1. Direct meaning first. Direct lordship before derived. Natural nature never overrides functional lordship. Expenditure buys something, loss buys nothing.
- Law 2. A chain is built by the necessity test and not by resemblance. A link is in only if it is a prerequisite or the same substance. Income is not in the profession chain. The trade karaka graha is the spine of the profession chain.
- Law 3. Promise and delivery are two things. The period test is a gate and adds no weight. Strong promise with the delivering period passed means it happened. Strong promise with the period not yet come means it has not happened. Weak promise with the period passed means reduced or missed. Weak and not yet means not and unlikely. A weak promise still delivers if the dasha lords and transit all line up.
- Law 4. A bare date is the weakest mode, seven steps, an age gate, never name death as the face of a date.
- Law 5. Rectify birth time only from Lagna derived evidence, at least three, and answer as a window.
- Law 6. The transit ladder, a transit on the same nakshatra and the same pada is heaviest.

Routing, section 5. Marriage and relations UDU-vivah-sambandh. Career, wealth, property UDU-karya-dhan. Health, body, longevity UDU-arogya-ayu. Nature and education UDU-vidya-swabhav. Children, parents, siblings UDU-santan-parivar. Dharma and remedy UDU-dharma-upay. When, dasha, muhurta UDU-samay-muhurat. Travel, foreign, enemies, litigation UDU-yatra-shatru. Core nakshatra nature UDU-mool-tattva. Read UDU-REF-coverage.md first. Inside a file read the Moon nakshatra section, then the section of the graha that drives the question, then _general. Open every category, especially muhurta.

Weighing, section 11. Weight equals polarity times confidence times specificity. Polarity benefic plus 1, malefic minus 1, mixed 0. Confidence classical 1.2, stated 1.0, inferred 0.7. Specificity pada 1.5, graha in nakshatra 1.3, nakshatra alone 1.0, house or sign 0.6. Only rules of the governing house and of links that passed the necessity test are summed. Bands, total plus 3 or more yes certain, plus 1 to plus 3 yes with a condition, minus 1 to plus 1 mixed, minus 1 to minus 3 difficult, minus 3 or less no. The document does not say where exactly plus 1 and minus 1 fall, show the neighbouring band. A pada rule overrules a house rule and the overruled rule is named. Show the arithmetic. Rules that nearly fired are named and left out of the sum.

Timing, sections 8 and 12. The corpus has no Vimshottari arithmetic. Dasha dates come from the UduDaya report of the vednetra-ududaya skill and the pratyantar is the engine's own count and is said so. A date window is never tighter than the rule supports. Gender and a birth time are required.

Style, sections 13 and 14. Direct, no maybe, no disclaimer paragraph, no question dodged. The only refusal is naming death as the face of a bare date. Check the 13 listed past mistakes and the 16 item checklist of section 16 before every answer.

Decision rule. The Udu cell is the option with the highest weighted sum, one option. A tie goes to the option with the pada level rule. Show the sums for each option and name the band.

EVIDENCE line, once the corpus exists. At least one Udu Rule ID such as ASH-1467, TRI-0919 or RBS-1-0943, and the statement that no accuracy has been measured for Udu.

Honest record. The document reports no measured accuracy for the Udu column. Rule IDs for the Mula poles and the bright pole of Purvabhadrapada were not given in the instructions.

### 6.7 Quad Dasha, code QUAD

Purpose. Decide each question from four dasha systems, Vimshottari, Chara, Kaal Chakra and Yogini, under the report contract of the owner's vednetra-quad skill, and from the Rule of 10 on every option.

STATUS. The full methodology sections 3 to 19 are not installed. Until sarva_engine/knowledge/quad/QUAD-FULL-METHODOLOGY.pdf, .txt or .md exists the cell is the exact text NOT RUN QUAD RULES MISSING and the EVIDENCE line says the full methodology file is not installed. This is a standing gap decided by the owner. The compute layer, validated, is available now, and the reply may state the computed dasha facts in the EVIDENCE line of the not run cell. The READ rules of Chara, Kaal Chakra, Yogini, Laghu Parashari and the Rule of 10 text must never be reconstructed from memory.

Three jobs, always kept apart. COMPUTE, the chart and all four dashas, validated, 8 of 8 self tests, 27 of 27 BPHS chapter 64 antardasha cells, 53 of 54 Rao Chara sequences. READ, the interpretive rules of each school, not validated, 52 pre registered rule tests at chance, mean lift 0.960, and on a 137 question outside quiz the lead over a no chart control was 6.6 points, p 0.21. OPTION TEST, the Rule of 10, every option broken into exactly ten layers written before the chart is read, mandatory and unvalidated.

Run.

    node ~/.claude/skills/synced/*/vednetra-quad/scripts/run_quad_dasha.js --selftest
    node ~/.claude/skills/synced/*/vednetra-quad/scripts/run_quad_dasha.js '{"name":"N","date":"YYYY-MM-DD","time":"HH:MM","tz":5.5,"lat":0,"lon":0,"asOf":"AS_OF"}'

The self test must print RESULT READY. asOf is the date the question is about. Birth time is needed. Without it read only the Chara section. Do not use VedNetra's own Char Dasha or Yogini cards.

The seven corrections of contract section 2. If a user, a book or software contradicts one, the engine is right. Kaal Chakra balance is against the whole package span. Kaal Chakra has nine antardasas per dasha. The package repeats when exhausted. Chara length counting goes in groups of three, Ar Ta Ge forward, Cn Le Vi reverse, Li Sc Sg forward, Cp Aq Pi reverse. No plus or minus 1 year for exaltation or debilitation, maximum 12 minimum 1. Seven Chara karakas never eight. Lahiri only.

Levels licensed, contract section 3. Vimshottari mahadasha and antardasha yes. Pratyantar and below only with a minute accurate birth time. Chara dasha yes and the only level usable with no birth time. Kaal Chakra dasha yes with the stability flag. Kaal Chakra bhukti never. Yogini dasha yes. Yogini sub period only with a minute accurate birth time.

Stability gate. Not advisory. A system that shifts inside the plausible birth time error has its claim withdrawn in writing as UNSTABLE. Kaal Chakra drift is about 2.92 months per minute of birth time error.

The four confidence words, exact. COMPUTED, CLASSICAL, UNSTABLE, VACUOUS. Quote the base rate whenever a rule fires, contract section 5 table. A rule with a base rate above about 85 percent or below about 5 percent is VACUOUS.

Other contract points. Never date a death. Never claim a validated hit rate. Dignity, Shadbala, combustion and most divisional charts are not computed. No transits, deliberately. Whole sign houses. Rahu is the mean node.

Decision rule, once the full methodology exists. Run the four systems for the question's event and the Rule of 10 for every option, and pick the option the Rule of 10 ranks first. Name the systems that agree and the ones that are UNSTABLE. A claim withdrawn as UNSTABLE is not used to choose. If every system is withdrawn the cell is the option the remaining stable system supports, normally the Vimshottari antardasha.

EVIDENCE line, once present. At least one of COMPUTED, CLASSICAL, UNSTABLE, VACUOUS.

Honest record. As above. The Quad contract itself says its READ layer was at chance.

---

## PART 7. CHOOSING ONE OPTION, COMMON MECHANICS

### 7.1 One option, always [OWNER]

Each methodology ends with one option, R6. If the evidence is thin the line says how thin and the pick is still made. Words that the guard treats as hedging in an OPEN result are cannot, can't, unable, undecided, undetermined, equal, tie, either, neither, the word or, and a slash. A result written with one of them fails.

### 7.2 Mapping options to the methodology's own states [PORT]

Before reading a chart write what each option means in the methodology's own terms, so that the choice is not made after the chart looks pleasing.

- KP Pro. The event state and house group of each option, from section 23.
- KCIL. The main and supporting cusps of each option, from part 10.
- SUJ. The hypotheses and the planets that would stand for and against each option, then strength_tally.js.
- CHAWDHRI. The topic and the dasha_gate of each topic involved.
- BNN. Each option's own karaka, from the retrieved rules, and its ten layers.
- Udu. The corpus file and the chain of each option.
- Quad. The ten layers of each option.

### 7.3 Option types [PORT]

| Type | How the cell is formed |
|---|---|
| Nominal | The option the methodology ranks first |
| Ordinal | SUJ ordinal rule, G5. Other methodologies rank the options on their own scale and the cell is still one option |
| Count | One number from the methodology's own counting indicators. If the methodology has no counting rule the evidence line says so and the cell is the nearest number its indicators support. SUJ, KP Pro, KCIL and BNN all declare weakness on counts |
| Yes or no | One of the two, never maybe |
| Open | One concrete answer, for example a named year or a named field, not a range |

### 7.4 Thin evidence

State the thinness in the EVIDENCE line. Examples of what to name. Few counted indicators. A gate UNDECIDED. A flipping SSL. A sieve outside 5 to 60 percent. A department at or below its best fixed answer. A confidence word LOW. A claim withdrawn as UNSTABLE.

### 7.5 Forced picks, the owner's rules for ties

| Methodology | Tie rule |
|---|---|
| KP Pro | R10 depth on a thin spine, then BALA, never intuition |
| KCIL | The section 16.30 closing rule, lower grade, smaller count, event not yet occurred, person still alive |
| SUJ | A TIE BREAK line naming the deciding step, METHODOLOGY 5.4 order, subject links, owner adjusted Shadbala percent, Vimshopaka, total Shadbala rupa, Naisargika order |
| CHAWDHRI | The promise and the dasha gate read together. No further owner tie rule was found, [GAP] |
| BNN | Ladder rungs 0 to 8, then the option whose rule names more planets, then the option listed first, LADDER TIE FORCED PICK |
| Udu | The option with the pada level rule |
| Quad | The remaining stable system, normally the Vimshottari antardasha |

### 7.6 Disagreement

If five methodologies pick B and two pick C, the table shows B B C B B and so on. Nothing is said about a majority in the table. A one line remark outside the table is allowed
only if the owner asks for it in that session.

---

## PART 8. OUTPUT SPECIFICATION

### 8.1 Reply anatomy

The reply is plain text lines in this order. Headings carry no markdown symbols.

    INTAKE
    LIMITS
    QUESTION Q1
    OPTIONS Q1 ...
    METHOD KPPRO Q1
    EVIDENCE Q1 KPPRO ...
    RESULT Q1 KPPRO ...
    METHOD KCIL Q1
    EVIDENCE Q1 KCIL ...
    RESULT Q1 KCIL ...
    METHOD SUJ Q1
    SUJ FILE Q1 path
    EVIDENCE Q1 SUJ ...
    RESULT Q1 SUJ ...
    METHOD CHAWDHRI Q1
    EVIDENCE Q1 CHAWDHRI ...
    RESULT Q1 CHAWDHRI ...
    METHOD BNN Q1
    EVIDENCE Q1 BNN ...
    RESULT Q1 BNN ...
    METHOD UDU Q1
    EVIDENCE Q1 UDU ...
    RESULT Q1 UDU ...
    METHOD QUAD Q1
    EVIDENCE Q1 QUAD ...
    RESULT Q1 QUAD ...
    (the same seven blocks for Q2, Q3 and so on)
    FINAL TABLE

### 8.2 Line grammar

| Line | Form | Rule |
|---|---|---|
| INTAKE | Free lines | Native, gender, birth data and how sure the time is, place with latitude, longitude, time zone, as-of date, the list of questions with options |
| LIMITS | LIMITS text | One line, says readings not certainties, names partial inputs, doubtful birth time, the two standing gaps, and in run modes B and C the isolation caveat of 5.2 |
| QUESTION | QUESTION Qn | One per question |
| OPTIONS | OPTIONS Qn A B C D or OPTIONS Qn OPEN | Labels separated by spaces, or by the vertical bar if a label has a space. The guard splits on the bar when one is present |
| METHOD | METHOD CODE Qn | CODE is one of KPPRO KCIL SUJ CHAWDHRI BNN UDU QUAD, in this order. Any other code is an error |
| EVIDENCE | EVIDENCE Qn CODE text | Exactly one per block, content rules in 8.4 |
| RESULT | RESULT Qn CODE label | Exactly one per block. The label equals an option exactly, or for OPEN one concrete answer, or the exact NOT RUN text |
| SUJ FILE | SUJ FILE Qn path | Path of an existing SUJ answer file that passes the SUJ guard |

Between the METHOD line and the EVIDENCE line a methodology may carry its condensed analysis as plain lines. Keep them free of the characters in 8.3.

### 8.3 Characters

Do not use these in the reply, outside the final table delimiter row. ( ) ! ; : — “ ” ‘ ’ / # * ~ and a hyphen with a space on each side.
Use words, commas and full stops. Colons are not used even in INTAKE. Rule IDs keep their hyphens. The guard prints a warning, not an error, for these characters, but the owner treats it as a requirement, R11. [OWNER]

### 8.4 What each EVIDENCE line must contain

| Code | Required content | Guard check |
|---|---|---|
| KPPRO | Counted evidence, how thin, plus the confidence word and the basis word. Name differences at plus and minus 5 minutes and any declared cusp conflict | One of CHART DECIDED, PRIOR DOMINANT, R10 DECIDED and one of HIGH, MEDIUM, LOW |
| KCIL | Counted evidence, the chart validity result, the rectification outcome, the R10 margin when it decided | One of STABLE, TWO CANDIDATES, NO RULE REGISTER |
| SUJ | The tally numbers per option, the strongest counter evidence | None beyond the SUJ file |
| CHAWDHRI | Promise and dasha gate read together, natural signification support, the Sutton verdict stated as a second opinion, birth time sensitivity | None |
| BNN | Grade word, at least one Rule ID, the lane summary, the ladder tie mark if used, the department accuracy remark | A Rule ID of the form AAA-BBB-NNN and one grade word, while the csv is present |
| UDU | At least one Udu Rule ID, the arithmetic sums per option, the band, and that no accuracy has been measured | A Udu Rule ID while the nine files are present |
| QUAD | The confidence words COMPUTED, CLASSICAL, UNSTABLE, VACUOUS, the systems that agree, those withdrawn | One of the four words while the full methodology is present |

### 8.5 The SUJ answer file

The SUJ file is a separate text file in this exact layout, from suj_engine/ANSWER_TEMPLATE.md version 3. Bullets use the dot character. Headings are plain text with the section prefix S0 to S9.

    S0. INTAKE AND TIME FRAME
    S1. DOMINANT HOUSE
    S2. D1 ANALYSIS          contains one line RULES CITED
    S3. D9 ANALYSIS
    S4. SUBJECT DIVISIONAL CHART ANALYSIS
    S5. PLANET STRENGTH AND CONFLICT RESOLUTION
    S6. DASHA AND TIME STATUS contains the lines TIME STATUS, WINDOW SCAN, DASHA LORDS
    S7. TRANSIT VALIDATION
    S8. RECONCILIATION OF SECTIONS contains EVIDENCE TALLY, TIE BREAK if needed, COUNTER EVIDENCE, ENGINE VERSION
    S9. SUMMARY             contains FINAL ANSWER, then 2 or 3 bullet one liners, the last starting Final answer, and nothing after them

Rules. One final answer, exactly one of the options when options are given. No hedging. No wording from typicality, base rate or safe choice. The EVIDENCE TALLY line has a whole number for every option, for example EVIDENCE TALLY Option A 40, Option B 72, Option C 55, Option D 10. TIME STATUS is exactly one of ALREADY HAPPENED, HAPPENING NOW, WILL HAPPEN.

### 8.6 The final table

The last block of the reply. A markdown table. Header exactly as below. One row per question, rows labelled Q1, Q2 and so on in order. Each cell equals the RESULT line of its pair. No ninth column. Nothing after the table.

    | Question | KP Pro | KCIL | SUJ engine | CHAWDHRI | BNN | Udu | Quad Dasha |
    |---|---|---|---|---|---|---|---|
    | Q1 | B | B | C | B | A | NOT RUN UDU RULES MISSING | NOT RUN QUAD RULES MISSING |

### 8.7 A complete skeleton that the guard accepts

This is sarva_engine/examples/format_example.txt, a layout example and not a reading.

    INTAKE
    Native Sample, male, born 1991-12-01 01:15:00 at Sonipat, latitude 28.9931, longitude 77.0151, time zone 5.5. As of date 2026-11-16.
    LIMITS Readings under each methodology, not certainties. Udu and Quad Dasha are not run, their rule files are not installed.

    QUESTION Q1
    OPTIONS Q1 A B C D

    METHOD KPPRO Q1
    EVIDENCE Q1 KPPRO significator NET in the PRESENT band, CHART DECIDED, MEDIUM
    RESULT Q1 KPPRO B
    METHOD KCIL Q1
    EVIDENCE Q1 KCIL no material sub sub lord flips inside 30 seconds, STABLE
    RESULT Q1 KCIL B
    METHOD SUJ Q1
    SUJ FILE Q1 sarva_engine/examples/suj_placeholder.txt
    EVIDENCE Q1 SUJ evidence tally from strength_tally with the highest share for the chosen option
    RESULT Q1 SUJ C
    METHOD CHAWDHRI Q1
    EVIDENCE Q1 CHAWDHRI promise score and dasha gate read together
    RESULT Q1 CHAWDHRI B
    METHOD BNN Q1
    EVIDENCE Q1 BNN POSSIBLE RAO-FND-009 ARI-GRM-022
    RESULT Q1 BNN A
    METHOD UDU Q1
    EVIDENCE Q1 UDU nine corpus files not installed
    RESULT Q1 UDU NOT RUN UDU RULES MISSING
    METHOD QUAD Q1
    EVIDENCE Q1 QUAD full methodology file not installed
    RESULT Q1 QUAD NOT RUN QUAD RULES MISSING

    | Question | KP Pro | KCIL | SUJ engine | CHAWDHRI | BNN | Udu | Quad Dasha |
    |---|---|---|---|---|---|---|---|
    | Q1 | B | B | C | B | A | NOT RUN UDU RULES MISSING | NOT RUN QUAD RULES MISSING |

### 8.8 Examples the guard rejects

| Fault | Why it fails |
|---|---|
| RESULT Q1 KPPRO B or C | Two answers. With options the guard rejects it because it is not one of the options, and it breaches R6 |
| RESULT Q1 KCIL E when options are A B C D | Not one of the options |
| EVIDENCE Q1 BNN POSSIBLE with no Rule ID while the csv is present | Every BNN claim needs a Rule ID |
| RESULT Q1 UDU NOT RUN UDU RULES MISSING while the nine files are present | The reading must be run |
| RESULT Q1 KPPRO NOT RUN | Only BNN, UDU and QUAD may use a not run text, and only the exact form |
| A table with an extra column, or a note after the table | R9 |
| A table cell that differs from its RESULT line | R9 |
| A METHOD line for an eighth methodology | R1 and R3 |

---

## PART 9. GUARD AND SELF AUDIT

### 9.1 Running the guard, Tier 1

    node sarva_engine/tools/sarva_guard.js reply.txt
    node sarva_engine/tools/sarva_guard.js reply.txt --no-suj-guard      (checks the SARVA reply only)
    node suj_engine/tools/answer_guard.js sujfile.txt --options "A|B|C"   (add the ordinal flag for ordered options)
    node sarva_engine/tests/guard_test.js                                 (self test)

Exit codes of the SARVA guard. 0 clean. 1 errors. 3 valid but incomplete because BNN, Udu or Quad rules are missing. 2 usage error. With the standing gaps in force a complete reply ends at 3. That is expected, R24.

The guard checks that a source is present by looking for files. BNN present when knowledge/bnn/BNN-RULES-5COLUMN.csv exists. UDU present when all nine UDU-*.md files exist. QUAD present when QUAD-FULL-METHODOLOGY.pdf, .txt or .md exists. KPPRO present when KP-PRO-METHODOLOGY.txt exists. KCIL present when KCIL-METHODOLOGY-V2.6.txt exists.

### 9.2 Manual audit, Tiers 2 and 3 [PORT]

Walk the checklist, the same checks as the guard. Mark each line pass or fail.

1. At least one question. Every question has an OPTIONS line.
2. Every question has all seven METHOD blocks, with the codes KPPRO KCIL SUJ CHAWDHRI BNN UDU QUAD and no other code.
3. Every block has one EVIDENCE line and one RESULT line. No pair has two RESULT lines.
4. With options, every RESULT is one of the listed options, spelled identically. For OPEN, no hedging word and no slash.
5. KPPRO EVIDENCE has a basis word and a confidence word.
6. KCIL EVIDENCE has STABLE, TWO CANDIDATES or NO RULE REGISTER.
7. BNN EVIDENCE has a Rule ID and a grade word, unless the csv is absent and the result is the exact NOT RUN BNN RULES MISSING.
8. UDU EVIDENCE has a Udu Rule ID, unless the corpus is absent and the result is the exact NOT RUN UDU RULES MISSING.
9. QUAD EVIDENCE has one of the four words, unless the full file is absent and the result is the exact NOT RUN QUAD RULES MISSING.
10. No other column carries a not run text.
11. Every question has a SUJ FILE line naming an existing file, and that file passes the SUJ checklist of 9.3.
12. The last block of the reply is the table. The header is exactly Question, KP Pro, KCIL, SUJ engine, CHAWDHRI, BNN, Udu, Quad Dasha. One row per question. Each cell equals its RESULT line. Nothing after the table.
13. None of the characters of 8.3 appears outside the table delimiter row.
14. The LIMITS line exists and names the standing gaps and any partial input.
15. If the run mode was B or C, the LIMITS line says so.

### 9.3 SUJ checklist [PORT, from answer_guard.js and the template]

1. Sections S0 to S9 present, in order, titled INTAKE, DOMINANT HOUSE, D1 ANALYSIS, D9 ANALYSIS, SUBJECT DIVISIONAL, PLANET STRENGTH, DASHA, TRANSIT, RECONCILIATION, SUMMARY.
2. No hedging phrase. No wording of the kind cannot differentiate, unable to decide, no clear answer, options equal, equally likely, inconclusive, it depends, insufficient evidence to, no definitive.
3. No wording from priors, the English words base rate, typical, usually, most common, statistical, safe choice, on average, in general and their Hindi equivalents.
4. Lines present, RULES CITED in S2, WINDOW SCAN and DASHA LORDS and TIME STATUS in S6, EVIDENCE TALLY, COUNTER EVIDENCE and ENGINE VERSION in S8, FINAL ANSWER in S9.
5. TIME STATUS has exactly one of ALREADY HAPPENED, HAPPENING NOW, WILL HAPPEN.
6. With options, EVIDENCE TALLY has a whole number for every option and the FINAL ANSWER holds the highest number. A tie needs a TIE BREAK line. For ordered options the final answer is the highest option above 50, or the lowest when none is.
7. FINAL ANSWER is one of the options.
8. S9 ends with 2 or 3 bullet one liners, the last starting with Final answer, nothing after.

### 9.4 Patterns, Appendix D

The regular expressions the guard uses are in Appendix D, so a Tier 2 model or a person can test lines.

---

## PART 10. STANDING GAPS AND HONEST LIMITS

### 10.1 Standing gaps, contract section 10

1. Five columns run on complete rules, KP Pro, KCIL, SUJ engine, CHAWDHRI and BNN.
2. Udu and Quad Dasha stay in the table as columns. Their rule files were not supplied. Their cells read exactly NOT RUN UDU RULES MISSING and NOT RUN QUAD RULES MISSING.
3. A complete reply therefore ends with the guard exit code 3 until those files are added. The LIMITS line names the two columns.
4. If the owner later supplies the files they go in sarva_engine/knowledge/udu and knowledge/quad under the names in those folders' README.md, and the guard and the preflight switch the columns to full runs on their own. A lookup tool for Udu like bnn_rules.js should then be built against the real layout, it was not built blind.
5. Dropping the two columns is a change to contract sections 1 and 4 and to the guard, made only on the owner's instruction.

### 10.2 Measured records, the only figures that may be quoted

| Methodology | Record | Source |
|---|---|---|
| KP Pro | 122 questions, 20 charts, random 24.8 percent, prior alone 39.3, v14 corrected 47.5, 41 to 45 expected on unseen charts, chart adds nothing over the prior on 55 of 122 | Booklet section 27 |
| KCIL | v2.4, 123 questions, 27.6 percent, equal to always option 1, determinate 44.4, non determinate 33.3, expected 2 to 3 of 6 on a quiz chart to the minute | Summary part 1 and instructions |
| SUJ | Kundali 892 1 of 5, Kundali 4 3 of 8 blind, tally AUC 0.46 on three charts, z reading provisional | LEARNINGS.md |
| CHAWDHRI | 93 quiz charts, 335 questions, no better than chance or the most common answer for education, marriage, work, children, windows 2 of 6 against 1.9 expected | CHAWDHRI SKILL.md |
| BNN | 52 of 127, 40.9 percent, chance 24.8, best fixed answers 47.2, above the best fixed answer only for marriage and dated events | Guide 15.2 |
| Udu | None measured | Udu document |
| Quad Dasha | READ layer 52 tests at chance, mean lift 0.960, 137 question outside quiz lead 6.6 points, p 0.21 | Quad report contract |
| SARVA as a whole | No chart has yet been run through a full SARVA reply and scored against known answers | STATUS.md round 7 |

### 10.3 What the engine does not claim

- No claim of a validated hit rate for any methodology or for the table.
- No claim that agreement across the columns raises the probability. The columns are not independent if one model wrote them, 5.2.
- No death date.
- No medical finding.

### 10.4 Risks specific to running SARVA on another model [PORT]

1. Leakage between columns when one model writes all seven. See 5.2.
2. Rule invention. A model fills a missing rule from general knowledge. Countermeasure, P4, R19, and the guard checks Rule IDs.
3. Hand computed charts. Countermeasure, R13, P1.
4. Wrong date. Countermeasure, P2.
5. Option label drift. The guard compares strings exactly.
6. Hindi reading errors in the sources. Countermeasure, P5, and quoting the line that was read.
7. Style creep. The model reverts to its own style and puts banned characters back, R11.
8. Overconfidence in numbers. Several methodologies print scores and tallies that the owner's own records show carry no signal, the model must present them as counted evidence and not as probability.

---

## PART 11. PASTE READY PROMPTS [PORT]

### 11.1 Master prompt for the orchestrator

    You run the SARVA engine. Read these rules and obey them exactly.
    SARVA runs exactly seven methodologies in this order, KP Pro, KCIL, SUJ engine, CHAWDHRI, BNN, Udu, Quad Dasha. No other methodology is run, cited
    or used as a tie breaker. Every question, with its options, is analysed separately under each methodology by its own rules and its own chart. No
    methodology reads another's verdict. Each methodology ends each question with exactly one finalized option, never two, never a range, never a refusal.
    Charts, dashas, divisional charts and transits come only from the supplied tool packs. You never compute them and never write them from memory. Rules are
    quoted only from supplied files and carry their Rule ID or section number. If a pack or a rule file is missing you say which and you ask. You never invent
    a rule. BNN, Udu and Quad Dasha use the exact texts NOT RUN BNN RULES MISSING, NOT RUN UDU RULES MISSING, NOT RUN QUAD RULES MISSING only while their rule
    files are absent. Udu and Quad Dasha are absent now, so their cells read those texts.
    The as of date is given to you. Use it for the time status of every event, already happened, happening now, or will happen.
    The reply format is in the layout of Part 8. The last block is one table with the header Question, KP Pro, KCIL, SUJ engine, CHAWDHRI, BNN, Udu, Quad Dasha,
    one row per question, each cell equal to that methodology's RESULT line, nothing after it. Do not use these characters outside the table delimiter row,
    parentheses, exclamation mark, semicolon, colon, em dash, curly quotes, slash, hash, asterisk, tilde, and a hyphen with spaces around it.
    Never answer to please the owner. Judge on the analysis. State honest limits once in the LIMITS line. Write the draft to a file and run the guard before sending.

### 11.2 Worker prompt, generic

    You are the worker for methodology <CODE> only. You have this pack and this bundle and nothing else. You may not read any other methodology's pack or result.
    For each question follow the module for <CODE> in the order given. Write layers or option states first where your method requires it. Check the promise and
    the time status against the as of date <DATE>. Cite rule IDs or section numbers for every claim. Choose exactly one option. Return one worker card per
    question in the card format. If the pack lacks a block, name the block, do not estimate it. If a rule is not in the supplied files, say so, do not write it.

Method specific lines to add.

- KPPRO. Compute and write the prior first. Use the prior only when NET is UNDECIDED and then say PRIOR DOMINANT. Name the confidence word.
- KCIL. Run the chart validity check, then rectification, then the three gates. Say STABLE, TWO CANDIDATES or NO RULE REGISTER.
- SUJ. Follow METHODOLOGY.md literally, start with prepare.js, write the file in the S0 to S9 layout, run the SUJ guard. Always decide.
- CHAWDHRI. Use only Chawdhri, Poddar Vimshottari and the Sutton second opinion. Read dasha_gate for every topic. No other school.
- BNN. Read karakas, not houses. Follow guide section 6 in order. Search the csv with bnn_rules.js, quote Rule IDs. Give the grade word.
- UDU. If the nine corpus files are absent return NOT RUN UDU RULES MISSING. Otherwise follow the seven laws and show the arithmetic.
- QUAD. If QUAD-FULL-METHODOLOGY is absent return NOT RUN QUAD RULES MISSING. Otherwise use the four systems, withdraw UNSTABLE claims, choose by the Rule of 10.

### 11.3 Formatter prompt

    You receive sealed worker cards. Assemble the SARVA reply in the grammar of Part 8. Copy every EVIDENCE and RESULT line verbatim. Do not change any result. Build the
    final table from the RESULT lines. Remove the banned characters from your own lines. If a card breaks the grammar, return it to its worker, do not repair the result yourself.

### 11.4 Auditor prompt

    You are given a reply file. Walk the checklist of 9.2 and the SUJ checklist of 9.3. List each failure with its line. Do not read any chart. Do not suggest a different answer.
    State the guard result in one line, valid, valid but incomplete, or failed.

---

## PART 12. FAILURE CATALOGUE

Error tags recorded from tested charts in LEARNINGS.md and the model faults expected when porting.

| Tag | Meaning | Guard against |
|---|---|---|
| prior_override | Chose by typicality, a base rate or the safe option against indicators the model itself found | R16, SUJ G1 |
| capacity_vs_status | A strong natal promise read as proof that the event is happening | R15, SUJ G4, Udu Law 3 |
| invented_rule | A heuristic not in the methodology, the library or a cited text decided the answer | R19, SUJ G6 and G9 |
| flag_dismissed | A counter indicator was listed then set aside without counting both sides | SUJ G3, COUNTER EVIDENCE line |
| winner_mapping | The strongest planet was named and a result attached by feel | SUJ G7 |
| negative_discount | An unpleasant event was weighted less because it was unpleasant | SUJ G8 |
| leakage | A column was influenced by another column's result | R7, 5.2 |
| cast_by_hand | A chart or a dasha was estimated by the model | R13, P1 |
| date_drift | The model used its own date | P2 |
| fabricated_citation | A Rule ID or a section that does not exist | R19, P4, the guard's ID format check |
| label_drift | An option was reworded in RESULT | 9.2 item 4 |
| smoothing | The table was adjusted to look consistent | R10, 5.9 |
| silent_gap | A missing pack or rule file was not reported | 3.5, 4.2 |

---

## PART 13. CHANGE CONTROL AND OPEN OWNER DECISIONS

### 13.1 Change control

1. These requirements are stored in the repository and loaded through CLAUDE.md. They change only when the owner changes them. STATUS.md records each change. This document is a derived edition, if the contract changes, this document is regenerated and its version raised.
2. After the owner reports true answers for a chart add the case, run the scoreboard and update LEARNINGS.md and STATUS.md. For SARVA as a whole the owner may add true answers, which would be the first measurement of the engine.
3. When the Udu corpus arrives, place the nine files in sarva_engine/knowledge/udu, run the preflight, build a lookup tool against the real layout, and update 6.6 and 10.1.
4. When the Quad full methodology arrives, place it in sarva_engine/knowledge/quad as QUAD-FULL-METHODOLOGY and update 6.7 and 10.1.

### 13.2 Decisions the owner is asked to make about this edition [GAP and PORT]

1. No sanctioned cell text exists for a missing chart pack in KP Pro, KCIL, SUJ or CHAWDHRI. The contract allows a not run text only for BNN, Udu and Quad rule files, and the guard rejects a not run text elsewhere. This edition therefore says stop and ask. If the owner wants a column to be allowed to read NOT RUN CHART MISSING, the contract and the guard need that change.
2. Run modes B and C do not meet R7. This edition requires them to say so in LIMITS. The owner may instead forbid them.
3. The SUJ FILE requirement assumes a file system. For a plain chat model the SUJ answer is a text block saved by a person. The owner may want an inline form.
4. The CHAWDHRI tie rule is not stated in the sources found. The edition uses promise and gate read together. The owner may supply a tie rule.
5. KCIL KCIL-10 calibration file and KP 12, 14, 15 are not in the checkout used. The edition names them as absent and does not rebuild them.

### 13.3 Version history

- 1.0, 16 November 2026. First portable edition from contract rounds 1 to 7.

---

## APPENDIX A. GLOSSARY

| Term | Meaning |
|---|---|
| As-of date | The system date, used for the time status of every event |
| BALA | The six limb strength table of KP Pro, never creates or erases a promise |
| CSL | Cusp sub lord |
| DBASP | Dasha, Bhukti, Antara, Sookshma, Prana |
| Gate NET | KP Pro promise gate sum, 2 times layer A plus layer B |
| NET | KP Pro significator rank weighted sum |
| R10 | Rule of 10, ten layer test of an option, used by KP Pro, KCIL, BNN and Quad |
| SSL | Sub sub lord, the KCIL verdict |
| Pack | A tool output saved as a file and given to a worker |
| Sealed card | A worker's final card that no other worker may read |
| Time status | Already happened, happening now, will happen |
| UNSTABLE | The claim shifts inside the plausible birth time error and is withdrawn |
| VACUOUS | The rule's base rate is above about 85 or below about 5 percent, so firing means little |

## APPENDIX B. FILE MANIFEST

Sizes are of the files in this checkout.

sarva_engine, the binding files

| File | Size in bytes | Role |
|---|---|---|
| ENGINE_CONTRACT.md | 16,444 | Binding requirements |
| METHOD_ROUTING.md | 8,409 | How to run each methodology |
| ANSWER_TEMPLATE.md | 2,972 | Reply layout |
| STATUS.md | 8,825 | Round log |
| tools/sarva_preflight.js | 5,529 | Which columns can run |
| tools/sarva_guard.js | 10,653 | Reply checker |
| tools/bnn_rules.js | 5,317 | BNN rule lookup |
| tests/guard_test.js | not measured | Guard self test, prints sarva guard tests passed |
| examples/format_example.txt | 1,424 | Layout example |

sarva_engine/knowledge

| Folder | Files | Notes |
|---|---|---|
| bnn | BNN-RULES-5COLUMN.csv 1,837,686, BNN-METHOD-GUIDE.pdf 2,548,254, .txt 288,981, .index.tsv 6,205, BNN_PROCEDURE.md 7,670, README.md | Complete |
| kcil | KCIL-METHODOLOGY-V2.6.pdf 2,784,391, .txt 358,820, .index.tsv 986, KCIL_PROCEDURE.md 7,975, README.md | Rules in the sibling repo |
| kppro | KP-PRO-METHODOLOGY.docx 93,965, .txt 203,673, .index.tsv 2,660, KP_PRO_PROCEDURE.md 10,875, README.md | Rules in the sibling repo |
| quad | QUAD-METHODOLOGY-INTRO.pdf 208,048 and .txt 7,760, QUAD-REPORT-CONTRACT.md 10,950, QUAD_PROCEDURE.md 3,770, README.md | Full methodology missing |
| udu | UDU-METHODOLOGY.pdf 1,653,772, .txt 142,947, .index.tsv 1,389, UDU_PROCEDURE.md 6,490, README.md | Nine corpus files missing |

suj_engine

| File | Size in bytes |
|---|---|
| ENGINE_CONTRACT.md | 11,347 |
| METHODOLOGY.md | 42,032 |
| ANSWER_TEMPLATE.md | 4,540 |
| LEARNINGS.md | 26,949 |
| STATUS.md | 22,594 |
| tools | answer_guard.js, prepare.js, stellium.js, planet_strength.js, strength_tally.js, window_scan.js, functional_nature.js, rules_lookup.js, event_rank.js, degree_capacity.js, score_hypotheses.js, z_report.js, cases_report.js, hypotheses.js, engine_config.js, vednetra_loader.js |
| data and rules | data/topics.json with the keys career, marriage_male, marriage_female, children, education, father, mother, siblings, health, wealth, property, foreign, rules/rules_index.json with 1,561 rules |

Sibling repository KP-Pro-sutton, knowledge folder

| Path | Notes |
|---|---|
| kp_pro/KP-PROJECT-INSTRUCTIONS-v15.md 46,869 bytes | v15 instructions, Rule of 10 mechanics |
| kp_pro/docs KP-1 to KP-11 and KP-13 files | KP-12, KP-14, KP-15 not present |
| kcil/KCIL-CUSTOM-INSTRUCTIONS-v2.6.md 105,206 bytes | v2.6 instructions with sections 16 to 18 |
| kcil KCIL-1 to KCIL-9 | KCIL-10 is in kcil/claude |
| src, kpredict | The chart caster, installed in a virtualenv |

Sibling repository CHAWDHRI. engine, engine/knowledge about 5.5 MB, docs/AUTHOR_METHOD.md, COMPLEMENT.md, SUTTON.md, jyotish.sh, .claude/skills/vedic-engine/SKILL.md.

## APPENDIX C. COMMAND SHEET

    # session start
    node sarva_engine/tools/sarva_preflight.js

    # KP Pro and KCIL chart numbers
    cd ../KP-Pro-sutton && python3 -m venv /tmp/kpvenv && /tmp/kpvenv/bin/pip install -e .
    kpredict read --name N --sex M|F --date YYYY-MM-DD --time HH:MM:SS --lat LAT --lon LON --tz TZ --today AS_OF --events EVENT_CODES --windows

    # KCIL chart
    node ~/.claude/skills/synced/*/vednetra-kcil/scripts/run_kcil_report.js ...

    # SUJ
    node suj_engine/tools/prepare.js '{"name":"N","gender":"male","date":"YYYY-MM-DD","time":"HH:MM:SS","tz":5.5,"lat":0,"lon":0,"topic":"TOPIC"}'
    node suj_engine/tools/planet_strength.js '{...,"candidates":["Venus","Saturn"],"asOf":"AS_OF"}'
    node suj_engine/tools/strength_tally.js '{...,"kind":"ordered","options":["Low","High"],"evidence":[...]}'
    node suj_engine/tools/answer_guard.js answer.txt --options "A|B|C"

    # CHAWDHRI
    cd ../CHAWDHRI && sh jyotish.sh --date YYYY-MM-DD --time HH:MM --lat LAT --lon LON --tz TZ --gender male|female --now AS_OF --topics TOPICS --question "..."

    # BNN
    node ~/.claude/skills/synced/*/vednetra-bnn/scripts/run_bnn_export.js '{"name":"N","sex":"male","date":"YYYY-MM-DD","time":"HH:MM:SS","tz":5.5,"lat":0,"lon":0,"question":"...","enquiryDate":"AS_OF","outFile":"bnn_export.md"}'
    node sarva_engine/tools/bnn_rules.js --method
    node sarva_engine/tools/bnn_rules.js '{"event":"marriage","q":"Venus","limit":15}'
    node sarva_engine/tools/bnn_rules.js '{"id":"RAO-FND-009"}'

    # Udu chart, always with outFile
    node ~/.claude/skills/synced/*/vednetra-ududaya/scripts/run_ududaya_export.js '{"outFile":"/tmp/udu_report.md","name":"N","gender":"male","date":"YYYY-MM-DD","time":"HH:MM:SS","tz":5.5,"lat":0,"lon":0,"place":"P"}'

    # Quad Dasha
    node ~/.claude/skills/synced/*/vednetra-quad/scripts/run_quad_dasha.js --selftest
    node ~/.claude/skills/synced/*/vednetra-quad/scripts/run_quad_dasha.js '{"name":"N","date":"YYYY-MM-DD","time":"HH:MM","tz":5.5,"lat":0,"lon":0,"asOf":"AS_OF"}'

    # guard
    node sarva_engine/tools/sarva_guard.js reply.txt
    node sarva_engine/tests/guard_test.js

Never run the kpredict ask command for a KP Pro or KCIL cell, R17. Never use the ensemble choice.

## APPENDIX D. PATTERNS USED BY THE GUARD

| Purpose | Pattern |
|---|---|
| Methodology codes | KPPRO, KCIL, SUJ, CHAWDHRI, BNN, UDU, QUAD |
| OPTIONS line | ^OPTIONS (Q\d+) (.+)$ |
| METHOD line | ^METHOD (\S+) (Q\d+)$ |
| RESULT line | ^RESULT (Q\d+) (\S+) (.+)$ |
| EVIDENCE line | ^EVIDENCE (Q\d+) (\S+) (.+)$ |
| SUJ FILE line | ^SUJ FILE (Q\d+) (.+)$ |
| BNN Rule ID | \b[A-Z]{3}-[A-Z0-9]{3}-\d{3}\b |
| BNN grade | \b(CONFIRMED, INDICATED, POSSIBLE, OPEN, DENIED)\b |
| Udu Rule ID | \b[A-Z]{3}(-[A-Z0-9])?-\d{4}\b |
| Quad words | \b(COMPUTED, CLASSICAL, UNSTABLE, VACUOUS)\b |
| KCIL mark | \b(STABLE, TWO CANDIDATES, NO RULE REGISTER)\b |
| KP confidence | \b(HIGH, MEDIUM, LOW)\b |
| KP basis | \b(CHART DECIDED, PRIOR DOMINANT, R10 DECIDED)\b |
| Hedging in an OPEN result | \b(cannot, can't, unable, undecided, undetermined, equal, tie, either, neither)\b, the word or, or a slash |
| Banned characters in the reply | any of ( ) ; : — “ ” ‘ ’ ! # * ~ / and a hyphen with spaces around it |
| Not run texts | NOT RUN BNN RULES MISSING, NOT RUN UDU RULES MISSING, NOT RUN QUAD RULES MISSING |

In the alternation rows above the separators are written as commas for readability. In code they are the vertical bar.

## APPENDIX E. HOW SARVA RECONCILES THE SOURCE DOCUMENTS WITH THE CONTRACT

| Methodology | The source says | SARVA does | Where the EVIDENCE line says it |
|---|---|---|---|
| KP Pro | A computed prior starts the reading and decides when the chart is UNDECIDED | Allows the prior only for KP Pro, only in UNDECIDED, labelled PRIOR DOMINANT. The ban on priors holds for the other six and for the ask default | basis word |
| KP Pro | Hindi final answer in three time groups | Cell is the first group, the stated birth time, differences at plus and minus 5 minutes go in the line | the line |
| KP Pro | R10 comparison with Chawdhri and Sutton | NOT RUN, R7 | not needed |
| KCIL | Two candidates, never merged | The cell is the candidate preferred by section 16.30, the other is named | TWO CANDIDATES |
| KCIL | No rule register, declare it | The cell is the option the nearest real rule supports, rule named | NO RULE REGISTER |
| BNN | One or two ranked answers | Rank 1 only | the grade |
| BNN | Ladder tie prints both options | The forced pick of 6.5, marked | LADDER TIE FORCED PICK |
| BNN | Side table versus Chawdhri and Sutton | NOT RUN, R7 | not needed |
| Udu | Bands include mixed and difficult | Still one option, the highest weighted sum, band named | band |
| Udu | No disclaimer paragraph | Holds inside the Udu block, the single LIMITS line states honest limits once | not needed |
| Quad | Chara, Kaal Chakra, Yogini as stand alone systems | They run only inside the Quad column | systems named |
| CHAWDHRI | Sutton block as a second opinion | The cell is the Chawdhri answer, Sutton is reported inside and is not the cell | the line |
| SUJ | Strict window scan and prepare.js are candidates only | The tally decides, the windows inform status | the line |

End of document.
