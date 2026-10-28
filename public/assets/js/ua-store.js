// G01 · the store, drawn: an isometric view (and a plan) built from the September 2025 concept
// plan. The entrance and the rug at the front, the court painted on the floor, the core (the
// stage) under the chrome hand, the giant ball, the LED strips high on the walls, the fixtures by
// zone, and the hardware in the ceiling: cameras, RFID antennas, speakers, the LED mesh.
// Four triggers walk a visitor through the store and show what each one does.
// Shapes are illustrative, roughly to scale; hardware positions are not the store's.

import { STORE, FLOOR, ROOMS, CABINETS, DOORS, COURT, CARPET, RUG, CORE, BALL, HAND, ZONES, FIXTURES, CAMS, ANTS, SPKS, LEDS, iso, plan, fmt, pt, poly } from './ua-layout.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const NS = ' vector-effect="non-scaling-stroke"';
const FIGURE = '<g class="fig" transform="translate(-10.5 -40) scale(0.5)"><g transform="rotate(24 21 24)"><line x1="21" y1="24" x2="21" y2="44" stroke="currentColor" stroke-width="6.5" stroke-linecap="round"/></g><g transform="rotate(-22 19 46)"><line x1="19" y1="46" x2="19" y2="74" stroke="currentColor" stroke-width="7" stroke-linecap="round"/><rect x="14" y="72.5" width="14" height="7" rx="3.5" class="fig-shoe"/></g><line x1="21.5" y1="18" x2="19" y2="47" stroke="currentColor" stroke-width="7.5" stroke-linecap="round"/><g transform="rotate(22 19 46)"><line x1="19" y1="46" x2="19" y2="74" stroke="currentColor" stroke-width="7" stroke-linecap="round"/><rect x="14" y="72.5" width="14" height="7" rx="3.5" class="fig-shoe"/></g><g transform="rotate(-24 21 24)"><line x1="21" y1="24" x2="21" y2="44" stroke="currentColor" stroke-width="6.5" stroke-linecap="round"/></g><circle cx="22" cy="9" r="7.5" fill="currentColor"/><rect x="22" y="6.2" width="10" height="3.4" rx="1.2" class="fig-shoe"/></g>';

// pop-up art for the screens, drawn in a 2 by 2 box with y up
const ART = {
  pack: '<path d="M-0.55 0.95 h1.1 a0.25 0.25 0 0 1 0.25 0.25 l0.2 -1.9 a0.3 0.3 0 0 0 -0.3 -0.3 h-1.4 a0.3 0.3 0 0 0 -0.3 0.3 l0.2 1.9 a0.25 0.25 0 0 1 0.25 -0.25 z M-0.35 0.95 q0.35 0.5 0.7 0"/>',
  shirt: '<path d="M-0.9 0.55 l0.55 0.35 q0.35 -0.3 0.7 0 l0.55 -0.35 l0.4 -0.45 l-0.45 -0.3 v-0.85 h-1.7 v0.85 l-0.45 0.3 z"/>',
  run: '<path d="M-0.95 -0.5 h1.9 M-0.75 -0.15 h1.5 M-0.55 0.2 h1.1 M0.1 0.55 l0.45 0.35 l-0.45 0.35" fill="none" stroke-width="0.14" stroke-linecap="round" stroke-linejoin="round"/>',
  check: '<path d="M-0.7 0 l0.45 0.45 l0.95 -0.95" fill="none" stroke-width="0.16" stroke-linecap="round" stroke-linejoin="round"/>',
};
// where the zone names sit in the isometric view: side zones as signs on the walls, centre zones on the floor
const ZL = { train: [[3.4, 0], -8, -3, 'end'], curry: [[11.2, 0], -8, -3, 'end'], women: [[4.7, STORE.W], 8, 4, 'start'], run: [[11.2, STORE.W], 8, 4, 'start'], promo2: [[3.2, 9.5], 0, 4, 'middle'], cny: [[12.3, 5.2], 0, 4, 'start'] };

function wallMatrix(P, wall) {
  const [u0, v0, du, dv] = { left: [0, 0, 1, 0], back: [0, 0, 0, 1], right: [0, STORE.W, 1, 0], annex: [STORE.annex.u, 0, 0, 1] }[wall];
  const o = P(u0, v0, 0), ex = P(u0 + du, v0 + dv, 0), ez = P(u0, v0, 1);
  return 'matrix(' + [ex[0] - o[0], ex[1] - o[1], ez[0] - o[0], ez[1] - o[1], o[0], o[1]].map(fmt).join(' ') + ')';
}
function box(P, u, v, du, dv, h, cls, extra = '', z0 = 0) {
  let s = '<g class="box ' + cls + '"' + extra + '>';
  if (P.kind === 'iso') {
    s += poly(P, [[u + du, v, z0], [u + du, v + dv, z0], [u + du, v + dv, z0 + h], [u + du, v, z0 + h]], 'f-front');
    s += poly(P, [[u, v + dv, z0], [u + du, v + dv, z0], [u + du, v + dv, z0 + h], [u, v + dv, z0 + h]], 'f-right');
  }
  s += poly(P, [[u, v, z0 + h], [u + du, v, z0 + h], [u + du, v + dv, z0 + h], [u, v + dv, z0 + h]], 'f-top');
  return s + '</g>';
}
const label = (P, u, v, z, text, cls = '', dy = 0, anchor = 'middle', dx = 0) => { const p = P(u, v, z); return '<text class="iso-t ' + cls + '" x="' + fmt(p[0] + dx) + '" y="' + fmt(p[1] + dy) + '" text-anchor="' + anchor + '">' + esc(text) + '</text>'; };

// what sits on a fixture: blocks on tables, shirts on rails, rows of shoes on the footwear walls
function dress(P, f) {
  if (P.kind !== 'iso') return '';
  let s = '';
  if (f.kind === 'shelf') {
    for (let r = 0; r < 3; r++) for (let k = 0; k < Math.floor(f.du / 0.9); k++) {
      const p = P(f.u + 0.55 + k * 0.9, f.v + f.dv, 0.45 + r * 0.6);
      s += '<ellipse class="shoe" cx="' + fmt(p[0]) + '" cy="' + fmt(p[1]) + '" rx="4.5" ry="2.2"/>';
    }
  } else if (f.kind === 'rail') {
    for (let k = 0; k < Math.floor(f.du / 0.5); k++) {
      const p = P(f.u + 0.4 + k * 0.5, f.v + f.dv, f.h - 0.15);
      s += '<path class="shirt-h" d="M' + fmt(p[0] - 3) + ' ' + fmt(p[1]) + ' l3 -2 l3 2 l1 4 l-1 0 v8 h-6 v-8 l-1 0 z"/>';
    }
  } else {
    const along = f.du > f.dv, n = along ? 3 : 2;
    for (let k = 0; k < n; k++) {
      const u = along ? f.u + 0.25 + (k * (f.du - 0.5)) / n : f.u + 0.25, v = along ? f.v + 0.25 : f.v + 0.25 + (k * (f.dv - 0.5)) / n;
      const du = along ? (f.du - 0.5) / n - 0.2 : f.du - 0.5, dv = along ? f.dv - 0.5 : (f.dv - 0.5) / n - 0.2;
      s += box(P, u, v, du, dv, 0.22, 'prod ' + (f.g[k] || 'g1'), '', f.h);
    }
  }
  return s;
}

function ledPanel(P, L) {
  const w = L.b - L.a, h = L.z1 - L.z0;
  if (P.kind === 'plan') {
    const off = L.wall === 'left' ? 0.3 : L.wall === 'right' ? -0.3 : 0.3;
    const p0 = L.wall === 'back' ? P(off, L.a) : P(L.a, (L.wall === 'left' ? 0 : STORE.W) + off);
    const p1 = L.wall === 'back' ? P(off, L.b) : P(L.b, (L.wall === 'left' ? 0 : STORE.W) + off);
    const mid = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
    const lab = L.wall === 'back' ? '<text class="iso-t led-t" x="' + fmt(mid[0]) + '" y="' + fmt(mid[1] - 13) + '" text-anchor="middle">' + esc(L.name) + '</text>'
      : '<text class="iso-t led-t" transform="translate(' + fmt(mid[0] + (L.wall === 'left' ? -16 : 16)) + ' ' + fmt(mid[1]) + ') rotate(' + (L.wall === 'left' ? -90 : 90) + ')" text-anchor="middle">' + esc(L.name) + '</text>';
    return '<g class="led led-plan" data-led="' + L.id + '"><line class="led-line" x1="' + fmt(p0[0]) + '" y1="' + fmt(p0[1]) + '" x2="' + fmt(p1[0]) + '" y2="' + fmt(p1[1]) + '"/>' + lab + '</g>';
  }
  const id = L.id;
  const bands = [0, 1, 2].map((i) => '<rect class="led-band" x="' + fmt(L.a - w / 3 + (i * w) / 3) + '" y="' + L.z0 + '" width="' + fmt(w / 3) + '" height="' + h + '">' +
    (reduced() ? '' : '<animate attributeName="x" values="' + fmt(L.a - w / 3) + ';' + fmt(L.b) + '" dur="' + (26 + i * 4) + 's" begin="' + (-i * 9) + 's" repeatCount="indefinite"/>') + '</rect>').join('');
  const s = h * 0.42, cx = L.a + w / 2, cy = L.z0 + h * 0.5;
  // an entry trigger replaces what the screen plays (the whole panel); an engagement overlays a card on it
  const cw = Math.min(w * 0.36, h * 3.2), ca = L.a + w - cw - h * 0.12, cy2 = L.z0 + h * 0.5, so = h * 0.3;
  return '<g class="led led-' + L.wall + '" data-led="' + id + '" data-a="' + L.a + '" data-b="' + L.b + '" data-cw="' + fmt(cw) + '" data-ca="' + fmt(ca) + '" transform="' + wallMatrix(P, L.wall) + '">' +
    '<clipPath id="' + id + '-clip"><rect x="' + L.a + '" y="' + L.z0 + '" width="' + w + '" height="' + h + '"/></clipPath>' +
    '<rect class="led-screen" x="' + L.a + '" y="' + L.z0 + '" width="' + w + '" height="' + h + '"/>' +
    '<g clip-path="url(#' + id + '-clip)">' + bands + '</g>' +
    '<g class="led-popup" clip-path="url(#' + id + '-clip)"><rect class="led-pop-bg" x="' + L.a + '" y="' + L.z0 + '" width="' + w + '" height="' + h + '"/>' +
    '<g class="led-pop-art" transform="translate(' + fmt(cx - w * 0.12) + ' ' + fmt(cy) + ') scale(' + fmt(s) + ')"></g>' +
    '<rect class="led-callout" x="' + fmt(cx + w * 0.02) + '" y="' + fmt(cy + h * 0.08) + '" width="' + fmt(w * 0.16) + '" height="' + fmt(h * 0.07) + '"/>' +
    '<rect class="led-callout" x="' + fmt(cx + w * 0.02) + '" y="' + fmt(cy - h * 0.08) + '" width="' + fmt(w * 0.11) + '" height="' + fmt(h * 0.07) + '"/></g>' +
    '<g class="led-overlay" clip-path="url(#' + id + '-clip)"><rect class="led-card" x="' + fmt(ca) + '" y="' + fmt(L.z0 + h * 0.1) + '" width="' + fmt(cw) + '" height="' + fmt(h * 0.8) + '"/>' +
    '<g class="led-over-art" transform="translate(' + fmt(ca + cw * 0.28) + ' ' + fmt(cy2) + ') scale(' + fmt(so) + ')"></g>' +
    '<rect class="led-callout" x="' + fmt(ca + cw * 0.52) + '" y="' + fmt(cy2 + h * 0.17) + '" width="' + fmt(cw * 0.4) + '" height="' + fmt(h * 0.07) + '"/>' +
    '<rect class="led-callout" x="' + fmt(ca + cw * 0.52) + '" y="' + fmt(cy2 + h * 0.03) + '" width="' + fmt(cw * 0.3) + '" height="' + fmt(h * 0.07) + '"/>' +
    '<rect class="led-callout" x="' + fmt(ca + cw * 0.52) + '" y="' + fmt(cy2 - h * 0.11) + '" width="' + fmt(cw * 0.22) + '" height="' + fmt(h * 0.07) + '"/></g>' +
    '<rect class="led-frame" x="' + L.a + '" y="' + L.z0 + '" width="' + w + '" height="' + h + '"' + NS + '/></g>';
}

// the drawing, as depth-sorted groups; with base set, only the building (for the floor-change map in ua.js)
export function build(P, opts = {}) {
  const items = [];
  const add = (d, s) => items.push({ d, s });
  const isIso = P.kind === 'iso', base = !!opts.base;
  const defs = '<defs><linearGradient id="chrome" gradientUnits="userSpaceOnUse" x1="-26" y1="-6" x2="26" y2="60"><stop offset="0" stop-color="#f4f6f8"/><stop offset="0.3" stop-color="#ffffff"/><stop offset="0.58" stop-color="#9aa3ad"/><stop offset="0.8" stop-color="#d9dee4"/><stop offset="1" stop-color="#8e979f"/></linearGradient></defs>';
  const late = [];
  // the floor, the runway, the court, the carpet, the rug, the rocks under the ball
  let floor = poly(P, FLOOR, 'floor') + poly(P, [[1.7, COURT.runway.v0], [STORE.D, COURT.runway.v0], [STORE.D, COURT.runway.v1], [1.7, COURT.runway.v1]], 'runway');
  floor += '<g class="court" transform="' + P.floor + '" fill="none">' +
    '<circle cx="' + COURT.centre.u + '" cy="' + COURT.centre.v + '" r="' + COURT.centre.r + '"' + NS + '/>' +
    COURT.keys.map((k) => '<rect x="' + k.u + '" y="' + k.v + '" width="' + k.du + '" height="' + k.dv + '"' + NS + '/>').join('') +
    '<path d="M' + (COURT.arcs.u - COURT.arcs.r) + ' 0.9 A' + COURT.arcs.r + ' ' + COURT.arcs.r + ' 0 0 0 ' + (COURT.arcs.u + COURT.arcs.r) + ' 0.9"' + NS + '/>' +
    '<path d="M' + (COURT.arcs.u - COURT.arcs.r) + ' 14.1 A' + COURT.arcs.r + ' ' + COURT.arcs.r + ' 0 0 1 ' + (COURT.arcs.u + COURT.arcs.r) + ' 14.1"' + NS + '/>' +
    '<line x1="1.7" y1="' + COURT.runway.v0 + '" x2="' + STORE.D + '" y2="' + COURT.runway.v0 + '"' + NS + '/><line x1="1.7" y1="' + COURT.runway.v1 + '" x2="' + STORE.D + '" y2="' + COURT.runway.v1 + '"' + NS + '/></g>';
  floor += poly(P, [[CARPET.u, CARPET.v], [CARPET.u + CARPET.du, CARPET.v], [CARPET.u + CARPET.du, CARPET.v + CARPET.dv], [CARPET.u, CARPET.v + CARPET.dv]], 'carpet');
  floor += '<g transform="' + P.floor + '"><image class="rug" href="/assets/img/ua-rug-600.webp" x="' + RUG.u + '" y="' + RUG.v + '" width="' + RUG.du + '" height="' + RUG.dv + '" preserveAspectRatio="xMidYMid slice"/><rect class="rug-edge" x="' + RUG.u + '" y="' + RUG.v + '" width="' + RUG.du + '" height="' + RUG.dv + '" fill="none"' + NS + '/>' +
    '<circle class="rocks" cx="' + BALL.u + '" cy="' + BALL.v + '" r="' + (BALL.r + 0.3) + '"/></g>';
  add(-100, floor);
  // zones as floor tints
  if (!base) add(-90, '<g class="zones">' + ZONES.map((z) => '<g class="zone" data-zone="' + z.id + '">' + poly(P, [[z.u, z.v], [z.u, z.v + z.dv], [z.u + z.du, z.v + z.dv], [z.u + z.du, z.v]], 'zone-r') +
    (isIso ? '' : label(P, z.u, z.v, 0, z.name, 'zone-t', 13, 'start', 5)) + '</g>').join('') + '</g>');
  if (isIso && !base) ZONES.filter((z) => ZL[z.id]).forEach((z) => { const [at, dx, dy, anchor] = ZL[z.id]; late.push(label(P, at[0], at[1], 0, z.name, 'zone-t', dy, anchor, dx)); });
  // walls
  const H = STORE.H, A = STORE.annex;
  if (isIso) {
    add(-80, poly(P, [[0, 0, 0], [0, A.v, 0], [0, A.v, H], [0, 0, H]], 'wall wall-back') + poly(P, [[0, A.v, 0], [A.u, A.v, 0], [A.u, A.v, H], [0, A.v, H]], 'wall wall-side') +
      poly(P, [[A.u, A.v, 0], [A.u, STORE.W, 0], [A.u, STORE.W, H], [A.u, A.v, H]], 'wall wall-back') + poly(P, [[0, 0, 0], [STORE.D, 0, 0], [STORE.D, 0, H], [0, 0, H]], 'wall wall-left') +
      '<g transform="' + wallMatrix(P, 'annex') + '"><rect class="door" x="' + DOORS.security.v0 + '" y="0" width="' + (DOORS.security.v1 - DOORS.security.v0) + '" height="2.1"' + NS + '/></g>' +
      label(P, A.u, (DOORS.security.v0 + DOORS.security.v1) / 2, 2.1, 'SECURITY DOOR', 'wall-t', -6));
    // the shopfront and the right wall as glass: outlines only, with the entrance gap
    add(97, '<path class="glass" d="M' + pt(P, STORE.D, 0) + ' L' + pt(P, STORE.D, DOORS.entrance.v0) + ' M' + pt(P, STORE.D, DOORS.entrance.v1) + ' L' + pt(P, STORE.D, STORE.W) + ' L' + pt(P, 0, STORE.W) + '"/>' +
      '<path class="glass glass-up" d="M' + pt(P, STORE.D, 0, 0) + ' L' + pt(P, STORE.D, 0, H) + ' L' + pt(P, STORE.D, STORE.W, H) + ' L' + pt(P, STORE.D, STORE.W, 0) + ' M' + pt(P, STORE.D, STORE.W, H) + ' L' + pt(P, 0, STORE.W, H) + '"/>' +
      '<path class="gate" d="M' + pt(P, STORE.D - 0.4, DOORS.entrance.v0) + ' L' + pt(P, STORE.D - 0.4, DOORS.entrance.v1) + '"/>' +
      label(P, STORE.D + 0.9, (DOORS.entrance.v0 + DOORS.entrance.v1) / 2, 0, 'ENTRANCE', 'wall-t', 12));
  } else {
    add(-80, '<path class="wall-line" d="M' + pt(P, STORE.D, 0) + ' L' + pt(P, 0, 0) + ' L' + pt(P, 0, A.v) + ' L' + pt(P, A.u, A.v) + ' L' + pt(P, A.u, DOORS.security.v0) + ' M' + pt(P, A.u, DOORS.security.v1) + ' L' + pt(P, A.u, STORE.W) + ' L' + pt(P, STORE.D, STORE.W) + ' L' + pt(P, STORE.D, DOORS.entrance.v1) + ' M' + pt(P, STORE.D, DOORS.entrance.v0) + ' L' + pt(P, STORE.D, 0) + '"/>' +
      '<path class="gate" d="M' + pt(P, STORE.D - 0.4, DOORS.entrance.v0) + ' L' + pt(P, STORE.D - 0.4, DOORS.entrance.v1) + '"/>' +
      label(P, STORE.D + 0.6, (DOORS.entrance.v0 + DOORS.entrance.v1) / 2, 0, 'ENTRANCE', 'wall-t', 4) + label(P, A.u - 0.3, (DOORS.security.v0 + DOORS.security.v1) / 2, 0, 'SECURITY DOOR', 'wall-t', -2));
  }
  // screens
  LEDS.forEach((L) => add(L.wall === 'right' && isIso ? 96 : -70, ledPanel(P, L)));
  // rooms, cabinets, the core, the fixtures
  ROOMS.forEach((r) => add(r.u + r.v, box(P, r.u, r.v, r.du, r.dv, r.h, 'room') + label(P, r.u + r.du / 2, r.v + r.dv / 2, r.h, r.name, 'room-t', 3)));
  CABINETS.forEach((c) => add(c.u + c.v, box(P, c.u, c.v, c.du, c.dv, c.h, 'cabinet')));
  add(CORE.u + CORE.v, box(P, CORE.u, CORE.v, CORE.du, CORE.dv, CORE.h, 'core') + label(P, CORE.u + CORE.du / 2, CORE.v + CORE.dv / 2, CORE.h, 'THE CORE', 'core-t', 3));
  if (!base) Object.entries(FIXTURES).forEach(([id, f]) => {
    if (f.name) late.push(isIso ? (f.v < STORE.W / 2 ? label(P, f.u + f.du * 0.8, 0, STORE.H - 0.1, f.name, 'fix-t', 2) : label(P, f.u + f.du, f.v, 0, f.name, 'fix-t', 10, 'start', 4)) : label(P, f.u + f.du / 2, f.v + f.dv / 2, f.h, f.name, 'fix-t', 3));
    add(f.u + f.v, '<g class="fixture" data-fix="' + id + '">' + box(P, f.u, f.v, f.du, f.dv, f.h, 'fix ' + f.kind) + dress(P, f) + '</g>');
  });
  // the products the triggers use: the backpack on the accessories table, the shirt region on the men's rail
  const f16 = FIXTURES.f16, f4 = FIXTURES.f4;
  const pk = P(f16.u + 0.5, f16.v + 0.9, f16.h);
  if (!base) add(f16.u + f16.v + 0.01, '<g class="product pack" data-product="pack" style="transform:translate(' + fmt(pk[0]) + 'px,' + fmt(pk[1]) + 'px)"><g class="lift"><path class="pack-body" d="M-5 -14 h10 l1.5 13 h-13 z"/><path class="puck" d="M-2 -7 h4 v3 h-4 z"/><path class="strap" d="M-3 -14 q3 -4 6 0" fill="none"/></g></g>' +
    '');
  if (!base) late.push(label(P, f16.u + 0.5, f16.v + 0.9, f16.h, 'NO WEIGH PACK', 'prod-t', isIso ? -22 : 16));
  const sh = P(f4.u + 1.4, f4.v + f4.dv, f4.h - 0.1);
  if (!base) add(f4.u + f4.v + 0.02, poly(P, [[f4.u + 0.9, f4.v - 0.3], [f4.u + 0.9, f4.v + f4.dv + 0.5], [f4.u + 1.9, f4.v + f4.dv + 0.5], [f4.u + 1.9, f4.v - 0.3]], 'region', ' data-region="men"') +
    '<g class="product shirt" data-product="shirt" style="transform:translate(' + fmt(sh[0]) + 'px,' + fmt(sh[1]) + 'px)"><g class="lift"><path d="M-6 -12 l4 -3 q2 2 4 0 l4 3 l2 4 l-3 1.5 v9 h-10 v-9 l-3 -1.5 z"/></g></g>' +
    '');
  if (!base) late.push(isIso ? label(P, f4.u + 1.4, f4.v + f4.dv, f4.h, 'SKU-MAPPED REGION', 'prod-t', -22) : label(P, f4.u + 1.4, f4.v + f4.dv + 0.3, 0, 'SKU REGION', 'prod-t', 4, 'start'));
  // the ball and the hand
  const b = P(BALL.u, BALL.v, isIso ? BALL.r : 0), br = BALL.r * (isIso ? 23 : P.S);
  add(BALL.u + BALL.v, '<g class="ball" transform="translate(' + fmt(b[0]) + ' ' + fmt(b[1]) + ')"><circle r="' + fmt(br) + '"/><path d="M' + fmt(-br) + ' 0 q' + fmt(br) + ' ' + fmt(-br * 0.5) + ' ' + fmt(2 * br) + ' 0 M' + fmt(-br) + ' 0 q' + fmt(br) + ' ' + fmt(br * 0.5) + ' ' + fmt(2 * br) + ' 0 M0 ' + fmt(-br) + ' q' + fmt(-br * 0.5) + ' ' + fmt(br) + ' 0 ' + fmt(2 * br) + ' M0 ' + fmt(-br) + ' q' + fmt(br * 0.5) + ' ' + fmt(br) + ' 0 ' + fmt(2 * br) + '" fill="none"/></g>' +
    '');
  late.push(label(P, BALL.u + BALL.r + 0.3, BALL.v, 0, 'THE BALL', 'prod-t', 12));
  if (isIso) {
    const hw = P(HAND.u, HAND.v, HAND.top);
    const digits = 'M0 -6 L0 12 M-9 15 L-22 27 M-8 31 L-15 50 M-3 33 L-5 56 M3 33 L5 56 M8 31 L15 50';
    add(100, '<g class="hand" transform="translate(' + fmt(hw[0]) + ' ' + fmt(hw[1]) + ')"><path class="hand-out" d="' + digits + '"/><path class="hand-palm" d="M-11 14 q0 -8 11 -8 q11 0 11 8 l-2 18 q-9 6 -18 0 z"/><path class="hand-in" d="' + digits + '"/><path class="hand-palm" d="M-11 14 q0 -8 11 -8 q11 0 11 8 l-2 18 q-9 6 -18 0 z"/></g>');
    late.push(label(P, HAND.u, HAND.v, HAND.top, 'THE HAND', 'prod-t', 22, 'end', -26));
  } else if (!base) {
    const hp = P(HAND.u, HAND.v, 0);
    add(100, '<g class="hand hand-plan" transform="translate(' + fmt(hp[0]) + ' ' + fmt(hp[1]) + ')"><circle r="' + fmt(0.6 * P.S) + '"/><path d="M-6 -14 l-4 -12 M0 -15 v-14 M6 -14 l4 -12 M12 -8 l9 -7" fill="none"/></g>');
    late.push(label(P, HAND.u, HAND.v + 0.9, 0, 'HAND · OVERHEAD', 'prod-t', 4, 'start'));
  }
  // the ceiling: the LED mesh, then the hardware
  if (isIso && !base) {
    let mesh = '<g class="mesh">';
    for (let u = 0.75; u < STORE.D; u += 1.5) for (let v = 0.75; v < STORE.W; v += 1.5) {
      const p = P(u, v, STORE.H);
      mesh += '<circle cx="' + fmt(p[0]) + '" cy="' + fmt(p[1]) + '" r="1.3" style="animation-delay:' + fmt((u * 7 + v * 13) % 6) + 's"/>';
    }
    add(101, mesh + '</g>');
  }
  const zc = isIso ? STORE.H - 0.1 : 0;
  if (!base) add(102, '<g class="layer cams">' + CAMS.map((c) => { const p = P(c.u, c.v, zc), foot = P(c.u, c.v, 0); return '<g class="cam" data-cam="' + c.id + '" transform="translate(' + fmt(p[0]) + ' ' + fmt(p[1]) + ')">' + (isIso ? '<path class="cam-cone" d="M0 0 L-18 ' + fmt(foot[1] - p[1]) + ' L18 ' + fmt(foot[1] - p[1]) + ' Z"/><line class="drop" x1="0" y1="0" x2="0" y2="' + fmt(foot[1] - p[1]) + '"/>' : '<circle class="cam-cone" r="' + fmt(2.6 * P.S) + '"/>') + '<circle class="cam-body" r="5.5"/><circle class="cam-lens" r="2.2"/>' + (isIso ? '' : '<text class="iso-t hw-t" y="3.5" text-anchor="middle">' + c.id.slice(1) + '</text>') + '</g>'; }).join('') + '</g>');
  if (!base) add(103, '<g class="layer rfid">' + ANTS.map((a) => { const p = P(a.u, a.v, isIso ? STORE.H - 0.4 : 0); return '<g class="ant" data-ant="' + a.id + '" transform="translate(' + fmt(p[0]) + ' ' + fmt(p[1]) + ')">' + (isIso ? '<line class="drop" x1="0" y1="0" x2="0" y2="' + fmt((STORE.H - 0.4) * 22) + '"/>' : '') + '<circle class="ring ring-2" r="20"/><circle class="ring ring-1" r="11"/><rect class="ant-body" x="-6" y="-4" width="12" height="8" rx="1"/></g>'; }).join('') + '</g>');
  if (!base) add(104, '<g class="layer sound">' + SPKS.map((s) => { const p = P(s.u, s.v, isIso ? STORE.H - 0.9 : 0); return '<g class="spk" data-spk="' + s.id + '" transform="translate(' + fmt(p[0]) + ' ' + fmt(p[1]) + ')">' + (isIso ? '<line class="drop" x1="0" y1="0" x2="0" y2="' + fmt((STORE.H - 0.9) * 22) + '"/>' : '') + '<circle class="ring ring-2" r="22"/><circle class="ring ring-1" r="12"/><rect class="spk-body" x="-4.5" y="-5.5" width="9" height="11" rx="1"/><circle class="spk-cone" r="2"/></g>'; }).join('') + '</g>');
  add(105, '<g class="labels">' + late.join('') + '</g>');
  items.sort((a, b2) => a.d - b2.d);
  const v0 = P(STORE.D + 1.3, 7.5);
  const visitor = base ? '' : '<g class="visitor" data-d="' + fmt(STORE.D + 1.3 + 7.5) + '" style="transform:translate(' + fmt(v0[0]) + 'px,' + fmt(v0[1]) + 'px)">' + (isIso ? '<ellipse class="shadow" cy="1" rx="8" ry="3.5"/>' + FIGURE : '<circle class="halo" r="16"/><circle class="dot" r="7"/>') + '</g>';
  return defs + '<g class="scene">' + items.map((it) => '<g data-d="' + fmt(it.d) + '">' + it.s + '</g>').join('') + visitor + '</g>';
}

function store() {
  const root = $('#store3d');
  if (!root) return;
  const stage = $('[data-stage]', root);
  const note = $('[data-note]', root), log = $('[data-log]', root), live = $('[data-live]', root);
  const VIEWS = { iso: iso(21, 22, 408, 104), plan: plan(22, 275, 92) };
  let P = VIEWS.iso, view = 'iso', run = 0, timers = [];
  const TITLE = 'The store drawn in isometric: the entrance at the front with the gate line, the court painted on the floor, the green carpet with the rug just inside the entrance, the core (the stage) at the centre, the chrome hand hanging over the giant basketball at the front left, LED strips high on the left, back and right walls, fixtures by zone, the IT room at the back and the storage annex with the security door, and in the ceiling the cameras, RFID antennas, speakers and the LED mesh.';
  function render() {
    stage.innerHTML = '<svg viewBox="80 4 720 436" class="iso-svg is-' + view + '" role="img" aria-labelledby="store3d-svg-t"><title id="store3d-svg-t">' + esc(view === 'iso' ? TITLE : TITLE.replace('drawn in isometric', 'as a plan')) + '</title>' + build(P) + '</svg>';
  }
  const visitor = () => $('.visitor', stage);
  const wait = (ms) => new Promise((r) => timers.push(setTimeout(r, reduced() ? Math.min(ms, 60) : ms)));
  function moveTo(u, v) {
    const g = visitor(), p = P(u, v);
    g.style.transform = 'translate(' + fmt(p[0]) + 'px,' + fmt(p[1]) + 'px)';
    const d = u + v;
    const next = $$('.scene > g[data-d]', stage).find((el) => el !== g && Number(el.dataset.d) > d);
    g.dataset.d = fmt(d);
    if (next) g.parentNode.insertBefore(g, next); else g.parentNode.appendChild(g);
  }
  const hot = (sel, on = true) => $$(sel, stage).forEach((e) => e.classList.toggle('is-hot', on));
  // overlay: a product's details and stock on top of what the screen plays; replace: the zone's own content takes the screen
  // `at` slides the overlay card along the wall to sit above the product that called it (metres along the wall)
  const popup = (id, art, mode = 'overlay', at) => {
    const g = $('[data-led="' + id + '"]', stage); if (!g) return;
    const a = $(mode === 'overlay' ? '.led-over-art' : '.led-pop-art', g); if (a) a.innerHTML = ART[art] || '';
    const over = $('.led-overlay', g);
    if (over && g.dataset.cw) {
      const cw = Number(g.dataset.cw), lo = Number(g.dataset.a), hi = Number(g.dataset.b) - cw, ca = Number(g.dataset.ca);
      const x = at == null ? ca : Math.max(lo, Math.min(hi, at - cw / 2));
      over.setAttribute('transform', 'translate(' + fmt(x - ca) + ' 0)');
    }
    g.classList.add('is-lit', mode === 'overlay' ? 'is-overlay' : 'is-replace');
  };
  const clear = () => { $$('.is-hot, .is-lit, .is-lifted', stage).forEach((e) => e.classList.remove('is-hot', 'is-lit', 'is-lifted', 'is-overlay', 'is-replace')); stage.classList.remove('is-check'); };
  let current = null;
  const say = (lines) => { log.innerHTML = lines.map((l) => '<li>' + esc(l) + '</li>').join(''); live.textContent = (current ? current.name + ' ' : '') + lines.join('. ') + '.'; };
  const HOME = [STORE.D + 1.3, 7.5];
  // each trigger: a name, a note, and steps [ms to wait after, fn]; 'peak' marks the state held under reduced motion
  const TRIGGERS = {
    pack: {
      name: 'Shake the backpack.',
      text: 'An engagement, read by RFID. The No Weigh backpack on the accessories table carries a puck; a light shake of it is the trigger, read by the antenna above. The pack’s details and stock overlay the content already playing on the right wall, and the nearest speaker answers. A shoe on the footwear wall works the same way.',
      steps: [
        [900, () => { say(['Walking in: accessories, right of the entrance']); moveTo(13.9, 9.3); }],
        [900, () => moveTo(14.6, 11.2)],
        [400, () => { $('[data-product="pack"]', stage).classList.add('is-lifted'); hot('[data-ant="A1"]'); say(['RFID: the puck moved in the antenna’s field', 'Engagement: the pack’s details and stock overlay the right wall', 'Speaker by the entrance answers']); }],
        [4200, () => { popup('led-r', 'pack', 'overlay', 13.4); hot('[data-spk="S5"]'); hot('[data-cam="C7"]'); }, 'peak'],
        [900, () => { $('[data-product="pack"]', stage).classList.remove('is-lifted'); say(['Pack back on the table', 'Overlay fades; the mood content never stopped']); }],
        [0, clear],
      ],
    },
    shirt: {
      name: 'Reach for the shirt.',
      text: 'An engagement, read by the camera. A shirt or a bra hanging on a rail carries no puck, so the AI camera above does the work: it knows which region of the rail each product hangs in (region mapped, so SKU mapped), reads the dwell, then the reach. The shirt’s details and stock overlay the content already playing on the left wall.',
      steps: [
        [900, () => { say(['Walking the runway, round the core, to the men’s rail']); moveTo(13.2, 7.5); }],
        [900, () => moveTo(12.2, 4.7)],
        [1000, () => moveTo(8.2, 4.7)],
        [900, () => moveTo(5.4, 4.8)],
        [700, () => moveTo(3.9, 4.9)],
        [900, () => { hot('[data-cam="C1"]'); say(['Camera: dwelling at region 3 of the men’s rail', 'Region 3 is mapped to one SKU']); }],
        [400, () => { hot('[data-region="men"]'); say(['Camera: dwell, then a reach into region 3', 'Engagement: the shirt’s details and stock overlay the left wall']); }],
        [4200, () => { $('[data-product="shirt"]', stage).classList.add('is-lifted'); popup('led-l', 'shirt', 'overlay', 3.9); hot('[data-spk="S1"]'); }, 'peak'],
        [900, () => { $('[data-product="shirt"]', stage).classList.remove('is-lifted'); say(['Shirt back on the rail', 'Overlay fades; the mood content never stopped']); }],
        [0, clear],
      ],
    },
    zone: {
      name: 'Walk into running.',
      text: 'An entry trigger, a world of its own: the cameras see a person cross into the zone, nothing touched. Content exclusive to that trigger wakes up on the right wall, replacing the mood content playing there (a running-shoe playlist, say) or layering over it, and the zone’s speakers shift with it.',
      steps: [
        [900, () => { say(['Walking in, turning right']); moveTo(13.6, 9.3); }],
        [900, () => moveTo(12.3, 10.9)],
        [700, () => moveTo(10.2, 10.9)],
        [400, () => { hot('[data-zone="run"]'); hot('[data-cam="C6"]'); say(['Zone entry: running +1 (a dot, not a face)', 'Entry trigger: the zone’s own content replaces the mood content on the right wall', 'Two speakers: the zone’s soundscape']); }],
        [4200, () => { popup('led-r', 'run', 'replace'); hot('[data-spk="S5"]'); hot('[data-spk="S6"]'); }, 'peak'],
        [900, () => { say(['Leaving the zone: running −1', 'After the cooldown the mood content is back']); moveTo(12.3, 9.6); }],
        [0, clear],
      ],
    },
    check: {
      name: 'Systems check.',
      text: 'The routine before the doors open: every camera blinks in turn, every antenna reads a test tag, the speakers run round the ring, and the three screens show the check pattern. Then the mesh in the ceiling comes up and the store is awake.',
      steps: [
        [250, () => say(['Cameras, one by one'])],
        ...CAMS.map((c, i) => [220, () => $$('.cam', stage).forEach((e, k) => e.classList.toggle('is-hot', k <= i))]),
        [250, () => { hot('.cam', false); say(['Cameras OK', 'Antennas: a test tag under each']); }],
        ...ANTS.map((a, i) => [220, () => $$('.ant', stage).forEach((e, k) => e.classList.toggle('is-hot', k <= i))]),
        [250, () => { hot('.ant', false); say(['Cameras OK', 'Antennas OK', 'Speakers round the ring']); }],
        ...SPKS.map((s, i) => [200, () => $$('.spk', stage).forEach((e, k) => e.classList.toggle('is-hot', k === i || k === i - 1))]),
        [300, () => { hot('.spk', false); say(['Cameras OK', 'Antennas OK', 'Speakers OK', 'Screens: check pattern, then the mesh']); }],
        [3200, () => { ['led-l', 'led-b', 'led-r'].forEach((id) => popup(id, 'check', 'replace')); stage.classList.add('is-check'); hot('.cam'); hot('.ant'); hot('.spk'); }, 'peak'],
        [0, () => { clear(); say(['All systems answered. Doors open.']); }],
      ],
    },
  };
  async function fire(key) {
    const my = ++run;
    timers.forEach(clearTimeout); timers = [];
    clear();
    $$('[data-trigger]', root).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.trigger === key)));
    const t = TRIGGERS[key];
    current = t;
    note.innerHTML = '<b>' + esc(t.name) + '</b> ' + esc(t.text);
    live.textContent = t.name + ' ' + t.text;
    moveTo(...HOME);
    await wait(80);
    for (const [ms, fn, mark] of t.steps) {
      if (my !== run) return;
      fn();
      if (mark === 'peak' && reduced()) return;
      await wait(ms);
    }
    if (my !== run) return;
    moveTo(...HOME);
    $$('[data-trigger]', root).forEach((b) => b.setAttribute('aria-pressed', 'false'));
  }
  function idle() {
    current = null;
    note.innerHTML = '<b>The store, drawn.</b> The entrance and the rug at the front, the court on the floor, the core under the chrome hand, the giant ball, the screens high on the walls, the fixtures by zone, and the hardware in the ceiling. Pick a trigger: two engagements (a puck shaken in a backpack, a reach read by the camera) that overlay a product on the content playing, and a zone entry that wakes up the zone’s own content.';
    say(['Nothing running. The screens play their ambient content.']);
  }
  function applyLayers() { $$('[data-layer]', root).forEach((c) => stage.classList.toggle('hide-' + c.dataset.layer, !c.checked)); }
  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || !root.contains(b)) return;
    if (b.dataset.trigger) fire(b.dataset.trigger);
    else if (b.dataset.view && b.dataset.view !== view) {
      run += 1; timers.forEach(clearTimeout); timers = [];
      view = b.dataset.view; P = VIEWS[view];
      $$('[data-view]', root).forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.view === view)));
      render(); applyLayers(); idle();
      $$('[data-trigger]', root).forEach((x) => x.setAttribute('aria-pressed', 'false'));
    }
  });
  root.addEventListener('change', (e) => { if (e.target.closest('[data-layer]')) applyLayers(); });
  render(); applyLayers(); idle();
}

store();
