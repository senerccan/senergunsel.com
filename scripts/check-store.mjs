// Checks the store layout in public/assets/js/store.js before you ship a new drop.
// Run: npm run check
import { FLOORS, GEO, packFloor } from '../public/assets/js/store.js';
import { SIGNS } from '../public/assets/js/signs.js';

const HINTS = ['regions', 'curve', 'sliders', 'dots', 'tiles', 'terminal', 'film', 'notes'];
const STATUS = ['open', 'window', 'soon', 'tba'];
const problems = [];
const seenKeys = new Map();
const seenCodes = new Map();
const seenFloors = new Set();

for (const floor of FLOORS) {
  if (seenFloors.has(floor.key)) problems.push(`Floor key "${floor.key}" is used twice.`);
  seenFloors.add(floor.key);
  if (!floor.zones.length) problems.push(`Floor ${floor.key} has no zones.`);
  for (const z of floor.zones) {
    const where = `${floor.key}/${z.code || z.key}`;
    if (seenKeys.has(z.key)) problems.push(`${where}: key "${z.key}" is also used on floor ${seenKeys.get(z.key)}.`);
    seenKeys.set(z.key, floor.key);
    if (!/^[A-Z0-9]{2,5}$/.test(z.code || '')) problems.push(`${where}: code must be 2 to 5 capital letters or digits (the door sensor ignores anything else).`);
    if (seenCodes.has(z.code)) problems.push(`${where}: code ${z.code} is also used on floor ${seenCodes.get(z.code)}.`);
    seenCodes.set(z.code, floor.key);
    if (!GEO[z.format]) problems.push(`${where}: format "${z.format}" should be one of ${Object.keys(GEO).join(', ')}.`);
    if (!HINTS.includes(z.hint)) problems.push(`${where}: hint "${z.hint}" should be one of ${HINTS.join(', ')}.`);
    if (!STATUS.includes(z.status)) problems.push(`${where}: status "${z.status}" should be one of ${STATUS.join(', ')}.`);
    if (!SIGNS.en[z.place]) problems.push(`${where}: place "${z.place}" has no sign in signs.js.`);
    if ((z.status === 'open' || z.status === 'window') && (!z.href || !z.cta)) problems.push(`${where}: open zones need both href and cta.`);
    if (!(z.forecast >= 0 && z.forecast <= 1)) problems.push(`${where}: forecast should be between 0 and 1.`);
    if (!z.title || !z.body) problems.push(`${where}: needs a title and a body.`);
    if (!z.kind) problems.push(`${where}: needs a kind, in plain words (Work · Company, Grad school, Personal project, Writing, Coming later).`);
    if (!z.tag || z.tag.length > 12) problems.push(`${where}: needs a short tag (Case study, Playable, Read, Soon, TBA).`);
  }
  const { placed, fillers } = packFloor(floor);
  const rows = Math.max(...placed.map((z) => z.row + z.h - 1));
  console.log(`Floor ${floor.key} (${floor.drawing}): ${placed.length} zones, ${rows} rows, ${fillers.length} "Next drop" spaces`);
}

if (problems.length) {
  console.error('\nThe store layout has problems:');
  problems.forEach((p) => console.error(' - ' + p));
  process.exit(1);
}
console.log('\nStore layout looks good.');
