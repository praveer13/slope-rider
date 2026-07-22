# Gameplay screen contract (pinned decisions — build agents read this)

## Anatomy

- One `RideSession` (kit Session subclass) drives the whole runner; no dock,
  no tray, no GO button (`go()` is a no-op stub for the abstract surface).
- HUD row: back IconButton, pause IconButton, StarMeter (discrete,
  stars-earned-so-far), SlopeChip slot. AreaBar rides the bottom edge above
  the safe-area, full width.
- Intro card scrim: level name, goal, coach (≤ 6 words); the run starts on
  the first carve input (not on a button).
- Pause sheet per kit pattern. Mid-level persist via sessionStorage
  (position, velocity, collected shards, chosen rule; boss: current ridge).

## Input zones (canon-pinned)

- **Carve zone:** top 75% of canvas — hold to carve (default) or tap to
  toggle (`carveInput: 'hold' | 'toggle'` in Settings, default hold).
- **Hop zone:** bottom 25% of canvas (≥ 120px) — tap while grounded = hop.
- Translucent touch dot at the contact point; rider anchored at 40% screen
  height from top (thumb never covers the rider or landing zone).
- pointercancel = release (same as lift). No drag gestures anywhere.

## Camera

- `contentBounds()` returns ONLY the spawn viewport for Session.begin()'s
  fitWorld (`x₀−4 … x₀+12`, `y₀−3 … y₀+7`). NEVER call fitWorld/frameContent
  after begin. Follow cam: game-side per-frame `cam.cx/cam.cy` easing per
  design §5.2 (lookahead + 40% anchor).

## Chips (stealth bridge)

- **SlopeChip:** two rows — big speed |v|, small slope f′(x) with tilting
  hill glyph. mathLabels swaps glyph → `f′(x)=…`. Tap → Nerd Note
  BottomSheet (zone card). No long-press. Slope and speed are never merged
  into one number.
- **AreaBar:** glow gauge filling A(x) = F(x) − F(x_start) (closed form);
  pulses at 70% / 100% (star thresholds). Shard chime pitch rises with A.
- **Pencil chip (Z6 only):** opens the rule editor mid-run (pauses physics);
  steppers 44px, 0.1 steps; defaults pre-set to a solvable rule; pre-run
  sheet skippable.

## Ghost hint

- Game-side ghost-rider replay (NOT kit hintPath): canonical line sampled at
  120 Hz (`{x, y, ẋ, ẏ, carving}[]`), translucent rider, plays after 3
  failed attempts or 30s idle. hintPath() returns null.

## Physics render

- Fixed 120 Hz accumulator on kit rAF; render alpha-interpolates previous ↔
  current state (game-side). 60 Hz physics fallback when
  `navigator.hardwareConcurrency ≤ 4` (identical outcomes).
- Perf caps: ≤ 200 terrain samples per visible span, ≤ 40 speed lines,
  avalanche = scrolling texture (no particles).
