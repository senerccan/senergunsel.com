// G04 · the Vans capstone survey, sliced. The responses and the regression results live in
// capstone-data.js; this file counts, draws and tells.
import { THEMES, BRANDS, ROWS, MODELS } from './capstone-data.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
const MINUS = '−';
const num = (v, d = 2) => (v < 0 ? MINUS : '') + Math.abs(v).toFixed(d);

const lab = $('#lab');
const state = { seg: 'all', skate: 'all', view: 'reread' };
const WEAR = ['Never', 'Used to', 'Wear them now'];
const SKATE = ['never skated', 'used to skate', 'skate now'];
const THEME_NAMES = { design: 'The look', comfort: 'Comfort', price: 'Price', trend: 'The trend', skate: 'Skateboarding', quality: 'Quality', gift: 'Someone else bought them', unfamiliar: "Don't know the brand", other: 'Other' };
const SHOW_THEMES = ['design', 'comfort', 'price', 'trend', 'skate', 'quality', 'gift', 'unfamiliar'];

// A row: [segment, skate, ranks[6], wear, pays, price, themes]
const R = ROWS.map((r) => ({ seg: r[0], skate: r[1], ranks: r[2], wear: r[3], pays: r[4], price: r[5], themes: r[6].split('').map((c) => THEMES[Number(c)]) }));
const rows = () => R.filter((r) => (state.seg === 'all' || r.seg === state.seg) && (state.skate === 'all' || r.skate === Number(state.skate)));
function who() {
  const seg = state.seg === 'c' ? 'Chinese nationals' : state.seg === 'i' ? 'international students' : 'students';
  const sk = state.skate === 'all' ? '' : ' who ' + SKATE[Number(state.skate)];
  return seg + sk;
}

/* ---------------------------------------------------------------- Counting */
function counts(rs) {
  const wear = [0, 0, 0];
  const first = BRANDS.map(() => 0);
  const top3 = BRANDS.map(() => 0);
  const price = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const pays = [[0, 0], [0, 0], [0, 0]];
  const why = [{}, {}, {}];
  rs.forEach((r) => {
    wear[r.wear] += 1;
    r.ranks.forEach((k, i) => { if (k) { top3[i] += 1; if (k === 1) first[i] += 1; } });
    price[r.wear][r.price] += 1;
    if (r.pays) pays[r.wear][r.pays === 's' ? 0 : 1] += 1;
    r.themes.forEach((t) => { why[r.wear][t] = (why[r.wear][t] || 0) + 1; });
  });
  return { n: rs.length, wear, first, top3, price, pays, why };
}

/* ---------------------------------------------------------------- Drawing */
function stackedBar(parts, total, classes, labels, opts = {}) {
  // one 100% bar, segments labelled inside when they fit
  const W = opts.width, H = opts.height || 44, y = opts.y || 0;
  let x = 0, svg = '';
  parts.forEach((v, i) => {
    const w = total ? (W * v) / total : 0;
    if (w > 0) {
      svg += '<rect class="' + classes[i] + '" x="' + x.toFixed(1) + '" y="' + y + '" width="' + w.toFixed(1) + '" height="' + H + '"><title>' + esc(labels[i] + ': ' + v + ' of ' + total + ' (' + pct(v, total) + '%)') + '</title></rect>';
      const p = pct(v, total);
      if (w > 34) svg += '<text class="in ' + classes[i] + '-t" x="' + (x + w / 2).toFixed(1) + '" y="' + (y + H / 2 + 4) + '" text-anchor="middle">' + p + '%</text>';
    }
    x += w;
  });
  return svg;
}

function drawWear(c, rs) {
  const el = $('[data-chart="wear"]', lab);
  const W = el.clientWidth;
  let svg = stackedBar(c.wear, c.n, ['sw-never', 'sw-former', 'sw-now'], WEAR, { width: W, height: 44, y: 6 });
  let H = 56;
  // underneath: the same bar split by skating (or, when skating is fixed, by segment)
  const bySkate = state.skate === 'all';
  const groups = bySkate
    ? [0, 1, 2].map((k) => ({ name: ['Never skated', 'Used to skate', 'Skate now'][k], rows: rs.filter((r) => r.skate === k) }))
    : state.seg === 'all' ? [{ name: 'Chinese nationals', rows: rs.filter((r) => r.seg === 'c') }, { name: 'International', rows: rs.filter((r) => r.seg === 'i') }] : [];
  let readSplit = '';
  if (groups.length) {
    const m = { l: 118 }, rowH = 34, top = 76;
    svg += '<text class="col-t" x="0" y="' + (top - 8) + '">' + (bySkate ? 'By skateboarding' : 'By group') + '</text>';
    groups.forEach((g, k) => {
      const y = top + k * rowH, n = g.rows.length;
      const wear = [0, 0, 0];
      g.rows.forEach((r) => { wear[r.wear] += 1; });
      svg += '<text class="lab" x="' + (m.l - 10) + '" y="' + (y + 18) + '" text-anchor="end">' + g.name + ' <tspan class="dim">' + n + '</tspan></text>';
      svg += '<g transform="translate(' + m.l + ' 0)">' + stackedBar(wear, n, ['sw-never', 'sw-former', 'sw-now'], WEAR, { width: W - m.l, height: 24, y: y + 1 }) + '</g>';
    });
    H = top + groups.length * rowH;
    if (bySkate) {
      const now = groups[2].rows, never = groups[0].rows;
      const ever = (g) => g.filter((r) => r.wear > 0).length;
      if (now.length && never.length) readSplit = ' Of those who skate now, ' + pct(now.filter((r) => r.wear === 2).length, now.length) + '% wear Vans and ' + pct(ever(now), now.length) + '% have; of those who never skated, ' + pct(never.filter((r) => r.wear === 2).length, never.length) + '% and ' + pct(ever(never), never.length) + '%.';
    }
  }
  el.innerHTML = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(WEAR.map((w, i) => w + ' ' + pct(c.wear[i], c.n) + '%').join(', ') + ' of ' + c.n + ' ' + who() + '.' + readSplit) + '">' + svg + '</svg>';
  const ever = c.wear[1] + c.wear[2];
  $('[data-out="wear-read"]', lab).textContent = c.n
    ? pct(ever, c.n) + '% of ' + who() + ' have worn Vans at some point; ' + pct(c.wear[2], c.n) + '% do now.' + readSplit
    : 'Nobody in this slice.';
}

function drawBrands(c) {
  const el = $('[data-chart="brands"]', lab);
  const W = el.clientWidth, rowH = 34, m = { l: 74, r: 48 }, H = BRANDS.length * rowH + 6;
  const x = (v) => m.l + (v / 100) * (W - m.l - m.r);
  let svg = '';
  [25, 50, 75].forEach((v) => { svg += '<line class="grid" x1="' + x(v) + '" x2="' + x(v) + '" y1="2" y2="' + (H - 4) + '"></line>'; });
  const order = BRANDS.map((b, i) => i).sort((a, b) => c.first[b] - c.first[a] || c.top3[b] - c.top3[a]);
  order.forEach((i, k) => {
    const y = 4 + k * rowH;
    const f = pct(c.first[i], c.n), t = pct(c.top3[i], c.n);
    const vans = BRANDS[i] === 'Vans';
    svg += '<text class="lab' + (vans ? ' is-vans' : '') + '" x="' + (m.l - 8) + '" y="' + (y + 19) + '" text-anchor="end">' + BRANDS[i] + '</text>';
    svg += '<rect class="top3" x="' + x(0) + '" y="' + (y + 4) + '" width="' + Math.max(0, x(t) - x(0)).toFixed(1) + '" height="20"><title>' + esc(BRANDS[i] + ' in the top three: ' + c.top3[i] + ' of ' + c.n + ' (' + t + '%)') + '</title></rect>';
    svg += '<rect class="first' + (vans ? ' is-vans' : '') + '" x="' + x(0) + '" y="' + (y + 4) + '" width="' + Math.max(0, x(f) - x(0)).toFixed(1) + '" height="20"><title>' + esc(BRANDS[i] + ' ranked first: ' + c.first[i] + ' of ' + c.n + ' (' + f + '%)') + '</title></rect>';
    svg += '<text class="val" x="' + (x(t) + 6) + '" y="' + (y + 19) + '">' + f + '%' + '<tspan class="dim"> · ' + t + '%</tspan></text>';
  });
  el.innerHTML = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc('Share ranking each brand first for skateboarding, then in their top three: ' + order.map((i) => BRANDS[i] + ' ' + pct(c.first[i], c.n) + '% and ' + pct(c.top3[i], c.n) + '%').join(', ')) + '">' + svg + '</svg>';
  const top = order[0];
  $('[data-out="brand-read"]', lab).textContent = c.n
    ? 'For ' + who() + ', the brand that says skateboarding is ' + BRANDS[top] + ' (' + pct(c.first[top], c.n) + '% rank it first)' + (BRANDS[top] !== 'Vans' ? '; Vans is first for ' + pct(c.first[3], c.n) + '% and in the top three for ' + pct(c.top3[3], c.n) + '%.' : ', and ' + pct(c.top3[3], c.n) + '% put it in their top three.')
    : '';
}

function drawWhy(c) {
  const el = $('[data-chart="why"]', lab);
  const W = el.clientWidth;
  const narrow = W < 620;
  const colW = narrow ? W : Math.floor(W / 3);
  const rowH = 24, m = { l: 150, r: 40 }, colH = SHOW_THEMES.length * rowH + 30;
  const H = narrow ? colH * 3 : colH;
  let svg = '';
  [0, 1, 2].forEach((g) => {
    const ox = narrow ? 0 : g * colW, oy = narrow ? g * colH : 0;
    const n = c.wear[g];
    const x = (v) => ox + m.l + (v / 100) * (colW - m.l - m.r);
    svg += '<text class="col-t" x="' + (ox + m.l) + '" y="' + (oy + 14) + '">' + WEAR[g] + ' <tspan class="dim">· ' + n + '</tspan></text>';
    SHOW_THEMES.forEach((t, k) => {
      const y = oy + 24 + k * rowH;
      const v = c.why[g][t] || 0, p = pct(v, n);
      svg += '<text class="lab" x="' + (ox + m.l - 8) + '" y="' + (y + 15) + '" text-anchor="end">' + THEME_NAMES[t] + '</text>';
      svg += '<rect class="why-bar" x="' + x(0) + '" y="' + (y + 3) + '" width="' + Math.max(0, x(p) - x(0)).toFixed(1) + '" height="16"><title>' + esc(THEME_NAMES[t] + ': ' + v + ' of ' + n + ' ' + WEAR[g].toLowerCase() + ' (' + p + '%)') + '</title></rect>';
      if (n) svg += '<text class="val" x="' + (x(p) + 5) + '" y="' + (y + 15) + '">' + p + '%</text>';
    });
  });
  el.innerHTML = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc('Themes in the open answers by group. ' + [0, 1, 2].map((g) => WEAR[g] + ': ' + SHOW_THEMES.map((t) => THEME_NAMES[t] + ' ' + pct(c.why[g][t] || 0, c.wear[g]) + '%').join(', ')).join('. ')) + '">' + svg + '</svg>';
}

function drawPrice(c) {
  const el = $('[data-chart="price"]', lab);
  const W = el.clientWidth, rowH = 46, m = { l: 96 }, H = 3 * rowH;
  let svg = '';
  [0, 1, 2].forEach((g) => {
    const y = g * rowH;
    svg += '<text class="lab" x="' + (m.l - 10) + '" y="' + (y + 25) + '" text-anchor="end">' + WEAR[g] + '</text>';
    svg += '<g transform="translate(' + m.l + ' 0)">' + stackedBar(c.price[g], c.wear[g], ['pr-low', 'pr-mid', 'pr-high'], ['Low', 'Mid', 'High'], { width: W - m.l, height: 32, y: y + 4 }) + '</g>';
  });
  el.innerHTML = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc('How Vans is priced, by group. ' + [0, 1, 2].map((g) => WEAR[g] + ': low ' + pct(c.price[g][0], c.wear[g]) + '%, mid ' + pct(c.price[g][1], c.wear[g]) + '%, high ' + pct(c.price[g][2], c.wear[g]) + '%').join('. ')) + '">' + svg + '</svg>';
}

function drawPays(c) {
  const el = $('[data-chart="pays"]', lab);
  const W = el.clientWidth, rowH = 46, m = { l: 96 }, H = 2 * rowH;
  let svg = '';
  [1, 2].forEach((g, k) => {
    const y = k * rowH, n = c.pays[g][0] + c.pays[g][1];
    svg += '<text class="lab" x="' + (m.l - 10) + '" y="' + (y + 25) + '" text-anchor="end">' + WEAR[g] + '</text>';
    svg += '<g transform="translate(' + m.l + ' 0)">' + stackedBar(c.pays[g], n, ['py-self', 'py-other'], ['They pay', 'Someone else pays'], { width: W - m.l, height: 32, y: y + 4 }) + '</g>';
  });
  el.innerHTML = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc('Who pays. ' + [1, 2].map((g) => WEAR[g] + ': they pay ' + pct(c.pays[g][0], c.pays[g][0] + c.pays[g][1]) + '%').join('. ')) + '">' + svg + '</svg>';
  const nowN = c.pays[2][0] + c.pays[2][1], forN = c.pays[1][0] + c.pays[1][1];
  $('[data-out="pays-read"]', lab).textContent = (nowN || forN)
    ? (nowN ? pct(c.pays[2][0], nowN) + '% of current wearers buy their own' : 'No current wearers in this slice') + (forN ? '; ' + pct(c.pays[1][1], forN) + '% of former wearers had theirs bought for them.' : '.')
    : '';
}

/* ---------------------------------------------------------------- The regression */
const TERMS = { pts_nikesb: 'Nike SB', pts_supreme: 'Supreme', pts_adidas: 'Adidas', pts_vans: 'Vans', pts_converse: 'Converse', pts_other: 'Other brand',
  skateformer: 'Used to skate', skatecurrent: 'Skates now', segmentinternational: 'International student' };
const TERM_NOTE = { pts_nikesb: 'per rank point as a skate brand', pts_supreme: 'per rank point', pts_adidas: 'per rank point', pts_vans: 'per rank point as a skate brand', pts_converse: 'per rank point', pts_other: 'per rank point',
  skateformer: 'against never skated', skatecurrent: 'against never skated', segmentinternational: 'against Chinese national' };
const reg = { api: null, idx: 0 };
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

function drawReg() {
  const el = $('[data-chart="reg"]', lab);
  const W = el.clientWidth;
  const reread = state.view === 'reread';
  $('[data-out="reg-title"]', lab).textContent = reread ? 'Odds of being further into Vans (never, used to, now), re-read with skating and segment' : 'The 2024 fit: six brand rankings only, outcome coded used to < no < yes';
  $('[data-out="reg-legend"]', lab).innerHTML = reread
    ? '<span class="lg lg-dot lg-sig">Clear of 1</span><span class="lg lg-dot lg-ns">Crosses 1</span>'
    : '<span class="lg lg-dot lg-all">All 220</span><span class="lg lg-dot lg-chi">Chinese nationals</span><span class="lg lg-dot lg-int">International, all 114</span>';
  $('[data-out="view-note"]', lab).textContent = reread
    ? 'Odds ratios on a log scale: 2 means twice the odds of being one step further into the brand. Vans’ own ranking and skating clear the line; nothing else does.'
    : 'Log odds as the report showed them. The international fit is refitted on all 114 responses (the report used an earlier extract of 67). Every brand’s ribbon crosses zero.';
  let items, scale;
  if (reread) {
    items = MODELS.context.map((t) => ({ term: t.term, v: t.or, lo: t.orlo, hi: t.orhi, p: t.p, group: 0 }));
    scale = { log: true, min: 0.4, max: 9, line: 1, ticks: [0.5, 1, 2, 3, 5, 8] };
  } else {
    const groups = ['reported_all', 'reported_chinese', 'reported_international'];
    items = [];
    Object.keys(TERMS).slice(0, 6).forEach((term) => {
      groups.forEach((g, gi) => {
        const t = MODELS.reported.find((r) => r.model === g && r.term === term);
        items.push({ term, v: t.est, lo: t.lo, hi: t.hi, p: t.p, group: gi });
      });
    });
    scale = { log: false, min: -1.1, max: 1.1, line: 0, ticks: [-1, -0.5, 0, 0.5, 1] };
  }
  const terms = reread ? Object.keys(TERMS) : Object.keys(TERMS).slice(0, 6);
  const narrow = W < 560;
  const m = { l: narrow ? 118 : 170, r: 18, t: 10, b: 36 };
  const rowH = reread ? 34 : 54;
  const H = m.t + terms.length * rowH + m.b;
  const x = (v) => m.l + ((scale.log ? Math.log(v) - Math.log(scale.min) : v - scale.min) / (scale.log ? Math.log(scale.max) - Math.log(scale.min) : scale.max - scale.min)) * (W - m.l - m.r);
  let svg = '';
  scale.ticks.forEach((v) => {
    svg += '<line class="grid" x1="' + x(v) + '" x2="' + x(v) + '" y1="' + m.t + '" y2="' + (H - m.b) + '"></line><text class="tick" x="' + x(v) + '" y="' + (H - m.b + 16) + '" text-anchor="middle">' + (scale.log ? v : num(v, 1).replace('.0', '')) + '</text>';
  });
  svg += '<line class="line1" x1="' + x(scale.line) + '" x2="' + x(scale.line) + '" y1="' + m.t + '" y2="' + (H - m.b) + '"></line>';
  svg += '<text class="axis-t" x="' + ((x(scale.min) + x(scale.max)) / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + (scale.log ? 'Odds ratio, log scale' : 'Coefficient, log odds') + '</text>';
  const pos = [];
  terms.forEach((term, k) => {
    const y0 = m.t + k * rowH;
    svg += '<text class="lab' + (term === 'pts_vans' ? ' is-vans' : '') + '" x="' + (m.l - 10) + '" y="' + (y0 + rowH / 2 + 4) + '" text-anchor="end">' + TERMS[term] + '</text>';
    if (k) svg += '<line class="sep" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y0 + '" y2="' + y0 + '"></line>';
    const its = items.filter((i) => i.term === term);
    its.forEach((it, j) => {
      const y = y0 + (its.length === 1 ? rowH / 2 : 10 + j * ((rowH - 20) / (its.length - 1)));
      const lo = Math.max(scale.min, it.lo), hi = Math.min(scale.max, it.hi);
      const sig = reread ? (it.lo > 1 || it.hi < 1) : false;
      const cls = reread ? (sig ? 'sig' : 'ns') : ['g-all', 'g-chi', 'g-int'][it.group];
      svg += '<line class="ci ' + cls + '" x1="' + x(lo) + '" x2="' + x(hi) + '" y1="' + y + '" y2="' + y + '"></line>';
      svg += '<circle class="dot ' + cls + '" cx="' + x(Math.min(scale.max, Math.max(scale.min, it.v))) + '" cy="' + y + '" r="5"></circle>';
      pos.push({ x: x(Math.min(scale.max, Math.max(scale.min, it.v))), y, it });
    });
  });
  svg += '<circle class="dot-focus" r="11" visibility="hidden"></circle>';
  pos.forEach((p, i) => { svg += '<circle class="hit" data-i="' + i + '" cx="' + p.x + '" cy="' + p.y + '" r="14"></circle>'; });
  const GROUPS = ['all 220', 'Chinese nationals', 'international students'];
  const label = (reread ? 'Odds ratios with 95% confidence intervals: ' : 'Coefficients with 95% confidence intervals: ') +
    pos.map((p) => TERMS[p.it.term] + (reread ? '' : ' (' + GROUPS[p.it.group] + ')') + ' ' + num(p.it.v) + ', ' + num(p.it.lo) + ' to ' + num(p.it.hi)).join('; ') + '.';
  el.innerHTML = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true" focusable="false">' + svg + '</svg>';
  el.tabIndex = 0;
  el.setAttribute('role', 'group');
  el.setAttribute('aria-label', label + ' Use the arrow keys to step through the terms.');
  let sr = $('.chart-sr', el);
  if (!sr) { sr = document.createElement('p'); sr.className = 'chart-sr visually-hidden'; sr.setAttribute('aria-live', 'polite'); el.appendChild(sr); }
  reg.api = {
    count: pos.length,
    show(i) {
      const p = pos[i];
      const ring = $('.dot-focus', el);
      ring.setAttribute('cx', p.x); ring.setAttribute('cy', p.y); ring.setAttribute('visibility', 'visible');
      const what = reread ? 'Odds ratio ' + num(p.it.v) + ' (95% CI ' + num(p.it.lo) + ' to ' + num(p.it.hi) + ')' : 'Coefficient ' + num(p.it.v) + ' (95% CI ' + num(p.it.lo) + ' to ' + num(p.it.hi) + ')';
      tipShow(el, '<b>' + esc(TERMS[p.it.term]) + '</b><span class="tip-k">' + esc(reread ? TERM_NOTE[p.it.term] : GROUPS[p.it.group]) + '</span><span>' + what + '</span><span>p = ' + (p.it.p < 0.001 ? '&lt; 0.001' : p.it.p.toFixed(3)) + '</span>', p.x, p.y);
      sr.textContent = TERMS[p.it.term] + (reread ? '' : ', ' + GROUPS[p.it.group]) + ': ' + what + '.';
    },
    hide() { const ring = $('.dot-focus', el); if (ring) ring.setAttribute('visibility', 'hidden'); tipHide(el); }
  };
  fillRegTable();
}
function wireReg() {
  const el = $('[data-chart="reg"]', lab);
  el.addEventListener('pointermove', (e) => {
    const h = e.target.closest('.hit');
    if (!h) { if (document.activeElement !== el) reg.api.hide(); return; }
    reg.idx = Number(h.dataset.i);
    reg.api.show(reg.idx);
  });
  el.addEventListener('pointerleave', () => { if (document.activeElement !== el) reg.api.hide(); });
  el.addEventListener('focus', () => reg.api.show(reg.idx = Math.min(reg.idx, reg.api.count - 1)));
  el.addEventListener('blur', () => reg.api.hide());
  el.addEventListener('keydown', (e) => {
    const n = reg.api.count;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') reg.idx = (reg.idx + 1) % n;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') reg.idx = (reg.idx - 1 + n) % n;
    else if (e.key === 'Home') reg.idx = 0;
    else if (e.key === 'End') reg.idx = n - 1;
    else if (e.key === 'Escape') { reg.api.hide(); return; }
    else return;
    e.preventDefault();
    reg.api.show(reg.idx);
  });
}

/* ---------------------------------------------------------------- Tables */
function tableHtml(head, body, label) {
  return '<div class="table-scroll" tabindex="0" role="region" aria-label="' + esc(label) + '"><table><thead><tr>' + head.map((h, i) => '<th scope="col"' + (i ? ' class="num"' : '') + '>' + h + '</th>').join('') + '</tr></thead><tbody>' +
    body.map((r) => '<tr><th scope="row">' + r[0] + '</th>' + r.slice(1).map((v) => '<td class="num">' + v + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
}
function fillTables(c) {
  const open = (name) => { const d = $('[data-table="' + name + '"]', lab); return d && d.closest('details').open ? d : null; };
  let d;
  if ((d = open('wear'))) d.innerHTML = tableHtml(['Wear Vans?', 'People', 'Share'], WEAR.map((w, i) => [w, c.wear[i], pct(c.wear[i], c.n) + '%']).concat([['All', c.n, '']]), 'Do they wear Vans');
  if ((d = open('brands'))) d.innerHTML = tableHtml(['Brand', 'Ranked first', 'Share', 'In top three', 'Share'], BRANDS.map((b, i) => [b, c.first[i], pct(c.first[i], c.n) + '%', c.top3[i], pct(c.top3[i], c.n) + '%']), 'Brand association');
  if ((d = open('why'))) d.innerHTML = tableHtml(['Theme'].concat(WEAR.map((w, g) => w + ' (' + c.wear[g] + ')')), SHOW_THEMES.map((t) => [THEME_NAMES[t]].concat([0, 1, 2].map((g) => (c.why[g][t] || 0) + ' · ' + pct(c.why[g][t] || 0, c.wear[g]) + '%'))), 'Themes by group');
  if ((d = open('price'))) d.innerHTML = tableHtml(['Group', 'Low', 'Mid', 'High'], WEAR.map((w, g) => [w].concat(c.price[g].map((v) => v + ' · ' + pct(v, c.wear[g]) + '%'))), 'Price perception');
  if ((d = open('pays'))) d.innerHTML = tableHtml(['Group', 'They pay', 'Someone else'], [1, 2].map((g) => [WEAR[g]].concat(c.pays[g].map((v) => v + ' · ' + pct(v, c.pays[g][0] + c.pays[g][1]) + '%'))), 'Who pays');
}
function fillRegTable() {
  const d = $('[data-table="reg"]', lab);
  if (!d || !d.closest('details').open) return;
  if (state.view === 'reread') {
    d.innerHTML = tableHtml(['Term', 'Odds ratio', '95% CI', 'p'], MODELS.context.map((t) => [TERMS[t.term], num(t.or), num(t.orlo) + ' to ' + num(t.orhi), t.p < 0.001 ? '< 0.001' : t.p.toFixed(3)]), 'The re-read fit') +
      '<p class="ctl-note">AIC with skating and segment ' + MODELS.aic.context + ', skating and segment alone ' + MODELS.aic.context_only + ', the six brands alone ' + MODELS.aic.brands + '. Likelihood ratio test for the six brand rankings on top of skating and segment: ' + MODELS.lrTest.statistic + ' on ' + MODELS.lrTest.df + ' df, p = ' + MODELS.lrTest.p + '.</p>';
  } else {
    const groups = [['reported_all', 'All 220'], ['reported_chinese', 'Chinese nationals'], ['reported_international', 'International, all 114']];
    d.innerHTML = tableHtml(['Brand'].concat(groups.map((g) => g[1])), Object.keys(TERMS).slice(0, 6).map((term) => [TERMS[term]].concat(groups.map((g) => { const t = MODELS.reported.find((r) => r.model === g[0] && r.term === term); return num(t.est) + ' (' + num(t.lo) + ' to ' + num(t.hi) + ')'; }))), 'The 2024 fit');
  }
}

/* ---------------------------------------------------------------- Update */
let liveTimer = null;
function update() {
  const rs = rows();
  const c = counts(rs);
  $('[data-out="n"]', lab).textContent = String(c.n);
  $('[data-out="n-note"]', lab).textContent = c.n === R.length ? 'students, everyone who answered' : (state.seg === 'all' && state.skate === 'all' ? 'students' : who() + ', of 220');
  $$('[data-seg]', lab).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.seg === state.seg)));
  $$('[data-skate]', lab).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.skate === state.skate)));
  $$('[data-view]', lab).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === state.view)));
  fillTables(c);
  // charts only when the figures have a width; a hidden or mid-resize layout gets drawn again by the ResizeObserver
  if ($('[data-chart="wear"]', lab).clientWidth > 0) { drawWear(c, rs); drawBrands(c); drawWhy(c); drawPrice(c); drawPays(c); drawReg(); }
  clearTimeout(liveTimer);
  liveTimer = setTimeout(() => { $('[data-out="live"]', lab).textContent = c.n + ' ' + who() + ': ' + pct(c.wear[2], c.n) + '% wear Vans now, ' + pct(c.wear[1], c.n) + '% used to, ' + pct(c.wear[0], c.n) + '% never have.'; }, 500);
}

function init() {
  if (!lab) return;
  lab.classList.add('is-live');
  lab.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || !lab.contains(b)) return;
    if (b.dataset.seg) state.seg = b.dataset.seg;
    else if (b.dataset.skate) state.skate = b.dataset.skate;
    else if (b.dataset.view) state.view = b.dataset.view;
    else if (b.hasAttribute('data-reset')) { state.seg = 'all'; state.skate = 'all'; }
    else return;
    update();
  });
  $$('details.numbers', lab).forEach((d) => d.addEventListener('toggle', update));
  wireReg();
  if ('ResizeObserver' in window) {
    let w = 0;
    new ResizeObserver(() => { const el = $('[data-chart="wear"]', lab); if (el.clientWidth !== w) { w = el.clientWidth; update(); } }).observe($('[data-chart="wear"]', lab));
  }
  document.addEventListener('scg:theme', update);
  update();
}

init();
