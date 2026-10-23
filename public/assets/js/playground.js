// G07 · What does the next store cost? The playable version of the Excel workbook.
// Every number comes from model.js, which runs the workbook's rules. This file only
// wires the levers and draws the results.
import { run, defaults, challenges, paybackText, switchboard, lineState, COMMIT, PAY_AS_YOU_GO } from './model.js';
import { ITEMS, TIER_NAME, RECIPES, RECIPE_LETTER, SCALE_PRESETS, PRICE_BREAK_AT } from './model-data.js';

const T = ['SPLUS', 'S', 'D'];
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const nf = new Intl.NumberFormat('en-US');
const MINUS = '−';
const usd = (v) => (v < 0 ? MINUS : '') + '$' + nf.format(Math.round(Math.abs(v)));
function usdShort(v) {
  const a = Math.abs(v);
  const sign = v < 0 ? MINUS : '';
  if (a >= 1e6) return sign + '$' + (a / 1e6).toFixed(a >= 1e7 ? 1 : 2).replace(/\.?0+$/, '') + 'M';
  if (a >= 1e3) return sign + '$' + Math.round(a / 1e3) + 'K';
  return sign + '$' + Math.round(a);
}
const people = (v) => (v >= 1e6 ? (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : Math.round(v / 1e3) + 'K');
const pct = (x, d = 0) => (x * 100).toFixed(d) + '%';
const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);
const listAnd = (xs) => (xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1]);

// Stores to open over five years, spread 1 : 2 : 3 : 4 : 5 like the workbook's
// default plan (30 stores opens 2, 4, 6, 8 and 10).
function spread(n) {
  const w = [1, 2, 3, 4, 5];
  const base = w.map((x) => Math.floor((n * x) / 15));
  const remd = w.map((x) => (n * x) % 15);
  let left = n - base.reduce((a, b) => a + b, 0);
  [...w.keys()].sort((a, b) => remd[b] - remd[a] || a - b).forEach((j) => { if (left > 0) { base[j] += 1; left -= 1; } });
  return base.concat([0, 0, 0]);
}

const lab = $('#lab');
const state = { s: defaults(), n: 30, board: 'SPLUS', more: false, test: 'A' };
let R = null;
let doneBefore = null;

/* ---------------------------------------------------------------- Step 1 */
function inRecipes(code) {
  const names = RECIPES.filter((r) => code.includes(RECIPE_LETTER[r]));
  if (!names.length) return 'In no recipe';
  if (names.length === 3) return 'In every recipe';
  return names.length === 1 ? names[0] + ' only' : 'In ' + names.join(' and ');
}
// Lines the recipes change for this size, and the lines every recipe includes.
const isExtra = (it, t) => it.codes[t] !== 'LBS' && (it.driver === 'pct' || it.vals[t] !== 0);
const isCore = (it, t) => it.codes[t] === 'LBS';

function baseline(t) {
  return switchboard({ ...state.s, call: {} }, t, state.s.recipe[t]).pilot;
}
function renderSizes() {
  $$('.size-card').forEach((card) => {
    const t = card.dataset.size;
    const sw = R.SW[t];
    $$('[data-recipe]', card).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.recipe === state.s.recipe[t])));
    $('[data-out="pilot"]', card).textContent = usd(sw.pilot);
    const d = sw.pilot - baseline(t);
    $('[data-out="delta"]', card).textContent = Math.abs(d) >= 1 ? (d > 0 ? '+' : MINUS) + usd(Math.abs(d)) + ' against ' + state.s.recipe[t] : '';
    $('[data-out="split"]', card).innerHTML = ['Build', 'Tech', 'Design', 'Business'].map((b) => '<div><dt>' + b + '</dt><dd>' + usd(sw.bucket[b]) + '</dd></div>').join('');
    const mine = R.stores.filter((x) => x.tier === t);
    const scale = $('[data-out="scale"]', card);
    if (!mine.length) {
      scale.innerHTML = 'No ' + TIER_NAME[t].toLowerCase() + ' stores in the plan yet.' + (sw.format_once ? ' The first one adds <b>' + usd(sw.format_once) + '</b> of one-time design.' : '');
    } else {
      const off = 1 - R.atscale[t] / sw.pilot;
      scale.innerHTML = 'Across your ' + plural(mine.length, TIER_NAME[t].toLowerCase() + ' store', TIER_NAME[t].toLowerCase() + ' stores') +
        ', <b>' + usd(R.atscale[t]) + '</b> each on average, ' + (off >= 0.0005 ? pct(off) + ' below the first' : 'the same as the first') + '.' +
        (sw.format_once ? ' Plus <b>' + usd(sw.format_once) + '</b> of one-time design with the first.' : '');
    }
    const ed = $('[data-edit]', card);
    ed.setAttribute('aria-pressed', String(state.board === t));
    card.classList.toggle('is-editing', state.board === t);
  });
}

// The switchboard: one row per line, flipped in place so keyboard focus stays put.
function lineButton(it, t) {
  return '<li><button type="button" class="line" role="switch" data-line="' + it.id + '"><span class="ln-sw" aria-hidden="true"></span>' +
    '<span class="ln-name">' + esc(it.name) + '</span><span class="ln-amt"></span><span class="ln-meta"></span></button></li>';
}
let boardBuilt = null;
function buildBoard() {
  const t = state.board;
  const extras = ITEMS.filter((it) => isExtra(it, t));
  $('[data-out="board-extras"]', lab).innerHTML = extras.map((it) => lineButton(it, t)).join('');
  const groups = [['Build', 'Shell and fit-out'], ['Tech', 'Tech'], ['Design', 'Design'], ['Business', 'Business and launch']];
  const core = ITEMS.filter((it) => isCore(it, t) && it.driver !== 'format');
  const once = ITEMS.filter((it) => isCore(it, t) && it.driver === 'format');
  $('[data-out="board-core"]', lab).innerHTML = groups.map(([b, label]) => {
    const xs = core.filter((it) => it.bucket === b);
    return xs.length ? '<div class="core-group"><p class="core-k">' + label + '</p><ul class="board-lines">' + xs.map((it) => lineButton(it, t)).join('') + '</ul></div>' : '';
  }).join('') + (once.length ? '<div class="core-group"><p class="core-k">Once, with the first store of this size</p><ul class="board-lines">' + once.map((it) => lineButton(it, t)).join('') + '</ul></div>' : '');
  boardBuilt = t;
}
function renderBoard() {
  const t = state.board;
  if (boardBuilt !== t) buildBoard();
  $$('[data-board-size]', lab).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.boardSize === t)));
  const sw = R.SW[t];
  const recipe = state.s.recipe[t];
  $$('.line', lab).forEach((btn) => {
    const it = ITEMS.find((x) => x.id === btn.dataset.line);
    const on = sw.states[it.id] === 'ON';
    const byRecipe = it.codes[t].includes(RECIPE_LETTER[recipe]);
    const call = state.s.call[it.id + '|' + t];
    const mine = call != null && (call === 'ON') !== byRecipe;
    btn.setAttribute('aria-checked', String(on));
    btn.classList.toggle('is-call', mine);
    const amt = sw.base[it.id];
    let amount = usd(amt);
    if (it.driver === 'pct') amount = usd(amt) + ' (' + pct(it.vals[t]) + ')';
    if (it.driver === 'format') amount = usd(amt) + ' once';
    $('.ln-amt', btn).textContent = amount;
    $('.ln-meta', btn).textContent = mine ? 'Your call · ' + inRecipes(it.codes[t]) : inRecipes(it.codes[t]);
    btn.setAttribute('aria-label', it.name + ', ' + amount + (it.driver === 'ft2' ? ', $' + it.vals[t] + ' per square foot' : '') + '. ' + (mine ? 'Your call. ' : '') + inRecipes(it.codes[t]) + '.');
  });
  const calls = Object.keys(state.s.call).filter((k) => k.endsWith('|' + t));
  $('[data-board-reset]', lab).hidden = !calls.length;
  $('[data-out="board-note"]', lab).textContent = 'The ' + TIER_NAME[t].toLowerCase() + ' store’s lines that change between recipes. A switch you flip beats the recipe.';
  const more = $('[data-board-more]', lab);
  more.setAttribute('aria-expanded', String(state.more));
  more.textContent = state.more ? 'Hide the other lines' : 'Show the ' + ITEMS.filter((it) => isCore(it, t)).length + ' lines every recipe has';
  $('#board-core').hidden = !state.more;
}
function flipLine(id) {
  const t = state.board;
  const it = ITEMS.find((x) => x.id === id);
  const now = lineState(state.s, it, t) === 'ON';
  const byRecipe = it.codes[t].includes(RECIPE_LETTER[state.s.recipe[t]]);
  const next = !now;
  if (next === byRecipe) delete state.s.call[id + '|' + t];
  else state.s.call[id + '|' + t] = next ? 'ON' : 'OFF';
  update();
}

/* ---------------------------------------------------------------- Step 2 */
function renderGrow() {
  $('[data-out="n"]', lab).textContent = String(state.n);
  const plan = state.s.openings.slice(0, 5);
  $('[data-out="plan"]', lab).textContent = state.n ? 'Opening ' + listAnd(plan.map(String)) + ' a year' : 'No stores planned';
  $('#n-stores').setAttribute('aria-valuetext', state.n + ' stores');
  const p = SCALE_PRESETS[state.s.outlook];
  $$('[data-outlook]', lab).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.outlook === state.s.outlook)));
  $('[data-out="outlook"]', lab).textContent = 'Labour lines fall ' + pct(1 - p.lr) + ' each time the stores of a size double, down to ' + pct(p.floor) +
    ' of the first store, and stores of the other sizes count for ' + ({ 0.25: 'a quarter', 0.5: 'half', 0.75: 'three quarters' }[p.share] || pct(p.share)) +
    '. Price breaks reach ' + pct(p.disc[3]) + ' from the ' + PRICE_BREAK_AT[3] + 'th store.';
  $$('[data-deal]', lab).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.deal === state.s.deal)));
  $('[data-out="deal"]', lab).textContent = state.s.deal === COMMIT
    ? 'Every store gets the price break for the whole order of ' + plural(state.n, 'store', 'stores') + ', from the first one.'
    : 'Each store gets the price break for the stores bought so far.';
  draw('builds');
}

/* ---------------------------------------------------------------- Step 3 */
const TESTS = {
  A: { key: 'passA', name: 'Dashboard test', lower: 'dashboard test', build: 'first-store build' },
  B: { key: 'passB', name: 'Dashboard test', lower: 'dashboard test', build: 'build at scale' },
  C: { key: 'passC', name: 'Full store P&L', lower: 'full store P&L', build: 'first-store build' },
  D: { key: 'passD', name: 'Full store P&L', lower: 'full store P&L', build: 'build at scale' }
};
const sum3 = (c) => c.SPLUS + c.S + c.D;
function mixLine(c) {
  const tot = sum3(c);
  if (!tot) return 'none of each size';
  return T.map((t) => pct(c[t] / tot) + ' ' + TIER_NAME[t].toLowerCase()).join(', ');
}
function renderStreets() {
  $$('[data-mix]', lab).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mix === state.s.mix_source)));
  const tgt = R.target;
  const split = T.map((t) => plural(tgt[t], { SPLUS: 'flagship', S: 'standard', D: 'small' }[t], { SPLUS: 'flagships', S: 'standard', D: 'small' }[t])).join(', ');
  let why;
  if (state.s.mix_source === 'dash') why = sum3(R.countA) + ' streets pass the dashboard test: ' + mixLine(R.countA) + '.';
  else if (state.s.mix_source === 'pnl') why = sum3(R.countC) + ' streets pass a full store P&L: ' + mixLine(R.countC) + '.';
  else why = 'The streets don’t get a say.';
  $('[data-out="mix"]', lab).textContent = why + (state.n ? ' Your ' + state.n + ' stores: ' + split + '.' : '');
  $('[data-out="handoff"]', lab).innerHTML = T.map((t) => '<div><dt><span class="sc-key sk-' + t + '" aria-hidden="true"></span>' + TIER_NAME[t] + '</dt><dd>' + usd(R.tableau_build[t]) + '</dd></div>').join('');
  const here = sum3(R.countA);
  $('[data-out="handoff-result"]', lab).textContent = R.countA_rounded === here
    ? 'The dashboard will then show ' + here + ' of the 78 streets paying back, the same as here.'
    : 'The dashboard will then show ' + R.countA_rounded + ' of the 78 streets paying back. Here it’s ' + here + ', because its sliders round to $50,000.';
  const cell = (k) => {
    const c = R['count' + k];
    return '<button type="button" class="test-cell" data-test="' + k + '" aria-pressed="' + (state.test === k) + '" aria-label="' + TESTS[k].name + ' with the ' + TESTS[k].build + ': ' + sum3(c) + ' of 78 streets pay back. Show them on the chart.">' +
      '<b>' + sum3(c) + '</b><span>of 78</span></button>';
  };
  $('[data-out="tests"]', lab).innerHTML = '<span></span><span class="tg-h">First store</span><span class="tg-h">At scale</span>' +
    '<span class="tg-r">Dashboard test<small>Same as Tableau</small></span>' + cell('A') + cell('B') +
    '<span class="tg-r">Full store P&amp;L<small>Rent, staff, energy</small></span>' + cell('C') + cell('D');
  $('[data-out="streets-title"]', lab).textContent = 'The 78 streets, busiest first: ' + TESTS[state.test].lower + ', ' + TESTS[state.test].build;
  draw('streets');
}

/* ---------------------------------------------------------------- Step 4 */
function renderPay() {
  const kp = [
    [usdShort(R.total_invest), 'Total investment: builds, opening stock, design and setup'],
    [usdShort(R.peak_need), 'Peak cash needed'],
    [paybackText(R), 'When the rollout is back above zero'],
    [usdShort(R.npv), 'Worth today, ten years at 10% (NPV)'],
    [R.N ? R.repay5 + ' of ' + R.N : '–', 'Stores that repay their build within 5 years']
  ];
  $('[data-out="kpis"]', lab).innerHTML = kp.map(([v, k]) => '<div><dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd></div>').join('');
  draw('cash');
}

/* ---------------------------------------------------------------- Challenges */
const CHECK = '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.5 7.5 5.5 10.5 11.5 3.5"/></svg>';
function renderGoals() {
  const goals = challenges(state.s, R);
  const done = goals.filter((g) => g.done).length;
  $('[data-out="goals-count"]', lab).textContent = done + ' of 6 done';
  const list = $('[data-out="goals"]', lab);
  const fresh = doneBefore ? goals.filter((g) => g.done && !doneBefore.has(g.key)).map((g) => g.key) : [];
  list.innerHTML = goals.map((g, i) => '<li class="goal' + (g.done ? ' is-done' : '') + (fresh.includes(g.key) && !reduced() ? ' just-done' : '') + '">' +
    '<div class="goal-top"><span>Challenge ' + (i + 1) + '</span><span class="goal-badge">' + (g.done ? CHECK + 'Done' : 'Not yet' + (g.status ? ': ' + esc(g.status) : '')) + '</span></div>' +
    '<h4>' + esc(g.title) + '</h4><p>' + esc(g.goal) + '</p>' + (g.done ? '' : '<p class="goal-hint">Hint: ' + esc(g.hint) + '</p>') + '</li>').join('');
  doneBefore = new Set(goals.filter((g) => g.done).map((g) => g.key));
}

/* ---------------------------------------------------------------- Charts */
// Charts are drawn at their real width so the type stays at its real size.
// A crosshair (or the bar under the pointer) shows a tooltip; the arrow keys do
// the same on a focused chart, and every value is also in "See the numbers".
const charts = {};
function niceStep(range, target) {
  const raw = range / target;
  const p = 10 ** Math.floor(Math.log10(raw));
  const f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
}
// Clean tick values covering lo to hi, from the nearest step below lo to the nearest step above hi.
function ticks(lo, hi, target) {
  const step = niceStep(hi - lo || 1, target);
  const a = Math.floor(lo / step + 1e-9);
  const b = Math.max(a + 1, Math.ceil(hi / step - 1e-9));
  const list = [];
  for (let i = a; i <= b; i++) list.push(i * step);
  return { step, list, lo: list[0], hi: list[list.length - 1] };
}
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
  const tw = tip.offsetWidth;
  const th = tip.offsetHeight;
  let left = x + 14;
  if (left + tw > W) left = Math.max(0, x - tw - 14);
  tip.style.left = left + 'px';
  tip.style.top = Math.max(0, y - th - 10) + 'px';
}
function tipHide(el) {
  const tip = $('.tip', el);
  if (tip) tip.hidden = true;
}
function axisY(t, m, W, y, fmt) {
  return t.list.map((v) => '<line class="grid" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y(v) + '" y2="' + y(v) + '"></line>' +
    '<text class="tick" x="' + (m.l - 8) + '" y="' + y(v) + '" text-anchor="end" dy="0.35em">' + fmt(v) + '</text>').join('');
}

// Every store's build, in opening order: one line per size.
function drawBuilds(el) {
  const stores = R.stores;
  const N = stores.length;
  if (!N) {
    el.innerHTML = '<p class="chart-empty">No stores planned yet. Move the slider to open some.</p>';
    return null;
  }
  const W = el.clientWidth;
  const H = W < 520 ? 230 : 270;
  const m = { l: 50, r: W < 520 ? 50 : 64, t: 12, b: 30 };
  const top = Math.max(...T.filter((t) => stores.some((x) => x.tier === t)).map((t) => R.SW[t].pilot), ...stores.map((x) => x.build_today));
  const ty = ticks(0, top * 1.05, 4);
  const x = (k) => (N === 1 ? (m.l + W - m.r) / 2 : m.l + ((k - 1) / (N - 1)) * (W - m.l - m.r));
  const y = (v) => m.t + (1 - v / ty.hi) * (H - m.t - m.b);
  const xt = N <= 12 ? stores.map((s) => s.k) : ticks(1, N, W < 520 ? 4 : 6).list.filter((k) => k >= 1 && k <= N);
  if (xt[0] !== 1) xt.unshift(1);
  let svg = axisY(ty, m, W, y, (v) => (v ? usdShort(v) : '$0'));
  svg += '<line class="axis" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y(0) + '" y2="' + y(0) + '"></line>';
  svg += xt.map((k) => '<text class="tick" x="' + x(k) + '" y="' + (H - m.b + 18) + '" text-anchor="middle">' + k + '</text>').join('');
  const dots = N <= 40;
  T.forEach((t) => {
    const xs = stores.filter((s) => s.tier === t);
    if (!xs.length) return;
    svg += '<path class="ln ln-' + t + '" d="' + xs.map((s, i) => (i ? 'L' : 'M') + x(s.k).toFixed(1) + ' ' + y(s.build_today).toFixed(1)).join('') + '"></path>';
    if (dots) svg += xs.map((s) => '<circle class="dot dot-' + t + '" cx="' + x(s.k).toFixed(1) + '" cy="' + y(s.build_today).toFixed(1) + '" r="4"></circle>').join('');
    else {
      const last = xs[xs.length - 1];
      svg += '<circle class="dot dot-' + t + '" cx="' + x(last.k).toFixed(1) + '" cy="' + y(last.build_today).toFixed(1) + '" r="4"></circle>';
    }
    const last = xs[xs.length - 1];
    svg += '<text class="end" x="' + (W - m.r + 8) + '" y="' + y(last.build_today).toFixed(1) + '" dy="0.35em">' + usdShort(last.build_today) + '</text>';
  });
  svg += '<line class="cross" x1="0" x2="0" y1="' + m.t + '" y2="' + (H - m.b) + '" visibility="hidden"></line><circle class="hot" r="6" visibility="hidden"></circle>';
  const label = 'Line chart of the build cost of each of your ' + N + ' stores in opening order. ' +
    T.filter((t) => stores.some((s) => s.tier === t)).map((t) => {
      const xs = stores.filter((s) => s.tier === t);
      return TIER_NAME[t] + ' stores fall from ' + usd(xs[0].build_today) + ' to ' + usd(xs[xs.length - 1].build_today);
    }).join('. ') + '.';
  el.innerHTML = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' + svg + '</svg>';
  return {
    count: N,
    at: (px) => Math.max(1, Math.min(N, Math.round(N === 1 ? 1 : 1 + ((px - m.l) / (W - m.l - m.r)) * (N - 1)))),
    show: (k) => {
      const s = stores[k - 1];
      const svgEl = $('svg', el);
      const cross = $('.cross', svgEl);
      cross.setAttribute('x1', x(k));
      cross.setAttribute('x2', x(k));
      cross.setAttribute('visibility', 'visible');
      const hot = $('.hot', svgEl);
      hot.setAttribute('cx', x(k));
      hot.setAttribute('cy', y(s.build_today));
      hot.setAttribute('class', 'hot hot-' + s.tier);
      hot.setAttribute('visibility', 'visible');
      const first = R.SW[s.tier].pilot;
      tipShow(el, '<b>' + usd(s.build_today) + '</b><span class="tip-k"><i class="tk tk-' + s.tier + '"></i>' + TIER_NAME[s.tier] + ' store ' + s.unit + ' · store ' + s.k + ' of ' + N + '</span>' +
        '<span>Opens in Year ' + s.year + (first > s.build_today + 0.5 ? ' · ' + pct(1 - s.build_today / first) + ' below the first' : '') + '</span>' +
        '<span class="tip-street">' + esc(s.street) + '</span>', x(k), y(s.build_today));
    },
    hide: () => {
      const svgEl = $('svg', el);
      if (!svgEl) return;
      $('.cross', svgEl).setAttribute('visibility', 'hidden');
      $('.hot', svgEl).setAttribute('visibility', 'hidden');
      tipHide(el);
    }
  };
}

// The 78 streets, busiest first, coloured by the store size each one earns.
// Filled bars pay back under the chosen test; outlines don't.
function streetRows() {
  return R.M.slice().sort((a, b) => b.F - a.F || a.id - b.id);
}
function drawStreets(el) {
  const rows = streetRows();
  const key = TESTS[state.test].key;
  const W = el.clientWidth;
  const H = W < 520 ? 190 : 210;
  const m = { l: 44, r: 6, t: 10, b: 24 };
  const ty = ticks(0, Math.max(...rows.map((r) => r.F)), 3);
  const y = (v) => m.t + (1 - v / ty.hi) * (H - m.t - m.b);
  const pitch = (W - m.l - m.r) / rows.length;
  const bw = Math.max(1.5, pitch - (pitch > 5 ? 2 : 1));
  let svg = axisY(ty, m, W, y, (v) => (v ? people(v) : '0'));
  svg += rows.map((r, i) => {
    const pass = r[key];
    const x0 = m.l + i * pitch + (pitch - bw) / 2;
    const h = Math.max(1, y(0) - y(r.F));
    return pass
      ? '<rect class="bar bar-' + r.tl + '" x="' + x0.toFixed(2) + '" y="' + (y(0) - h).toFixed(2) + '" width="' + bw.toFixed(2) + '" height="' + h.toFixed(2) + '" rx="1"></rect>'
      : '<rect class="bar bar-' + r.tl + ' bar-fail" x="' + (x0 + 0.6).toFixed(2) + '" y="' + (y(0) - h + 0.6).toFixed(2) + '" width="' + Math.max(0.5, bw - 1.2).toFixed(2) + '" height="' + Math.max(0.5, h - 0.6).toFixed(2) + '" rx="1"></rect>';
  }).join('');
  svg += '<line class="axis" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y(0) + '" y2="' + y(0) + '"></line>';
  svg += '<text class="tick" x="' + m.l + '" y="' + (H - 6) + '">Busiest</text><text class="tick" x="' + (W - m.r) + '" y="' + (H - 6) + '" text-anchor="end">Quietest</text>';
  svg += '<rect class="hotbar" visibility="hidden"></rect>';
  const pass = rows.filter((r) => r[key]).length;
  const label = 'Bar chart of the 78 Melbourne streets by people walking past a year, busiest first. ' + pass + ' pay back under the ' + TESTS[state.test].lower + ' with the ' + TESTS[state.test].build + '.';
  el.innerHTML = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' + svg + '</svg>';
  const econ = state.s.econ;
  return {
    count: rows.length,
    at: (px) => Math.max(1, Math.min(rows.length, Math.floor((px - m.l) / pitch) + 1)),
    show: (i) => {
      const r = rows[i - 1];
      const hb = $('.hotbar', el);
      hb.setAttribute('x', (m.l + (i - 1) * pitch).toFixed(2));
      hb.setAttribute('width', pitch.toFixed(2));
      hb.setAttribute('y', m.t);
      hb.setAttribute('height', H - m.t - m.b);
      hb.setAttribute('visibility', 'visible');
      const p = r[key];
      let need;
      let give;
      if (state.test === 'A' || state.test === 'B') {
        need = state.test === 'A' ? r.reqA : r.reqB;
        give = econ.capture;
      } else {
        need = state.test === 'C' ? r.reqC : r.reqD;
        give = r.possible / (r.F * econ.conversion * econ.ticket);
      }
      tipShow(el, '<b>' + esc(r.label) + '</b><span class="tip-k"><i class="tk tk-' + r.tl + '"></i>' + TIER_NAME[r.tl] + ' street · ' + esc(r.arch) + '</span>' +
        '<span>' + people(r.F) + ' people walk past a year</span>' +
        '<span>' + (p ? 'Pays back' : 'Doesn’t pay back') + ': ' + pct(need, 1) + ' must come in, ' + pct(give, 1) + ' can</span>', m.l + (i - 0.5) * pitch, y(r.F));
    },
    hide: () => {
      const hb = $('.hotbar', el);
      if (hb) hb.setAttribute('visibility', 'hidden');
      tipHide(el);
    }
  };
}

// Cash over ten years: everything spent and earned, added up year by year.
function drawCash(el) {
  if (!R.N) {
    el.innerHTML = '<p class="chart-empty">No stores, no cash flow. Open some stores in step 2.</p>';
    return null;
  }
  const W = el.clientWidth;
  const H = W < 520 ? 230 : 270;
  const m = { l: 56, r: 18, t: 16, b: 30 };
  const pts = [0].concat(R.cum);
  const ty = ticks(Math.min(0, ...pts), Math.max(0, ...pts), 4);
  const x = (yr) => m.l + (yr / 10) * (W - m.l - m.r);
  const y = (v) => m.t + ((ty.hi - v) / (ty.hi - ty.lo)) * (H - m.t - m.b);
  let svg = axisY(ty, m, W, y, (v) => (v ? usdShort(v) : '$0'));
  svg += '<line class="axis zero" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y(0) + '" y2="' + y(0) + '"></line>';
  for (let yr = 0; yr <= 10; yr += W < 520 ? 2 : 1) svg += '<text class="tick" x="' + x(yr) + '" y="' + (H - m.b + 18) + '" text-anchor="middle">' + (yr === 0 ? 'Start' : yr) + '</text>';
  const line = pts.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join('');
  svg += '<path class="area" d="' + line + 'L' + x(10).toFixed(1) + ' ' + y(0).toFixed(1) + 'L' + x(0).toFixed(1) + ' ' + y(0).toFixed(1) + 'Z"></path>';
  svg += '<path class="ln ln-cash" d="' + line + '"></path>';
  const low = R.cum.indexOf(Math.min(...R.cum));
  // The lowest point gets its label underneath (the line rises on both sides of it); the
  // year it's back above zero gets its label above and to the left (the line is lower there).
  const edge = (px, anchor) => (anchor === 'middle' ? Math.min(W - m.r - 70, Math.max(m.l + 70, px)) : px);
  if (R.cum[low] < 0) {
    const lx = x(low + 1);
    const ly = y(R.cum[low]);
    svg += '<circle class="dot dot-low" cx="' + lx + '" cy="' + ly + '" r="4.5"></circle>';
    const below = ly + 20 <= H - m.b - 4;
    svg += '<text class="note" x="' + edge(lx, 'middle') + '" y="' + (below ? ly + 20 : ly - 12) + '" text-anchor="middle">Peak need ' + usdShort(-R.cum[low]) + '</text>';
  }
  if (R.payback_year) {
    const py = R.payback_year;
    const px = x(py);
    const pyy = y(R.cum[py - 1]);
    svg += '<circle class="dot dot-back" cx="' + px + '" cy="' + pyy + '" r="5"></circle>';
    const text = W < 520 ? 'Above zero in Year ' + py : 'Back above zero in Year ' + py;
    const len = text.length * 6.7;
    let tx = px - 10;
    let anchor = 'end';
    if (px - 10 - len < m.l) {
      if (px + 10 + len <= W - m.r) {
        tx = px + 10;
        anchor = 'start';
      } else {
        tx = Math.min(W - m.r - len / 2, Math.max(m.l + len / 2, px));
        anchor = 'middle';
      }
    }
    svg += '<text class="note note-back" x="' + tx + '" y="' + Math.max(m.t + 10, pyy - 12) + '" text-anchor="' + anchor + '">' + text + '</text>';
  }
  svg += '<line class="cross" x1="0" x2="0" y1="' + m.t + '" y2="' + (H - m.b) + '" visibility="hidden"></line><circle class="hot hot-cash" r="6" visibility="hidden"></circle>';
  const label = 'Line chart of the rollout’s cash over ten years. ' + (R.cum[low] < 0 ? 'It needs ' + usd(-R.cum[low]) + ' at its lowest, in Year ' + (low + 1) + '. ' : '') +
    (R.payback_year ? 'It is back above zero in Year ' + R.payback_year + ' and ends Year 10 at ' + usd(R.cum10) + '.' : 'It is not back above zero within ten years.');
  el.innerHTML = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' + svg + '</svg>';
  return {
    count: 10,
    at: (px) => Math.max(1, Math.min(10, Math.round(((px - m.l) / (W - m.l - m.r)) * 10))),
    show: (yr) => {
      const svgEl = $('svg', el);
      const cross = $('.cross', svgEl);
      cross.setAttribute('x1', x(yr));
      cross.setAttribute('x2', x(yr));
      cross.setAttribute('visibility', 'visible');
      const hot = $('.hot', svgEl);
      hot.setAttribute('cx', x(yr));
      hot.setAttribute('cy', y(R.cum[yr - 1]));
      hot.setAttribute('visibility', 'visible');
      const i = yr - 1;
      const spent = R.capex[i] + R.fmt[i] + R.prog[i] + R.stock[i];
      const program = R.central[i] + R.platform[i] + R.techcost[i] + R.mgrcost[i];
      tipShow(el, '<b>' + usd(R.cum[i]) + '</b><span class="tip-k">Cash so far, end of Year ' + yr + '</span>' +
        '<span>This year ' + usd(R.net[i]) + ' · ' + plural(R.open_end[i], 'store', 'stores') + ' open</span>' +
        '<span>Stores earn ' + usdShort(R.contrib[i]) + ' · builds and stock ' + usdShort(spent) + ' · program ' + usdShort(program) + '</span>', x(yr), y(R.cum[i]));
    },
    hide: () => {
      const svgEl = $('svg', el);
      if (!svgEl) return;
      $('.cross', svgEl).setAttribute('visibility', 'hidden');
      $('.hot', svgEl).setAttribute('visibility', 'hidden');
      tipHide(el);
    }
  };
}

const DRAW = { builds: drawBuilds, streets: drawStreets, cash: drawCash };
function draw(name) {
  const el = $('[data-chart="' + name + '"]', lab);
  if (!el) return;
  const c = charts[name] || (charts[name] = { el, api: null, idx: 0 });
  c.api = DRAW[name](el);
  if (c.api) {
    const svgEl = $('svg', el);
    el.tabIndex = 0;
    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', svgEl.getAttribute('aria-label') + ' Use the left and right arrow keys to step through it.');
    svgEl.removeAttribute('role');
    svgEl.setAttribute('aria-hidden', 'true');
    svgEl.setAttribute('focusable', 'false');
    let sr = $('.chart-sr', el);
    if (!sr) {
      sr = document.createElement('p');
      sr.className = 'chart-sr visually-hidden';
      sr.setAttribute('aria-live', 'polite');
      el.appendChild(sr);
    }
    if (c.idx > c.api.count) c.idx = 0;
    if (c.active && c.idx) c.api.show(c.idx);
  } else {
    el.removeAttribute('tabindex');
    el.removeAttribute('role');
    el.removeAttribute('aria-label');
  }
  fillTable(name);
}
function wireChart(name) {
  const el = $('[data-chart="' + name + '"]', lab);
  if (!el) return;
  const c = charts[name] || (charts[name] = { el, api: null, idx: 0 });
  const pos = (e) => e.clientX - el.getBoundingClientRect().left;
  el.addEventListener('pointermove', (e) => {
    if (!c.api) return;
    c.idx = c.api.at(pos(e));
    c.active = true;
    c.api.show(c.idx);
  });
  el.addEventListener('pointerleave', () => {
    c.active = false;
    if (c.api && document.activeElement !== el) c.api.hide();
  });
  const say = () => {
    const tip = $('.tip', el);
    const sr = $('.chart-sr', el);
    if (tip && sr) sr.textContent = Array.from(tip.children).map((x) => x.textContent).join('. ');
  };
  el.addEventListener('focus', () => {
    if (!c.api) return;
    c.active = true;
    c.idx = c.idx || 1;
    c.api.show(c.idx);
    say();
  });
  el.addEventListener('blur', () => {
    c.active = false;
    if (c.api) c.api.hide();
  });
  el.addEventListener('keydown', (e) => {
    if (!c.api) return;
    const n = c.api.count;
    let i = c.idx || 1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') i = Math.min(n, i + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') i = Math.max(1, i - 1);
    else if (e.key === 'Home') i = 1;
    else if (e.key === 'End') i = n;
    else if (e.key === 'Escape') { c.api.hide(); return; }
    else return;
    e.preventDefault();
    c.idx = i;
    c.api.show(i);
    say();
  });
  if ('ResizeObserver' in window) {
    let w = 0;
    new ResizeObserver(() => {
      if (el.clientWidth !== w && R) {
        w = el.clientWidth;
        draw(name);
      }
    }).observe(el);
  }
}

// "See the numbers": the table behind each chart, filled while it's open.
function fillTable(name) {
  const box = $('[data-table="' + name + '"]', lab);
  if (!box || !box.closest('details').open) return;
  let head;
  let rows;
  if (name === 'builds') {
    head = ['Store', 'Size', 'Opens', 'Street', 'Build'];
    rows = R.stores.map((s) => [s.k, TIER_NAME[s.tier] + ' ' + s.unit, 'Year ' + s.year, s.street, usd(s.build_today)]);
  } else if (name === 'streets') {
    const key = TESTS[state.test].key;
    head = ['Street', 'Kind of street', 'People a year', 'Size', 'Pays back'];
    rows = streetRows().map((r) => [r.label, r.arch, nf.format(r.F), TIER_NAME[r.tl], r[key] ? 'Yes' : 'No']);
  } else {
    head = ['Year', 'Stores open', 'Stores earn', 'Builds and stock', 'Program', 'This year', 'Cash so far'];
    rows = R.cum.map((v, i) => [i + 1, R.open_end[i], usd(R.contrib[i]), usd(R.capex[i] + R.fmt[i] + R.prog[i] + R.stock[i]),
      usd(R.central[i] + R.platform[i] + R.techcost[i] + R.mgrcost[i]), usd(R.net[i]), usd(v)]);
  }
  const num = (v) => /^[−$\d]/.test(String(v));
  box.innerHTML = rows.length
    ? '<div class="table-scroll" tabindex="0" role="region" aria-label="' + esc(name === 'builds' ? 'Every store' : name === 'streets' ? 'The 78 streets' : 'Cash by year') + '"><table><thead><tr>' +
      head.map((h) => '<th scope="col">' + h + '</th>').join('') + '</tr></thead><tbody>' +
      rows.map((r) => '<tr>' + r.map((v, i) => (i === 0 ? '<th scope="row">' + esc(v) + '</th>' : '<td' + (num(v) && i > 1 ? ' class="num"' : '') + '>' + esc(v) + '</td>')).join('') + '</tr>').join('') +
      '</tbody></table></div>'
    : '<p class="chart-empty">Nothing to show yet.</p>';
}

/* ---------------------------------------------------------------- Update */
let liveTimer = null;
function announce() {
  clearTimeout(liveTimer);
  liveTimer = setTimeout(() => {
    $('[data-out="live"]', lab).textContent = 'First flagship ' + usd(R.pilot.SPLUS) + '. ' + sum3(R.countA) + ' of 78 streets pay back on the dashboard test. ' +
      (R.N ? R.N + ' stores, ' + (R.payback_year ? 'back above zero in Year ' + R.payback_year : 'not back above zero within ten years') + ', worth ' + usdShort(R.npv) + ' today.' : 'No stores planned.');
  }, 700);
}
function update() {
  state.s.openings = spread(state.n);
  R = run(state.s);
  renderSizes();
  renderBoard();
  renderGrow();
  renderStreets();
  renderPay();
  renderGoals();
  announce();
}

function init() {
  if (!lab) return;
  lab.classList.add('is-live');
  lab.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || !lab.contains(b)) return;
    const card = b.closest('.size-card');
    if (b.dataset.recipe && card) {
      const t = card.dataset.size;
      state.s.recipe[t] = b.dataset.recipe;
      // A new recipe starts clean: drop your calls that now match it.
      Object.keys(state.s.call).filter((k) => k.endsWith('|' + t)).forEach((k) => {
        const it = ITEMS.find((x) => x.id === k.split('|')[0]);
        if ((state.s.call[k] === 'ON') === it.codes[t].includes(RECIPE_LETTER[state.s.recipe[t]])) delete state.s.call[k];
      });
      update();
    } else if (b.dataset.edit) {
      state.board = b.dataset.edit;
      update();
      $('#board').scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' });
    } else if (b.dataset.boardSize) {
      state.board = b.dataset.boardSize;
      update();
    } else if (b.dataset.line) {
      flipLine(b.dataset.line);
    } else if (b.hasAttribute('data-board-reset')) {
      Object.keys(state.s.call).filter((k) => k.endsWith('|' + state.board)).forEach((k) => delete state.s.call[k]);
      update();
      $('[data-board-size="' + state.board + '"]', lab).focus();
    } else if (b.hasAttribute('data-board-more')) {
      state.more = !state.more;
      renderBoard();
    } else if (b.dataset.outlook) {
      state.s.outlook = b.dataset.outlook;
      update();
    } else if (b.dataset.deal) {
      state.s.deal = b.dataset.deal === COMMIT ? COMMIT : PAY_AS_YOU_GO;
      update();
    } else if (b.dataset.mix) {
      state.s.mix_source = b.dataset.mix;
      state.test = b.dataset.mix === 'pnl' ? 'C' : 'A';
      update();
    } else if (b.dataset.test) {
      state.test = b.dataset.test;
      renderStreets();
      const again = $('[data-test="' + state.test + '"]', lab);
      if (again) again.focus();
    } else if (b.hasAttribute('data-reset')) {
      state.s = defaults();
      state.n = 30;
      state.board = 'SPLUS';
      state.more = false;
      state.test = 'A';
      $('#n-stores').value = '30';
      doneBefore = null;
      update();
    }
  });
  const range = $('#n-stores');
  let raf = 0;
  range.addEventListener('input', () => {
    state.n = Number(range.value) || 0;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(update);
  });
  $$('details.numbers', lab).forEach((d) => d.addEventListener('toggle', () => fillTable($('[data-table]', d).dataset.table)));
  ['builds', 'streets', 'cash'].forEach(wireChart);
  document.addEventListener('scg:theme', () => ['builds', 'streets', 'cash'].forEach(draw));
  update();
}

init();
