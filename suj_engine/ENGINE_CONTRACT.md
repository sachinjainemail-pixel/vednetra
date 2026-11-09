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

## Engine tools

Dominant house scan, run it for every native and question:

    node suj_engine/tools/stellium.js '{"name":"X","date":"YYYY-MM-DD","time":"HH:MM:SS","tz":5.5,"lat":0,"lon":0,"focusHouse":10}'

Add --json for structured output. focusHouse is the house the question is about. The tool reads the chart from
Vednetra through suj_engine/tools/vednetra_loader.js and scans the Lagna, Moon and Sun charts.

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
