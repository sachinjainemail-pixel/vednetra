# SUJ ENGINE ANSWER TEMPLATE (version 1)

Every answer from the SUJ engine uses these sections in this order. Headings are plain text lines with no
markdown symbols, because the owner does not want the characters ( ) ! ; : em dash, curly quotes, / - # * ~ in
responses. Bullets use the dot character •.

S0. INTAKE AND TIME FRAME
    Native, birth data, ayanamsha, question, options if any, as-of date from the system clock.
S1. DOMINANT HOUSE
    Knowledge base 1. Output of stellium.js, life theme, link to the question.
S2. D1 ANALYSIS
    Lagna chart, Moon chart and Sun chart. Processes A to E in methodology order and the weightage order of section 1.
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
S7. TRANSIT VALIDATION
    Saturn, Jupiter, Rahu, Ketu and Sun during the selected periods.
S8. RECONCILIATION OF SECTIONS
    Which sections agreed, which differed, and why the chosen answer wins.
S9. SUMMARY
    Written in HINDI in Devanagari script, from the first recap line to the last bullet. Short analysis recap by
    section, then one line starting अंतिम उत्तर (Hindi for Final answer) with one concrete answer, then 2 or 3
    bullet lines. The last bullet starts with अंतिम उत्तर. The heading stays "S9. SUMMARY" in English. If
    options were given, the chosen option is quoted exactly as given inside the Hindi line. The recap must carry
    the dominant house finding and the confidence grade, as in every earlier version of the template.

## Hard coded rules for every answer

1. The engine always selects one option. When options are given the final answer is exactly one of them.
2. When no options are given the final answer is as concrete and clear as a choice from options, for example a
   named month and year, a named period, yes or no with the reason, a specific person type, a specific field.
3. The engine never writes that it cannot differentiate, cannot decide, cannot determine, or that the options
   are equal. Where the evidence is close it applies the tie break order of METHODOLOGY.md section 5.4 and picks.
4. The answer ends with 2 or 3 bulleted one liners that summarise the analysis and give the final answer.
5. Nothing is written after those bullets.
5a. Section S9, the recap, the final answer line and the closing bullets, is in Hindi. Sections S0 to S8 are in
    English. The guard fails an English S9, a missing अंतिम उत्तर line, Hindi hedging language, and a summary whose
    Devanagari share is below 70 percent.
6. Before sending an answer run: node suj_engine/tools/answer_guard.js answer.txt [--options "A|B|C"]
   and fix every error it reports.
