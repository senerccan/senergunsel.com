// G01 · the back of house: the project's Notion hub drawn as a plan, the launch plan as a
// strip, and the systems the store is made of. Counts and dates come from backhouse-data.js;
// the room descriptions are written here. Process facts only: no names, no store data.
import { COUNTS, SYSTEMS } from './backhouse-data.js';

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

/* ---------------------------------------------------------------- Shared chart bits */
const chart = { sys: { idx: 0, api: null } };
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

/* ---------------------------------------------------------------- The race to opening */
// Five phases from the project's own status language, months only: nothing internal
// is dated here beyond the public opening day. The dragon is the project; the pearl is
// opening day, and a dragon chases a pearl.
const RACE = {
  start: '2025-06-01', end: '2026-02-01', open: '2026-01-23',
  phases: [
    { n: 1, name: 'Vision and concept', from: '2025-06-01', to: '2025-09-01', note: 'concept, design, architecture' },
    { n: 2, name: 'Blueprint', from: '2025-09-01', to: '2025-10-01', note: 'tech prep, product plan, approvals' },
    { n: 3, name: 'Execution prep', from: '2025-10-01', to: '2025-11-01', note: 'materials, tech testing, construction start' },
    { n: 4, name: 'Build-out, integration, test', from: '2025-11-01', to: '2026-01-10', note: 'construction, tech integration, fixtures, team workshop' },
    { n: 5, name: 'Launch and learn', from: '2026-01-10', to: '2026-01-23', note: 'product and visual merchandising, programming, soft opening, opening' },
  ],
};
const race = { raf: null, t0: 0, p: 0, done: false, started: false, lastPhase: -1 };
const RACE_MS = 9000;
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
function dragonHead() {
  return '<g class="dr-head"><path class="dr-fill" d="M-12 -9 L14 -5 L19 0 L14 6 L-12 9 Z"/><path class="dr-line" d="M-7 -9 L-3 -21 M1 -8 L7 -19"/><path class="dr-whisker" d="M15 -2 q10 -7 17 -2 M15 3 q10 7 17 2"/><circle class="dr-eye" cx="3" cy="-2" r="2.4"/><path class="dr-line" d="M-12 -4 l-5 -6 M-12 4 l-5 6"/></g>';
}
function drawRace() {
  const el = $('[data-chart="race"]', lab);
  if (!el) return;
  const W = el.clientWidth;
  const narrow = W < 560;
  const m = { l: 12, r: 12 };
  const H = 170, trackY = 112, barY = 30;
  const t0 = day(RACE.start), t1 = day(RACE.end);
  const x = (iso) => m.l + ((day(iso) - t0) / (t1 - t0)) * (W - m.l - m.r);
  const xOpen = x(RACE.open);
  let svg = '';
  // the phases as bands under the track
  RACE.phases.forEach((ph, i) => {
    const a = x(ph.from), b = x(ph.to);
    svg += '<rect class="rc-phase rc-p' + ph.n + '" data-phase="' + i + '" x="' + a.toFixed(1) + '" y="' + (trackY - 26) + '" width="' + (b - a).toFixed(1) + '" height="52"></rect>';
    const label = narrow || b - a < 110 ? String(ph.n) : ph.n + ' · ' + ph.name;
    svg += '<text class="rc-phase-t" x="' + ((a + b) / 2).toFixed(1) + '" y="' + (trackY + 42) + '" text-anchor="middle">' + esc(label) + '</text>';
  });
  // months
  for (let mo = 0; mo < 9; mo++) {
    const d = new Date(Date.UTC(2025, 5 + mo, 1)), iso = d.toISOString().slice(0, 10), xx = x(iso);
    svg += '<line class="rc-tick" x1="' + xx.toFixed(1) + '" x2="' + xx.toFixed(1) + '" y1="' + (trackY - 26) + '" y2="' + (trackY + 26) + '"></line>';
    if (mo < 8) svg += '<text class="rc-month" x="' + (xx + 4).toFixed(1) + '" y="' + (trackY - 31) + '">' + MONTHS[d.getUTCMonth()] + (d.getUTCMonth() === 0 && !narrow ? ' 2026' : '') + '</text>';
  }
  svg += '<line class="rc-track" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + trackY + '" y2="' + trackY + '"></line>';
  // the bar above, and its counter
  svg += '<rect class="rc-bar-bg" x="' + m.l + '" y="' + barY + '" width="' + (W - m.l - m.r) + '" height="10"></rect>';
  svg += '<rect class="rc-bar" x="' + m.l + '" y="' + barY + '" width="0" height="10"></rect>';
  svg += '<text class="rc-count" x="' + m.l + '" y="' + (barY - 10) + '">WEEK 0 OF 34</text>';
  svg += '<text class="rc-phase-now" x="' + (W - m.r) + '" y="' + (barY - 10) + '" text-anchor="end"></text>';
  // the pearl: opening day
  svg += '<g class="rc-pearl" transform="translate(' + xOpen.toFixed(1) + ' ' + trackY + ')"><circle class="rc-pearl-ring" r="15"/><circle class="rc-pearl-dot" r="7"/></g>';
  svg += '<text class="rc-open" x="' + xOpen.toFixed(1) + '" y="' + (trackY + 62) + '" text-anchor="' + (narrow ? 'end' : 'middle') + '">OPENED JAN 23, 2026</text>';
  // the dragon
  svg += '<g class="rc-dragon" transform="translate(' + m.l + ' ' + trackY + ')"><path class="dr-body-outer" d=""/><path class="dr-body-inner" d=""/>' + dragonHead() + '</g>';
  el.innerHTML = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc('The race to opening: ' + RACE.phases.map((p) => p.n + ' ' + p.name).join(', ') + '. June 2025 to the opening on January 23, 2026, 34 weeks.') + '">' + svg + '</svg>';
  race.geom = { x, xOpen, trackY, m, W };
  raceFrame(race.done ? 1 : race.p, 0, true);
}
function phaseAt(p) {
  const { x, xOpen, m } = race.geom;
  const px = m.l + p * (xOpen - 30 - m.l);
  let k = 0;
  RACE.phases.forEach((ph, i) => { if (px >= x(ph.from) - 0.5) k = i; });
  return k;
}
function raceFrame(p, t, still) {
  const g = race.geom; if (!g) return;
  const el = $('[data-chart="race"]', lab);
  const px = g.m.l + p * (g.xOpen - 30 - g.m.l);
  $('.rc-bar', el).setAttribute('width', Math.max(0, px - g.m.l).toFixed(1));
  const weeks = Math.round(p * 34);
  $('.rc-count', el).textContent = p >= 1 ? 'WEEK 34 OF 34 · OPEN' : 'WEEK ' + weeks + ' OF 34';
  const k = phaseAt(p);
  $('.rc-phase-now', el).textContent = (p >= 1 ? 'THE DOORS OPEN' : RACE.phases[k].name.toUpperCase());
  $$('.rc-phase', el).forEach((r, i) => r.classList.toggle('is-now', i === k && p < 1));
  const dragon = $('.rc-dragon', el);
  dragon.setAttribute('transform', 'translate(' + px.toFixed(1) + ' ' + g.trackY + ') scale(1.35)');
  // the body: a wave trailing the head, wriggling as it goes
  const seg = 11, len = Math.min(120, 30 + p * 110), wig = still ? 0 : 1;
    let pts = [];
  for (let i = 0; i <= seg; i++) {
    const f = i / seg;
    const bx = -10 - f * len;
    const by = Math.sin(f * 7 - t * 0.012) * 7 * (0.3 + f) * wig + (still ? Math.sin(f * 7) * 5 * (0.3 + f) : 0);
    pts.push([bx, by]);
  }
  const d = pts.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' ');
  $('.dr-body-outer', el).setAttribute('d', d);
  $('.dr-body-inner', el).setAttribute('d', d);
  $('.rc-pearl', el).classList.toggle('is-won', p >= 1);
  el.closest('.rc-card').classList.toggle('is-won', p >= 1);
  if (k !== race.lastPhase) {
    race.lastPhase = k;
    const live = $('[data-out="live"]', lab);
    if (live && !still) live.textContent = p >= 1 ? 'The doors open: January 23, 2026.' : 'Phase ' + RACE.phases[k].n + ', ' + RACE.phases[k].name + ': ' + RACE.phases[k].note + '.';
  }
}
function runRace() {
  cancelAnimationFrame(race.raf);
  race.done = false; race.lastPhase = -1; race.started = true;
  if (reduced()) { race.p = 1; race.done = true; raceFrame(1, 0, true); return; }
  race.t0 = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - race.t0) / RACE_MS);
    race.p = easeInOut(t);
    raceFrame(race.p, now - race.t0, false);
    if (t < 1) race.raf = requestAnimationFrame(step);
    else { race.done = true; raceFrame(1, 0, true); }
  };
  race.raf = requestAnimationFrame(step);
}
function reduced() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
function wireRace() {
  const card = $('.rc-card', lab);
  if (!card) return;
  $('[data-race-run]', lab).addEventListener('click', runRace);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting && !race.started) { runRace(); io.disconnect(); } });
    }, { threshold: 0.5 });
    io.observe(card);
  } else runRace();
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
  if ($('[data-chart="systems"]', lab).clientWidth > 0) { drawRace(); drawSystems(); }
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
  wireRace();
  wire($('[data-chart="systems"]', lab), 'sys');
  if ('ResizeObserver' in window) {
    let w = 0;
    new ResizeObserver(() => { const el = $('[data-chart="systems"]', lab); if (el.clientWidth !== w) { w = el.clientWidth; draw(); } }).observe($('[data-chart="systems"]', lab));
  }
  document.addEventListener('scg:theme', draw);
  draw();
}

init();
