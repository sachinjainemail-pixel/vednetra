# PAJ engine

An independent rule based engine for life event questions, using three methods only.

- Parashari: whole sign houses, Vimshottari mahadasha and antardasha, dignity, house lordship, Ashtakavarga.
- Ashtakavarga: the bindu tables used by the VedNetra app (read from `app.js`), with the Sarvashtakavarga total checked against 337.
- Jaimini: the seven karakas by degree, Atmakaraka for health, Amatyakaraka for career and study, Darakaraka for marriage, Putrakaraka for children.

This folder does not use the SUJ engine or the SARVA engine. Their rule bases and answer templates are not read here.

## Computation

Every chart quantity comes from the VedNetra engine at the repository root: sidereal positions with Lahiri ayanamsa, whole sign houses, nakshatra and pada, dignity, house lordship, combustion and the Vimshottari mahadasha timeline.
Antardashas are split from the mahadasha in proportion to the lord's years, which is the standard rule.

## Files

- `loader.js` loads the VedNetra core without a browser, using the same stubs as `tools/run-nobrowser.js`.
- `chart.js` turns a birth record into the engine's chart object, computes Ashtakavarga and Jaimini karakas, and builds the antardashas.
- `kb.json` holds the modern knowledge base: professions, courses, diseases and yes or no life events. Each entry lists the significator planets and the houses it relates to. These mappings are rule choices and are open to review by a qualified astrologer.
- `engine.js` scores options and evaluates event windows.
- `paj.js` is the command line entry point.
- `tests/verified_charts.json` holds 9 AA rated charts with dated events. It was used to diagnose the scoring bias, so it is a tuning set.
- `tests/holdout_charts.json` holds 11 further AA rated charts. Its results are the only ones that judge a rule change.
- `tests/backtest.js [file]` runs the engine on a chart file and prints every answer.

## Scoring

For each option in a profession, course or disease question:

- +2 for each option house that the planet lords
- +1 for each option house the planet occupies
- +1 for exalted or own sign, -1 for debilitated
- +3 if the planet is the running mahadasha lord, +2 if it is the antardasha lord, at the as-of date
- +2 if the planet is the Jaimini karaka for the domain
- +1 if the planet's Ashtakavarga bindus in the option houses average 4 or more

The raw total is divided by the number of houses in the option (per house normalisation, the rule on the `paj-per-house-normalisation` branch). A tie goes to the option listed first.
On branch `parashari-ashtakavarga-jaimini-engine` (commit 2353d68) the divisor was the number of significator planets. Both versions are reported below.

For a yes or no event in a date window, every antardasha that overlaps the window is scored. The window is a yes when one period scores 2 or more.

## Output

The answer is in Hindi. It gives the chosen option and one or two lines of astrological logic. Health questions always carry a note that the output is not a medical diagnosis.

## Limits

- The engine does not give dates of death or lifespan. There is no longevity domain.
- Not yet included: Shadbala strength, gochara (transit) dates, Jaimini chara dasha in scoring, graha drishti, and the Rahu and Ketu rules.
- The knowledge base is small and is not validated. Treat the output as rule output, not as verified prediction.
- Known structural bias found on the tuning set: options that list more houses gain more points. Banking (houses 2, 10, 11) was chosen for 6 of 9 verified charts. Per house normalisation was added to address it.

### Results

Holdout set, 11 charts, judged once. Madonna has no music option, so she is left out of profession scoring (10 scored).

| Rule | Profession (holdout) | Event windows (holdout) | Yes windows caught | No windows rejected |
| --- | --- | --- | --- | --- |
| Divisor = significator planets (commit 2353d68) | 1 of 10, chance 16.7 percent | 32 of 76, chance 50 percent | 16 of 41 | 16 of 35 |
| Divisor = houses in option (branch) | 2 of 10, chance 16.7 percent | 32 of 76, chance 50 percent | 16 of 41 | 16 of 35 |

The per house divisor moved profession from 1 to 2 correct on the holdout set. That difference is within chance (exact binomial probability of 2 or more correct at chance is about 0.52), so it is not evidence that the rule helps. Event windows do not use this divisor, so their count is unchanged.

On the tuning set the same change moved profession from 1 of 9 to 3 of 9, and event windows stayed at 17 of 28. Those numbers are not used as a judgment.

Event windows are below chance on the holdout set (32 of 76). The event rule is the weakest part of the engine. Any further change to it needs a new set of charts that has not been used before.

## Run

```
node predictive/paj/paj.js '{"name":"David Chokachi","gender":"male","date":"1968-01-16","time":"13:03","tz":-5,"lat":41.9584,"lon":-70.6673,"domain":"event","event":"marriage","from":"2003-01-01","to":"2005-12-31"}'
node predictive/paj/tests/backtest.js
```
