# Udu corpus and KN corpus installed on 18 November 2026

Source, the owner's zip UKN-RULES-BY-LIFE-EVENT, 36 files. INDEX.md is the owner's index and is kept as supplied.

## What is here
- 21 files UDU-*.md, 16,008 UDU rules grouped by life event, from 7 books, AVA-2 5,702, RBS-1 2,661, RBS-2 2,206, ASH 2,037, TAM-RA 1,091, TRI 1,331, NAT 980. Every rule has an id, a placement, a source page, polarity and confidence, an IF line and a THEN line.
- 12 files KN-E01 to KN-E12 and KN-MACHINERY.md, the KN corpus of 1,006 rules, the clock. 610 rules are the universal machinery of 20 books, the rest are listed under twelve life event protocols.

## How it differs from the Udu document
The Udu document of 16 November 2026 describes 11,683 rules in nine files named UDU-vivah-sambandh and so on. This corpus has 16,008 rules in 21 files by life event, so the document counts are out of date. The nine routes of the document map to these files, see ROUTES in tools/udu_rules.js.
vivah-sambandh to marriage, relations, matching. karya-dhan to career, wealth, property. arogya-ayu to health, body, longevity. vidya-swabhav to nature, education. santan-parivar to progeny, family. dharma-upay to dharma, remedy. samay-muhurat to timing, muhurta. yatra-shatru to travel, enemies. mool-tattva to core.
The rule weights are the document's, section 11 and INDEX.md. The check node sarva_engine/tools/udu_rules.js --check confirms the counts of INDEX.md.

## Rules of the corpus that bind
1. A zero or thin count is a hole in the books and not an astrological silence. 25 of the 567 nakshatra by category cells are empty. travel 175, matching 191, property 194 and mundane 61 are the thinnest files.
2. A UDU rule may never be cited for a timing claim. A KN rule may never be cited for a nakshatra content claim. The Udu column therefore cites no UDU rule for the period test.
3. Five KN books are defective, B06 badhaka table page 58, B10 four Yogini lords wrong, B15 tara table and balance formula, B18 Ashtottari balance, B24 machine paraphrased and never quoted.
4. ASH carries no genuine Venus in Dhanishta content. NAT has no Ashlesha Ayurveda section.

## Not supplied, named in INDEX.md
UDU-REF-coverage.md and the other REF files, UKN-04 the protocols E01 to E12 that say which KN rule governs each life area, UKN-05 with its part C on the defective books. Without UKN-04 and UKN-05 the KN corpus is stored and searchable with udu_rules.js --kn but is not applied. The Udu column does its period test with the computed Vimshottari and adds no weight.
The KN machinery holds the methods of 20 books, among them KP style rules such as B02. Those rules stay in this folder and are not read by the KP Pro or KCIL columns.
