# Audio

Sound in the Vault is sparing, opt-out (global toggle, top right, persisted in `localStorage`) and never
autoplays — nothing sounds until the first user gesture. Implementation: [`src/lib/audio.ts`](../src/lib/audio.ts).

## Where sounds play

| moment | slot | default |
|---|---|---|
| hovering an Omnitrix on the homepage | `dial-tick` | soft click (throttled) |
| clicking an Omnitrix / entering an era | `omnitrix-activate-os` · `-af` · `-ua` · `-ov` | era-tuned activation chime |
| hovering an alien card | `card-hover` | near-silent tick (only on fine pointers) |
| opening / closing a card | `card-open` · `card-close` | short whoosh |
| toggling filters / sound | `dial-tick` · `ui-toggle` | click / two-tone |

## Replaceable asset slots

The engine first looks for a real sample at `public/audio/<slot>.mp3` (then `.ogg`, `.wav`). If a file exists it
is decoded and used; otherwise the cue is **synthesised** with the Web Audio API. To use real Omnitrix samples,
drop files with these names into `public/audio/` — no code changes needed:

```
public/audio/omnitrix-activate-os.mp3
public/audio/omnitrix-activate-af.mp3
public/audio/omnitrix-activate-ua.mp3
public/audio/omnitrix-activate-ov.mp3
public/audio/dial-tick.mp3
public/audio/card-hover.mp3
public/audio/card-open.mp3
public/audio/card-close.mp3
public/audio/ui-toggle.mp3
```

No copyrighted audio ships with the project; the folder contains only a README.

## The synthesised fallbacks

* **Activation** — three/four ascending blips (per-era waveform: square-ish for the prototype, triangle for the
  recalibrated Omnitrix, sawtooth-through-lowpass for the Ultimatrix, bright triangle for Omniverse), a swelling
  detuned sine chord with slow upward drift, a sub "whoom" and an airy noise sweep. ~1.2 s.
* **Ticks** — short sine ping with a filtered noise transient.
* **Whooshes** — band-passed noise sweeps.

All output passes through a master gain and a compressor so nothing clips.
