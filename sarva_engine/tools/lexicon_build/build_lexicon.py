#!/usr/bin/env python3
"""Build sarva_engine/knowledge/lexicon/*.json from the DSL files in data/ plus the core tables below.
Run from the repository root.  python3 sarva_engine/tools/lexicon_build/build_lexicon.py
Provenance rule. Every sentence of an entry note is tagged by its origin from its first word.
KP, KCIL, BNN, CHAWDHRI are the owner's own corpora (tier T1). WEB means a web search result (tier T3, blog grade).
The vedic, kp and kcil house fields of an entry are the analyst's reading of those sources and of classical karaka lists
from the model's memory, tier T4 unless a T1 sentence backs them. A T3 or T4 item can only translate an option into
houses and planets. It is never cited as the evidence of a cell."""
import json, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'knowledge', 'lexicon')

def csv(s): return [x.strip() for x in s.split(',') if x.strip()]

def tag_sentences(note):
    out = []
    for s in re.split(r'(?<=[.])\s+(?=[A-Z])', note.strip()):
        s = s.strip()
        if not s: continue
        w = s.split()[0]
        if w.startswith('KP'): src = 'KP'
        elif w.startswith('KCIL'): src = 'KCIL'
        elif w.startswith('BNN'): src = 'BNN'
        elif w.startswith('Chawdhri'): src = 'CHAWDHRI'
        elif w in ('A', 'Web', 'Web.') and 'web' in s.lower()[:25]: src = 'WEB'
        elif w.startswith('Web'): src = 'WEB'
        elif 'web source' in s.lower() or 'web convention' in s.lower(): src = 'WEB'
        elif 'SUJ' in s[:12]: src = 'SUJ'
        else: src = 'NOTE'
        # sentences that open with KP or KCIL but cite a web source are still owner corpus text
        out.append({'src': src, 'text': s})
    return out

def parse_file(path, cat):
    items = []
    for ln in open(path, encoding='utf-8'):
        ln = ln.rstrip('\n')
        if not ln.strip() or ln.startswith('#'): continue
        f = [x.strip() for x in ln.split(' | ')]
        if len(f) != 8: raise SystemExit('bad line in %s: %s (%d fields)' % (path, ln[:60], len(f)))
        id_, name, aliases, v, kp, kc, bnn, note = f
        vh, vp, vs = (v[2:].split(';') + ['', '', ''])[:3]
        kh, kpl, kcd = (kp[3:].split(';') + ['', '', ''])[:3]
        kpr, ksu, kta = (kc[3:].split(';') + ['', '', ''])[:3]
        ev = tag_sentences(note)
        if id_.startswith('med.') and not id_.startswith('med.sports'):
            surg = id_ in ('med.surgeon', 'med.ortho', 'med.spine', 'med.neurosurgery', 'med.cardiacsurgery', 'med.oralsurgery', 'med.proctology', 'med.cosmetology')
            kpr = '8,10' if surg else '6,10'
            ksu = '2,6,11' if not surg else '2,11'
        if id_.startswith('deg.'):
            kpr, ksu = '4,9', '11,6'
        srcs = {e['src'] for e in ev}
        items.append({
            'id': id_, 'cat': cat, 'name': name,
            'aliases': [a.strip() for a in aliases.split(';') if a.strip()],
            'vedic': {'houses': [int(x) for x in csv(vh)], 'planets': csv(vp), 'signs': csv(vs), 'tier': 'T4'},
            'kp': {'houses': [int(x) for x in csv(kh)], 'csl_planets': csv(kpl), 'cards': csv(kcd), 'tier': 'T1' if 'KP' in srcs else 'T4'},
            'kcil': {'primary': [int(x) for x in csv(kpr)], 'supporting': [int(x) for x in csv(ksu)], 'ta_houses': [int(x) for x in csv(kta)], 'tier': 'T1' if 'KCIL' in srcs else 'T4', 'note': 'primary and supporting are the event matrix cusps, Medical practitioner 6 or 8 with 10 and Surgeons 8,10, or 4,9 for a degree. The speciality itself comes from ta_houses, the TA lists of professions and education per house.' if id_.startswith(('med.','deg.')) else ''},
            'bnn_keywords': csv(bnn),
            'evidence': ev,
            'best_tier': 'T1' if srcs & {'KP', 'KCIL', 'BNN', 'CHAWDHRI'} else ('T3' if 'WEB' in srcs else 'T4')
        })
    return items

CATS = [('medical', 'medical'), ('professions', 'profession'), ('business', 'business'), ('diseases', 'disease'), ('income', 'income'), ('relations', 'relationship')]
allitems, counts = [], {}
for fn, cat in CATS:
    its = parse_file(os.path.join(HERE, 'data', fn + '.txt'), cat)
    json.dump(its, open(os.path.join(OUT, 'taxonomy_%s.json' % fn), 'w'), ensure_ascii=False, indent=1)
    counts[fn] = len(its); allitems += its
ids = [i['id'] for i in allitems]
assert len(ids) == len(set(ids)), 'duplicate ids'
print(counts, 'total', len(allitems))
