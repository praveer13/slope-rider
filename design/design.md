# SLOPE RIDER — Design
*Game 3 of the Quantum Path series. Calculus, felt — not taught.
Built on `@gridverse/kit`. Series canon AGENTS.md applies in full — this doc only
specifies what is new or different.*

---

## 1. Concept

Vex rides light-lines across an endless hillside. The terrain **is** a function.
Your speed **is** its derivative. The light you gather **is** the area under the
curve. Nobody says "calculus" until the Nerd Notes.

One thumb, one verb family: **hold to carve** (grip the slope, turn steepness into
speed), **release to coast** (fly ballistic), **tap to hop**. Everything else is
reading the hill: steep down = faster, flat top = launch window, uphill landing =
lost speed. Across 6 zones the player discovers, in order: slope is a number
(rise/run) → that number is the hill's speedometer (derivative) → hilltops and
valley floors are special (maxima/minima) → light piles up as area (accumulation)
→ area and speed trade back and forth through portals (fundamental theorem) →
the hill can follow *rules* you write (simple ODEs).

**Stealth contract:** math vocabulary never gates progress. Real terms
(`f'(x)`, `∫f dx`, critical point, FTC, ODE) live only in Nerd Notes and the
opt-in `mathLabels` setting. The SpeedometerChip + AreaBar are the stealth
bridge (§8).

## 2. The verb: CARVE / COAST / HOP

- **Hold (anywhere on canvas):** carve. While grounded, the rider sticks to the
  terrain curve and gains the carve bonus (§5 physics). Immediate juicy feedback:
  carve sparks, speed lines, rising pitch with speed.
- **Release:** coast. The rider leaves the curve along its current tangent and
  flies ballistically until the trajectory re-meets the terrain (landing, §5).
- **Tap:** hop. While grounded, a fixed perpendicular impulse (small; for shard
  grabs and line corrections, not for crossing gaps — gaps are for coasting).
- Input is one finger, no drag required, no multi-touch, no sustained precision
  pressure. Touch targets: the whole canvas is the hold area (≥ full screen);
  hop = tap < 250ms with < 12px movement.
- **Canon tension resolved:** an "avalanche" pursuit (boss) is spatial, not a
  countdown; there are NO timers, countdowns, lives, or fail screens anywhere
  (§7). Being caught = soft rewind to the last ridge checkpoint + ghost-hint
  replay, never punishment.

### Exactness contract (implementers: do not improvise)

- Terrain is **analytic**: every level's terrain is a list of segments from the
  function library (§5.1) with exact rational/simple coefficients given in §4.
  Implementers must NOT invent terrain math; coefficients come from this doc.
- Every terrain function ships its **closed-form** derivative `f'` and
  antiderivative `F` alongside `f`. The harness cross-checks
  `|F'(x) − f(x)| < 1e-9` (central difference, h = 1e-5) at 100 points per
  segment, and `|f'(x) − d_central f(x)| < 1e-6`.
- Positions/velocities are float64 (JS default). Locks/gates use `TOL = 0.25`
  world units for shard pickup (radius), gate crossing uses exact x comparison.
- Portal invariant (§5.6): `E = v²/2 + g·y` across a portal transit must
  conserve to `< 1e-9`.

## 3. Curriculum arc & zone map

54 levels = 6 zones × (8 + finale). Stars: per-level light + flow criteria
(§4 note; NO move-par in this game — riding has no discrete moves).
Economy identical to series: first clear 75 XP / 10 gears + 5×starDelta;
repeat 15 XP / 2 gears + 5×starDelta; finale bonus +50 gears +100 XP;
boss 150 gears / 200 XP.

| Zone | Name | Accent | Stealth idea | Real concept (Nerd Notes only) |
|---|---|---|---|---|
| 1 | First Descent | mint | hills push you; steep down = go | slope sign, rise/run |
| 2 | Steep Reading | cyan | the hill has a speedometer number | derivative f′(x), magnitude/sign |
| 3 | Apex Ridge | violet | tops & bottoms are special places | critical points, maxima/minima |
| 4 | Lightfields | amber | light piles up under the hill | accumulation, ∫f dx as area |
| 5 | Portal Peaks | magenta | portals trade height-light for speed | FTC: area↔speed inverse |
| 6 | Wind & Spring | coral | the hill follows rules you write | ODEs: ẍ = +k, ẍ = −k(x−x₀) |
| B | The Avalanche | — | outrun the white wall | pursuit on a slope (reading f′) |

## 4. Level tables

Star criteria: §3 (1★ finish; 2★ ≥ 70% light; 3★ 100% light — no timers,
no flow gates). Light: N shards, each at `(x_i, f(x_i)+0.5)` unless
`air y_i` given (coast grabs). Coach ≤ 6 words every level (harness lints).
Terrain notation: `kind(params) on [x0,x1]` per §5.1; `gap [a,b]` marks a
coast window (flight, explicitly NOT a C0 join). Coefficients with > 4
decimals are exact C0 joins against irrational sine values — do not round.

**Authoring constraints (harness-enforced):**
- Every level ships a `canonicalLine`: `{ goalX, coast: [x0,x1][], hops: x[] }`
  — the witness input script the harness simulates (§7). goalX = finish gate.
- Difficulty knobs escalate monotonically per zone: gap width ≤ 6u (Z1),
  ≤ 7u (Z2), ≤ 8u (Z3+); air-shard altitude ≤ 3u above the coast apex;
  Z1–Z2 shards strictly on the carve line; Z3+ ≤ 40% of shards off-line;
  approach speed at any goal ≤ 8 u/s required.
- Portals: grounded exits only (`y_out = f(x_b)`); height change across a
  portal `|Δh| ≤ 4` (arrival speed 12 u/s always suffices; backstop 18).
- Terrain within `y ∈ [−6, +14]`; segment count ≤ 4 per level; level length
  34–64u.

### Zone 1 — First Descent (slope sign; carve/coast/hop)

| id | name | terrain | light | coach |
|---|---|---|---|---|
| 1-1 | First Push | ramp(−0.15,6) on [0,30]; ramp(0,1.5) on [30,40] | 4 | "Hold to carve." |
| 1-2 | Let Go | ramp(−0.25,7) on [0,20]; gap [20,26]; ramp(0.15,0) on [26,46] | 5 | "Release to fly." |
| 1-3 | Uphill Cost | ramp(−0.2,8) on [0,20]; ramp(0.1,2) on [20,40] | 5 | "Uphill eats speed." |
| 1-4 | Little Hop | ramp(−0.15,6) on [0,18]; ramp(0,3.3) on [18,26]; ramp(−0.1,5.9) on [26,44] | 6, 2 air | "Tap low to hop." |
| 1-5 | Two Hills | sine(1.5,0.35,0,4) on [0,36]; ramp(0,4.0504345708) on [36,44] | 6 | "Read the steepness." |
| 1-6 | Flat Means Flat | ramp(0,5) on [0,10]; ramp(−0.2,7) on [10,30]; ramp(0,1) on [30,42] | 6 | "Flat keeps speed." |
| 1-7 | Long Flight | ramp(−0.3,9) on [0,18]; gap [18,26]; ramp(0.2,−1.4) on [26,46] | 7, 3 air | "Steep launch, far flight." |
| 1-8 | First Gauntlet | sine(1,0.3,0,5) on [0,22]; ramp(−0.2,9.7115413635) on [22,34]; ramp(0.1,−0.4884586365) on [34,48] | 8 | "Carve, coast, carve." |
| 1-9 | The Big Hill | finale: ramp(−0.12,8) on [0,25]; sine(2,0.25,0,5.0663584331) on [25,55]; ramp(0,6.9183233187) on [55,64] | 10 | "One big read." |

### Zone 2 — Steep Reading (derivative steers your speed)

| id | name | terrain | light | coach |
|---|---|---|---|---|
| 2-1 | The Number | ramp(−0.1,6) on [0,15]; ramp(−0.3,9) on [15,25]; ramp(−0.6,16.5) on [25,32]; ramp(0,−2.7) on [32,42] | 6 | "Steeper down, more go." |
| 2-2 | Sign Language | ramp(0.3,0) on [0,12]; ramp(−0.3,7.2) on [12,30]; ramp(0,−1.8) on [30,40] | 6 | "Minus goes down." |
| 2-3 | Gentle vs Wild | ramp(−0.05,5) on [0,20]; ramp(−0.5,14) on [20,30]; ramp(0,−1) on [30,42] | 7 | "Same drop, different hill." |
| 2-4 | Speed Limit | sine(2,0.4,0,5) on [0,32]; ramp(0,5.4630196502) on [32,42] | 7 | "Push changes where steep." |
| 2-5 | The SlopeChip | poly2(−0.01,−0.05,4.5) on [0,30]; ramp(0,−6) on [30,42] | 8 | "Watch the number change." |
| 2-6 | Switchbacks | ramp(−0.4,8) on [0,10]; ramp(0.4,0) on [10,20]; ramp(−0.4,16) on [20,30]; ramp(0.3,−5) on [30,40]; ramp(0,7) on [40,46] | 8 | "Flip signs, keep flow." |
| 2-7 | Curvy Steep | sine(2.5,0.5,0,6) on [0,26]; ramp(−0.2,12.2504175921) on [26,40] | 8, 2 air | "Steep moves on curves." |
| 2-8 | Reading Gauntlet | poly2(0.01,−0.5,9) on [0,25]; sine(1.5,0.4,0,3.5660316663) on [25,45] | 9 | "Number shows steepness." |
| 2-9 | Steepest Descent | finale: ramp(−0.08,8) on [0,12]; poly2(−0.005,0,7.76) on [12,40]; ramp(−0.6,23.76) on [40,48]; ramp(0,−5.04) on [48,58] | 10 | "Steepest wins." |

### Zone 3 — Apex Ridge (maxima/minima; launch windows)

| id | name | terrain | light | coach |
|---|---|---|---|---|
| 3-1 | The Flat Top | poly2(−0.03,1.2,−5) on [0,20]; ramp(−0.2,11) on [20,38] | 6 | "Flat top, big launch." |
| 3-2 | Valley Floor | poly2(0.04,−1.6,14) on [0,20]; ramp(0.2,−6) on [20,38] | 6 | "Bottoms slingshot." |
| 3-3 | Top Then Drop | sine(2,0.3,0,5) on [0,21]; ramp(−0.35,12.383627801) on [21,40] | 7, 3 air | "Crest, then fly." |
| 3-4 | Double Dip | sine(1.5,0.5,0,4) on [0,25]; ramp(0,3.900517154) on [25,34] | 7 | "Two bottoms, two boosts." |
| 3-5 | Apex Slow-Mo | poly2(−0.025,1,−5) on [0,20]; ramp(−0.25,10) on [20,38] | 8, 3 air | "Float at the top." |
| 3-6 | Land the Downside | ramp(−0.3,9) on [0,14]; gap [14,22]; sine(1.8,0.35,0,4.8) on [22,44] | 8 | "Land going down." |
| 3-7 | Uphill Landing | ramp(−0.35,10) on [0,14]; gap [14,22]; ramp(0.15,−0.1) on [22,40] | 8 | "Soft landings lose less." |
| 3-8 | Ridge Gauntlet | poly2(−0.03,1.2,−6) on [0,20]; sine(1.2,0.4,0,4.8127701041) on [20,42] | 9, 2 air | "Top, drop, roll." |
| 3-9 | The Great Apex | finale: poly2(−0.005,0.4,0) on [0,40]; ramp(−0.4,24) on [40,55]; ramp(0,2) on [55,64] | 10, 4 air | "One perfect crest." |

### Zone 4 — Lightfields (accumulation / area)

| id | name | terrain | light | coach |
|---|---|---|---|---|
| 4-1 | Gather Light | ramp(−0.15,6) on [0,30]; ramp(0,1.5) on [30,40] | 8 | "Light fills the bar." |
| 4-2 | Tall Hill, Big Bar | ramp(−0.15,9) on [0,30]; ramp(0,4.5) on [30,40] | 8 | "High hills hold more." |
| 4-3 | Fill as You Go | sine(1,0.25,0,5) on [0,40] | 10 | "Every bit counts." |
| 4-4 | Air Light | ramp(−0.3,9) on [0,16]; gap [16,24]; ramp(0.2,−1.2) on [24,44] | 8, 4 air | "Flying finds more." |
| 4-5 | The Wide Valley | poly2(0.02,−0.8,12) on [0,20]; ramp(0.1,2) on [20,40] | 10 | "Wide floor, wide bar." |
| 4-6 | Don't Leave Any | sine(1.5,0.4,0,5) on [0,32]; ramp(−0.2,11.7472647377) on [32,44] | 12 | "Clean the curve." |
| 4-7 | Light Ladder | ramp(−0.2,8) on [0,20]; ramp(0,4) on [20,28]; ramp(−0.2,9.6) on [28,40] | 12, 3 air | "Steps of light." |
| 4-8 | Field Gauntlet | poly2(−0.01,0.2,5) on [0,25]; sine(1,0.35,0,3.1252760462) on [25,45] | 14 | "Full bar, full flow." |
| 4-9 | The Motherlode | finale: sine(2,0.2,0,6) on [0,50]; ramp(0,4.9119577782) on [50,60] | 16 | "Fill it all." |

### Zone 5 — Portal Peaks (exact trades; ∫f′ = Δh)

Portals: paired gates `P(a→b)`, grounded exits (`y_out = f(x_b)`),
`|Δh| ≤ 4` (§4 rules). Transit conserves `E = v²/2 + g·y` exactly (§5.6).
`gap` ranges under portals are bridged by the gate, never ridden.

| id | name | terrain + portals | light | coach |
|---|---|---|---|---|
| 5-1 | The Blue Door | ramp(−0.2,8) on [0,20]; gap [20,28]; ramp(0.3,−2) on [28,44]; P(20→28) | 6 | "Doors trade height." |
| 5-2 | Up Door, Out Slow | ramp(−0.15,6) on [0,18]; gap [18,30]; ramp(0.4,−4.7) on [30,42]; P(18→30) | 6 | "Higher door, slower out." |
| 5-3 | Down Door Dash | ramp(−0.1,7) on [0,16]; gap [16,30]; ramp(−0.4,13.8) on [30,44]; P(16→30) | 7 | "Lower door, faster out." |
| 5-4 | Two Doors | sine(1.5,0.3,0,5) on [0,20]; gap [20,24]; ramp(0,3.2) on [24,28]; gap [28,32]; ramp(−0.3,11) on [32,46]; P₁(20→24), P₂(28→32) | 8 | "Chain the doors." |
| 5-5 | Bank the Hill | ramp(−0.25,9) on [0,20]; gap [20,30]; ramp(0.5,−7) on [30,42]; P(20→30) | 8 | "Spend height, keep speed." |
| 5-6 | Exact Trade | poly2(−0.02,0.8,−2) on [0,20]; gap [20,32]; ramp(−0.2,10) on [32,46]; P(20→32) | 9 | "The trade is exact." |
| 5-7 | Door Ladder | ramp(−0.2,10) on [0,14]; gap [14,22]; ramp(−0.2,12.8) on [22,32]; gap [32,40]; ramp(−0.2,15.6) on [40,50]; P₁(14→22), P₂(32→40) | 9 | "Climb the ladder down." |
| 5-8 | Portal Gauntlet | sine(1,0.4,0,6) on [0,16]; gap [16,26]; poly2(0.02,−1.2,20) on [26,40]; ramp(0,4) on [40,48]; P(16→26) | 10 | "Read before the door." |
| 5-9 | The Two-Way Door | finale: ramp(−0.3,2) on [0,18]; gap [18,28]; sine(1.5,0.3,0,−2.3) on [28,50]; P(18→28) | 12, 4 air | "Master the trade." |

### Zone 6 — Wind & Spring (motion rules you write)

Rule editor: OPTIONAL pre-run sheet (defaults = a solvable rule) + pencil chip
on the HUD for mid-run changes (pauses the run). Steppers (± buttons, 44px,
0.1 steps) set coefficients within the level's range. Wind: `a += k`.
Spring: `a += −k·(x − x₀)`. Rules act on the RIDER's motion; terrain is fixed.

| id | name | rule + terrain | light | coach |
|---|---|---|---|---|
| 6-1 | The Wind Rule | wind k ∈ [0.5,3], solvable k=1; ramp(−0.1,6) on [0,40] | 6 | "Write the wind." |
| 6-2 | Stronger Wind | wind k ∈ [0.5,3], solvable k=2.5; ramp(0.15,0) on [0,36] | 6 | "More k, more push." |
| 6-3 | Wind Gap | wind k ∈ [1,4], solvable k=3; ramp(−0.2,8) on [0,16]; gap [16,24]; ramp(0.2,−1.2) on [24,44] | 7, 2 air | "Wind carries you." |
| 6-4 | The Spring Rule | spring k ∈ [0.2,1.5], x₀=20, solvable k=0.8; ramp(0,6) on [0,40] | 7 | "The rule pulls back." |
| 6-5 | Soft vs Hard Spring | spring k ∈ [0.2,2], x₀=24, solvable k=1.2; sine(0.5,0.2,0,5) on [0,44] | 8 | "Hard pulls harder." |
| 6-6 | Spring Launch | spring k ∈ [0.5,2.5], x₀=12, solvable k=2; ramp(0,4) on [0,12]; ramp(−0.3,7.6) on [12,32] | 8, 2 air | "Pull back, sling forward." |
| 6-7 | Wind + Spring | wind k₁ ∈ [0,2] + spring k₂ ∈ [0.2,1.5], x₀=24, solvable (1,0.8); ramp(−0.1,7) on [0,44] | 9 | "Two rules, one ride." |
| 6-8 | Rule Gauntlet | spring k ∈ [0.4,2], x₀=20, solvable k=1.5; sine(1,0.3,0,5) on [0,42] | 10 | "Tune the rule." |
| 6-9 | The Perfect Rule | finale: wind k₁ ∈ [0.5,3] + spring k₂ ∈ [0.2,2], x₀=30, solvable (2,1); poly2(0.01,−0.3,8) on [0,30]; ramp(−0.2,14) on [30,55] | 12, 3 air | "Write the perfect rule." |

## 5. Canonical math & physics (the implementer contract)

### 5.1 Terrain function library (closed forms — no numeric differentiation anywhere)

| kind | f(x) | f′(x) | F(x) (∫f) |
|---|---|---|---|
| ramp(m,c) | m·x + c | m | m·x²/2 + c·x |
| poly2(a,b,c) | a·x² + b·x + c | 2a·x + b | a·x³/3 + b·x²/2 + c·x |
| sine(A,ω,φ,y0) | A·sin(ωx+φ) + y0 | A·ω·cos(ωx+φ) | −A·cos(ωx+φ)/ω + y0·x |
| exp(A,k,y0) | A·e^{kx} + y0 | A·k·e^{kx} | A·e^{kx}/k + y0·x |

Segments join at shared endpoints (tables are C0; C1 not required — kinks are
features, "kinks keep speed but feel bumpy"). Slope number shown = f′(x)
(clamped display ±3).

### 5.2 Simulation

- **Fixed timestep 120 Hz** (`dt = 1/120`), accumulator loop on rAF; render
  interpolation between the last two states (no physics in render).
- **Velocity Verlet** (symplectic) everywhere — momentum feel lives or dies on
  energy behavior; no Euler anywhere. Float64 state.
- **Grounded (carving):** 1-DOF along the curve. `s̈ = g·sinθ(x)·(−sign of
  downhill) ` implemented as tangential projection: with `m = f′(x)`,
  `a_t = g·(−m)/√(1+m²)` (positive = accelerates rightward-downhill) plus
  carve bonus `a_c = 4 u/s²` while held (0 when coasting on ground = "glide",
  still grounded). Position advanced in x via `ẋ = ṡ/√(1+m²)`.
  Speed clamp `|ṡ| ≤ 16 u/s`. Full-stop = `|ṡ| < 0.05` for 0.5s (counts
  against 3★ flow; rider auto-nudges forward at 0.5 u/s after 1.5s stopped —
  no softlocks, ever).
- **Airborne (coasting):** `ẍ = (0, −g)`, `g = 18 u/s²`. Hop impulse:
  perpendicular to curve, `v += n̂·5.5 u/s`, grounded only, 0.25s tap window.
- **Landing (CCD, no tunneling):** swept test each step — segment p₀→p₁ vs
  curve; root of `h(t) = y(t) − f(x(t))` by bisection (tol 1e-6, ≤ 32 iters)
  on each crossed terrain segment. Landing keeps the tangential component,
  kills the normal component (inelastic): `v ← (v·t̂)t̂`. Landing on
  downslope converts drop to speed; uphill landing scrubs speed — the core
  skill. Max fall speed before landing 20 u/s (CCD handles).
- **Camera:** lookahead `x + clamp(ẋ·0.35, 1, 4)`, y eases to `f(x)+2.2`;
  portrait viewport shows ≈ 8 u wide. Apex slow-mo: when airborne AND
  `|v_y| < 1.2` AND above a local maximum, timescale eases to 0.35 for
  ≤ 0.8s (cooldown 3s; reduce-motion setting disables).
- **Determinism:** identical inputs → identical trajectory (harness depends
  on this). No RNG in physics.

### 5.3 Slope number / Speedometer

Display value `f′(x)` quantized to 0.1 for the chip. mathLabels shows
`f′(x) = −0.3`; stealth shows a hill glyph tilting with sign + magnitude.

### 5.4 Light & area

Shard pickup radius `TOL = 0.25`. AreaBar fills
`A(x) = F(x) − F(x_start)` using the closed-form F (never numeric
accumulation), displayed as a glowing gauge; shard chime pitch rises with A.

### 5.5 Rule editor (Z6)

Pre-run BottomSheet: steppers for coefficients (44px targets, 0.1 steps within
level range), live preview of the rule as a ghost arrow field. Rule applies
as additional acceleration term: wind `a += k` (x-direction), spring
`a += −k·(x − x₀)`. Physics otherwise unchanged. Chosen rule persists per
level (mid-level resume).

### 5.6 Portals (Z5)

Gate segment at `x_a` (entry) teleports rider to `x_b` with
`y_out = f(x_b) + Δ` (Δ from table, default 0) and velocity re-projected onto
the exit tangent with magnitude from energy conservation:
`|v_out| = √(v_in² + 2g(y_in − y_out))` (exact, harness asserts `< 1e-9`;
if the radicand ≤ 0 the portal refuses — player must arrive faster; coach
toast, no fail). Direction = exit-tangent sign of travel.

## 6. Boss — THE AVALANCHE

**Fantasy:** the whole mountain lets go. You don't fight it — you *read* it.

**Structure (kit Session, 3 ridges, turn-free pursuit):** a wall of white
chases left→right at speed `w(t)`: starts 2 u/s under the rider's speed and
accelerates +0.5 u/s per ridge. The rider descends 3 ridge courses (terrain
from §4 zone 6 finale family, exact segments in build data) to the safe
basin. Being caught = **soft rewind** to the current ridge start with the
avalanche reset 6 u back + ghost-hint replay of the canonical line (canon:
no fail screens, no timers, no lives; the chase is spatial and its distance
is always visible as a screen-edge meter, shape + color coded).

- **Ridge 1 — Carve:** pure slope reading (sine hills). Coach: "Stay low, stay fast."
- **Ridge 2 — Portals:** two portal pairs; each costs speed unless you bank
  height first. Coach: "Bank height before doors."
- **Ridge 3 — Spring Rule:** one spring-rule section (k fixed 1.2, x₀ mid-valley)
  plus apex slow-mo windows for shard lines. Coach: "Ride the pull."
- **Win:** reach the basin with any light → clear; stars by light collected
  across the run: 3★ ≥ 90%, 2★ ≥ 60%, else 1★. 150 gears, 200 XP,
  card "The White Wall" + Fragment 3 unlock. Avalanche bursts into a slow
  snow-settle at the basin (release, not defeat).

## 7. Solvability harness (canon DoD)

`scripts/verify-levels.ts` (tsx, `npm run verify`):
- **Math core cross-check:** every terrain segment: closed-form f′ and F vs
  central differences (tolerances §2) — analytic correctness gate.
- **Canonical controller simulation:** per level, simulate the scripted
  controller (hold/release/tap policy from the level's `canonicalLine`:
  carve everywhere except listed coast windows at given x-ranges + hop
  points) at 120 Hz with the §5 physics. Assert: reaches goal gate; light
  collected ≥ level 3★ requirement; zero full-stops for 3★ levels; portal
  transits conserve E < 1e-9; Z6: asserts the listed solvable coefficient(s)
  pass AND ±1 stepper step outside them fails (rule actually matters);
  FTC levels assert area/speed trade within 1e-9.
- **Boss:** simulate canonical line per ridge; assert finish with ≥ 90%
  light and never caught.
- **Lints:** coach ≤ 6 words; ids unique; segment C0 continuity at joins
  (|f_left(x_j) − f_right(x_j)| < 1e-9); shards within 0.6 of terrain
  (reachable); cardIds resolve.
Output `✓ <id> <name>` per level, `All 54 levels solvable. Boss: 3 ridges
solvable.`, non-zero exit with evidence dump on failure. Target < 30s.

## 8. Screens & the stealth bridge

Chrome reuses kit shells unchanged (Home/Map/Results/Profile/Codex/Settings).
Zone accents per §3 feed `--gv-accent`.

**Gameplay screen** = one kit `Session` subclass (`RideSession`) — the rider
world is continuous, not a dock/tray puzzle. HUD: back/pause IconButtons,
StarMeter (light fraction live), **SpeedometerChip** + **AreaBar**.

- **SpeedometerChip** (stealth bridge #1): big speed number + hill-tilt
  glyph (sign/magnitude of f′). mathLabels swaps glyph → `f′(x)=…` text.
  Tap → Nerd Note sheet (zone card); no long-press.
- **AreaBar** (stealth bridge #2): glowing gauge filling with A(x) (§5.4);
  Z4+ it pulses at 70%/100% thresholds (star progress).
- **Rule editor** (Z6): pre-run BottomSheet (§5.5); mid-run rule chip shows
  chosen `k` (glyph; mathLabels `ẍ = −k(x−x₀)`).
- **Intro card scrim** per level (name, goal, coach ≤ 6 words, tap to start);
  the run starts on first hold. Pause sheet per kit. Mid-level persist
  (position, velocity, light, rule) via sessionStorage, as in series.

## 9. Sensory & accessibility

- Series palette unchanged. New signature: **speed lines** (streak density
  ∝ speed) + carve sparks; slow-mo desaturates + drops pitch 30%.
  Colorblind modes via kit `paletteForMode`; avalanche wall is white noise
  texture + jagged edge (shape, never color-only); portal pairs share glyph
  shapes (circle/triangle) not just colors.
- SFX (kit synth): carve loop pitch 220→880Hz with speed; coast wind noise;
  landing thump scaled to normal-impact; shard chime rising with area;
  portal = two-tone pass-through; avalanche = filtered rumble, distance-
  driven low-pass. Haptics: carve rumble (low, speed-scaled), landing bump,
  shard tick, slow-mo suspend. All via kit settings (volumes, haptics,
  reduceMotion — which also disables slow-mo + camera ease, gridIntensity,
  colorblind 4-way, mathLabels, ghostHints, snapStrength n/a here but kept).
- Portrait 360×640 → 480×1024 playable; whole-screen hold target;
  one-finger only; nothing timed; ghost-hint = canonical line replay after
  3 failed attempts or 30s idle.

## 10. Codex — 18 concept cards (3/zone)

Front ≤ 30 words stealth + art; Nerd Note = real term + one line of real math.

1. **The Push** — "Hold the hill and it pushes you. Steeper down, bigger push." / tangential gravity: a = g·sinθ.
2. **Letting Go** — "Release and you keep the hill's direction — until gravity wins." / projectile motion: ẍ = (0,−g).
3. **Uphill Cost** — "Climbing spends exactly what falling earned." / energy: v²/2 + g·h = const.
4. **Rise Over Run** — "Every hill has a number: how much up for how much across." / slope m = Δy/Δx.
5. **The Speedometer** — "The hill's number is your speed's steering wheel." / derivative f′(x) = lim Δy/Δx.
6. **Sign Language** — "Minus means down. Bigger minus, faster down." / sign and magnitude of f′.
7. **Flat Tops** — "Where the hill's number is zero, things get interesting." / critical points: f′(x) = 0.
8. **The Launch Window** — "Crests hand you the sky for a heartbeat." / local maximum: f′ = 0, f″ < 0.
9. **Valley Floors** — "Bottoms catch you and throw you forward." / local minimum: f′ = 0, f″ > 0.
10. **Piling Up** — "Light doesn't vanish. It piles up under the hill." / accumulation function A(x) = ∫ₐˣ f.
11. **Tall Holds More** — "Higher hills hide bigger piles." / area scales with function values.
12. **Every Bit Counts** — "The pile grows even when you can't see it." / A′(x) = f(x) (FTC part 1).
13. **The Trade** — "Doors trade height-pile for speed. Exactly." / FTC: ∫ₐᵇ f′ = f(b) − f(a).
14. **Two-Way Door** — "What the hill takes, a door can give back." / derivative and integral are inverse operations.
15. **Exact Change** — "The door never rounds. Not ever." / conservation E = v²/2 + g·h.
16. **The Wind Rule** — "Write a number k. The hill pushes k-hard, always." / ODE ẍ = k → constant acceleration.
17. **The Spring Rule** — "Far from center? Pulled back harder. It's a rule, not a wall." / ẍ = −k(x−x₀) → harmonic motion.
18. **Rules Make Shapes** — "Every motion rule draws its own hill in your head." / ODEs and their solution curves.

## 11. Archive Fragments (the Paper Test — verified against sources)

Unlocks: 3-9, 5-9, boss. "Founders' Archive" cards with comprehension
micro-prompts (canon: collectible unlocks, correct copy mandatory).

**Fragment 1 — "The First Speedometer" (Galileo Galilei, *Dialogues Concerning
Two New Sciences*, 1638, Third Day — Naturally Accelerated Motion;
tr. Crew & de Salvio, 1914).**
> "We shall call that motion equally and uniformly accelerated which,
> starting from rest, acquires during equal time-intervals equal increments
> of speed."
Verified verbatim against the Crew–de Salvio translation text
(spirasolaris.ca Third Day facsimile; galileoandeinstein.phys.virginia.edu
tns153) on 2026-07-20.
Prompt: "Equal speed steps in equal times — what shape is your speed's graph?"
(answer: a straight line / ramp).

**Fragment 2 — "The Geometric Pile" (T. R. Malthus, *An Essay on the
Principle of Population*, 1798, Ch. 1).**
> "Population, when unchecked, increases in a geometrical ratio. Subsistence
> increases only in an arithmetical ratio."
Verified verbatim against the 1798 first edition text on 2026-07-20.
Prompt: "Geometric piles rule which wind-swept curve?" (answer: exponential —
the runaway pile; dP/dt = rP has P = P₀e^{rt}).

**Fragment 3 — "The Sum Sign" (G. W. Leibniz, manuscript of 29 October 1675;
first printed in *De geometria recondita…*, Acta Eruditorum, 1686).**
> "Utile erit scribi ∫ pro omn. l"
> ("It will be useful to write ∫ for *omnia l* — the sum of all the l's.")
Verified verbatim against MacTutor "Earliest Uses of Symbols of Calculus"
(mathshistory.st-andrews.ac.uk) on 2026-07-20.
Prompt: "∫ is just a long S. What is the AreaBar summing?" (answer: the light
under the hill — infinitely many thin strips).

## 12. Build notes (kit consumption)

- `createGameStore({ saveKey: 'slope-rider-save-v1', firstLevelId: '1-1' })`.
- Theme: `GRIDVERSE_BASE` + accent per zone on Map/Results; canvas world is
  NOT the warped grid — terrain line + parallax ridges (first series game
  without grid floor; `background: 'none'` + custom sky gradient).
- Engine: fixed 120Hz accumulator driving the kit rAF; kit `Session` reused
  (UiState, ghost-hint, winBursts, contentBounds = current terrain window).
- RNG: only for avalanche snow particles (visual, `createRng` seeded).
- New kit candidates if patterns repeat: fixed-timestep accumulator,
  speed-line renderer, CCD segment/curve test — promote only when Game 4+
  needs them (YAGNI).
- Feel-tuning loop (series routing note): after build, run headless, capture
  screenshots at apex/launch/pursuit moments, iterate on constants in §5
  (g, carve bonus, hop impulse, slow-mo window) until motion reads at a glance.
- Vite build: `npx vite build --base=/slope-rider/` must pass, tsc clean,
  `npm run verify` green (§7) — canon DoD.
