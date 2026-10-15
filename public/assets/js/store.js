// The store layout. This file is the only place the floor plan is defined.
//
// To add a project: add a zone to a floor's `zones` list. The plan packs zones
// onto a 12-column grid in the order listed, so a new zone takes the first
// free space and the "Next drop" hoarding shrinks around it. Nothing else has
// to move by hand.
// To add a floor: add an entry to `floors` with a new key and label. The
// elevator gets a new button automatically.
//
// Zone fields
//   key       unique id used in links (#zone-<code> also works)
//   code      room number shown on the plan (G01, 101, 201...)
//   place     which sign hangs over it (a key in signs.js: main, window, fit...)
//   format    footprint: SPLUS (6x3), S (4x2), D (2x2), TBA (2x2, hatched)
//   hint      the preview drawn inside the zone (regions, curve, sliders, dots,
//             tiles, terminal, film, notes)
//   status    open (has a page), window (playable on the homepage), soon, tba
//   forecast  expected share of attention, 0 to 1. Used for the dwell heat
//             until enough real visits have been counted.

export const FLOORSET = 'FA26';

export const GEO = {
  SPLUS: { w: 6, h: 3, top: '48px', bottom: '100px', title: '27px' },
  S: { w: 4, h: 2, top: '46px', bottom: '82px', title: '20px' },
  D: { w: 2, h: 2, top: '56px', bottom: '82px', title: '16px' },
  TBA: { w: 2, h: 2, top: '56px', bottom: '82px', title: '16px' }
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
        format: 'SPLUS',
        hint: 'regions',
        status: 'open',
        forecast: 1,
        title: "Under Armour's first intelligent flagship",
        zoneMeta: 'Guangzhou · 2025–26 · Readable',
        meta: 'Guangzhou · Apr 2025 – May 2026 · with CxC',
        body: "Started as the sole operator of the store's intelligent platform, designed how it measures the consumer journey, and wrote the KPI framework presented to UA leadership.",
        facts: [
          { k: '100+', v: 'tracked display regions' },
          { k: '190+', v: 'SKUs measured' },
          { k: '8', v: 'KPI dimensions' },
          { k: '<24h', v: 'full floorset re-map' }
        ],
        proofs: ['Readable'],
        cta: 'Enter the case study',
        href: '/projects/under-armour-flagship/'
      },
      {
        key: 'scale',
        code: 'G02',
        place: 'window',
        format: 'SPLUS',
        hint: 'curve',
        status: 'window',
        featured: true,
        forecast: 0.85,
        title: 'Same store, two streets',
        zoneMeta: 'Excel · Tableau · Python · Playable',
        meta: 'Store-scaling model × Melbourne footfall',
        body: 'My rollout scenario model, anonymized and fed with real street traffic. Pick a street in the window and see the share of passers-by a store needs to break even. The full model opens in the next floorset.',
        facts: [
          { k: '78', v: 'street sensors tiered by traffic quality' },
          { k: '1.6M', v: 'hourly counts prepped in Python' },
          { k: '3', v: 'store formats priced in Excel' }
        ],
        proofs: ['Playable'],
        cta: 'Play it in the window',
        href: '/#window'
      },
      {
        key: 'webcatcher',
        code: 'G03',
        place: 'fit',
        format: 'S',
        hint: 'sliders',
        status: 'soon',
        forecast: 0.6,
        title: 'Web Catcher',
        zoneMeta: 'Vans · 2024 · Opening soon',
        meta: 'Vans · Shanghai · 2024',
        body: 'A tool I built at Vans that scores how closely core SKUs track emerging footwear trends, with levers to simulate launch scenarios. It is being rebuilt to run right here in your browser.',
        facts: [
          { k: '3', v: 'scenario levers: product, marketing, money' },
          { k: 'Python', v: 'with Streamlit, Plotly and pandas' }
        ],
        proofs: ['Playable soon'],
        cta: null,
        href: null
      },
      {
        key: 'capstone',
        code: 'G04',
        place: 'research',
        format: 'S',
        hint: 'dots',
        status: 'soon',
        forecast: 0.45,
        title: 'Elevating Consumer Experience at Vans Stores',
        planTitle: 'Consumer experience at Vans stores',
        zoneMeta: 'Stern × Vans · Opening soon',
        meta: 'NYU Stern × Vans APAC · Shanghai · 2024',
        body: "A capstone I co-led: silent observation in three Shanghai stores, a 220-person survey, and a Store, Human and Brand strategy presented to Vans APAC's VP & GM.",
        facts: [
          { k: '220', v: 'survey respondents' },
          { k: '3', v: 'store formats observed: flagship, concept, mid-size' },
          { k: '6', v: 'people on the team' }
        ],
        proofs: ['Readable soon'],
        cta: null,
        href: null
      },
      {
        key: 'powerbi',
        code: 'G05',
        place: 'back',
        format: 'TBA',
        hint: 'tiles',
        status: 'tba',
        hatch: true,
        forecast: 0.15,
        title: 'Power BI',
        zoneMeta: 'Next release',
        meta: 'Back of house · In development',
        body: 'The next release is being built in the back. Release date: TBA.',
        facts: [{ k: 'TBA', v: 'release date' }],
        proofs: ['Coming soon'],
        cta: null,
        href: null
      }
    ]
  },
  {
    key: '1',
    label: '1',
    drawing: 'Level 1 plan',
    purpose: 'Pop-up lab · Built with Claude',
    zones: [
      {
        key: 'store',
        code: '101',
        place: 'popup',
        format: 'S',
        hint: 'terminal',
        status: 'open',
        forecast: 0.5,
        title: 'This store',
        zoneMeta: 'Built with Claude Code · Readable',
        meta: 'Pop-up lab · Floorset FA26',
        body: "The site you're standing in, built in batches with Claude. The brief, the decisions and the dead ends behind it are in the Director's Cut on Level 2.",
        facts: [
          { k: 'FA26', v: 'first floorset' },
          { k: 'Claude', v: "directed build, logged in the Director's Cut" }
        ],
        proofs: ['Readable'],
        cta: "Read the Director's Cut",
        href: '/notes/directors-cut/'
      },
      {
        key: 'claudedash',
        code: '102',
        place: 'popup',
        format: 'TBA',
        hint: 'tiles',
        status: 'tba',
        hatch: true,
        forecast: 0.1,
        title: 'Claude dashboard',
        zoneMeta: 'Coming soon',
        meta: 'Pop-up lab · Coming soon',
        body: "Experiments with Claude's newest tools drop here first.",
        facts: [{ k: 'TBA', v: 'release date' }],
        proofs: ['Coming soon'],
        cta: null,
        href: null
      }
    ]
  },
  {
    key: '2',
    label: '2',
    drawing: 'Level 2 plan',
    purpose: "Field notes · Director's Cut",
    zones: [
      {
        key: 'cut',
        code: '201',
        place: 'notes',
        format: 'S',
        hint: 'film',
        status: 'open',
        forecast: 0.55,
        title: "Director's Cut: how this store was built",
        zoneMeta: 'Making of · Readable',
        meta: "Field notes · Director's Cut",
        body: 'From the first brief to the man walking into the headline: the decisions, the dead ends and what got cut.',
        facts: [
          { k: '01', v: 'The brief' },
          { k: '02', v: 'The build' },
          { k: '03', v: 'What got cut' }
        ],
        proofs: ['Readable'],
        cta: 'Read the cut',
        href: '/notes/directors-cut/'
      },
      {
        key: 'walkthrough',
        code: '202',
        place: 'notes',
        format: 'D',
        hint: 'notes',
        status: 'soon',
        forecast: 0.3,
        title: 'Store walk-through',
        zoneMeta: 'Pinned soon',
        meta: 'Field notes · Store walk-through',
        body: 'A real store, walked with a retail analyst: what the layout is asking shoppers to do, and whether they do it.',
        facts: [],
        proofs: ['Readable soon'],
        cta: null,
        href: null
      },
      {
        key: 'dropnote',
        code: '203',
        place: 'notes',
        format: 'D',
        hint: 'notes',
        status: 'soon',
        forecast: 0.25,
        title: 'Drop breakdown',
        zoneMeta: 'Pinned soon',
        meta: 'Field notes · Drop breakdown',
        body: 'A sneaker release read like a dataset: the line, the sell-through and what the resale market said afterwards.',
        facts: [],
        proofs: ['Readable soon'],
        cta: null,
        href: null
      }
    ]
  }
];

// Pack a floor's zones onto the 12-column grid. Zones keep their listed order;
// each takes the first free spot that fits. Empty cells become hoarding.
export function packFloor(floor, cols = 12) {
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
  const mark = (r, c, w, h) => {
    for (let y = r; y < r + h; y++) {
      if (!occ[y]) occ[y] = [];
      for (let x = c; x < c + w; x++) occ[y][x] = true;
    }
  };
  const placed = floor.zones.map((z) => {
    const g = GEO[z.format] || GEO.S;
    for (let r = 0; r < 60; r++) {
      for (let c = 0; c <= cols - g.w; c++) {
        if (free(r, c, g.w, g.h)) {
          mark(r, c, g.w, g.h);
          return { ...z, col: c + 1, row: r + 1, w: g.w, h: g.h, g };
        }
      }
    }
    return { ...z, col: 1, row: 1, w: g.w, h: g.h, g };
  });
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
  return { placed, fillers };
}

export function allZones() {
  return FLOORS.flatMap((f) => f.zones.map((z) => ({ ...z, floor: f.key })));
}

export function findZone(codeOrKey) {
  const k = String(codeOrKey || '').toLowerCase();
  return allZones().find((z) => z.code.toLowerCase() === k || z.key === k) || null;
}
