#!/usr/bin/env python3
"""Extract the owner's own KP Pro MAX cards and KCIL tables into JSON for the SARVA lexicon.
Usage: python3 extract_corpora.py /path/to/KP-Pro-sutton /path/to/out_dir
Nothing is rewritten. Text is copied as is, with the source file and heading, so every lexicon answer can be traced."""
import json, re, sys, os
kp, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)

def cards(path, fname):
    t = open(path, encoding='utf-8').read().split('\n')
    res, cur, sec = [], None, None
    for ln in t:
        m = re.match(r'^## ([A-Z]+(?:\.[A-Z]+)?\.\d+) — (.+)$', ln)
        if m:
            cur = {'code': m.group(1), 'title': m.group(2).strip(), 'file': fname, 'houses': '', 'sections': {}}
            res.append(cur); sec = None; continue
        if cur is None: continue
        if ln.startswith('**Houses:**'):
            cur['houses'] = ln.replace('**Houses:**', '').strip(); continue
        m = re.match(r'^### (.+)$', ln)
        if m:
            sec = m.group(1).strip(); cur['sections'][sec] = []; continue
        if ln.startswith('- ') or ln.startswith('  - '):
            cur['sections'].setdefault(sec or 'Body', []).append(ln.strip()[2:].strip())
    return res

allc = []
base = os.path.join(kp, 'knowledge', 'kp_pro_max')
for f in ['MAX-13-LIB-CARDS-LIFE.md', 'MAX-14-LIB-CARDS-RELATIONS.md', 'MAX-15-LIB-CARDS-WORK-MONEY.md', 'MAX-16-LIB-CARDS-TRAVEL-LIT-MINOR.md']:
    allc += cards(os.path.join(base, f), f)
json.dump(allc, open(os.path.join(out, 'kp_cards.json'), 'w'), ensure_ascii=False, indent=1)

# MAX-12 event index
idx = []
for ln in open(os.path.join(base, 'MAX-12-EVENT-INDEX.md'), encoding='utf-8'):
    m = re.match(r'^\| ([A-Z]+(?:\.[A-Z]+)?\.\d+) \| (.+?) \| (.*?) \| (.*?) \|$', ln.strip())
    if m: idx.append({'code': m.group(1), 'matter': m.group(2), 'houses': m.group(3), 'card': m.group(4)})
json.dump(idx, open(os.path.join(out, 'kp_event_index.json'), 'w'), ensure_ascii=False, indent=1)

# KCIL event matrix
rows, grp = [], ''
for ln in open(os.path.join(kp, 'knowledge', 'kcil', 'KCIL-3-EVENT-MATRIX.md'), encoding='utf-8'):
    m = re.match(r'^### (\d+) — (.+)$', ln.strip())
    if m: grp = m.group(2); continue
    m = re.match(r'^\| (.+?) \| (.+?) \| (.+?) \|$', ln.strip())
    if m and m.group(1) not in ('Query', '---') and not m.group(1).startswith('---'):
        rows.append({'matter': m.group(1).replace('**', '').strip(), 'primary': m.group(2).replace('**', '').strip(), 'supporting': m.group(3).replace('**', '').strip(), 'group': grp})
json.dump(rows, open(os.path.join(out, 'kcil_event_matrix.json'), 'w'), ensure_ascii=False, indent=1)

# KCIL TA house significations and KAL 118 subject table
txt = open(os.path.join(kp, 'knowledge', 'kcil', 'KCIL-8-SIGNIFICATIONS.md'), encoding='utf-8').read()
houses, h = {}, None
for ln in txt.split('\n'):
    m = re.match(r'^### House (\d+)', ln)
    if m: h = m.group(1); houses[h] = {'lines': []}; continue
    if h and ln.strip().startswith('- **'):
        houses[h]['lines'].append(ln.strip()[2:])
    elif h and houses[h]['lines'] and ln.startswith('  ') and ln.strip():
        houses[h]['lines'][-1] += ' ' + ln.strip()
json.dump(houses, open(os.path.join(out, 'kcil_ta_houses.json'), 'w'), ensure_ascii=False, indent=1)
pl = open(os.path.join(kp, 'knowledge', 'kcil', 'KCIL-5-PLAYBOOKS.md'), encoding='utf-8').read().split('\n')
sub = {'planet_subjects': [], 'cusp_subjects': []}
for i, ln in enumerate(pl):
    m = re.match(r'^\| \*\*(Moon|Sun|Mars|Mercury|Venus|Jupiter|Saturn|Rahu & Ketu)\*\* \| (.+) \|$', ln.strip())
    if m: sub['planet_subjects'].append({'planet': m.group(1), 'subjects': m.group(2)})
    m = re.match(r'^\| \*\*(\d+)\*\* \| (.+) \|$', ln.strip())
    if m and ',' in m.group(2) and 600 < i < 700: sub['cusp_subjects'].append({'cusp': m.group(1), 'subjects': m.group(2)})
json.dump(sub, open(os.path.join(out, 'kcil_subjects.json'), 'w'), ensure_ascii=False, indent=1)
print(len(allc), 'cards', len(idx), 'index', len(rows), 'matrix rows', len(houses), 'TA houses', len(sub['planet_subjects']), len(sub['cusp_subjects']))
