<!-- SARVA-RULE-START -->
# SARVA trigger. This rule comes first and overrides every other routing rule in this file and in the other repositories

If the first word of the owner's message is SARVA, in any case, or the owner says "SARVA engine", the owner is asking for the SARVA method. The owner may have typed it by voice, so "server" or "sarva" at the very start of a message with birth details after it also means SARVA. Do not ask what it is.

SARVA means all the engines combined. Run every engine below on the same native and the same questions, then reconcile them into one answer per question. Do not fall back to a single engine by default, not to the SUJ engine of the vednetra repository, not to the Shri Jha Ji, CHAWDHRI, Poddar or KP Pro Sutton engines on their own. The rules in those repositories that forbid mixing methods, for example the CHAWDHRI rule against other schools, are lifted for a SARVA message only. Each engine still follows its own method internally, they are mixed only at the reconciliation step.

## Engines inside SARVA

All the repositories sit in /home/user, owner account sachinjainemail-pixel on GitHub. If a repository is not in the session, attach it with the add_repo tool, clone it to /home/user, then call register_repo_root. Read the CLAUDE.md and README.md of each engine before running it.

1. SUJ engine, repository vednetra, folder suj_engine. Read ENGINE_CONTRACT.md, METHODOLOGY.md, STATUS.md and LEARNINGS.md in that order. Start each question with node suj_engine/tools/prepare.js, run planet_strength.js and strength_tally.js, write the answer draft to a file and check it with node suj_engine/tools/answer_guard.js.
2. Shri Jha Ji, repository Shri-Jha-Ji. Run node bin/jyotish.js answer for options, or ask --file chart.json --topic for open questions. Read docs/METHODOLOGY.md, docs/RULEBOOK.md and docs/DECODER.md.
3. CHAWDHRI, repository CHAWDHRI. Follow .claude/skills/vedic-engine/SKILL.md, run sh jyotish.sh. Read dasha_gate for each topic.
4. Poddar engine, repository poddar-engine, with the skill in .claude/skills/poddar-engine. Run engine/setup.sh first. poddar-data holds only data and chat exports and is not an engine.
5. KP Pro Sutton, repository KP-Pro-sutton. Run kpredict ask for options, kpredict read for open questions. Its three KP methods count as one engine vote.

vednetra supplies the chart numbers. READ-VEDNETRA and SHRIVEDNETRA are copies of the Vednetra app and are not engines.

## Intake

The message gives the kundali number if any, gender, date of birth, time of birth, place of birth, then the questions with their options. Look up the latitude, longitude and time zone of the place. If something is missing, ask for it in one short message. The as-of date is the system date.

## Procedure for every question

1. Run all five engines on the question. If an engine cannot run, say which one and why, and continue with the rest. Never invent an engine's output.
2. For every question check the promise and the time status, already happened, happening now or due in the future, from the system date. Every engine's own rules for this stay in force.
3. Record the pick of each engine for the question. With options, the pick is one option.
4. Reconcile into exactly one definitive answer per question, with or without options. The answer is the pick that most engines support. Counting rule, proposed by the engine author and awaiting the owner, each engine has one vote, KP Pro Sutton counts once. A tie is broken by the SUJ engine evidence tally, then by the engine with the stronger stated chart evidence. Never call the engines equal, never say the result cannot be decided. State which engines agreed, which differed and why the chosen answer wins.
5. Typicality, base rates and the safe choice are not evidence. A natal promise is capacity and not proof of status.
6. For a dated question, such as what happened on a given date, rank the candidate events with each engine's dasha and transit method and name the one event.

## Answer format

Show a section per engine in short form, then a reconciliation section with a table of the picks, then a summary. End every answer with 2 or 3 bulleted one liners that summarise the analysis, the last one starting with Final answer, and nothing after them. Use the SUJ answer template for its own section, and run answer_guard.js on that section.

In chat replies do not use these characters, ( ) ! ; : em dash, curly quotes, / - # * ~. This applies to chat replies and not to code or to saved files.

## After the owner reports the true answers

Add the case to every engine that keeps a case log, update the learnings of each, and record which engine was right on each question, so the counting rule can be tested and changed on evidence.
<!-- SARVA-RULE-END -->

# CLAUDE.md for the vednetra repository

## SUJ engine

This section applies only when the message does not start with SARVA. A message that starts with SARVA follows the SARVA rule at the top of this file.

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

## Response style preference of the owner

Do not use these characters in chat responses: ( ) ! ; : em dash, curly quotes, / - # * ~ . Judge every
question on proper analysis and never answer only to please the owner. This applies to chat replies, not to
code or to saved methodology files.

## Vednetra app notes

Pure static JavaScript app, no build step. See README.md. After editing app.js or styles.css bump the ?v=N
values in index.html and CACHE_NAME in service-worker.js.
