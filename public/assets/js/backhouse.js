// G01 · the back of house: the project's Notion hub drawn as a plan, the launch plan as a
// strip, and the systems the store is made of. Counts and dates come from backhouse-data.js;
// the room descriptions are written here. Process facts only: no names, no store data.
import { COUNTS, SYSTEMS, LANES, PLAN } from './backhouse-data.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const lab = $('#hub');
const C = COUNTS;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const day = (iso) => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const fmt = (iso, year = false) => { const [y, m, d] = iso.split('-').map(Number); return MONTHS[m - 1] + ' ' + d + (year ? ', ' + y : ''); };
const weeks = (a, b) => Math.max(1, Math.round((day(b) - day(a)) / (7 * 864e5)));

/* ---------------------------------------------------------------- The rooms */
const Q = { why: 'What are we building, and why?', status: "What's the status?", next: "What's next, and who owns it?" };
const ROOMS = [
  { id: 'hub', code: 'H0', q: 'why', name: 'Project hub', count: 'where you land', area: '1 / 1 / 3 / 4',
    held: 'The front door. The launch plan in five views, a status board and a link to every other room. I kept it light on purpose: it points at live views instead of repeating them, so a milestone changed once shows up everywhere.',
    fields: ['Timeline', 'Board by status', 'Table by phase', 'Calendar', 'Board by team'] },
  { id: 'launch', code: 'H1', q: 'status', name: 'Launch plan', count: C.launchSteps + ' steps', area: '1 / 4 / 3 / 8',
    held: 'The plan I wrote in July 2025 for getting the store open: ' + C.launchSteps + ' steps in five phases (planning, design, development, launch, review), ' + C.launchDeps + ' of them chained to the step they waited on, ' + C.launchFlagged + ' flagged as milestones. It aimed at opening on ' + fmt(C.launchOpening) + '.',
    fields: ['Phase', 'Duration', 'Start', 'End', 'Blocked by', 'Blocking', 'Milestone', 'Status'] },
  { id: 'milestones', code: 'H2', q: 'status', name: 'Milestones', count: C.milestones + ' milestones', area: '1 / 8 / 3 / 13',
    held: 'The running plan: ' + C.milestones + ' milestones across seven teams (business, design, product and marketing, tech, finance, construction, operations) from concept development in May 2025 to the fixes after opening in March 2026, each with a blocked-by chain. A milestone counted as done only when it was deployed and its documentation was linked.',
    fields: ['Status', 'Start', 'End', 'Category', 'Blocked by', 'Blocking'] },
  { id: 'tasks', code: 'H3', q: 'next', name: 'Task tracker', count: C.tasks + ' tasks', area: '3 / 1 / 5 / 6',
    held: 'Day-to-day execution after the opening: ' + C.tasks + ' tasks across ' + C.systems + ' systems from ' + fmt(C.taskFirst) + ' to ' + fmt(C.taskLast, true) + ', each with an owner, a priority, a date and the very next concrete step. ' + C.taskDone + ' were complete or deployed by mid-March.',
    fields: ['System', 'Category', 'Owner', 'Priority', 'By date', 'Status', 'Next step', 'Notes', 'Internal questions'] },
  { id: 'goals', code: 'H4', q: 'next', name: 'Weekly goals', count: C.goals + ' goals', area: '3 / 6 / 5 / 9',
    held: C.goals + ' goals set in August and September 2025, each with an owner, a priority, a due date and the milestone it served. ' + C.goalsMine + ' were mine, among them the three-tier cost model that became the rollout sizing, the meeting cadence, and the AI call summaries. ' + C.goalsDone + ' got done.',
    fields: ['Owner', 'Priority', 'Due date', 'Milestone', 'Status'] },
  { id: 'align', code: 'H5', q: 'status', name: 'Weekly alignment', count: C.align + ' entries', area: '3 / 9 / 5 / 11',
    held: 'The first month’s written rhythm: ' + C.alignTypes['Monday Prep'] + ' Monday prep and ' + C.alignTypes['Friday Wrap-up'] + ' Friday wrap-up entries from ' + C.alignPeople + ' people, written so someone new could follow the project without having been in the room.',
    fields: ['Entry type', 'Weekly goals', 'Top 3 wins', 'Challenges', 'Support needed', 'Next steps', 'Progress status'] },
  { id: 'archive', code: 'H6', q: 'why', name: 'Meeting archive', count: C.archive + ' pages', area: '3 / 11 / 5 / 13',
    held: C.archive + ' meeting pages over the project’s life: the weekly syncs, the numbered Friday meeting with Under Armour’s teams, UX, marketing and display-system meetings, install coordination, the first floorset-change feedback in April 2026, the AI onboarding session for UA, and a learnings page. Summary first, then decisions and action items.',
    fields: ['One page per meeting', 'Summary', 'Decisions', 'Action items'] },
  { id: 'docs', code: 'H7', q: 'why', name: 'Document hub', count: C.docs + ' documents', area: '5 / 1 / 6 / 4',
    held: 'The written artifacts, ' + C.docsMine + ' of them mine: technical specs, construction, cost estimates, the first brief and the first pitch, the timeline, store-visit research, materials. Each with a category, reviewers, the file and a short summary so people could scan without opening everything.',
    fields: ['Category', 'Reviewers', 'File', 'Summary'] },
  { id: 'notes', code: 'H8', q: 'why', name: 'Meeting notes', count: C.notes + ' notes', area: '5 / 4 / 6 / 7',
    held: C.notes + ' meeting notes with attendees and a category, ' + C.notesMine + ' of them mine. Each one summarised itself: an AI summary column sat next to the transcript, so the archive could be read in minutes.',
    fields: ['Attendees', 'Category', 'Date', 'AI summary', 'Transcript'] },
  { id: 'people', code: 'H9', q: 'next', name: 'People and links', count: 'who owns what', area: '5 / 7 / 6 / 10',
    held: 'The org chart: names, roles, who owned which system (signage, pop-up, analytics) and who approved what. Next to it the quick links, kept short: if a link wasn’t used weekly, it didn’t belong there.',
    fields: ['Role', 'System owned', 'Approves'] },
  { id: 'agent', code: 'AI', q: 'status', name: 'Status reporter', count: 'a Notion agent', area: '5 / 10 / 6 / 13',
    held: 'An agent set up inside the hub to draft the weekly status report from what the databases held, so the Friday wrap-up started from a draft instead of a blank page.',
    fields: ['Drafts the weekly status'] },
];

function drawRooms() {
  const plan = $('[data-plan]', lab);
  plan.innerHTML = ROOMS.map((r) => '<button type="button" class="bh-room q-' + r.q + '" data-room="' + r.id + '" style="grid-area:' + r.area + '" aria-pressed="false">' +
    '<span class="bh-code">' + esc(r.code) + '</span><span class="bh-name">' + esc(r.name) + '</span><span class="bh-count">' + esc(r.count) + '</span><span class="bh-q">' + esc(r.q) + '</span></button>').join('');
}
function showRoom(id) {
  const r = ROOMS.find((x) => x.id === id) || ROOMS[0];
  $$('[data-room]', lab).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.room === r.id)));
  const panel = $('[data-room-panel]', lab);
  panel.innerHTML = '<p class="bh-panel-k"><span class="bh-code">' + esc(r.code) + '</span> ' + esc(r.name) + '</p>' +
    '<p class="bh-panel-q">' + esc(Q[r.q]) + '</p>' +
    '<p class="bh-panel-held">' + esc(r.held) + '</p>' +
    '<p class="bh-panel-f"><span>' + (r.id === 'agent' ? 'Does' : r.id === 'archive' ? 'Each page' : 'Fields') + '</span>' + r.fields.map((f) => '<span class="bh-field">' + esc(f) + '</span>').join('') + '</p>';
}

/* ---------------------------------------------------------------- The launch plan strip */
const chart = { plan: { idx: 0, api: null }, sys: { idx: 0, api: null } };
function tipShow(el, html, x, y) {
  let tip = $('.tip', el);
  if (!tip) { tip = document.createElement('div'); tip.className = 'tip'; tip.setAttribute('aria-hidden', 'true'); el.appendChild(tip); }
  tip.innerHTML = html;
  tip.hidden = false;
  const W = el.clientWidth;
  let left = x + 14;
  if (left + tip.offsetWidth > W) left = Math.max(0, x - tip.offsetWidth - 14);
  tip.style.left = left + 'px';
  tip.style.top = Math.max(0, y - tip.offsetHeight - 10) + 'px';
}
function tipHide(el) { const tip = $('.tip', el); if (tip) tip.hidden = true; }

function drawPlan() {
  const el = $('[data-chart="plan"]', lab);
  const W = Math.max(el.parentElement.clientWidth, 680); // the scroller's width; phones scroll the strip sideways
  const t0 = Date.UTC(2025, 5, 1), t1 = Date.UTC(2026, 3, 1);
  const m = { l: 112, r: 16, t: 26, b: 8 };
  const x = (iso) => m.l + ((day(iso) - t0) / (t1 - t0)) * (W - m.l - m.r);
  const CH = 6.3, rowH = 22, laneGap = 8;
  // pack each lane's items into rows by their drawn extent (bar or mark plus its label)
  const lanes = LANES.map(([key, name]) => {
    const items = PLAN.filter((p) => p.lane === key).map((p) => {
      const x0 = x(p.start), x1 = p.kind === 'bar' ? Math.max(x(p.end), x0 + 4) : x0;
      const lw = p.label.length * CH + 8;
      const inside = p.kind === 'bar' && x1 - x0 > lw + 6;
      let lx0, lx1, anchor;
      if (inside) { lx0 = x0; lx1 = x1; anchor = 'in'; }
      else if (x1 + 8 + lw < W - m.r) { lx0 = x0; lx1 = x1 + 8 + lw; anchor = 'right'; }
      else { lx0 = x0 - 8 - lw; lx1 = x1; anchor = 'left'; }
      return { ...p, x0, x1, lx0: Math.min(lx0, x0 - (p.kind === 'bar' ? 0 : 7)), lx1: Math.max(lx1, x1 + (p.kind === 'bar' ? 0 : 7)), anchor };
    }).sort((a, b) => a.x0 - b.x0 || a.x1 - b.x1);
    const rows = [];
    items.forEach((it) => {
      let r = rows.findIndex((end) => it.lx0 > end + 6);
      if (r < 0) { r = rows.length; rows.push(it.lx1); } else rows[r] = it.lx1;
      it.row = r;
    });
    return { key, name, items, rows: rows.length };
  });
  const H = m.t + lanes.reduce((h, l) => h + l.rows * rowH + laneGap * 2, 0) + m.b;
  let svg = '', y = m.t;
  // months
  for (let mo = 0; mo < 10; mo++) {
    const d = new Date(Date.UTC(2025, 5 + mo, 1));
    const iso = d.toISOString().slice(0, 10), xx = x(iso);
    svg += '<line class="grid" x1="' + xx.toFixed(1) + '" x2="' + xx.toFixed(1) + '" y1="' + (m.t - 6) + '" y2="' + (H - m.b) + '"></line>';
    svg += '<text class="tick" x="' + (xx + 4).toFixed(1) + '" y="' + (m.t - 10) + '">' + MONTHS[d.getUTCMonth()] + (d.getUTCMonth() === 0 ? ' ' + d.getUTCFullYear() : '') + '</text>';
  }
  const pos = [];
  lanes.forEach((lane, li) => {
    const laneH = lane.rows * rowH + laneGap * 2;
    if (li) svg += '<line class="sep" x1="0" x2="' + W + '" y1="' + y + '" y2="' + y + '"></line>';
    svg += '<text class="lane" x="0" y="' + (y + laneGap + 15) + '">' + esc(lane.name) + '</text>';
    lane.items.forEach((it) => {
      const cy = y + laneGap + it.row * rowH + rowH / 2;
      if (it.kind === 'bar') {
        svg += '<rect class="pl-bar" x="' + it.x0.toFixed(1) + '" y="' + (cy - 7) + '" width="' + (it.x1 - it.x0).toFixed(1) + '" height="14"></rect>';
        if (it.anchor === 'in') svg += '<text class="pl-in" x="' + (it.x0 + 6).toFixed(1) + '" y="' + (cy + 4) + '">' + esc(it.label) + '</text>';
        else if (it.anchor === 'right') svg += '<text class="pl-t" x="' + (it.x1 + 8).toFixed(1) + '" y="' + (cy + 4) + '">' + esc(it.label) + '</text>';
        else svg += '<text class="pl-t" x="' + (it.x0 - 8).toFixed(1) + '" y="' + (cy + 4) + '" text-anchor="end">' + esc(it.label) + '</text>';
      } else {
        const cls = it.kind === 'open' ? 'pl-open' : it.kind === 'ghost' ? 'pl-ghost' : 'pl-mark';
        if (it.kind === 'open') svg += '<circle class="' + cls + '" cx="' + it.x0.toFixed(1) + '" cy="' + cy + '" r="6"></circle>';
        else svg += '<rect class="' + cls + '" x="' + (it.x0 - 5).toFixed(1) + '" y="' + (cy - 5) + '" width="10" height="10" transform="rotate(45 ' + it.x0.toFixed(1) + ' ' + cy + ')"></rect>';
        const tcls = it.kind === 'open' ? 'pl-t pl-t-open' : it.kind === 'ghost' ? 'pl-t pl-t-ghost' : 'pl-t';
        if (it.anchor === 'left') svg += '<text class="' + tcls + '" x="' + (it.x0 - 10).toFixed(1) + '" y="' + (cy + 4) + '" text-anchor="end">' + esc(it.label) + '</text>';
        else svg += '<text class="' + tcls + '" x="' + (it.x0 + 10).toFixed(1) + '" y="' + (cy + 4) + '">' + esc(it.label) + '</text>';
      }
      pos.push({ x: it.kind === 'bar' ? (it.x0 + it.x1) / 2 : it.x0, y: cy, x0: it.lx0, x1: it.lx1, it, lane: lane.name });
    });
    y += laneH;
  });
  svg += '<rect class="pl-focus" width="0" height="0" visibility="hidden"></rect>';
  pos.forEach((p, i) => { svg += '<rect class="hit" data-i="' + i + '" x="' + p.x0.toFixed(1) + '" y="' + (p.y - rowH / 2) + '" width="' + Math.max(12, p.x1 - p.x0).toFixed(1) + '" height="' + rowH + '"></rect>'; });
  el.innerHTML = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true" focusable="false">' + svg + '</svg>';
  el.style.minWidth = W + 'px';
  const what = (p) => p.it.kind === 'bar' ? fmt(p.it.start) + ' to ' + fmt(p.it.end, true) + ', ' + weeks(p.it.start, p.it.end) + ' week' + (weeks(p.it.start, p.it.end) === 1 ? '' : 's') : fmt(p.it.start, true);
  const wrap = el.closest('.chart'), scroller = el.parentElement;
  scroller.tabIndex = 0;
  scroller.setAttribute('role', 'group');
  scroller.setAttribute('aria-label', 'The store launch plan, June 2025 to March 2026, by team: ' + pos.map((p) => p.it.label + ' (' + p.lane + ', ' + what(p) + ')').join('; ') + '. Use the arrow keys to step through the items.');
  let sr = $('.chart-sr', wrap);
  if (!sr) { sr = document.createElement('p'); sr.className = 'chart-sr visually-hidden'; sr.setAttribute('aria-live', 'polite'); wrap.appendChild(sr); }
  chart.plan.api = {
    count: pos.length,
    show(i) {
      const p = pos[i];
      const f = $('.pl-focus', el);
      f.setAttribute('x', (p.x0 - 3).toFixed(1)); f.setAttribute('y', p.y - rowH / 2); f.setAttribute('width', (Math.max(12, p.x1 - p.x0) + 6).toFixed(1)); f.setAttribute('height', rowH); f.setAttribute('visibility', 'visible');
      if (p.x - scroller.scrollLeft < 0 || p.x - scroller.scrollLeft > scroller.clientWidth) scroller.scrollLeft = Math.max(0, p.x - scroller.clientWidth / 2);
      tipShow(wrap, '<b>' + esc(p.it.label) + '</b><span class="tip-k">' + esc(p.lane) + '</span><span>' + esc(what(p)) + '</span>', p.x - scroller.scrollLeft, p.y);
      sr.textContent = p.it.label + ', ' + p.lane + ': ' + what(p) + '.';
    },
    hide() { const f = $('.pl-focus', el); if (f) f.setAttribute('visibility', 'hidden'); tipHide(wrap); }
  };
  fillPlanTable(pos);
}
function fillPlanTable(pos) {
  const d = $('[data-table="plan"]', lab);
  if (!d || !d.closest('details').open) return;
  d.innerHTML = tableHtml(['Item', 'Team', 'Start', 'End'], pos.map((p) => [esc(p.it.label), esc(p.lane), fmt(p.it.start, true), p.it.kind === 'bar' ? fmt(p.it.end, true) : '']), 'The launch plan, item by item');
}

/* ---------------------------------------------------------------- The systems */
const SHORT = { 'Shopper tracking': 'Shopper tracking', 'Store AI assistant': 'AI assistant', 'Training and documentation': 'Training & docs', 'Product media server': 'Media server', 'HQ dashboard': 'HQ dashboard', 'Store experience': 'Store experience', 'Integrations': 'Integrations', 'Privacy guardrails': 'Privacy' };
function drawSystems() {
  const el = $('[data-chart="systems"]', lab);
  const W = el.clientWidth;
  const narrow = W < 560;
  const m = { l: narrow ? 126 : 200, r: narrow ? 64 : 72, t: 4, b: 4 };
  const rowH = narrow ? 30 : 34, H = m.t + SYSTEMS.length * rowH + m.b;
  const max = Math.max(...SYSTEMS.map((s) => s.n));
  const x = (v) => m.l + (v / max) * (W - m.l - m.r);
  let svg = '';
  const pos = [];
  SYSTEMS.forEach((s, k) => {
    const y0 = m.t + k * rowH, cy = y0 + rowH / 2;
    svg += '<text class="lab" x="' + (m.l - 10) + '" y="' + (cy + 4) + '" text-anchor="end">' + esc(narrow ? (SHORT[s.name] || s.name) : s.name) + '</text>';
    svg += '<rect class="sy-rest" x="' + x(0) + '" y="' + (cy - 8) + '" width="' + (x(s.n) - x(0)).toFixed(1) + '" height="16"></rect>';
    if (s.done) svg += '<rect class="sy-done" x="' + x(0) + '" y="' + (cy - 8) + '" width="' + (x(s.done) - x(0)).toFixed(1) + '" height="16"></rect>';
    svg += '<text class="sy-n" x="' + (x(s.n) + 8).toFixed(1) + '" y="' + (cy + 4) + '">' + s.done + ' of ' + s.n + '</text>';
    pos.push({ x: x(s.n / 2), y: cy, y0, s });
  });
  svg += '<rect class="sy-focus" x="0" y="0" width="' + W + '" height="' + rowH + '" visibility="hidden"></rect>';
  pos.forEach((p, i) => { svg += '<rect class="hit" data-i="' + i + '" x="0" y="' + p.y0 + '" width="' + W + '" height="' + rowH + '"></rect>'; });
  el.innerHTML = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true" focusable="false">' + svg + '</svg>';
  el.tabIndex = 0;
  el.setAttribute('role', 'group');
  el.setAttribute('aria-label', 'Tasks per system after opening, done out of total: ' + SYSTEMS.map((s) => s.name + ' ' + s.done + ' of ' + s.n).join(', ') + '. Use the arrow keys to step through the systems.');
  let sr = $('.chart-sr', el);
  if (!sr) { sr = document.createElement('p'); sr.className = 'chart-sr visually-hidden'; sr.setAttribute('aria-live', 'polite'); el.appendChild(sr); }
  const ORDER = ['Complete', 'Deployed', 'Testing', 'In Review', 'In Progress', 'Not Started', 'Postponed', 'No status'];
  const breakdown = (s) => ORDER.filter((k) => s.status[k]).map((k) => s.status[k] + ' ' + k.toLowerCase()).join(', ');
  chart.sys.api = {
    count: pos.length,
    show(i) {
      const p = pos[i];
      const f = $('.sy-focus', el);
      f.setAttribute('y', p.y0); f.setAttribute('visibility', 'visible');
      tipShow(el, '<b>' + esc(p.s.name) + '</b><span class="tip-k">' + esc(p.s.sub) + '</span><span>' + p.s.done + ' of ' + p.s.n + ' tasks done: ' + esc(breakdown(p.s)) + '</span>', p.x, p.y);
      sr.textContent = p.s.name + ', ' + p.s.sub + ': ' + p.s.done + ' of ' + p.s.n + ' done. ' + breakdown(p.s) + '.';
    },
    hide() { const f = $('.sy-focus', el); if (f) f.setAttribute('visibility', 'hidden'); tipHide(el); }
  };
  fillSystemsTable();
}
function fillSystemsTable() {
  const d = $('[data-table="systems"]', lab);
  if (!d || !d.closest('details').open) return;
  const cols = ['Complete', 'Deployed', 'In Progress', 'Testing', 'In Review', 'Not Started', 'Postponed'];
  d.innerHTML = tableHtml(['System', 'Tasks'].concat(cols.map((c) => c.toLowerCase())), SYSTEMS.map((s) => [esc(s.name)].concat([s.n], cols.map((c) => s.status[c] || ''))), 'Tasks per system by status');
}

/* ---------------------------------------------------------------- Shared */
function tableHtml(head, body, label) {
  return '<div class="table-scroll" tabindex="0" role="region" aria-label="' + esc(label) + '"><table><thead><tr>' + head.map((h, i) => '<th scope="col"' + (i ? ' class="num"' : '') + '>' + h + '</th>').join('') + '</tr></thead><tbody>' +
    body.map((r) => '<tr><th scope="row">' + r[0] + '</th>' + r.slice(1).map((v) => '<td class="num">' + v + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
}
function wire(el, key) {
  const c = chart[key];
  el.addEventListener('pointermove', (e) => {
    const h = e.target.closest('.hit');
    if (!h) { if (document.activeElement !== el) c.api.hide(); return; }
    c.idx = Number(h.dataset.i);
    c.api.show(c.idx);
  });
  el.addEventListener('pointerleave', () => { if (document.activeElement !== el) c.api.hide(); });
  el.addEventListener('focus', () => c.api.show(c.idx = Math.min(c.idx, c.api.count - 1)));
  el.addEventListener('blur', () => c.api.hide());
  el.addEventListener('keydown', (e) => {
    const n = c.api.count;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') c.idx = (c.idx + 1) % n;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') c.idx = (c.idx - 1 + n) % n;
    else if (e.key === 'Home') c.idx = 0;
    else if (e.key === 'End') c.idx = n - 1;
    else if (e.key === 'Escape') { c.api.hide(); return; }
    else return;
    e.preventDefault();
    c.api.show(c.idx);
  });
}

function draw() {
  if ($('[data-chart="systems"]', lab).clientWidth > 0) { drawPlan(); drawSystems(); }
}
function init() {
  if (!lab) return;
  lab.classList.add('is-live');
  drawRooms();
  showRoom('hub');
  lab.addEventListener('click', (e) => {
    const b = e.target.closest('[data-room]');
    if (b && lab.contains(b)) showRoom(b.dataset.room);
  });
  $$('details.numbers', lab).forEach((d) => d.addEventListener('toggle', draw));
  wire($('[data-chart="plan"]', lab).parentElement, 'plan');
  wire($('[data-chart="systems"]', lab), 'sys');
  if ('ResizeObserver' in window) {
    let w = 0;
    new ResizeObserver(() => { const el = $('[data-chart="systems"]', lab); if (el.clientWidth !== w) { w = el.clientWidth; draw(); } }).observe($('[data-chart="systems"]', lab));
  }
  document.addEventListener('scg:theme', draw);
  draw();
}

init();
