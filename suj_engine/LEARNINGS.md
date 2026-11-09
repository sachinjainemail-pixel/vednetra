# SUJ ENGINE LEARNINGS FROM CALIBRATION CASES

Read this file with ENGINE_CONTRACT.md, METHODOLOGY.md and STATUS.md before any reading.
METHODOLOGY.md is the owner's text and is not edited here. Everything below is a working
procedure learned from checked cases. Items are PROPOSALS until the owner confirms them.
Each lesson comes from very few cases, so apply it as a weighting habit and keep adding cases
in suj_engine/cases. If a later case contradicts a lesson, change the lesson.

## Case 1. Patrika 890 (female, 11 September 1988, 06:35, Sri Ganganagar). Score 2 of 6

Right: education MBBS MS, residence birth state.
Wrong: career (said own practice, truth private institution), marriage (said married, truth
divorced), parents (said both alive, truth only mother alive), siblings (said 3 brothers + 1 sister,
truth 3 sisters + 1 brother).

What went right
- Admitting the planets of the dominant house into the conflict set (education) worked. Sun and Mars
  won and the field was medicine. Keep admitting dominant house planets as candidates.
- Residence was right when the Lagna lord, the 4th house aspect and D4 agreed.

What went wrong, and the rule to apply from now on

L1. Afflictions on the question house, its lord and its karaka are direct evidence. Do not overrule a
    majority of them with stabilisers or with a base rate. Base rate and population statistics are used
    only to break a tie after the weightage order of METHODOLOGY section 1 is exhausted.
    Seen in marriage and parents.

L2. Marriage. Treat these as one separation set and count them. Rahu or Ketu in the 7th, Mars in 8th
    or 7th or 1st or 4th or 12th, the 7th lord also owning the 6th, the 7th lord in gandanta or
    debilitated in D9, malefic aspects on the 7th from the stellium planets, the 7th lord in D9 8th.
    Three or more present and no strong 7th lord means the answer leans to divorce or separation, not to
    a stable marriage. The Upapada lord strength and a strong 2nd house reduce the weight but do not
    cancel the set. Patrika 890 had five of the seven items present.

L3. Parents. The lord of the 4th or 9th house sitting in the 8th is a direct pointer to loss on that
    side, and the dasha and karaka strength comparison does not cancel it. KB2 decides which planet
    enforces a result when planets deliver conflicting results of the same kind. It does not decide
    whether the parent survives. A strong karaka in D1 and D12 colours the quality of the relation. When
    the lord of a parent house is in the 8th, lean to loss on that side unless the 8th placement is
    cancelled by at least two weightage steps.
    When one lord rules both parent houses, as Mars did here, the loss falls on the parent whose karaka
    is more afflicted by the nodes and by dusthana aspects. In Patrika 890 that was the father, since Sun
    was joined by Ketu and aspected by Rahu while the mother's 4th house had the Jupiter aspect.
    The truth, only the mother alive, agreed.

L4. Career mode. A strong Lagna lord shows status and capacity, not whether the work is service,
    practice or business. Decide mode from the 10th lord, the 6th lord, D10 and the running Mahadasha.
    A 10th lord in the 12th, a Rahu Mahadasha and a service karaka that is weak but present point to work
    inside an institution or company. Practice needs the 7th house of D10 strong and the 10th house
    itself strong, and it is not proved by one strong planet. Strength of Sun does not mean government.

L5. Siblings count and gender. The method of counting masculine and feminine influences was wrong in
    Patrika 890 and is suspended. Give the total from the 3rd and 11th houses, their lords and the
    Ashtakavarga points, which gave the right total of four. For gender, hypothesis to test on the next
    charts only. A 3rd lord that is a feminine planet placed in a feminine sign (Venus in Cancer here) and
    a weak brother karaka by sign point to sisters. Do not call a gender with high confidence until the
    hypothesis has been checked on at least three charts.

L6. Add a counter reading check to every answer. Before the final answer, write the best alternative
    that follows the afflictions of the question house, lord and karaka, and reject it only by naming
    at least two weightage steps from METHODOLOGY section 1, not by base rate. Put it in S8 on a line that
    begins with COUNTER READING. answer_guard.js warns when the line is missing.

L7. Confidence grade is kept in S8. A grade of Low means the answer rests on a heuristic that has not been
    validated, and the answer is still stated as one definite answer.

## How to add the next case
Add suj_engine/cases/<id>.json with the engine answer and the owner's truth, then add a short section
here. Tally which lessons held and which failed.
