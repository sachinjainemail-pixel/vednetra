> Written on 17 November 2026 from the two page intro and the report contract. The full methodology was installed on 18 November 2026, see QUAD-RULES-MAP.md and ENGINE_CONTRACT.md section 15. Where this summary differs from the full file, the full file binds. The section that says the Rule of 10 text was not supplied is out of date, the Rule of 10 is section 13 of the full file.

# Quad Dasha procedure for the SARVA engine

Sources in this folder. QUAD-METHODOLOGY-INTRO.pdf, a 2 page file titled the full detailed Quad Dasha methodology file, dated
15 November 2026, which holds only section 1 and the reading guide and not the sections it points to. QUAD-REPORT-CONTRACT.md,
the contract of the Quad Dasha report export, copied from the owner's vednetra-quad skill. This summary is mine.

## What Quad Dasha is

A four system dasha engine. Vimshottari, 120 years, nakshatra based, from BPHS chapters 46 and 51 with Laghu Parashari. Chara,
Jaimini, rashi based, from K.N. Rao. Kaal Chakra, 83 to 100 years, rashi based, BPHS 46, 51 and 64 and Shakti Mohan Singh.
Yogini, 36 years, nakshatra based, BPHS 46 and V.P. Goel. Three jobs, always kept apart.
1 COMPUTE, the chart and all four dashas. Validated, 8 of 8 self tests, 27 of 27 BPHS chapter 64 antardasha cells, 53 of 54 Rao
Chara sequences.
2 READ, the interpretive rules of each school. Not validated. 52 pre registered rule tests came out at chance, mean lift 0.960,
and on a 137 question outside quiz the lead over a no chart control was 6.6 points, p 0.21.
3 OPTION TEST, the Rule of 10, every option broken into exactly 10 layers written before the chart is read. Mandatory, unvalidated.

## Running it

Chart and dashas. The vednetra-quad skill runner scripts/run_quad_dasha.js with the engine self test first, it must print RESULT:
READY, and asOf set to the date the question is about. Birth time is needed. Without it read only the Chara section. The repo file
quad-dasha.js and tools/quad-dasha-selftest.js are the same computation. Do not use VedNetra's own Char Dasha or Yogini cards.

Discipline from QUAD-REPORT-CONTRACT.md that holds for every Quad cell.
1. Levels licensed. Vimshottari mahadasha and antardasha yes. Pratyantar only with a minute accurate birth time. Chara dasha yes, and
   the only level usable with no birth time. Kaal Chakra dasha yes with the stability flag. Kaal Chakra bhukti never. Yogini dasha yes.
2. The stability gate is not advisory. A system that shifts inside the plausible birth time error has its claim withdrawn in
   writing as UNSTABLE.
3. The four confidence words are COMPUTED, CLASSICAL, UNSTABLE and VACUOUS, used exactly. Quote the base rate whenever a rule fires.
4. Never date a death. Grave questions are not refused.
5. Never claim a validated hit rate for any of the four systems.
6. Dignity, Shadbala, combustion and most divisional charts are not computed, the frames are skeletons of the rules and not the
   rules. No transits, deliberately. Whole sign houses. Rahu is the mean node.

## How SARVA reconciles Quad with the SARVA contract

1. The Quad cell is one option. Run the four dasha systems for the question's event and the Rule of 10 for every option, and pick
   the option the Rule of 10 ranks first. Name the systems that agree and the ones that are UNSTABLE.
2. A claim withdrawn as UNSTABLE is not used to choose. If every system is withdrawn the cell is the option the remaining stable
   system supports, normally the Vimshottari antardasha.
3. Chara, Kaal Chakra and Yogini are stand alone methodologies that SARVA does not run on their own. They run only inside this
   column. The CHAWDHRI engine stays pure Vimshottari.
4. Quad does not read another SARVA methodology's verdict.

## Not supplied

Sections 3 to 19 of the Quad Dasha methodology file, the compute detail, the interpretation rules of the four schools, the
Rule of 10 text, the output contracts, the worked examples, the benchmark and the error register. The intro PDF names them and
holds none of them. The READ rules of Chara, Kaal Chakra, Yogini and Laghu Parashari are therefore not available here, only the
report frames and the contract.
