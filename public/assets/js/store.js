// The store layout. This file is the only place the floor plan is defined.
//
// To add a project: add a zone to a floor's `zones` list. The plan packs zones
// onto a 12-column grid in the order listed, so a new zone takes the first
// free space and the "Next drop" hoarding shrinks around it. Nothing else has
// to move by hand.
// To add a floor: add an entry to `floors` with a new key and label. The
// elevator gets a new button automatically.
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
//   format    footprint: SPLUS (6x3), S (4x2), D (2x2), TBA (2x2, hatched)
//   hint      the preview drawn inside the zone (regions, curve, sliders, dots,
//             tiles, terminal, film, notes)
//   status    open (has a page), soon, tba
//   forecast  expected share of attention, 0 to 1. Used for the heat map
//             until enough real visits have been counted.

export const FLOORSET = 'FA26';

export const GEO = {
  SPLUS: { w: 6, h: 3, top: '48px', bottom: '124px', title: '27px' },
  S: { w: 4, h: 2, top: '46px', bottom: '112px', title: '20px' },
  D: { w: 2, h: 2, top: '58px', bottom: '84px', title: '16px' },
  TBA: { w: 2, h: 2, top: '58px', bottom: '84px', title: '16px' }
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
        key: 'scale',
        code: 'G02',
        place: 'window',
        kind: 'Personal project',
        tag: 'Playable',
        format: 'SPLUS',
        hint: 'curve',
        status: 'open',
        featured: true,
        forecast: 0.85,
        title: 'Same store, two streets',
        zoneMeta: 'Excel · Tableau · Python',
        meta: 'Store rollout model × Melbourne street traffic',
        body: 'My store rollout model, anonymized and paired with real street traffic from public pedestrian counters. Pick a street and see what share of the people walking past a store needs to come in for it to break even.',
        facts: [
          { k: '78', v: 'street sensors sorted by traffic quality' },
          { k: '1.6M', v: 'hourly counts cleaned in Python' },
          { k: '3', v: 'store sizes priced in Excel' }
        ],
        cta: 'Play the model',
        href: '/projects/same-store-two-streets/'
      },
      {
        key: 'webcatcher',
        code: 'G03',
        place: 'fit',
        kind: 'Work · Vans',
        tag: 'Soon',
        format: 'S',
        hint: 'sliders',
        status: 'soon',
        forecast: 0.6,
        title: 'Web Catcher',
        zoneMeta: 'Shanghai · 2024',
        meta: 'Vans · Shanghai · 2024',
        body: "A tool I built at Vans that scores how closely core products follow new footwear trends, with sliders to test launch scenarios. I'm rebuilding it to run right here in your browser.",
        facts: [
          { k: '3', v: 'scenario sliders: product, marketing, money' },
          { k: 'Python', v: 'with Streamlit, Plotly and pandas' }
        ],
        cta: null,
        href: null
      },
      {
        key: 'capstone',
        code: 'G04',
        place: 'research',
        kind: 'Grad school · NYU Stern × Vans',
        tag: 'Soon',
        format: 'S',
        hint: 'dots',
        status: 'soon',
        forecast: 0.45,
        title: 'Elevating Consumer Experience at Vans Stores',
        planTitle: 'Consumer experience at Vans stores',
        zoneMeta: 'Shanghai · 2024',
        meta: 'NYU Stern × Vans APAC · Shanghai · 2024',
        body: "A graduate capstone I co-led for Vans: we watched how shoppers moved through three Shanghai stores, surveyed 220 people, and presented a Store, Human and Brand strategy to Vans APAC's VP and General Manager.",
        facts: [
          { k: '220', v: 'people surveyed' },
          { k: '3', v: 'stores observed: flagship, concept, mid-size' },
          { k: '6', v: 'people on the team' }
        ],
        cta: null,
        href: null
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
