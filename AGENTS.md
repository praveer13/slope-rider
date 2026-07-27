# Project: SLOPE RIDER — part of the Quantum Path series
## Non-negotiables (the series canon)
1. Game first, math stealth. Math vocabulary never gates progress; real terms live only in opt-in "Nerd Notes".
2. Neurodivergent-friendly: NO timers, lives, energy, or fail screens. Struggle → ghost-hand hint, never punishment. Nothing interrupts flow (no mid-level popups/forced tutorials). Every interaction has immediate juicy feedback (snap/tick/glow). Coach marks ≤ 6 words.
3. Mobile-first: portrait, one-thumb, single-finger drag/tap only, touch targets ≥44px, safe-area aware. 360×640 → 480×1024 must be playable.
4. Tech: Vite 7 + React 19 + TypeScript + Tailwind 3.4 + zustand (persist to localStorage) + framer-motion. Canvas 2D for the world, DOM for chrome. NO backend, NO accounts, NO tracking. PWA (installable, fully offline).
5. Static deploy to GitHub Pages. `npx vite build --base=/slope-rider/` must pass; tsc clean.
6. Full sensory control in Settings: haptics/SFX/music/motion/grid intensity, colorblind palettes (Okabe-Ito), reduce-motion (also honor prefers-reduced-motion).
7. Definition of done includes a solvability harness: `npm run verify` proves EVERY level is beatable with its canonical solution, run before commit.
8. The Paper Test: the game ships with "Archive Fragments" — 1–3 real equations from real papers/lecture notes at exactly the level taught, as collectible unlocks. Copy for these must be mathematically correct.
## Shared universe
Vex (arrow-spark hero) travels the Gridverse. Same chrome pattern: Home → Map → Gameplay → Results → Profile/Codex → Settings. Stars/XP/gears economy identical to VECTO.

## v3 architecture (redesign, 2026-07)
- **Core loop: SHAPE → RIDE → TUNE.** Player sculpts the terrain function by
  dragging knots (vertical-only, fixed-x staves) across shape windows; taps
  Ride; Vex rides the drawn line; failures freeze-frame a reason and return
  to shaping. See `design/design.md` (v2 archived beside it).
- **Self-contained repo.** The engine/UI kit is vendored in `src/kit/`
  (extracted from gridverse-kit; that sibling repo is NOT needed to build).
  Game code: `src/game/` — `calculus.ts` (closed-form terrain math incl.
  `hermite` segs + physics), `shape.ts` (knot/window model, ink, budgets),
  `levels.ts` (all 54 levels + boss data), `ride/shapeRideSession.ts` +
  `ride/shapeRideDraw.ts` (the two-phase session), `boss/` (Avalanche).
- **No numeric differentiation anywhere.** Every terrain kind ships
  closed-form f, f′, f″, F; the harness cross-checks against central
  differences (1e-6..1e-3). Physics: 120 Hz velocity Verlet, CCD landing.
- **Navigation never touches window.history** (MemoryRouter): playing must
  not pollute the browser back stack.
- **Long-press is a game input:** global `user-select: none`,
  `-webkit-touch-callout: none`, canvas `touch-action: none`, contextmenu
  suppressed (main.tsx + index.css). Never reintroduce selectable text in
  gameplay surfaces.
- Level authoring contract + harness law: `design/design.md` §4/§7. Every
  level ships a `solution` knot array the harness simulates to 3★.
