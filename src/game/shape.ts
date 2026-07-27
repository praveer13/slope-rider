import { segDf, type Seg } from './calculus.js'

/**
 * SLOPE RIDER v3 — shape model.
 * A level = fixed bedrock Seg[] + shape windows the player edits.
 * A window's line is a C1 cubic Hermite spline through anchor–knots–anchor;
 * knots live on fixed x staves and only move vertically (the editor IS the
 * vertical-line test: a function has exactly one height at every x).
 */

/** vertical snap quantum for knot drags (haptic tick per step) */
export const KNOT_SNAP = 0.25

export interface ShapeWindow {
  /** span; joins bedrock/anchors at both ends */
  x0: number
  x1: number
  /** interior knot count; knot x's are evenly spaced and fixed */
  knots: number
  /** vertical clamps applied to every knot */
  minY: number
  maxY: number
  /** anchor heights (default: neighbor terrain / explicit) */
  startY: number
  endY: number
  /** optional arc-length ink budget for this window's curve */
  ink?: number
  /** optional |f′| cap enforced on tangents while dragging (Z2+) */
  slopeClamp?: number
  /** canonical knot y's — harness witness + ghost hint */
  solution: number[]
}

/** evenly spaced interior knot x positions for a window */
export function knotXs(w: ShapeWindow): number[] {
  const xs: number[] = []
  for (let i = 1; i <= w.knots; i++) xs.push(w.x0 + ((w.x1 - w.x0) * i) / (w.knots + 1))
  return xs
}

/** default starting knot y's: straight line anchor→anchor (always legal) */
export function defaultKnotYs(w: ShapeWindow): number[] {
  return knotXs(w).map((x) => {
    const t = (x - w.x0) / (w.x1 - w.x0)
    return snapKnotY(w, w.startY + t * (w.endY - w.startY))
  })
}

/** clamp + quantize a knot y */
export function snapKnotY(w: ShapeWindow, y: number): number {
  const s = Math.round(y / KNOT_SNAP) * KNOT_SNAP
  return Math.min(w.maxY, Math.max(w.minY, s))
}

/**
 * Catmull-Rom tangents (one-sided at ends), optionally clamped to ±slopeClamp.
 * points: [anchor0, ...knots, anchor1] as [x, y] pairs.
 */
function tangents(pts: readonly (readonly [number, number])[], cap?: number): number[] {
  const n = pts.length
  const m: number[] = []
  for (let i = 0; i < n; i++) {
    const prev = pts[Math.max(0, i - 1)]!
    const next = pts[Math.min(n - 1, i + 1)]!
    let t = (next[1] - prev[1]) / (next[0] - prev[0])
    if (cap !== undefined) t = Math.min(cap, Math.max(-cap, t))
    m.push(t)
  }
  return m
}

/** hermite pieces for a window given knot y's (length must equal w.knots) */
export function buildWindowSegs(w: ShapeWindow, knotYs: readonly number[]): Seg[] {
  const xs = knotXs(w)
  const pts: [number, number][] = [[w.x0, w.startY]]
  for (let i = 0; i < w.knots; i++) pts.push([xs[i]!, knotYs[i]!])
  pts.push([w.x1, w.endY])
  const m = tangents(pts, w.slopeClamp)
  const segs: Seg[] = []
  for (let i = 0; i < pts.length - 1; i++) {
    const [xa, ya] = pts[i]!
    const [xb, yb] = pts[i + 1]!
    segs.push({ kind: 'hermite', p: [ya, m[i]!, yb, m[i + 1]!], x0: xa, x1: xb })
  }
  return segs
}

/** merge bedrock + window curves into one sorted terrain */
export function buildTerrain(
  bedrock: readonly Seg[],
  windows: readonly ShapeWindow[],
  knotYsByWindow: readonly (readonly number[])[],
): Seg[] {
  const all: Seg[] = [...bedrock]
  for (let i = 0; i < windows.length; i++) {
    all.push(...buildWindowSegs(windows[i]!, knotYsByWindow[i]!))
  }
  return all.sort((a, b) => a.x0 - b.x0)
}

/** the level's solved terrain (canonical witness) */
export function solveTerrain(bedrock: readonly Seg[], windows: readonly ShapeWindow[]): Seg[] {
  return buildTerrain(bedrock, windows, windows.map((w) => w.solution))
}

/**
 * Arc length of a set of segments — 32-sample Simpson per piece on
 * √(1 + f′²). Display/budget only, never physics.
 */
export function arcLength(segs: readonly Seg[]): number {
  let L = 0
  for (const s of segs) {
    const N = 32
    const h = (s.x1 - s.x0) / N
    const g = (x: number) => {
      const d = segDf(s, x)
      return Math.sqrt(1 + d * d)
    }
    let sum = g(s.x0) + g(s.x1)
    for (let i = 1; i < N; i++) sum += (i % 2 === 0 ? 2 : 4) * g(s.x0 + i * h)
    L += (h / 3) * sum
  }
  return L
}

/** over-budget check for Ride-button gating (undefined budget → always ok) */
export function withinBudget(w: ShapeWindow, knotYs: readonly number[]): boolean {
  return w.ink === undefined || arcLength(buildWindowSegs(w, knotYs)) <= w.ink + 1e-9
}
