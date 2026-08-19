# Sources & source strategy

## Primary reference

**Ben 10 Wiki** — https://ben10.fandom.com (community wiki, CC-BY-SA text). Accessed 2026-08-17 through the
MediaWiki API (`/api.php`), never scraped as HTML. Every alien, device, series and Ben-version record in this
project links to the wiki page it was built from (`sources[]` in the research files; shown in each card's detail
view).

What we used from each kind of page:

| page type | fields used |
|---|---|
| `<Alien> (Classic)` alien pages | infobox (species, home planet, body type, powers, first appearance, per-series image gallery labelled OS/AF/UA/UAF/OV), *Appearance → Ben as X* (per-series design), *Powers and Abilities*, *Weaknesses*, *Appearances* (per-series episode lists, sub-headed by Ben's age / Ben 10,000 / Albedo), *History* |
| `Omnitrix (Original)`, `Ultimatrix (Original)`, `Omnitrix (Omniverse)`, `Biomnitrix` | device appearance/features and the **Known Aliens** tables (the per-era usage cross-check in `era-usage.json`) |
| `Ben Tennyson (Classic)` + subpages, `Ben 10,000 (…)`, `Ben 23`, `Mad Ben`, `Bad Ben`, `Nega Ben`, `Benzarro`, `No Watch Ben`, `Ben Tennyson (Race Against Time Timeline)`, `Eon`, `Ultimate Ben` | Ben-version records |
| series pages and episode pages | series metadata; **episode infoboxes** (season / episode number) → `data/episode-order.json` used for "first appearance" ordering |
| `Category:Original Series/Alien Force/Ultimate Alien/Omniverse Transformations` | scope discovery |
| gallery subpages (`<Alien>/Gallery/<Series>`) | alternative artwork when the infobox lacked a design for a series |

## Artwork

All character/device artwork is official Cartoon Network model-sheet / promotional / episode imagery hosted by the
wiki (`static.wikia.nocookie.net`). Files were fetched at original resolution, cropped only to trim transparent
margins, resized to ≤1400 px and re-encoded as WebP (alpha preserved). Nothing was redrawn, recoloured or
composited. Provenance for every file (wiki filename, source URL, source page, dimensions, confidence, visual
verification status) is in [`../assets/asset-manifest.json`](../assets/asset-manifest.json).

## Fonts

Google Fonts, SIL OFL 1.1 — see `public/fonts/LICENSES.md`.

## Pipeline (reproducible)

```
python3 scripts/fetch-wiki.py        # cache wikitext + parse infoboxes → research/wiki-cache, research/wiki-extract.json
python3 scripts/fetch-episodes.py    # episode ordering → data/episode-order.json, research/episodes.json
# research agents write research/aliens/*.json, research/ben-versions.research.json, research/devices.research.json, research/era-usage.json
npx tsx scripts/fetch-assets.ts      # download + optimise artwork → public/assets, assets/asset-manifest.json
npx tsx scripts/build-data.ts        # validate, score, link assets → data/aliens.json, data/ben-versions.json, data/power-classes.json
npx tsx scripts/contact-sheets.ts    # labelled contact sheets for visual verification → research/qa/contact-sheets
npx tsx scripts/qa-screenshots.ts    # site screenshots (desktop/tablet/phone) → research/qa/screens
node scripts/gen-alien-notes.cjs     # research/alien-notes.md
```

## Legal

Ben 10 and all related characters, names and artwork are © Cartoon Network / Man of Action Studios. This is a
non-commercial fan project intended for local, personal use only.

## Transformation sequence clips

- **Source:** the wiki's *Transformation Sequences* libraries — `Transformation Sequences/Ben 10 (2005 TV Series)`,
  `…/Alien Force`, `…/Ultimate Alien`, `…/Omniverse` (cached in `research/wiki-cache/`, parsed to
  `research/transformation-sequences.raw.json`). Each entry is a frame-by-frame set of episode stills of an alien's
  on-screen transformation sequence, with the episode it was featured in.
- **Pipeline:** `scripts/fetch-sequences.ts` downloads server-scaled frames (≤720 px), renders an MP4 per sequence
  with ffmpeg (frames blended up to 24 fps, ~3 s; nothing is redrawn) plus a poster, and writes
  `assets/sequence-manifest.json` (clip → alien, series, variant, episode, source frames, source page).
- **Scope:** Ben Prime / Ben 10,000 sequences only. Library groups for other users (Albedo's recreated Ultimatrix,
  Alpha, Ben 23 / Mad Ben / Gwen 10 "Alternate Omnitrix", Skurd enhancements, Kevin 11, Dr. Viktor) and Eon are
  skipped. At most two versions per alien per series, ≤40 frames each.
- **Known gaps (by design of the shows):** the 2005 series animated no new sequences after Wildvine; Ultimate Alien
  reused many Alien Force sequences (the player shows them from that era); several Omniverse aliens only ever
  transformed with a quick flash and have no library entry.
