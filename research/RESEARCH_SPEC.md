# Ben 10 Vault — Research Spec (for research agents)

Scope: **classic continuity only** — Ben 10 (2005, "OS"), Alien Force ("AF"), Ultimate Alien ("UA"), Omniverse ("OV").
Never include Reboot (2016) content.

## Inputs you already have locally
- `research/wiki-cache/<Page Title>.wikitext` — raw wikitext of the Ben 10 wiki page (ben10.fandom.com).
- `research/wiki-extract.json` — mechanically parsed infobox facts (species, home planet, powers list,
  first appearance, infobox image gallery with series labels OS/AF/UA/UAF/OV, section headings, and the
  headings under the page's `Appearances` section).
- The wiki API works from this machine (curl with any User-Agent). Useful calls:
  - wikitext:  `https://ben10.fandom.com/api.php?action=parse&page=<Title>&prop=wikitext&format=json`
  - images on a page: `...&prop=images`
  - gallery subpages exist for many aliens, e.g. `Jetray (Classic)/Gallery/Omniverse`, `Four Arms (Classic)/Gallery`
  - image info: `https://ben10.fandom.com/api.php?action=query&titles=File:<name>&prop=imageinfo&iiprop=url|size|mime&format=json`
  - Direct page HTML is blocked (403); ALWAYS use api.php.
- Do NOT download images into the repo. Only name candidate files; a pipeline script downloads them.
  You MAY download an image to the scratchpad dir and open it with the Read tool to visually verify.

## Series ids
`os` = Ben 10 (2005–2008), `af` = Alien Force (2008–2010), `ua` = Ultimate Alien (2010–2012), `ov` = Omniverse (2012–2014).

## Ben-version ids (who transformed)
`ben-10-os` (10-year-old Ben, OS incl. Secret of the Omnitrix / Destroy All Aliens),
`ben-15-af` (15-year-old, AF S1–2), `ben-16-af` (16, AF S3), `ben-16-ua` (Ultimate Alien),
`ben-16-ov` (Omniverse present day), `ben-11-ov` (Omniverse flashbacks),
`ben-10-ua` (10-year-old Ben in UA time-travel episodes), `ben-10-ov` (10-year-old in OV),
`ben-10k-os` (Ben 10,000, OS future), `ben-10k-ua` (Ben 10,000 Returns), `ben-10k-ov` (Omniverse Ben 10,000 / Biomnitrix),
`ben-5` (4/5-year-old Ben), `albedo` (NOT a Ben — note when a form was only used by Albedo), `other`.

## What counts as an "appearance" for the wall
An alien gets an `AlienAppearance` for series X only if **a version of Ben** transformed into it on-screen in
series X (TV episodes or the canonical movies of that era: *Secret of the Omnitrix*, *Race Against Time*
(flag as alternate timeline), *Destroy All Aliens*, *Alien Swarm*). Video games / comics do NOT count
(mention them in notes if useful). Forms used *only* by Albedo/Kevin/Gwen/Ben 23 in a series do not create an
appearance for that series (record that fact in `notes`).

Read the page's `==Appearances==` section (sub-headings like "Ben 10", "Alien Force", "Ultimate Alien",
"Omniverse", often further split "16 years old" / "11 years old" / "10 years old" / "By Ben 10,000" / "By Albedo").

## Design differences per series
The same alien often has different designs (OS vs UAF vs OV). Read `==Appearance==` → "Ben as X" for
per-series descriptions. Each appearance record needs a short `designNotes` string and an `image` choice
whose art matches that series. Infobox gallery labels: `OS`, `AF`, `UA`, `UAF` (shared AF+UA design), `OV`,
`OV1/OV2/OV3` (design revisions inside OV — choose the most-used / latest one and mention the other),
`HU` = Heroes United (Generator Rex crossover; UA-era design), `AS` = Alien Swarm movie, `(P)/(M)` = Perk/Murk.
When an alien has one infobox image but multiple series appearances, look for series-specific art in the
gallery subpages (`<Title>/Gallery`, `<Title>/Gallery/<Series>`) — prefer official model sheets / renders
with transparent backgrounds over episode screenshots. If a design is *identical* between AF and UA (the
wiki labels it "UAF"), the same file may be referenced for both.

## Output format
Write ONE JSON file per alien to `research/aliens/<slug>.json` (slug = lowercase-hyphenated name, e.g.
`four-arms.json`, `ultimate-humungousaur.json`, `stink-arms.json`).

```jsonc
{
  "id": "four-arms",
  "name": "Four Arms",
  "wikiTitle": "Four Arms (Classic)",
  "kind": "standard",                 // "standard" | "ultimate" | "fusion"
  "species": "Tetramand",
  "homeworld": "Khoros",              // "" if unknown; "Unknown" if the wiki says unknown
  "bodyType": "Four-armed humanoid",
  "debut": { "episode": "Washington B.C.", "series": "os", "usedBy": "ben-10-os" },
  "baseFormId": null,                 // for ultimates: id of base alien; for fusions: null
  "ultimateFormId": null,             // for base aliens that have an Ultimate: its id
  "componentIds": [],                 // for fusions: ids of the component aliens
  "abilities": ["Enhanced Strength", "Enhanced Durability", "Enhanced Jumping", "Shock Wave Generation (via clapping/stomping)"],
                                       // curated 5–10 items, most important first, from the infobox powers + text
  "weaknesses": ["Large size makes stealth impossible", "Loses strength when sick"],  // curated 2–6, from ==Weaknesses==
  "summary": "Ben's 12-foot Tetramand strongman: four arms, red armour-plated skin, raw physical power.",  // 1–2 sentences, your own words
  "traits": ["12 feet tall", "four eyes"],   // 0–5 fun canonical traits
  "notableFeats": ["Overpowered Vilgax's drones (And Then There Were 10 era)", "..."],  // 2–6, cite episode names
  "appearances": [
    {
      "series": "os",
      "usedBy": ["ben-10-os"],
      "firstEpisode": "Washington B.C.",
      "notableEpisodes": ["Washington B.C.", "Kevin 11", "Secret of the Omnitrix"],
      "designNotes": "White T-shirt with black stripe, black pants, fingerless gloves; Omnitrix on upper-left shoulder; orange-yellow eyes; no hair.",
      "image": { "file": "Four arms os render.png", "label": "OS", "confidence": "high", "notes": "infobox render" }
    },
    { "series": "ua", "usedBy": ["ben-16-ua", "ben-10-ua"], "firstEpisode": "Fame", "notableEpisodes": [], "designNotes": "...", "image": { "file": "FourArmsUAOfficial.png", "label": "UA", "confidence": "high", "notes": "" } },
    { "series": "ov", "usedBy": ["ben-16-ov", "ben-11-ov"], "firstEpisode": "...", "notableEpisodes": [], "designNotes": "...", "image": { "file": "Four Arms OV Model.png", "label": "OV", "confidence": "high", "notes": "" } }
  ],
  "scoring": { /* see rubric below */ },
  "sources": ["https://ben10.fandom.com/wiki/Four_Arms_(Classic)"],
  "notes": ["Anything uncertain, conflicting, or worth flagging for canon QA."]
}
```

`confidence` for images: `high` = infobox/official render clearly labelled for that series; `medium` = gallery
image you believe is that series' design; `low` = best available, needs human check. Always add a `notes`
string explaining a `medium`/`low`.

## Power-score rubric (editorial, NOT canon)
Rate each dimension 0–10 using **demonstrated on-screen feats**, not popularity. Anchors:

| dim | 0 | 3 | 6 | 8 | 10 |
|---|---|---|---|---|---|
| strength | none | human | lifts cars/trucks (Four Arms ~8) | tosses buildings/ships (Humungousaur grown) | planetary (Way Big / Ult. Way Big) |
| durability | fragile | human | tanks explosions/heavy blows | shrugs off energy blasts/lasers | near-invulnerable |
| speed | very slow | human | vehicle speed | supersonic (Jetray/XLR8 ~9) | relativistic/teleport-like |
| mobility | stuck | walks | climbs/glides/swims well | true flight/phasing/burrowing | omni-mobility (flight+phase+space) |
| offense | none | punches | strong ranged/melee | city-block level | planet-busting |
| defense | none | dodges | shields/armor | near-untouchable/intangible | absolute |
| special | none | one gimmick | 2–3 useful powers | signature power that wins fights alone (Clockwork time) | reality-level |
| versatility | one trick | — | handles many situations | almost any situation | anything |
| intellect | feral | average Ben | clever use | genius (Grey Matter/Brainstorm 9–10) | omniscient |
| energy | none | minor | strong energy projection/absorption (Chromastone 8) | — | cosmic energy |
| regeneration | none | heals slowly | regrows limbs (Swampfire 8) | reforms from pieces (Goop 9) | cannot be destroyed |
| survivability | dies easily | human | extreme environments (space/lava/deep sea) | almost anywhere | anywhere incl. void |
| range | melee only | short | building-scale | city-scale | planetary/cosmic |
| cosmic | none | — | — | time/space/dimensional manipulation (Clockwork ~7) | full reality warping (Alien X 10) |
| weaknessPenalty (0–5) | no notable weakness | ... | serious exploitable weakness (Big Chill vs heat 2, Ghostfreak sunlight 3) | crippling (Alien X deadlock 5) |
| controlPenalty (0–3) | full control | occasional trouble | Ben struggles to use it (Rath temper, Way Big size in cities) | often unusable/dangerous |

Provide `"rationale": "2–4 sentences citing feats and weaknesses"`. Do NOT compute a total; a script does.
Alien X must be rated so it lands at 200 (all creation-level dims 10) — the pipeline pins it anyway.
Ultimate forms should score higher than their base form. Fusions score roughly like the stronger component.

Be honest and consistent: most aliens should land in the middle. Do not inflate.
