# Flagship · Store 001

The portfolio of **Sener Can Gunsel**, retail data and insights analyst in New York, built as a store.
Live at **[senergunsel.com](https://senergunsel.com)**.

You walk in through the headline (the comma is a man, the period is a door), the projects are zones on a
floor plan, the resume is the register, and a door counter tallies visits anonymously in the band at the top.
Every label leads with plain words and keeps the store word second, so a recruiter who has never worked in
retail can follow it, and the Express lane is always one click away.
The [Director's Cut](https://senergunsel.com/notes/directors-cut/) explains how and why it was built.

## What's in the store

| Where | What |
|---|---|
| `public/index.html` | The homepage: door band, walk-in headline, floor plan, store locator, register |
| `public/express/` | The Express lane: everything a recruiter needs in 30 seconds |
| `public/projects/` | One folder per project: the Under Armour case study, the store rollout model (G07), the Melbourne Tableau dashboard (G06), Same store, two streets (G02), where those two meet, Web Catcher (G03) and the Vans capstone (G04) |
| `public/downloads/` | Files to take away: the full Excel workbook behind G07; the Vans capstone's report, presentation, R script and anonymized survey data (G04); the 2024 framework deck Web Catcher grew from (G03); the handover guide for the Under Armour project's Notion hub (G01) |
| `public/notes/` | Field notes, starting with the Director's Cut |
| `public/assets/js/store.js` | **The floor plan.** Every zone and floor is defined here and nowhere else |
| `public/assets/js/signs.js` | Store signage in English, Turkish, French and Chinese |
| `public/assets/js/home.js` | Homepage behaviour: headline, floor plan, dwell tracking |
| `public/assets/js/model.js` | The store rollout model in JavaScript: the Excel workbook's rules, checked against its results |
| `public/assets/js/model-data.js` | The model's inputs, generated from the workbook (every cost illustrative) and the 78 Melbourne streets |
| `public/assets/js/playground.js` | The playable model on `/projects/store-rollout-model/`: levers, charts and challenges |
| `public/assets/js/window.js` | One store on two real streets, on `/projects/same-store-two-streets/` |
| `public/assets/js/viz.js` | The click-to-load Tableau dashboard on `/projects/melbourne-site-tiering/` |
| `public/assets/js/webcatcher-model.js` | Web Catcher's rules in JavaScript, step for step the same as `webcatcher_model.py` in [project_webcatcher](https://github.com/senerccan/project_webcatcher) |
| `public/assets/js/webcatcher.js` | Web Catcher, playable on `/projects/web-catcher/`: the trends, the star ratings, the levers and the wall |
| `public/assets/js/backhouse-data.js` | G01's back of house: counts and dates from the project's Notion hub, generated from its database exports (process facts only, no names, no store data) |
| `public/assets/js/backhouse.js` | Draws G01's back of house: the hub as a plan of rooms, the launch plan as a strip, the systems as bars |
| `public/assets/js/capstone-data.js` | The Vans capstone survey, anonymized (220 responses), and its regression results, generated from the files in `downloads/` |
| `public/assets/js/capstone.js` | The survey sliced live on `/projects/vans-capstone/`, and the regression chart |
| `public/assets/js/door.js` | The browser side of the door sensor |
| `src/worker.js` | The door sensor: a Cloudflare Worker and a Durable Object that count visits |
| `wrangler.jsonc` | Cloudflare configuration |
| `scripts/` | Build helpers, run by hand: the social cards (`render-images.py`), the store check, G01's back-of-house data from the Notion exports (`backhouse-data.py`) and the public copy of its handover guide (`handover-guide-pdf.py`) |

Plain HTML, CSS and JavaScript. No framework and no build step, so the store keeps working for years
without upkeep.

## Add a project (a new drop)

1. Add a zone to a floor in `public/assets/js/store.js`. Pick a `format` for its footprint:
   `SPLUS` (6×3), `S` (4×2), `D` (2×2) or `TBA` (2×2, hatched). The plan packs zones in the order listed,
   and the "Next drop" hoarding shrinks around the new one. Give it a `kind` that says plainly what it is
   ("Work · Company", "Grad school · …", "Personal project", "Writing", "Coming later") and a short `tag`
   for its status (Case study, Playable, Read, Soon, TBA).
2. Give it a page under `public/projects/<name>/index.html` (copy the Under Armour one), set
   `status: 'open'`, `href` and `cta`.
3. Add the page to `public/sitemap.xml`, and to the Express lane if it belongs in the 30-second version.
4. Run `npm run check` to validate the layout.

To open a new floor, add an entry to `FLOORS` with a new `key` and `label`. The elevator gets a button
automatically.

Projects that work on their own and complete each other can share a suite. Give their zones the same
`suite` (a key in `SUITES`): the suite packs onto the floor as one block in its format's footprint, and its
rooms are packed inside it in the order listed, sharing walls. The ground floor's pair is G07 (the Excel
model) and G06 (the Tableau dashboard) as `HALF` rooms (3×2) side by side, with G02 as the `JOIN` room
(6×1) underneath that puts them together. `npm run check` makes sure a suite's rooms fill it exactly.

## Run it locally

```bash
npm install
npx wrangler dev        # http://localhost:8787, door sensor included
npm run check           # validate the store layout
```

## Publish

Every push to `main` deploys automatically through Cloudflare Workers Builds. The Worker serves the
static pages straight from `public/` and only runs code for `/api/door/*`.

## The door sensor and privacy

- A random visit id lives in `sessionStorage` for one browser tab. No cookies, no IP addresses, nothing
  that identifies a person is stored.
- Footfall is counted once per tab visit. "In store now" is visits with a heartbeat in the last 75 seconds.
- Zone dwell is attention that follows the pointer: resting on a zone or its details panel, focusing it
  with the keyboard, opening its row on a phone, or reading its page. A stop counts after one second, so
  pass-bys are ignored.
- Each stop gets its own clock from zero while a bloom pulses and grows: orange on a first stop, blue on a
  return. Stepping off leaves a little warmth on the zone, and the details panel keeps the running total.
  Your stops and total per zone stay in `sessionStorage` (`scg.dwell`) for that tab only.
- Web Catcher (G03) keeps the trends you set up in `sessionStorage` (`scg.wc`) for that tab only, so they
  survive a look around the store. Start over clears it.
- The store-wide heat shows a forecast until 50 visits are counted in the last 30 days, then real dwell.
- Sessions are deleted after two days; daily totals are kept.

## Credits

Type: [Archivo](https://github.com/Omnibus-Type/Archivo) and [IBM Plex Mono](https://github.com/IBM/plex),
both under the SIL Open Font License (see `public/assets/fonts/`). Built with Claude and Claude Code.

© Sener Can Gunsel. All rights reserved for the content; the code is shared so you can see how it works.
