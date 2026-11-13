# SUJ ENGINE ANSWER TEMPLATE (version 2)

Every answer from the SUJ engine uses these sections in this order. Headings are plain text lines with no
markdown symbols, because the owner does not want the characters ( ) ! ; : em dash, curly quotes, / - # * ~ in
responses. Bullets use the dot character •.

S0. INTAKE AND TIME FRAME
    Native, birth data, ayanamsha, question, options if any, as-of date from the system clock.
S1. DOMINANT HOUSE
    Knowledge base 1. Output of stellium.js, life theme, link to the question.
S2. D1 ANALYSIS
    Lagna chart, Moon chart and Sun chart. Processes A to E in methodology order and the weightage order of section 1.
    Contains one line starting RULES CITED with the rule ids from rules_lookup.js, or a statement that the library
    holds no rule for the event.
S3. D9 ANALYSIS
    Always done, whether or not the question concerns marriage.
S4. SUBJECT DIVISIONAL CHART ANALYSIS
    D3, D7, D10, D12, D24, D30 or whichever the question needs.
S5. PLANET STRENGTH AND CONFLICT RESOLUTION
    Knowledge base 2. Output of planet_strength.js whenever planets conflict, with the winner named.
S6. DASHA AND TIME STATUS
    Mahadasha, Antardasha, Pratyantardasha. Past periods first, then the running one, then the future.
    Must contain one line starting with TIME STATUS followed by exactly one of
    ALREADY HAPPENED, HAPPENING NOW, WILL HAPPEN.
    Must contain one line starting WINDOW SCAN stating the strict windows found by window_scan.js and which were
    weighed. Candidate windows are not proof, and a natal promise is capacity, not status.
S7. TRANSIT VALIDATION
    Saturn, Jupiter, Rahu, Ketu and Sun during the selected periods.
S8. RECONCILIATION OF SECTIONS
    Which sections agreed, which differed, and why the chosen answer wins.
    Contains one line starting EVIDENCE TALLY with a whole number for every option, in the form
    EVIDENCE TALLY Option A 40, Option B 72, Option C 55, Option D 10. The numbers come from strength_tally.js, the share of
    planet strength in favour of each option, 0 to 100, the owner's rule of round 6. The final answer is the option with the
    highest number. A tie needs one line starting TIE BREAK naming the deciding step. For ordered options list them lowest
    first and run the guard with --ordinal, the final answer is the highest option above 50.
    Contains one line starting COUNTER EVIDENCE naming the strongest evidence against the final answer.
S9. SUMMARY
    Short analysis recap by section, then a line starting FINAL ANSWER with one concrete answer, then 2 or 3
    bullet lines. The last bullet starts with "Final answer".

## Hard coded rules for every answer

1. The engine always selects one option. When options are given the final answer is exactly one of them.
2. When no options are given the final answer is as concrete and clear as a choice from options, for example a
   named month and year, a named period, yes or no with the reason, a specific person type, a specific field.
3. The engine never writes that it cannot differentiate, cannot decide, cannot determine, or that the options
   are equal. Where the evidence is close it applies the tie break order of METHODOLOGY.md section 5.4 and picks.
4. The answer ends with 2 or 3 bulleted one liners that summarise the analysis and give the final answer.
5. Nothing is written after those bullets.
6. Before sending an answer run: node suj_engine/tools/answer_guard.js answer.txt [--options "A|B|C"]
   and fix every error it reports. Version 2 of the guard checks the new lines above and fails typicality or
   base rate wording. Use --v1 only to read old answers.
7. Start every question with node suj_engine/tools/prepare.js, then planet_strength.js for conflicting planets.
8. Read suj_engine/LEARNINGS.md before answering. Its guardrails G1 to G11 apply to every question.
9. Without options, the EVIDENCE TALLY line may be left out of the number check, but the line and the COUNTER EVIDENCE
   line are still required, and the tally lists the candidate answers the analysis considered.
