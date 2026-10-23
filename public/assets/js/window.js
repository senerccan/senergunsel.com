// G02 · Same store, two streets. The store comes from the G07 model, the streets
// from the G06 dashboard's 78 Melbourne sensors. For each street: the share of
// people walking past who must come in for the store to repay its build in the
// payback period (a full store P&L), against what that kind of street can give.
import { run, defaults, streetTest } from './model.js';
import { TIER_NAME } from './model-data.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = new Intl.NumberFormat('en-US');
const usd = (v) => '$' + nf.format(Math.round(v));
function usdShort(v) {
  if (v >= 1e6) return '$' + (v / 1e6).toFixed(v >= 1e7 ? 1 : 2).replace(/\.?0+$/, '') + 'M';
  return '$' + Math.round(v / 1e3) + 'K';
}
const people = (v) => (v >= 1e6 ? (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : Math.round(v / 1e3) + 'K');
const pct = (x, d = 1) => (x * 100).toFixed(d) + '%';
const KINDS = ['Destination Retail', 'Evening / Entertainment', 'CBD Core / All-Day', 'Transit Spine', 'Office / Weekday Core', 'Commuter Corridor', 'Low Activity'];

const s = defaults();
const R = run(s);
const state = { size: 'S', build: 'first', a: 4, b: 27 };

function streetOptions(sel, chosen) {
  sel.innerHTML = KINDS.map((k) => {
    const rows = R.M.filter((m) => m.arch === k).sort((x, y) => y.F - x.F);
    return '<optgroup label="' + esc(k) + '">' + rows.map((m) => '<option value="' + m.id + '"' + (m.id === chosen ? ' selected' : '') + '>' +
      esc(m.label) + ' · ' + people(m.F) + '</option>').join('') + '</optgroup>';
  }).join('');
}

function paint() {
  const t = state.size;
  const build = state.build === 'first' ? R.pilot[t] : R.atscale[t];
  $$('[data-size]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.size === t)));
  $$('[data-build]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.build === state.build)));
  const n = R.stores.filter((x) => x.tier === t).length;
  $('[data-out="store"]').innerHTML = 'A ' + TIER_NAME[t].toLowerCase() + ' store of ' + nf.format(s.area[t]) + ' ft², Balanced recipe: <b>' + usd(build) + '</b> to build' +
    (state.build === 'first' ? ', the first of its size.' : ', the average across the ' + n + ' in the model’s 30-store rollout.');
  ['a', 'b'].forEach((side) => {
    const col = $('.st-col[data-side="' + side + '"]');
    const m = R.M.find((x) => x.id === state[side]);
    const r = streetTest(s, R, t, m, build);
    $('[data-out="what"]', col).textContent = m.arch + ' · ' + people(m.F) + ' people walk past a year';
    $('[data-out="need"]', col).textContent = r.req >= 0.1 ? '10%+' : pct(r.req);
    const room = Math.min(r.give, r.reach);
    $('[data-out="can"]', col).style.width = Math.min(100, room * 1000).toFixed(1) + '%';
    const left = Math.min(100, r.req * 1000).toFixed(1) + '%';
    $('[data-out="knob"]', col).style.left = left;
    const pb = r.store.payback;
    let verdict;
    if (r.pass) verdict = '<b class="ok">Pays back in ' + pb.toFixed(1) + ' years.</b> ' + pct(r.req) + ' must come in, and this street can give ' + pct(room) + '.';
    else if (pb != null) verdict = '<b class="no">' + (pb > 10 ? 'Takes more than 10 years to pay back.' : 'Takes ' + pb.toFixed(1) + ' years to pay back.') + '</b> It needs ' + pct(r.req) + ' of the people walking past; this street gives about ' + pct(room) + '.';
    else verdict = '<b class="no">Never pays back.</b> Even at ' + pct(room) + ' of the people walking past, the store doesn’t cover its running costs here.';
    if (r.capped) verdict += ' The store itself is the limit here: it can only serve so many people.';
    $('[data-out="verdict"]', col).innerHTML = verdict;
    $('[data-out="specs"]', col).innerHTML = '<div><dt>Rent a year</dt><dd>' + usdShort(r.rent) + '</dd></div><div><dt>Sales it can reach</dt><dd>' + usdShort(r.possible) + '</dd></div>' +
      '<div><dt>Sales it needs</dt><dd>' + usdShort(r.need) + '</dd></div><div><dt>G06 sizes it as</dt><dd>' + TIER_NAME[m.tl] + '</dd></div>';
    col.classList.toggle('is-pass', r.pass);
  });
}

// The loop between the two halves, at the model's defaults.
function loop() {
  const box = $('[data-out="loop"]');
  if (!box) return;
  const T = ['SPLUS', 'S', 'D'];
  const sum = (c) => c.SPLUS + c.S + c.D;
  const tot = sum(R.countA);
  const mix = T.map((t) => Math.round((100 * R.countA[t]) / tot) + '%').join(' · ');
  const off = T.map((t) => 1 - R.atscale[t] / R.pilot[t]);
  const lo = Math.round(100 * Math.min(...off));
  const hi = Math.round(100 * Math.max(...off));
  const li = (xs) => xs.map(([v, hot]) => '<li' + (hot ? ' class="j-hot"' : '') + '>' + esc(v) + '</li>').join('');
  const steps = $$(':scope > div ul', box);
  steps[0].innerHTML = li([[usdShort(R.tableau_build.SPLUS) + ' flagship', 1], [usdShort(R.tableau_build.S) + ' standard', 1], [usdShort(R.tableau_build.D) + ' small', 1]]);
  steps[1].innerHTML = li([[tot + ' of 78 pay back', 1], ['in ' + s.econ.payback_years + ' years', 0]]);
  steps[2].innerHTML = li([[mix, 1], [R.target.SPLUS + ', ' + R.target.S + ' and ' + R.target.D + ' of ' + R.N + ' stores', 0]]);
  steps[3].innerHTML = li([[(lo === hi ? lo : lo + ' to ' + hi) + '% cheaper', 1], [sum(R.countB) + ' of 78 pay back', 0]]);
}

function init() {
  const win = $('#window');
  if (!win) return;
  ['a', 'b'].forEach((side) => {
    const sel = $('[data-pick="' + side + '"]');
    streetOptions(sel, state[side]);
    sel.addEventListener('change', () => {
      state[side] = Number(sel.value);
      paint();
    });
  });
  win.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.size) state.size = b.dataset.size;
    else if (b.dataset.build) state.build = b.dataset.build;
    else return;
    paint();
  });
  win.classList.add('is-live');
  paint();
  loop();
}

init();
