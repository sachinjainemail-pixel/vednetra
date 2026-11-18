# Quad Dasha full methodology, English map

Source. QUAD-FULL-METHODOLOGY.pdf and QUAD-FULL-METHODOLOGY.txt in this folder. 86 pages, Hindi, titled the full detailed Quad Dasha methodology file, dated 15 November 2026,
installed on 18 November 2026 on the owner's upload. The text file is a layout extraction of the pdf, so some Devanagari conjuncts are split, read the pdf when a word looks broken.
This map is written by the SARVA engine author. It is a guide and it is not the source. Where the map and the file differ, the file binds.

## Sections of the file

| Section | Subject | Where it lives in the SARVA build |
|---|---|---|
| 1 | The project, three layers COMPUTE, READ and OPTION TEST, and the reading guide | ENGINE_CONTRACT.md 7c and 15 |
| 2 | When to run, quiz format 6B, missing birth time, when the Rule of 10 does not run | METHOD_ROUTING.md 7 |
| 3 | Casting protocol, time zone table, stability gate rules 1 to 6, levels licensed, round birth times | quad-dasha.js through promise_layer.js cast(), quad_engine.js |
| 4 | The seven fixed computation corrections, four literature errors | the compute layer, quad-dasha.js, selftest 8 of 8 |
| 5 | The four dasha engines, how they are computed | the compute layer |
| 6 | Vimshottari and Laghu Parashari, rules 1 to 12 | quad_rules.json rows with evaluators vim_* |
| 7 | Chara, K.N. Rao, rules 1 to 10 | rows ch_* |
| 8 | Kaal Chakra, Shakti Mohan Singh, rules 1 to 14 | rows kc_* |
| 9 | Yogini, Goel, and the six shared agreements of the four systems | rows yg_* |
| 9A | The rule list by life event, base rates and labels, the quick lookup table | quad_rules.json, 88 rows |
| 10 | Evidence and base rates, the 52 rule tests, the base rate table, lift table, birth time robustness | the labels VACUOUS and CLASSICAL, README |
| 11 | The honesty contract, the six labels, eight conduct rules | the guard, the evidence line |
| 12 | Output contract for dated questions, sections A to F, ranking rules E2.1 to E2.11 | NOT BUILT, see below |
| 13 | The Rule of 10, 13.1 to 13.8, fixed parameters | quad_engine.js, FIXED and SCALE |
| 14 | Output contract 6B for the static quiz, rules S1 to S12, sections A to F, seven sub rules of S12 | quad_engine.js runQuadColumn, the guard |
| 15 | Eleven standing rules, the scoring of a known answer | ENGINE_CONTRACT.md 15 |
| 16 | The fifteen step procedure, one worked example (entry 2), the table of errors | routing |
| 17 | The 137 question benchmark | README |
| 18 | The miss register and the Rule of 10 register 9B | sarva_engine/knowledge/quad/REGISTER-9B.md |
| 19 | Files, setup, the seven fixed corrections again | routing |
| 20 | Glossary | this map |
| 21 | Final summary | this map |

## The measured record, as the file states it

COMPUTE is validated, the engine self test passes 8 of 8 and the chart and the period identification were right in all five recorded entries.
READ is not validated. 52 pre registered rule tests on 18 charts gave mean lift 0.960, median 0.991, smallest p 0.110. The best real rule reached lift 1.54, inside the range of 400 random rules, whose median was 0.987 and maximum 1.690.
The 137 question outside quiz on 22 charts, answered by agents with the chart and the rules and without the answer key. The chart method scored 71 right, 51.8 percent.
The control, given only sex, age and country and no chart, scored 62, 45.3 percent. The gap is 9 questions, 6.6 points, McNemar p 0.211, not significant. First or second choice 75.2 percent. Random 24.6 percent.
The Rule of 10 has no outside record. It has one origin case, a chosen success that is not evidence. The register 9B has no scored entry. Its status is CLASSICAL and unvalidated.
The file forbids any claim of a validated hit rate and any claim that the Rule of 10 raises accuracy.

## The Rule of 10, section 13, as built

1. Every option is broken into exactly 10 layers before the chart is read. A layer is a precondition the native must meet for the option to be true. It names at most 5 houses and at most 3 karakas, one of them of the option's subject, a direction, support or afflict, and the tests that judge it, from condition, combination, yoga, dictum, signification, nakshatra, dasha, transit, at least one reading beyond the house.
2. A layer is scored in three parts. Natal, 0.7 of the houses and 0.3 of the karakas, with each karaka read with its nakshatra lord and a natural signification link. Dasha at half weight, the running Vimshottari MD, AD and PD with weights 0.25, 0.35 and 0.40, a strong link with a weak lord counts against the layer. Transit at quarter weight, Jupiter and Saturn over the layer houses, and for an afflict layer Saturn with Mars, Rahu or Ketu.
3. A support layer is satisfied at 1.1 and an afflict layer at 0.6. A satisfied layer earns 1 point, up to 0.3 more for strong planets and up to 0.2 for rajayoga, 1.5 at most per layer, no rajayoga point on an afflict layer.
4. The leader is the option with the most satisfied layers. A tie goes to planet strength and then to rajayoga and to nothing else. A lead under 2.0 points is NARROW. Dasha activation, the board of the four systems and the Sutton score stand beside the leader as agree, conflict or does not separate, and they never re rank.
5. The numeric scale of the house state, the karaka strength, the natural signification link and the dictum polarity is left to the hand by the file. It is fixed once in quad_engine.js SCALE, version SARVA-R10-SCALE-1, and every number is labelled HAND ARITHMETIC.

## What the SARVA build does not do

- Section 12 and the ranking rules E2.1 to E2.11 for dated questions, the candidate MD AD PD window table with the 3 of N prior. The SARVA engine answers option questions. A when question gets the board and the running periods and the owner is told that the window table is not built.
- Rao's child birth date method and sibling birth date method on D3, Gulika chain for the date of death, Yogini in the divisional charts and the double transit ladder. They need other charts or are VACUOUS. Their rows are in quad_rules.json without an evaluator and are listed as not run.
- D4, D10, D16, D20 and D24. The compute layer has D3, D7 and D9. The field relations of Kaal Chakra that need another varga are read on D1 and the missing varga is printed, HAND ARITHMETIC.
- The Sutton score and the VedNetra windows of the Rule of 10 agreement line. They are printed as not available in this run.
- Population estimates. The file asks for a population estimate beside every question, S1. The build has tables for the parents, the siblings and the children only. They are analyst memory, tier T4, and not from the file. For other questions the analyst writes the estimate in the reply, HAND ARITHMETIC.
