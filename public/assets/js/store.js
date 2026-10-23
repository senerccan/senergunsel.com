// The store layout. This file is the only place the floor plan is defined.
//
// To add a project: add a zone to a floor's `zones` list. The plan packs zones
// onto a 12-column grid in the order listed, so a new zone takes the first
// free space and the "Next drop" hoarding shrinks around it. Nothing else has
// to move by hand.
// To add a floor: add an entry to `floors` with a new key and label. The
// elevator gets a new button automatically.
// To pair projects that work alone and complete each other: give them the same
// `suite`. A suite packs as one block (the footprint of its format in SUITES),
// its rooms are packed inside it in the order listed, and they share walls.
//
// Write every label so a recruiter who has never worked in retail gets it on
// the first read: plain words first, store words second.
//
// Zone fields
//   key       unique id used in links (#zone-<code> also works)
//   code      room number shown on the plan (G01, 101, 201...)
//   place     which sign hangs over it (a key in signs.js: main, window, fit...)
//   kind      what the project is and where it came from, in plain words:
//             "Work · Under Armour", "Grad school · NYU Stern × Vans",
//             "Personal project", "Writing", "Coming later"
//   tag       its status in a word or two: Case study, Playable, Read, Soon, TBA
//   format    footprint: SPLUS (6x3), S (4x2), D (2x2), TBA (2x2, hatched),
//             and inside a suite HALF (3x2) or JOIN (6x1, the room that joins them)
//   suite     optional: the suite (in SUITES) this room belongs to
//   hint      the preview drawn inside the zone (regions, curve, sliders, dots,
//             tiles, terminal, film, notes, pins, switches, streets2)
//   status    open (has a page), soon, tba
//   forecast  expected share of attention, 0 to 1. Used for the heat map
//             until enough real visits have been counted.

export const FLOORSET = 'FA26';

export const GEO = {
  SPLUS: { w: 6, h: 3, top: '48px', bottom: '124px', title: '27px' },
  S: { w: 4, h: 2, top: '46px', bottom: '112px', title: '20px' },
  D: { w: 2, h: 2, top: '58px', bottom: '84px', title: '16px' },
  TBA: { w: 2, h: 2, top: '58px', bottom: '84px', title: '16px' },
  HALF: { w: 3, h: 2, top: '42px', bottom: '102px', title: '17px' },
  JOIN: { w: 6, h: 1, top: '40px', bottom: '16px', title: '19px' }
};

// Suites: rooms that are projects on their own and add up to something more
// together. `format` is the suite's footprint on the floor; `label` names the
// pair for screen readers.
export const SUITES = {
  pair: {
    format: 'SPLUS',
    label: 'Same store, two streets: G07 and G06 work on their own, and G02 puts them together'
  }
};

export const FLOORS = [
  {
    key: 'G',
    label: 'G',
    drawing: 'Ground floor plan',
    purpose: 'Projects',
    zones: [
      {
        key: 'ua',
        code: 'G01',
        place: 'main',
        kind: 'Work · Under Armour',
        tag: 'Case study',
        format: 'SPLUS',
        hint: 'regions',
        status: 'open',
        forecast: 1,
        title: "Under Armour's first intelligent flagship",
        zoneMeta: 'Guangzhou · 2025–26',
        meta: 'Guangzhou · Apr 2025 – May 2026 · with CxC',
        body: "I started as the sole operator of the store's smart platform, designed how it measures what shoppers do, and wrote the KPI framework presented to Under Armour leadership.",
        facts: [
          { k: '100+', v: 'display areas tracked' },
          { k: '190+', v: 'products (SKUs) measured' },
          { k: '8', v: 'KPI dimensions' },
          { k: '<24h', v: 'to re-map the whole store' }
        ],
        cta: 'Read the case study',
        href: '/projects/under-armour-flagship/'
      },
      {
        key: 'model',
        code: 'G07',
        suite: 'pair',
        place: 'workshop',
        kind: 'Personal project',
        tag: 'Playable',
        format: 'HALF',
        hint: 'switches',
        status: 'open',
        forecast: 0.75,
        title: 'What does the next store cost?',
        zoneMeta: 'Excel',
        meta: 'Store rollout model · Excel, playable here',
        body: 'My store rollout model, rebuilt with anonymized numbers. Price three store sizes line by line, switch any line on or off, then open thirty stores and watch each one cost less than the last. Play it right here, or download the full workbook.',
        facts: [
          { k: '32', v: 'cost lines per store, each with an on and off switch' },
          { k: '3', v: 'store sizes, each with three recipes' },
          { k: '8,137', v: 'live formulas in the workbook, no macros' },
          { k: '6', v: 'challenges to beat' }
        ],
        cta: 'Play the model',
        href: '/projects/store-rollout-model/'
      },
      {
        key: 'tiering',
        code: 'G06',
        suite: 'pair',
        place: 'drop',
        kind: 'Personal project',
        tag: 'Playable',
        format: 'HALF',
        hint: 'pins',
        status: 'open',
        forecast: 0.7,
        title: 'Which streets earn a flagship?',
        zoneMeta: 'Tableau · Python',
        meta: 'Melbourne street traffic × store economics',
        body: 'A Tableau dashboard that sorts 78 street locations in central Melbourne into store sizes, by how many people walk past and how they move, then tests each one against store economics you can change.',
        facts: [
          { k: '78', v: 'street locations, each given a store size' },
          { k: '7', v: 'kinds of street, by when people walk past' },
          { k: '2 yrs', v: 'of hourly counts, cleaned in Python' },
          { k: '6', v: 'sliders to test the store economics' }
        ],
        cta: 'Open the dashboard',
        href: '/projects/melbourne-site-tiering/'
      },
      {
        key: 'scale',
        code: 'G02',
        suite: 'pair',
        place: 'window',
        kind: 'Personal project',
        tag: 'Playable',
        format: 'JOIN',
        hint: 'streets2',
        status: 'open',
        forecast: 0.8,
        title: 'Same store, two streets',
        planTitle: 'Same store,\ntwo streets',
        zoneMeta: 'Excel × Tableau',
        meta: 'G07 store model × G06 street dashboard',
        body: 'G07 and G06 work on their own and complete each other. The Excel model prices the store, the Tableau dashboard finds the streets that can pay it back, and those streets set the mix of sizes the model rolls out. Put one store on two real streets and see what changes.',
        facts: [
          { k: '78', v: 'real streets to put the same store on' },
          { k: '+5', v: 'streets pay back once the chain is built' },
          { k: 'Year 6', v: 'when a 30-store rollout pays for itself' }
        ],
        cta: 'See them together',
        href: '/projects/same-store-two-streets/'
      },
      {
        key: 'webcatcher',
        code: 'G03',
        place: 'fit',
        kind: 'Work · Vans',
        tag: 'Playable',
        format: 'S',
        hint: 'sliders',
        status: 'open',
        forecast: 0.6,
        title: 'Which trends should Vans chase?',
        zoneMeta: 'Web Catcher · Shanghai · 2024',
        meta: 'Web Catcher · Vans, Shanghai, 2024 · rebuilt 2026',
        body: "A tool I built at Vans to decide which footwear trends are worth chasing. Read how hot a trend is, rate how close Vans' three core shoes come to it, then pull the launch levers and see the call: back it, test small, hold or pass. I rebuilt it in 2026 to play right here.",
        facts: [
          { k: '5', v: 'trends from 2024 to try on, plus your own' },
          { k: '3', v: 'core shoes, rated on six traits' },
          { k: '3', v: 'launch levers: product, marketing, money' },
          { k: '4', v: 'calls: back it, test small, hold or pass' }
        ],
        cta: 'Try it on',
        href: '/projects/web-catcher/'
      },
      {
        key: 'capstone',
        code: 'G04',
        place: 'research',
        kind: 'Grad school · NYU Stern × Vans',
        tag: 'Case study',
        format: 'S',
        hint: 'dots',
        status: 'open',
        forecast: 0.45,
        title: 'Elevating Consumer Experience at Vans Stores',
        planTitle: 'Consumer experience at Vans stores',
        zoneMeta: 'Shanghai · 2024',
        meta: 'NYU Stern × Vans APAC · Shanghai · 2024 · survey playable',
        body: "A graduate capstone I co-led for Vans APAC: we walked three Shanghai stores, surveyed 220 students and presented a Store, Human and Brand strategy to the VP and General Manager. The survey is here to slice, and I re-read its regression two years on.",
        facts: [
          { k: '220', v: 'students surveyed, half Chinese nationals' },
          { k: '3', v: 'stores walked: flagship, concept, mid-size' },
          { k: '6', v: 'people on the team' },
          { k: '3', v: 'recommendations: Store, Human, Brand' }
        ],
        cta: 'Read the case study',
        href: '/projects/vans-capstone/'
      },
      {
        key: 'powerbi',
        code: 'G05',
        place: 'back',
        kind: 'Coming later',
        tag: 'TBA',
        format: 'TBA',
        hint: 'tiles',
        status: 'tba',
        hatch: true,
        forecast: 0.15,
        title: 'Power BI',
        zoneMeta: 'Release date: TBA',
        meta: 'In development',
        body: 'A Power BI project is being built in the back. Release date: TBA.',
        facts: [],
        cta: null,
        href: null
      }
    ]
  },
  {
    key: '1',
    label: '1',
    drawing: 'Level 1 plan',
    purpose: 'Pop-up lab: things I build with Claude',
    zones: [
      {
        key: 'store',
        code: '101',
        place: 'popup',
        kind: 'Personal project · This website',
        tag: 'Read',
        format: 'S',
        hint: 'terminal',
        status: 'open',
        forecast: 0.5,
        title: 'This store',
        zoneMeta: 'Built with Claude Code',
        meta: 'This website · 2026',
        body: "The site you're in, built in batches with Claude. The brief, the decisions and the dead ends behind it are in the Director's Cut on Level 2.",
        facts: [
          { k: '3', v: 'floors so far, more as it grows' },
          { k: 'Claude', v: "directed build, written up in the Director's Cut" }
        ],
        cta: "Read the Director's Cut",
        href: '/notes/directors-cut/'
      },
      {
        key: 'claudedash',
        code: '102',
        place: 'popup',
        kind: 'Coming later',
        tag: 'TBA',
        format: 'TBA',
        hint: 'tiles',
        status: 'tba',
        hatch: true,
        forecast: 0.1,
        title: 'Claude dashboard',
        zoneMeta: 'Release date: TBA',
        meta: 'In development',
        body: "Experiments with Claude's newest tools land here first.",
        facts: [],
        cta: null,
        href: null
      }
    ]
  },
  {
    key: '2',
    label: '2',
    drawing: 'Level 2 plan',
    purpose: 'Field notes: my writing',
    zones: [
      {
        key: 'cut',
        code: '201',
        place: 'notes',
        kind: 'Writing · Making of this site',
        tag: 'Read',
        format: 'S',
        hint: 'film',
        status: 'open',
        forecast: 0.55,
        title: "Director's Cut: how this store was built",
        zoneMeta: '5 min read',
        meta: "Field notes · Director's Cut",
        body: 'From the first brief to the man walking into the headline: the decisions, the dead ends and what got cut.',
        facts: [
          { k: '01', v: 'The brief' },
          { k: '02', v: 'The build' },
          { k: '03', v: 'What got cut' }
        ],
        cta: 'Read it',
        href: '/notes/directors-cut/'
      },
      {
        key: 'walkthrough',
        code: '202',
        place: 'notes',
        kind: 'Writing',
        tag: 'Soon',
        format: 'D',
        hint: 'notes',
        status: 'soon',
        forecast: 0.3,
        title: 'Store walk-through',
        zoneMeta: 'Coming soon',
        meta: 'Field notes · Store walk-through',
        body: 'A real store, walked with a retail analyst: what the layout is asking shoppers to do, and whether they do it.',
        facts: [],
        cta: null,
        href: null
      },
      {
        key: 'dropnote',
        code: '203',
        place: 'notes',
        kind: 'Writing',
        tag: 'Soon',
        format: 'D',
        hint: 'notes',
        status: 'soon',
        forecast: 0.25,
        title: 'Drop breakdown',
        zoneMeta: 'Coming soon',
        meta: 'Field notes · Drop breakdown',
        body: 'A sneaker release read like a dataset: the line outside, how fast it sold, and what the resale market said afterwards.',
        facts: [],
        cta: null,
        href: null
      }
    ]
  }
];

// A first-fit grid: each block takes the first free spot, row by row, that fits.
function grid(cols) {
  const occ = [];
  const free = (r, c, w, h) => {
    if (c + w > cols) return false;
    for (let y = r; y < r + h; y++) {
      for (let x = c; x < c + w; x++) {
        if (occ[y] && occ[y][x]) return false;
      }
    }
    return true;
  };
  const take = (w, h) => {
    for (let r = 0; r < 60; r++) {
      for (let c = 0; c <= cols - w; c++) {
        if (free(r, c, w, h)) {
          for (let y = r; y < r + h; y++) {
            if (!occ[y]) occ[y] = [];
            for (let x = c; x < c + w; x++) occ[y][x] = true;
          }
          return { col: c + 1, row: r + 1 };
        }
      }
    }
    return { col: 1, row: 1 };
  };
  return { occ, take };
}

// Pack a floor's zones onto the 12-column grid. Zones keep their listed order;
// each takes the first free spot that fits. A suite takes its spot when its
// first room comes up, and its rooms are packed inside it the same way.
// Empty cells become hoarding.
export function packFloor(floor, cols = 12) {
  const floorGrid = grid(cols);
  const placed = [];
  const suites = [];
  floor.zones.forEach((z) => {
    if (z.suite) {
      if (suites.some((s) => s.key === z.suite)) return;
      const def = SUITES[z.suite] || {};
      const sg = GEO[def.format] || GEO.SPLUS;
      const at = floorGrid.take(sg.w, sg.h);
      const rooms = floor.zones.filter((x) => x.suite === z.suite);
      const inner = grid(sg.w);
      suites.push({ key: z.suite, label: def.label || '', col: at.col, row: at.row, w: sg.w, h: sg.h, rooms: rooms.map((x) => x.key) });
      rooms.forEach((rz) => {
        const g = GEO[rz.format] || GEO.HALF;
        const pos = inner.take(g.w, g.h);
        placed.push({ ...rz, col: at.col + pos.col - 1, row: at.row + pos.row - 1, w: g.w, h: g.h, g, scol: pos.col, srow: pos.row });
      });
      return;
    }
    const g = GEO[z.format] || GEO.S;
    const pos = floorGrid.take(g.w, g.h);
    placed.push({ ...z, col: pos.col, row: pos.row, w: g.w, h: g.h, g });
  });
  const occ = floorGrid.occ;
  const runs = [];
  for (let r = 0; r < occ.length; r++) {
    let c = 0;
    while (c < cols) {
      if (occ[r] && occ[r][c]) { c++; continue; }
      const c0 = c;
      while (c < cols && !(occ[r] && occ[r][c])) c++;
      runs.push({ col: c0 + 1, row: r + 1, w: c - c0, h: 1 });
    }
  }
  const fillers = [];
  runs.forEach((f) => {
    const prev = fillers.find((p) => p.col === f.col && p.w === f.w && p.row + p.h === f.row);
    if (prev) prev.h += 1;
    else fillers.push({ ...f });
  });
  return { placed, fillers, suites };
}

export function allZones() {
  return FLOORS.flatMap((f) => f.zones.map((z) => ({ ...z, floor: f.key })));
}

export function findZone(codeOrKey) {
  const k = String(codeOrKey || '').toLowerCase();
  return allZones().find((z) => z.code.toLowerCase() === k || z.key === k) || null;
}
