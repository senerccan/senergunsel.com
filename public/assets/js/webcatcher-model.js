// G03 · Web Catcher's rules, the same steps in the same order as webcatcher_model.py in the
// project's repository (github.com/senerccan/project_webcatcher), so both give the same numbers.
// No page code lives here. Every number is illustrative: none of it is Vans data or anyone's sales.

export const LINE = 50; // momentum and fit both need 50 out of 100 to count as high

export const SHOES = [
  { key: 'oldskool', name: 'Old Skool', look: 'Low-top skate shoe with the side stripe, in suede and canvas' },
  { key: 'authentic', name: 'Authentic', look: 'The original low-profile canvas lace-up' },
  { key: 'slipon', name: 'Slip-On', look: 'Laceless canvas, often in checkerboard' }
];

export const TRAITS = [
  { key: 'price', name: 'Price', q: "Would the trend's buyers pay our price?" },
  { key: 'function', name: 'Function', q: 'Is it worn for the same things?' },
  { key: 'shape', name: 'Shape', q: 'Slim or chunky, low or high: the same silhouette?' },
  { key: 'material', name: 'Material', q: 'Suede, leather, canvas or mesh, like the trend?' },
  { key: 'color', name: 'Color', q: 'In the colors the trend sells in?' },
  { key: 'pattern', name: 'Pattern', q: "Stripes, panels and prints like the trend's?" }
];

// How long the trend lasts decides what can reach the shelf before it ends.
// `product` is how much of the product lever lands in time.
export const WINDOWS = {
  short: { name: 'Under 6 months', product: 0.0, note: 'Too short for product work to land. The product lever does nothing here.' },
  medium: { name: '6 to 12 months', product: 0.5, note: "New colors and materials can land in time, a new shoe can't. The product lever works at half strength." },
  long: { name: 'Over a year', product: 1.0, note: 'Long enough to develop the shoe. The product lever works at full strength.' }
};

export const LEVERS = [
  { key: 'product', name: 'Product', note: 'New materials, colors and patterns. Moves Material, Color and Pattern.' },
  { key: 'marketing', name: 'Marketing', note: 'Shows people what the shoe is for. Moves Function.' },
  { key: 'money', name: 'Money', note: 'Sharper prices and deeper stock. Moves Price.' }
];
export const LEVEL_WORDS = ['Pull back', 'Less', 'As usual', 'More', 'All in'];
export const BUZZ_WORDS = ['Disliked', 'Cool', 'Mixed', 'Warm', 'Loved'];
export const SIZE_WORDS = ['Niche', 'Small', 'Mid-size', 'Big', 'Mainstream'];
export const WEIGHTS = { growth: 50, buzz: 30, size: 20 };
export const CALLS = { back: 'Back it', test: 'Test small', hold: 'Hold', pass: 'Pass' };
export const MAX_TRENDS = 8;

// Halves round up (Python's round() would round them to even).
export const roundHalfUp = (x) => Math.floor(x + 0.5);
export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const clone = (x) => JSON.parse(JSON.stringify(x));

function ratings(price, fn, shape, material, color, pattern) {
  return { price, function: fn, shape, material, color, pattern };
}

// The five trends the tool was built with, as they looked in 2024.
export const EXAMPLES = [
  { key: 'samba', name: 'Adidas Samba', look: 'Slim terrace shoe in leather and suede, gum sole',
    growth: 35, buzz: 4, size: 4, window: 'medium',
    ratings: { oldskool: ratings(4, 3, 2, 3, 3, 2), authentic: ratings(4, 3, 4, 1, 3, 1), slipon: ratings(4, 2, 3, 1, 2, 1) } },
  { key: 'af1', name: 'Nike Air Force 1', look: 'Chunky white leather court shoe',
    growth: -40, buzz: 3, size: 5, window: 'medium',
    ratings: { oldskool: ratings(4, 4, 3, 3, 4, 2), authentic: ratings(4, 3, 2, 1, 3, 3), slipon: ratings(4, 3, 2, 1, 3, 2) } },
  { key: 'stansmith', name: 'Adidas Stan Smith', look: 'Minimal white leather tennis shoe',
    growth: -15, buzz: 2, size: 3, window: 'short',
    ratings: { oldskool: ratings(4, 3, 3, 2, 3, 1), authentic: ratings(4, 3, 4, 1, 4, 5), slipon: ratings(4, 3, 3, 1, 3, 3) } },
  { key: 'nb993', name: 'New Balance 993', look: 'Chunky grey “dad” runner in mesh and suede',
    growth: -35, buzz: 2, size: 2, window: 'short',
    ratings: { oldskool: ratings(3, 2, 1, 3, 2, 2), authentic: ratings(3, 2, 1, 1, 2, 1), slipon: ratings(3, 2, 1, 1, 2, 1) } },
  { key: 'dunk', name: 'Nike Dunk', look: 'Retro basketball low in two-tone leather',
    growth: -45, buzz: 3, size: 4, window: 'short',
    ratings: { oldskool: ratings(4, 4, 3, 3, 3, 2), authentic: ratings(4, 3, 2, 1, 3, 2), slipon: ratings(4, 2, 2, 1, 3, 2) } }
];

export function usual() {
  return { product: 3, marketing: 3, money: 3 };
}

export function defaults() {
  return EXAMPLES.map((e) => ({ ...clone(e), custom: false, levers: usual() }));
}

export function newTrend(n) {
  const mid = () => ratings(3, 3, 3, 3, 3, 3);
  return { key: 'own' + n, name: n === 1 ? 'Your trend' : 'Your trend ' + n, look: "A trend you've spotted",
    custom: true, growth: 0, buzz: 3, size: 2, window: 'medium',
    ratings: { oldskool: mid(), authentic: mid(), slipon: mid() }, levers: usual() };
}

// How hot the trend is, 0 to 100: three signals on the same scale, then weighted.
export function momentum(t) {
  const g = clamp(t.growth + 50, 0, 100); // -50% -> 0, +50% -> 100
  const b = (t.buzz - 1) * 25;
  const s = (t.size - 1) * 25;
  const total = (WEIGHTS.growth * g + WEIGHTS.buzz * b + WEIGHTS.size * s) / 100;
  const parts = { growth: (WEIGHTS.growth * g) / 100, buzz: (WEIGHTS.buzz * b) / 100, size: (WEIGHTS.size * s) / 100 };
  return [roundHalfUp(total), parts];
}

// Each lever step moves the traits it touches by half a point. Nothing moves Shape fast.
export function leverShift(t, trait) {
  const lv = t.levers;
  if (trait === 'price') return 0.5 * (lv.money - 3);
  if (trait === 'function') return 0.5 * (lv.marketing - 3);
  if (trait === 'material' || trait === 'color' || trait === 'pattern') return 0.5 * (lv.product - 3) * WINDOWS[t.window].product;
  return 0.0;
}

export function adjustedRatings(t, shoe, withLevers = true) {
  const r = t.ratings[shoe];
  return TRAITS.map((tr) => clamp(r[tr.key] + (withLevers ? leverShift(t, tr.key) : 0), 1, 5));
}

// How close a shoe is to the trend, 0 to 100: the average of its six ratings.
export function fitScore(t, shoe, withLevers = true) {
  let total = 0;
  for (const v of adjustedRatings(t, shoe, withLevers)) total += v;
  return roundHalfUp(((total - TRAITS.length) * 25) / TRAITS.length);
}

export function bestShoe(t, withLevers = true) {
  let best = SHOES[0].key;
  let top = -1;
  for (const s of SHOES) {
    const f = fitScore(t, s.key, withLevers);
    if (f > top) {
      best = s.key;
      top = f;
    }
  }
  return [best, top];
}

export function callFor(mom, fit) {
  if (mom >= LINE) return fit >= LINE ? 'back' : 'test';
  return fit >= LINE ? 'hold' : 'pass';
}

export function betSize(levers) {
  const up = LEVERS.reduce((a, l) => a + Math.max(0, levers[l.key] - 3), 0);
  const down = LEVERS.reduce((a, l) => a + Math.max(0, 3 - levers[l.key]), 0);
  if (up === 0) return down ? 'Pulling back' : 'As usual';
  if (up <= 2) return 'A small bet';
  if (up <= 4) return 'A real bet';
  return 'Everything in';
}

export function shoeName(key) {
  return SHOES.find((s) => s.key === key).name;
}

export function playFor(call, window, shoe) {
  const the = 'the ' + shoeName(shoe);
  if (call === 'back') {
    if (window === 'short') return 'Back ' + the + " now with what's already made: marketing, the colors in stock and the front of the store. The trend won't last long enough for new product to land.";
    if (window === 'long') return 'Back ' + the + ' and develop it. The trend should last long enough for a new version to land.';
    return 'Back ' + the + '. New colors and materials on it can land while the trend is still hot.';
  }
  if (call === 'test') {
    if (window === 'short') return "Ride it with marketing, or let it pass. The trend is hot, but none of the core shoes is close, and it won't last long enough to close the gap.";
    if (window === 'long') return 'Write a brief for a new shoe. The trend is hot and lasting, and none of the core shoes is close.';
    return 'Test a small run or a collab on ' + the + ' before betting the line on it.';
  }
  if (call === 'hold') return 'Keep ' + the + " as it is. It already fits, but the trend isn't hot enough to earn extra spend.";
  return "Let it pass. The trend isn't hot and none of the core shoes is close.";
}

export function evaluate(t) {
  const [mom, parts] = momentum(t);
  const fits = {};
  for (const s of SHOES) fits[s.key] = { base: fitScore(t, s.key, false), now: fitScore(t, s.key, true) };
  const [shoe, fit] = bestShoe(t, true);
  const [baseShoe, baseFit] = bestShoe(t, false);
  const call = callFor(mom, fit);
  return { key: t.key, momentum: mom, parts, fits, shoe, fit, base_shoe: baseShoe, base_fit: baseFit, call,
    base_call: callFor(mom, baseFit), play: playFor(call, t.window, shoe), bet: betSize(t.levers) };
}

export function lineNote(v) {
  if (v === LINE) return 'right on the line';
  const n = Math.abs(v - LINE);
  return n + ' point' + (n !== 1 ? 's' : '') + ' ' + (v > LINE ? 'above' : 'below') + ' the line';
}
