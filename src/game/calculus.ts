import { clamp } from '@gridverse/kit/engine'

/**
 * SLOPE RIDER math core — analytic terrain + physics.
 * Main-owned: no subagent may modify this file.
 * Contract: design/design.md §2 exactness, §5 physics. No numeric
 * differentiation anywhere; closed forms only.
 */

/* ---------- tuning constants (design §5.2) ---------- */
export const G = 18 // gravity u/s²
export const CARVE_ACCEL = 4 // carve bonus u/s²
export const HOP_IMPULSE = 5.5 // u/s along curve normal
export const DRAG_CD = 0.015 // quadratic drag
export const V_MAX = 18 // hard backstop u/s (CCD sanity)
export const SHARD_TOL = 0.75 // pickup radius (grounded shards; shards float +0.5)
export const AIR_SHARD_TOL = 0.9 // pickup radius (air shards)
export const PHYS_HZ = 120
export const PHYS_DT = 1 / PHYS_HZ

/* ---------- terrain segments (design §5.1) ---------- */
export type SegKind = 'ramp' | 'poly2' | 'sine' | 'exp'

export interface Seg {
  kind: SegKind
  /** ramp [m,c] | poly2 [a,b,c] | sine [A,ω,φ,y0] | exp [A,k,y0] */
  p: readonly number[]
  x0: number
  x1: number
}

export function segF(s: Seg, x: number): number {
  const p = s.p
  switch (s.kind) {
    case 'ramp': return p[0]! * x + p[1]!
    case 'poly2': return p[0]! * x * x + p[1]! * x + p[2]!
    case 'sine': return p[0]! * Math.sin(p[1]! * x + p[2]!) + p[3]!
    case 'exp': return p[0]! * Math.exp(p[1]! * x) + p[2]!
  }
}

export function segDf(s: Seg, x: number): number {
  const p = s.p
  switch (s.kind) {
    case 'ramp': return p[0]!
    case 'poly2': return 2 * p[0]! * x + p[1]!
    case 'sine': return p[0]! * p[1]! * Math.cos(p[1]! * x + p[2]!)
    case 'exp': return p[0]! * p[1]! * Math.exp(p[1]! * x)
  }
}

export function segDdf(s: Seg, x: number): number {
  const p = s.p
  switch (s.kind) {
    case 'ramp': return 0
    case 'poly2': return 2 * p[0]!
    case 'sine': return -p[0]! * p[1]! * p[1]! * Math.sin(p[1]! * x + p[2]!)
    case 'exp': return p[0]! * p[1]! * p[1]! * Math.exp(p[1]! * x)
  }
}

/** antiderivative F(x) of f (constant term zero) */
export function segIntF(s: Seg, x: number): number {
  const p = s.p
  switch (s.kind) {
    case 'ramp': return (p[0]! * x * x) / 2 + p[1]! * x
    case 'poly2': return (p[0]! * x ** 3) / 3 + (p[1]! * x * x) / 2 + p[2]! * x
    case 'sine': return (-p[0]! * Math.cos(p[1]! * x + p[2]!)) / p[1]! + p[3]! * x
    case 'exp': return (p[0]! * Math.exp(p[1]! * x)) / p[1]! + p[2]! * x
  }
}

/** segment covering x, or null when x is in a coast gap */
export function segAt(terrain: readonly Seg[], x: number): Seg | null {
  for (const s of terrain) {
    if (x >= s.x0 - 1e-9 && x <= s.x1 + 1e-9) return s
  }
  return null
}

/** terrain height; null in gaps */
export function terrainF(terrain: readonly Seg[], x: number): number | null {
  const s = segAt(terrain, x)
  return s ? segF(s, x) : null
}

/** area under the curve from x0 to x1 (closed form; x1 may exceed x0 only within covered terrain — callers accumulate per segment) */
export function areaBetween(terrain: readonly Seg[], x0: number, x1: number): number {
  let a = 0
  for (const s of terrain) {
    const lo = Math.max(x0, s.x0)
    const hi = Math.min(x1, s.x1)
    if (hi > lo) a += segIntF(s, hi) - segIntF(s, lo)
  }
  return a
}

/* ---------- rules (design §5.5) ---------- */
export interface MotionRule {
  /** wind: a += k (horizontal) */
  windK?: number
  /** spring: a += −k·(x − x0) (horizontal) */
  springK?: number
  springX0?: number
}

function ruleAccel(x: number, rule?: MotionRule): number {
  if (!rule) return 0
  let a = 0
  if (rule.windK !== undefined) a += rule.windK
  if (rule.springK !== undefined && rule.springX0 !== undefined)
    a += -rule.springK * (x - rule.springX0)
  return a
}

/* ---------- grounded dynamics (design §5.2) ---------- */

/**
 * Constrained-curve horizontal acceleration while grounded.
 *   ẍ = −(g·p + p·q·ẋ²)/(1+p²) + a_c/√(1+p²) − c_d·ẋ|ẋ| + rule
 * with p = f′(x), q = f″(x) (curvature correction included).
 */
export function groundAccel(
  terrain: readonly Seg[],
  x: number,
  vx: number,
  carving: boolean,
  rule?: MotionRule,
): number {
  const s = segAt(terrain, x)
  if (!s) return 0
  const p = segDf(s, x)
  const q = segDdf(s, x)
  const curve = -(G * p + p * q * vx * vx) / (1 + p * p)
  const carve = (carving ? CARVE_ACCEL : 0) / Math.sqrt(1 + p * p)
  const drag = -DRAG_CD * vx * Math.abs(vx)
  return curve + carve + drag + ruleAccel(x, rule)
}

/**
 * Velocity-Verlet (KDK) step for grounded motion in x.
 * a depends on (x, vx) — half-step velocity used for the second kick.
 * Deterministic; identical inputs → identical outputs.
 */
export function verletGround(
  terrain: readonly Seg[],
  x: number,
  vx: number,
  dt: number,
  carving: boolean,
  rule?: MotionRule,
): [number, number] {
  const a0 = groundAccel(terrain, x, vx, carving, rule)
  const vh = vx + 0.5 * a0 * dt
  const x1 = x + vh * dt
  const a1 = groundAccel(terrain, x1, vh, carving, rule)
  const v1 = vh + 0.5 * a1 * dt
  return [x1, clamp(v1, -V_MAX, V_MAX)]
}

/** airborne Verlet step (gravity + horizontal rule terms) */
export function verletAir(
  x: number,
  y: number,
  vx: number,
  vy: number,
  dt: number,
  rule?: MotionRule,
): [number, number, number, number] {
  const ax0 = ruleAccel(x, rule)
  const vxh = vx + 0.5 * ax0 * dt
  const vyh = vy + 0.5 * -G * dt
  const x1 = x + vxh * dt
  const y1 = y + vyh * dt
  const ax1 = ruleAccel(x1, rule)
  const vx1 = clamp(vxh + 0.5 * ax1 * dt, -V_MAX, V_MAX)
  const vy1 = clamp(vyh + 0.5 * -G * dt, -V_MAX, V_MAX)
  return [x1, y1, vx1, vy1]
}

/* ---------- landing CCD (design §5.2) ---------- */

export interface Landing {
  /** impact point */
  x: number
  y: number
  /** segment index hit */
  segIdx: number
  /** fraction along p0→p1 */
  t: number
}

/**
 * Swept landing test: samples h(t) = y(t) − f(x(t)) at 8 substeps,
 * first bracket (or touch), bisects to 1e-6. Returns null if the whole
 * swept segment stays above terrain (or in gaps).
 */
export function findLanding(
  terrain: readonly Seg[],
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): Landing | null {
  const h = (t: number): { v: number; segIdx: number } | null => {
    const x = x0 + (x1 - x0) * t
    const y = y0 + (y1 - y0) * t
    for (let i = 0; i < terrain.length; i++) {
      const s = terrain[i]!
      if (x >= s.x0 - 1e-9 && x <= s.x1 + 1e-9) {
        return { v: y - segF(s, x), segIdx: i }
      }
    }
    return null // gap: airborne by definition
  }
  let prevT = 0
  let prev = h(0)
  const SUB = 8
  for (let i = 1; i <= SUB; i++) {
    const t = i / SUB
    const cur = h(t)
    if (cur && cur.v <= 0 && (prev === null || prev.v >= 0)) {
      // bracket [prevT, t] — bisect (when prev is null, root is at terrain entry)
      let lo = prevT
      let hi = t
      for (let it = 0; it < 32; it++) {
        const mid = (lo + hi) / 2
        const m = h(mid)
        if (m === null || m.v > 0) lo = mid
        else hi = mid
        if (hi - lo < 1e-6) break
      }
      const tr = (lo + hi) / 2
      const x = x0 + (x1 - x0) * tr
      const hit = h(tr)
      return { x, y: y0 + (y1 - y0) * tr, segIdx: hit?.segIdx ?? cur.segIdx, t: tr }
    }
    if (cur) {
      prev = cur
      prevT = t
    }
  }
  return null
}

/** inelastic landing: keep tangential component of v along curve at x */
export function landVelocity(terrain: readonly Seg[], x: number, vx: number, vy: number): [number, number] {
  const s = segAt(terrain, x)
  if (!s) return [vx, vy]
  const p = segDf(s, x)
  const n = Math.sqrt(1 + p * p)
  // v·t̂ with t̂ = (1, p)/n — keep that component along t̂
  const dot = (vx * 1 + vy * p) / (n * n)
  return [dot, p * dot]
}

/* ---------- portals (design §5.6) ---------- */

export interface Portal {
  a: number
  b: number
}

/** energy-conserving portal exit speed; NaN if radicand ≤ 0 (gate inert) */
export function portalExitSpeed(terrain: readonly Seg[], portal: Portal, vin: number): number {
  const ya = terrainF(terrain, portal.a)
  const yb = terrainF(terrain, portal.b)
  if (ya === null || yb === null) return NaN
  const rad = vin * vin + 2 * G * (ya - yb)
  return rad <= 0 ? NaN : Math.sqrt(rad)
}

/* ---------- shards ---------- */
export interface Shard {
  x: number
  y: number
  air?: boolean
  got?: boolean
}

/* ---------- ghost replay frame ---------- */
export interface GhostFrame {
  x: number
  y: number
  vx: number
  vy: number
  carving: boolean
}
