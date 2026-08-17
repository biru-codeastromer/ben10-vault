# Power Score methodology (editorial — not canon)

Every transformation in the Vault carries a **Power Score from 50 to 200** and a **power class**. This is an
editorial system created for this project; it is *not* official Ben 10 canon and it is not a popularity poll.
It is designed to be transparent, recalculable and defensible from what the shows actually put on screen.

The implementation lives in [`src/data/scoring.ts`](../src/data/scoring.ts); ratings live in the research files
(`research/aliens/<id>.json → scoring`) and are compiled by `scripts/build-data.ts` into `data/aliens.json`.

## 1. Dimensions (0–10 each)

| dimension | weight | what it measures |
|---|---|---|
| strength | 1.0 | lifting / striking power |
| durability | 1.0 | how much punishment the body absorbs |
| speed | 0.8 | movement / reaction speed |
| mobility | 0.8 | flight, phasing, burrowing, climbing, wall-crawling |
| offense | 1.2 | destructive output (melee + ranged) |
| defense | 1.0 | shields, armour, intangibility, evasiveness |
| special | 1.2 | signature powers that win fights on their own (time control, possession, gravity…) |
| versatility | 1.0 | how many kinds of situations the form handles |
| intellect | 0.6 | tactical / technical intelligence in the form |
| energy | 0.7 | energy projection, absorption, redirection |
| regeneration | 0.5 | healing, regrowing, reforming |
| survivability | 0.5 | space, deep sea, lava, radiation… |
| range | 0.6 | reach of its powers |
| cosmic | 1.6 | reality / time / space / dimensional manipulation |

Anchored rubric (excerpt from `research/RESEARCH_SPEC.md`): strength 3 = human, 6 = lifts vehicles (Four
Arms ≈ 8), 10 = planetary (Way Big); speed 8 = supersonic (Jetray/XLR8 ≈ 9); intellect 9–10 = Grey Matter /
Brainstorm; cosmic 7 ≈ Clockwork, 10 = Alien X.

## 2. Penalties

* **weaknessPenalty 0–5** × 2.5 raw points — exploitable weaknesses (Ghostfreak's light 3, Big Chill's heat 2, Alien X's personality deadlock 5).
* **controlPenalty 0–3** × 2.0 raw points — how hard the form is for Ben to use (Rath's temper 2, Way Big's size in cities 2).

`raw = Σ weight × rating − 2.5 × weakness − 2 × control` (maximum possible raw = 125).

## 3. Normalisation to 50–200

`raw` is mapped onto the 50–200 scale with a **piecewise-linear curve through fixed anchors** calibrated on the full
researched roster (81 vault forms):

| raw | score | meaning |
|---|---|---|
| 15 | 50 | floor (Walkatrout) |
| 52 | 105 | the median transformation |
| 66 | 150 | Legendary threshold (Way Big–class) |
| 78 | 190 | Atomic-X–class |
| 100 | 199 | ceiling for unpinned forms |

Only an **editorially pinned** entry can reach 200 (`data/overrides.json → pinnedScores`). Alien X is pinned at
200/200; his raw (106.5) would sit above the ceiling anyway.

The build validates that every Ultimate form outscores its base form and prints the class distribution.

## 4. Power classes

| class | score | tier | visual treatment |
|---|---|---|---|
| Standard | 50–79 | 1 | matte era frame |
| Advanced | 80–99 | 2 | brighter edge, inner glow |
| Elite | 100–119 | 3 | brushed-metal frame, embossed edge |
| Apex | 120–139 | 4 | rotating energy border, ray backdrop |
| Legendary | 140–164 | 5 | holographic foil, sparks, white name |
| Cosmic | 165–199 | 6 | deep-space frame, starfield, violet aura |
| Infinite | 200 | 7 | black card, luminous white edge, living starfield — Alien X only |

Current distribution (Aug 2026 build): 7 / 21 / 23 / 20 / 5 / 3 / 1.

Top of the vault: Alien X 200 · Atomic-X 189 · Ultimate Way Big 178 · Ultimate Ben 166 · Atomix 155 ·
Clockwork 153 · Ultimate Swampfire 152 · Way Big 151 · Ultimate Big Chill 148.
Bottom: Walkatrout 50 · The Worst 58 · Grey Matter 60 · Toepick 72 · Ditto 74 · Nanomech 75.

## 5. Calibration notes

* Ratings were produced by four research passes reading each alien's wiki page (powers, weaknesses, feats). A
  principal calibration pass then nudged six clear outliers (Diamondhead, Upgrade, Frankenstrike, Buzzshock,
  Four Arms, Ripjaws) by 1–2 points on a few dimensions so batches were consistent; each edit is recorded in
  that alien's `notes`.
* Ultimates rate above bases by construction of the rubric; the build fails loudly if not.
* Fusions (Biomnitrix / Omnitrix malfunction) rate roughly like their stronger component.
* Every card's detail view shows the 14 ratings, penalties and a written rationale so the score can be argued with.

## 6. Recalculating

Edit `research/aliens/<id>.json → scoring`, or the weights/anchors in `src/data/scoring.ts`, then run
`npm run data:build`. The report prints the new distribution and any Ultimate < base violations.
