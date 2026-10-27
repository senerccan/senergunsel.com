// G01 · two playable figures on the Under Armour case study, drawn with illustrative
// shapes only: "A visit, as the store sees it" (gate, zone, dwell, engage, the wall answers)
// and "The floor, mapped and re-mapped" (what a floorset change means for the digital map).
// Nothing here is store data.

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------------- A player: steps, play, live text */
function player(root, steps, draw) {
  const btns = $$('[data-step]', root);
  const play = $('[data-play]', root);
  const live = $('[data-live]', root);
  const note = $('[data-note]', root);
  let i = 0, timer = null;
  function go(n, auto) {
    i = Math.max(0, Math.min(steps.length - 1, n));
    btns.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.step) === i)));
    draw(i, !!auto);
    note.innerHTML = '<b>' + esc(steps[i].name) + '</b> ' + esc(steps[i].text);
    live.textContent = steps[i].name + ' ' + steps[i].text;
  }
  function stop() { clearTimeout(timer); timer = null; play.setAttribute('aria-pressed', 'false'); play.textContent = play.dataset.label; }
  function run() {
    if (timer) { stop(); return; }
    play.setAttribute('aria-pressed', 'true'); play.textContent = 'Stop';
    let n = i >= steps.length - 1 ? 0 : i;
    go(n, true);
    const tick = () => {
      n += 1;
      if (n >= steps.length) { stop(); return; }
      go(n, true);
      timer = setTimeout(tick, reduced() ? 1400 : steps[n].hold || 2200);
    };
    timer = setTimeout(tick, reduced() ? 1400 : steps[n].hold || 2200);
  }
  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || !root.contains(b)) return;
    if (b.hasAttribute('data-step')) { stop(); go(Number(b.dataset.step)); }
    else if (b.hasAttribute('data-play')) run();
  });
  root.addEventListener('keydown', (e) => {
    if (!e.target.hasAttribute('data-step')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); stop(); go(i + 1); btns[i].focus(); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); stop(); go(i - 1); btns[i].focus(); }
  });
  play.dataset.label = play.textContent;
  go(0);
  return { go, stop };
}

/* ---------------------------------------------------------------- A: a visit, as the store sees it */
function visit() {
  const root = $('#visit');
  if (!root) return;
  const stage = $('[data-stage]', root);
  // the camera's view of one zone: a gate on the left, a fixture with three product boxes on the right,
  // the LED wall beyond it. The visitor is a dot; the store never sees a face.
  stage.innerHTML = `
<svg viewBox="0 0 640 400" role="img" aria-labelledby="visit-svg-t" class="pf-svg">
  <title id="visit-svg-t">One zone of the store as its camera sees it: a gate line on the left, a fixture with three products on the right and the LED wall beside it. A visitor dot crosses the gate, browses, stops at the fixture, reaches for a product, and the wall shows that product.</title>
  <defs><pattern id="v-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" class="v-grid"/></pattern></defs>
  <rect x="0" y="0" width="640" height="400" class="v-floor"/>
  <rect x="0" y="0" width="640" height="400" fill="url(#v-grid)"/>
  <g class="v-cam"><path d="M14 14h26l10 8v12l-10 8H14z"/><circle cx="26" cy="31" r="5"/><text x="56" y="34" class="v-mono">CAM 3</text></g>
  <path d="M40 46 L600 46" class="v-cone"/>
  <rect x="100" y="70" width="440" height="270" class="v-zone" rx="2"/>
  <text x="112" y="92" class="v-mono v-zone-t">ZONE 3 · FOOTWEAR</text>
  <line x1="70" y1="60" x2="70" y2="350" class="v-gate"/>
  <text x="62" y="372" class="v-mono v-dim" text-anchor="middle">GATE</text>
  <g class="v-fixture" transform="translate(440 110)">
    <rect x="0" y="0" width="90" height="190" class="v-fix"/>
    <text x="45" y="-10" class="v-mono v-dim" text-anchor="middle">FIXTURE 12</text>
    <g class="v-box" data-box="a" transform="translate(10 12)"><rect width="70" height="48"/><text x="35" y="29" text-anchor="middle" class="v-mono">A</text><circle class="v-tag" cx="62" cy="8" r="3.5"/></g>
    <g class="v-box" data-box="b" transform="translate(10 70)"><rect width="70" height="48"/><text x="35" y="29" text-anchor="middle" class="v-mono">B</text><circle class="v-tag" cx="62" cy="8" r="3.5"/></g>
    <g class="v-box" data-box="c" transform="translate(10 128)"><rect width="70" height="48"/><text x="35" y="29" text-anchor="middle" class="v-mono">C</text><circle class="v-tag" cx="62" cy="8" r="3.5"/></g>
  </g>
  <g class="v-led" transform="translate(556 70)">
    <rect x="0" y="0" width="70" height="270" class="v-led-frame"/>
    <g class="v-led-ambient"><rect x="6" y="6" width="58" height="258" class="v-led-screen"/><path d="M6 60 Q35 40 64 60 M6 110 Q35 90 64 110 M6 160 Q35 140 64 160 M6 210 Q35 190 64 210" class="v-led-wave"/></g>
    <g class="v-led-popup" opacity="0"><rect x="6" y="6" width="58" height="258" class="v-led-screen v-led-on"/><path d="M14 150 c6 -18 18 -22 30 -16 c8 4 10 10 10 14 c-2 4 -12 4 -40 2z" class="v-shoe"/><rect x="14" y="176" width="42" height="4" class="v-callout"/><rect x="14" y="186" width="30" height="4" class="v-callout"/><text x="35" y="60" text-anchor="middle" class="v-mono v-led-t">PRODUCT B</text></g>
    <text x="35" y="288" class="v-mono v-dim" text-anchor="middle">LED WALL</text>
  </g>
  <line class="v-link" x1="0" y1="0" x2="0" y2="0" opacity="0"/>
  <g class="v-visitor" style="transform:translate(20px,205px)">
    <circle class="v-halo" r="22"/>
    <circle class="v-dot" r="11"/>
    <g class="v-clock" opacity="0"><rect x="-28" y="-48" width="56" height="22" rx="2"/><text x="0" y="-33" text-anchor="middle" class="v-mono v-clock-t">0:00</text></g>
    <path class="v-arrow" d="M14 0 L34 0 M28 -5 L34 0 L28 5" opacity="0"/>
  </g>
  <g class="v-count" transform="translate(112 330)"><text class="v-mono v-dim"><tspan data-count="people">IN ZONE 0</tspan><tspan dx="18" data-count="state">STATE: NONE</tspan></text></g>
</svg>`;
  const visitor = $('.v-visitor', stage), clock = $('.v-clock', stage), clockT = $('.v-clock-t', stage), arrow = $('.v-arrow', stage), link = $('.v-link', stage);
  const popup = $('.v-led-popup', stage), ambient = $('.v-led-ambient', stage), boxB = $('[data-box="b"]', stage);
  const cPeople = $('[data-count="people"]', stage), cState = $('[data-count="state"]', stage);
  const log = $('[data-log]', root);
  let clockTimer = null, secs = 0;
  const pos = [[20, 205], [86, 205], [250, 190], [400, 190], [416, 190], [330, 380]];
  const STATES = ['NONE', 'ENTERED', 'BROWSING', 'DWELLING', 'ENGAGING', 'LEFT'];
  const LOG = [
    [],
    ['Gate crossed → visitors +1', 'No face stored, no identity: a person, counted'],
    ['Zone 3 occupancy: 1', 'Moving: speed and direction, not who'],
    ['Stationary near fixture 12', 'Dwell clock running past the threshold'],
    ['Product B: tag disturbed, reach seen', 'Trigger → LED wall shows product B'],
    ['Visit record: entered, browsed 8 s, dwelled 12 s, engaged B', 'Pop-up shown once, then back to ambient'],
  ];
  function stopClock() { clearInterval(clockTimer); clockTimer = null; }
  function draw(i) {
    visitor.style.transform = 'translate(' + pos[i][0] + 'px,' + pos[i][1] + 'px)';
    arrow.setAttribute('opacity', i === 2 ? '1' : '0');
    cPeople.textContent = 'IN ZONE ' + (i >= 1 && i <= 4 ? 1 : 0);
    cState.textContent = 'STATE: ' + STATES[i];
    // the dwell clock
    stopClock();
    if (i === 3) {
      secs = 0; clock.setAttribute('opacity', '1'); clockT.textContent = '0:00';
      const step = () => { secs = Math.min(12, secs + 1); clockT.textContent = '0:' + String(secs).padStart(2, '0'); if (secs >= 12) stopClock(); };
      if (reduced()) { secs = 12; clockT.textContent = '0:12'; } else clockTimer = setInterval(step, 250);
    } else if (i === 4) { clock.setAttribute('opacity', '1'); clockT.textContent = '0:12'; }
    else clock.setAttribute('opacity', '0');
    // the engage link, the tag and the wall
    const engaged = i === 4;
    link.setAttribute('x1', pos[4][0] + 11); link.setAttribute('y1', pos[4][1]); link.setAttribute('x2', 450); link.setAttribute('y2', 202);
    link.setAttribute('opacity', engaged ? '1' : '0');
    boxB.classList.toggle('is-hot', engaged);
    popup.setAttribute('opacity', engaged ? '1' : '0');
    ambient.setAttribute('opacity', engaged ? '0.25' : '1');
    log.innerHTML = LOG[i].length ? LOG[i].map((l) => '<li>' + esc(l) + '</li>').join('') : '<li class="pf-log-empty">Nothing logged yet.</li>';
  }
  const steps = [
    { name: 'Outside.', text: 'The gate is a line on the floor the camera watches. Nobody has crossed it.' },
    { name: 'Enter.', text: 'The dot crosses the gate: one more visitor in the zone. The store counts a person, never a face.', hold: 2200 },
    { name: 'Browse.', text: 'Moving through the zone: the camera tracks where the dot goes and how fast, nothing about who it is.', hold: 2400 },
    { name: 'Dwell.', text: 'The dot stops next to fixture 12 and a clock starts. Past the threshold, this counts as dwelling at product B.', hold: 4200 },
    { name: 'Engage.', text: 'A reach for product B: its RFID tag moves and the camera sees the hand. That trigger puts product B on the LED wall beside the fixture, at the height of the hand that picked it up, and it fades once the shoe is back.', hold: 3600 },
    { name: 'Leave.', text: 'The dot walks out, the wall returns to its ambient content after a cooldown, and the visit is a row of states and seconds.', hold: 2600 },
  ];
  player(root, steps, draw);
}

/* ---------------------------------------------------------------- B: the floor, mapped and re-mapped */
function floor() {
  const root = $('#floor');
  if (!root) return;
  const stage = $('[data-stage]', root);
  // six fixtures, four cameras, four zones, three LED panels, the stage with the rug, one gate
  const FIX = {
    f1: { x: 70, y: 98, w: 110, h: 40, cam: 'C1', g: ['g1', 'g1', 'g2'] },
    f2: { x: 230, y: 98, w: 110, h: 40, cam: 'C2', g: ['g2', 'g2', 'g2'] },
    f3: { x: 400, y: 98, w: 110, h: 40, cam: 'C2', g: ['g3', 'g3', 'g1'] },
    f4: { x: 60, y: 240, w: 40, h: 110, cam: 'C3', g: ['g4', 'g4', 'g4'] },
    f5: { x: 300, y: 230, w: 110, h: 40, cam: 'C4', g: ['g1', 'g3', 'g3'] },
    f6: { x: 470, y: 240, w: 40, h: 110, cam: 'C4', g: ['g2', 'g4', 'g4'] },
  };
  // after merchandising moves the floor: f2 and f5 swap, f3 turns, f6 moves, and the groups change
  const MOVED = {
    f1: { x: 70, y: 98, w: 110, h: 40, cam: 'C1', g: ['g1', 'g1', 'g1'] },
    f2: { x: 300, y: 230, w: 110, h: 40, cam: 'C4', g: ['g2', 'g3', 'g3'] },
    f3: { x: 470, y: 96, w: 40, h: 110, cam: 'C2', g: ['g3', 'g1', 'g1'] },
    f4: { x: 60, y: 240, w: 40, h: 110, cam: 'C3', g: ['g4', 'g2', 'g2'] },
    f5: { x: 230, y: 98, w: 110, h: 40, cam: 'C2', g: ['g1', 'g1', 'g3'] },
    f6: { x: 520, y: 220, w: 40, h: 110, cam: 'C4', g: ['g4', 'g4', 'g2'] },
  };
  const ZONES = [
    { id: 'z1', x: 50, y: 70, w: 480, h: 80, name: 'Z1 · WALL' },
    { id: 'z2', x: 50, y: 210, w: 160, h: 150, name: 'Z2 · STAGE' },
    { id: 'z3', x: 230, y: 210, w: 300, h: 90, name: 'Z3 · CENTRE' },
    { id: 'z4', x: 230, y: 320, w: 300, h: 40, name: 'Z4 · ENTRY' },
  ];
  const ZONES_MOVED = [
    { id: 'z1', x: 50, y: 70, w: 370, h: 80, name: 'Z1 · WALL' },
    { id: 'z2', x: 50, y: 210, w: 160, h: 150, name: 'Z2 · STAGE' },
    { id: 'z3', x: 230, y: 210, w: 200, h: 90, name: 'Z3 · CENTRE' },
    { id: 'z4', x: 230, y: 320, w: 350, h: 40, name: 'Z4 · ENTRY' },
    { id: 'z5', x: 440, y: 70, w: 140, h: 130, name: 'Z5 · CORNER' },
  ];
  const CAMS = [['C1', 40, 60], ['C2', 320, 50], ['C3', 40, 370], ['C4', 590, 370]];
  const boxes = (f) => f.g.map((g, k) => {
    const horiz = f.w > f.h;
    const bx = horiz ? 6 + k * ((f.w - 12) / 3) : 6, by = horiz ? 6 : 6 + k * ((f.h - 12) / 3);
    const bw = horiz ? (f.w - 12) / 3 - 4 : f.w - 12, bh = horiz ? f.h - 12 : (f.h - 12) / 3 - 4;
    return '<g class="f-box ' + g + '" transform="translate(' + bx.toFixed(1) + ' ' + by.toFixed(1) + ')"><rect width="' + bw.toFixed(1) + '" height="' + bh.toFixed(1) + '"/><circle class="f-tag" cx="' + (bw - 5).toFixed(1) + '" cy="5" r="3"/></g>';
  }).join('');
  stage.innerHTML = `
<svg viewBox="0 0 640 420" role="img" aria-labelledby="floor-svg-t" class="pf-svg">
  <title id="floor-svg-t">The store floor as a map: LED panels along the top wall, a stage with the rug on the left, six fixtures with their product boxes, four cameras in the corners, four zones and a gate at the entrance. When merchandising moves the fixtures, the boxes are redrawn, each fixture is pointed at the camera that sees it best, the zones and gates are reset, the triggers re-pointed, and the dashboard checked live.</title>
  <defs>
    <pattern id="f-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" class="v-grid"/></pattern>
    <pattern id="f-rug" width="60" height="60" patternUnits="userSpaceOnUse"><image href="/assets/img/ua-rug-tile.webp" width="60" height="60" preserveAspectRatio="xMidYMid slice"/></pattern>
  </defs>
  <rect x="0" y="0" width="640" height="420" class="v-floor"/>
  <rect x="0" y="0" width="640" height="420" fill="url(#f-grid)"/>
  <g class="f-leds">${[70, 230, 390].map((x) => '<rect x="' + x + '" y="14" width="110" height="14" class="f-led"/><text x="' + (x + 55) + '" y="40" class="v-mono v-dim" text-anchor="middle">LED</text>').join('')}</g>
  <g class="f-zones"></g>
  <rect x="110" y="240" width="90" height="110" class="f-stage" fill="url(#f-rug)"/>
  <text x="155" y="300" class="v-mono f-stage-t" text-anchor="middle">STAGE</text>
  <g class="f-cams">${CAMS.map(([id, x, y]) => '<g class="f-cam" data-cam="' + id + '" transform="translate(' + x + ' ' + y + ')"><circle r="9"/><text y="4" text-anchor="middle" class="v-mono f-cam-t">' + id.slice(1) + '</text></g>').join('')}</g>
  <g class="f-links"></g>
  <g class="f-fixtures">${Object.entries(FIX).map(([id, f]) => '<g class="f-fix" data-fix="' + id + '" style="transform:translate(' + f.x + 'px,' + f.y + 'px)"><rect width="' + f.w + '" height="' + f.h + '" class="f-fix-r"/>' + boxes(f) + '<text class="v-mono f-fix-t" x="' + (f.w / 2) + '" y="' + (f.h + 14) + '" text-anchor="middle">' + id.toUpperCase() + ' · ' + f.cam + '</text></g>').join('')}</g>
  <g class="f-gate"><line x1="280" y1="400" x2="420" y2="400" class="v-gate"/><text x="350" y="416" class="v-mono v-dim" text-anchor="middle">GATE · ENTRANCE</text></g>
  <g class="v-visitor f-visitor" opacity="0" style="transform:translate(350px,395px)"><circle class="v-halo" r="18"/><circle class="v-dot" r="9"/></g>
  <g class="f-clock" transform="translate(620 60)"><text text-anchor="end" class="v-mono f-clock-t" data-clock>DAY 0</text></g>
</svg>`;
  const zonesG = $('.f-zones', stage), linksG = $('.f-links', stage), fixG = $('.f-fixtures', stage), visitorG = $('.f-visitor', stage), clockT = $('[data-clock]', stage);
  const log = $('[data-log]', root);
  function drawZones(list, hot) {
    zonesG.innerHTML = list.map((z) => '<g class="f-zone' + (hot ? ' is-hot' : '') + '"><rect x="' + z.x + '" y="' + z.y + '" width="' + z.w + '" height="' + z.h + '" rx="2"/><text x="' + (z.x + 8) + '" y="' + (z.y + 16) + '" class="v-mono f-zone-t">' + z.name + '</text></g>').join('');
  }
  function placeFixtures(set, opts = {}) {
    Object.entries(set).forEach(([id, f]) => {
      const g = $('[data-fix="' + id + '"]', fixG);
      g.style.transform = 'translate(' + f.x + 'px,' + f.y + 'px)';
      const r = $('.f-fix-r', g); r.setAttribute('width', f.w); r.setAttribute('height', f.h);
      const t = $('.f-fix-t', g); t.setAttribute('x', f.w / 2); t.setAttribute('y', f.h + 14);
      t.textContent = id.toUpperCase() + ' · ' + (opts.hideCam ? '?' : f.cam);
      $$('.f-box', g).forEach((b) => b.remove());
      if (!opts.hideBoxes) r.insertAdjacentHTML('afterend', boxes(f));
      $$('.f-box', g).forEach((b) => b.classList.toggle('is-hot', !!opts.hotBoxes));
      t.classList.toggle('is-hot', !!opts.hotCam);
    });
  }
  function drawLinks(set, on) {
    if (!on) { linksG.innerHTML = ''; return; }
    const leds = [125, 285, 445];
    linksG.innerHTML = Object.values(set).map((f, k) => {
      const cx = f.x + f.w / 2, cy = f.y, lx = leds[k % 3];
      return '<path class="f-link is-hot" d="M' + cx + ' ' + cy + ' C ' + cx + ' 40, ' + lx + ' 60, ' + lx + ' 28"/>';
    }).join('');
  }
  let walk = null;
  function stopWalk() { clearInterval(walk); walk = null; visitorG.setAttribute('opacity', '0'); }
  function draw(i) {
    stopWalk();
    const moved = i >= 1;
    const set = moved ? MOVED : FIX;
    drawZones(moved && i >= 4 ? ZONES_MOVED : ZONES, i === 4);
    placeFixtures(set, { hideBoxes: i === 1, hotBoxes: i === 2, hideCam: i === 1 || i === 2, hotCam: i === 3 });
    $$('.f-cam', stage).forEach((c) => c.classList.toggle('is-hot', i === 3));
    drawLinks(set, i === 5);
    clockT.textContent = ['DAY 0 · MAPPED', 'DAY 1 · 00:00', 'DAY 1 · 02:00', 'DAY 1 · 06:00', 'DAY 1 · 10:00', 'DAY 1 · 16:00', 'DAY 1 · 22:00 · LIVE'][i];
    if (i === 6) {
      visitorG.setAttribute('opacity', '1');
      const path = [[350, 395], [350, 340], [330, 280], [250, 250], [150, 200], [120, 140], [250, 140], [420, 150], [540, 180], [540, 300], [400, 350], [350, 395]];
      let k = 0;
      const stepWalk = () => { k = (k + 1) % path.length; visitorG.style.transform = 'translate(' + path[k][0] + 'px,' + path[k][1] + 'px)'; };
      if (reduced()) visitorG.style.transform = 'translate(250px,250px)'; else walk = setInterval(stepWalk, 900);
    }
    const LOG = [
      ['6 fixtures, 18 product boxes, 4 cameras, 4 zones, 1 gate', 'Every product in exactly one camera'],
      ['Fixtures moved and turned, new SKUs on the floor', 'The digital map no longer matches the store'],
      ['Boxes redrawn fixture by fixture', 'Colour variants share one box; shoes get smaller boxes'],
      ['Each fixture pointed at the camera that sees it best', 'No product counted twice'],
      ['Zones and gates reset around the new layout', 'A new zone where the corner opened up'],
      ['Each box re-pointed to its pop-up on the wall', 'Triggers tested one by one'],
      ['Dashboard live, counts flowing on the new map', 'Done inside the day, the store trading throughout'],
    ];
    log.innerHTML = LOG[i].map((l) => '<li>' + esc(l) + '</li>').join('');
  }
  const steps = [
    { name: 'Mapped.', text: 'The floor as the platform knows it: fixtures with their product boxes, the camera that watches each one, the zones, the gate. The map is what every count depends on.' },
    { name: 'The floor moves.', text: 'Merchandising resets the floorset: fixtures swap places, one turns, a corner opens, new products arrive. Overnight the map is wrong everywhere.', hold: 2600 },
    { name: 'Redraw the boxes.', text: 'Fixture by fixture, draw the product boxes again: one box per product group where colours sit together, smaller boxes where shoes stand apart.', hold: 2600 },
    { name: 'Re-point the cameras.', text: 'Assign each fixture to the one camera that sees it best, so a product seen by two cameras is never counted twice.', hold: 2600 },
    { name: 'Reset zones and gates.', text: 'Draw the zones around the new layout, including a new one where the corner opened, and put the gate lines back where people actually enter.', hold: 2600 },
    { name: 'Re-point the triggers.', text: 'Each product box calls a pop-up on a screen. Re-point every trigger, then test them one by one with a hand.', hold: 2600 },
    { name: 'Check it live.', text: 'Walk the floor with the dashboard open: the counts flow onto the new map. The whole re-map fits inside a day, with the store trading throughout.', hold: 4000 },
  ];
  player(root, steps, draw);
}

/* ---------------------------------------------------------------- The clips: click to play, muted, looped */
function clips() {
  $$('.clip', document).forEach((card) => {
    const v = $('video', card), b = $('[data-clip-play]', card);
    if (!v || !b) return;
    const set = (playing) => { card.classList.toggle('is-playing', playing); b.setAttribute('aria-pressed', String(playing)); b.querySelector('span').textContent = playing ? 'Pause' : 'Play'; };
    b.addEventListener('click', () => { if (v.paused) { v.play().then(() => set(true)).catch(() => set(false)); } else { v.pause(); set(false); } });
    v.addEventListener('ended', () => set(false));
    v.addEventListener('pause', () => set(false));
    v.addEventListener('play', () => set(true));
  });
}

visit();
floor();
clips();
