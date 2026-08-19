# Ben 10 Vault

A premium, local-only digital collection of every Omnitrix transformation from the classic continuity —
**Ben 10 (2005)**, **Alien Force**, **Ultimate Alien** and **Omniverse** — presented as a museum of the four
Omnitrix devices and a wall of collectible alien cards per era. No Reboot content.

> Enter → four Omnitrixes → slam one → the era's alien wall → browse series-accurate cards with Power Scores and
> rarity classes → open a card for abilities, feats, weaknesses, the scoring breakdown, related forms and the
> same alien's other-era designs → jump between eras. Plus a Ben Archive of every canonical version of Ben.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
```

Production build: `npm run build` then `npm run preview`. Type-check: `npm run typecheck`. Lint: `npm run lint`.

Requirements: Node ≥ 20 (developed on 25), Python 3 (only for the research scripts).

## What's inside

| | |
|---|---|
| **80** transformations, **153** era-specific cards | Ben 10: 25 · Alien Force: 19 · Ultimate Alien: 45 · Omniverse: 64 |
| **21** versions of Ben | ten-year-old to Ben 10,000, Ben 23, Mad/Bad/Nega Ben, Benzarro, No Watch Ben, Eon… |
| **7** power classes | Standard → Advanced → Elite → Apex → Legendary → Cosmic → Infinite (Alien X, 200/200) |
| **180/180** artwork assets visually verified | series-specific designs; provenance in `assets/asset-manifest.json` |

## Transformation clips

Every card detail has a **Transformation sequence** player ("Slam it"): the alien's on-screen transformation
for that era, rendered with ffmpeg from the frame-by-frame episode stills catalogued in the wiki's
*Transformation Sequences* libraries (`scripts/fetch-sequences.ts` → `public/assets/sequences/`,
provenance in `assets/sequence-manifest.json`). Frames are blended up to 24 fps; nothing is redrawn.

## Architecture

```
src/
  app/            router shell, scroll handling
  pages/          HomePage · EraWallPage (+ detail route) · BenArchivePage · AboutPage
  components/
    omnitrix/     the four device SVGs, the hourglass mark, the interactive OmnitrixObject
    cards/        AlienCard (7 tier treatments, era theming, tilt/specular), AlienArt
    wall/         WallFilters (search, class, kind, sort, species)
    detail/       AlienDetail modal (showcase card + full profile + score breakdown)
    ui/           Header (nav + sound toggle), EraTransitionOverlay
  data/           schema.ts (types) · scoring.ts (Power Score system) · vault.ts (data access + indexes)
  lib/            audio.ts (WebAudio engine + replaceable slots) · transition.ts · wallFilters.ts · hooks.ts
  styles/         tokens.css (global + per-era design tokens) · global.css
data/             compiled presentation dataset: aliens.json, ben-versions.json, series.json, omnitrixes.json,
                  power-classes.json, episode-order.json, overrides.json (pins/exclusions)
research/         the research layer: RESEARCH_SPEC.md, aliens/*.json (one per transformation), ben-versions.research.json,
                  devices.research.json, era-usage.json, wiki-cache/, wiki-extract.json, sources.md, canon-notes.md, alien-notes.md
assets/           asset-manifest.json (every image: source file/URL/page, size, confidence, verification, notes)
public/assets/    optimised artwork (webp) · public/fonts (OFL) · public/audio (drop-in sound slots)
scripts/          fetch-wiki.py · fetch-episodes.py · fetch-assets.ts · build-data.ts · contact-sheets.ts · qa-screenshots.ts
docs/             power-scoring.md · design-notes.md · audio.md
```

**Data model** (`src/data/schema.ts`): `Series`, `Omnitrix`, `BenVersion`, `Alien` (with `kind`
standard/ultimate/fusion, base/ultimate/component relations), `AlienAppearance` (one per alien × era, referencing
an era-specific `Asset`), `PowerScore` (14 dimensions + penalties → 50–200), `PowerClass`, `Asset`. The UI reads
only through `src/data/vault.ts`; nothing is hard-coded per alien.

**Pipeline**: research JSON → `scripts/build-data.ts` (zod validation, scoring, asset linking, Ultimate > base
checks, distribution report) → `data/*.json` → app. Add an alien by adding a research file and running
`npm run assets:fetch && npm run data:build`.

## Stack

Vite 8 · React 19 · TypeScript · react-router 7 · framer-motion · zod (build-time validation) · sharp (image
optimisation) · Playwright (visual QA only). No UI framework, no CSS framework — hand-written CSS with design
tokens and container queries.

## Scoring, sound, design, canon

* [`docs/power-scoring.md`](docs/power-scoring.md) — the editorial 50–200 system, weights, anchors, calibration.
* [`docs/design-notes.md`](docs/design-notes.md) — era identities, device drawings, card tiers, typography.
* [`docs/audio.md`](docs/audio.md) — the sound engine and how to drop in real Omnitrix samples.
* [`research/canon-notes.md`](research/canon-notes.md) — scope rules and every uncertain call.
* [`research/sources.md`](research/sources.md) — where facts and artwork came from; reproducible pipeline.

## Legal

Unofficial fan project for local personal use. Ben 10 and all related characters and artwork are © Cartoon
Network / Man of Action Studios. Artwork and canon references were sourced from the Ben 10 community wiki.
