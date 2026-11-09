# SUJ ENGINE BUILD STATUS

## Phase 0. Absorb (done)

- Methodology saved in METHODOLOGY.md.
- Binding requirements saved in ENGINE_CONTRACT.md.
- Rule workbook saved in rules/Sutton_and_LaghuParashari_Rules.xlsx and converted to rules/rules_index.json.
  Sheets: Sutton The Nakshatras 1,083 rules, Umesh Laghu Parashari 478 rules, total 1,561.
  Fields per rule: rule_id, description, events, exact_rule, effect, combination, source, page.
  Event tags in the data: Career, Marriage, Children, Wealth, Education, Health, Longevity, Property,
  Parents, Litigation, Travel, Spirituality, Personality, Timing, General.
- Vednetra runs without a browser. quad-dasha-selftest prints 8 of 8. The trinetra report was generated
  for a test chart.
- CLAUDE.md at the repository root makes new sessions recognise the SUJ engine.

## Round 2. Knowledge base 1, dominant house (done)

- Rule written into METHODOLOGY.md section 2.0 and ENGINE_CONTRACT.md requirement 10.
- Tool built: suj_engine/tools/stellium.js with the Vednetra loader and data/significations.json.
  It scans the Lagna, Moon and Sun charts, finds every house with two or more planets, marks the dominant
  house, and lists for each planet the natural significations, the functional significations from the houses it
  lords, functional role, dignity, retrograde, combust, nakshatra and Navamsha. It also links the result to the
  question house.
- Tested on two charts. Positions agree with Vednetra's own report for the same chart. One test chart has a four
  planet house and one has only two planet houses, and both are handled.
- Four assumptions are recorded as proposals in METHODOLOGY.md section 2.0, awaiting owner confirmation.
- The significations table is a working table written for this engine and is editable. It is not yet reviewed
  by the owner.
- Moon benefic test now follows the owner's rule, Shukla 6th tithi to Krishna 10th tithi. Vednetra's own
  naturalNature uses a different Moon brightness test, so the two can differ for a Moon near those limits.

## Round 3. Knowledge base 2, planet strength and conflict resolution (done)

- Owner's rule and the six step Hindi method saved word for word in METHODOLOGY.md section 5, with an English
  rendering and the engine's resolution procedure.
- Tool built: suj_engine/tools/planet_strength.js with data/topics.json. For the seven planets it gives Shadbala
  percent against the Santhanam minimums with all six parts, D1 dignity and sign lord condition and neecha bhanga,
  D9 and vargottama and four Vimshopaka schemes and the subject varga, retrograde and combust and graha yuddha,
  aspects and conjunctions and yogas as notes only, the subject and dasha count at any as-of date, and a
  separate node assessment. It prints the mathematical and the owner adjusted rankings side by side and resolves
  candidate planets to one winner.
- app.js received nine added lines that expose Vednetra's own Shadbala, Vimshopaka, dignity, yoga and aspect
  functions as VedicCore.sujInternals. Nothing else changed. Vednetra's self test still prints 8 of 8. The cache
  version numbers were not bumped because no screen or behaviour changed.
- Tested on one chart. Venus against Saturn for career resolves to Saturn on a two to two vote broken by step 6.
  A node candidate and a bad topic name were also tested.
- Not verified: Vednetra's Shadbala was not compared with a reference program such as Parashara's Light in this
  session. Its ephemeris is a built in analytic one with about one arc minute typical precision.
- Provisional items awaiting owner confirmation are listed in METHODOLOGY.md section 5.4.

## Next phases (waiting for the owner's further instructions)

- Phase 1. Question intake and event mapping (question to house, karaka, divisional chart, Nth house).
- Phase 2. Chart data layer on VedicCore (D1 Lagna, Moon and Sun charts, D9, D3, D7, D10, D12, D24, D30).
- Phase 3. The five processes A to E over each chart, with the weightage order of section 1.
- Phase 4. Divisional chart analysis.
- Phase 5. Dasha, Antardasha, Pratyantardasha across past, present and future with as-of date.
- Phase 6. Transit validation for Saturn, Jupiter, Rahu, Ketu and Sun.
- Phase 7. Rule library lookup from the 1,561 rules.
- Phase 8. Conflict resolution, single definitive answer and the closing summary section.
- Phase 9. Test charts and verification.

## Open points to confirm with the owner

1. Sun chart. The text says Rashi chart and Moon chart in section 2.1 but names the Sun chart in the process
   note, and Sudarshan means all three. Default plan is to run all three.
2. Process count. Section 2.2 lists four items, the later sub-sections give five processes (A to E). Default
   plan is to run all five.
3. Ayanamsha. The app supports Lahiri, Raman and KP. Default plan is Lahiri.
4. Numeric scale for the weightage. The text gives an order and a direction (positive or negative) but not
   point values. A scale needs to be agreed.
5. Karaka table and the key house per question type beyond the examples given.
6. The README of this repository records that 52 pre registered tests of classical interpretation rules came
   out at chance level. The engine will always give one definitive answer as required. A confidence grade
   inside the closing summary is proposed so the definitive answer is not mistaken for a proven one.
