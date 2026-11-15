# CLAUDE.md for the vednetra repository

## SUJ engine

If the user says "SUJ engine", or asks for any astrology prediction, chart reading, dasha timing, promise
of an event or question about a native in this repository, they mean the SUJ engine. Do not ask what it is.

The SUJ engine is a Vedic astrology predictive engine that lives inside Claude Code only. It is not a chat or a
project. Before answering anything under it, read these files in order:

1. suj_engine/ENGINE_CONTRACT.md for the binding requirements
2. suj_engine/METHODOLOGY.md for the full step by step methodology
3. suj_engine/STATUS.md for what is built and what is pending
4. suj_engine/LEARNINGS.md for the guardrails learned from tested charts, which apply to every question

Non negotiable points

- Follow every step of the methodology in the same sequence and show each step in the answer.
- Give exactly one definitive answer per question, with or without options. If sections disagree, choose the
  best and most likely answer and say why.
- End every answer with a summary section of the analysis per the methodology and then the final answer.
- Always check the promise and also the time status, meaning already happened in the past, happening now or
  due in the future, using the current system date as the as-of date.
- Produce every chart, dasha, divisional chart and transit with the Vednetra tool in this repository
  (node tools/run-nobrowser.js, or VedicCore in app.js). Never compute them by hand or from memory.
- At the start of the D1 analysis of every question run the dominant house scan, node
  suj_engine/tools/stellium.js (rule in METHODOLOGY.md section 2.0). The house with the most planets drives the
  life theme, and each planet in it delivers the house through its natural and functional significations. This
  holds for every planet and house.
- When more than one planet can deliver the result of an event and the results conflict, the more powerful
  planet enforces its result. Judge power only by the owner's six step method, METHODOLOGY.md section 5, and run
  node suj_engine/tools/planet_strength.js with the candidate planets, the topic and the as-of date.
- ALWAYS DECIDE. Never say the engine cannot differentiate, decide or determine, and never call options equal.
  With options, select the single most suitable option. Without options, give one concrete answer as clear as a
  choice from options.
- Use the section layout in suj_engine/ANSWER_TEMPLATE.md. End every answer with 2 or 3 bulleted one liners that
  summarise the analysis and give the final answer, the last one starting with Final answer, and nothing after
  them. Write the draft to a file and run node suj_engine/tools/answer_guard.js on it before sending.
- Start every question with node suj_engine/tools/prepare.js, which runs the dominant house scan, the strict window scan
  and the rule lookup. Decide only on counted chart evidence. Put an EVIDENCE TALLY with a number per option and a
  COUNTER EVIDENCE line in S8, a RULES CITED line in S2 and a WINDOW SCAN line in S6. Never decide by typicality, base
  rates or the safe choice, never by a rule that is not in the methodology, the library or a cited text. A natal promise
  is capacity and not proof of status. See LEARNINGS.md.
- ENGINE 2.0 IS THE DEFAULT, since round 22. Every tool reads suj_engine/data/engine_config.json. It switches on the Baladi degree capacity with the
  Rahu and Ketu bands, the nakshatra and pada impact at weight 0.6, Laghu Parashari for the dasha lords and the nodes, the event rank by directness, and the
  window scan to Sookshma with the subject varga and the Jupiter and Saturn transits from the Lagna, Moon and Sun charts. Do not pass degree or nakshatra
  by hand, they are on. The engine legacy flag exists only to reproduce old results. For yes or no questions about what the native has, education, profession,
  siblings, parents or a child, prepare.js prints HYPOTHESIS SCORES with the raw score and a z score against the null distribution. That z reading is PROVISIONAL, it
  was found after the Kundali 4 answers were known, say so in the answer. The number of siblings or children and divorce have no validated rule.
  S8 of every answer has one ENGINE VERSION line, guard v3 checks it.
- After the owner reports true answers for a chart, add the case to suj_engine/cases/cases.json, run
  node suj_engine/tools/cases_report.js and update LEARNINGS.md and STATUS.md.
- Rule library: suj_engine/rules/rules_index.json (1,561 rules from Komilla Sutton The Nakshatras and Umesh
  Puri Laghu Parashari).

## What the engine needs from the owner for a reading

Native name, gender, date of birth, time of birth, place of birth (the latitude, longitude and time zone can be
looked up), the question, and the answer options if there are any. If birth data is missing, ask for it in one
short message and then proceed. The as-of date is the system date.

The owner is building this engine in rounds and will give further instructions. Update STATUS.md after each
round.

## SERVER mode, one answer from every methodology

Trigger. If the first word of the owner's prompt is "server", in any letter case and with or without punctuation after
it, the prompt is a SERVER request. The rest of the prompt holds the birth details and one or more questions, with options
if any. Do not ask what server means. A prompt that merely contains the word server elsewhere is not a trigger. If birth
data is missing, ask for it in one short message and then proceed.

Purpose. The owner wants every methodology's own answer to every question and will choose between them personally.
So there is NO combined verdict, no overall final answer, no majority vote and no ranking of the methodologies. Never merge,
average or pick between the methodology answers, and never tell the owner which one to follow. For every question each
methodology below gives its own single answer, produced only by its own rules and tools, and all of them are shown.

Methodologies, each run by its own rules and tools. The repositories are siblings of this one under /home/user.
1. SUJ engine in vednetra. Follow every rule of the SUJ engine section above.
2. Sudarshan engine in Shri-Jha-Ji. Read its CLAUDE.md first. Birth file as in examples/birth.sample.json, then
   node bin/jyotish.js ask --file chart.json --topic TOPIC --now ASOF, with --options for options, or answer --file
   birth.json --questions q.json for a set of questions. Report its pick as that engine prints it, including a pick
   that is uncalibrated, and a tie as a tie pair if its own rules print one.
3. Chawdhri engine in CHAWDHRI. Read its CLAUDE.md and .claude/skills/vedic-engine/SKILL.md first. It must never be
   mixed with another school, so run it as an isolated pass. It needs its own VedNetra copy with the high precision
   patch. The default target of engine/bridge/setup_vednetra.sh is the home folder vednetra, which would patch THIS
   repository. Always pass another folder, for example
   sh engine/bridge/setup_vednetra.sh /home/user/vednetra_chawdhri, then set VEDNETRA_DIR to that folder and run
   python3 -m engine --date D --time T --city PLACE --question Q --now ASOF.
   Its Sutton layer is a second opinion that never changes the Chawdhri answer. Show it on its own labelled line.
4. Poddar engine in poddar-engine. Run engine/setup.sh first, then follow .claude/skills/poddar-engine/SKILL.md.
5. KP Pro, 6. KCIL and 7. KP Pro Max, the three methods inside kpredict in KP-Pro-sutton. Install with pip install -e .
   in that folder, then run kpredict read, which prints each method's own reading separately, or kpredict ask. Report the
   KP_PRO, KCIL and KP_MAX readings as three separate answers. Never report the blended ensemble line as an answer. If a
   place is unknown pass --lat --lon --tz, never guess it.
8. poddar-data holds reference data and chat exports only. It is not a methodology, use it for look ups when useful.
   READ-VEDNETRA and SHRIVEDNETRA hold no astrology rules and are not used.

Procedure for each question, in the order asked, none skipped.
1. Run every methodology on the same question and the same as-of date, the system date. Every chart number must come
   from the engine's own tools, never from memory.
2. A methodology that cannot run, for example a missing build tool, is shown in its place with the reason and the words
   NO ANSWER FROM THIS METHODOLOGY. Never replace it by a guess and never fill it from another methodology.
3. Each methodology gives exactly one answer per question, in its own terms, with its time status as of the system date,
   already happened, happening now or will happen, and a short astrological reason in plain words. Do not show another
   methodology's score or rule number inside the reason. Do not soften an answer to make the methodologies agree.
4. Start each question with the block ANSWERS BY METHODOLOGY listing the answers of methodologies 1 to 7 in that order,
   one short bullet each. Where the answers differ, add one line saying where they differ and the cause, for example a
   different ayanamsa, house system or dasha method. Say nothing about which is better.
5. After that block give the full SUJ layout S0 to S9 of ANSWER_TEMPLATE.md for that question, with no ENGINE VOTES
   line. Write the SUJ part to its own file and run node suj_engine/tools/answer_guard.js on it, fix every error. The
   closing 2 or 3 bullets, the last one starting with Final answer, belong to the SUJ engine alone. Make the Final answer
   line say it is the answer of the SUJ engine only.
6. The reply ends with the closing bullets of the SUJ part of the last question, nothing after them.

All other SUJ rules stay in force for the SUJ part: counted chart evidence only, a natal promise is capacity and not
status, and no decision by typicality. The Chawdhri no mixing rule stays in force for the Chawdhri pass.

## Response style preference of the owner

Do not use these characters in chat responses: ( ) ! ; : em dash, curly quotes, / - # * ~ . Judge every
question on proper analysis and never answer only to please the owner. This applies to chat replies, not to
code or to saved methodology files.

## Vednetra app notes

Pure static JavaScript app, no build step. See README.md. After editing app.js or styles.css bump the ?v=N
values in index.html and CACHE_NAME in service-worker.js.
