#!/usr/bin/env python3
"""Writes core.json, recipes.json and sources.json of the SARVA lexicon. Run from the repository root."""
import json, os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'knowledge', 'lexicon')

core = {
 '_note': 'Core significations. Tier T4 means the analyst wrote it from classical karaka lists that are widely repeated, and it could not be re verified in this session because the web pages were blocked. Tier T1 entries quote the owner corpora. Use only to translate an option into houses planets and signs, never as the cited evidence of a cell.',
 'kp_house_keys': {'tier': 'T1', 'src': 'KP PRO MAX MAX-13 HLT.01 house keys',
   '1': 'body, head, brain', '2': 'face, right eye, speech, also maraka', '3': 'hearing, hands, throat, right hand',
   '4': 'heart, lungs, chest', '5': 'cure, upper abdomen', '6': 'disease, lower abdomen, intestines, kidneys, doctor, medicine',
   '7': 'kidney, bladder, pancreas, lower back, internal female organs', '8': 'surgery, excretory and genital organs, poison, epidemics',
   '9': 'liver, hips, thighs, healing after surgery', '10': 'bones, knees, teeth, skin', '11': 'lower legs, blood, BP, left hand, body seat only',
   '12': 'feet, left eye, hospital, defect, amputation'},
 'kcil_ta_house_note': 'KCIL TA lists of profession, education and diseases per house are in kcil_ta_houses.json, tier T1.',
 'houses_general': {'tier': 'T4',
   '1': 'self, body, health, identity', '2': 'wealth, family, speech, food, face, early childhood', '3': 'siblings younger, courage, skills, communication, short travel, hands',
   '4': 'mother, home, property, vehicles, schooling, heart, peace', '5': 'children, intelligence, education, creativity, speculation, romance', '6': 'disease, enemies, debt, service, daily work, maternal uncle',
   '7': 'spouse, partnership, trade, public dealings', '8': 'longevity, sudden events, inheritance, occult, in laws money, chronic illness', '9': 'father, fortune, higher education, dharma, long travel, guru',
   '10': 'profession, status, authority, government, action', '11': 'gains, income, elder siblings, friends, fulfilment of desires', '12': 'expenses, losses, foreign lands, hospitals, isolation, sleep, moksha'},
 'planets_natural': {'tier': 'T4',
   'Sun': 'soul, father, government, authority, medicine, bones, heart, right eye, gold, wood',
   'Moon': 'mind, mother, women, fluids, milk, public, nursing, breasts, womb, left eye, water products',
   'Mars': 'courage, brothers, husband in a woman chart, surgery, blood, muscle, teeth, accidents, army, police, engineering, land, iron',
   'Mercury': 'intellect, speech, trade, accounts, writing, skin, nerves, lungs, intestines, young people, maternal uncle, friends',
   'Jupiter': 'wisdom, children, teachers, law, banking, counsel, liver, fat, thighs, elders, husband karaka by some, physician',
   'Venus': 'spouse, women, arts, beauty, luxury, vehicles, reproductive system, kidneys, skin beauty, cosmetics, fashion, hotels',
   'Saturn': 'karma, service, labour, discipline, delay, bones, joints, teeth, chronic disease, old age, mines, iron, oil, leather, masses',
   'Rahu': 'foreign, technology, ambition, poison, allergy, cancer, radiology, anaesthesia, electronics, paternal grandfather, doubles its sign lord',
   'Ketu': 'research, occult, surgery, viral and skin disease, detachment, hidden work, maternal grandfather, doubles its sign lord'},
 'planets_gender': {'tier': 'T1', 'src': 'BNN guide 16.4 and KP PRG.03', 'male': ['Sun', 'Mars', 'Jupiter', 'Saturn', 'Rahu'], 'female': ['Moon', 'Venus'], 'neuter': ['Mercury takes the gender of its companion'], 'ketu': 'BNN does not count Ketu for the sex of children'},
 'signs_kalapurusha': {'tier': 'T4',
   'Aries': 'head, brain, face', 'Taurus': 'face, neck, throat, teeth, mouth', 'Gemini': 'shoulders, arms, hands, lungs, nerves, ears',
   'Cancer': 'chest, breasts, stomach, womb', 'Leo': 'heart, spine, upper back', 'Virgo': 'intestines, digestive system, lower abdomen',
   'Libra': 'kidneys, lower back, skin, waist', 'Scorpio': 'genitals, rectum, excretory and reproductive organs', 'Sagittarius': 'thighs, hips, liver',
   'Capricorn': 'knees, bones, joints, skin', 'Aquarius': 'shins, ankles, calves, circulation', 'Pisces': 'feet, lymph, sleep'},
 'signs_nature': {'tier': 'T4', 'odd_male': ['Aries', 'Gemini', 'Leo', 'Libra', 'Sagittarius', 'Aquarius'], 'even_female': ['Taurus', 'Cancer', 'Virgo', 'Scorpio', 'Capricorn', 'Pisces'],
   'movable': ['Aries', 'Cancer', 'Libra', 'Capricorn'], 'fixed': ['Taurus', 'Leo', 'Scorpio', 'Aquarius'], 'dual': ['Gemini', 'Virgo', 'Sagittarius', 'Pisces']},
 'kp_medicine_by_sign': {'tier': 'T1', 'src': 'KP PRO MAX PRF.01 Medicine', 'text': 'Sun Dhanwantari medicine, Jupiter materia medica and physician, Mercury diagnosis, Mars surgery, Rahu has a say in medical education. Signs Leo and Virgo treatment, Scorpio drugs, Pisces hospitals, Sagittarius pharmacy. Strongest profession significator in Ashwini Magha or Moola gives medical.'},
 'derived_house_rule': {'tier': 'T1', 'src': 'KCIL rotation lock section 16.10, KP MAX FAM and MAR cards',
   'text': 'For a relative, rotate first. The relative becomes the Lagna and his or her own houses are counted from it. The house n of a relative whose own house is R is the house R plus n minus 1, counted in the native chart with wrap at 12. Standing rotations spouse 7, mother 4, father 9, first child 5, second child 7, third child 9 and 2 more each after, elder co born 11, younger co born 3. Spouse profession is the spouse 10th, which is the native 4th. Spouse 6th is the native 12th, spouse 8th is the native 2nd, spouse 7th is the native Lagna. Father 10th is the native 6th. Mother 10th is the native 1st.',
   'table': {'spouse': {'1': 7, '2': 8, '3': 9, '4': 10, '5': 11, '6': 12, '7': 1, '8': 2, '9': 3, '10': 4, '11': 5, '12': 6},
             'father': {'1': 9, '2': 10, '3': 11, '4': 12, '5': 1, '6': 2, '7': 3, '8': 4, '9': 5, '10': 6, '11': 7, '12': 8},
             'mother': {'1': 4, '2': 5, '3': 6, '4': 7, '5': 8, '6': 9, '7': 10, '8': 11, '9': 12, '10': 1, '11': 2, '12': 3},
             'first_child': {'1': 5, '2': 6, '3': 7, '4': 8, '5': 9, '6': 10, '7': 11, '8': 12, '9': 1, '10': 2, '11': 3, '12': 4}}},
}

recipes = {
 '_note': 'One recipe per question family. Each lists, per column, the source rules to run, taken from the owner corpora, and the pitfalls the scored cases showed. A recipe does not decide. The column still casts its own chart and applies its own rules, and the SARVA contract sections 2, 3 and 5 still bind.',
 'speciality_or_degree': {
   'applies_to': ['medical', 'profession', 'business'], 'question_examples': 'which medical speciality, which degree, which profession, which business',
   'steps_common': ['Look up every option with node sarva_engine/tools/sarva_lexicon.js and write down its houses, its planets and its signs before reading the chart.',
                    'Give every option the same kind of entries, the organ house, the speciality planets, the sign, and the same kind of counter entries. An option must not collect more planets only because the analyst listed more.',
                    'Check the option is a field of study and the question is the degree, or a present occupation and the question is the status.'],
   'KPPRO': 'EDU.02 for the subject, the 4th CSL for the first degree and the 9th for the postgraduate line, then PRF.01 for the profession, 10th CSL sign star and sub, with the house keys of HLT.01 for the organ. Read the 10th sign as the field, the star lord as the kind of work, the sub lord as the sector. KP MAR.05 and the rotated 10th for a spouse.',
   'KCIL': 'KCIL TA house lists and the KAL 118 table of subjects by the linking cusp that holds the 4th or 9th relationship, then the event matrix row such as Medical practitioner 6 or 8 with 10 and Surgeons 8,10. Count how many cusps of the option are reached and prefer the option with the most.',
   'SUJ': 'Dominant house, natural and functional significations of each planet, D24 for education or D10 for profession. No library rule names a speciality, so say before the tally that the entries are the analyst mapping.',
   'CHAWDHRI': 'Use the signification of planets and of the nakshatra lords through the Chawdhri engine. Do not judge from houses alone. Chawdhri gives few speciality rules, say so.',
   'BNN': 'Name the option karaka from the retrieved rules and test it. RAO-EDU-005 names the subject by what stands second from Mercury, ARI-LIF-015 gives the pair table, ARI-HLT-003 and AVA-HLT-006 the body register. An option the register does not name is OPEN and is not given the nearest planet silently.',
   'pitfalls': ['K894. No column picked the pediatrician in Q1 and only KP Pro picked the orthopedic surgeon in Q5. In both, the true option was a speciality of the same field that the planet of the field, Mars or the dominant house, outvoted.',
                'Mars as the planet of surgery wins every surgeon question by itself. Orthopedics needs Saturn and the 10th house of bones, so enter the bone evidence as evidence for the orthopedic option, not as counter evidence for the surgeon.',
                'A tally scores 100 for an option with one planet and no counter entry. Give every option the same counter entries.']},
 'service_or_business_or_government': {
   'applies_to': ['profession', 'business', 'income'], 'question_examples': 'private job, government job, own business, present work',
   'KPPRO': 'PRF.02. The 10th CSL signifying 6 is service, 7 with 10 is business, 6 and 7 both is both, 2 alone is own exertion. Government needs the Sun in the chain, PRF.11 10,11 with Sun and 6.',
   'KCIL': 'Matrix row Service or business, primary 10 with 6,7. House 7 in the TA list is employment in private companies and private business, house 10 is government organisations and self venture, house 6 is service.',
   'SUJ': 'Natural nature of the carriers, Sun and Rahu for government, Saturn for service, Venus Mercury Mars for business. Read the present dasha before the natal signature.',
   'CHAWDHRI': 'Natural words from the nakshatra lords, government, business, financier, then the dasha gate.',
   'BNN': 'NEG-PRF-002 and ARI-LIF-014 from Saturn frame, 2nd 7th and 12th from Saturn, Sun or Moon in the frame gives service, Venus gives own business, a powerful Sun a government job.',
   'pitfalls': ['K894 Q2. Four columns read the natal government signature as the present status. The native moved to another city and worked as an employee of a private clinic, truth private job. A natal signature is capacity. Ask what the person does now, whether the person moved, and read the running dasha lords and the D10 before the signature.',
                'Doctors run their own clinic or work in a private hospital. The words own business and private job both fit, so the present dasha and the place decide.']},
 'disease_or_health': {
   'applies_to': ['disease', 'medical'], 'question_examples': 'which disease, which part of the body',
   'KPPRO': 'HLT.01 and the card of the matching HLT code. The 6th CSL joined to 1, the planet joined to it names the nature, the sign and star of the 6th CSL name the part, the running dasha lord names the disease. KP will not name a death date.',
   'KCIL': 'Matrix Disease nature and part 6 with the cusp of the afflicted organ and the TA lists of diseases per house.',
   'SUJ': 'Dominant house and the karaka of the organ, with the 6th 8th and 12th as the harm houses. No death dating.',
   'CHAWDHRI': 'Use the engine health block with its not a medical finding notice.',
   'BNN': 'ARI-HLT-002 seven rules, ARI-HLT-003 body table, AVA-HLT-001 planet by sign matrix, guide 16.8. A named disease the register does not name is OPEN.',
   'pitfalls': ['Every disease answer is a tendency and not a medical finding.']},
 'relatives_and_family': {
   'applies_to': ['relationship'], 'question_examples': 'father, mother, siblings, spouse, children, in laws',
   'KPPRO': 'Cards FAM.01 to FAM.06, MAR.01 to MAR.17 and PRG.01 to PRG.08. The sex of a child is the majority of male and female among the sign star and sub lords of the child cusp, the number follows the DBAs of 2,5,11 and a node as the 5th CSL restricts the number.',
   'KCIL': 'Rotation lock first. Spouse 7, mother 4, father 9, first child 5, second child 7, third child 9, elder co born 11, younger co born 3. Then the matrix row. The sex test of the child cusp is nearest rule only, a child sex has no rule register.',
   'SUJ': 'Natural karakas, the divisional chart of the relative D7 for children D3 for siblings D12 for parents D9 for spouse. The number of siblings and children has no validated rule.',
   'CHAWDHRI': 'Father is counted from the 9th by the user decision. Give no scores and no dates for longevity.',
   'BNN': 'Read the relative from the karaka, ARI-DOM-003 family map, RAO-DOM-012 sibling count, RAO-DOM-014 and RAO-DOM-019 birth order, SAK-JUP-032 and RAO-DOM-010 children, guide 16.4 to 16.6. A planet in the frame carries its own relation word, so the Moon in the frame of Mars is an elder sister even when nothing stands behind Jupiter.',
   'pitfalls': ['K894 Q3. BNN took the native as the eldest from RAO-DOM-019 and overrode the Moon elder sister word of ARI-DOM-003. The true family had an elder sister. Do not let an order rule overrule a relation word of a planet that stands in the frame.',
                'K894 Q5. The husband profession is read from the spouse 10th, the native 4th, with the sign and lord of that cusp. Only KP Pro did this and was right.',
                'K894 Q6. BNN called neither parent gone because Jupiter relief stood in the same class. Natal damage to the karakas is capacity and not proof of loss. Both parents were alive.']},
 'income_and_wealth': {
   'applies_to': ['income'], 'question_examples': 'source of income, wealth level',
   'KPPRO': 'WLT.01 to WLT.14. Wealth 2,6,11 against 5,8,12, income flow 2,11 against 12, speculation 2,5,11 against 8,12, inheritance 8 with 2,11, investment 6,11 against 5,8,9,12.',
   'KCIL': 'Matrix rows Financial status 2 with 6,11, Unexpected gains 8 with 2,11, Gain in investment 12 with 2,6,11, Obtaining loans 2,6 with 11.',
   'SUJ': 'Dhana yogas of the 2nd and 11th lords with the 5th and 9th lords, the dasha lords of those houses.',
   'CHAWDHRI': 'The gain block of the engine, Dhana yogas and the natural words gain and wealth.',
   'BNN': 'Wealth is read from Jupiter and Venus karakas and Saturn frame, use the corpus search with the event word.',
   'pitfalls': ['Rental income has no house rule in the sources found. Read it from the 4th with the 11th and say so.']}
}

sources = {
 '_note': 'Registry of every source behind the lexicon. T1 means the owner corpora in this repository or its sibling repositories. T3 means a claim from a web search summary. The pages themselves could not be fetched, every fetch was refused by the network policy, so no page was read and every T3 claim is second hand. T4 means the analyst wrote it from classical karaka lists without a page to cite. Only T1 may be cited as the evidence of a cell.',
 'sources': [
  {'id': 'KPMAX', 'tier': 'T1', 'name': 'KP PRO MAX rule library MAX-12 to MAX-16, 202 cards and the 213 row event index', 'path': 'KP-Pro-sutton/knowledge/kp_pro_max', 'copied_to': 'kp_cards.json, kp_event_index.json'},
  {'id': 'KCILM', 'tier': 'T1', 'name': 'KCIL event matrix KCIL-3, 110 rows', 'path': 'KP-Pro-sutton/knowledge/kcil/KCIL-3-EVENT-MATRIX.md', 'copied_to': 'kcil_event_matrix.json'},
  {'id': 'KCILTA', 'tier': 'T1', 'name': 'KCIL TA house significations KCIL-8 and subject tables of KCIL-5', 'path': 'KP-Pro-sutton/knowledge/kcil', 'copied_to': 'kcil_ta_houses.json, kcil_subjects.json'},
  {'id': 'BNNCSV', 'tier': 'T1', 'name': 'BNN rule base, 3073 rules, searched at run time', 'path': 'sarva_engine/knowledge/bnn/BNN-RULES-5COLUMN.csv', 'copied_to': None},
  {'id': 'CHAWDHRI', 'tier': 'T1', 'name': 'CHAWDHRI engine knowledge and signification module, searched through the CHAWDHRI repo', 'path': 'CHAWDHRI/engine', 'copied_to': None},
  {'id': 'SUJLIB', 'tier': 'T1', 'name': 'SUJ rule library of 1561 rules and the significations.json natural table', 'path': 'suj_engine', 'copied_to': None},
  {'id': 'W1', 'tier': 'T3', 'page_read': False, 'attribution': 'explicit link in the search summary', 'name': 'vedicmarga doctor surgeon combinations', 'url': 'https://vedicmarga.com/doctor-surgeon-combinations-astrology/', 'claim': 'Orthopaedics Saturn the bone planet joined with Mars. Strongest surgeon indicator links Mars to the 10th house, Mars to Ketu, and the 6th or 8th to the 10th. A career reading joins the 10th with the 6th and the D10.'},
  {'id': 'W2', 'tier': 'T3', 'page_read': False, 'attribution': 'explicit link in the search summary', 'name': 'astromedha doctor career', 'url': 'https://astromedha.in/insights/career/doctor-astrology', 'claim': 'Sun Jupiter Mars and Ketu are the main planets of a medical career, the 6th is disease and treatment, the 10th career. Specialty signs are tendencies that refine a chart that already shows a medical career.'},
  {'id': 'W3', 'tier': 'T3', 'page_read': False, 'attribution': 'claim from the search summary, the link is one of the results of that search and is not confirmed as its source', 'name': 'a Vedic site specialty hints', 'url': None, 'claim': 'Eye care the Sun with the 2nd and 12th. Psychiatry the Moon and Mercury with the 4th, 8th and 12th. Radiology and research medicine Rahu. Geriatric and public health Saturn.', 'note': 'The search summary gave the claim without a link, so the page is unlocated.'},
  {'id': 'W4', 'tier': 'T3', 'page_read': False, 'attribution': 'claim from the search summary, the link is one of the results of that search and is not confirmed as its source', 'name': 'a medical astrology article', 'url': 'https://sites.google.com/view/vastu-expert/astrology/medical-astrology', 'claim': 'Gynaecology and obstetrics under the Moon and Venus with the 5th and 7th houses.'},
  {'id': 'W5', 'tier': 'T3', 'page_read': False, 'attribution': 'explicit link in the search summary', 'name': 'astro guide on the 10th cusp sub lord', 'url': 'https://www.ajmerastro.com/mr/blog/kp-career-job-prediction-10th-cusp', 'claim': 'KP 10th sub lord signifying 2,6,10,11 is employment, 2,7,10,11 is business with 6 avoided, 6 service and 7 business.'},
  {'id': 'W6', 'tier': 'T3', 'page_read': False, 'attribution': 'explicit link in the search summary', 'name': 'a KP slide deck', 'url': 'https://www.slideshare.net/slideshow/kp-astrolgy/73135068', 'claim': 'Medical careers from the 9th cusp sub lord. Rahu Moon Sun general physician, Moon Rahu Mars surgeon, 9th sub lord signifying 3,4,9,11 with Saturn taking the 3rd a dentist.', 'note': 'Not verified against a primary KP text. Conflicts with the KP PRO MAX PRF.01 which reads the 10th chain.'},
  {'id': 'W7', 'tier': 'T3', 'page_read': False, 'attribution': 'claim from the search summary, the link is one of the results of that search and is not confirmed as its source', 'name': 'income and dhana yoga pages', 'url': 'https://dailypioneer.com/2025/state-editions/the-secret-of-wealth--fame--and-prestige--importance-of-the-lords-of-the-2nd--10th--and-11th-houses.html', 'claim': 'The 2nd is accumulated wealth, the 11th gains and income, the 5th speculative gains, the 9th sudden gains. Dhana yoga is a link of the 2nd and 11th lords, stronger with the 5th and 9th lords. No source gave a rental income house.'},
  {'id': 'W8', 'tier': 'T3', 'page_read': False, 'attribution': 'claim from the search summary, the link is one of the results of that search and is not confirmed as its source', 'name': 'relatives karaka pages', 'url': 'https://www.siva.sh/phaladeepika/15/21-25', 'claim': 'Brihat Parashara karakas Sun father, Moon mother, Mars siblings, Venus spouse, Rahu paternal relatives, Ketu maternal relatives. The 3rd houses siblings, the 4th mother, the 7th spouse, the 9th father. One table gives the 6th for maternal uncle and the 8th for sister in law.'},
  {'id': 'W9', 'tier': 'T3', 'page_read': False, 'attribution': 'claim from the search summary, the link is one of the results of that search and is not confirmed as its source', 'name': 'spouse profession pages', 'url': 'https://astromedha.in/insights/vedic/what-work-will-my-spouse-do', 'claim': 'The 10th from the 7th is the 4th, the spouse career house. A 10th lord in the 6th points to a service or healthcare spouse. Mars aspecting the 7th points to an assertive or competitive profession. Weigh the 4th, the 10th and the D9.'},
  {'id': 'W10', 'tier': 'T3', 'page_read': False, 'attribution': 'claim from the search summary, the link is one of the results of that search and is not confirmed as its source', 'name': 'skin and dental pages', 'url': 'https://astrosight.ai/horoscopes/medical-astrology-skin-problems', 'claim': 'Mercury is the most direct skin karaka, Venus aesthetics and skin, a troubled Ketu in the 6th skin trouble. Dentistry Mars Scorpio 6th and Saturn in one source, the 7th ruling dental disease in another.'},
 ],
 'limits': ['No source found gives a speciality by speciality table with a classical text behind it. The web results said the same, all marked as practitioner convention.',
            'The coverage of the taxonomy is the 255 entries in taxonomy_*.json and the 202 KP cards, and it grows by adding lines to the DSL files and rebuilding. It is not every type that exists.',
            'No part of the lexicon has been shown to raise accuracy. The only scored use so far is the K894 chart, where the first run of the engine scored 3 of 6 for KP Pro, 0 for KCIL, 2 for SUJ, 1 for CHAWDHRI and 2 for BNN, before this lexicon existed.']
}
json.dump(core, open(os.path.join(OUT, 'core.json'), 'w'), ensure_ascii=False, indent=1)
json.dump(recipes, open(os.path.join(OUT, 'recipes.json'), 'w'), ensure_ascii=False, indent=1)
json.dump(sources, open(os.path.join(OUT, 'sources.json'), 'w'), ensure_ascii=False, indent=1)
print('core, recipes, sources written')
