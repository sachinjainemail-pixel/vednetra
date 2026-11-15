# SARVA ENGINE ANSWER TEMPLATE (version 1)

The reply is plain text lines in this order. Headings carry no markdown symbols. The owner does not want the
characters ( ) ! ; : em dash, curly quotes, / - # * ~ in chat responses. The one unavoidable exception is the
delimiter row of the final markdown table, which is table syntax.

INTAKE
    Native, gender, birth data and how sure the time is, place with latitude, longitude and time zone, as-of
    date from the system clock, and the list of questions with their options.
    One line starting LIMITS states in plain words that these are readings under each methodology and not
    certainties, and names any partial input, for example a missing BNN block or a doubtful birth time.

Then for each question, Q1, Q2 and so on, in this order.

QUESTION Q1
OPTIONS Q1 A B C D       (or OPTIONS Q1 OPEN when no options are given)

METHOD KPPRO Q1
    The analysis in the KP Pro order. Promise, time status, the evidence for and against.
    EVIDENCE Q1 KPPRO one line with the counted evidence and how thin it is.
    RESULT Q1 KPPRO B
METHOD KCIL Q1
    EVIDENCE Q1 KCIL ...
    RESULT Q1 KCIL B
METHOD SUJ Q1
    The condensed SUJ blocks, dominant house, D1, D9, subject varga, planet strength, dasha and time status,
    transit validation and the evidence tally.
    SUJ FILE Q1 path to the SUJ answer file that passed suj_engine/tools/answer_guard.js
    EVIDENCE Q1 SUJ ...
    RESULT Q1 SUJ C
METHOD CHAWDHRI Q1
    EVIDENCE Q1 CHAWDHRI ...
    RESULT Q1 CHAWDHRI B
METHOD BNN Q1
    EVIDENCE Q1 BNN ...
    RESULT Q1 BNN A

Line rules.
1. RESULT carries the option label exactly as listed in OPTIONS, or for OPEN a short concrete answer.
2. The BNN EVIDENCE line cites Rule IDs from the BNN rule base. Only if the rule csv is absent from the session
   the result reads RESULT Q1 BNN NOT RUN BNN RULES MISSING, in the BNN column only.
3. Every question has all five METHOD blocks, each with one EVIDENCE line and one RESULT line.

FINAL TABLE
    A markdown table, the last block of the reply, nothing after it.
    Header exactly: Question, KP Pro, KCIL, SUJ engine, CHAWDHRI, BNN.
    One row per question, in order. Each cell equals the RESULT line of that method and question.
    No sixth column, no vote, no combined answer.
