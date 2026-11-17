# SARVA signification lexicon

A dictionary that turns a question option, such as Gynecologist, Government job, Diabetes, Husband profession, into the houses, planets,
signs, KP cards, KCIL cusps and BNN rule candidates that each methodology reads. It is not a methodology, it gives no verdict and it is
never a tie breaker. ENGINE_CONTRACT.md section 12 binds its use.

## Files
- taxonomy_medical.json 58 entries, specialities and degrees. taxonomy_professions.json 54. taxonomy_business.json 32. taxonomy_diseases.json 49.
  taxonomy_income.json 25. taxonomy_relations.json 37 relatives and family questions. Total 255, English and Hindi aliases.
- kp_cards.json the 202 KP PRO MAX library cards copied as is from KP-Pro-sutton, with kp_event_index.json, 213 matters.
- kcil_event_matrix.json 110 rows, kcil_ta_houses.json the profession, education, disease lists per house, kcil_subjects.json.
- core.json house, planet and sign tables and the derived house rotation. recipes.json one recipe per question family and column, with the pitfalls the scored cases showed. sources.json the registry.
- BNN is not copied. The tool searches the BNN csv at run time and prints rule candidates.

## Tiers
T1 the owner corpora in this repository and its siblings, KP PRO MAX, KCIL, BNN, CHAWDHRI, SUJ library. Only T1 sentences may be cited in an EVIDENCE line,
and only by the column that owns the corpus. T3 a claim from a web search summary. No page could be fetched in the session that built this, so every T3 claim is second hand and blog grade.
T4 the analyst's karaka lists from memory. T3 and T4 may translate an option into houses and planets and may not be cited.

## Use
    node sarva_engine/tools/sarva_lexicon.js --options "A Gynecologist|B Pediatrician|C Dentist|D Skin specialist" --family
    node sarva_engine/tools/sarva_lexicon.js --options "..." --column KCIL
    node sarva_engine/tools/sarva_lexicon.js "पति का कार्यक्षेत्र" --family
    node sarva_engine/tools/sarva_lexicon.js --card PRF.01     node sarva_engine/tools/sarva_lexicon.js --check

## Extend
Add lines to sarva_engine/tools/lexicon_build/data/*.txt, one line per entry, eight fields separated by space bar space. A note sentence that starts with KP, KCIL, BNN or Chawdhri
must come from that corpus. A sentence from the web starts with Web or A web source. Then run python3 sarva_engine/tools/lexicon_build/build_lexicon.py, and
python3 sarva_engine/tools/lexicon_build/build_core.py when core, recipes or sources change, then node sarva_engine/tests/lexicon_test.js. To refresh the KP and KCIL copies run
python3 sarva_engine/tools/lexicon_build/extract_corpora.py /path/to/KP-Pro-sutton sarva_engine/knowledge/lexicon.

## Honest limits
- Not every type that exists. 255 entries and the 202 KP cards.
- No speciality by speciality table with a classical text behind it was found. The web summaries said the same. The medical speciality rows rest on the KCIL TA lists, the KP house keys of HLT.01, the KP PRF.01 medicine bullets, and karaka lists from memory.
- The network policy of the building session refused every page fetch. The hosts were added by the owner through an environment change but the proxy had not picked them up. Fetch the pages named in sources.json when the hosts resolve and upgrade T3 to read claims.
- Never shown to raise accuracy. The only scored chart, K894, was scored before the lexicon existed. The next chart is the first test.
