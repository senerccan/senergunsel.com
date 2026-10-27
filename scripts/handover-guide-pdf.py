"""The handover guide as a PDF: the guide's text with the @names, the example meeting line
and the client-internal section 10 removed, set in the site's type."""
import sys, re, html, pathlib, asyncio
src = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8').splitlines()
fonts = pathlib.Path(sys.argv[2]).resolve()
out = pathlib.Path(sys.argv[3])

lines = [l.rstrip().replace('gated — this is how', 'gated: this is how') for l in src]
# title line: drop the @mentions
title = re.sub(r'\s*@\w+', '', lines[0]).strip()
body = lines[1:]
# drop the example meeting note lines and section 10's content
cleaned = []
skip = False
for l in body:
    if l.startswith('Example of a detailed meeting note') or l.strip() == '0416 team meeting':
        continue
    if l.startswith('What has been happening (high-level)'):
        cleaned.append('REMOVED:: What had been happening, system by system, was summarised here for the people taking over. That part is left out of this public copy.')
        skip = True
        continue
    if l.startswith('What still needs doing'):
        skip = False
    if skip:
        continue
    cleaned.append(l)

# classify lines
KEYS = {'What it’s for', 'How to navigate', 'How to keep it current', 'Common update pattern', 'Key properties (how to use them)', 'How to navigate (views)',
        'How to add a new milestone', 'Definition of “Done”', 'How to add a task (recommended)', 'Keeping the tracker healthy (rules of thumb)', 'How to use in a weekly rhythm',
        'Tips for making these entries useful later', 'How to add a new doc entry', '“Done” documentation standard', 'How to add new meetings', 'Maintenance rule', 'What to include',
        'What has been happening (high-level)', 'What still needs doing (how to figure it out quickly)'}
STEPS = {'Create a new entry in the database (use the default template if it appears).', 'Set Category, Status, and Start/End dates.', 'If anything depends on something else, set Blocked by (and/or Blocking).',
         'Keep the title short and action-oriented (e.g., “Deploy signage system vX to GZ store”).', 'Create the task.', 'Set System, Category, Owner, Priority, By Date.', 'If blocked, set Blocked by immediately.',
         'Keep Next Step I as the very next concrete action (not a status statement).', 'Create a row with a clear Doc name.', 'Add Category.', 'Link the file (Drive relation or attached file).',
         'Add a short Text summary (2–6 lines) so people can scan without opening every doc.', 'Open Milestones → By Status and identify anything On hold or In progress.', 'Open Task Tracker and filter for:',
         'Read the last 1–2 relevant meeting note pages in Weekly Syncs.', 'Check Document Hub for any missing handover docs for items marked Done.'}
CHECK = {'Read this guide once end-to-end', 'Open the Project Hub and identify the current primary timeline/status view', 'Review Milestones: what’s In progress / On hold',
         'Review MVP Task Tracker: top High priority items + what’s blocked', 'Read the latest weekly sync notes (and the last major “system update” meeting)',
         'Confirm who owns each System area and how approvals work', 'Make a small contribution: update one task or add one doc summary (to learn the workflow)'}
QUESTIONS = {'What are we building and why? (context, decisions, documents)', 'What’s the current status? (project/milestone health + blockers)', 'What’s next and who owns it? (tasks, action items, weekly updates)'}
SUB = {'Status = In Progress / Testing / Deployed (if post-deploy validation is needed)', 'Priority = High', 'Items with a By Date in the next 2 weeks'}
BULLETS = {'A snapshot of project status (high-level)', 'Links to the systems used by the team (docs, tracker, meetings, etc.)'}
out_html = []
i = 0
def e(s): return html.escape(s)
list_open = None
nested = False
def close_nested():
    global nested
    if nested: out_html.append('</ul></li>'); nested = False
def close_list():
    global list_open
    close_nested()
    if list_open: out_html.append('</' + list_open + '>'); list_open = None
for l in cleaned:
    t = l.strip()
    if not t:
        continue
    if t.startswith('REMOVED::'):
        close_list(); out_html.append('<p class="removed">' + e(t[9:].strip()) + '</p>'); continue
    m = re.match(r'^(\d+)\) (.+)$', t)
    if m:
        close_list(); out_html.append('<h2><span>' + m.group(1) + '</span>' + e(m.group(2)) + '</h2>'); continue
    if t in KEYS:
        close_list(); out_html.append('<h3>' + e(t) + '</h3>'); continue
    if t.startswith('Page: ') or t.startswith('Database: '):
        close_list(); k, v = t.split(': ', 1); out_html.append('<p class="where"><span>' + e(k) + '</span>' + e(v) + '</p>'); continue
    if t in SUB and list_open == 'ol':
        if not nested: out_html[-1] = out_html[-1][:-5] + '<ul>'; nested = True
        out_html.append('<li>' + e(t) + '</li>'); continue
    close_nested()
    if t in STEPS or t in QUESTIONS:
        if list_open != 'ol': close_list(); out_html.append('<ol>'); list_open = 'ol'
        out_html.append('<li>' + e(t) + '</li>'); continue
    if t in BULLETS:
        if list_open != 'ul': close_list(); out_html.append('<ul>'); list_open = 'ul'
        out_html.append('<li>' + e(t) + '</li>'); continue
    if t in CHECK:
        if list_open != 'ul': close_list(); out_html.append('<ul class="check">'); list_open = 'ul'
        out_html.append('<li>' + e(t) + '</li>'); continue
    # a bullet: "Key: text" lines under a key heading, and the spine list
    if re.match(r'^(Project hub|Execution|Milestones / project plan|Weekly reporting|Meeting archive|Documents|Quick access|People map|Status|Start date / End date|Category|Blocked by / Blocking|By Status|All Projects|Gantt|Task \(title\)|Priority|Owner|By Date|Category / System|Notes / Next Steps / Finalization|Team Member|Entry Type|Progress Status|Weekly Goals / Benchmarks|Monday Prep|Mid-week|Friday Wrap-up|Doc name \(title\)|Reviewers|Google Drive File / Files & media|Text|Names \+ role|Who owns|Who approves|Recommended|an Owner|a next step|a date|Status = |Priority = |Items with|Link to the|a doc entry|a link to)', t) or t.startswith('The ') and l.startswith('The ') and len(t) < 90 and t.endswith(('view(s)', '(high-level)', 'etc.)')):
        if list_open != 'ul': close_list(); out_html.append('<ul>'); list_open = 'ul'
        out_html.append('<li>' + e(t) + '</li>'); continue
    close_list(); out_html.append('<p>' + e(t) + '</p>')
close_list()

doc = '''<!doctype html><html lang="en"><head><meta charset="utf-8"><title>''' + e(title) + '''</title><style>
@font-face { font-family: "Archivo"; src: url("file://''' + str(fonts) + '''/archivo-latin.woff2") format("woff2"); font-weight: 100 900; }
@font-face { font-family: "IBM Plex Mono"; src: url("file://''' + str(fonts) + '''/plex-mono-latin-400.woff2") format("woff2"); font-weight: 400; }
@font-face { font-family: "IBM Plex Mono"; src: url("file://''' + str(fonts) + '''/plex-mono-latin-600.woff2") format("woff2"); font-weight: 600; }
@page { size: A4; margin: 22mm 20mm 24mm; }
html { font-family: "Archivo", Arial, sans-serif; color: #121211; font-size: 11pt; line-height: 1.5; }
body { margin: 0; }
.head { border-bottom: 3px solid #121211; padding-bottom: 12px; margin-bottom: 18px; }
.kicker { font-family: "IBM Plex Mono", monospace; font-size: 8.5pt; letter-spacing: 0.1em; text-transform: uppercase; color: #66665F; margin: 0 0 8px; }
h1 { font-size: 24pt; line-height: 1.05; letter-spacing: -0.02em; margin: 0 0 8px; font-weight: 800; }
.lede { margin: 0; color: #4A4A45; font-size: 11pt; }
.note { margin: 14px 0 0; padding: 10px 12px; border-left: 3px solid #FF4F00; background: #FFF1EA; font-size: 10pt; color: #4A4A45; }
h2 { font-size: 15pt; margin: 22px 0 6px; letter-spacing: -0.01em; display: flex; gap: 10px; align-items: baseline; page-break-after: avoid; }
h2 span { font-family: "IBM Plex Mono", monospace; font-size: 9pt; color: #FF4F00; letter-spacing: 0.06em; }
h3 { font-size: 11pt; margin: 12px 0 3px; font-weight: 700; page-break-after: avoid; }
p { margin: 0 0 7px; }
.where { font-family: "IBM Plex Mono", monospace; font-size: 9pt; color: #66665F; margin: 0 0 8px; }
.where span { text-transform: uppercase; letter-spacing: 0.08em; margin-right: 8px; }
ul, ol { margin: 0 0 8px; padding-left: 20px; }
li { margin: 0 0 3px; }
ul.check { list-style: none; padding-left: 0; }
ul.check li::before { content: "☐"; font-family: "IBM Plex Mono", monospace; margin-right: 8px; color: #66665F; }
.removed { font-style: italic; color: #66665F; padding: 8px 12px; border: 1px dashed #B5B5AE; }
.foot { margin-top: 26px; padding-top: 10px; border-top: 1px solid #B5B5AE; font-family: "IBM Plex Mono", monospace; font-size: 8.5pt; color: #66665F; }
</style></head><body>
<div class="head"><p class="kicker">Under Armour × CxC · Guangzhou · Handover, April 2026</p><h1>''' + e(title) + '''</h1>
<p class="lede">The onboarding and knowledge-transfer guide for the project's Notion workspace: what each area is for, how to navigate it, and how to keep it up to date.</p>
<p class="note">Public copy from senergunsel.com. Names, the example meeting page and the summary of the systems' status at handover are removed. Written by Sener Can Gunsel for the people taking the workspace on.</p></div>
''' + '\n'.join(out_html) + '''
<p class="foot">senergunsel.com/projects/under-armour-flagship/ · The hub this guide describes is drawn there, room by room.</p>
</body></html>'''
pathlib.Path('guide.html').write_text(doc, encoding='utf-8')

async def render():
    from playwright.async_api import async_playwright
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=['--no-proxy-server'])
        pg = await b.new_page()
        await pg.goto('file://' + str(pathlib.Path('guide.html').resolve()))
        await pg.evaluate('document.fonts.ready')
        await pg.pdf(path=str(out), format='A4', print_background=True, display_header_footer=True,
                     header_template='<div></div>',
                     footer_template='<div style="width:100%;font-family:IBM Plex Mono,monospace;font-size:7.5pt;color:#66665F;padding:0 20mm;display:flex;justify-content:space-between"><span>CxC Workspace Guide · public copy</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
                     margin={'top': '22mm', 'bottom': '24mm', 'left': '20mm', 'right': '20mm'})
        await b.close()
asyncio.run(render())
print('wrote', out, out.stat().st_size)
