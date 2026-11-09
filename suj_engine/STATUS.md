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
