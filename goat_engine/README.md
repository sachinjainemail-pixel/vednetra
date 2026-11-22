# GOAT ENGINE

A repeatable promise and timing engine for one Vedic question, built on the owner's GOAT method.
All charts, the Vimshottari tree and the Jupiter and Saturn transits come from the VedNetra core
through `suj_engine/tools/vednetra_loader.js`. Nothing is computed by hand.

Status: first version. It runs end to end and passes its self test. It does not yet separate the
owner's reported answers, so treat its output as a draft until the decisions listed below are confirmed.

## Files

| File | Purpose |
|---|---|
| `tools/goat.js` | The engine. Promise, timing, transit validation, final answer, Hindi one liner |
| `tools/backtest.js` | Runs the engine on the owner case file, read only, and reports hits and misses |
| `tests/goat_selftest.js` | 19 checks of house arithmetic, navamsa data, Moon rule, option ranking and report rules |
| `data/weights.json` | Weights of the ten promise components, transit thresholds, dasha rules |
| `data/topics.json` | Topic presets: house under study, karaka planets, Hindi name |

## Usage

```
node goat_engine/tools/goat.js '{"name":"X","gender":"female","date":"1993-01-06","time":"07:10:00","tz":5.5,"lat":27.1333,"lon":81.9667,"place":"Gonda","topic":"marriage","asOf":"2026-11-22"}'
node goat_engine/tools/goat.js '<config with options>' --json
node goat_engine/tests/goat_selftest.js
node goat_engine/tools/backtest.js
```

Config fields: `name`, `gender`, `date` (YYYY-MM-DD), `time` (HH:MM or HH:MM:SS), `tz` (hours),
`lat`, `lon`, `place`, then either `topic` or `options` (a list of `{label, topic}`), `asOf`
(default today), `fromISO` and `toISO` (search range, default asOf to asOf plus 10 years).

## How each owner step is implemented

| Owner step | Implementation |
|---|---|
| 1. Planets in the house under study, lordship, condition, power | Component `c1_house_lagna`. Each occupant scores natural nature, functional nature from Lagna lordship, dignity, combustion, retrograde (times 1.25), and nakshatra lord nature. Aspects by natural nature and Shubh or Paap kartari are added |
| 2. Rotated D9 chart, same house | Component `c2_house_d9_rotated`. D9 signs of planets, houses counted from the D1 Lagna sign |
| 3. The house in D1 | Included in `c1_house_lagna`, and its Moon chart version in `c3_house_moon` |
| 4. Lord of the house and its condition | Component `c4_lord_lagna`. Lord's value plus placement counted from the house, plus its kartari, aspects and conjunctions |
| 5. Lord in D9 | Component `c5_lord_d9_rotated`. Kendra, kona, 2nd or 11th from the D1 Lagna sign is good |
| 6. Exaltation and debilitation | Inside every planet value, with a plus or minus 0.25 bonus for deep degrees |
| 7. Zodiac sign of planets | Sign friendship with the sign lord, inside every planet value |
| 8. Nakshatra and pada | Nakshatra lord nature, plus or minus 0.25. Pada is not scored |
| Karaka | Components `c6_karaka_lagna` and `c7_karaka_d9_rotated`, same rules as the lord |
| Nth house from the house | Component `c8_nth_house`. House N counted from the house, with N equal to the house number, for example 7th from 10th |
| Kalpurusha house | Component `c9_kalpurusha_house`. Fixed sign of the house number, its D1 occupants and lord |
| Lagna and Moon chart agreement | Component `c10_lagna_moon_agreement`. Plus or minus 1 when both charts agree in sign |
| Benefic first, then malefic discount | Report lists benefic components first, then malefic ones. Each component contributes its weight times tanh of half its raw score, and net is the sum |
| Promise | YES when net is above 0 |
| Dasha timing | Pratyantardasha windows where the antardasha lord is relevant and the mahadasha or pratyantardasha lord is relevant. Relevant planets are the house lord, occupants of the house in D1 and D9, and the karaka |
| Transit validation | Five samples per window. Double transit means Jupiter and Saturn both hit the house, its lord or the karaka by conjunction or full aspect in the same sample. Grade A for 3 or more double samples, B for 2, validated for A or B |
| Final answer | YES only when the promise is there and a validated window exists in range. Otherwise NO. With options, the top ranked option is chosen |
| Hindi one liner | Built from the house, its lord, occupants, net sign, transit support and the decision |

## Results so far

Backtest against the owner case file in the SUJ folder, run before any weight was changed:

| Question | Owner truth | Engine | Result |
|---|---|---|---|
| K892 marriage status | Married | promise NO, net minus 33.09 | miss |
| K2 marriage status | Very happy | promise NO, net minus 18.85 | miss |
| K3 marriage status | Divorced | promise NO, net minus 7.62 | miss |
| K2 event 3 May 2021 | Child born | picked Accident, NO | miss |
| K3 event 7 December 2022 | Marriage | picked Child born, NO | miss |

Promise questions hit 0 of 3. Event option questions hit 0 of 2. K4 has no clean topic mapping.
Five scored questions is far too few to conclude anything. The engine is therefore not validated.

Checks on 60 random birth charts, independent of the owner truths:

| Topic | Share of charts with promise YES | Mean net |
|---|---|---|
| Marriage | 52 percent | minus 1.9 |
| Education | 45 percent | minus 2.4 |
| Children | 37 percent | minus 7.0 |
| Career | 27 percent | minus 15.5 |

Marriage is balanced, so the scoring has no plain structural bias there. Career is skewed negative
because the karaka Sun is a natural malefic in the karaka component.

Transit validation on 25 random charts passed 59 percent of dasha windows. That is too permissive to
separate good windows from bad ones. Jupiter and Saturn move slowly, so the five samples in a window
almost always agree.

## Decisions the owner needs to make

1. Weights. The ten component weights in `data/weights.json` are the engine's own starting values.
   The owner text gives only the rank order. Confirm or give new weights.
2. Promise rule. A plain sign of the net is used. Confirm whether a margin is needed, or whether a
   promise should need both the Lagna and the Moon chart to agree.
3. Malefic handling. Sun, Mars, Saturn, Rahu and Ketu are natural malefics, so occupants and aspects
   from them lower the score in full. Confirm whether a malefic occupant should count for less when
   the house lord is strong and well placed, and by how much.
4. Transit rule. Double transit of Jupiter and Saturn against the house, lord and karaka passes
   59 percent of windows. Options: require the transit to hit the house and its lord only, require a
   stronger aspect, or sample a longer window. Choose one.
5. Topic presets in `data/topics.json`. House and karaka for each topic are the engine's standard
   choices. Confirm them, in particular career (house 10, karaka Sun), health (house 6, karaka Sun),
   wealth (house 2, karaka Jupiter) and mother (house 4, karaka Moon).
6. Options. The engine picks the top ranked option even when every option is NO. Confirm whether
   the answer should then be "none of the options" or the closest one.
7. Ordinal and count questions, such as education level, number of siblings and property type, have no
   rule in this engine. The owner text does not give one. Give rules or a list of topics to cover.
8. Pada. Not scored. Say whether pada should count, and how.
9. Relation to the SUJ engine. CLAUDE.md names SUJ as the engine for any native prediction in this
   repository. Confirm whether GOAT is a separate engine or should replace or feed SUJ.
10. Owner truths for more charts. The backtest needs more dated events and status answers with a clean
    topic. Eight more cases with reported answers would make the test meaningful.

## Limits of this version

- The natal aspect table uses full Parashari aspects for Mars, Jupiter and Saturn and a seventh
  aspect for the others. Rahu and Ketu use the Jupiter pattern. Confirm.
- Functional nature is taken from Lagna lordship only, for all frames.
- Dignity uses standard exaltation, debilitation and moolatrikona tables. Deep degree is within 5
  degrees of the deep exaltation point.
- Mercury is benefic unless a natural malefic shares its sign. Moon is benefic from elongation 60 to
  300 degrees, the same rule the SUJ engine uses.
- Rahu and Ketu functional nature is zero. The SUJ rules say the nodes adopt their dispositor's result.
  That is not implemented here, and the GOAT owner text does not mention nodes.
- Transit samples are five per window, evenly spaced across the window.
- Search range defaults to 10 years from the as of date. Windows that are PAST are kept in the listing
  when the range includes them, so backtests can use a fixed past range.
