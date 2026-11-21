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
- `tests/verified_charts.json` holds 9 AA rated charts with dated events and their sources.
- `tests/backtest.js` runs the engine on those charts and prints every answer.

## Scoring

For each option in a profession, course or disease question:

- +2 for each option house that the planet lords
- +1 for each option house the planet occupies
- +1 for exalted or own sign, -1 for debilitated
- +3 if the planet is the running mahadasha lord, +2 if it is the antardasha lord, at the as-of date
- +2 if the planet is the Jaimini karaka for the domain
- +1 if the planet's Ashtakavarga bindus in the option houses average 4 or more

The raw total is divided by the number of significator planets, so options with more planets are not favoured. A tie goes to the option listed first.

For a yes or no event in a date window, every antardasha that overlaps the window is scored. The window is a yes when one period scores 2 or more.

## Output

The answer is in Hindi. It gives the chosen option and one or two lines of astrological logic. Health questions always carry a note that the output is not a medical diagnosis.

## Limits

- The engine does not give dates of death or lifespan. There is no longevity domain.
- Not yet included: Shadbala strength, gochara (transit) dates, Jaimini chara dasha in scoring, graha drishti, and the Rahu and Ketu rules.
- The knowledge base is small and is not validated. Backtest on 9 verified AA charts (tests/verified_charts.json): profession 1 of 9 correct against chance of about 17 percent, and event windows 17 of 28 correct against chance of 50 percent (one sided p about 0.17). Treat the output as rule output, not as verified prediction.
- Known structural bias: options that list more houses gain more points. Banking (houses 2, 10, 11) was chosen for 6 of 9 charts. A per house normalisation is the next change to test, on a fresh set of charts so that the same charts are not used to both tune and score.

## Run

```
node predictive/paj/paj.js '{"name":"David Chokachi","gender":"male","date":"1968-01-16","time":"13:03","tz":-5,"lat":41.9584,"lon":-70.6673,"domain":"event","event":"marriage","from":"2003-01-01","to":"2005-12-31"}'
node predictive/paj/tests/backtest.js
```
