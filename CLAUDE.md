# CLAUDE.md for the vednetra repository

## SARVA engine

If the user says "SARVA engine", it is this engine. Do not ask what it is. It applies to every chart analysed
under that name, in every session, until the owner changes it. Read these files in order before answering:

1. sarva_engine/ENGINE_CONTRACT.md for the binding requirements
2. sarva_engine/METHOD_ROUTING.md for how to run each methodology
3. sarva_engine/ANSWER_TEMPLATE.md for the reply layout
4. sarva_engine/STATUS.md for what is built and what is pending

Non negotiable points

- The SARVA engine runs exactly seven methodologies, in this order: KP Pro, KCIL, SUJ engine, CHAWDHRI, BNN, Udu, Quad Dasha.
  No other methodology is run, cited or used as a tie breaker. Chara, Kaal Chakra and Yogini run only inside Quad Dasha.
- Every question, with its options if any, is analysed separately under each of the seven methodologies, each by its own
  source rules and its own chart settings. None is skipped or answered from another's result.
- Each methodology ends each question with exactly one finalized option. No hedging, no range, no refusal to choose.
- The final output is one table, the last block of the reply, with one row per question and the columns Question, KP Pro,
  KCIL, SUJ engine, CHAWDHRI, BNN, Udu, Quad Dasha. Each cell is that methodology's finalized option. No eighth column, no vote, no
  combined answer unless the owner asks for one in that session.
- BNN rules are never read from memory. The BNN rule base is sarva_engine/knowledge/bnn/BNN-RULES-5COLUMN.csv, read with
  node sarva_engine/tools/bnn_rules.js, and the BNN evidence line cites Rule IDs. Only if the csv is absent from the
  session use the cell text NOT RUN BNN RULES MISSING, see ENGINE_CONTRACT.md section 7.
- Udu answers only from its own corpus and Quad Dasha only by its own report contract. Their rule files are in
  sarva_engine/knowledge/udu and sarva_engine/knowledge/quad. Where those rule files are not yet supplied the cell is the exact
  text NOT RUN UDU RULES MISSING or NOT RUN QUAD RULES MISSING, never a guess. See ENGINE_CONTRACT.md sections 7b and 7c.
- KP Pro follows the owner's v15 booklet in sarva_engine/knowledge/kppro. Its own prior may decide only when its NET band is
  UNDECIDED, and the KP Pro evidence line then says PRIOR DOMINANT with a HIGH, MEDIUM or LOW word.
- KCIL follows the owner's v2.6 summary in sarva_engine/knowledge/kcil, on Khullar settings only. Its evidence line says STABLE,
  TWO CANDIDATES or NO RULE REGISTER, and for two candidates the cell is the one its closing rule of section 16.30 prefers.
- Never use the kpredict ask default output as a KP Pro or KCIL cell, it never lets the chart in.
- Start every SARVA session with node sarva_engine/tools/sarva_preflight.js. Udu and Quad Dasha are standing gaps, the owner will
  not supply their rule files, so their cells stay NOT RUN UDU RULES MISSING and NOT RUN QUAD RULES MISSING and the guard ends with
  exit code 3. That is expected. See ENGINE_CONTRACT.md section 10.
- Write the draft reply to a file and run node sarva_engine/tools/sarva_guard.js on it before sending. sarva_engine/examples shows the layout.
- Under SARVA the SUJ rules below apply inside the SUJ column. For any question not named SARVA, the SUJ section
  below still governs.

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

## GOAT ENGINE

If the user says "GOAT ENGINE" or "GOAT", it is goat_engine in this repository. It is a separate engine from SUJ
and SARVA. A request that names GOAT is not handled by the SUJ rules above. Read goat_engine/README.md first.
Run it with node goat_engine/tools/goat.js --file goat_engine/examples/<file>.json, or give the same fields for a
new native in a copy of an example file. It needs no install. Charts come from the VedNetra core in this
repository, through goat_engine/tools/vednetra_loader.js. Its weights and topic presets are in goat_engine/data,
and the owner can change them there. Do not change the GOAT weights to fit a backtest without the owner's go-ahead.

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
