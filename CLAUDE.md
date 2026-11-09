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
- Rule library: suj_engine/rules/rules_index.json (1,561 rules from Komilla Sutton The Nakshatras and Umesh
  Puri Laghu Parashari).

The owner is building this engine in rounds and will give further instructions. Update STATUS.md after each
round.

## Response style preference of the owner

Do not use these characters in chat responses: ( ) ! ; : em dash, curly quotes, / - # * ~ . Judge every
question on proper analysis and never answer only to please the owner. This applies to chat replies, not to
code or to saved methodology files.

## Vednetra app notes

Pure static JavaScript app, no build step. See README.md. After editing app.js or styles.css bump the ?v=N
values in index.html and CACHE_NAME in service-worker.js.
