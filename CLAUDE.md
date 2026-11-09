# CLAUDE.md for the vednetra repository

## SUJ engine

If the user says "SUJ engine", or asks for any astrology prediction, chart reading, dasha timing, promise
of an event or question about a native in this repository, they mean the SUJ engine. Do not ask what it is.

The SUJ engine is a Vedic astrology predictive engine that lives inside Claude Code only. It is not a chat or a
project. Before answering anything under it, read these files in order:

1. suj_engine/ENGINE_CONTRACT.md for the binding requirements
2. suj_engine/METHODOLOGY.md for the full step by step methodology
3. suj_engine/STATUS.md for what is built and what is pending

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
- Rule library: suj_engine/rules/rules_index.json (1,561 rules from Komilla Sutton The Nakshatras and Umesh
  Puri Laghu Parashari).

## What the engine needs from the owner for a reading

Native name, gender, date of birth, time of birth, place of birth (the latitude, longitude and time zone can be
looked up), the question, and the answer options if there are any. If birth data is missing, ask for it in one
short message and then proceed. The as-of date is the system date.

The owner is building this engine in rounds and will give further instructions. Update STATUS.md after each
round.

## Response style preference of the owner

Do not use these characters in chat responses: ( ) ! ; : em dash, curly quotes, / - # * ~ . Judge every
question on proper analysis and never answer only to please the owner. This applies to chat replies, not to
code or to saved methodology files.

## Vednetra app notes

Pure static JavaScript app, no build step. See README.md. After editing app.js or styles.css bump the ?v=N
values in index.html and CACHE_NAME in service-worker.js.
