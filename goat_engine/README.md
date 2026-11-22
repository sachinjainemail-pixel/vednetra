# GOAT ENGINE

A repeatable promise and timing engine for one Vedic question, following the owner's GOAT method.

The GOAT ENGINE is completely separate from the SUJ engine. It has its own chart loader and its own
copy of the owner case file, so nothing in this folder depends on the SUJ folder. Charts, the navamsa,
the Vimshottari tree and the Jupiter and Saturn transits all come from the VedNetra core, loaded by
`tools/vednetra_loader.js`. Nothing is computed by hand.

Status. Second version. It runs end to end and passes its self test. It does not yet separate the owner's
reported answers, so treat its output as a draft until the open items below are settled.

## Run it in a new session, on a laptop or on a phone

Nothing needs installing. The engine uses only Node built in modules, and the VedNetra core it loads is
in this repository. Tested on Node 22.23.5. Older Node versions are untested.

Laptop, from the repository folder:

```
node goat_engine/tests/goat_selftest.js
node goat_engine/tools/goat.js --file goat_engine/examples/marriage_female.json
node goat_engine/tools/goat.js --file goat_engine/examples/marriage_female.json --out goat_engine/examples/marriage_report.txt
node goat_engine/tools/backtest.js
```

The same commands work in Windows PowerShell, macOS Terminal and Linux. Use `--file` so that the JSON
never has to be typed on the command line, which quoting breaks on Windows. Use `--out` to save the report
as UTF-8, so that the Hindi one liner keeps its characters on any console.

Phone, in the Claude Code app or on the web: open a new session on this repository and the GOAT branch.
Claude runs the same commands in its own container, so nothing needs installing on the phone. Ask it, for
example, to run the GOAT ENGINE on `goat_engine/examples/education_ordinal.json`.

Your own question, on any device: copy one of the files in `examples` and change `name`, `gender`, `date`
(YYYY-MM-DD), `time` (HH:MM:SS), `tz` (hours from UTC), `lat`, `lon` and `place`. Then set `topic`, or give an
`options` list. Ordinal and count options go in ascending order. Type options carry a `planet` tag.

Example files in `examples`:

| File | Question |
|---|---|
| `marriage_female.json` | Yes or no marriage promise and timing |
| `education_ordinal.json` | Education level on the option list, with the stream from the planets |
| `siblings_count.json` | Number of brothers and sisters, with the gender split from the planets |
| `career_options.json` | Several options, each with its own topic, ranked to pick one |
| `property_type.json` | Kind of property, picked from the planet tags on the options |

## Files

| File | Purpose |
|---|---|
| `tools/goat.js` | The engine. Yes or no promise and timing, ordinal, count and type rules, Hindi one liner |
| `tools/backtest.js` | Runs the engine on the owner case copy and reports hits and misses |
| `tools/vednetra_loader.js` | Loads the VedNetra core into Node with stub browser globals |
| `tests/goat_selftest.js` | 25 checks of house arithmetic, navamsa data, Moon rule, sibling parsing, ordinal rule, option ranking and report rules |
| `data/weights.json` | Weights of the ten promise components, transit thresholds, dasha rules, rule scale |
| `data/topics.json` | Topic presets on Parashari natural karakas, house under study and rule type |
| `data/types.json` | Gender of planets, stream of study per planet, kind of property per planet |
| `cases/owner_cases.json` | Copy of the owner reported cases, used only by the backtest |

## Usage

```
node goat_engine/tools/goat.js '{"name":"X","gender":"female","date":"1993-01-06","time":"07:10:00","tz":5.5,"lat":27.1333,"lon":81.9667,"place":"Gonda","topic":"marriage","asOf":"2026-11-22"}'
node goat_engine/tools/goat.js '<config with options>' --json
node goat_engine/tests/goat_selftest.js
node goat_engine/tools/backtest.js
```

Config fields: `name`, `gender`, `date` (YYYY-MM-DD), `time` (HH:MM or HH:MM:SS), `tz` (hours), `lat`, `lon`,
`place`, then `topic` or `options`, `asOf` (default today), `fromISO` and `toISO` (search range, default
asOf to asOf plus 10 years).

Options are a list of `{label, topic}` for yes or no topics. For ordinal and count topics the options are a
list of labels in ascending order. For type topics each option carries a `planet` tag, for example
`{"label": "Land", "planet": "Mars"}`.

## Topic presets

These follow Parashari natural karakas and standard house significations, as you asked.

| Topic | House | Karaka | Rule |
|---|---|---|---|
| education | 4 | Mercury, Jupiter | ordinal |
| marriage | 7 | Venus (male), Venus and Jupiter (female) | yes or no |
| career | 10 | Saturn, Sun | yes or no |
| children | 5 | Jupiter | yes or no |
| foreign | 12 | Rahu | yes or no |
| property | 4 | Mars, Venus | type |
| wealth | 2 | Jupiter | yes or no |
| health | 6 | Sun, Saturn | yes or no |
| siblings | 3 | Mars, Jupiter, Mercury | count |
| father | 9 | Sun | yes or no |
| mother | 4 | Moon | yes or no |

## How each owner step is implemented

| Owner step | Implementation |
|---|---|
| 1. Planets in the house under study, lordship, condition, power | Component `c1_house_lagna`. Each occupant scores natural nature, functional nature from Lagna lordship, dignity, combustion, retrograde (times 1.25) and nakshatra lord nature. Aspects by natural nature and Shubh or Paap kartari are added |
| 2. Rotated D9 chart, same house | Component `c2_house_d9_rotated`. D9 signs of planets, houses counted from the D1 Lagna sign |
| 3. The house in D1 | Included in `c1_house_lagna`, and its Moon chart version is `c3_house_moon` |
| 4. Lord of the house and its condition | Component `c4_lord_lagna`. Lord value plus placement counted from the house, plus its kartari, aspects and conjunctions |
| 5. Lord in D9 | Component `c5_lord_d9_rotated`. Kendra, kona, 2nd or 11th from the D1 Lagna sign is good |
| 6. Exaltation and debilitation | Inside every planet value, with plus or minus 0.25 for deep degrees |
| 7. Zodiac sign of planets | Sign friendship with the sign lord, inside every planet value |
| 8. Nakshatra and pada | Nakshatra lord nature, plus or minus 0.25. Pada is not scored |
| Karaka | Components `c6_karaka_lagna` and `c7_karaka_d9_rotated`, same rules as the lord |
| Nth house from the house | Component `c8_nth_house`. House N counted from the house, with N equal to the house number |
| Kalpurusha house | Component `c9_kalpurusha_house`. Fixed sign of the house number, its D1 occupants and lord |
| Lagna and Moon chart agreement | Component `c10_lagna_moon_agreement`. Plus or minus 1 when both charts agree in sign |
| Benefic first, then malefic discount | Report lists benefic components first. Each component contributes its weight times tanh of half its raw score |
| Yes or no promise | YES when net is above 0 |
| Dasha timing | Pratyantardasha windows where the antardasha lord is relevant and the mahadasha or pratyantardasha lord is relevant. Relevant planets are the house lord, occupants of the house in D1 and D9, and the karaka |
| Transit validation | Five samples per window. Double transit means Jupiter and Saturn both hit the house, its lord or the karaka by conjunction or full aspect in the same sample. Grade A for 3 or more double samples, B for 2 |
| Yes or no final answer | YES only when the promise is there and a validated window exists in range. Otherwise NO. With options the top ranked option is chosen. When every option is NO the top one is reported as the closest option |
| Ordinal rule (education level) | Strength is the promise net divided by the rule scale, clamped to minus 1 and plus 1. The option index is rounded from strength on the ascending option list. The strongest promise planet gives the stream |
| Count rule (siblings) | The sibling total is rounded from strength on the largest option total. Male and female promise planets split the total into brothers and sisters. The option closest in brothers and sisters is chosen |
| Type rule (property) | The strongest promise planet picks the option tagged with that planet, and the planet's property kind is reported |
| Hindi one liner | Built from the house, its lord, occupants, net sign, transit support and the decision, or from the rule outcome |

The sibling gender rule uses planet gender. Sun, Mars and Jupiter are male. Moon and Venus are female.
Mercury, Saturn, Rahu and Ketu are neuter and do not move the split.

## Results so far

Backtest against the owner case copy, using the presets above and the rules as you described them:

| Question | Owner truth | Engine | Result |
|---|---|---|---|
| K892 education level | Post graduation | Graduation, strength plus 0.12 | miss |
| K892 siblings | Two brothers two sisters | One brother one sister, strength minus 0.57 | miss |
| K4 siblings | 1 Brother 1 Sister | Only Child, net minus 38.29 | miss |
| K892 marriage status | Married | promise NO, net minus 33.09 | miss |
| K2 marriage status | Very happy | promise NO, net minus 18.85 | miss |
| K3 marriage status | Divorced | promise NO, net minus 7.62 | miss |
| K2 event 3 May 2021 | Child born | picked Accident, NO | miss |
| K3 event 7 December 2022 | Marriage | picked Child born, NO | miss |

Scored results: 0 of 3 promise questions, 0 of 2 dated event questions, 0 of 3 ordinal and count questions.
Eight questions are far too few to judge the engine, and every one is a miss. The engine is not validated.

Pattern to note. On the three marriage status questions and the K4 sibling question the promise net is
clearly negative or clearly positive in the wrong direction. The count rule then gives Only Child or a small
family, even where the reported family is larger. That points at the promise net itself, not at the count rule.

Checks on 60 random birth charts, independent of the owner truths:

| Topic | Share of charts with promise YES | Mean net |
|---|---|---|
| Marriage | 52 percent | minus 1.9 |
| Education | 37 percent | minus 6.7 |
| Children | 37 percent | minus 7.0 |
| Career | 25 percent | minus 15.1 |

Marriage is balanced. Career is lower because the Saturn and Sun karaka pair is largely malefic in the
karaka component. The mean net across these topics is negative, so the promise test is strict.

Transit validation on 25 random charts passed 59 percent of dasha windows. That is too permissive to
separate good windows from bad ones. You asked to keep the transit rule as described, so it is unchanged.

## Decisions taken from your answers

1. Weights. Kept as the engine's own best judgement. Unchanged since the first version.
2. Transit rule. Kept as described. House, lord or karaka by conjunction or aspect, double transit.
3. Malefic handling. Kept. A malefic occupant counts in full.
4. Topic presets. Changed to Parashari natural karakas, as in the table above.
5. Options. When every option is NO, the top ranked option is reported as the closest option.
6. Ordinal and count questions. Implemented with the rule you gave. A stronger promise gives a higher
   degree on the ordinal list and a larger sibling total. Planets of the promise set decide the stream
   and the gender split.
7. Relation to SUJ. GOAT is fully separate. It has its own loader and its own copy of the case data.

## Still open

1. More reported cases. Eight more clean cases, with charts, dates and reported answers, are needed for
   the backtest to mean anything. Send them in the same format as the owner case file.
2. The promise net. The backtest and the random chart checks point at the net as the cause of the misses.
   The next change should be made only after new cases are in, so that it is not fitted to the eight answers.
3. Property type options. Option planet tags are needed, for example Land tagged Mars and Vehicle tagged Venus.
4. Education stream. The stream text is given for the strongest planet. Confirm the stream table in
   data/types.json, and say whether the stream should be matched to an option when the options name streams.
5. CLAUDE.md. It makes SUJ the engine for any native prediction in this repository. A GOAT line is needed
   there, so that a GOAT request is not handled by SUJ. This folder does not change CLAUDE.md.

## Limits of this version

- Natal aspects use full Parashari aspects for Mars, Jupiter and Saturn and a seventh aspect for the
  others. Rahu and Ketu use the Jupiter pattern.
- Functional nature is taken from Lagna lordship only, for all frames.
- Dignity uses standard exaltation, debilitation and moolatrikona tables. Deep degree is within 5 degrees
  of the deep exaltation point.
- Mercury is benefic unless a natural malefic shares its sign. Moon is benefic from elongation 60 to 300
  degrees.
- Rahu and Ketu functional nature is zero. The nodes do not take their dispositor's result.
- Transit samples are five per window, evenly spaced across the window.
- The stream and property kind follow the strongest planet of the relevant set. The set covers the house,
  its lord, its occupants and the karaka.
