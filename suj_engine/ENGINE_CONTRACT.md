# SUJ ENGINE CONTRACT

These are the binding requirements the owner gave for the SUJ engine. Any code, skill or answer produced
under the SUJ engine name must satisfy all of them.

## Where the engine lives

The SUJ engine lives inside Claude Code only. It is not a chat and not a project. It is stored in this
repository (vednetra) under the suj_engine folder, and CLAUDE.md at the repository root makes every new
Claude Code session recognise any reference to "SUJ engine" as this engine.

## Binding requirements

1. Every answer follows ALL steps of METHODOLOGY.md in the SAME sequence, and each step must be visibly
   reflected in the answer. No step may be skipped, merged or silently dropped.
2. The same procedure applies to every question, whether or not options are given to choose from.
3. The engine always returns exactly ONE definitive answer per question. No hedged lists, no "it depends".
4. If different sections of the methodology point to different answers, the engine must choose the best and
   most likely answer, and must say which sections agreed and which disagreed and why it chose as it did.
5. The last section of every answer is a SUMMARY that condenses the analysis step by step as per the
   methodology and then states the final answer.
6. For every event the engine checks three things: the PROMISE of the event, and its TIME STATUS, which
   means whether it has already happened in the past, is happening presently, or will happen in the future.
   The owner calls this a very, very important step. It applies to chart generation, dasha, divisional
   charts and all other computations. The as-of date (today, taken from the system date) must be used to
   locate the running Mahadasha, Antardasha and Pratyantardasha, and past periods must be examined for the
   event before any future window is offered.
7. Every chart and every other computation for any native is produced by the VEDNETRA tool in this
   repository (see below). The engine must never cast charts, dashas, vargas or transits by hand or from
   memory.
8. Pillars of every analysis: (a) promise, (b) timing by Dasha, Antardasha, Pratyantardasha, (c) validation of
   timing by transits of Saturn, Jupiter, Rahu, Ketu and Sun during the selected periods.
9. Rule sources the engine may cite: Brihat Parashara Hora Shastra, Phaladeepika, Bhavartha Ratnakara
   (identity of the astrologer), plus the attached rule library of 1,561 rules from Komilla Sutton, The
   Nakshatras (1,083 rules) and Umesh Puri Gyaneshwar, Laghu Parashari (478 rules). See suj_engine/rules.

10. KNOWLEDGE BASE 1, DOMINANT HOUSE. At the start of the D1 analysis of every question the engine must run
    the dominant house (stellium) scan, state which house holds the most planets, give the natural and
    functional significations of every planet in it, state the resulting life theme, link it to the question,
    and repeat the finding in the closing summary. See METHODOLOGY.md section 2.0. It applies to every planet and
    every house, never to Saturn or the fourth house alone.

11. KNOWLEDGE BASE 2, PLANET STRENGTH. Whenever more than one planet can deliver the result of an event and the
    results conflict, the more powerful planet enforces its result. Power is judged only by the owner's six step
    method in METHODOLOGY.md section 5, using Vednetra figures. The answer must show the planets compared, the
    strength evidence for each step, the winner and the reason.

12. ALWAYS DECIDE. The engine never says it cannot differentiate, decide or determine, and never calls options
    equal. With options given it selects the most suitable single option. Without options it gives one concrete
    answer, as clear as a choice from options.
13. CLOSING BULLETS. Every answer ends with 2 or 3 bulleted one liners that summarise the analysis and give the
    final answer. The last bullet starts with Final answer. Nothing follows them.
14. GUARD. Every answer is checked with suj_engine/tools/answer_guard.js before it is sent. See ANSWER_TEMPLATE.md.

Round 5 additions, from the first tested chart. Added by the engine author after the owner reported results. They keep the
engine inside the owner's methodology and are open to the owner's change. See LEARNINGS.md.

15. WEIGHED EVIDENCE. The answer rests on chart evidence only. Typicality, base rates and the safe choice are not evidence.
    Where evidence is both for and against, the side with the stronger planets decides, the owner's rule of rounds 6 and 7. A
    planet counts by its real strength in the role it plays, a debilitated 9th lord is a weak 9th lord. With
    options, S8 carries an EVIDENCE TALLY from strength_tally.js with a whole number per option and the final answer is the
    option with the highest number, or for ordered options the highest above 50. Every flag against the final answer is named
    on the COUNTER EVIDENCE line.
16. STATUS NEEDS WINDOWS AND STATUS INDICATORS. A natal promise is capacity. Whether an event has happened, is
    happening or is due needs the strict window scan, window_scan.js, and status indicators counted separately.
17. NO INVENTED RULES. Only the owner's methodology, the rule library and cited classical texts may enter the tally. Any
    other idea is marked proposed and kept out of the tally.
18. RULE LIBRARY. Run rules_lookup.js for every question and put the ids on the RULES CITED line, or write that the
    library holds nothing for the event.
20. ASPECT AND OWNERSHIP. An aspect works by the planet's natural nature. House ownership works by the houses owned, trine most
    beneficial, kendra somewhat, trik harmful. Dasha results follow the Laghu Parashari rules, and only the dasha results, for the
    concerned planet in its own Mahadasha, Antardasha, Pratyantardasha, Sookshma or Prana. Run functional_nature.js and give the
    DASHA LORDS line in S6. Laghu Parashari does not enter the natal strength tally.
19. CASE LOG. After every owner reported result add the case to suj_engine/cases/cases.json, run cases_report.js and update
    LEARNINGS.md.

## Engine tools

Answer guard, run before sending any answer:

    node suj_engine/tools/answer_guard.js answer.txt --options "Option A|Option B"

Leave out --options when the question gave no options.

Planet strength and conflict resolution, run it whenever candidate planets conflict:

    node suj_engine/tools/planet_strength.js '{"date":"YYYY-MM-DD","time":"HH:MM:SS","tz":5.5,"lat":0,"lon":0,"topic":"career","candidates":["Venus","Saturn"],"asOf":"2026-11-09"}'

topic is a key of suj_engine/data/topics.json, or pass houses, karakas and varga. asOf is the date for which dasha
activity is tested, so past and future windows can be examined by changing it. Add --json for structured output.

Dominant house scan, run it for every native and question:

    node suj_engine/tools/stellium.js '{"name":"X","date":"YYYY-MM-DD","time":"HH:MM:SS","tz":5.5,"lat":0,"lon":0,"focusHouse":10}'

Add --json for structured output. focusHouse is the house the question is about. The tool reads the chart from
Vednetra through suj_engine/tools/vednetra_loader.js and scans the Lagna, Moon and Sun charts.

Window scan, candidate dasha and double transit windows for an event, past and future:

    node suj_engine/tools/window_scan.js '{"gender":"female","date":"YYYY-MM-DD","time":"HH:MM:SS","tz":5.5,"lat":0,"lon":0,"event":"father_loss","strict":true}'

Rule library lookup for the chart placements and an event tag:

    node suj_engine/tools/rules_lookup.js '{"gender":"female","date":"YYYY-MM-DD","time":"HH:MM:SS","tz":5.5,"lat":0,"lon":0,"event":"Education"}'

Dossier for a question, runs the dominant house scan, the strict windows and the rule lookup together:

    node suj_engine/tools/prepare.js '{"gender":"female","date":"YYYY-MM-DD","time":"HH:MM:SS","tz":5.5,"lat":0,"lon":0,"topic":"parents"}'

Functional nature of the planets and of the running dasha lords by Laghu Parashari:

    node suj_engine/tools/functional_nature.js '{"gender":"female","date":"YYYY-MM-DD","time":"HH:MM:SS","tz":5.5,"lat":0,"lon":0,"asOf":"YYYY-MM-DD"}'

Event rank, which of several candidate events the running dasha lords point to most directly on a date:

    node suj_engine/tools/event_rank.js '{"gender":"female","date":"YYYY-MM-DD","time":"HH:MM:SS","tz":5.5,"lat":0,"lon":0,"on":"YYYY-MM-DD","events":["marriage","child_birth"]}'

Strength tally, the planets for and against each option weighed by Shadbala percent:

    node suj_engine/tools/strength_tally.js '{"gender":"female","date":"YYYY-MM-DD","time":"HH:MM:SS","tz":5.5,"lat":0,"lon":0,"kind":"ordered","options":["Low","High"],"evidence":[{"option":"High","side":"for","planet":"Mercury","factor":"reason"}]}'

Scoreboard of tested charts and guard self test:

    node suj_engine/tools/cases_report.js [--windows]
    node suj_engine/tests/guard_selftest.js

## How to use VEDNETRA from Claude Code

Vednetra is this repository. It is a pure JavaScript application and runs without a browser.

Command line runner, from the repository root:

    node tools/run-nobrowser.js '{"name":"X","gender":"male","date":"YYYY-MM-DD","time":"HH:MM:SS","tz":5.5,"lat":0,"lon":0,"place":"...","question":"...","report":"trinetra"}'

date and time are LOCAL clock time at the birthplace and tz converts them. The optional field enquiryISO
sets the as-of instant. Report keys: avengine, intakeform, dayevent, consolidated, triveni, trinetra, kp,
kcil, quaddasha, vapm, vapmnak, native, cc.

Programmatic path, after loading trinetra-rules.js, quad-dasha.js and app.js behind the stub globals used in
tools/run-nobrowser.js, the object VedicCore exposes buildChart, makeVargaChart, findDashaStack, subPeriods,
vargaSign, vargaDegree, computePayload, serializeChart and reportFor. The engine should be built on these
calls and not on rendered markdown where structured data is available.

Sanity check before trusting a run: node tools/quad-dasha-selftest.js must print 8 of 8.

## Status of the build

See STATUS.md.
