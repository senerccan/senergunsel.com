// Homepage: walk-in headline, door band, window model, floor plan, locator, register.
import { FLOORS, FLOORSET, packFloor, findZone } from './store.js';
import { sign, floorName, LANG_TAGS } from './signs.js';
import { currentLang } from './site.js';
import { onDoor, onCollect, addZoneDwell, myDwellMs, formatDwell, pad4 } from './door.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const EMAIL = 'hello@senergunsel.com';
const ARROW = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 8h10M9 4l4 4-4 4"></path></svg>';
const CHEV = '<svg class="chev" aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3l5 5-5 5"></path></svg>';

const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
const compactMQ = window.matchMedia('(max-width: 760px)');
const reduced = () => reduceMQ.matches;
const compact = () => compactMQ.matches;
const langTag = () => LANG_TAGS[currentLang()] || 'en';

/* =========================================================================
   Door band: live readings. The first walk-in of a visit is you, so the
   counter ticks up when the man steps through the door.
   ========================================================================= */
const band = {
  stats: null,
  selfPending: false,
  selfShown: false,
  heat: null,
  heatMode: 'forecast',
  heatNeed: 50,
  heatHave: 0
};

function paintBand() {
  const s = band.stats;
  const bandEl = $('.band');
  if (!s) return;
  const ff = band.selfPending && !band.selfShown ? Math.max(0, s.footfall - 1) : s.footfall;
  $$('[data-stat="footfall"]').forEach((el) => {
    const next = pad4(ff);
    if (el.textContent !== next && el.textContent.trim() !== '') {
      el.classList.remove('tick');
      void el.offsetWidth;
      el.classList.add('tick');
    }
    el.textContent = next;
  });
  $$('[data-stat="instore"]').forEach((el) => { el.textContent = String(s.inStore); });
  $$('[data-stat="dwell"]').forEach((el) => { el.textContent = formatDwell(s.avgDwellSec); });
  if (bandEl) bandEl.classList.remove('is-offline');
  $$('[data-sensor]').forEach((el) => { el.textContent = 'Door sensor 01'; });
}

function paintOffline() {
  const bandEl = $('.band');
  if (bandEl) bandEl.classList.add('is-offline');
  $$('[data-sensor]').forEach((el) => { el.textContent = 'Door sensor resting'; });
  $$('[data-stat="footfall"]').forEach((el) => { el.textContent = '––––'; });
  $$('[data-stat="instore"]').forEach((el) => { el.textContent = '–'; });
  $$('[data-stat="dwell"]').forEach((el) => { el.textContent = '–:––'; });
}

function revealSelf() {
  if (band.selfShown) return;
  band.selfShown = true;
  paintBand();
}

function initBand() {
  onDoor((stats, info) => {
    if (!stats) {
      if (info.offline) paintOffline();
      return;
    }
    if (info.entered && info.isNew && !band.selfShown) {
      band.selfPending = true;
      // If the walk-in hasn't happened yet (say the visitor scrolled straight
      // past the headline), count them in anyway after a few seconds.
      setTimeout(revealSelf, 6000);
    }
    band.stats = stats;
    const prevMode = band.heatMode;
    const prevHeat = JSON.stringify(band.heat);
    band.heat = stats.heat || null;
    band.heatMode = stats.heatMode === 'actual' ? 'actual' : 'forecast';
    band.heatNeed = stats.heatNeed ?? 50;
    band.heatHave = stats.heatHave ?? 0;
    paintBand();
    if (band.selfPending && !band.selfShown && (compact() || reduced() || HL.firstWalkDone)) {
      setTimeout(revealSelf, 900);
    }
    if (prevMode !== band.heatMode || prevHeat !== JSON.stringify(band.heat)) refreshHeat();
  });
}

/* =========================================================================
   Headline: the comma becomes a man, the period is a door. Each time he
   walks in, the next line rotates in.
   ========================================================================= */
const LINES = [
  { before: 'Welcome in', after: " I'm Sener", size: 'min(112px, calc((100vw - 80px) / 11.2))', text: "Welcome in, I'm Sener.", sub: "Sneakerhead since childhood, tennis player, and the analyst on Under Armour's first intelligent flagship." },
  { before: 'I lined up for drops', after: ' now I read the line', size: 'min(68px, calc((100vw - 80px) / 18.6))', text: 'I lined up for drops, now I read the line.', sub: "I'm Sener. Now I study how people move, browse and buy, and build the tools that turn it into decisions." },
  { before: 'Most walk past', after: ' some walk in', size: 'min(86px, calc((100vw - 80px) / 14.2))', text: 'Most walk past, some walk in.', sub: "I'm Sener, and I find out why: from the sneaker line outside to the sensors on a flagship's floor." },
  { before: 'Four languages', after: ' one question', size: 'min(86px, calc((100vw - 80px) / 14.1))', text: 'Four languages, one question.', sub: "I'm Sener. In any language, I'm asking the same thing on every shop floor: what made them walk in?" },
  { before: 'Baseline first', after: ' then the rally', size: 'min(86px, calc((100vw - 80px) / 13.1))', text: 'Baseline first, then the rally.', sub: "I'm Sener. Tennis taught me the method: set the baseline first, then keep the rally going until the answer holds." }
];

const HL = {
  idx: 0,
  playing: false,
  paused: false,
  lastEnd: 0,
  timers: [],
  loop: null,
  visible: true,
  started: false,
  firstWalkDone: false
};

let stage, walker, commaEl, doorEl, subEl, textEl, beforeEl, afterEl;

function clearTimers() {
  HL.timers.forEach((id) => clearTimeout(id));
  HL.timers = [];
}
function at(ms, fn) {
  HL.timers.push(setTimeout(fn, ms));
}
function setPhase(p) {
  stage.classList.remove('p-rest', 'p-stand', 'p-walk', 'p-open', 'p-enter', 'p-close');
  stage.classList.add('p-' + p);
  stage.classList.toggle('alive', p === 'stand' || p === 'walk' || p === 'open' || p === 'enter');
}
function setDoor(up) {
  stage.classList.toggle('door-up', up);
}
function setWalker(x, scale, ms, ease) {
  walker.style.transitionDuration = ms + 'ms, 0.35s';
  walker.style.transitionTimingFunction = ease + ', ease';
  walker.style.transform = 'translateX(' + x + 'px) scale(' + scale + ')';
}
function setLine(i) {
  HL.idx = i;
  const line = LINES[i];
  beforeEl.textContent = line.before;
  afterEl.textContent = line.after;
  textEl.textContent = line.text;
  subEl.textContent = line.sub;
  stage.style.fontSize = line.size;
  $$('.hl-dots span').forEach((d, k) => d.classList.toggle('on', k === i));
  const next = $('#hl-next');
  if (next) next.setAttribute('aria-label', 'Show the next line, line ' + (i + 1) + ' of ' + LINES.length);
}
function fadeTo(i, done) {
  stage.classList.add('is-fading');
  subEl.classList.add('is-fading');
  HL.timers.push(setTimeout(() => {
    setLine(i);
    stage.classList.remove('is-fading');
    subEl.classList.remove('is-fading');
    if (done) done();
  }, 320));
}
function schedule(ms) {
  clearTimeout(HL.loop);
  if (HL.paused || reduced() || !HL.visible || document.visibilityState !== 'visible') return;
  HL.loop = setTimeout(() => (compact() ? stepCompact() : play()), ms);
}
function measure() {
  try {
    const cr = commaEl.getBoundingClientRect();
    const dr = doorEl.getBoundingClientRect();
    const fs = parseFloat(window.getComputedStyle(stage).fontSize) || 80;
    return { dx: dr.left - cr.left, fs, same: Math.abs(cr.bottom - dr.bottom) < 6 };
  } catch (e) {
    return null;
  }
}
function play() {
  if (HL.playing || compact()) return;
  HL.playing = true;
  clearTimers();
  clearTimeout(HL.loop);
  const m = measure();
  const fs = m ? m.fs : 80;
  const ok = !!(m && m.same && m.dx > fs);
  const walkTo = ok ? Math.max(0, m.dx - 0.38 * fs) : 0;
  const enterTo = ok ? m.dx + 0.02 * fs : 0;
  const walkMs = ok ? Math.round((walkTo / (4 * fs)) * 1000) : 0;
  setPhase('stand');
  setDoor(false);
  setWalker(0, 1, 0, 'linear');
  let t = 700;
  if (ok) {
    at(t, () => { setPhase('walk'); setWalker(walkTo, 1, walkMs, 'linear'); });
    at(t + Math.max(0, walkMs - 700), () => setDoor(true));
    t += walkMs + 120;
  } else {
    at(t, () => setDoor(true));
    t += 500;
  }
  at(t, () => { setPhase('open'); setDoor(true); });
  t += 520;
  at(t, () => {
    setPhase('enter');
    setWalker(enterTo, 0.9, 520, 'ease-in');
    if (!HL.firstWalkDone) {
      HL.firstWalkDone = true;
      if (band.selfPending) revealSelf();
    }
  });
  t += 620;
  at(t, () => setPhase('close'));
  t += 480;
  at(t, () => setDoor(false));
  t += 520;
  at(t, afterWalk);
}
function afterWalk() {
  fadeTo((HL.idx + 1) % LINES.length, () => {
    setPhase('rest');
    setWalker(0, 1, 0, 'linear');
    HL.playing = false;
    HL.lastEnd = Date.now();
    schedule(2900);
  });
}
function stepCompact() {
  if (HL.playing) return;
  HL.playing = true;
  fadeTo((HL.idx + 1) % LINES.length, () => {
    HL.playing = false;
    HL.lastEnd = Date.now();
    schedule(5200);
  });
}
function paintPause() {
  const btn = $('#hl-pause');
  if (!btn) return;
  btn.setAttribute('aria-label', HL.paused ? 'Resume the rotating headlines' : 'Pause the rotating headlines');
  btn.setAttribute('aria-pressed', String(HL.paused));
  $('.ico-pause', btn).style.display = HL.paused ? 'none' : '';
  $('.ico-play', btn).style.display = HL.paused ? '' : 'none';
}
function resetStage() {
  clearTimers();
  clearTimeout(HL.loop);
  HL.playing = false;
  stage.classList.remove('is-fading');
  subEl.classList.remove('is-fading');
  setPhase('rest');
  setDoor(false);
  setWalker(0, 1, 0, 'linear');
}

function initHeadline() {
  stage = $('#hl');
  if (!stage) return;
  walker = $('.walker', stage);
  commaEl = $('.hl-comma', stage);
  doorEl = $('.hl-door', stage);
  beforeEl = $('.hl-before', stage);
  afterEl = $('.hl-after', stage);
  textEl = $('.hl-text', stage);
  subEl = $('#hl-sub');
  setLine(0);
  paintPause();

  $('#hl-next').addEventListener('click', () => {
    if (HL.playing) return;
    if (compact() || reduced()) {
      HL.playing = true;
      fadeTo((HL.idx + 1) % LINES.length, () => { HL.playing = false; HL.lastEnd = Date.now(); schedule(compact() ? 5200 : 2900); });
    } else {
      play();
    }
  });
  $('#hl-pause').addEventListener('click', () => {
    HL.paused = !HL.paused;
    paintPause();
    if (HL.paused) clearTimeout(HL.loop);
    else if (!HL.playing) schedule(400);
  });
  stage.addEventListener('mouseenter', () => {
    if (!HL.playing && !compact() && !reduced() && Date.now() - HL.lastEnd > 1200) play();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      const was = HL.visible;
      HL.visible = entries[0].isIntersecting;
      if (!HL.visible) clearTimeout(HL.loop);
      else if (!was && HL.started && !HL.playing) schedule(900);
    }, { threshold: 0.15 }).observe(stage);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (!HL.playing) schedule(1200);
    } else {
      clearTimeout(HL.loop);
    }
  });
  compactMQ.addEventListener('change', () => { resetStage(); schedule(1200); });
  reduceMQ.addEventListener('change', () => { resetStage(); schedule(1200); });

  // On phones there is no walk, so the welcome line gets a longer moment first.
  const go = () => {
    HL.started = true;
    schedule(compact() ? 4800 : 1100);
  };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(go, go);
  else go();
}

/* =========================================================================
   Window: Same store, two streets. Same build, conversion and basket;
   only the footfall changes. Break-even sales $1.2M / $80 basket / 20% buy.
   ========================================================================= */
const STREETS = {
  busy: { traffic: 12800000, trafficVal: '12.8M' },
  quiet: { traffic: 1100000, trafficVal: '1.1M' }
};
const BREAK_EVEN = 1200000;
const BASKET = 80;
const BUY_RATE = 0.2;

function initWindow() {
  const buttons = $$('[data-street]');
  if (!buttons.length) return;
  const visitsNeeded = BREAK_EVEN / BASKET / BUY_RATE;
  const pick = (key) => {
    const st = STREETS[key];
    const cap = (visitsNeeded / st.traffic) * 100;
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.street === key)));
    $('#capture').textContent = cap.toFixed(1) + '%';
    $('#one-in').textContent = '1 in ' + Math.round(100 / cap);
    $('#traffic-val').textContent = st.trafficVal;
    const left = Math.min(100, cap * 10).toFixed(1) + '%';
    $('#track-fill').style.width = left;
    $('#track-knob').style.left = left;
  };
  buttons.forEach((b) => b.addEventListener('click', () => pick(b.dataset.street)));
  pick('busy');
}

/* =========================================================================
   Floor plan
   ========================================================================= */
const FMT_TAG = { SPLUS: 'tag tag-ink', S: 'tag', D: 'tag tag-dash', TBA: 'tag tag-accent' };
const HOT = [[4, 1, 1], [11, 3, 0.9], [8, 2, 0.6], [14, 0, 0.5]];
const CELLS = (() => {
  const out = [];
  for (let i = 0; i < 80; i++) {
    const x = i % 16;
    const y = Math.floor(i / 16);
    let v = 0;
    HOT.forEach((h) => {
      const d = Math.hypot(x - h[0], (y - h[1]) * 1.6);
      v += h[2] * Math.exp(-(d * d) / 6);
    });
    const p = Math.round(Math.min(1, v) * 80);
    out.push({ p: p < 10 ? 0 : p, hot: p > 66 });
  }
  return out;
})();
const STAR = 'M5 .6l1.3 2.9 3.2.3-2.4 2.1.7 3.1L5 7.4 2.2 9l.7-3.1L.5 3.8l3.2-.3z';

const HINTS = {
  regions: () => '<span class="hint-regions"><span class="hint-cells">' +
    CELLS.map((c) => '<span class="' + (c.hot ? 'pulse' : '') + '" style="background:color-mix(in srgb, var(--accent) ' + c.p + '%, transparent)"></span>').join('') +
    '</span><span class="hint-labels"><span>Camera</span><span>RFID</span><span>POS</span><span class="hot">100+ regions tracked</span></span></span>',
  curve: () => '<svg class="hint-curve" viewBox="0 0 440 170" preserveAspectRatio="xMidYMid meet">' +
    [45, 80, 115].map((y) => '<line x1="30" y1="' + y + '" x2="430" y2="' + y + '" style="stroke:var(--hair);stroke-width:1"></line>').join('') +
    [130, 230, 330].map((x) => '<line x1="' + x + '" y1="10" x2="' + x + '" y2="150" style="stroke:var(--hair);stroke-width:1"></line>').join('') +
    '<line x1="30" y1="10" x2="30" y2="150" style="stroke:var(--hair);stroke-width:1"></line>' +
    '<line x1="30" y1="150" x2="430" y2="150" style="stroke:var(--hair);stroke-width:1"></line>' +
    '<line x1="30" y1="104" x2="430" y2="104" style="stroke:var(--accent);stroke-width:1.5;stroke-dasharray:6 5"></line>' +
    '<path d="M36 20 C 110 70, 170 100, 250 112 S 380 124, 428 126" style="fill:none;stroke:var(--ink);stroke-width:2.5;stroke-linecap:round"></path>' +
    '<circle cx="214" cy="104" r="5" style="fill:var(--accent)"></circle>' +
    '<text x="38" y="20" style="font-family:var(--mono);font-size:10px;letter-spacing:.08em;fill:var(--muted)">COST / FT²</text>' +
    '<text x="300" y="98" style="font-family:var(--mono);font-size:10px;letter-spacing:.08em;fill:var(--atext)">BREAK-EVEN</text>' +
    '<text x="362" y="166" style="font-family:var(--mono);font-size:10px;letter-spacing:.08em;fill:var(--muted)">STORES →</text></svg>',
  sliders: () => '<span class="hint-sliders">' +
    [['Product', 1], ['Marketing', 2], ['Money', 3]].map((s) => '<span class="hint-slider"><span>' + s[0] + '</span><span class="hint-rail"><span class="rail"></span><span class="wc-f wc-f' + s[1] + '"></span><span class="wc-k wc-k' + s[1] + '"></span></span></span>').join('') +
    '<span class="hint-fit"><span>Trend fit</span><svg viewBox="0 0 62 10" width="62" height="10" style="overflow:visible">' +
    [0, 13, 26, 39].map((x) => '<path transform="translate(' + x + ' 0)" d="' + STAR + '" style="fill:var(--accent)"></path>').join('') +
    '<path class="wc-star5" transform="translate(52 0)" d="' + STAR + '" style="stroke:var(--accent);stroke-width:.8"></path></svg></span></span>',
  dots: () => '<span class="hint-dots"><span class="dots"></span><span class="dots-text"><b>220</b><span>respondents</span><span class="hot">3 stores</span></span></span>',
  tiles: () => '<span class="hint-tiles"><span class="tiles-row"><span></span><span></span></span><span class="tiles-bars">' +
    [38, 70, 52, 88, 64].map((h) => '<span style="height:' + h + '%"></span>').join('') + '</span></span>',
  terminal: () => '<span class="hint-terminal"><span class="term-bar"><span></span><span></span><span></span></span><span class="term-lines">' +
    '<span>› brief: a store, not a resume</span><span>› build: floor plan, walk-in, register</span><span>› ship floorset ' + FLOORSET + '<span class="caret pulse"></span></span></span></span>',
  film: () => {
    const sp = '<span class="sprockets">' + '<span></span>'.repeat(12) + '</span>';
    return '<span class="hint-film">' + sp + '<span class="frames"><span></span><span></span><span class="lit"></span><span></span></span>' + sp + '</span>';
  },
  notes: () => '<span class="hint-notes"><span style="height:28px;transform:rotate(-7deg)"></span><span style="height:34px;transform:rotate(5deg)"></span><span style="height:26px;transform:rotate(-3deg)"></span></span>'
};

const floorState = {
  floor: 'G',
  sel: { G: 'ua', 1: 'store', 2: 'cut' },
  view: 'plan',
  heatOn: true,
  expanded: null
};

function currentFloor() {
  return FLOORS.find((f) => f.key === floorState.floor) || FLOORS[0];
}
function heatOf(z) {
  if (!floorState.heatOn) return 0;
  if (band.heatMode === 'actual' && band.heat) return Math.max(0, Math.min(1, band.heat[z.code] || 0));
  return z.forecast || 0;
}
// Heat = the store's dwell (forecast or real) blended with yours, live.
// Your seconds on a zone push its heat toward full; TAU is how fast.
const TAU = 15;
const MAX_REST_MS = 90000; // one continuous rest counts for at most 90 seconds
function intensity(z) {
  if (!floorState.heatOn) return { heat: 0, you: 0 };
  const base = heatOf(z);
  const you = 1 - Math.exp(-live.seconds(z.code) / TAU);
  return { heat: 1 - (1 - 0.65 * base) * (1 - you), you };
}
function heatVars(z) {
  const { heat, you } = intensity(z);
  const h = floorState.heatOn ? Math.round(4 + heat * 16) : 6;
  return '--heat:' + heat.toFixed(3) + ';--you:' + you.toFixed(3) + ';--h:' + h + 'px;';
}
function applyHeat(el, z) {
  const { heat, you } = intensity(z);
  el.style.setProperty('--heat', heat.toFixed(3));
  el.style.setProperty('--you', you.toFixed(3));
  el.style.setProperty('--h', (floorState.heatOn ? Math.round(4 + heat * 16) : 6) + 'px');
}
function fmtDwell(secs, precise) {
  if (secs < 60) return (precise ? secs.toFixed(1) : String(Math.floor(secs))) + 's';
  return Math.floor(secs / 60) + 'm ' + String(Math.floor(secs % 60)).padStart(2, '0') + 's';
}
function statusLine(z) {
  if (z.status === 'soon') return 'Opening soon';
  if (z.status === 'tba') return 'Release date: TBA';
  return z.proofs.join(' · ');
}
function zoneButton(z, selKey) {
  const lang = currentLang();
  const secs = live.seconds(z.code);
  const cls = ['zone', z.key === selKey ? 'is-sel' : '', z.hatch ? 'is-hatched' : '', z.w <= 2 ? 'is-narrow' : '', secs >= 0.5 ? 'has-dwell' : ''].filter(Boolean).join(' ');
  return '<button type="button" class="' + cls + '" data-zone="' + esc(z.key) + '" data-code="' + esc(z.code) + '" aria-pressed="' + (z.key === selKey) + '"' +
    ' aria-label="' + esc(z.code + ', ' + z.title + '. ' + statusLine(z)) + '"' +
    ' style="' + heatVars(z) + 'grid-column:' + z.col + ' / span ' + z.w + ';grid-row:' + z.row + ' / span ' + z.h + '">' +
    (z.hatch ? '<span class="zone-hatch" aria-hidden="true"></span>' : '') +
    '<span class="zone-heat breathe" aria-hidden="true"></span><span class="zone-core" aria-hidden="true"></span>' +
    '<span class="zone-hint" aria-hidden="true" style="top:' + z.g.top + ';bottom:' + z.g.bottom + '">' + (HINTS[z.hint] ? HINTS[z.hint]() : '') + '</span>' +
    '<span class="zone-top" aria-hidden="true"><span class="zone-label"><span class="zl-sign">' + esc(z.code) + ' · <span lang="' + langTag() + '">' + esc(sign(lang, z.place)) + '</span></span>' +
    '<span class="zl-dwell"><span class="zl-code">' + esc(z.code) + ' · </span><i></i><span class="zl-word">Dwell </span><b class="dwell-time">' + fmtDwell(secs, false) + '</b></span></span>' +
    '<span class="' + FMT_TAG[z.format] + '">' + esc(z.format) + '</span></span>' +
    '<span class="zone-bottom" aria-hidden="true"><span class="zone-title" style="font-size:' + z.g.title + '">' + esc(z.planTitle || z.title) + '</span><span class="zone-meta">' + esc(z.zoneMeta) + '</span></span>' +
    '</button>';
}
function fillerCell(f) {
  return '<div class="filler" aria-hidden="true" style="grid-column:' + f.col + ' / span ' + f.w + ';grid-row:' + f.row + ' / span ' + f.h + '"><span><b>Next drop</b><span>Space available</span></span></div>';
}
function storefront() {
  const lang = currentLang();
  const featured = FLOORS[0].zones.find((z) => z.featured) || FLOORS[0].zones[0];
  return '<div class="storefront">' +
    '<a class="sf-window" href="#window"><span class="sf-k"><span lang="' + langTag() + '">' + esc(sign(lang, 'window')) + '</span> · Now showing</span><span class="sf-v">' + esc(featured.title) + ' ↑</span></a>' +
    '<div class="sf-door"><span class="sf-k" lang="' + langTag() + '">' + esc(sign(lang, 'door')) + '</span><span class="sf-count" data-stat="footfall">' + esc(band.stats ? pad4(band.selfPending && !band.selfShown ? band.stats.footfall - 1 : band.stats.footfall) : '––––') + '</span><span class="leaf-l" aria-hidden="true"></span><span class="leaf-r" aria-hidden="true"></span></div>' +
    '<a class="sf-register" href="#register"><span><span class="sf-k"><span lang="' + langTag() + '">' + esc(sign(lang, 'register')) + '</span> · POS</span><span class="sf-v">Resume &amp; contact</span></span>' + ARROW + '</a>' +
    '<span class="sf-gap" aria-hidden="true"></span></div>';
}
function landing() {
  const lang = currentLang();
  return '<div class="landing"><button type="button" data-to-ground><span class="sf-k" lang="' + langTag() + '">' + esc(sign(lang, 'elevator')) + '</span><b>Back to the ground floor ↓</b></button>' +
    '<div class="stairs" aria-hidden="true"><span class="sf-k">Stairs</span></div></div>';
}
function panelInner(z) {
  const lang = currentLang();
  let dwell = '';
  if (floorState.heatOn && band.heatMode === 'actual' && band.heat && band.heat[z.code] != null) {
    dwell = '<p class="zp-dwell">Relative dwell ' + Math.round(band.heat[z.code] * 100) + ' of 100 · last 30 days</p>';
  }
  dwell += '<p class="zp-dwell zp-you">Your dwell this visit <b data-dwell-for="' + esc(z.code) + '" aria-hidden="true">' + fmtDwell(live.seconds(z.code), false) + '</b></p>';
  const facts = z.facts && z.facts.length
    ? '<dl class="zp-facts">' + z.facts.map((f) => '<div><dt>' + esc(f.v) + '</dt><dd>' + esc(f.k) + '</dd></div>').join('') + '</dl>'
    : '';
  let action;
  if (z.href && (z.status === 'open' || z.status === 'window')) {
    action = '<a class="zp-cta" href="' + esc(z.href) + '">' + esc(z.cta) + ARROW + '</a>';
  } else {
    const subject = encodeURIComponent('About ' + z.title);
    action = '<div class="zp-soon"><span>' + esc(z.status === 'tba' ? 'Release date: TBA' : 'Opening soon') + '</span><span class="sign" style="color:var(--muted)">' + esc(z.code) + '</span></div>' +
      '<a class="zp-ask" href="mailto:' + EMAIL + '?subject=' + subject + '">Ask me about it before it opens</a>';
  }
  return '<div class="zp-top"><span>' + esc(z.code) + ' · <span lang="' + langTag() + '">' + esc(sign(lang, z.place)) + '</span></span><span class="' + FMT_TAG[z.format] + '">' + esc(z.format) + '</span></div>' +
    '<div class="zp-head"><h3 class="zp-title">' + esc(z.title) + '</h3><p class="zp-meta">' + esc(z.meta) + '</p></div>' +
    '<p class="zp-body">' + esc(z.body) + '</p>' + facts + dwell +
    '<div class="zp-foot"><div class="zp-proofs">' + z.proofs.map((p) => '<span>' + esc(p) + '</span>').join('') + '</div>' + action + '</div>';
}
function aisleRow(z, selKey, isCompact) {
  const lang = currentLang();
  const open = isCompact && floorState.expanded === z.key;
  const attrs = isCompact
    ? ' aria-expanded="' + open + '" aria-controls="aisle-' + esc(z.key) + '"'
    : ' aria-current="' + (z.key === selKey) + '"';
  return '<li><button type="button" class="aisle-row" data-zone="' + esc(z.key) + '"' + attrs + '>' +
    '<span class="aisle-code">' + esc(z.code) + '</span>' +
    '<span class="aisle-sign" lang="' + langTag() + '">' + esc(sign(lang, z.place)) + '</span>' +
    '<span class="aisle-name"><b>' + esc(z.title) + '</b><span>' + esc(isCompact ? sign(lang, z.place) + ' · ' + statusLine(z) : z.meta) + '</span></span>' +
    '<span class="' + FMT_TAG[z.format] + '">' + esc(z.format) + '</span>' +
    '<span class="aisle-proof">' + esc(statusLine(z)) + '</span>' +
    (isCompact ? CHEV : ARROW) + '</button>' +
    (isCompact ? '<div class="aisle-detail" id="aisle-' + esc(z.key) + '"' + (open ? '' : ' hidden') + '>' + (open ? panelInner(z) : '') + '</div>' : '') +
    '</li>';
}
function miniPlan(placed, fillers, fl, selKey) {
  const cells = placed.map((z) => {
    return '<span class="' + (z.key === selKey ? 'is-sel' : '') + '" data-code="' + esc(z.code) + '" style="' + heatVars(z) + 'grid-column:' + z.col + ' / span ' + z.w + ';grid-row:' + z.row + ' / span ' + z.h + '">' +
      (z.hatch ? '<span class="zone-hatch"></span>' : '') +
      '<span class="zone-heat"></span><span class="zone-core"></span><b>' + esc(z.code) + '</b></span>';
  }).join('') + fillers.map((f) => '<span class="mini-filler" style="grid-column:' + f.col + ' / span ' + f.w + ';grid-row:' + f.row + ' / span ' + f.h + '"></span>').join('');
  const base = fl.key === 'G'
    ? '<div class="mini-front"><span class="mf-1"></span><span class="mf-2"></span><span class="mf-3"></span><span class="mf-gap"></span></div>'
    : '<div class="mini-landing"></div>';
  return '<div class="mini-plan" aria-hidden="true"><div class="mini-grid">' + cells + '</div>' + base + '</div>';
}

function renderElevator() {
  const box = $('#elevator');
  if (!box) return;
  const lang = currentLang();
  $$('.floor-btn', box).forEach((b) => b.remove());
  FLOORS.slice().reverse().forEach((f) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'floor-btn';
    b.textContent = f.label;
    b.dataset.floor = f.key;
    b.setAttribute('aria-pressed', String(f.key === floorState.floor));
    b.setAttribute('aria-label', floorName('en', f.key) + ', ' + f.purpose);
    b.title = floorName(lang, f.key);
    box.appendChild(b);
  });
}
function renderFloor() {
  const fl = currentFloor();
  const { placed, fillers } = packFloor(fl);
  const selKey = placed.some((z) => z.key === floorState.sel[fl.key]) ? floorState.sel[fl.key] : placed[0].key;
  floorState.sel[fl.key] = selKey;
  const isCompact = compact();
  const stageEl = $('#floor-stage');
  const lang = currentLang();

  const nameEl = $('#floor-name');
  nameEl.dataset.floorName = fl.key;
  nameEl.textContent = floorName(lang, fl.key);
  nameEl.setAttribute('lang', langTag());
  $('#floor-code').textContent = fl.label;
  $('#floor-purpose').textContent = fl.purpose;
  $('#tb-drawing').textContent = fl.drawing;

  let html = '';
  if (isCompact) {
    html = miniPlan(placed, fillers, fl, floorState.expanded) +
      '<ul class="aisle" aria-label="Zones on this floor">' + placed.map((z) => aisleRow(z, selKey, true)).join('') + '</ul>';
  } else if (floorState.view === 'aisle') {
    html = '<ul class="aisle" aria-label="Zones on this floor">' + placed.map((z) => aisleRow(z, selKey, false)).join('') + '</ul>';
  } else {
    html = '<div class="plan-scroll"><div class="plan' + (floorState.view === 'model' ? ' model' : '') + '">' +
      '<div class="plan-grid">' + placed.map((z) => zoneButton(z, selKey)).join('') + fillers.map(fillerCell).join('') + '</div>' +
      (fl.key === 'G' ? storefront() : landing()) + '</div></div>';
  }
  stageEl.innerHTML = html;
  renderPanel();
  renderNote();
  $$('.floor-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.floor === fl.key)));
  $$('[data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === floorState.view)));
  live.afterRender();
}
function renderPanel() {
  const panel = $('#zone-panel');
  if (!panel) return;
  const fl = currentFloor();
  const z = fl.zones.find((x) => x.key === floorState.sel[fl.key]) || fl.zones[0];
  panel.innerHTML = panelInner(z);
}
function renderNote() {
  const v = floorState.view;
  let note = v === 'model'
    ? 'Model view · each zone rises with how long visitors stay, you included, live'
    : v === 'aisle'
      ? 'Aisle view · every zone on this floor as a list'
      : 'Plan view · rest on a zone: the timer counts your dwell and the heat builds';
  if (floorState.heatOn) {
    note += band.heatMode === 'actual'
      ? ' · Heat: real dwell, last 30 days'
      : ' · Heat: forecast until ' + band.heatNeed + ' visits are counted (' + Math.min(band.heatHave, band.heatNeed) + ' so far)';
  }
  $('#view-note').textContent = note;
  const ht = $('#heat-toggle');
  ht.setAttribute('aria-pressed', String(floorState.heatOn));
  $('[data-heat-state]', ht).textContent = floorState.heatOn ? 'on' : 'off';
}
function refreshHeat() {
  if (!$('#floor-stage')) return;
  currentFloor().zones.forEach((z) => {
    $$('#floor [data-code="' + z.code + '"]').forEach((el) => applyHeat(el, z));
  });
  renderNote();
  if (!compact()) renderPanel();
}

function selectZone(key, opts = {}) {
  const fl = currentFloor();
  if (!fl.zones.some((z) => z.key === key)) return;
  floorState.sel[fl.key] = key;
  if (compact()) {
    floorState.expanded = floorState.expanded === key && !opts.forceOpen ? null : key;
    renderFloor();
    if (opts.scroll) {
      const row = $('.aisle-row[data-zone="' + key + '"]');
      if (row) row.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
    }
    return;
  }
  $$('.zone').forEach((b) => {
    const on = b.dataset.zone === key;
    b.classList.toggle('is-sel', on);
    b.setAttribute('aria-pressed', String(on));
  });
  $$('.aisle-row').forEach((b) => b.setAttribute('aria-current', String(b.dataset.zone === key)));
  renderPanel();
}
function goFloor(key, zoneKey, after) {
  const stageEl = $('#floor-stage');
  if (key === floorState.floor) {
    if (zoneKey) selectZone(zoneKey, { forceOpen: true });
    if (after) after();
    return;
  }
  stageEl.classList.add('is-moving');
  setTimeout(() => {
    floorState.floor = key;
    floorState.expanded = compact() ? zoneKey || null : null;
    if (zoneKey) floorState.sel[key] = zoneKey;
    renderFloor();
    stageEl.classList.remove('is-moving');
    if (after) after();
  }, reduced() ? 0 : 180);
}

// Live dwell: attention follows the pointer. Resting on a zone or on its
// details panel, focusing it with the keyboard, or opening its row on a phone
// all count. The seconds tick on the zone and its heat builds while you stay.
const live = {
  active: null,
  timer: null,
  floorVisible: false,
  start(code) {
    if (!code || (this.active && this.active.code === code)) return;
    this.stop();
    if (document.visibilityState !== 'visible') return;
    this.active = { code, since: performance.now(), began: performance.now() };
    this.mark(code, true);
    this.timer = setInterval(() => {
      if (!this.active) return;
      if (performance.now() - this.active.began > MAX_REST_MS) { this.stop(); return; }
      this.paint(this.active.code);
    }, 100);
    this.paint(code);
  },
  stop() {
    if (!this.active) return;
    const { code, since } = this.active;
    addZoneDwell(code, performance.now() - since);
    this.active = null;
    clearInterval(this.timer);
    this.mark(code, false);
    this.paint(code);
  },
  collect() {
    if (!this.active) return;
    const now = performance.now();
    addZoneDwell(this.active.code, now - this.active.since);
    this.active.since = now;
  },
  seconds(code) {
    let ms = myDwellMs(code);
    if (this.active && this.active.code === code) ms += performance.now() - this.active.since;
    return ms / 1000;
  },
  mark(code, on) {
    $$('#floor [data-code="' + code + '"]').forEach((el) => el.classList.toggle('is-dwelling', on));
  },
  paint(code) {
    const z = currentFloor().zones.find((x) => x.code === code);
    if (!z) return;
    const secs = this.seconds(code);
    const precise = !!(this.active && this.active.code === code);
    $$('#floor [data-code="' + code + '"]').forEach((el) => {
      applyHeat(el, z);
      el.classList.toggle('has-dwell', secs >= 0.5);
      const t = $('.dwell-time', el);
      if (t) t.textContent = fmtDwell(secs, precise);
    });
    $$('#floor [data-dwell-for="' + code + '"]').forEach((el) => { el.textContent = fmtDwell(secs, precise); });
  },
  // Phones have no hover: an open row counts while the floor is on screen.
  syncCompact() {
    if (!compact()) return;
    const fl = currentFloor();
    const z = floorState.expanded ? fl.zones.find((x) => x.key === floorState.expanded) : null;
    if (z && this.floorVisible && document.visibilityState === 'visible') this.start(z.code);
    else this.stop();
  },
  afterRender() {
    if (compact()) {
      if (this.active && !currentFloor().zones.some((x) => x.code === this.active.code)) this.stop();
      this.syncCompact();
    } else if (this.active && !$('#floor [data-code="' + this.active.code + '"]')) {
      this.stop();
    }
    if (this.active) {
      this.mark(this.active.code, true);
      this.paint(this.active.code);
    }
  }
};

function handleHash() {
  const m = /^#zone-([a-z0-9]+)$/i.exec(location.hash || '');
  if (!m) return;
  const z = findZone(m[1]);
  if (!z) return;
  goFloor(z.floor, z.key, () => {
    if (compact()) {
      floorState.expanded = z.key;
      renderFloor();
    }
    const target = compact() ? $('.aisle-row[data-zone="' + z.key + '"]') : $('#floor');
    if (target) target.scrollIntoView({ block: compact() ? 'center' : 'start', behavior: reduced() ? 'auto' : 'smooth' });
  });
}

function initFloor() {
  if (!$('#floor-stage')) return;
  renderElevator();
  renderFloor();

  $('#floor').addEventListener('click', (e) => {
    const zoneBtn = e.target.closest('.zone, .aisle-row');
    if (zoneBtn) {
      selectZone(zoneBtn.dataset.zone);
      return;
    }
    const floorBtn = e.target.closest('.floor-btn');
    if (floorBtn) {
      const fl = FLOORS.find((f) => f.key === floorBtn.dataset.floor);
      goFloor(fl.key, floorState.sel[fl.key] || fl.zones[0].key);
      return;
    }
    if (e.target.closest('[data-to-ground]')) {
      goFloor('G', floorState.sel.G);
      return;
    }
    const viewBtn = e.target.closest('[data-view]');
    if (viewBtn) {
      floorState.view = viewBtn.dataset.view;
      renderFloor();
      return;
    }
    if (e.target.closest('#heat-toggle')) {
      floorState.heatOn = !floorState.heatOn;
      refreshHeat();
    }
  });
  $('#floor').addEventListener('dblclick', (e) => {
    const zoneBtn = e.target.closest('.zone');
    if (!zoneBtn) return;
    const z = currentFloor().zones.find((x) => x.key === zoneBtn.dataset.zone);
    if (z && z.href && (z.status === 'open' || z.status === 'window')) location.href = z.href;
  });
  const stage = $('#floor-stage');
  const zoneAt = (el) => (el && el.closest ? el.closest('.zone') : null);
  stage.addEventListener('pointerover', (e) => {
    if (e.pointerType === 'touch') return;
    const zone = zoneAt(e.target);
    if (zone) live.start(zone.dataset.code);
  });
  stage.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || live.active) return;
    const zone = zoneAt(e.target);
    if (zone) live.start(zone.dataset.code);
  });
  stage.addEventListener('pointerout', (e) => {
    const zone = zoneAt(e.target);
    if (!zone || zone.contains(e.relatedTarget)) return;
    if (live.active && live.active.code === zone.dataset.code) live.stop();
  });
  stage.addEventListener('focusin', (e) => {
    const zone = zoneAt(e.target);
    if (zone && zone.matches(':focus-visible')) live.start(zone.dataset.code);
  });
  stage.addEventListener('focusout', (e) => {
    const zone = zoneAt(e.target);
    if (zone && live.active && live.active.code === zone.dataset.code && !zone.matches(':hover')) live.stop();
  });
  const panel = $('#zone-panel');
  if (panel) {
    const selectedCode = () => {
      const fl = currentFloor();
      const z = fl.zones.find((x) => x.key === floorState.sel[fl.key]);
      return z ? z.code : null;
    };
    panel.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') live.start(selectedCode()); });
    panel.addEventListener('pointerleave', () => { if (live.active && live.active.code === selectedCode()) live.stop(); });
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      live.floorVisible = entries[0].isIntersecting;
      live.syncCompact();
    }, { threshold: 0.35 }).observe($('#floor'));
  }
  onCollect(() => live.collect());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') live.stop();
    else live.syncCompact();
  });

  compactMQ.addEventListener('change', () => {
    floorState.expanded = null;
    renderFloor();
  });
  document.addEventListener('scg:lang', () => {
    renderElevator();
    renderFloor();
  });
  window.addEventListener('hashchange', handleHash);
  handleHash();
}

/* =========================================================================
   Store locator: local time in every city.
   ========================================================================= */
function clock(tz, now) {
  try {
    return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(now);
  } catch (e) {
    return '--:--';
  }
}
function initLocator() {
  const tick = () => {
    const now = new Date();
    $$('[data-tz]').forEach((el) => { el.textContent = clock(el.dataset.tz, now); });
  };
  tick();
  setInterval(tick, 20000);
}

/* =========================================================================
   Register: the resume as a receipt.
   ========================================================================= */
const BARS = [2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 1, 2, 1, 3, 1, 1, 2, 2, 1, 1, 3, 1, 2, 1, 1, 2, 1, 3, 2];
function initReceipt() {
  const dateEl = $('#receipt-date');
  if (dateEl) {
    try {
      const now = new Date();
      dateEl.textContent = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric', timeZone: 'America/New_York' }).format(now).toUpperCase() + ' · ' + clock('America/New_York', now);
    } catch (e) { /* keep the static line */ }
  }
  const bc = $('#barcode');
  if (bc) bc.innerHTML = BARS.map((w, i) => '<span style="width:' + w * 2 + 'px;background:' + (i % 2 === 0 ? '#121211' : 'transparent') + '"></span>').join('');
}

initBand();
initHeadline();
initWindow();
initFloor();
initLocator();
initReceipt();
