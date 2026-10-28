"""Build public/assets/js/backhouse-data.js for G01's back-of-house chapter from the
project's Notion hub, exported database by database as CSV (Markdown & CSV export,
kept private, not in this repo). Counts and dates only: no names, no content.

    python3 scripts/backhouse-data.py <folder with the exports> public/assets/js/backhouse-data.js
"""
import sys, csv, json, datetime, collections, pathlib, re
IN = pathlib.Path(sys.argv[1]); OUT = pathlib.Path(sys.argv[2])
def load(glob):
    p = next(IN.rglob(glob)); return list(csv.DictReader(open(p, encoding='utf-8-sig')))
def d(s):
    s = (s or '').strip()
    for f in ('%B %d, %Y', '%m/%d/%Y', '%B %dth, %Y', '%B %dst, %Y', '%B %dnd, %Y', '%B %drd, %Y'):
        try: return datetime.datetime.strptime(s, f).date()
        except ValueError: pass
    s2 = re.sub(r'(\d+)(st|nd|rd|th)', r'\1', s)
    for f in ('%B %d, %Y',):
        try: return datetime.datetime.strptime(s2.split(' (')[0].split(' 8:')[0].split(' 7:')[0].split(' 9:')[0], f).date()
        except ValueError: pass
    return None

tasks = load('CxC MVP Task Tracker*_all.csv')
launch = load('Store Launch Timeline*_all.csv')
ms = load('Milestones*_all.csv')
goals = load('Weekly Goals*_all.csv')
align = load('Weekly Team Alignment*_all.csv')
docs = load('Document Hub*_all.csv')
notes = load('Meeting Notes*_all.csv')
syncs_md = open(next(IN.rglob('Weekly Syncs*.md')), encoding='utf-8').read()
sync_titles = re.findall(r'\[\**(.+?)\**\]\(https', syncs_md)
# the archive's pages within the project's life: everything up to the last May 2026 entry
last = max(i for i, t in enumerate(sync_titles) if '0528' in t)
project_syncs = sync_titles[:last + 1]

# ---- systems (plain names) and their task counts
PLAIN = {
  'Retail Tracker': ('Shopper tracking', 'cameras, RFID and zones'),
  'Agentic AI Capabilities': ('Store AI assistant', 'questions about the store, answered from its data'),
  'Signage System': ('Signage', 'what the screens show, and when'),
  'Training': ('Training and documentation', 'the handbook, demo video and system docs'),
  'Product Media Server': ('Product media server', 'product data and media, kept in the store'),
  'HQ': ('HQ dashboard', 'the remote control room'),
  'Audio System': ('Audio', 'eight channels, mixed per zone'),
  'Mobile Web': ('Mobile web', 'product pages from a QR code; postponed'),
  'CxC HQ Shanghai': ('Shanghai lab', 'the same stack, set up at HQ'),
  'System Integrations': ('Integrations', 'POS and the product catalogue'),
  'Privacy Guardrails': ('Privacy guardrails', 'no faces, no biometrics, frames purged'),
  '': ('Store experience', 'music, events, feedback, the weekly report'),
}
DONE = {'Complete', 'Deployed'}
by = collections.defaultdict(list)
for t in tasks: by[t['System'].strip()].append(t)
systems = []
for key, (name, sub) in PLAIN.items():
    rs = by.get(key, [])
    st = collections.Counter((r['Status'] or 'No status').strip() for r in rs)
    systems.append({'name': name, 'sub': sub, 'n': len(rs), 'done': sum(1 for r in rs if r['Status'].strip() in DONE), 'status': dict(st)})
assert sum(s['n'] for s in systems) == len(tasks) == 116, sum(s['n'] for s in systems)
systems.sort(key=lambda s: -s['n'])
task_status = collections.Counter((r['Status'] or 'No status').strip() for r in tasks)
task_dates = sorted(x for x in (d(r['By Date']) for r in tasks) if x)

# ---- the launch plan (July 2025) and the running plan (milestones)
phases = collections.Counter((r['Phase'] or 'No phase').strip() for r in launch)
dep = sum(1 for r in launch if r['Blocked by'].strip())
flagged = sum(1 for r in launch if r['Milestones'] == 'Yes')
grand = next(r for r in launch if r['Project Name'].strip() == 'Grand Opening')
msn = {r['Property'].strip(): r for r in ms}
teams = collections.Counter()
for r in ms:
    for c in r['Category'].split(','): teams[c.strip()] += 1
def item(lane, label, name, kind='bar', start=None, end=None):
    r = msn[name]
    s, e = d(r['Start date']) or d(r['End date']), d(r['End date'])
    return {'lane': lane, 'label': label, 'kind': kind, 'start': (start or s).isoformat(), 'end': (end or e).isoformat()}
def span(lane, label, names, kind='bar'):
    rs = [msn[n] for n in names]
    s = min(d(r['Start date']) or d(r['End date']) for r in rs); e = max(d(r['End date']) for r in rs)
    return {'lane': lane, 'label': label, 'kind': kind, 'start': s.isoformat(), 'end': e.isoformat()}
plan = [
  item('Business', 'Concept development', 'Concept Development'),
  item('Business', 'Concept pitch', 'Concept Pitch'),
  item('Business', 'Concept approved', 'Concept Approval', 'mark'),
  item('Design', 'Design and spatial planning', 'Design & Spatial Planning'),
  item('Design', 'Design approved', 'Design Approval', 'mark'),
  span('Design', 'Drawings, first and second submission', ['Design Drawing 1st Submission', 'Design Drawing 2nd Submission']),
  item('Design', 'Final renderings signed off', 'Final Design renderings & signoff', 'mark'),
  span('Design', 'Install drawings: LED, speakers, IT', ['LED Structure Install Drawing', 'Speaker Install Drawing', 'IT System Drawing']),
  item('Product', 'Assortment framework', 'Assortment Framework'),
  item('Product', 'Assortment fit to space', 'Assortment fit to Space'),
  item('Product', 'Content programming framework', 'Content Programming Framework'),
  item('Product', 'Product vision execution', 'Product Vision Execution'),
  span('Product', 'Merchandising set-up', ['Merchandising Procurement', 'Merchandising Display Setup']),
  item('Tech', 'AI alignment with UA', 'UA x CxC AI Alignment', 'mark'),
  item('Tech', 'Tech build and integration', 'Tech Build & Integration'),
  item('Tech', 'Phase 1: RFID, heatmap and dwell', 'Phase 1: RFID, Heatmap, & Dwell'),
  item('Tech', 'POS deployment', 'POS Deployment'),
  span('Tech', 'IT hardware and software install', ['IT Hardware Install', 'IT Software System Install']),
  item('Tech', 'IT system testing', 'IT System Testing'),
  item('Tech', 'Phase 2: fixes and optimisation', 'Phase 2: Bug fix + Optimization'),
  item('Construction', 'Fit-out and on-site build', 'Construction'),
  item('Construction', 'LED structure', 'LED Structure Installation'),
  item('Construction', 'LED screen', 'LED Screen Install'),
  item('Construction', 'Fixtures', 'Fixture Installation'),
  item('Construction', 'Landlord inspection', 'LL inspection and final approval', 'mark'),
  item('Operations', 'Staff recruiting and training', 'Staff recruiting & training'),
  item('Operations', 'Site handed to operations', 'Site handover to OPS', 'mark'),
  item('Operations', 'Soft opening', 'Soft Opening', 'mark'),
  item('Operations', 'Opening, as planned in November', 'Store Opening', 'mark'),
  {'lane': 'Operations', 'label': 'Opening, as planned in July', 'kind': 'ghost', 'start': d(grand['Start Date']).isoformat(), 'end': d(grand['End Date']).isoformat()},
  {'lane': 'Operations', 'label': 'Opened, January 23', 'kind': 'open', 'start': '2026-01-23', 'end': '2026-01-23'},
]
LANES = [('Business', 'Concept'), ('Design', 'Design'), ('Product', 'Product and marketing'), ('Tech', 'Tech'), ('Construction', 'Construction'), ('Operations', 'Operations')]

# ---- the weekly layer
goal_dates = sorted(x for x in (d(g['Due date']) for g in goals) if x)
mine = sum(1 for g in goals if 'sener' in g['Owner'].lower())
goal_status = collections.Counter(g['Status'] for g in goals)
align_types = collections.Counter(a['Entry Type'] for a in align if a['Entry Type'])
align_people = len(set(a['Team Member'].strip() for a in align if a['Team Member'].strip()))
align_dates = sorted(x for x in (d(a['Date']) for a in align) if x)
friday = [t for t in project_syncs if 'UA Friday' in t or 'Friday UA' in t]
doc_mine = sum(1 for x in docs if x['Created by'].strip().lower() == 'sener')
note_mine = sum(1 for x in notes if x['Created by'].strip().lower() == 'sener')
training = [t for t in tasks if t['System'].strip() == 'Training']

data = {
  'counts': {
    'launchSteps': len(launch), 'launchPhases': dict(phases), 'launchDeps': dep, 'launchFlagged': flagged,
    'launchFirst': min(d(r['Start Date']) for r in launch).isoformat(), 'launchOpening': d(grand['Start Date']).isoformat(),
    'milestones': len(ms), 'teams': len(teams), 'teamNames': sorted(teams), 'msFirst': min(d(r['Start date']) for r in ms if d(r['Start date'])).isoformat(), 'msLast': max(d(r['End date']) for r in ms).isoformat(),
    'tasks': len(tasks), 'systems': sum(1 for s in systems if s['name'] != 'Store experience'), 'taskStatus': dict(task_status), 'taskDone': task_status['Complete'] + task_status['Deployed'], 'taskFirst': task_dates[0].isoformat(), 'taskLast': task_dates[-1].isoformat(),
    'goals': len(goals), 'goalsMine': mine, 'goalsDone': goal_status['Done'], 'goalFirst': goal_dates[0].isoformat(), 'goalLast': goal_dates[-1].isoformat(),
    'align': len(align), 'alignTypes': dict(align_types), 'alignPeople': align_people, 'alignFirst': align_dates[0].isoformat(), 'alignLast': align_dates[-1].isoformat(),
    'archive': len(project_syncs), 'fridays': len(friday), 'docs': len(docs), 'docsMine': doc_mine, 'notes': len(notes), 'notesMine': note_mine, 'training': len(training),
  },
  'systems': systems, 'plan': plan, 'lanes': LANES,
}
print(json.dumps(data['counts'], indent=1))
js = "// G01's back of house: counts and dates from the project's Notion hub (its databases exported\n// in October 2026), generated by a build script. Process facts only: no names, no store data.\n"
js += 'export const COUNTS = ' + json.dumps(data['counts'], indent=2) + ';\n'
js += 'export const SYSTEMS = ' + json.dumps(systems, indent=2) + ';\n'
# the plan's items and dates stay out of the public module: the page shows phases only
OUT.write_text(js)
print('wrote', OUT, len(js), 'bytes')
