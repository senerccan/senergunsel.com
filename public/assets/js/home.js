// Homepage: walk-in headline, door band, window model, floor plan, locator, register.
import { FLOORS, FLOORSET, packFloor, findZone } from './store.js';
import { sign, floorName, LANG_TAGS } from './signs.js';
import { currentLang } from './site.js';
import { onDoor, onCollect, addZoneDwell, addZoneStop, myDwellMs, myStops, formatDwell, pad4 } from './door.js';

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
  $$('[data-sensor]').forEach((el) => { el.textContent = 'Door counter'; });
}

function paintOffline() {
  const bandEl = $('.band');
  if (bandEl) bandEl.classList.add('is-offline');
  $$('[data-sensor]').forEach((el) => { el.textContent = 'Door counter resting'; });
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
   walks in, the next line rotates in. Each line holds long enough to read,
   and the dots, arrows and pause let visitors move at their own pace.
   The intro line underneath stays put, so the name never moves around.
   ========================================================================= */
const LINES = [
  { before: 'Welcome in', after: " I'm Sener", size: 'min(112px, calc((100vw - 80px) / 11.2))', text: "Welcome in, I'm Sener." },
  { before: 'I lined up for drops', after: ' now I read the line', size: 'min(68px, calc((100vw - 80px) / 18.6))', text: 'I lined up for drops, now I read the line.' },
  { before: 'Most walk past', after: ' some walk in', size: 'min(86px, calc((100vw - 80px) / 14.2))', text: 'Most walk past, some walk in.' },
  { before: 'Four languages', after: ' one question', size: 'min(86px, calc((100vw - 80px) / 14.1))', text: 'Four languages, one question.' },
  { before: 'Baseline first', after: ' then the rally', size: 'min(86px, calc((100vw - 80px) / 13.1))', text: 'Baseline first, then the rally.' }
];
const LINE_HOLD_MS = 6500;        // a line stays up this long before the man walks in again
const LINE_HOLD_PHONE_MS = 8500;  // phones fade from line to line
const LINE_MANUAL_MS = 14000;     // after someone picks a line, give them time to read it
const LINE_FIRST_MS = 2600;       // the welcome line gets a moment before the first walk-in
const LINE_FIRST_PHONE_MS = 7000;

const HL = {
  idx: 0,
  playing: false,
  paused: false,
  timers: [],
  loop: null,
  visible: true,
  started: false,
  firstWalkDone: false
};

let stage, walker, commaEl, doorEl, textEl, beforeEl, afterEl;

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
  stage.style.fontSize = line.size;
  $$('#hl-dots .hl-dot').forEach((d, k) => d.setAttribute('aria-pressed', String(k === i)));
}
function fadeTo(i, done) {
  stage.classList.add('is-fading');
  HL.timers.push(setTimeout(() => {
    setLine(i);
    stage.classList.remove('is-fading');
    if (done) done();
  }, 300));
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
    schedule(LINE_HOLD_MS);
  });
}
function stepCompact() {
  if (HL.playing) return;
  HL.playing = true;
  fadeTo((HL.idx + 1) % LINES.length, () => {
    HL.playing = false;
    schedule(LINE_HOLD_PHONE_MS);
  });
}
// A visitor picked a line (a dot or an arrow): go there now, no walk, and hold it.
function goTo(i) {
  const n = LINES.length;
  const next = ((i % n) + n) % n;
  resetStage();
  HL.playing = true;
  fadeTo(next, () => {
    HL.playing = false;
    schedule(LINE_MANUAL_MS);
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
  setLine(0);
  paintPause();

  $('#hl-next').addEventListener('click', () => goTo(HL.idx + 1));
  $('#hl-prev').addEventListener('click', () => goTo(HL.idx - 1));
  $$('#hl-dots .hl-dot').forEach((d) => {
    d.addEventListener('click', () => {
      const i = Number(d.dataset.line);
      if (i !== HL.idx || HL.playing) goTo(i);
    });
  });
  $('#hl-pause').addEventListener('click', () => {
    HL.paused = !HL.paused;
    paintPause();
    if (HL.paused) clearTimeout(HL.loop);
    else if (!HL.playing) schedule(600);
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      const was = HL.visible;
      HL.visible = entries[0].isIntersecting;
      if (!HL.visible) clearTimeout(HL.loop);
      else if (!was && HL.started && !HL.playing) schedule(1500);
    }, { threshold: 0.15 }).observe(stage);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (!HL.playing) schedule(2000);
    } else {
      clearTimeout(HL.loop);
    }
  });
  compactMQ.addEventListener('change', () => { resetStage(); schedule(2000); });
  reduceMQ.addEventListener('change', () => { resetStage(); schedule(2000); });

  const go = () => {
    HL.started = true;
    schedule(compact() ? LINE_FIRST_PHONE_MS : LINE_FIRST_MS);
  };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(go, go);
  else go();
}

/* =========================================================================
   Floor plan
   ========================================================================= */
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
// Melbourne's street sites for the pins preview, projected from the project's
// sensor data onto a 120 x 100 box, north up: x, y and the store size each one
// earns (1 flagship, 2 standard, 3 small). "a" marks a site placed by landmark.
// 61 of the 78 sites fall inside this crop of the city centre. PIN_GRID draws
// the city grid's main streets, fitted to the sensors on named corners.
const PIN_GRID = 'M29.7 81L13.3 41.5M40 77.4L23.6 37.9M50.2 73.8L33.9 34.2M60.5 70.2L44.2 30.6M70.8 66.5L54.4 27M81.1 62.9L64.7 23.4M91.4 59.3L75 19.8M101.7 55.7L85.3 16.2M111.9 52.1L95.6 12.6M29.7 81L111.9 52.1M25.6 71.1L107.8 42.2M21.5 61.2L103.7 32.3M17.4 51.3L99.7 22.5M13.3 41.5L95.6 12.6';
const PINS = '26.3,72,3;34.3,4.1,3;54,58.7,3;100,24.6,3;45.1,16.4,3;96.2,36.9,3;36.2,37.5,3;39,77.2,3;23.6,38.6,3;62.6,74.7,3;42.2,76.6,3;14.2,40.3,3;5,22.2,3;14,40.5,3;72.2,71.9,2;11.8,75.9,2;61.1,77.4,2;103.9,43.5,2;103.2,42.6,2;83.2,33.6,2;81.7,38.6,2;26.2,70.9,2;32.6,97.7,2;83.9,82.5,2a;85.2,76.7,2;76.3,31,2;77.6,59.5,2;59.7,38.1,2;47.2,10.5,2;57.1,37.8,2;55.4,36.9,2;22.4,60.4,2;61.7,15.5,2;61.9,12.5,2;58,24.4,2;77.1,42,2;76,53.8,2a;72.2,60.3,2;72.2,60.5,2;85.2,62.5,2;69.9,66.2,2;35.7,40,2;33.3,34.7,2;94.3,57.4,2;20.8,62.6,2;30.7,85.8,2;48.5,11.1,2;70.5,44.5,1;66.8,29.9,1;74.3,50.1,1;81.7,70.2,1;71.9,37,1;70.1,77.8,1;74.3,46.2,1;71.8,54,1;67.5,27.6,1;72.4,60.5,1;74.6,66,1;17,52.3,1;20.2,60.8,1;71.8,72,1'
  .split(';').map((p) => p.split(','));
const PIN_R = { 1: 3.6, 2: 2.6, 3: 1.8 };

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
  notes: () => '<span class="hint-notes"><span style="height:28px;transform:rotate(-7deg)"></span><span style="height:34px;transform:rotate(5deg)"></span><span style="height:26px;transform:rotate(-3deg)"></span></span>',
  pins: () => '<span class="hint-pins"><svg class="pins-map" viewBox="0 0 120 100" preserveAspectRatio="xMidYMid meet">' +
    '<path class="pins-grid" d="' + PIN_GRID + '"></path>' +
    PINS.map((p) => '<circle class="pin p' + p[2][0] + (p[2][1] ? ' pin-a' : '') + '" cx="' + p[0] + '" cy="' + p[1] + '" r="' + PIN_R[p[2][0]] + '"></circle>').join('') +
    '</svg><span class="pins-text"><b>78</b><span>street sites</span><span class="hot">3 store sizes</span></span></span>',
  // G07: a few lines of the flagship's build on their switches. Rest on the zone
  // and the premium finishes switch on, and the first flagship's cost ticks up.
  switches: () => '<span class="hint-switches">' +
    [['LED wall', 'on'], ['Premium finishes', 'flip'], ['Kiosks', 'on']].map((r) => '<span class="hs-row"><span class="hs-sw hs-' + r[1] + '"></span><span>' + r[0] + '</span></span>').join('') +
    '<span class="hs-total"><span>First flagship</span><b><span class="hs-a">$1,416,330</span><span class="hs-b">$1,486,710</span></b></span></span>',
  // G02: the same standard store on two Destination Retail streets. The share of
  // people walking past who must come in for it to repay its build in three years,
  // on a 0 to 10% scale, against the share that kind of street gives (the band).
  streets2: () => '<span class="hint-streets2"><span class="s2-k">Must come in</span>' +
    '<span class="s2-track"><span class="s2-base"></span><span class="s2-can"></span>' +
    '<span class="s2-knob s2-busy"></span><span class="s2-knob s2-quiet"></span></span>' +
    '<span class="s2-labels"><span class="s2-busy">Busy <b>0.9%</b></span><span class="s2-quiet">Quiet <b>6.6%</b></span></span></span>'
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
// Live dwell, in three layers:
//   heat   the store's dwell (forecast or real), warmed by your earlier stops
//          on the zone this visit. Your trail stays on the floor in orange.
//   grow   the stop you're on now: a bloom that pulses and grows while you
//          stay, orange on a first stop and blue when you come back.
//   rise   both together, for the zone's height in Model view.
// Each stop has its own clock that starts at zero. Under a second is a
// pass-by, like a shopper walking past the door, and doesn't count.
const STOP_MIN_MS = 1000;   // a stop counts once you've stayed this long
const MAX_STOP_MS = 90000;  // one stop counts for at most 90 seconds
const HOLD_MS = 1500;       // moving between a zone and its details panel keeps the stop going
const JITTER_MS = 300;      // so does brushing off the edge of a zone and straight back
const SETTLE_MS = 1300;     // after you step off, the stop's time stays up for a moment

function growOf(ms) {
  const t = ms / 1000;
  // Quick at first so you see it start, then slower so it keeps growing for a minute.
  return 0.62 * (1 - Math.exp(-t / 4)) + 0.38 * (1 - Math.exp(-t / 30));
}
function trailOf(ms) {
  return 0.5 * (1 - Math.exp(-ms / 20000));
}
function intensity(z) {
  if (!floorState.heatOn) return { heat: 0, grow: 0, rise: 0 };
  const base = 0.65 * heatOf(z);
  const heat = 1 - (1 - base) * (1 - trailOf(live.trailMs(z.code)));
  const grow = live.growFor(z.code);
  return { heat, grow, rise: 1 - (1 - heat) * (1 - 0.75 * grow) };
}
function heatVars(z) {
  const { heat, grow, rise } = intensity(z);
  const h = floorState.heatOn ? Math.round(4 + rise * 16) : 6;
  return '--heat:' + heat.toFixed(3) + ';--grow:' + grow.toFixed(3) + ';--h:' + h + 'px;';
}
function applyHeat(el, z) {
  const { heat, grow, rise } = intensity(z);
  el.style.setProperty('--heat', heat.toFixed(3));
  el.style.setProperty('--grow', grow.toFixed(3));
  el.style.setProperty('--h', (floorState.heatOn ? Math.round(4 + rise * 16) : 6) + 'px');
}
function fmtDwell(secs, precise) {
  if (secs < 60) return (precise ? secs.toFixed(1) : String(Math.floor(secs))) + 's';
  return Math.floor(secs / 60) + 'm ' + String(Math.floor(secs % 60)).padStart(2, '0') + 's';
}
// The "Your dwell" line in a zone's details: this stop, your total, your stops.
function youLine(code) {
  const now = live.active && live.active.code === code ? live.active : null;
  const earlier = live.trailMs(code);
  const n = myStops(code);
  const parts = [];
  if (now) parts.push('<span class="zy-now">This stop <b>' + fmtDwell(live.stopMs(code) / 1000, true) + '</b></span>');
  if (earlier > 0 || (!now && n > 0)) {
    parts.push('<span>Total <b>' + fmtDwell(live.totalMs(code) / 1000, true) + '</b></span>');
    parts.push('<span>' + n + (n === 1 ? ' stop' : ' stops') + '</span>');
  }
  return parts.length ? parts.join('<span class="zy-sep"> · </span>') : '<span>Not yet</span>';
}
function youSummary(code) {
  const n = myStops(code);
  if (!n) return 'none yet';
  const secs = Math.round(live.totalMs(code) / 1000);
  return secs + (secs === 1 ? ' second' : ' seconds') + ' over ' + n + (n === 1 ? ' stop' : ' stops');
}
// Each zone says what it is in plain words (its kind) and where it stands (its tag).
const TAG_CLASS = { 'Case study': 'tag tag-ink', Playable: 'tag tag-accent', Read: 'tag', Soon: 'tag tag-dash', TBA: 'tag tag-dash' };
function tagHtml(z) {
  return '<span class="' + (TAG_CLASS[z.tag] || 'tag') + '">' + esc(z.tag) + '</span>';
}
// Real work and grad school get a solid chip, things still to come a dashed one.
function kindClass(z) {
  if (/^(Work|Grad school)/.test(z.kind)) return 'k-work';
  if (/^Coming/.test(z.kind)) return 'k-later';
  return 'k-own';
}
function statusLine(z) {
  if (z.status === 'soon') return z.kind + '. Opening soon';
  if (z.status === 'tba') return z.kind + '. Release date: TBA';
  return z.kind + '. ' + z.tag;
}
// The live layers inside a zone: the bloom for the stop you're on and the
// ripples it sends out. They sit behind the zone's text.
function bloom(style) {
  return '<span class="zone-bloom" aria-hidden="true"' + (style ? ' style="' + style + '"' : '') + '><span class="zone-core"></span><span class="zone-ring"></span><span class="zone-ring r2"></span></span>';
}
function liveClasses(code) {
  const s = live.active && live.active.code === code ? live.active : null;
  return [s ? 'is-dwelling' : '', s && s.back ? 'is-return' : ''];
}
// Where a zone sits: on the floor's grid, or inside its suite's own grid.
function gridPos(z) {
  const c = z.suite ? z.scol : z.col;
  const r = z.suite ? z.srow : z.row;
  return 'grid-column:' + c + ' / span ' + z.w + ';grid-row:' + r + ' / span ' + z.h;
}
function zoneButton(z, selKey, n) {
  const lang = currentLang();
  const cls = ['zone', z.key === selKey ? 'is-sel' : '', z.hatch ? 'is-hatched' : '', z.w <= 2 ? 'is-narrow' : '',
    z.suite ? 'in-suite' : '', z.format === 'HALF' ? 'is-half' : '', z.format === 'JOIN' ? 'is-join' : ''].concat(liveClasses(z.code)).filter(Boolean).join(' ');
  return '<button type="button" class="' + cls + '" data-zone="' + esc(z.key) + '" data-code="' + esc(z.code) + '" aria-pressed="' + (z.key === selKey) + '"' +
    ' aria-label="' + esc(z.code + ', ' + z.title + '. ' + statusLine(z)) + '"' +
    ' style="' + heatVars(z) + '--i:' + n + ';' + gridPos(z) + '">' +
    (z.hatch ? '<span class="zone-hatch" aria-hidden="true"></span>' : '') +
    '<span class="zone-heat breathe" aria-hidden="true"></span>' + bloom('top:' + z.g.top + ';bottom:' + z.g.bottom) +
    '<span class="zone-hint" aria-hidden="true" style="top:' + z.g.top + ';bottom:' + z.g.bottom + '">' + (HINTS[z.hint] ? HINTS[z.hint]() : '') + '</span>' +
    '<span class="zone-top" aria-hidden="true"><span class="zone-label"><span class="zl-sign">' + esc(z.code) + '<span class="zl-place"> · <span lang="' + langTag() + '">' + esc(sign(lang, z.place)) + '</span></span></span>' +
    '<span class="zl-dwell"><span class="zl-code">' + esc(z.code) + ' · </span><i></i><span class="zl-word"><span class="zl-first">Dwell </span><span class="zl-back">Back </span></span><b class="dwell-time">' + fmtDwell(live.stopMs(z.code) / 1000, true) + '</b></span></span>' +
    tagHtml(z) + '</span>' +
    '<span class="zone-bottom" aria-hidden="true"><span class="zone-kind ' + kindClass(z) + '">' + esc(z.kind) + '</span><span class="zone-title" style="font-size:' + z.g.title + '">' + esc(z.planTitle || z.title) + '</span><span class="zone-meta">' + esc(z.zoneMeta) + '</span></span>' +
    '</button>';
}
// A suite: rooms that are projects on their own and add up to something more
// together. They share walls inside one outer wall, with a doorway between the
// two halves. The row holding the room that joins them gets a little more height.
function suiteRows(s, rooms) {
  const rows = [];
  for (let r = 1; r <= s.h; r++) rows.push(rooms.some((z) => z.format === 'JOIN' && z.srow === r) ? 'minmax(0, 1.25fr)' : 'minmax(0, 1fr)');
  return rows.join(' ');
}
function suiteBlock(s, rooms, selKey, n) {
  const walls = [];
  rooms.forEach((z) => {
    if (z.scol > 1) walls.push('<span class="suite-wall sw-v' + (z.format === 'HALF' ? ' sw-door' : '') + '" aria-hidden="true" style="grid-column:' + z.scol + ';grid-row:' + z.srow + ' / span ' + z.h + '"></span>');
    if (z.srow > 1) walls.push('<span class="suite-wall sw-h" aria-hidden="true" style="grid-column:' + z.scol + ' / span ' + z.w + ';grid-row:' + z.srow + '"></span>');
  });
  return '<div class="suite" role="group" aria-label="' + esc(s.label) + '" style="--i:' + n + ';grid-column:' + s.col + ' / span ' + s.w + ';grid-row:' + s.row + ' / span ' + s.h +
    ';grid-template-columns:repeat(' + s.w + ', minmax(0, 1fr));grid-template-rows:' + suiteRows(s, rooms) + '">' +
    rooms.map((z, k) => zoneButton(z, selKey, n + k)).join('') + walls.join('') + '</div>';
}
// The floor in order: zones on their own, and each suite as one block where its first room comes up.
function planItems(placed, suites, one, block) {
  const out = [];
  const done = new Set();
  let n = 0;
  placed.forEach((z) => {
    if (!z.suite) {
      out.push(one(z, n++));
      return;
    }
    if (done.has(z.suite)) return;
    done.add(z.suite);
    const s = suites.find((x) => x.key === z.suite);
    const rooms = placed.filter((x) => x.suite === z.suite);
    out.push(block(s, rooms, n));
    n += rooms.length;
  });
  return out.join('');
}
function fillerCell(f, n) {
  return '<div class="filler" aria-hidden="true" style="--i:' + n + ';grid-column:' + f.col + ' / span ' + f.w + ';grid-row:' + f.row + ' / span ' + f.h + '"><span><b>Next drop</b><span>Room for the next project</span></span></div>';
}
function panelInner(z) {
  const lang = currentLang();
  let dwell = '';
  if (floorState.heatOn && band.heatMode === 'actual' && band.heat && band.heat[z.code] != null) {
    dwell = '<p class="zp-dwell">Heat ' + Math.round(band.heat[z.code] * 100) + ' of 100 · time visitors spend here, last 30 days</p>';
  }
  const back = live.active && live.active.code === z.code && live.active.back;
  dwell += '<p class="zp-dwell zp-you' + (back ? ' is-return' : '') + '" data-you-for="' + esc(z.code) + '"><span class="zy-k">Your time here</span>' +
    '<span class="visually-hidden">this visit: ' + esc(youSummary(z.code)) + '</span>' +
    '<span class="zy-v" aria-hidden="true">' + youLine(z.code) + '</span></p>';
  const facts = z.facts && z.facts.length
    ? '<dl class="zp-facts">' + z.facts.map((f) => '<div><dt>' + esc(f.v) + '</dt><dd>' + esc(f.k) + '</dd></div>').join('') + '</dl>'
    : '';
  const suite = suiteNote(z);
  let action;
  if (z.href && z.status === 'open') {
    action = '<a class="zp-cta" href="' + esc(z.href) + '">' + esc(z.cta) + ARROW + '</a>';
  } else {
    const subject = encodeURIComponent('About ' + z.title);
    action = '<div class="zp-soon"><span>' + esc(z.status === 'tba' ? 'Release date: TBA' : 'Opening soon') + '</span><span class="sign" style="color:var(--muted)">' + esc(z.code) + '</span></div>' +
      '<a class="zp-ask" href="mailto:' + EMAIL + '?subject=' + subject + '">Ask me about it before it opens</a>';
  }
  return '<div class="zp-top"><span>' + esc(z.code) + ' · <span lang="' + langTag() + '">' + esc(sign(lang, z.place)) + '</span></span>' + tagHtml(z) + '</div>' +
    '<div class="zp-head"><p class="zp-kind ' + kindClass(z) + '">' + esc(z.kind) + '</p><h3 class="zp-title">' + esc(z.title) + '</h3><p class="zp-meta">' + esc(z.meta) + '</p></div>' +
    '<p class="zp-body">' + esc(z.body) + '</p>' + suite + facts + dwell +
    '<div class="zp-foot">' + action + '</div>';
}
// In a suite, each room points to the others: the half it pairs with and the
// room that puts them together, or (for that room) the two halves it's made of.
function suiteNote(z) {
  if (!z.suite) return '';
  const fl = currentFloor();
  const mates = fl.zones.filter((x) => x.suite === z.suite && x.key !== z.key);
  const pick = (m) => '<button type="button" class="zp-pick" data-zone="' + esc(m.key) + '"><span class="zp-pick-code">' + esc(m.code) + '</span><span class="zp-pick-name">' + esc(m.title) + '</span></button>';
  let rows;
  if (z.format === 'JOIN') {
    rows = '<p class="zp-suite-k">Made of two projects that also work alone</p>' + mates.map(pick).join('');
  } else {
    const half = mates.filter((m) => m.format !== 'JOIN');
    const join = mates.filter((m) => m.format === 'JOIN');
    rows = (half.length ? '<p class="zp-suite-k">Works alone, and pairs with</p>' + half.map(pick).join('') : '') +
      (join.length ? '<p class="zp-suite-k">Together they make</p>' + join.map(pick).join('') : '');
  }
  return '<div class="zp-suite">' + rows + '</div>';
}
function aisleRow(z, selKey, isCompact, n, mark) {
  const lang = currentLang();
  const open = isCompact && floorState.expanded === z.key;
  const attrs = isCompact
    ? ' aria-expanded="' + open + '" aria-controls="aisle-' + esc(z.key) + '"'
    : ' aria-current="' + (z.key === selKey) + '"';
  return '<li' + (mark ? ' class="' + mark + '"' : '') + ' style="--i:' + n + '"><button type="button" class="aisle-row" data-zone="' + esc(z.key) + '"' + attrs + '>' +
    '<span class="aisle-code">' + esc(z.code) + '</span>' +
    '<span class="aisle-sign" lang="' + langTag() + '">' + esc(sign(lang, z.place)) + '</span>' +
    '<span class="aisle-name"><b>' + esc(z.title) + '</b><span>' + esc(isCompact ? z.kind : z.kind + ' · ' + z.zoneMeta) + '</span></span>' +
    tagHtml(z) +
    (isCompact ? CHEV : ARROW) + '</button>' +
    (isCompact ? '<div class="aisle-detail" id="aisle-' + esc(z.key) + '"' + (open ? '' : ' hidden') + '>' + (open ? panelInner(z) : '') + '</div>' : '') +
    '</li>';
}
function miniPlan(placed, fillers, suites, selKey) {
  const cell = (z, n) => {
    const cls = [z.key === selKey ? 'is-sel' : ''].concat(liveClasses(z.code)).filter(Boolean).join(' ');
    return '<span class="' + cls + '" data-code="' + esc(z.code) + '" style="' + heatVars(z) + '--i:' + n + ';' + gridPos(z) + '">' +
      (z.hatch ? '<span class="zone-hatch"></span>' : '') +
      '<span class="zone-heat"></span>' + bloom('') + '<b>' + esc(z.code) + '</b></span>';
  };
  const block = (s, rooms, n) => '<span class="mini-suite" style="grid-column:' + s.col + ' / span ' + s.w + ';grid-row:' + s.row + ' / span ' + s.h +
    ';grid-template-columns:repeat(' + s.w + ', minmax(0, 1fr));grid-template-rows:' + suiteRows(s, rooms) + '">' + rooms.map((z, k) => cell(z, n + k)).join('') + '</span>';
  const cells = planItems(placed, suites, cell, block) +
    fillers.map((f) => '<span class="mini-filler" style="grid-column:' + f.col + ' / span ' + f.w + ';grid-row:' + f.row + ' / span ' + f.h + '"></span>').join('');
  return '<div class="mini-plan" aria-hidden="true"><div class="mini-grid">' + cells + '</div></div>';
}
// In the list, a suite's rooms are bracketed together.
function suiteMark(placed, z) {
  if (!z.suite) return '';
  const rooms = placed.filter((x) => x.suite === z.suite);
  return 'in-suite' + (rooms[0] === z ? ' suite-first' : '') + (rooms[rooms.length - 1] === z ? ' suite-last' : '');
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
  const { placed, fillers, suites } = packFloor(fl);
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

  let html = '';
  if (isCompact) {
    html = miniPlan(placed, fillers, suites, floorState.expanded) +
      '<ul class="aisle" aria-label="Projects on this floor">' + placed.map((z, n) => aisleRow(z, selKey, true, n, suiteMark(placed, z))).join('') + '</ul>';
  } else if (floorState.view === 'aisle') {
    html = '<ul class="aisle" aria-label="Projects on this floor">' + placed.map((z, n) => aisleRow(z, selKey, false, n, suiteMark(placed, z))).join('') + '</ul>';
  } else {
    html = '<div class="plan-scroll"><div class="plan' + (floorState.view === 'model' ? ' model' : '') + '">' +
      '<div class="plan-grid">' + planItems(placed, suites, (z, n) => zoneButton(z, selKey, n), (s, rooms, n) => suiteBlock(s, rooms, selKey, n)) +
      fillers.map((f, n) => fillerCell(f, placed.length + n)).join('') + '</div>' +
      '</div></div>';
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
  const key = floorState.heatOn ? ': <span class="key key-first">first stop</span> <span class="key key-back">coming back</span>' : '';
  let how = v === 'model'
    ? '3D view · zones rise with the time visitors spend in them, yours included' + key
    : v === 'aisle'
      ? 'List view · every project on this floor'
      : 'Click a zone to see the project. Rest on one and its clock starts' + key;
  let heat = '';
  if (floorState.heatOn) {
    heat = band.heatMode === 'actual'
      ? 'Heat map · where visitors spend the most time, last 30 days'
      : 'Heat map · where visitors spend the most time. My forecast until ' + (Number(band.heatNeed) || 0) + ' visits are counted (' + (Math.min(Number(band.heatHave) || 0, Number(band.heatNeed) || 0)) + ' so far)';
  }
  $('#view-note').innerHTML = '<span class="vn">' + how + '</span>' + (heat ? '<span class="vn">' + heat + '</span>' : '');
  $('#floor').classList.toggle('heat-off', !floorState.heatOn);
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
    if (stageEl.classList.contains('is-shown')) enterZones();
    if (after) after();
  }, reduced() ? 0 : 180);
}

// Live dwell: attention follows the pointer. Resting on a zone or on its
// details panel, focusing it with the keyboard, or opening its row on a phone
// all count. Every stop gets its own clock from zero; step off and the bloom
// settles, leaving a little warmth behind. Come back and it glows blue.
//
// A stop: { code, start, end, flushed, counted, back, via, capped }
//   start/end  performance.now() times (end is 0 while you're still there)
//   flushed    ms of this stop already sent to the door sensor and your total
//   counted    true once it passed STOP_MIN_MS and became a real stop
//   back       true if you had stopped at this zone before (a return)
//   via        what started it: zone, panel, focus, tap or scroll
const live = {
  active: null,
  held: new Map(),     // stops you just stepped off, kept briefly in case you come straight back
  settling: new Map(), // zones whose last time is still up after you stepped off
  timer: null,
  floorVisible: false,

  start(code, via) {
    if (!code || document.visibilityState !== 'visible') return;
    const now = performance.now();
    if (this.active) {
      if (this.active.code === code) return;
      this.release(now);
    }
    const h = this.held.get(code);
    const grace = via === 'panel' || via === 'scroll' || (h && h.via === 'panel') ? HOLD_MS : JITTER_MS;
    let s;
    if (h && !h.capped && now - h.end < grace) {
      // Straight back to the same stop: pick it up where it was. The time away doesn't count.
      this.unhold(code);
      s = h;
      s.start += now - s.end;
      s.end = 0;
      s.via = via;
    } else {
      if (h) this.finish(code);
      s = { code, start: now, end: 0, flushed: 0, counted: false, back: myStops(code) > 0, via, capped: false };
    }
    this.active = s;
    this.mark(code);
    this.tick();
    if (!this.timer) this.timer = setInterval(() => this.tick(), 100);
  },
  // Step off the stop you're on. It's held for a moment in case you come straight back.
  release(at) {
    const s = this.active;
    if (!s) return;
    this.active = null;
    clearInterval(this.timer);
    this.timer = null;
    s.end = Math.min(at || performance.now(), s.start + MAX_STOP_MS);
    s.hold = setTimeout(() => this.finish(s.code), HOLD_MS);
    this.held.set(s.code, s);
    this.unmark(s.code, s.counted);
    this.paint(s.code);
  },
  unhold(code) {
    const h = this.held.get(code);
    if (!h) return;
    clearTimeout(h.hold);
    this.held.delete(code);
  },
  // Close a stop for good. A pass-by leaves nothing; a real stop adds its time to your total.
  finish(code) {
    const s = this.held.get(code);
    if (!s) return;
    this.unhold(code);
    if (s.counted) this.flush(s, s.end);
    this.paint(code);
  },
  flush(s, end) {
    const ms = end - s.start;
    if (ms > s.flushed) {
      addZoneDwell(s.code, ms - s.flushed);
      s.flushed = ms;
    }
  },
  // Every 100 ms while you rest: count the stop once it passes a second, and repaint.
  tick() {
    const s = this.active;
    if (!s) return;
    const ms = performance.now() - s.start;
    if (ms >= MAX_STOP_MS) {
      s.capped = true;
      this.release(s.start + MAX_STOP_MS);
      return;
    }
    if (!s.counted && ms >= STOP_MIN_MS) {
      s.counted = true;
      addZoneStop(s.code);
    }
    this.paint(s.code);
  },
  // Right before the door sensor sends, so no dwell is left behind.
  collect() {
    const s = this.active;
    if (s && s.counted) this.flush(s, Math.min(performance.now(), s.start + MAX_STOP_MS));
    this.held.forEach((h) => { if (h.counted) this.flush(h, h.end); });
  },
  // The stop you're on, or the one you just stepped off.
  stopMs(code) {
    const s = this.active && this.active.code === code ? this.active : this.held.get(code);
    return s ? (s.end || performance.now()) - s.start : 0;
  },
  // Your earlier stops on this zone this visit, not counting the one you're on.
  trailMs(code) {
    let ms = myDwellMs(code);
    const s = this.active;
    if (s && s.code === code) ms -= s.flushed;
    const h = this.held.get(code);
    if (h && h.counted) ms += h.end - h.start - h.flushed;
    return Math.max(0, ms);
  },
  // Everything this visit, the stop you're on included.
  totalMs(code) {
    const s = this.active;
    return this.trailMs(code) + (s && s.code === code && s.counted ? performance.now() - s.start : 0);
  },
  growFor(code) {
    const s = this.active;
    return s && s.code === code ? growOf(Math.min(performance.now() - s.start, MAX_STOP_MS)) : 0;
  },
  els(code) {
    return $$('#floor [data-code="' + code + '"]');
  },
  mark(code) {
    const s = this.active;
    clearTimeout(this.settling.get(code));
    this.settling.delete(code);
    this.els(code).forEach((el) => {
      el.classList.remove('is-settling');
      el.classList.toggle('is-return', !!(s && s.back));
      el.classList.add('is-dwelling');
    });
  },
  unmark(code, settle) {
    this.els(code).forEach((el) => {
      el.classList.remove('is-dwelling');
      el.classList.toggle('is-settling', !!settle);
    });
    clearTimeout(this.settling.get(code));
    this.settling.delete(code);
    if (settle) {
      this.settling.set(code, setTimeout(() => {
        this.settling.delete(code);
        this.els(code).forEach((el) => el.classList.remove('is-settling'));
      }, SETTLE_MS));
    }
  },
  paint(code) {
    const z = currentFloor().zones.find((x) => x.code === code);
    const s = this.active && this.active.code === code ? this.active : this.held.get(code);
    const stop = fmtDwell(this.stopMs(code) / 1000, true);
    if (z) {
      this.els(code).forEach((el) => {
        applyHeat(el, z);
        const t = s ? $('.dwell-time', el) : null;
        if (t) t.textContent = stop;
      });
    }
    $$('#floor [data-you-for="' + code + '"]').forEach((el) => {
      el.classList.toggle('is-return', !!(this.active && this.active.code === code && this.active.back));
      const v = $('.zy-v', el);
      if (v) v.innerHTML = youLine(code);
    });
  },
  // Phones have no hover: an open row counts while the floor is on screen.
  syncCompact(via) {
    if (!compact()) return;
    const fl = currentFloor();
    const z = floorState.expanded ? fl.zones.find((x) => x.key === floorState.expanded) : null;
    if (z && this.floorVisible && document.visibilityState === 'visible') this.start(z.code, via || 'tap');
    else this.release();
  },
  afterRender() {
    if (compact()) {
      this.syncCompact('tap');
    } else if (this.active && this.active.via !== 'panel' && !$('#floor-stage [data-code="' + this.active.code + '"]')) {
      this.release();
    } else if (this.active && this.active.via === 'focus') {
      // A re-render replaces the focused zone, so keyboard focus has moved on.
      const f = document.activeElement;
      if (!f || !f.closest || !f.closest('[data-code="' + this.active.code + '"]')) this.release();
    }
    if (this.active) {
      this.mark(this.active.code);
      this.paint(this.active.code);
    }
  }
};

// Zones appear one after another the first time the floor comes into view,
// and again whenever you take the elevator to another floor.
let enterTimer = null;
function enterZones() {
  const stageEl = $('#floor-stage');
  if (!stageEl) return;
  stageEl.classList.add('is-shown');
  if (reduced() || !document.documentElement.classList.contains('reveal-on')) return;
  stageEl.classList.add('zones-enter');
  clearTimeout(enterTimer);
  enterTimer = setTimeout(() => stageEl.classList.remove('zones-enter'), 1800);
}

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
  if ('IntersectionObserver' in window && document.documentElement.classList.contains('reveal-on')) {
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      enterZones();
    }, { threshold: 0.12 });
    io.observe($('#floor-stage'));
  } else {
    $('#floor-stage').classList.add('is-shown');
  }

  $('#floor').addEventListener('click', (e) => {
    const pick = e.target.closest('.zp-pick');
    if (pick) {
      const key = pick.dataset.zone;
      selectZone(key, { forceOpen: true, scroll: true });
      const target = compact() ? $('.aisle-row[data-zone="' + key + '"]') : $('.zone[data-zone="' + key + '"]');
      if (target) target.focus({ preventScroll: compact() });
      return;
    }
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
    if (zone) live.start(zone.dataset.code, 'zone');
  });
  stage.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || live.active) return;
    const zone = zoneAt(e.target);
    if (zone) live.start(zone.dataset.code, 'zone');
  });
  stage.addEventListener('pointerout', (e) => {
    const zone = zoneAt(e.target);
    if (!zone || zone.contains(e.relatedTarget)) return;
    if (live.active && live.active.code === zone.dataset.code) live.release();
  });
  stage.addEventListener('focusin', (e) => {
    const zone = zoneAt(e.target);
    if (zone && zone.matches(':focus-visible')) live.start(zone.dataset.code, 'focus');
  });
  stage.addEventListener('focusout', (e) => {
    const zone = zoneAt(e.target);
    if (zone && live.active && live.active.code === zone.dataset.code && !zone.matches(':hover')) live.release();
  });
  const panel = $('#zone-panel');
  if (panel) {
    const selectedCode = () => {
      const fl = currentFloor();
      const z = fl.zones.find((x) => x.key === floorState.sel[fl.key]);
      return z ? z.code : null;
    };
    panel.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') live.start(selectedCode(), 'panel'); });
    panel.addEventListener('pointerleave', () => { if (live.active && live.active.code === selectedCode()) live.release(); });
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      live.floorVisible = entries[0].isIntersecting;
      live.syncCompact('scroll');
    }, { threshold: 0.35 }).observe($('#floor'));
  }
  onCollect(() => live.collect());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') live.release();
    else live.syncCompact('scroll');
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
initFloor();
initLocator();
initReceipt();
