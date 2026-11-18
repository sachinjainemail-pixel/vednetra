#!/usr/bin/env node
/*
 * Builds sarva_engine/knowledge/quad/quad_rules.json from the owner's Quad Dasha full methodology file
 * (sarva_engine/knowledge/quad/QUAD-FULL-METHODOLOGY.pdf and .txt, 86 pages, Hindi, dated 15 November 2026).
 * Every row is one rule of section 9A, 6 to 9, or 11 of that file, written in English. Nothing is added from outside the file.
 * Fields. id, event, system, name, trigger, base (percent a rule fires on random dates, null if not measured), lift (null if not measured),
 * n, p, label (the owner's six confidence labels), src (author and section of the file), sec (section of QUAD-FULL-METHODOLOGY), impl (evaluator key in quad_engine.js
 * or null when this build cannot test the rule) and params.
 * Run: node sarva_engine/tools/quad_build/build_rules.js
 */
const fs = require("fs"), path = require("path");
const rows = [];
let cnt = {};
function R(event, system, name, trigger, o) {
  o = o || {};
  cnt[event] = (cnt[event] || 0) + 1;
  rows.push({
    id: "QR-" + event + "-" + String(cnt[event]).padStart(2, "0"), event, system, name, trigger,
    base: o.base === undefined ? null : o.base, lift: o.lift === undefined ? null : o.lift, n: o.n || null, p: o.p || null,
    label: o.label || "CLASSICAL", src: o.src || "", sec: o.sec || "9A", impl: o.impl || null, params: o.params || null, note: o.note || ""
  });
}
const CH = "Chara", KC = "Kaal Chakra", VI = "Vimshottari", YO = "Yogini";

// ---------------------------------------------------------------- MARRIAGE
R("MAR", CH, "DK karaka placement", "The Chara dasha or sub period sign holds the DK, or the DK throws a Jaimini rashi aspect on it, or the DK sits in the 7th sign from it.", { base: 48.8, lift: 0.89, src: "Rao part 2.2", impl: "ch_karaka", params: { role: "DK", offsets: [0, 6] }, note: "base rate and lift are for all fields together" });
R("MAR", CH, "DKN, Upapada and Darapada", "The same relation of the dasha sign to the DKN sign, the Upapada and the Darapada, that is the DK in the 7th from each of them.", { src: "Rao part 2.2", impl: "ch_dk_refs", note: "no separate measure available" });
R("MAR", KC, "Field relation 1 and 7", "From the Kaal Chakra dasha sign the 7th sign is related in D1 and D9 both, and the natural significator Venus sits there or aspects it.", { base: 66.5, lift: 1.18, n: 19, p: 0.098, src: "Singh part 3.8", impl: "kc_sector", params: { houses: [7], karaka: ["Venus"], vargas: [9], tag: "1-7" }, note: "overall lift 1.08, p 0.098, the only rule of the study that points the right way, still CLASSICAL, it selects a period and not a state" });
R("MAR", VI, "Antardasha lord related to the 7th, strict", "The antardasha lord is the lord of the 7th house.", { base: 11.9, lift: 1.15, src: "Laghu Parashari part 1.1 to 1.5", impl: "vim_lord_of", params: { house: 7, who: "AD" }, note: "empty on the true date in both recorded experiments" });
R("MAR", VI, "Dasha and antardasha relation matrix", "Both lords related or unrelated and the functional class of each decide the cell of the matrix.", { src: "Laghu Parashari part 1.5", impl: "vim_matrix", note: "the cell read bad in recorded experiment 2 and the marriage still happened, the Yogakaraka cell has the worst lift of the study, 0.47" });
R("MAR", YO, "Nakshatra lord and dasha lord in one house", "The nakshatra lord sits in the 7th from the progressed lagna and the dasha lord sits with it in that house.", { base: 63.2, lift: 1.03, src: "Goel reference points 2 and 3", impl: "yg_pair", params: { house: 7 } });
R("MAR", YO, "Birth lagna in the progressed 7th", "During the Yogini dasha the birth lagna falls in the 7th house of the progressed chart.", { src: "Goel", impl: "yg_birth_lagna", params: { house: 7 }, note: "printed by the engine in recorded experiment 2 but not on the checklist, no separate measure" });
R("MAR", YO, "Goel third reference point", "The dasha lord is tied to the nakshatra lord in the progressed chart.", { label: "VACUOUS", base: 100, src: "Goel", impl: "yg_goel3", note: "fired on 11 of 11 dates in recorded experiment 2, a witness that fires on everything has not discriminated" });
R("MAR", YO, "Double transit ladder", "Saturn within a year, Jupiter within six months, Sun within a month and Moon within three days link the points.", { label: "VACUOUS", base: 86.6, lift: 0.97, src: "Goel", note: "all four together 86.6 percent on random dates, above the limit of 85, not computed by this build" });
R("MAR", VI, "Dasha lord indicator, loose form", "The MD or AD lord is the lord of the house, sits in it or aspects it.", { label: "VACUOUS", base: 59.7, lift: 0.99, src: "Laghu Parashari part 2.5", impl: "vim_loose", params: { house: 7 } });

// ---------------------------------------------------------------- CHILDREN
R("CHI", CH, "PK karaka in the 5th", "The PK sits in the 5th sign from the Chara dasha sign or aspects it by Jaimini aspect.", { base: 48.8, lift: 0.89, src: "Rao part 2.2", impl: "ch_karaka", params: { role: "PK", offsets: [4] } });
R("CHI", KC, "Field relation 1 and 5", "From the Kaal Chakra dasha sign the 5th sign is related in D1 and D7 and Jupiter sits there or aspects it.", { base: 66.5, lift: 1.09, n: 19, src: "Singh part 3.8", impl: "kc_sector", params: { houses: [5], karaka: ["Jupiter"], vargas: [7], tag: "1-5" } });
R("CHI", CH, "Dasha of the 6th house sign", "The Chara dasha is that of the sign of the 6th house.", { src: "Rao caution 3", impl: "ch_dasha_house", params: { house: 6 }, note: "a caution, the 6th is the 2nd from the 5th, a maraka place for children, not a prediction" });
R("CHI", CH, "Sub period 6th or 8th from the main sign", "The Chara sub period sign is the 6th or the 8th from the main dasha sign, above all when the AK looks at it.", { src: "Rao caution 1", impl: "ch_sub_68" });
R("CHI", CH, "Birth date of the child", "After the dashas narrow the window, Jupiter within nine months over or aspecting both parents' PK in D1 and D7, Sun within four days, Moon 30 to 36 hours before.", { base: 64.7, label: "CLASSICAL", src: "Rao part 2.9", note: "base rate 64.7 to 99.2 percent, all three together 17.3 percent, lift 1.22, n 19, p 0.42, needs both parents' charts, not run in this build" });
R("CHI", YO, "Progressed lagna and the 11th", "The birth 11th house becomes the progressed lagna or the birth lagna falls in the progressed 11th.", { base: 15.8, lift: 0.90, src: "Goel", impl: "yg_11th" });
R("CHI", YO, "Yogini in D7", "The same progression laid on D7.", { label: "HAND ARITHMETIC", src: "Goel part 4.3", note: "not computed by the engine in this build" });

// ---------------------------------------------------------------- CAREER
R("CAR", CH, "AmK in the 10th or 11th", "The AmK sits in the 10th or 11th sign from the Chara dasha or sub period sign, or aspects it.", { base: 48.8, lift: 0.89, src: "Rao part 2.2 and 2.3", impl: "ch_karaka", params: { role: "AmK", offsets: [9, 10] }, note: "on 22 quiz career questions the chart method scored 45.5 percent and the no chart control also 45.5" });
R("CAR", CH, "AmK read in three steps", "Step one the AmK in a kendra, trikona or the 11th from the Lagna. Step two the aspects on it. Step three the conjunctions with it. Timing when the AmK sign dasha runs, or the sign from which the AmK is the 10th or 11th, and Vimshottari shows the same.", { src: "Rao part 2.3", impl: "ch_amk_place", note: "step two and three are descriptive, only step one is tested here" });
R("CAR", CH, "Ten Jaimini rajayogas with the navamsha filter", "Any pair of AK, AmK, PK, DK and the 5th lord in conjunction or mutual rashi aspect. Count in D1 then in D9, the ones that stay in D9 are effective.", { src: "Rao part 2.4", impl: "ch_rajayogas", note: "promise only, no timing formula in the source" });
R("CAR", CH, "AK and AmK placement", "AmK from the AK in a kendra, trikona or the 11th gives high position with little struggle, in the 6th, 8th or 12th struggle, in the 10th the best place found by Rao.", { src: "Rao part 2.4", impl: "ch_ak_amk" });
R("CAR", KC, "Field relation 1 and 10", "From the Kaal Chakra dasha sign the 10th sign is related in D1 and D10 and the significator Sun, with Saturn and Mercury, sits there or aspects it.", { base: 66.5, lift: 1.10, n: 22, src: "Singh part 3.8", impl: "kc_sector", params: { houses: [10], karaka: ["Sun", "Saturn", "Mercury"], vargas: [10], tag: "1-10" }, note: "career upward lift 1.10 n 22, career downward 1.04 n 16, neither significant" });
R("CAR", VI, "Related benefic antardasha in a Yogakaraka or trikona mahadasha", "The mahadasha lord is a Yogakaraka and the antardasha lord is a benefic related to it.", { base: 19.2, lift: 0.47, n: 22, src: "Laghu Parashari part 1.5", impl: "vim_yk_related", note: "true hits 2 of 22, 9.1 percent, the worst result of the whole study, never decisive alone" });
R("CAR", VI, "Related malefic antardasha in a Yogakaraka dasha", "In a Yogakaraka mahadasha the antardasha of a related Trishadaya, 8th lord or benefic kendra lord.", { src: "Laghu Parashari part 1.5", impl: "vim_yk_related_malefic", note: "the author says the large gains land here, no separate measure" });
R("CAR", VI, "Exchange of lagna lord and 10th lord, or 9th and 10th lords", "The two lords exchange signs or sit in each other's houses, the yoga is read to fructify in both lords' dasha and antardasha.", { src: "Laghu Parashari part 1.11", impl: "vim_exchange", params: { pairs: [[1, 10], [9, 10]] } });
R("CAR", KC, "Dasha sign taken as lagna, rajayoga", "A rajayoga forms when the Kaal Chakra dasha sign is taken as lagna and the foundation chart also holds the promise of authority.", { src: "Singh part 3.5", label: "HAND ARITHMETIC", note: "the foundation chart ceiling applies to every yoga, the engine does not rotate the chart to the dasha sign" });
R("CAR", CH, "Dasha of Sagittarius or Leo", "The Chara dasha is that of Sagittarius or Leo.", { base: 17.8, lift: 0.70, src: "Rao part 2.5", impl: "ch_dasha_sign", params: { signs: [8, 4], tag: "Sagittarius or Leo" }, note: "rise and fall signs, lift below one, the wrong way" });
R("CAR", CH, "Dasha of the AK sign", "The Chara dasha is that of the sign holding the AK or the sign from which the AK is the 10th.", { base: 15.2, lift: 0.82, src: "Rao part 2.7", impl: "ch_ak_dasha" });
R("CAR", KC, "High voltage signs", "The Kaal Chakra dasha is that of Sagittarius, Leo or Gemini.", { base: 13.6, lift: 0.92, src: "Singh part 3.6", impl: "kc_dasha_sign", params: { signs: [8, 4, 2], tag: "Sagittarius, Leo or Gemini" } });

// ---------------------------------------------------------------- EDUCATION
R("EDU", KC, "Field relation 1 and 4", "From the Kaal Chakra dasha sign the 4th sign is related in D1 and D24 and Jupiter and Mercury sit there or aspect it.", { base: 66.5, lift: null, n: 23, p: 0.454, src: "Singh part 3.8", impl: "kc_sector", params: { houses: [4], karaka: ["Jupiter", "Mercury"], vargas: [24], tag: "1-4" }, note: "on 23 quiz education questions the chart method stood 17.4 points ahead of the control, 56.5 against 39.1 percent, McNemar p 0.454. The level of the degree cannot be told from this" });
R("EDU", CH, "ECMCD events fix the lagna", "Dates of education, career, marriage, children and death are used to set the lagna degree when birth time is missing.", { src: "Rao part 2.8", note: "a no birth time method, not a rule for options" });
R("EDU", CH, "Education through the 4th and 5th karaka list", "Quick lookup row: Chara reads the karaka list of the 4th and 5th, Vimshottari the lords of the 4th and 5th, Yogini the progressed 4th.", { src: "quick lookup table", impl: "ch_karaka", params: { role: "PK", offsets: [3, 4] } });

// ---------------------------------------------------------------- PROPERTY, VEHICLE, WEALTH
R("PRO", KC, "Field relation 1 and 4, property", "From the Kaal Chakra dasha sign the 4th sign is related in D1, D4, D10 and D20 and the significator Mars for dry land, Moon for irrigated, Venus for residence sits there or aspects it.", { base: 66.5, src: "Singh part 3.8", impl: "kc_sector", params: { houses: [4], karaka: ["Mars", "Moon", "Venus"], vargas: [4, 10, 20], tag: "1-4 property" }, note: "no separate lift measured" });
R("PRO", KC, "Field relation 1 and 11, vehicle", "From the Kaal Chakra dasha sign the 11th sign is related in D1 and D16 and Venus for passenger vehicles, Mars for heavy, Saturn for transport sits there or aspects it.", { base: 66.5, src: "Singh part 3.8", impl: "kc_sector", params: { houses: [11], karaka: ["Venus", "Mars", "Saturn"], vargas: [16], tag: "1-11 vehicle" } });
R("PRO", YO, "Land and buildings in D4", "The same progression laid on D4.", { label: "HAND ARITHMETIC", src: "Goel part 4.3", note: "not computed by the engine in this build" });
R("PRO", VI, "Related malefic antardasha in a Yogakaraka dasha, large gains", "Large gains land in the antardasha of a related Trishadaya lord, 8th lord or benefic kendra lord of a Yogakaraka dasha.", { src: "Laghu Parashari part 1.5", impl: "vim_yk_related_malefic" });
R("PRO", VI, "Related maraka antardasha, fame without wealth", "The related maraka antardasha in a Yogakaraka dasha gives the least, fame and recognition without wealth in hand.", { src: "Laghu Parashari part 1.5", impl: "vim_yk_related_maraka" });
R("PRO", YO, "11th house as the house of expansion", "The 11th lord or a planet in the 11th active, and above all when the birth 11th becomes the progressed lagna.", { base: 15.8, lift: 0.90, src: "Goel part 4.1", impl: "yg_11th" });
R("PRO", KC, "Dasha sign as lagna, wealth and poverty yogas", "Wealth and poverty yogas read with the dasha sign taken as lagna.", { label: "HAND ARITHMETIC", src: "Singh part 3.5" });
R("PRO", CH, "Quantity of wealth", "There is no separate field table in the source for the amount of wealth.", { label: "NO RULE", src: "9A property", note: "any claim about an amount is HAND ARITHMETIC" });

// ---------------------------------------------------------------- SIBLINGS
R("SIB", CH, "BK in the 3rd", "The BK sits in the 3rd sign from the Chara dasha sign or aspects it.", { base: 48.8, lift: 0.89, src: "Rao part 2.2", impl: "ch_karaka", params: { role: "BK", offsets: [2] }, note: "activates the field only" });
R("SIB", CH, "Birth date of a sibling on D3", "The D3 lagna, BK and the 3rd and 11th houses of the elder sibling marked, then Jupiter, Mars, Sun and Moon of the younger over them, and the elder's running Chara BK in the 3rd or 11th.", { src: "Rao part 2.9", note: "not run in this build, needs both siblings' charts" });
R("SIB", YO, "Yogini in D3", "The same progression laid on D3, siblings and courage.", { label: "HAND ARITHMETIC", src: "Goel part 4.3" });
R("SIB", "none", "Number of siblings", "There is no counting rule of siblings in the source.", { label: "NO RULE", src: "Rule of the file 14 S4", note: "measured 2 of 15, 13.3 percent against random 24.3 and the no chart control 26.7. Give a size weighted population estimate by the native's age group and own gender and write NO RULE. The 3rd and 11th and BK reading is a note and does not choose the option" });

// ---------------------------------------------------------------- PARENTS
R("PAR", CH, "Father, BK and Sun in the 3rd", "The BK or the Sun sits in the 3rd from the Chara dasha sign or aspects it. BK plus Sun is the father.", { base: 48.8, lift: 0.89, src: "Rao part 2.2", impl: "ch_karaka_multi", params: { roles: ["BK"], planets: ["Sun"], offsets: [2], tag: "BK or Sun" } });
R("PAR", CH, "Mother, MK and Moon in the 4th", "The MK or the Moon sits in the 4th from the Chara dasha sign or aspects it.", { base: 48.8, lift: 0.89, src: "Rao part 2.2", impl: "ch_karaka_multi", params: { roles: ["MK"], planets: ["Moon"], offsets: [3], tag: "MK or Moon" } });
R("PAR", YO, "Yogini in D12", "The same progression laid on D12, the father from the 9th and the mother from the 4th.", { label: "HAND ARITHMETIC", src: "Goel part 4.3" });
R("PAR", KC, "Childhood dasha describes the family", "In a young native every strong dasha is first the action on the family and guardians.", { src: "Singh part 3.7", impl: "kc_childhood", note: "the attribution rule" });
R("PAR", "none", "Parents alive", "On 15 quiz questions of the parents the chart method scored 86.7 percent and the no chart control 73.3 percent on the same set.", { label: "VACUOUS", base: null, src: "evidence 17.5", note: "This matches the life tables for the age. Write the native's age and the parents' probable age against the options first, that information decides much of the answer before the chart is opened" });

// ---------------------------------------------------------------- HEALTH
R("HEA", CH, "GK in the 6th", "The GK sits in the 6th sign from the Chara dasha sign or aspects it.", { base: 48.8, lift: 0.89, src: "Rao part 2.2", impl: "ch_karaka", params: { role: "GK", offsets: [5] }, note: "on 8 quiz health questions 50.0 against 50.0 percent, zero difference. The most used rule gave no effect" });
R("HEA", CH, "Rao caution 1", "A sub period of the 6th or 8th sign from the main sign, above all in the AK's aspect.", { src: "Rao part 2.6", impl: "ch_sub_68" });
R("HEA", CH, "Rao caution 2", "The AK falls in the 8th from the running main or sub period sign.", { src: "Rao part 2.6", impl: "ch_ak_8th" });
R("HEA", CH, "Sagittarius dasha, accident, sudden illness, violent event", "The Chara dasha or sub period is Sagittarius. The event may touch a member of the family and not the native.", { base: 17.8, lift: 0.70, src: "Rao part 2.5", impl: "ch_dasha_sign", params: { signs: [8], tag: "Sagittarius" } });
R("HEA", KC, "Dasha sign in a maraka state", "The dasha sign is one of the eight maraka conditions of Jataka Parijata 17 verses 34 to 36.", { src: "Singh part 3.9", impl: "kc_maraka", note: "no separate base rate, the deha and jiva dasha lift is 0.82 at base rate 20.2" });
R("HEA", VI, "Maraka dasha, general condition", "The lord of the MD or AD is a maraka.", { label: "VACUOUS", base: 61.0, lift: 0.82, src: "Laghu Parashari part 1.8", impl: "vim_maraka" });
R("HEA", YO, "Yogini dasha or nakshatra lord a maraka", "The Yogini dasha lord or the nakshatra lord is a maraka.", { label: "VACUOUS", base: 70.9, lift: 0.82, src: "Goel", impl: "yg_maraka" });
R("HEA", KC, "Weak lagna and Moon, intense effect", "Both lagna and Moon weak and afflicted, or Kemadruma and Shakata yoga.", { src: "Singh part 3.10", impl: "kc_resilience" });
R("HEA", "none", "Organ level disease or the name of a disease", "There is no rule for this in the source.", { label: "NO RULE", src: "9A health", note: "answer from population statistics and keep the chart reading as a note. A question that rests on diagnosis, a treatment decision or somebody's physical safety gets the reading and one sentence that it is not medical evidence" });

// ---------------------------------------------------------------- DEATH AND LONGEVITY
R("DEA", CH, "DK and DKN in the dasha sign", "The DK or the DKN sits in the Chara dasha sign or aspects it. Rao says death comes when a maraka period comes whether it is the AK dasha or not.", { base: 55.8, lift: 1.19, n: 12, p: 0.286, src: "Rao part 2.2", impl: "ch_karaka", params: { role: "DK", offsets: [0] }, note: "the one death rule with lift above one, not significant" });
R("DEA", KC, "Field relation 1 and 8", "The 8th sign from the Kaal Chakra dasha sign is related.", { base: 66.5, lift: 0.90, n: 12, src: "Singh", impl: "kc_sector", params: { houses: [8], karaka: ["Saturn"], vargas: [], tag: "1-8" }, note: "the weakest of the field relations" });
R("DEA", KC, "Deha and jiva dasha", "The Kaal Chakra dasha is the deha or the jiva sign.", { base: 20.2, lift: 0.82, src: "Singh", impl: "kc_deha_jiva" });
R("DEA", KC, "Eight maraka conditions and the completion of life span", "A maraka dasha gives death only when the native has run out the life span, otherwise it foretells accident, illness, debt, stigma, accusation, humiliation, anguish, official anger, defeat, separation, loneliness, marginalisation, prison and grief.", { src: "Singh part 3.9", impl: "kc_maraka" });
R("DEA", VI, "Maraka order", "Second lord, malefic in the 2nd, 7th lord, malefic in the 7th, malefic with the 2nd lord, malefic with the 7th lord, 8th lord, the 3rd or 8th lord with the 2nd or 7th lord, Saturn with any maraka which displaces all, 6th lord, the weakest planet.", { base: 61.0, lift: 0.82, src: "Laghu Parashari part 1.8", impl: "vim_maraka_order" });
R("DEA", VI, "Which antardasha gives death", "Death in the antardasha of an unrelated malefic. A related malefic is a suspected killer. Not in a related benefic and not in any Yogakaraka antardasha.", { src: "Laghu Parashari part 1.8", impl: "vim_death_ad" });
R("DEA", VI, "Death axis pairs", "One lord's dasha and the other's antardasha for the pairs 1 and 7, 2 and 12, 3 and 11, 4 and 10, 5 and 9, 6 and 8. For movable lagna the 2nd and 7th, fixed the 3rd and 8th, dual the 7th and 11th.", { src: "Laghu Parashari part 1.8", impl: "vim_axis" });
R("DEA", VI, "Longevity class", "From the sign nature of the lagna lord and the 8th lord. Movable and movable long. Movable and fixed medium. Movable and dual short. Fixed and dual long. Dual and dual medium. Fixed and fixed short. The sign-type rule of the file.", { src: "Laghu Parashari part 1.9", impl: "vim_longevity" });
R("DEA", VI, "Gulika chain of the date of death", "Year by transit Saturn 5th or 9th from birth Gulika, month by transit Sun 5th or 9th from the 8th lord's sign, then day and hour.", { src: "Laghu Parashari part 1.9", note: "the author self marks 3 of 5 and on one real death the longevity class said medium and the native lived to 89. Not run in this build. A death date is never given" });
R("DEA", KC, "The three moves and the repeat of Simhavalokana", "Rao predicted the death of Rajiv Gandhi on this.", { lift: 0.81, src: "Singh part 3.2", impl: "kc_gati", note: "the lift of the moves is 0.81 to 0.95 in every specification, the wrong way" });

// ---------------------------------------------------------------- TRAVEL AND RESIDENCE
R("TRA", KC, "Kinds of travel", "From the Kaal Chakra dasha sign the 3rd is regular travel, the 9th long travel, the 12th foreign culture, the 8th expulsion. Karaka Moon.", { src: "Singh part 3.8", impl: "kc_sector", params: { houses: [3, 9, 12, 8], karaka: ["Moon"], vargas: [], tag: "travel" } });
R("TRA", KC, "Change of place in a leap transition", "All three signs of Simhavalokana present, the result is sometimes a change of residence.", { lift: 0.81, src: "Singh part 3.2", impl: "kc_gati" });
R("TRA", KC, "Westward travel with benefic influence", "When benefic influence is strong on these transitions there is pleasure in travel to the west.", { src: "Singh part 3.2" });
R("TRA", "none", "Questions of residence", "On 8 quiz questions the chart method scored 37.5 percent against the control 25.0.", { label: "NO RULE", src: "evidence 17.5", note: "no proof. Abroad through the 12th has no direct rule in Chara, Vimshottari or Yogini, anything said is HAND ARITHMETIC" });

// ---------------------------------------------------------------- LAWSUIT AND PRISON
R("LAW", KC, "Maraka dasha, stigma, accusation, prison, official anger", "The Kaal Chakra dasha sign is one of the eight maraka conditions.", { lift: 0.82, src: "Singh part 3.9", impl: "kc_maraka" });
R("LAW", VI, "6th lord in a malefic class", "The lord of the 6th is in the inauspicious class.", { src: "Laghu Parashari part 1.1", impl: "vim_6th_lord" });
R("LAW", CH, "Rao's three cautions", "A sub period of the 6th or 8th, the AK in the 8th, the dasha of the 6th house sign.", { src: "Rao part 2.6", impl: "ch_cautions" });
R("LAW", "none", "Side or result of a case", "The rules do not decide the winner of a case. The source says only that maraka conditions bring stigma, prison and official anger.", { label: "HAND ARITHMETIC", src: "9A lawsuit" });

// ---------------------------------------------------------------- COMMON TO EVERY EVENT
R("ALL", "all", "Promise before time", "No dasha gives what the birth chart does not allow. If the user says the event has happened the promise question is closed by that statement.", { src: "Section 15.1 rule 1" });
R("ALL", "all", "Relation between the two period lords is the gate", "The quality of the lords does not reduce a witness that rests on a relation, the shortfall is written and not deducted.", { src: "9A common" });
R("ALL", VI, "No fruit in own antardasha", "A dasha lord does not give its good result in its own antardasha.", { base: 86.7, lift: 1.03, src: "Laghu Parashari verse 29", impl: "vim_own_ad", note: "indicator rule, not significant" });
R("ALL", VI, "Middle antardasha extends the previous result", "An inauspicious antardasha between two auspicious ones extends the earlier fruit. Not giving is not the same as giving loss. The end of the last dasha spreads to the start of the next.", { src: "Laghu Parashari part 1.2 and 1.5" });
R("ALL", VI, "Venus and Saturn reversal", "When Venus and Saturn are unrelated, each gives the other's result in the dasha and antardasha of the other.", { src: "Laghu Parashari part 1.7", impl: "vim_venus_saturn" });
R("ALL", VI, "Exchange of kendra and trikona", "Kendra lords give their good in the antardasha of trikona lords and trikona lords in the antardasha of kendra lords.", { src: "Laghu Parashari part 1.3", impl: "vim_kendra_trikona" });
R("ALL", "all", "Transit is a trigger and not a cause", "Capacity in the birth chart, tendency in the dasha, opportunity in the transit. State a transit with its base rate. A transit written from memory is HAND ARITHMETIC.", { base: 86.6, src: "Section 15.1 rule 2" });
R("ALL", VI, "Sadharmi and Atmasambandhi sieve", "The two lords of like functional character, or natural friends, or both exalted or both debilitated.", { src: "Laghu Parashari part 1.6", impl: "vim_sadharmi" });
R("ALL", VI, "Pachaka, Bodhaka, Karaka and Vedhaka", "The four fixed planets of each dasha lord and their positions and relations.", { src: "Sarvartha Chintamani part 1.10", impl: "vim_pbkv" });
R("ALL", KC, "Comparative judgement", "Judge every dasha against the one before it.", { src: "Singh part 3.7" });
R("ALL", CH, "Navamsha filter", "In every count of a rajayoga count it in D1 and then keep what survives in D9.", { src: "Rao part 2.4", impl: "ch_rajayogas" });
R("ALL", "all", "A dasha that never came", "A yoga that never gets a dasha in the whole life does not bear fruit, the Kashmir pony rule.", { src: "Laghu Parashari rule 12" });

fs.writeFileSync(path.join(__dirname, "../../knowledge/quad/quad_rules.json"), JSON.stringify({
  source: "QUAD-FULL-METHODOLOGY.pdf and .txt, 86 pages, dated 15 November 2026, installed 18 November 2026",
  note: "Rules of section 9A, 6 to 9 and 11 of that file, written in English. Every rule is CLASSICAL unless its label says otherwise. No rule has a validated hit rate. 52 pre registered rule tests came out at chance, mean lift 0.960.",
  rules: rows
}, null, 1));
console.log("wrote", rows.length, "rules,", rows.filter(r => r.impl).length, "with an evaluator");
