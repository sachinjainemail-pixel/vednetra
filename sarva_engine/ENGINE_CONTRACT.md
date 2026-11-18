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
3. A chosen option rests on counted chart evidence. Typicality, base rates, cohort priors and the safe choice are not evidence,
   with one exception. The KP Pro method itself defines a computed prior and lets the chart decide when the significator NET
   band is STRONG, PRESENT or ABSENT, see 7d. Only there may the prior decide, and the EVIDENCE line then says PRIOR DOMINANT.
   The kpredict ask command at its default setting returns the cohort prior because the measured chart weight is 0, so the chart
   never enters it. That output is never a KP Pro or KCIL cell. Use the per method opinion of the read command and the
   methodology's own rules.
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
   reply as incomplete. Never fill the Udu cell from memory. Superseded in part by section 13, while the corpus is absent the Udu cell comes from the provisional promise layer, marked PROVISIONAL, and NOT RUN is the fallback only.

## 7c. Quad Dasha, rules and method

Sources sarva_engine/knowledge/quad/QUAD-METHODOLOGY-INTRO.pdf (section 1 only), QUAD-REPORT-CONTRACT.md and the English map
QUAD_PROCEDURE.md.
1. Chart and all four dasha systems come from the vednetra-quad runner after its self test prints RESULT READY, with asOf set
   to the date the question is about. That is the validated COMPUTE layer.
2. The READ rules of Chara, Kaal Chakra, Yogini and Laghu Parashari, and the Rule of 10 option test, are in sections 3 to 19 of
   the Quad methodology file, which has not been supplied. The guard treats the Quad rules as present only when
   sarva_engine/knowledge/quad/QUAD-FULL-METHODOLOGY.pdf, .txt or .md exists. Until then the Quad cell is the exact text
   NOT RUN QUAD RULES MISSING and the reply is reported as incomplete. Superseded in part by section 13, the Quad cell comes from the provisional promise layer, marked PROVISIONAL, and NOT RUN is the fallback only.
3. When the file is present the report contract binds. The levels licensed, the stability gate, the four confidence words
   COMPUTED, CLASSICAL, UNSTABLE and VACUOUS in the EVIDENCE line, no death dating, no claim of a validated hit rate.
   The cell is the option the Rule of 10 ranks first.

## 7d. KP Pro, rules and method

The KP Pro column follows the owner's KP Pro v15 booklet, sarva_engine/knowledge/kppro/KP-PRO-METHODOLOGY.docx with its text, section
index and the English map KP_PRO_PROCEDURE.md. The booklet wins on any difference. The rule files are in the sibling repo.
1. Authority order of booklet section 3, the eight run preflight and the eight box gate of section 4, the thirteen fixed settings of
   section 5, the prior and the four bands of section 8, the stability tier and admissibility of section 9, the KP 11 version 4
   promise gate of section 10, significators and NET of section 11, fructification and transit of sections 19 and 20, the Rule of 10
   with its arbitration of section 17, and the 17 mandatory rules of section 28.
2. The KP Pro cell is the answer for the stated birth time. Differences at plus and minus 5 minutes go in the EVIDENCE line.
3. The KP Pro EVIDENCE line carries a confidence word HIGH, MEDIUM or LOW and a basis word CHART DECIDED, PRIOR DOMINANT or R10 DECIDED.
   The guard checks both while the booklet is installed.
4. Cusp sub lords of houses 2, 3, 5, 6, 8, 9, 11 and 12 from the VedNetra KP report are checked against true Placidus from kpredict,
   and a difference is named as a declared conflict.
5. The Rule of 10 comparison with Chawdhri and Sutton is NOT RUN because no methodology reads another's verdict. The Sutton layer
   inside KP Pro runs.
6. Natal questions only. Horary needs a judgment moment and is outside SARVA.
7. Honest record from the booklet, the owner's ledger of 122 questions, version 14 at 47.5 percent with 41 to 45 expected on unseen
   charts, the chart adding nothing over the prior for marital status, siblings, residence and parents, Rule of 10 unmeasured.

## 7e. KCIL, rules and method

The KCIL column follows the owner's KCIL v2.6 summary, sarva_engine/knowledge/kcil/KCIL-METHODOLOGY-V2.6.pdf with its text, part index
and the English map KCIL_PROCEDURE.md. The summary wins on any difference. The rule files and the v2.6 instructions with sections 16,
17 and 18 are in the sibling repo.
1. The chart is cast on the seven fixed settings, Khullar ayanamsa by formula with zero year 292, Placidus, geocentric latitude, true
   nodes, nutation applied, depth to Prana, longitude to the second. The chart validity check is step zero. A KP report or a VedNetra
   Lahiri chart is never a KCIL chart. Gender is mandatory. The KCIL chart casts with the vednetra-kcil runner or the kcil method of
   kpredict.
2. KCIL is a closed system. No retrograde, combustion, aspects, strength, yogas, divisional charts, Ashtakavarga, no almanac, festival
   or news, no KP rules, no Uranus Neptune or Pluto.
3. The order is rectification before any verdict, the three promise gates of the Ascendant, the main cusp and the 11th, the descending
   permission ladder Dasa Bhukti Antara Sookshma Prana, with transit and progression, the competitive scoring of options, the Rule of
   10 layers written before the chart, and the locks of sections 16 and 17. A failed gate is an answer.
4. The KCIL EVIDENCE line carries one of STABLE, TWO CANDIDATES or NO RULE REGISTER. For TWO CANDIDATES it names the sub sub lord that
   flips and the seconds, and the cell is the candidate preferred by the KCIL closing rule of section 16.30, the lower grade, the smaller
   count, the event not yet occurred, the person still alive. For NO RULE REGISTER, height, graded build, religion, a named city, a
   child's sex and a relative's life span, the cell is the option the nearest real rule supports and the line names that rule. The
   guard checks the mark while the summary is installed.
5. Horary is outside SARVA. Rectification is inside it.
6. Honest record, version 2.4 scored 27.6 percent on 123 questions, equal to always choosing option 1, determinate answers 44.4
   percent and non determinate 33.3, the expected rate on a quiz chart to the minute 2 to 3 of 6, the Rule of 10 unmeasured.

## 8. Inputs the engine needs

Native name, gender (mandatory, BNN and KCIL both depend on it), date of birth, time of birth with seconds if
known and how sure the time is, place of birth with latitude, longitude and the time zone in force on that date,
and the questions with their options. The as-of date is the system date. If birth data is missing, ask in one
short message and then proceed. Unknown places are never guessed.

## 9. Guard

Write the draft reply to a file and run node sarva_engine/tools/sarva_guard.js on it before sending. The SUJ
part of each question is also checked by suj_engine/tools/answer_guard.js, which the SARVA guard runs when the
SUJ answer file is named. See ANSWER_TEMPLATE.md.

## 10. Standing gaps, the final design on the material supplied

Section 13 of 17 November 2026 replaces the NOT RUN cells of points 2 and 3 below with provisional promise layer cells. The gaps themselves still stand, the corpus and the READ rules are still not supplied.

On 16 November 2026 the owner stated that no further files will be shared and asked for the engine to be finalized on what was
supplied. The standing design is therefore this.
1. Five columns run on complete rules, KP Pro, KCIL, SUJ engine, CHAWDHRI and BNN.
2. Udu and Quad Dasha stay in the table as columns. Their rule files, the nine Udu corpus files and the full Quad Dasha methodology,
   were not supplied. Each cell reads exactly NOT RUN UDU RULES MISSING or NOT RUN QUAD RULES MISSING. This is a standing state and
   not an error. The engine never fills those cells from memory or from general astrology, because the Udu method itself forbids
   answering without its corpus and the Quad contract allows only claims that name a rule.
3. A complete SARVA reply therefore ends with the guard exit code 3, valid but incomplete, until those files are added. The LIMITS
   line of the reply says which two columns are not run.
4. If the owner later supplies the files, they go in sarva_engine/knowledge/udu and knowledge/quad under the names in those folders'
   README.md files, and the guard and preflight switch the columns to full runs on their own. If the owner prefers to drop the two
   columns, that is a change to sections 1 and 4 and to the guard, made on the owner's instruction.
5. Run node sarva_engine/tools/sarva_preflight.js at the start of every SARVA session.

## 11. Persistence

These requirements are stored in the repository and loaded through CLAUDE.md. They hold in this session and in
every new session. They change only when the owner changes them, and STATUS.md records each change.

## 12. The signification lexicon

Added on 17 November 2026 on the owner's instruction, after the first scored chart. Files in sarva_engine/knowledge/lexicon, tool sarva_engine/tools/sarva_lexicon.js.
1. What it is. A dictionary of 255 entries in six categories, medical degrees and specialities, professions, businesses, diseases, sources of income, relationships and relatives,
   with the 202 KP PRO MAX cards, the KCIL event matrix and TA tables, and a search of the BNN rule base. It turns an option into houses, planets, signs, cards and cusps.
2. What it is not. It is not an eighth methodology and not a ninth column. It gives no verdict, no vote and no tie break. Section 1 and section 4 are unchanged.
3. When to run it. At the start of every question whose options or text name a speciality, degree, profession, business, disease, source of income, or a relative or family matter.
   Run node sarva_engine/tools/sarva_lexicon.js --options "texts" --family, and write one line LEXICON Qn with the entry ids, or LEXICON Qn NONE. The guard warns when the line is missing.
4. Isolation, extends section 5. A column cites only the T1 sentences of its own corpus. KP Pro cites KP sentences and cards, KCIL cites KCIL, BNN cites rule ids it has read, CHAWDHRI and SUJ cite their own.
   Use --column so that the tool prints only that column's corpus text. A KP sentence is never read by KCIL and the reverse. T3 web claims and T4 karaka lists are hints, they translate an option into houses and may never appear as the cited evidence of a cell.
5. No silent nearest. An option with NO ENTRY is not given the nearest planet. A PARTIAL MATCH is checked for the words that did not match. BNN grades an option its register does not name OPEN.
6. Symmetry. Every option gets the same kind of entries and the same kind of counter entries. A column must not prefer an option because its lexicon entry is longer, and the tally must not read a gap in entries as evidence.
   A tally gives 100 to an option with a single planet and no counter entry, which is an artefact, see SUJ LEARNINGS case 5.
7. Capacity is not status. A natal signature of a profession, a relative or an event shows capacity. For a present status, read what the person does now, the running periods and the facts of the question.
8. Recipes. recipes.json holds one recipe per question family and column, taken from the owner corpora, with the pitfalls the scored chart showed. A recipe does not decide.
9. Growth. Add lines to the DSL files and rebuild, see the README in the lexicon folder. No entry, weight or recipe is changed because of one chart. Record the chart in the case registry first.
10. Honest record. The lexicon has not been shown to raise accuracy. Its coverage is 255 entries and the 202 cards, not every type that exists. The web sources were read as search summaries only, because no page could be fetched.

## 13. Promise layers for Udu and Quad Dasha, all seven columns fire

Added on 17 November 2026 on the owner's instruction, after the first scored chart, so that Udu and Quad Dasha answer every question like the other five.
1. Why they were blank. Udu answers only from its 11,683 rule corpus and forbids a fabricated rule. Quad answers only by its READ rules of sections 3 to 19 and its report contract. Neither file set was supplied, so sections 7b and 7c required NOT RUN.
2. What was built. sarva_engine/tools/promise_layer.js. It casts the chart through VedNetra and the Quad compute layer and fires both columns together for every question, in the template format.
   Udu promise layer. Rules SARVA-UDU-P-U1 to U6, F1, F2 and P1. They follow the Udu frame, nakshatra and pada reading, the weighing of section 11 of the Udu document, polarity times confidence times specificity, confidence fixed at inferred 0.7, the Law 3 gate of promise and delivery, the pada rule first on a tie.
   Quad promise layer. Ten layers SARVA-QUAD-P-L1 to L10 fixed before the chart, six from the chart and Jaimini rashi aspects, four from the Vimshottari, Yogini, Chara and Kaal Chakra periods, ranked by the layers satisfied, the Rule of 10. The stability gate at plus and minus 5 and 15 minutes withdraws an unstable system for every option.
   A layer that is true or false for every option is VACUOUS and is not counted. An option without a lexicon entry prints NO ENTRY.
3. What it is not. It is not the Udu corpus and not the Quad READ rules. It is authored by the engine author. It cites no Udu rule id and invents none, the Udu document calls a fabricated rule the one real failure. Its rule ids are SARVA-UDU-P and SARVA-QUAD-P.
4. Marking. While the corpus or the READ rules are absent, an option cell of Udu or Quad must say PROVISIONAL in its EVIDENCE line and name the SARVA-UDU-P rules or the SARVA-QUAD-P layers. Quad also carries COMPUTED, UNSTABLE or VACUOUS. The Udu EVIDENCE line says that no accuracy has been measured, the Quad line that no hit rate is validated.
   The guard enforces this and rejects a Udu rule id in a provisional Udu cell. The guard reports a NOTE naming the provisional columns and exits 0. Exit code 3 now means a cell fell back to NOT RUN, which stays legal when the layer cannot run, for example with no birth time.
5. Switch back. When the nine Udu files or the Quad READ rules are placed in their folders, the guard treats the source as present, the older rules of 7b and 7c apply, and a provisional cell is an error. Then the corpus rules replace the layer.
6. Isolation holds. The layers read the chart and the lexicon T4 houses and planets only. They read no verdict of another column and no KP, KCIL, BNN, CHAWDHRI or SUJ corpus text. The sex of the planets and the Jaimini karakas are classical facts and not a column rule.
7. Honest record. The layers were authored after the K894 chart was scored and have not been scored on any chart. The Quad READ rules the owner has recorded tested at chance. Expect the same of this layer until a chart proves otherwise. The parents handler is the weakest, a damage and delivering period rule of the kind that called four living parents gone in the owner's BNN backtest, and its cells carry the words WEAK HANDLER.
   The count handler for sons, daughters, brothers and sisters rests on no validated count rule in any column. No weight or rule of any column was changed.

## 14. The Udu corpus installed, 18 November 2026

The owner supplied the Udu corpus, as the zip UKN-RULES-BY-LIFE-EVENT. It is installed in sarva_engine/knowledge/udu/ukn, see the README there. It replaces the provisional Udu layer of section 13 for the Udu column. Section 13 stays in force for Quad Dasha, and for Udu only as the fallback when the corpus is absent.
1. What it is. 16,008 UDU rules in 21 life event files, and the KN timing corpus of 1,006 rules in 13 files. The Udu document counted 11,683 rules in nine files, so its counts and file names are out of date, the routes of the document map onto the new files, see the README.
2. Presence. The guard treats the Udu source as present when the nine files of the document exist or when the 21 files and INDEX.md exist in udu/ukn. With the source present, a Udu cell that says NOT RUN, or that says PROVISIONAL and cites no Udu rule id, is an error. The EVIDENCE line must cite at least one Udu rule id, such as AVA-2-2753 or TAM-RA-0257, and say that no accuracy has been measured for Udu.
3. How the column runs. node sarva_engine/tools/promise_layer.js, with the corpus lookup udu_rules.js and the reading engine udu_engine.js. It routes the question to the life event files, reads the Moon nakshatra rules and the rules of the graha that carry the option houses, fires a rule only when its placement matches the chart and every testable condition of its IF line is true, and weighs by polarity times confidence times specificity, mixed rules 0.
   The sex of the native is tested, a sign named in a rule is tested, and a pada rule overrules a house or sign rule of the opposite polarity, the overruled rule being named. A rule with a condition the program cannot test is not summed, it is counted as nearly fired and left out, and the count is printed.
4. Choice of the cell, a SARVA reconciliation, the Udu document gives bands and no option choice. The cell is the option with the highest sum of direct rules, rules whose IF or THEN line names the option. Where no option has a direct sum, the option with the highest sum of link rules, rules of a graha of the option that name the option's field. A tie goes to the pada level rule, then to the first listed of the tied options and the EVIDENCE line says TIE FORCED PICK.
   For parents, a parent is called gone only by a malefic rule that names death or loss without an alternative, and when no such rule fires for either parent Law 3 reads no promise of loss and the cell is the option with most parents alive.
5. Limits, stated in the EVIDENCE line and in the reply. The Udu document asks that every rule is read to its last word. The program cannot read free text conditions, so rules with such conditions are left out, about 30 per question. The option keywords are matched by word stems and a reader must check the printed THEN lines. Few rules name a medical speciality or a count of children, so many questions end in a forced tie.
   The corpus gives the promise and no timing. UKN-04 and UKN-05, which assign the KN rules to the life areas, were not supplied, so the KN corpus is stored and not applied. No UDU rule is cited for a timing claim and no KN rule for a nakshatra claim.
6. Isolation holds. Udu reads the chart and the lexicon T4 houses, planets and option words only. It reads no verdict of another column. The KN machinery holds KP style books and is not read by KP Pro or KCIL.
7. Honest record. No accuracy has been measured for Udu. The reading engine was written after the K894 chart was scored. Nothing was retuned to that chart.

