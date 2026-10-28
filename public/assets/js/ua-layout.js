// G01 · the store's layout, drawn from the September 2025 concept plan, shared by the figures on
// the page: the isometric store (ua-store.js) and the floor-change map (ua.js).
// Everything is in metres. u runs from the back wall (0) to the shopfront (15), v from the left
// wall (0) to the right wall (15); z is height. The annex at the back right (storage and the
// security door) sits at u < 0. Fixture and hardware positions are illustrative, not store data.

export const STORE = { D: 15, W: 15, H: 4, annex: { u: -3, v: 10 } };

// the floor as one polygon (main floor plus the annex), the rooms, the cabinets on the side walls
export const FLOOR = [[0, 0], [0, 10], [-3, 10], [-3, 15], [15, 15], [15, 0]];
export const ROOMS = [
  { id: 'it', name: 'IT / STORAGE', u: 0, v: 4.9, du: 1.7, dv: 5.2, h: 2.4 },
  { id: 'st2', name: 'STORAGE 2', u: -3, v: 12.6, du: 3, dv: 2.4, h: 2.4 },
];
export const CABINETS = [
  { u: 6.4, v: 0, du: 2.2, dv: 0.35, h: 2.2 },
  { u: 6.4, v: 14.65, du: 2.2, dv: 0.35, h: 2.2 },
];
export const DOORS = { entrance: { v0: 6.2, v1: 8.8 }, security: { v0: 10.6, v1: 11.6 } };

// the court painted on the floor: the runway from the entrance to the core, the centre circle,
// the keys and the three-point arcs toward the side walls
export const COURT = { runway: { v0: 4.6, v1: 10.4 }, centre: { u: 6.45, v: 7.5, r: 3.6 }, keys: [{ u: 5.1, v: 0, du: 4.8, dv: 3.4 }, { u: 5.1, v: 11.6, du: 4.8, dv: 3.4 }], arcs: { r: 5.3, u: 7.5 } };
export const CARPET = { u: 8.7, v: 5.3, du: 3.5, dv: 4.4 };
export const RUG = { u: 9.65, v: 6.45, du: 1.6, dv: 2.1 };
export const CORE = { u: 4.8, v: 4.9, du: 3.3, dv: 5.2, h: 0.35 };
export const BALL = { u: 12.2, v: 2.0, r: 1.15 };
export const HAND = { u: 11.6, v: 2.7, top: 4 };

// zones: the concept's names first, the plain words after
export const ZONES = [
  { id: 'train', name: 'TRAIN / LIVE', plain: "men's training", u: 1.6, v: 0.4, du: 6.2, dv: 4.1 },
  { id: 'curry', name: 'CURRY', plain: 'basketball', u: 8.1, v: 0.4, du: 6.3, dv: 4.1 },
  { id: 'promo2', name: 'PROMO 2', plain: 'the drop behind the core', u: 1.9, v: 5, du: 2.6, dv: 5 },
  { id: 'core', name: 'THE CORE', plain: 'the stage', u: 4.6, v: 4.7, du: 3.7, dv: 5.6 },
  { id: 'cny', name: 'PROMO CNY', plain: 'the green and the rug', u: 8.5, v: 5, du: 3.9, dv: 5 },
  { id: 'entry', name: 'ENTRY', plain: 'the gate', u: 12.6, v: 5, du: 2.3, dv: 5 },
  { id: 'women', name: "WOMEN'S", plain: 'training', u: 1.6, v: 10.5, du: 6.2, dv: 4.1 },
  { id: 'run', name: 'RUNNING', plain: 'and accessories', u: 8.1, v: 10.5, du: 6.3, dv: 4.1 },
];

// fixtures: kind, footprint, height, the camera that counts them, and product groups (g1..g4) for
// the product boxes drawn on the map. cam numbers are illustrative.
export const FIXTURES = {
  f1: { kind: 'shelf', name: 'FW WALL', u: 1.6, v: 0.1, du: 6.2, dv: 0.6, h: 2, cam: 'C1', g: ['g1', 'g1', 'g2'] },
  f2: { kind: 'table', u: 2.3, v: 1.6, du: 2.2, dv: 1.3, h: 0.9, cam: 'C1', g: ['g2', 'g2', 'g1'] },
  f3: { kind: 'table', u: 5.3, v: 1.6, du: 2.2, dv: 1.3, h: 0.9, cam: 'C1', g: ['g1', 'g3', 'g3'] },
  f4: { kind: 'rail', u: 2.6, v: 3.6, du: 2.6, dv: 0.6, h: 1.5, cam: 'C1', g: ['g2', 'g2', 'g2'] },
  f5: { kind: 'table', u: 8.8, v: 1.8, du: 2.2, dv: 1.3, h: 0.9, cam: 'C2', g: ['g3', 'g3', 'g1'] },
  f6: { kind: 'bench', u: 8.9, v: 3.7, du: 2.4, dv: 0.8, h: 0.6, cam: 'C2', g: ['g3', 'g1', 'g1'] },
  f7: { kind: 'table', u: 2.4, v: 6.3, du: 1.4, dv: 2.6, h: 0.9, cam: 'C3', g: ['g4', 'g4', 'g1'] },
  f8: { kind: 'low', u: 9.3, v: 5.5, du: 2.4, dv: 0.8, h: 0.5, cam: 'C4', g: ['g4', 'g4', 'g4'] },
  f9: { kind: 'low', u: 9.3, v: 8.9, du: 2.4, dv: 0.8, h: 0.5, cam: 'C4', g: ['g4', 'g1', 'g4'] },
  f10: { kind: 'rail', u: 2.6, v: 10.9, du: 2.6, dv: 0.6, h: 1.5, cam: 'C5', g: ['g2', 'g1', 'g1'] },
  f11: { kind: 'table', u: 2.3, v: 12.3, du: 2.2, dv: 1.3, h: 0.9, cam: 'C5', g: ['g1', 'g2', 'g2'] },
  f12: { kind: 'table', u: 5.3, v: 12.3, du: 2.2, dv: 1.3, h: 0.9, cam: 'C5', g: ['g2', 'g2', 'g3'] },
  f13: { kind: 'shelf', name: 'FW WALL', u: 8.1, v: 14.3, du: 5.6, dv: 0.6, h: 2, cam: 'C6', g: ['g1', 'g3', 'g1'] },
  f14: { kind: 'table', u: 8.6, v: 11.3, du: 2.2, dv: 1.3, h: 0.9, cam: 'C6', g: ['g3', 'g3', 'g3'] },
  f15: { kind: 'table', u: 11.4, v: 11.3, du: 2.2, dv: 1.3, h: 0.9, cam: 'C6', g: ['g3', 'g1', 'g3'] },
  f16: { kind: 'table', u: 12.9, v: 10.6, du: 1.3, dv: 1.8, h: 0.9, cam: 'C7', g: ['g4', 'g2', 'g4'] },
};

// after merchandising resets the floor: two tables swap zones, one turns, the carpet tables part,
// the accessories table crosses the entrance, and the product groups change
export const MOVED = {
  f1: { ...FIXTURES.f1, g: ['g1', 'g1', 'g1'] },
  f2: { ...FIXTURES.f2, g: ['g2', 'g1', 'g1'] },
  f3: { ...FIXTURES.f5, g: ['g1', 'g1', 'g3'] },
  f4: { ...FIXTURES.f4, g: ['g2', 'g3', 'g3'] },
  f5: { ...FIXTURES.f3, g: ['g3', 'g3', 'g2'] },
  f6: { ...FIXTURES.f6, u: 11.6, v: 3.5, du: 0.8, dv: 1.0, g: ['g3', 'g3', 'g1'] },
  f7: { ...FIXTURES.f7, g: ['g4', 'g1', 'g1'] },
  f8: { ...FIXTURES.f8, v: 5.4, g: ['g4', 'g4', 'g2'] },
  f9: { ...FIXTURES.f9, v: 9.1, g: ['g2', 'g4', 'g4'] },
  f10: { ...FIXTURES.f10, g: ['g1', 'g1', 'g2'] },
  f11: { ...FIXTURES.f11, g: ['g2', 'g2', 'g1'] },
  f12: { ...FIXTURES.f12, u: 5, v: 12.8, du: 1.3, dv: 2.2, g: ['g3', 'g2', 'g2'] },
  f13: { ...FIXTURES.f13, g: ['g3', 'g1', 'g1'] },
  f14: { ...FIXTURES.f14, g: ['g3', 'g3', 'g1'] },
  f15: { ...FIXTURES.f15, u: 8.6, v: 12.9, g: ['g1', 'g3', 'g3'] },
  f16: { ...FIXTURES.f16, u: 13.3, v: 3.4, du: 1.2, dv: 1.1, cam: 'C2', g: ['g4', 'g4', 'g2'] },
};
export const ZONES_MOVED = ZONES.map((z) => (z.id === 'run' ? { ...z, du: 4.1, plain: 'running only' } : z)).concat([
  { id: 'drop', name: 'DROP', plain: 'the corner that opened', u: 12.4, v: 10.5, du: 2.5, dv: 3.7 },
]);

// hardware in the ceiling, illustrative: cameras over the zones and the gate, RFID antennas over
// the fixtures that carry tags, speakers in a ring
export const CAMS = [
  { id: 'C1', u: 4.9, v: 3.0 }, { id: 'C2', u: 8.3, v: 2.6 }, { id: 'C3', u: 4.3, v: 7.5 }, { id: 'C4', u: 12.4, v: 7.5 },
  { id: 'C5', u: 4.9, v: 12.0 }, { id: 'C6', u: 11.1, v: 13.4 }, { id: 'C7', u: 14.3, v: 9.4 },
];
export const ANTS = [
  { id: 'A1', u: 13.5, v: 11.5 }, { id: 'A2', u: 3.9, v: 3.9 }, { id: 'A3', u: 3.9, v: 11.2 },
  { id: 'A4', u: 9.9, v: 2.5 }, { id: 'A5', u: 9.7, v: 12 }, { id: 'A6', u: 10.5, v: 7.2 },
];
export const SPKS = [
  { id: 'S1', u: 2.2, v: 3.2 }, { id: 'S2', u: 6.2, v: 0.6 }, { id: 'S3', u: 10.6, v: 0.6 }, { id: 'S4', u: 13.6, v: 3.2 },
  { id: 'S5', u: 13.6, v: 11.8 }, { id: 'S6', u: 10.6, v: 14.4 }, { id: 'S7', u: 6.2, v: 14.4 }, { id: 'S8', u: 2.2, v: 11.8 },
];
// the LED screens: a long strip high on each side wall and one over the back
export const LEDS = [
  { id: 'led-l', wall: 'left', a: 1.6, b: 13.2, z0: 2.3, z1: 3.5, name: 'LED · LEFT WALL' },
  { id: 'led-b', wall: 'back', a: 4.6, b: 10.4, z0: 2.55, z1: 3.55, name: 'LED · BACK' },
  { id: 'led-r', wall: 'right', a: 7.2, b: 13.6, z0: 2.3, z1: 3.5, name: 'LED · RIGHT WALL' },
];

// projections: isometric (K px per metre on the floor axes, Z px per metre of height) and plan
export function iso(K, Z, OX, OY) {
  const P = (u, v, z = 0) => [(v - u) * K + OX, ((u + v) * K) / 2 - z * Z + OY];
  P.floor = 'matrix(' + -K + ' ' + K / 2 + ' ' + K + ' ' + K / 2 + ' ' + OX + ' ' + OY + ')';
  P.kind = 'iso';
  return P;
}
export function plan(S, OX, OY) {
  const P = (u, v) => [v * S + OX, u * S + OY];
  P.floor = 'matrix(0 ' + S + ' ' + S + ' 0 ' + OX + ' ' + OY + ')';
  P.kind = 'plan';
  P.S = S;
  return P;
}
export const fmt = (n) => (Math.round(n * 10) / 10).toFixed(1);
export const pt = (P, u, v, z = 0) => P(u, v, z).map(fmt).join(' ');
export const poly = (P, pts, cls, extra = '') => '<path class="' + cls + '" d="M' + pts.map((p) => pt(P, ...p)).join(' L') + ' Z"' + extra + '/>';
