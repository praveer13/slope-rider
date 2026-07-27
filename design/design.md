# SLOPE RIDER — Design v3
*Game 3 of the Quantum Path series. Calculus, felt — not taught.
v3 supersedes v2 (archived in `design-v2-archive.md`): v2's hold-to-carve riding
was a 3-second spectator sport — one passive verb, no decisions, portrait
starved the very hill-reading it asked of the player. v3 keeps the fantasy,
the physics, the curriculum and the boss, and replaces the core loop.*

---

## 1. Concept

Vex rides light-lines across the hillside — **and you draw the lines.**

The terrain **is** a function. You sculpt it with one finger. Then Vex rides
what you drew, and the hill tells you the truth about your drawing: too flat
here and you stall; too steep there and the ink runs out; a well-placed crest
hands you the sky. Nobody says "calculus" until the Nerd Notes.

**Core loop — SHAPE → RIDE → TUNE:**

1. **SHAPE.** The level shows fixed bedrock, a start pad, a gate, floating
   light — and one or more dashed *gaps* in the hillside. Drag the glowing
   knots up/down to lay your light-line across each gap. One finger,
   vertical drags only, generous targets. The line paints itself with its
   own steepness as you draw (§5.3) and the ink meter ticks down.
2. **RIDE.** Tap **Ride**. Vex drops onto your line and physics takes over —
   the exact simulation from v2 (§5.2). Hold to carve (grip bonus), release
   to coast, tap to hop. Speed lines, apex slow-mo, shard chimes. A ride is
   4–8 seconds of verdict.
3. **TUNE.** Stall, miss the gate, come up short on a portal — the run
   freezes at the moment of failure, marks *why* ("stalled here — steeper
   before this"), and drops you back into SHAPE with your line intact.
   No fail screen, no lives, no timers. Third failed attempt: a ghost line
   shows one working shape (canon ghost-hand).

Shaping is untimed and unhurried; riding is the reward. Levels are puzzles
with many solutions, not reflex tests.

**Why v3 (the mechanics post-mortem, for the series log):**
- v2's only verb was *hold*. Decisions make games; v3's verb is *design*.
- v2 levels lasted 2–4 s at 16–18 u/s; nothing could develop. v3 pacing is
  player-owned: minutes to shape, seconds to ride.
- Portrait showed ≈ 8 u of a momentum game — you could never read the hill.
  In v3 the whole hill is on screen while you shape it; the camera only
  chases during the ride, when reading is done.
- v2's "speed IS the derivative" was ornament — the sim ran on energy, the
  chip showed f′ = −0.1 while speed read 18. In v3 the mapping is *mechanical*:
  you manipulate f, acceleration follows −f′, the AreaBar fills with ∫f, and
  the line you draw is tinted by its own derivative. The math is load-bearing.

**Stealth contract (unchanged):** math vocabulary never gates progress. Real
terms (`f′(x)`, `∫f dx`, critical point, FTC, ODE) live only in Nerd Notes
and the opt-in `mathLabels` setting.

## 2. The verbs

- **Drag a knot (SHAPE):** press within 44 px of a knot, drag vertically.
  Knots sit on fixed x *staves* — a function has exactly one height at every
  x, and the editor enforces it by construction (stealth: the vertical-line
  test is the input scheme). Knots snap to 0.25 u with a haptic tick.
  Immediate feedback: line re-fits live, steepness tint repaints, ink meter
  updates, slope glyph at the dragged knot.
- **Tap Ride (SHAPE→RIDE):** the big button. Disabled with a shake + reason
  if the line is over budget.
- **Hold (RIDE):** carve — tangential grip bonus while grounded (§5.2).
- **Release (RIDE):** coast — leave the curve on its tangent, fly ballistic.
- **Tap (RIDE):** hop — small perpendicular impulse, shard grabs and line
  corrections. Grounded only, 0.25 s tap window.
- **Back to SHAPE:** automatic on failure (freeze → dissolve → edit), or the
  pencil IconButton mid-run (free, unlimited, no penalty).

One finger, no multi-touch, no drag-precision beyond "near a knot, move up
or down". Whole-screen hold during RIDE. Touch targets ≥ 44 px.

## 3. Curriculum arc & zone map

54 levels = 6 zones × (8 + finale). Economy identical to series: first clear
75 XP / 10 gears + 5×starDelta; repeat 15 XP / 2 gears + 5×starDelta; finale
bonus +50 gears +100 XP; boss 150 gears / 200 XP. Stars: 1★ reach the gate;
2★ ≥ 70% light; 3★ 100% light. No timers, no move-pars.

| Zone | Name | Accent | Stealth idea (shaping verbs) | Real concept (Nerd Notes) |
|---|---|---|---|---|
| 1 | First Descent | mint | down = go; up = stop; draw the drop | slope sign, rise/run |
| 2 | Steep Reading | cyan | steep is fast but costs ink; the line wears its number | derivative f′(x), magnitude/sign |
| 3 | Apex Ridge | violet | crests launch, bowls slingshot; place them on purpose | critical points, maxima/minima |
| 4 | Lightfields | amber | light piles up *under* your line; spend area where it counts | accumulation, ∫f dx |
| 5 | Portal Peaks | magenta | doors trade height-pile for speed, exactly; arrive prepared | FTC: ∫f′ = Δh |
| 6 | Wind & Spring | coral | write the rider's motion rule, then shape around it | ODEs: ẍ = k, ẍ = −k(x−x₀) |
| B | The Avalanche | — | outrun the white wall on pure riding | pursuit: reading f′ at speed |

Every level has at least one **shape window** (§4) except boss ridges, which
are pure fixed-terrain rides — the boss is where riding skill, built across
54 shaped levels, gets its set piece.

## 4. Level anatomy & tables

A level is: fixed bedrock segments (the §5.1 library), **shape windows**,
shards, a gate, a spawn. A shape window:

```
shape: {
  x0, x1        — span; joins bedrock (or another window) at both ends
  knots         — interior knot count; knot x's evenly spaced, fixed
  minY, maxY    — per-window vertical clamps for every knot
  startY, endY  — anchor heights (default: neighbor terrain at x0/x1)
  ink?          — optional arc-length budget for the window's curve
  slopeClamp?   — optional |f′| cap enforced while dragging (Z2+)
  solution      — canonical knot y's (harness witness + ghost hint)
}
```

The player's line through a window is a **C1 cubic Hermite spline** through
anchor–knots–anchor (Catmull-Rom tangents, §5.1). The window curve is C0
with the bedrock at anchors (C1 when the level pins `startSlope/endSlope`).

**Authoring constraints (harness-enforced):**
- Level length 34–64 u; terrain within y ∈ [−6, +14]; fixed segments ≤ 4;
  shape windows ≤ 3 per level; knots per window 2–7 (Z1: 3–5).
- Every level ships `solution` knots; harness simulates the canonical ride
  on the solved curve and it MUST 3★ (gate + 100% light + no stall).
- Shard placement: grounded shards sit 0.5 u above the *solved* curve
  (harness lints |shard.y − f(x) − 0.5| < 0.6 unless `air`); air shards
  within the canonical coast arc (±1.0 u).
- Difficulty per zone: knot count and window count rise; ink tightens
  (Z1: no ink limit → Z4: ink forces area choices); air-shard share ≤ 40%
  until Z3; approach speed at any goal ≤ 8 u/s.
- Portals (Z5): grounded exits only, |Δh| ≤ 4, arrival speed 12 u/s
  suffices, E conserved < 1e-9 (§5.6).
- Coach ≤ 6 words, shaping-phrased ("Drop the middle knots.").

**Zone beat notes (what the puzzles teach):**
- **Z1** windows are gentle bowls/hills between bedrock; solutions are
  near-monotone descents. Teaches: gravity reads your drawing.
- **Z2** `slopeClamp` appears (the line refuses to draw steeper than the
  cap — the cap is the lesson); ink appears; steep-vs-ink tradeoffs.
- **Z3** shards sit above gaps that only a well-placed crest launch can
  reach; bowls that slingshot. Spawn mid-curve is allowed.
- **Z4** ink is tight; the AreaBar is the star of the HUD; high lines hold
  more light but cost more ink — place area deliberately.
- **Z5** portals on bedrock; windows before gates to bank height/speed for
  the exact trade; portal refusal teaches arrival-speed reading.
- **Z6** pre-run rule sheet (steppers, 44 px, 0.1 steps, defaults solvable)
  + shape windows tuned to the rule: wind lets you draw *uphill* lines;
  spring slings you back to center. Harness: solvable k passes, ±1 stepper
  step fails (the rule matters).

Level tables live in `src/game/levels.ts` (data, one line per level, same
compact style as v2) with the full 54-level rebuild per these beats.

## 5. Canonical math & physics (implementer contract)

### 5.1 Terrain function library — closed forms only

v2 kinds unchanged. New kind for player lines:

| kind | f(x) on [x0,x1] | f′(x) | F(x) (∫f) |
|---|---|---|---|
| ramp(m,c) | m·x + c | m | m·x²/2 + c·x |
| poly2(a,b,c) | a·x² + b·x + c | 2a·x + b | a·x³/3 + b·x²/2 + c·x |
| sine(A,ω,φ,y0) | A·sin(ωx+φ) + y0 | A·ω·cos(ωx+φ) | −A·cos(ωx+φ)/ω + y0·x |
| exp(A,k,y0) | A·e^{kx} + y0 | A·k·e^{kx} | A·e^{kx}/k + y0·x |
| **hermite(x0,y0,m0,x1,y1,m1)** | cubic Hermite: h₀₀(t)y₀ + h₁₀(t)Δx·m₀ + h₀₁(t)y₁ + h₁₁(t)Δx·m₁, t=(x−x0)/Δx | quadratic (closed form) | quartic (closed form) |

Hermite tangents from knots: Catmull-Rom, `mᵢ = (yᵢ₊₁ − yᵢ₋₁)/(xᵢ₊₁ − xᵢ₋₁)`,
ends one-sided; with `slopeClamp`, tangents clamp to ±cap per piece.
Harness cross-checks |F′ − f| < 1e-9 and |f′ − d_central f| < 1e-6 at 100
points per piece, all kinds, hermite included. No numeric differentiation
in physics. Arc length (ink): 32-sample Simpson per piece — display and
budget only, never physics.

### 5.2 Simulation — unchanged from v2

Fixed 120 Hz, accumulator on rAF, render interpolation. Velocity Verlet.
Grounded: constrained-curve dynamics with curvature correction,
`ẍ = −(g·p + p·q·ẋ²)/(1+p²) + a_c/√(1+p²) − c_d·ẋ|ẋ| + rule`, carve bonus
`a_c = 6` held / 0 coasting, g = 18, drag c_d = 0.015, |v| backstop 18.
Airborne: `ẍ = (0,−g)`; hop `v += n̂·5.5`. Landing CCD: swept substeps +
bisection to 1e-6; inelastic (keep tangential). Camera lookahead
`x + clamp(ẋ·0.35, 1, 4)`, apex slow-mo 0.35× ≤ 0.8 s (cooldown 3 s,
reduce-motion off). Deterministic: identical inputs → identical trajectory.

**Tuning fix from v2 telemetry:** v2 hit the 18 u/s backstop inside 2 s,
flattening all feel. v3 raises the display-relevant band: speed clamp
|ẋ| ≤ 16 unchanged, but `CARVE_ACCEL` and drag rebalance so typical ride
speeds sit 6–14 u/s and 18 is a genuine redline. Exact constants tuned in
the feel pass (§12) and recorded in `calculus.ts`.

### 5.3 The line wears its derivative (stealth bridge #1)

The shaped line is **tinted by f′ along its length**: hue interpolates
mint (flat) → cyan/violet (steeper down) → amber/red (uphill), magnitude
drives saturation; colorblind modes map sign to tint *and* dash texture
(downhill solid / uphill dashed), never color-only. While dragging, the
SlopeChip shows the glyph at the knot; mathLabels shows `f′(x) = …`.
The rider's SpeedometerChip (ride phase) is unchanged: speed + hill-tilt
glyph of f′ under the rider.

### 5.4 Light & area (stealth bridge #2)

Shard pickup radius 0.75 grounded / 0.9 air (v2 constants). AreaBar fills
`A(x) = F(x) − F(x_spawn)` closed-form over the ridden span — now including
player-drawn hermite pieces, which is why hermite ships a closed-form F.
Z4+ pulses at 70 %/100 %.

### 5.5 Rule editor (Z6) — unchanged

Pre-run BottomSheet: wind `a += k`, spring `a += −k·(x−x₀)`, steppers in
level ranges, defaults solvable, persists per level. Now composed with
shaping: the ride sim applies rule terms on any terrain (fixed or drawn).

### 5.6 Portals (Z5) — unchanged

`|v_out| = √(v_in² + 2g(y_in − y_out))`, exact, harness asserts < 1e-9;
radicand ≤ 0 → refusal toast, no fail. In v3 refusal returns to SHAPE with
the marker "arrive faster — bank more height before the door".

## 6. Failure, hints, and the TUNE phase

Failure taxonomy (all → freeze 0.9 s at the moment, reason marker, dissolve
back to SHAPE with the player's line intact; attempts++):
- **Stall:** |v| < 0.05 for 0.5 s grounded before the gate → marker at the
  stall point: "stalled — steeper before this". (The v2 auto-nudge is gone:
  stalling is design feedback, not a softlock to paper over.)
- **Gate miss:** rider leaves the last terrain x without crossing the gate
  → marker at the gate: "the gate is here".
- **Portal refusal:** §5.6 marker.
- **Fell forever:** y < minY − 8 (bad coast) → marker at launch point.

**Ghost hint (canon):** attempts ≥ 3 in a level → the solution knots render
as a translucent ghost line + pulsing rings on outlying knots ("one way,
not the way"). Dismissable; never forced. Also available from the pause
sheet at any time. Ghost-hint setting gates it series-wide.

**Pause sheet:** Resume / Edit line / Restart ride / Ghost hint / Map.
Mid-level persist (knot y's, phase, attempts, rule, sessionStorage) exactly
as series.

## 7. Solvability harness (canon DoD)

`scripts/verify-levels.ts` (`npm run verify`, target < 30 s):
- **Math core cross-check:** every segment kind incl. hermite: closed-form
  f′ and F vs central differences (§5.1 tolerances), 100 pts/piece.
- **Solution build:** per level, `solveTerrain(level)` must satisfy: knots
  within clamps, ink ≤ budget, C0 at anchors (< 1e-9), shard altitude lint
  (§4), coach ≤ 6 words, ids unique.
- **Canonical ride:** simulate the scripted controller (carve except listed
  coast windows/hops) on the solved curve at 120 Hz: reaches gate, 100 %
  light, zero stalls; portal transits conserve E < 1e-9; Z6 solvable k
  passes AND the zeroed-rule sim fails (the rule must matter); FTC levels
  assert trade within 1e-9.
- **Difficulty guards:** knot/window counts within §4 bounds; approach
  speed at goal ≤ 8 u/s for non-finale Z1–Z2.
- **Boss:** canonical line per ridge; finish ≥ 90 % light, never caught.
Output `✓ <id> <name>` per level, non-zero exit with evidence dump on
failure.

## 8. Screens

Chrome reuses the kit shells (Home/Map/Results/Profile/Codex/Settings) —
**vendored** into this repo (§12); zone accents unchanged.

**Gameplay screen** has two modes on one canvas:
- **SHAPE mode:** world camera framed to the whole level (fit + 10 % pad,
  portrait-safe). Dashed span markers over windows; knots as 28 px glowing
  beads (44 px hit areas); dragged knot gets a vertical guide rail and
  y-value tooltip (glyph, or `y = …` with mathLabels). HUD: back, StarMeter
  (light positions preview), ink meter per window (when budgeted), SlopeChip,
  **Ride** NeonButton (bottom center, 56 px), pencil auto-hidden. Intro card
  scrim per level (name, goal, coach ≤ 6 words, "Drag the knots. Tap Ride.").
- **RIDE mode:** v2's ride presentation wholesale: SpeedometerChip, AreaBar,
  camera chase, speed lines, slow-mo, carve sparks. Pencil IconButton (top
  right) returns to SHAPE. Freeze markers per §6.

**Map/Home/Results:** unchanged except copy verbs ("Shape" not "Hold").
Results gains a *your line* thumbnail (the exact curve you cleared with —
a little receipt of authorship).

## 9. Sensory & accessibility

Series palette; zone accents; derivative tint per §5.3 with colorblind-safe
sign encoding (tint + dash). SFX: new **shape ticks** (knot quanta, pitch
rises with y), **line chime** when a drag releases inside budget, **over-budget
buzz**; ride SFX unchanged (carve loop 220→880 Hz, coast wind, landing thump,
shard chime rising with A, portal two-tone). Haptics: knot snap tick, ride
rumble speed-scaled, landing bump, failure *thud-soft* (never harsh).
All behind kit settings (volumes, haptics, reduceMotion — kills slow-mo,
camera ease, and the freeze dissolve; gridIntensity; colorblind 4-way;
mathLabels; ghostHints). Portrait 360×640 → 480×1024; one finger; nothing
timed. **Global `user-select: none` + `-webkit-touch-callout: none` +
`touch-action: none` on canvas, `contextmenu` suppressed** — long-press is
a game input; it must never summon the OS selection UI (v2 bug).

## 10. Codex — 18 concept cards (verbs updated, Nerd Notes unchanged)

Same 18 cards, fronts re-verbed for shaping (≤ 30 words + art). Examples:
1. **The Push** — "Draw the hill down and it pushes you. Steeper down, bigger push." / a = g·sinθ.
4. **Rise Over Run** — "Every line you draw has a number: how much up for how much across." / slope m = Δy/Δx.
5. **The Speedometer** — "Your line's number is the rider's steering wheel." / derivative f′(x).
7. **Flat Tops** — "Where your line's number is zero, things get interesting." / critical points.
10. **Piling Up** — "Light doesn't vanish. It piles up under your line." / A(x) = ∫ₐˣ f.
13. **The Trade** — "Doors trade height-pile for speed. Exactly." / FTC.
16. **The Wind Rule** — "Write a number k. The wind pushes k-hard, always — even uphill." / ẍ = k.
18. **Rules Make Shapes** — "Every motion rule draws its own hill in your head." / ODE solution curves.
(Full copy pass in build; Nerd Notes and Archive Fragments unchanged from v2
§11 — Galileo, Malthus, Leibniz stay verbatim-verified.)

## 11. Boss — THE AVALANCHE (unchanged)

Three ridges of fixed terrain, pursuit wall `w(t)` starts 2 u/s under rider
speed, +0.5 u/s per ridge; soft-rewind + ghost replay when caught; stars by
light (3★ ≥ 90 %). The boss is the one pure-riding level family — the
skills 54 shape-ride-tune loops build, cashed in at speed.

## 12. Build notes

- **Engine independence:** the gridverse-kit is *vendored* into `src/kit/`
  and slimmed to what this game uses. The repo builds standalone — no
  sibling checkout, no `file:` dependency. Series chrome patterns stay;
  the code is ours to bend.
- **History hygiene:** in-app navigation must not touch `window.history`
  (v2 bug: every screen was a history entry). Memory router; deep links
  intentionally unsupported on the static host.
- `createGameStore({ saveKey: 'slope-rider-save-v1' })` — **save key
  bumps to `slope-rider-save-v3`** (level format changed; v2 progress is
  not migratable and the game is pre-release).
- Feel-tuning loop (series routing note): after build, run headless,
  screenshot SHAPE + apex + freeze-marker moments, iterate §5.2 constants
  until a stall/launch reads at a glance.
- Vite build: `npx vite build --base=/slope-rider/` passes, tsc clean,
  `npm run verify` green — canon DoD.
