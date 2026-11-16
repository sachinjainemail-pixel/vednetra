# BNN rule base for the SARVA engine

File BNN-RULES-5COLUMN.csv, 3,073 rules, UTF-8 with BOM, supplied by the owner. The owner also supplied the same
table as an xlsx with a Rules sheet and a Summary sheet. The two were compared row by row and are identical except
for one control character in NEG-DIC-157. Only the csv is stored here.

Columns. Rule description, Related life event, Exact rule, Effect of the rule, Combination of the rule, Rule ID,
Source book.

Coverage. 21 source books. The largest are Saket Shah 1000 Predictive Techniques with 1,001 rules, Negandhi
Nadi Astrology with 740, Rao Bhrigu Nandi Nadi with 353, Rao Transit of Planets with 294, Rao Fortune Telling
with 240 and Arumugam BNN Astrology with 150. Sixteen life event groups, with 638 rules filed as General method.

Where the method lives. The General method rules carry the reading procedure. Start with RAO-FND (the karaka is
the reference point, the Lagna is not primary, houses are counted from a planet), ARI-GRM (aspect strength table,
isolation, retrogression, combustion, exchange, central and key planet, the ten rules), ARI-TIM (transits as the
timer, the four triggers, two transits must agree, one degree one year), RAO-DOM (karakas by sex), RAO-JTC and
NAI-FRM. Use node sarva_engine/tools/bnn_rules.js --method to print them.

Known data issues, left as supplied.
1. NEG-DIC-157 reads heaWZ with a stray control character, a corrupted word in the source. The loader strips the
   control character and the word stays as supplied.
2. ARI-CON-001 has a stray character in the phrase given a geometry. No effect on meaning.
3. 344 rules have Effect of the rule identical to Exact rule, the source gave no separate effect.
4. The table holds rules from authors who disagree, for example the female marriage karaka, Jupiter in ARI-GRM-022,
   Mars in ARI-GRM-027 and RAO-DOM-001. Read the later rule that says it settles the point, cite both, and decide
   on the chart.
5. Some rules are notes written against an earlier engine, they begin EXTENDS or CONFIRMS. They are still rules of
   the source book, read the quoted passage.

The procedure. BNN-METHOD-GUIDE.pdf is the owner's 54 page guide to the BNN project method, with BNN-METHOD-GUIDE.txt
as its extracted text and BNN-METHOD-GUIDE.index.tsv as a heading index with line numbers. BNN_PROCEDURE.md is the English
map. All 123 rule IDs the guide cites were checked against the csv and all exist.

What the chart export runner does. The chart export runner of the vednetra-bnn skill supplies the chart numbers. This file is the
rule base and not a worked procedure document. If the owner has a separate step by step BNN procedure beyond the
General method rules, it should be added next to this file.
