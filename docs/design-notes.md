# Design notes

## Product stance

A **digital Omnitrix museum + premium trading-card collection**, not a wiki and not a dashboard. Everything on
screen is generated from data (`data/*.json`), but the presentation is opinionated: four eras with their own
identity, a card system with seven visual tiers, and interaction that feels like handling the watch.

## The four eras

References were pulled from official device renders before drawing anything (see `research/qa/contact-sheets/all-15.png`
for the four device references side by side).

| era | device | drawn as | identity |
|---|---|---|---|
| Ben 10 (2005) | Prototype Omnitrix | black/dark-grey ribbed band, light clasp tabs, grey bezel with four green studs, **green face with black hourglass** | chunky, rounded, black/green/white; **Titan One** display type; radius 22px; hex-grid texture; ray/particle backdrops |
| Alien Force | Recalibrated Omnitrix | green tapered band with black centre stripe, grey segmented bezel, **black face with bold green hourglass**, side pins | mature, sharp, dark; **Michroma** (wide geometric); radius 10px; fine grid lines; gunmetal card frames |
| Ultimate Alien | Ultimatrix | bulky green gauntlet with black panels & vents, four-lobe grey dial ring, black face with angular green hourglass | dangerous, evolved; **Orbitron**; radius 12px; diagonal hatching; black-green frames, violet for Cosmic |
| Omniverse | Omnitrix (completed) | white band with green edges, green rounded housing, black square face with green hourglass, three dots | energetic, white + green; **Bungee**; radius 14px; cross-hatch texture; **white card frames** on base tiers, light band behind the hero |

Each era sets CSS tokens (`[data-era]` in `src/styles/tokens.css`): accent, glow, ink, display font, radius,
background pair. Everything else derives from those.

The hourglass mark itself has era variants (`src/components/omnitrix/Hourglass.tsx`): a slimmer bow-tie for 2005,
heavier waist for later eras.

## Homepage

Big title in Titan One (white BEN 10 / green VAULT with hard shadow), one-line lede, three stats, then the four
devices as large interactive objects (SVG, 400×400 design space, dial centred). Interaction: hover charges the
face, nudges the dial +24°, lifts the object, runs a light sweep and plays a dial tick; click plays the era's
activation cue, snaps the dial to 120°, and a full-screen radial flash with the hourglass wipes to the wall.
Pointer parallax tilts the whole scene a few degrees. All motion honours `prefers-reduced-motion`.

## The card

Portrait 5:7. Name in the era's display font top-left, the era's Omnitrix badge top-right, the artwork in a
framed window with an era backdrop, then score (big numeral /200), class, species · homeworld and up to three
ability chips (shortened for the face; full text in the detail view). Pointer tilt (±9°/±11°) with a specular
highlight that follows the cursor; the artwork lifts on hover. Ultimates get an "ULTIMATE" kicker; fusions and
Ben 10,000 forms get corner tags.

Tier treatments deliberately change *materials*, not just border colours — see `docs/power-scoring.md §4` and
`src/components/cards/AlienCard.css`. On narrow grids container queries compact the card (smaller name, no chips).

## Detail view

Route-based modal (`/era/:series/:alien`) so cards are linkable. Showcase card on the left; on the right: summary,
facts grid, this era's design notes with "also appears in" chips (switch to the same alien's other-era design),
abilities / weaknesses, feats, traits, the full score breakdown with animated bars, related forms (base /
Ultimate / components), canon notes and sources. ← → keys step through the current wall order; Esc closes.

## Typography

Ben 10's real logo faces aren't freely licensed; the stand-ins were chosen for silhouette: Titan One's chunky
rounded caps for 2005, Michroma's wide angular caps for the AF logo feel, Orbitron for the Ultimatrix HUD look,
Bungee's heavy blocks for Omniverse's graphic style. UI/metadata use Barlow Condensed; body Barlow. All bundled
locally (`public/fonts`, OFL).

## Things deliberately not done

* No transformation sequences or character animation — motion is limited to lighting, dial movement, card
  entrance/tilt, transitions and particles.
* No sound without a gesture, no music.
* No Reboot content anywhere.
