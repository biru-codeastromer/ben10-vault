# Canon notes & scope decisions

This file records the editorial decisions behind the dataset and every place where the canon is fuzzy. Per-alien
notes from the research passes are collected in [`alien-notes.md`](alien-notes.md) (generated). The raw wiki
material each fact came from is cached in `wiki-cache/` and summarised in `wiki-extract.json`.

## Continuity

* **Classic continuity only**: *Ben 10* (2005–08), *Alien Force* (2008–10), *Ultimate Alien* (2010–12),
  *Omniverse* (2012–14). The 2016 Reboot and its dimensions ("Alien X-Tinction" homage dimensions, Dynamite comics)
  are excluded everywhere, including the Ben Archive.
* Series ids: `os`, `af`, `ua`, `ov`.

## What earns a card on an era wall

An alien has an *AlienAppearance* for series X **only if a version of Ben transformed into it on-screen in that
series** — TV episodes plus that era's canonical movies (*Secret of the Omnitrix*, *Destroy All Aliens*,
*Alien Swarm*) and the *Heroes United* crossover (UA era). Video games, comics and merchandise never count.

Consequences worth knowing:

* Forms used only by Albedo, Kevin, Gwen, Ken, Ben 23, Skurd, or Azmuth in a series do **not** create an appearance
  (recorded in notes). That removes the "Negative" Ultimate forms from Omniverse: **Ultimate Arctiguana, Ultimate
  Gravattack, Ultimate Rath and Ultimate Albedo** exist in `research/aliens/` but are not in the vault, and Ultimate
  Humungousaur / Echo Echo / Spidermonkey have UA cards only (their OV appearances are Albedo's).
* **Ben 10,000** counts as a Ben: Spitter, Buzzshock and Arctiguana are on the Ben 10 wall via *Ben 10,000* /
  *Ken 10* (tagged BEN 10,000), Ultimate Ben is on the UA wall via *Ben 10,000 Returns*, and the six Biomnitrix
  fusions (Fourmungousaur, Humungoopsaur, Big Chuck, Crashocker, Uprigg, Atomic-X) are on the Omniverse wall.
* **Ten-/eleven-year-old Ben in later series** counts for that later series, in that series' art style: Four Arms,
  Heatblast, Stinkfly and Wildmutt on the UA wall via *The Forge of Creation*; the eleven-year-old flashback forms
  (Feedback etc.) on the OV wall.
* **Omnitrix-malfunction fusions** (Stink Arms, Diamond Matter, Heat Jaws — *Dr. Animo and the Mutant Ray*) are on the
  Ben 10 wall, tagged FUSION.
* **Eon** (Ben transformed into Eon in the live-action *Race Against Time*) is researched but **excluded from the
  wall** (`data/overrides.json → excludeAliens`): the movie is its own live-action timeline and the only artwork is a
  photograph, which would break the collection. RAT Ben and Eon remain in the Ben Archive under alternate timelines.
* **Jetray, Fasttrack and ChamAlien have no Omniverse card** — none was ever used on-screen in OV (Jetray appears only
  in photographs; the wiki's trivia notes he is the only regular AF/UA alien not used in OV).
* **Heatblast and Wildmutt have no Alien Force card** — re-unlocked but never used on-screen in AF.
* **Grey Matter, Wildvine, Blitzwolfer, Snare-Oh, Frankenstrike, Ditto, Eye Guy** are on the Ben 10 and Omniverse
  walls only (their UA "reunlock" happened off-screen via Ben 10,000).
* Ben-age mapping for AF follows the wiki's two-season split: *Ben 10 Returns* → *War of the Worlds* = 15-year-old,
  *Vengeance of Vilgax* onward (incl. *Alien Swarm*) = 16-year-old.

## Cross-check

`research/era-usage.json` lists every form each Ben used per era straight from the device pages ("Known Aliens"
tables of *Omnitrix (Original)*, *Ultimatrix (Original)*, *Omnitrix (Omniverse)*), filtered to on-screen use. The
compiled vault matches those lists exactly (Ben 10: 25 + Eon; Alien Force: 19; Ultimate Alien: 45; Omniverse: 64) —
the only textual differences are Perk/Murk Upchuck being one card.

## Completeness audit (2026-08-17, second pass)

Two independent sources were parsed mechanically and diffed against the compiled vault:

1. **Device pages' "Known Aliens" tables** (*Omnitrix (Original)* pre-/post-reconfiguration, *Ultimatrix (Original)*
   unlocked + Ultimate forms, *Omnitrix (Omniverse)*). Every difference is explained: the tables omit Ben 10,000-only
   forms and fusions (Spitter, Buzzshock, Arctiguana in OS; Ultimate Ben; the six Biomnitrix fusions; the three OS
   malfunction fusions) which the vault adds; and the tables list forms that were unlocked but never used on-screen
   which the vault omits — AF: Heatblast, Wildmutt · UA: Arctiguana, Blitzwolfer, Ditto, Eye Guy, Frankenstrike,
   Grey Matter, Snare-Oh, Wildvine (reunlocked by Ben 10,000 in *Ben 10,000 Returns*), Gravattack (first used in OV) ·
   OV: ChamAlien, Fasttrack, Jetray · OS table rows for Clockwork/Feedback are OV events, Eon is excluded by decision.
2. **Series pages' "Transformations" sections** (*Ben 10 (2005 TV Series)*, *Alien Force*, *Ultimate Alien*,
   *Omniverse*). Ben 10 matches exactly (10 original + 9 additional + 3 future + 3 combinations = 25). Alien Force
   lists Heatblast/Wildmutt as unlocked, but their own pages have **no Alien Force appearance** → not on the wall.
   Ultimate Alien lists Buzzshock/Spitter, but their pages have **no Ultimate Alien appearance** → not on the wall.
   Omniverse's Ben Prime list matches the vault's 58 base forms plus the three never-used forms above, and adds
   **Rocks** and **Squidstrictor** — both appear only in the *Ben 10 Live* stage plays (never in the TV series; canon
   "Questioned" on the wiki) → not on the wall.

Deliberately not on the walls (all documented above): Ben 23's 29 Dimension-23 aliens (Handyman, Feedback 23,
Rath 23 …), the alternate Bens' recolours of existing aliens (Mad/Bad/Nega Ben, Benzarro), Albedo-only Ultimates,
Eon, Rocks/Squidstrictor, the non-canon *Gwen 10* / *Goodbye and Good Riddance* uses, and anything that exists only
in games or comics.

## Series-specific designs

The same alien can have distinct designs per era; each appearance references artwork for *that* design. Where the
wiki labels a design "UAF" (identical in AF and UA) the same file is used for both cards. Design revisions inside
Omniverse (Swampfire's blooming redesign, Chromastone OV1/OV2, Rath's three variants) use the later/most-used
design with the alternative noted. Upchuck's Perk vs Murk variants are one card per era with the variant chosen to
match that era (Perk in OS, Murk in AF/UA, Perk render on the OV card with Murk in notes).

## Uncertain or editorial

* **Way Big's debut** — the wiki lists *Ken 10* (Ben 10,000); by air date *Secret of the Omnitrix* was earlier and was
  Ben's own first use. We follow the wiki and note both.
* **Clockwork's debut** — Gwen used it first on-screen (*Inspector 13*); Ben's first on-screen use is *Catch a Falling
  Star*. Debut recorded as Ben's first use.
* **Ultimate Humungousaur** — first on-screen use was Albedo's (*The Final Battle*); Ben's first use is *Too Hot to
  Handle* (UA). Debut recorded as the wiki's, with Ben's first use on the appearance.
* **Homeworlds** with retcons: Alien X (Forge of Creation; Zvezda retconned), Chromastone (Petropia; MorOtesi
  retconned), Goop (Viscosia; native world destroyed), Way Big (To'kustars have no home planet — left blank),
  Nanomech (hybrid, no homeworld).
* Several OV aliens have species "Unknown" on the wiki (Astrodactyl, Atomix, Ball Weevil, Gutrot, Kickin' Hawk,
  Mole-Stache, Toepick) — kept as Unknown, not invented.
* Weaknesses for Spitter, Arctiguana, Ultimate Cannonbolt, Ultimate Wildmutt and the fusions have no wiki section
  and are marked as inferences in their notes.
* Ben Archive: the wiki gives one outfit for all of AF + UA (only the device changes); "Goodbye and Good Riddance"
  Ben is a non-canon what-if and is excluded; the "Gwen 10" Ben is also excluded as non-canon; Ben 10,000 is one
  wiki character split here into OS / UA / OV records for the archive; UA Ben 10,000, Ultimate Ben and No Watch Ben
  have no official renders (screenshots used).

## Artwork status

All 180 manifest assets — 154 alien-era images (153 in the vault + the excluded Eon), 22 Ben images (21 in the archive +
the excluded Gwen-10 Ben) and 4 devices — were downloaded from the wiki and **visually verified** (character + era design) — see `assets/asset-manifest.json` (`verification`, `notes`). A second pass
searched every gallery subpage for cleaner art and replaced four (Eye Guy OS official model, Shocksquatch UA
transparent render, an XLR8-only Heroes United frame, the 5½-year-old Ben model). Twelve alien images remain
episode screenshots because no render of that design exists anywhere on the wiki (Ghostfreak AF/UA, Ripjaws UA,
Stinkfly UA, Upgrade UA, Wildmutt UA, XLR8 UA, Ultimate Way Big, Ultimate Ben, Heat Jaws, Diamond Matter) — each is
noted in the manifest as the best available and should be swapped if better official art surfaces.
