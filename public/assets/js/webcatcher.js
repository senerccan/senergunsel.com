// G03 · Web Catcher, playable. The rules live in webcatcher-model.js (the same steps as the
// Python version); this file wires the controls and draws the wall.
import {
  LINE, SHOES, TRAITS, WINDOWS, LEVERS, LEVEL_WORDS, BUZZ_WORDS, SIZE_WORDS, CALLS, MAX_TRENDS,
  defaults, newTrend, momentum, evaluate, leverShift, lineNote, shoeName, clamp
} from './webcatcher-model.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const MINUS = '−';
const num = (v) => String(v).replace(/^-/, MINUS);
const signed = (v) => (v > 0 ? '+' : v < 0 ? MINUS : '') + Math.abs(v);
// On a phone the wall is small, so the example trends are labelled without the brand.
const SHORT = { samba: 'Samba', af1: 'Air Force 1', stansmith: 'Stan Smith', nb993: 'NB 993', dunk: 'Dunk' };
const STAR = 'M12 2.4l2.9 6.1 6.7.8-4.9 4.6 1.3 6.6L12 17.2l-5.9 3.3 1.3-6.6-4.9-4.6 6.7-.8z';

const lab = $('#lab');
const state = { trends: defaults(), sel: 'samba', made: 0, shoe: 'oldskool' };
let gridFor = null;

const cur = () => state.trends.find((t) => t.key === state.sel);
const all = () => state.trends.map((t) => ({ t, e: evaluate(t) }));

/* ---------------------------------------------------------------- The trends */
function renderTrends() {
  const box = $('[data-out="trends"]', lab);
  box.innerHTML = state.trends.map((t) => {
    const e = evaluate(t);
    return '<button type="button" class="wc-trend" data-pick="' + esc(t.key) + '" aria-pressed="' + (t.key === state.sel) + '">' +
      '<span class="wt-name">' + esc(t.name) + '</span><span class="wt-call call-' + e.call + '"><i aria-hidden="true"></i>' + CALLS[e.call] + '</span></button>';
  }).join('') + (state.trends.length < MAX_TRENDS
    ? '<button type="button" class="wc-trend wc-add" data-add><span class="wt-name">+ Add your own</span><span class="wt-call">Up to ' + MAX_TRENDS + '</span></button>'
    : '');
}

/* ---------------------------------------------------------------- Step 1 */
function renderCard() {
  const t = cur();
  const [mom, parts] = momentum(t);
  const nameBox = $('[data-out="name"]', lab);
  if (t.custom) {
    if (!$('input', nameBox) || nameBox.dataset.for !== t.key) {
      nameBox.innerHTML = '<label class="ctl-k" for="wc-name">Name your trend</label><input id="wc-name" class="wc-name-in" type="text" maxlength="28" autocomplete="off" value="' + esc(t.name) + '">';
      nameBox.dataset.for = t.key;
    }
  } else {
    nameBox.innerHTML = '<h4>' + esc(t.name) + '</h4>';
    nameBox.dataset.for = t.key;
  }
  $('[data-out="look"]', lab).textContent = t.look;
  $('[data-out="mom"]', lab).textContent = String(mom);
  $('[data-out="mom"]', lab).classList.toggle('is-hot', mom >= LINE);
  const seg = (k) => (parts[k] > 0 ? '<span class="mb-' + k + '" style="width:' + parts[k] + '%"></span>' : '');
  $('[data-out="mom-bar"]', lab).innerHTML = '<span class="mb-fill">' + seg('growth') + seg('buzz') + seg('size') + '</span><span class="mb-line"></span>';
  $('[data-out="mom-note"]', lab).innerHTML = '<span class="mk mk-growth"></span>Growth ' + parts.growth + ' · <span class="mk mk-buzz"></span>Buzz ' + parts.buzz + ' · <span class="mk mk-size"></span>Size ' + parts.size +
    '. <b>' + (mom >= LINE ? 'Hot' : 'Not hot') + '</b>: ' + lineNote(mom) + '.';
  $('[data-out="card-foot"]', lab).innerHTML = t.custom ? '<button type="button" class="btn wc-remove" data-remove>Remove this trend</button>' : '';
  // the signals
  const setRange = (id, v) => { const el = $('#' + id); if (Number(el.value) !== v) el.value = String(v); };
  setRange('sig-growth', t.growth);
  setRange('sig-buzz', t.buzz);
  setRange('sig-size', t.size);
  $('[data-out="growth"]', lab).textContent = (t.growth > 0 ? '+' : t.growth < 0 ? MINUS : '') + Math.abs(t.growth) + '%';
  $('[data-out="buzz"]', lab).textContent = BUZZ_WORDS[t.buzz - 1];
  $('[data-out="size"]', lab).textContent = SIZE_WORDS[t.size - 1];
  $('#sig-growth').setAttribute('aria-valuetext', (t.growth > 0 ? 'plus ' : t.growth < 0 ? 'minus ' : '') + Math.abs(t.growth) + ' percent');
  $('#sig-buzz').setAttribute('aria-valuetext', BUZZ_WORDS[t.buzz - 1]);
  $('#sig-size').setAttribute('aria-valuetext', SIZE_WORDS[t.size - 1]);
  $$('[data-window]', lab).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.window === t.window)));
  $('[data-out="window-note"]', lab).textContent = WINDOWS[t.window].note;
}

/* ---------------------------------------------------------------- Step 2 */
// Star ratings: each is a group of five radio buttons. Arrow keys move the rating.
function starsHtml(shoe, trait, v) {
  let h = '<div class="stars" role="radiogroup" data-shoe="' + shoe.key + '" data-trait="' + trait.key + '" aria-label="' + esc(shoe.name + ', ' + trait.name) + '">';
  for (let i = 1; i <= 5; i++) {
    h += '<button type="button" role="radio" class="star" data-v="' + i + '" aria-checked="' + (i === v) + '" tabindex="' + (i === v ? 0 : -1) + '" aria-label="' + i + (i === 1 ? ' star' : ' stars') + '">' +
      '<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path d="' + STAR + '"></path></svg></button>';
  }
  return h + '</div>';
}
function buildGrid() {
  const t = cur();
  const grid = $('[data-out="grid"]', lab);
  grid.innerHTML = '<div class="wg-row wg-head"><span class="wg-trait">Trait</span>' +
    SHOES.map((s) => '<span class="wg-shoe col-' + s.key + '" data-fit-for="' + s.key + '"></span>').join('') + '</div>' +
    TRAITS.map((tr) => '<div class="wg-row" data-row="' + tr.key + '"><span class="wg-trait"><b>' + tr.name + '</b><span>' + esc(tr.q) + '</span><em class="wg-shift" data-shift="' + tr.key + '"></em></span>' +
      SHOES.map((s) => '<span class="wg-cell col-' + s.key + '">' + starsHtml(s, tr, t.ratings[s.key][tr.key]) + '</span>').join('') + '</div>').join('');
  gridFor = t.key;
}
function renderGrid() {
  const t = cur();
  if (gridFor !== t.key) buildGrid();
  const e = evaluate(t);
  const grid = $('[data-out="grid"]', lab);
  grid.dataset.shoe = state.shoe;
  SHOES.forEach((s) => {
    const f = e.fits[s.key];
    const best = s.key === e.shoe;
    $('[data-fit-for="' + s.key + '"]', grid).innerHTML = '<b>' + s.name + '</b><span class="wg-fit' + (best ? ' is-best' : '') + '">Fit ' + f.now +
      (best ? ' · closest' : '') + '</span>';
  });
  $$('.stars', grid).forEach((g) => {
    const v = t.ratings[g.dataset.shoe][g.dataset.trait];
    $$('.star', g).forEach((b) => {
      const i = Number(b.dataset.v);
      b.setAttribute('aria-checked', String(i === v));
      b.tabIndex = i === v ? 0 : -1;
      b.classList.toggle('is-on', i <= v);
    });
  });
  TRAITS.forEach((tr) => {
    const sh = leverShift(t, tr.key);
    const el = $('[data-shift="' + tr.key + '"]', grid);
    el.textContent = sh ? 'Levers ' + (sh > 0 ? '+' : MINUS) + Math.abs(sh) : '';
    el.classList.toggle('is-down', sh < 0);
  });
  $('[data-out="shoe-tabs"]', lab).innerHTML = SHOES.map((s) => '<button type="button" data-tab="' + s.key + '" aria-pressed="' + (s.key === state.shoe) + '"' +
    (s.key === e.shoe ? ' class="is-best"' : '') + '><span>' + s.name + '</span><b>Fit ' + e.fits[s.key].now + '</b>' +
    (s.key === e.shoe ? '<span class="visually-hidden">, the closest</span>' : '') + '</button>').join('');
}
function setRating(shoe, trait, v, focus) {
  const t = cur();
  t.ratings[shoe][trait] = clamp(v, 1, 5);
  update();
  if (focus) {
    const b = $('.stars[data-shoe="' + shoe + '"][data-trait="' + trait + '"] .star[data-v="' + t.ratings[shoe][trait] + '"]', lab);
    if (b) b.focus();
  }
}

/* ---------------------------------------------------------------- Step 3 */
function renderLevers() {
  const t = cur();
  LEVERS.forEach((lv) => {
    const el = $('#lv-' + lv.key);
    const v = t.levers[lv.key];
    if (Number(el.value) !== v) el.value = String(v);
    el.setAttribute('aria-valuetext', LEVEL_WORDS[v - 1]);
    $('[data-out="lv-' + lv.key + '"]', lab).textContent = LEVEL_WORDS[v - 1];
    let note = lv.note;
    const dead = lv.key === 'product' && WINDOWS[t.window].product === 0;
    if (dead) note = "This trend won't last long enough for new product to land, so this lever does nothing.";
    else if (lv.key === 'product' && WINDOWS[t.window].product < 1) note += ' At half strength for a trend this long.';
    $('[data-out="lv-' + lv.key + '-note"]', lab).textContent = note;
    el.closest('.ctl').classList.toggle('is-dead', dead);
  });
}
// What would flip the call, in a line.
function nudge(t, e) {
  if (e.call === 'back') return 'Both scores clear the line.';
  if (e.call === 'test') return 'The ' + shoeName(e.shoe) + ' is ' + (LINE - e.fit) + (LINE - e.fit === 1 ? ' point' : ' points') + ' short of a fit. ' +
    (t.window === 'short' ? 'Marketing and money can still move it; product can’t land in time.' : 'More product, marketing or money closes the gap.');
  if (e.call === 'hold') return 'Momentum is ' + (LINE - e.momentum) + (LINE - e.momentum === 1 ? ' point' : ' points') + ' short of hot, and the levers don’t change that: growth, buzz and size do.';
  return 'Neither score is near enough. Raising the levers moves the fit, not the heat.';
}
function renderCall() {
  const t = cur();
  const e = evaluate(t);
  const dFit = e.fit - e.base_fit;
  const card = $('[data-out="call-card"]', lab);
  card.className = 'wc-call call-' + e.call;
  card.innerHTML = '<p class="ctl-k">The call · ' + esc(t.name) + '</p>' +
    '<p class="wc-verdict">' + CALLS[e.call] + '</p>' +
    '<p class="wc-play">' + esc(e.play) + '</p>' +
    '<dl class="wc-stats"><div><dt>Momentum</dt><dd>' + e.momentum + '</dd><dd class="wc-sub">' + lineNote(e.momentum) + '</dd></div>' +
    '<div><dt>Best fit</dt><dd>' + e.fit + (dFit ? '<small class="' + (dFit > 0 ? 'up' : 'down') + '">' + signed(dFit) + '</small>' : '') + '</dd><dd class="wc-sub">' + esc(shoeName(e.shoe)) + ', ' + lineNote(e.fit) + '</dd></div></dl>' +
    '<p class="wc-meta">Lasts ' + WINDOWS[t.window].name.toLowerCase() + ' · Bet: ' + e.bet.toLowerCase() +
    (e.base_call !== e.call ? ' · Before the levers: ' + CALLS[e.base_call] : '') + '</p>' +
    '<p class="wc-nudge">' + esc(nudge(t, e)) + '</p>';
  $('[data-out="fits"]', lab).innerHTML = SHOES.map((s) => {
    const f = e.fits[s.key];
    const d = f.now - f.base;
    return '<div class="' + (s.key === e.shoe ? 'is-best' : '') + '"><dt>' + s.name + (s.key === e.shoe ? '<span> · closest</span>' : '') + '</dt><dd>' + f.now +
      (d ? '<small class="' + (d > 0 ? 'up' : 'down') + '">' + signed(d) + '</small>' : '') + '</dd></div>';
  }).join('');
}

/* ---------------------------------------------------------------- Step 4: the wall */
const wall = { api: null, idx: 0, active: false };
function tipShow(el, html, x, y) {
  let tip = $('.tip', el);
  if (!tip) {
    tip = document.createElement('div');
    tip.className = 'tip';
    tip.setAttribute('aria-hidden', 'true');
    el.appendChild(tip);
  }
  tip.innerHTML = html;
  tip.hidden = false;
  const W = el.clientWidth;
  let left = x + 16;
  if (left + tip.offsetWidth > W) left = Math.max(0, x - tip.offsetWidth - 16);
  tip.style.left = left + 'px';
  tip.style.top = Math.max(0, y - tip.offsetHeight - 12) + 'px';
}
function drawWall() {
  const el = $('[data-chart="wall"]', lab);
  const W = el.clientWidth;
  const narrow = W < 560;
  const H = narrow ? Math.round(W * 1.15) : Math.round(Math.min(540, W * 0.56));
  const m = narrow ? { l: 48, r: 12, t: 14, b: 46 } : { l: 56, r: 18, t: 14, b: 46 };
  const x = (v) => m.l + (v / 100) * (W - m.l - m.r);
  const y = (v) => m.t + (1 - v / 100) * (H - m.t - m.b);
  const rows = all();
  let svg = '<rect class="q-back" x="' + x(LINE) + '" y="' + y(100) + '" width="' + (x(100) - x(LINE)) + '" height="' + (y(LINE) - y(100)) + '"></rect>' +
    '<rect class="q-test" x="' + x(0) + '" y="' + y(100) + '" width="' + (x(LINE) - x(0)) + '" height="' + (y(LINE) - y(100)) + '"></rect>';
  [0, 25, 75, 100].forEach((v) => {
    svg += '<line class="grid" x1="' + x(0) + '" x2="' + x(100) + '" y1="' + y(v) + '" y2="' + y(v) + '"></line><line class="grid" x1="' + x(v) + '" x2="' + x(v) + '" y1="' + y(0) + '" y2="' + y(100) + '"></line>';
  });
  [0, 25, 50, 75, 100].forEach((v) => {
    svg += '<text class="tick" x="' + (m.l - 8) + '" y="' + y(v) + '" dy="0.35em" text-anchor="end">' + v + '</text>' +
      '<text class="tick" x="' + x(v) + '" y="' + (H - m.b + 17) + '" text-anchor="middle">' + v + '</text>';
  });
  svg += '<line class="line50" x1="' + x(LINE) + '" x2="' + x(LINE) + '" y1="' + y(0) + '" y2="' + y(100) + '"></line><line class="line50" x1="' + x(0) + '" x2="' + x(100) + '" y1="' + y(LINE) + '" y2="' + y(LINE) + '"></line>';
  svg += '<text class="q-label q-label-back" x="' + (x(100) - 8) + '" y="' + (y(100) + 18) + '" text-anchor="end">Back it</text>' +
    '<text class="q-label" x="' + (x(0) + 8) + '" y="' + (y(100) + 18) + '">Test small</text>' +
    '<text class="q-label" x="' + (x(100) - 8) + '" y="' + (y(0) - 10) + '" text-anchor="end">Hold</text>' +
    '<text class="q-label" x="' + (x(0) + 8) + '" y="' + (y(0) - 10) + '">Pass</text>';
  svg += '<text class="axis-t" x="' + ((x(0) + x(100)) / 2) + '" y="' + (H - 6) + '" text-anchor="middle">Fit: how close our best shoe is →</text>';
  svg += '<text class="axis-t" transform="translate(' + 14 + ' ' + ((y(0) + y(100)) / 2) + ') rotate(-90)" text-anchor="middle">Momentum: how hot the trend is →</text>';
  // before the levers, and the move
  rows.forEach(({ t, e }) => {
    if (e.base_fit === e.fit) return;
    const x0 = x(e.base_fit);
    const x1 = x(e.fit);
    const yy = y(e.momentum);
    const dir = x1 > x0 ? 1 : -1;
    const tip = x1 - dir * (t.key === state.sel ? 12 : 9); // stop short of the dot and its ring
    svg += '<circle class="dot-was" cx="' + x0 + '" cy="' + yy + '" r="5"></circle>';
    if (Math.abs(tip - x0) > 16) {
      svg += '<path class="move" d="M' + (x0 + dir * 7) + ' ' + yy + 'H' + (tip - dir * 6) + '"></path>' +
        '<path class="move-head" d="M' + (tip - dir * 7) + ' ' + (yy - 4) + 'L' + tip + ' ' + yy + 'L' + (tip - dir * 7) + ' ' + (yy + 4) + 'Z"></path>';
    }
  });
  // Labels go right of the dot, or left, above or below when that clashes or runs off the
  // chart. A label with no clear spot is left off (the tooltip and the table still have it),
  // except the selected trend's, which always shows.
  const CH = 6.7; // width of one character at the label size
  const QW = 7.6; // the same for the corner labels
  const placed = [
    { x0: x(100) - 8 - 7 * QW, x1: x(100) - 8, y0: y(100) + 6, y1: y(100) + 22 },
    { x0: x(0) + 8, x1: x(0) + 8 + 10 * QW, y0: y(100) + 6, y1: y(100) + 22 },
    { x0: x(100) - 8 - 4 * QW, x1: x(100) - 8, y0: y(0) - 22, y1: y(0) - 6 },
    { x0: x(0) + 8, x1: x(0) + 8 + 4 * QW, y0: y(0) - 22, y1: y(0) - 6 }
  ];
  rows.forEach(({ e }) => {
    if (e.base_fit === e.fit) return;
    placed.push({ x0: Math.min(x(e.base_fit), x(e.fit)) - 7, x1: Math.max(x(e.base_fit), x(e.fit)) + 7, y0: y(e.momentum) - 7, y1: y(e.momentum) + 7 });
  });
  const dots = rows.map(({ e }) => ({ x: x(e.fit), y: y(e.momentum) }));
  const hit = (b) => placed.some((p) => !(b.x1 + 2 < p.x0 || b.x0 - 2 > p.x1 || b.y1 + 2 < p.y0 || b.y0 - 2 > p.y1)) ||
    dots.some((d) => d.x > b.x0 - 7 && d.x < b.x1 + 7 && d.y > b.y0 - 7 && d.y < b.y1 + 7);
  const inside = (b) => b.x0 >= m.l + 2 && b.x1 <= W - m.r && b.y0 >= m.t && b.y1 <= H - m.b;
  const order = rows.map((r, i) => i).sort((a, b) => (rows[a].t.key === state.sel ? -1 : rows[b].t.key === state.sel ? 1 : 0));
  order.forEach((i) => {
    const { t, e } = rows[i];
    const sel = t.key === state.sel;
    const cx = x(e.fit);
    const cy = y(e.momentum);
    const gap = sel ? 15 : 11;
    const name = narrow && SHORT[t.key] ? SHORT[t.key] : t.name;
    const w = name.length * CH + 2;
    const at = (ax, lx, ly) => {
      const x0 = ax === 'start' ? lx : ax === 'end' ? lx - w : lx - w / 2;
      return { ax, lx, ly, b: { x0, x1: x0 + w, y0: ly - 9, y1: ly + 3 } };
    };
    const tries = [at('start', cx + gap, cy + 4), at('end', cx - gap, cy + 4), at('middle', cx, cy - gap - 2), at('middle', cx, cy + gap + 10)];
    let pick = tries.find((c) => inside(c.b) && !hit(c.b));
    if (!pick && sel) pick = tries.find((c) => inside(c.b)) || tries[0];
    if (!pick) return;
    placed.push(pick.b);
    svg += '<text class="dot-label' + (sel ? ' is-sel' : '') + '" x="' + pick.lx + '" y="' + pick.ly + '" text-anchor="' + pick.ax + '">' + esc(name) + '</text>';
  });
  rows.forEach(({ t, e }) => {
    const sel = t.key === state.sel;
    svg += '<circle class="dot dot-' + e.call + (sel ? ' is-sel' : '') + '" cx="' + x(e.fit) + '" cy="' + y(e.momentum) + '" r="' + (sel ? 8 : 6) + '"></circle>';
  });
  svg += '<circle class="dot-focus" r="13" visibility="hidden"></circle>';
  rows.forEach(({ t, e }, i) => {
    svg += '<circle class="dot-hit" data-i="' + i + '" data-key="' + esc(t.key) + '" cx="' + x(e.fit) + '" cy="' + y(e.momentum) + '" r="16"></circle>';
  });
  const label = 'Scatter chart of ' + rows.length + ' trends, momentum against fit. ' +
    rows.map(({ t, e }) => t.name + ': ' + CALLS[e.call] + ', momentum ' + e.momentum + ', fit ' + e.fit).join('. ') + '.';
  el.innerHTML = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true" focusable="false">' + svg + '</svg>';
  el.tabIndex = 0;
  el.setAttribute('role', 'group');
  el.setAttribute('aria-label', label + ' Use the arrow keys to step through the trends and Enter to try one on.');
  let sr = $('.chart-sr', el);
  if (!sr) {
    sr = document.createElement('p');
    sr.className = 'chart-sr visually-hidden';
    sr.setAttribute('aria-live', 'polite');
    el.appendChild(sr);
  }
  wall.api = {
    count: rows.length,
    show(i) {
      const { t, e } = rows[i];
      const ring = $('.dot-focus', el);
      ring.setAttribute('cx', x(e.fit));
      ring.setAttribute('cy', y(e.momentum));
      ring.setAttribute('visibility', 'visible');
      tipShow(el, '<b>' + esc(t.name) + '</b><span class="tip-k">' + CALLS[e.call] + ' · lasts ' + WINDOWS[t.window].name.toLowerCase() + '</span>' +
        '<span>Momentum ' + e.momentum + ' · fit ' + e.fit + ' with the ' + esc(shoeName(e.shoe)) + '</span>' +
        (e.base_fit !== e.fit ? '<span>Fit ' + e.base_fit + ' before the levers</span>' : ''), x(e.fit), y(e.momentum));
      sr.textContent = t.name + ', ' + CALLS[e.call] + '. Momentum ' + e.momentum + ', fit ' + e.fit + ' with the ' + shoeName(e.shoe) + '.';
    },
    hide() {
      const ring = $('.dot-focus', el);
      if (ring) ring.setAttribute('visibility', 'hidden');
      const tip = $('.tip', el);
      if (tip) tip.hidden = true;
    },
    keyAt(i) { return rows[i].t.key; }
  };
  if (wall.active && wall.idx < rows.length) wall.api.show(wall.idx);
  fillTable();
}
function wireWall() {
  const el = $('[data-chart="wall"]', lab);
  el.addEventListener('pointermove', (e) => {
    const h = e.target.closest('.dot-hit');
    if (!h || !wall.api) {
      if (wall.api && document.activeElement !== el) wall.api.hide();
      return;
    }
    wall.idx = Number(h.dataset.i);
    wall.active = true;
    wall.api.show(wall.idx);
  });
  el.addEventListener('pointerleave', () => {
    wall.active = false;
    if (wall.api && document.activeElement !== el) wall.api.hide();
  });
  el.addEventListener('click', (e) => {
    const h = e.target.closest('.dot-hit');
    if (h) pick(h.dataset.key);
  });
  el.addEventListener('focus', () => {
    if (!wall.api) return;
    wall.active = true;
    wall.idx = Math.max(0, state.trends.findIndex((t) => t.key === state.sel));
    wall.api.show(wall.idx);
  });
  el.addEventListener('blur', () => {
    wall.active = false;
    if (wall.api) wall.api.hide();
  });
  el.addEventListener('keydown', (e) => {
    if (!wall.api) return;
    const n = wall.api.count;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') wall.idx = (wall.idx + 1) % n;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') wall.idx = (wall.idx - 1 + n) % n;
    else if (e.key === 'Enter' || e.key === ' ') { pick(wall.api.keyAt(wall.idx)); e.preventDefault(); return; }
    else if (e.key === 'Escape') { wall.api.hide(); return; }
    else return;
    e.preventDefault();
    wall.api.show(wall.idx);
  });
  if ('ResizeObserver' in window) {
    let w = 0;
    new ResizeObserver(() => {
      if (el.clientWidth !== w) {
        w = el.clientWidth;
        drawWall();
      }
    }).observe(el);
  }
}
function fillTable() {
  const box = $('[data-table="wall"]', lab);
  if (!box || !box.closest('details').open) return;
  const rows = all();
  box.innerHTML = '<div class="table-scroll" tabindex="0" role="region" aria-label="Every trend"><table><thead><tr><th scope="col">Trend</th><th scope="col">Momentum</th><th scope="col">Lasts</th>' +
    SHOES.map((s) => '<th scope="col">' + s.name + '</th>').join('') + '<th scope="col">Best shoe</th><th scope="col">Call</th></tr></thead><tbody>' +
    rows.map(({ t, e }) => '<tr><th scope="row">' + esc(t.name) + '</th><td class="num">' + e.momentum + '</td><td>' + WINDOWS[t.window].name + '</td>' +
      SHOES.map((s) => '<td class="num">' + e.fits[s.key].now + '</td>').join('') + '<td>' + shoeName(e.shoe) + '</td><td>' + CALLS[e.call] + '</td></tr>').join('') +
    '</tbody></table></div>';
}

/* ---------------------------------------------------------------- Update */
let liveTimer = null;
function announce() {
  clearTimeout(liveTimer);
  liveTimer = setTimeout(() => {
    const t = cur();
    const e = evaluate(t);
    $('[data-out="live"]', lab).textContent = t.name + ': ' + CALLS[e.call] + '. Momentum ' + e.momentum + ', best fit ' + e.fit + ' with the ' + shoeName(e.shoe) + '.';
  }, 600);
}
function update(opts = {}) {
  renderTrends();
  if (!opts.typing) renderCard();
  renderGrid();
  renderLevers();
  renderCall();
  drawWall();
  announce();
}
function pick(key) {
  if (!state.trends.some((t) => t.key === key)) return;
  state.sel = key;
  state.shoe = evaluate(cur()).shoe; // on a phone, open the shoe that counts
  update();
}

function init() {
  if (!lab) return;
  lab.classList.add('is-live');
  lab.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || !lab.contains(b)) return;
    if (b.dataset.pick) {
      pick(b.dataset.pick);
      const again = $('[data-pick="' + b.dataset.pick + '"]', lab);
      if (again) again.focus();
    } else if (b.hasAttribute('data-add')) {
      if (state.trends.length >= MAX_TRENDS) return;
      state.made += 1;
      const t = newTrend(state.made);
      state.trends.push(t);
      state.sel = t.key;
      update();
      const input = $('#wc-name');
      if (input) { input.focus(); input.select(); }
    } else if (b.hasAttribute('data-remove')) {
      const i = state.trends.findIndex((t) => t.key === state.sel);
      if (i >= 0 && state.trends[i].custom) {
        state.trends.splice(i, 1);
        state.sel = state.trends[Math.max(0, i - 1)].key;
        update();
        const again = $('[data-pick="' + state.sel + '"]', lab);
        if (again) again.focus();
      }
    } else if (b.dataset.window) {
      cur().window = b.dataset.window;
      update();
    } else if (b.dataset.tab) {
      state.shoe = b.dataset.tab;
      renderGrid();
      const again = $('[data-tab="' + state.shoe + '"]', lab);
      if (again) again.focus();
    } else if (b.classList.contains('star')) {
      const g = b.closest('.stars');
      setRating(g.dataset.shoe, g.dataset.trait, Number(b.dataset.v), true);
    } else if (b.hasAttribute('data-reset')) {
      state.trends = defaults();
      state.sel = 'samba';
      state.made = 0;
      state.shoe = 'oldskool';
      gridFor = null;
      update();
    }
  });
  lab.addEventListener('keydown', (e) => {
    const b = e.target.closest && e.target.closest('.star');
    if (!b) return;
    const g = b.closest('.stars');
    const v = cur().ratings[g.dataset.shoe][g.dataset.trait];
    let next = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = v + 1;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = v - 1;
    else if (e.key === 'Home') next = 1;
    else if (e.key === 'End') next = 5;
    if (next == null) return;
    e.preventDefault();
    setRating(g.dataset.shoe, g.dataset.trait, next, true);
  });
  lab.addEventListener('input', (e) => {
    const el = e.target;
    const t = cur();
    if (el.dataset.signal) {
      t[el.dataset.signal] = Number(el.value);
      update();
    } else if (el.dataset.lever) {
      t.levers[el.dataset.lever] = Number(el.value);
      update();
    } else if (el.id === 'wc-name') {
      t.name = el.value.trim() || 'Your trend';
      update({ typing: true });
    }
  });
  lab.addEventListener('change', (e) => {
    if (e.target.id === 'wc-name') {
      const t = cur();
      t.name = e.target.value.trim() || 'Your trend';
      e.target.value = t.name;
    }
  });
  $$('details.numbers', lab).forEach((d) => d.addEventListener('toggle', fillTable));
  wireWall();
  document.addEventListener('scg:theme', drawWall);
  update();
}

init();
