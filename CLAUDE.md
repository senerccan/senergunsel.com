# Working on senergunsel.com

This is Sener Can Gunsel's portfolio, built as a store ("Flagship · Store 001"). Sener directs the work and
keeps creative control: propose, then build what he approves. Address him as Sener.

## How the site is put together

- Plain HTML, CSS and JavaScript in `public/`. No framework, no build step. Keep it that way so the site
  keeps working without upkeep.
- `public/assets/js/store.js` is the single source of the floor plan (floors and zones). Add projects there.
- `src/worker.js` only handles `/api/door/*` (the anonymous door sensor, a Durable Object with SQLite).
  Everything else is served as static assets.
- Deploys happen automatically when `main` is pushed (Cloudflare Workers Builds).

## Before you push

1. `npm run check` validates the store layout.
2. Run `npx wrangler dev` and look at the pages you changed at desktop (1440px) and phone (390px) widths,
   in both themes (Open and After hours).
3. Keep accessibility clean: visible focus, alt text, reduced motion respected, contrast passing.

## Writing rules

- Write in Sener's voice: first person, plain, confident, specific. No corporate filler.
- Avoid em dashes in all copy. Use commas, colons, periods or parentheses instead.
- Only claim what is on his resume or he has confirmed. Under Armour store data stays private: describe
  scope, never results or numbers that aren't already public or on the resume.
- Melbourne is a public data source only. He never lived there.
- Les Benjamins appears only on the resume, not as a project zone.
- Power BI stays a reserved "Release date: TBA" zone until Sener says otherwise.

## Design rules

- Tokens live in `public/assets/css/site.css` (`--ground`, `--surface`, `--ink`, `--accent` #FF4F00, ...).
  Every colour must work in both themes.
- Type: Archivo (variable, self-hosted) for text, IBM Plex Mono for store signage, codes and labels.
- Zones are sized by format: SPLUS (6×3), S (4×2), D (2×2), TBA (2×2, hatched).
- Store signage (not content) is translated in `signs.js` into EN, TR, FR and 中文.

## Privacy rules for the door sensor

No cookies, no third-party trackers, no IP addresses or personal data stored. Keep it that way; the footer
promises it.
