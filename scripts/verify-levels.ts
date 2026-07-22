import {
  LEVELS,
  BOSS,
  solvableRule,
  type SRLevel,
  type BossRidge,
} from '../src/game/levels.ts'
import {
  G,
  CARVE_ACCEL,
  HOP_IMPULSE,
  SHARD_TOL,
  AIR_SHARD_TOL,
  PHYS_DT,
  segF,
  segDf,
  segDdf,
  segIntF,
  segAt,
  terrainF,
  verletGround,
  verletAir,
  findLanding,
  landVelocity,
  portalExitSpeed,
  type Seg,
  type MotionRule,
  type Portal,
} from '../src/game/calculus.ts'
import { CARDS } from '../src/lib/cards.ts'

/**
 * Solvability harness — canon definition of done (design §7).
 * Simulates every level's canonicalLine through the real physics and proves
 * 3★ achievable. Deterministic, no rendering. `npm run verify`.
 */

let failed = 0
const failures: string[] = []
const pass = (id: string, name: string, detail = ''): void => {
  console.log(`✓ ${id} ${name}${detail ? `  (${detail})` : ''}`)
}
const fail = (id: string, name: string, why: string): void => {
  console.log(`✗ ${id} ${name}  ✗ ${why}`)
  failed++
  failures.push(`${id}: ${why}`)
}

/* ---------- 1. analytic cross-check (design §2 tolerances) ---------- */
function crossCheckSeg(s: Seg): string | null {
  const n = 100
  const h = 1e-5
  for (let i = 0; i <= n; i++) {
    const x = s.x0 + ((s.x1 - s.x0) * i) / n
    const dCentral = (segF(s, x + h) - segF(s, x - h)) / (2 * h)
    if (Math.abs(segDf(s, x) - dCentral) > 1e-6)
      return `f′ mismatch at x=${x.toFixed(3)} (${segDf(s, x)} vs ${dCentral})`
    const intCentral = (segIntF(s, x + h) - segIntF(s, x - h)) / (2 * h)
    if (Math.abs(intCentral - segF(s, x)) > 1e-6)
      return `F′ ≠ f at x=${x.toFixed(3)}`
    const d2Central = (segF(s, x + h) - 2 * segF(s, x) + segF(s, x - h)) / (h * h)
    if (Math.abs(segDdf(s, x) - d2Central) > 1e-3)
      return `f″ mismatch at x=${x.toFixed(3)}`
  }
  return null
}

/* ---------- 2. lints ---------- */
const cardIds = new Set(CARDS.map((c) => c.id))

function lintLevel(lvl: SRLevel): string | null {
  if (lvl.coach.trim().split(/\s+/).length > 6) return `coach >6 words`
  if (lvl.cardId && !cardIds.has(lvl.cardId)) return `cardId ${lvl.cardId} unresolved`
  if (lvl.terrain.length > 5) return `${lvl.terrain.length} segments > 5`
  // band + C0 at touching joins
  for (const s of lvl.terrain) {
    for (let i = 0; i <= 50; i++) {
      const x = s.x0 + ((s.x1 - s.x0) * i) / 50
      const y = segF(s, x)
      if (y < -6 - 1e-9 || y > 14 + 1e-9) return `terrain y=${y.toFixed(2)} out of band at x=${x.toFixed(1)}`
    }
    const err = crossCheckSeg(s)
    if (err) return err
  }
  const sorted = [...lvl.terrain].sort((a, b) => a.x0 - b.x0)
  for (let i = 0; i + 1 < sorted.length; i++) {
    const l = sorted[i]!
    const r = sorted[i + 1]!
    if (Math.abs(l.x1 - r.x0) < 1e-9) {
      const d = Math.abs(segF(l, l.x1) - segF(r, r.x0))
      if (d > 1e-9) return `C0 break at x=${l.x1} (Δy=${d.toFixed(4)})`
    }
  }
  // portals
  for (const p of lvl.portals ?? []) {
    const ya = terrainF(lvl.terrain, p.a)
    const yb = terrainF(lvl.terrain, p.b)
    if (ya === null || yb === null) return `portal ${p.a}→${p.b} off terrain`
    if (Math.abs(yb - ya) > 4 + 1e-9) return `portal |Δh| ${Math.abs(yb - ya).toFixed(2)} > 4`
    if (Number.isNaN(portalExitSpeed(lvl.terrain, p, 12))) return `portal ${p.a}→${p.b} unreachable at 12 u/s`
  }
  // goal on terrain
  if (terrainF(lvl.terrain, lvl.canonical.goalX) === null) return `goalX not on terrain`
  // shards: on-line on terrain, air shards in gaps
  for (const sh of lvl.shards) {
    const f = terrainF(lvl.terrain, sh.x)
    if (sh.air) {
      if (f !== null && (sh.y - f < 0.5 || sh.y - f > 3.5))
        return `air shard altitude ${(sh.y - f).toFixed(2)} out of [0.5, 3.5] at x=${sh.x}`
    } else {
      if (f === null) return `grounded shard in gap at x=${sh.x}`
      if (Math.abs(sh.y - (f + 0.5)) > 0.05) return `shard floats ${Math.abs(sh.y - (f + 0.5)).toFixed(2)} off terrain (must be +0.5)`
    }
  }
  return null
}

/* ---------- 3. canonical simulation ---------- */
interface SimResult {
  finished: boolean
  got: number
  total: number
  strandX: number | null
  portalErrs: string[]
  simMs: number
}

function inWindows(windows: readonly [number, number][], x: number): boolean {
  return windows.some(([a, b]) => x >= a && x <= b)
}

function simulate(
  terrain: readonly Seg[],
  shards: { x: number; y: number; air?: boolean }[],
  canonical: { goalX: number; coast: [number, number][]; hops: number[] },
  portals: readonly Portal[] | undefined,
  rule: MotionRule | undefined,
  spawnX = 0,
  maxSeconds = 120,
): SimResult {
  const spawnF = terrainF(terrain, spawnX)
  if (spawnF === null) return { finished: false, got: 0, total: shards.length, strandX: spawnX, portalErrs: [], simMs: 0 }
  let x = spawnX
  let y = spawnF
  let vx = 0.5
  let vy = 0
  let grounded = true
  const got = new Set<number>()
  const hopsUsed = new Set<number>()
  const portalErrs: string[] = []
  const portalCooldown = new Map<string, number>()
  let strandSteps = 0
  const maxSteps = Math.ceil(maxSeconds / PHYS_DT)
  let steps = 0

  for (steps = 0; steps < maxSteps; steps++) {
    const carving = !inWindows(canonical.coast, x)
    // shard pickup
    for (let i = 0; i < shards.length; i++) {
      if (got.has(i)) continue
      const sh = shards[i]!
      const tol = sh.air ? AIR_SHARD_TOL : SHARD_TOL
      if (Math.hypot(x - sh.x, y - sh.y) <= tol) got.add(i)
    }
    // hops
    if (grounded) {
      for (const hx of canonical.hops) {
        if (!hopsUsed.has(hx) && Math.abs(x - hx) <= 0.35) {
          const s = segAt(terrain, x)!
          const p = segDf(s, x)
          const n = Math.sqrt(1 + p * p)
          vx += (-p / n) * HOP_IMPULSE
          vy += (1 / n) * HOP_IMPULSE
          hopsUsed.add(hx)
          grounded = false
          break
        }
      }
    }
    // goal
    if (x >= canonical.goalX) {
      return { finished: true, got: got.size, total: shards.length, strandX: null, portalErrs, simMs: steps * PHYS_DT * 1000 }
    }
    if (grounded) {
      const [nx, nvx] = verletGround(terrain, x, vx, PHYS_DT, carving, rule)
      // portal crossing
      for (const p of portals ?? []) {
        const key = `${p.a}->${p.b}`
        if ((portalCooldown.get(key) ?? 0) > steps) continue
        if (x < p.a && nx >= p.a) {
          const vout = portalExitSpeed(terrain, p, Math.abs(nvx))
          if (!Number.isNaN(vout)) {
            const yb = terrainF(terrain, p.b)!
            // verify E conservation against the session's own exit formula
            const eIn = (nvx * nvx) / 2 + G * terrainF(terrain, p.a)!
            const eOut = (vout * vout) / 2 + G * yb
            if (Math.abs(eIn - eOut) > 1e-9) portalErrs.push(`portal ${key} E drift ${Math.abs(eIn - eOut)}`)
            x = p.b
            y = yb
            vx = Math.sign(nvx || 1) * vout
            vy = segDf(segAt(terrain, p.b)!, p.b) * vx
            portalCooldown.set(key, steps + Math.round(1 / PHYS_DT))
            grounded = true
            continue
          }
        }
      }
      // gap check
      const ns = segAt(terrain, nx)
      if (!ns) {
        // go airborne with tangent velocity
        const s = segAt(terrain, x)
        if (s) {
          const p = segDf(s, x)
          vy = p * nvx
          grounded = false
        }
      }
      x = nx
      vx = nvx
      if (grounded) {
        const s2 = segAt(terrain, x)
        if (s2) {
          y = segF(s2, x)
          vy = segDf(s2, x) * vx
        }
      }
      // strand detection (grounded, no carve progress)
      if (Math.abs(vx) < 0.05) {
        if (++strandSteps > 240) return { finished: false, got: got.size, total: shards.length, strandX: x, portalErrs, simMs: steps * PHYS_DT * 1000 }
      } else strandSteps = 0
    } else {
      const [nx, ny, nvx, nvy] = verletAir(x, y, vx, vy, PHYS_DT, rule)
      const land = findLanding(terrain, x, y, nx, ny)
      if (land) {
        const [lvx, lvy] = landVelocity(terrain, land.x, nvx, nvy)
        x = land.x
        y = land.y
        vx = lvx
        vy = lvy
        grounded = true
      } else {
        x = nx
        y = ny
        vx = nvx
        vy = nvy
      }
      if (y < -20) return { finished: false, got: got.size, total: shards.length, strandX: x, portalErrs, simMs: steps * PHYS_DT * 1000 }
    }
  }
  return { finished: false, got: got.size, total: shards.length, strandX: x, portalErrs, simMs: steps * PHYS_DT * 1000 }
}

/* ---------- run: levels ---------- */
const ids = Object.keys(LEVELS).sort((a, b) => {
  const [za, la] = a.split('-').map(Number)
  const [zb, lb] = b.split('-').map(Number)
  return za! - zb! || la! - lb!
})
if (ids.length !== 54) {
  failed++
  failures.push(`level count ${ids.length} ≠ 54`)
}

for (const id of ids) {
  const lvl = LEVELS[id]!
  const lintErr = lintLevel(lvl)
  if (lintErr) {
    fail(id, lvl.name, lintErr)
    continue
  }
  const rule = solvableRule(lvl)
  const r = simulate(lvl.terrain, lvl.shards, lvl.canonical, lvl.portals, rule, lvl.spawnX ?? 0)
  if (r.portalErrs.length > 0) {
    fail(id, lvl.name, r.portalErrs[0]!)
    continue
  }
  if (!r.finished) {
    fail(id, lvl.name, `canonical line does not finish (stranded at x=${r.strandX?.toFixed(1)}, ${r.got}/${r.total} light)`)
    continue
  }
  if (r.got < r.total) {
    fail(id, lvl.name, `canonical line misses light (${r.got}/${r.total})`)
    continue
  }
  // Z6 sensitivity: ±0.1 around solvable must not BOTH pass
  if (lvl.ruleSpec) {
    const variants: MotionRule[] = []
    if (lvl.ruleSpec.wind) {
      const k = lvl.ruleSpec.wind.solvable
      variants.push({ windK: k + 0.1 }, { windK: k - 0.1 })
    }
    if (lvl.ruleSpec.spring) {
      const k = lvl.ruleSpec.spring.solvable
      const base: MotionRule = lvl.ruleSpec.wind ? { windK: lvl.ruleSpec.wind.solvable } : {}
      variants.push(
        { ...base, springK: k + 0.1, springX0: lvl.ruleSpec.spring.x0 },
        { ...base, springK: k - 0.1, springX0: lvl.ruleSpec.spring.x0 },
      )
    }
    const passCount = variants.filter(
      (v) => simulate(lvl.terrain, lvl.shards, lvl.canonical, lvl.portals, v, lvl.spawnX ?? 0, 60).finished,
    ).length
    if (passCount === variants.length) {
      fail(id, lvl.name, 'rule does not matter (all ±0.1 variants finish)')
      continue
    }
  }
  pass(id, lvl.name, `${(r.simMs / 1000).toFixed(1)}s, ${r.got}/${r.total} light`)
}

/* ---------- 4. boss ---------- */
function simulateRidge(ridge: BossRidge, ridgeIdx: number): { ok: boolean; why?: string } {
  // wall model (feasibility witness): EMA speed − offset + per-ridge gain
  const wallSpeedBase = (avg: number) => Math.max(3, avg - 2) + 0.5 * ridgeIdx
  const spawnX = 0
  const f0 = terrainF(ridge.terrain, spawnX)
  if (f0 === null) return { ok: false, why: 'spawn off terrain' }
  let x = spawnX
  let y = f0
  let vx = 0.5
  let vy = 0
  let grounded = true
  let wallX = spawnX - 10
  let ema = 3
  const got = new Set<number>()
  const maxSteps = Math.ceil(90 / PHYS_DT)
  for (let s = 0; s < maxSteps; s++) {
    const carving = !inWindows(ridge.canonical.coast, x)
    for (let i = 0; i < ridge.shards.length; i++) {
      if (got.has(i)) continue
      const sh = ridge.shards[i]!
      const tol = sh.air ? AIR_SHARD_TOL : SHARD_TOL
      if (Math.hypot(x - sh.x, y - sh.y) <= tol) got.add(i)
    }
    if (x >= ridge.canonical.goalX) {
      const need = Math.ceil(0.9 * ridge.shards.length)
      return got.size >= need
        ? { ok: true }
        : { ok: false, why: `finished with ${got.size}/${ridge.shards.length} light (need ${need})` }
    }
    if (grounded) {
      const [nx, nvx] = verletGround(ridge.terrain, x, vx, PHYS_DT, carving, ridge.rule)
      if (!segAt(ridge.terrain, nx)) {
        const sg = segAt(ridge.terrain, x)
        if (sg) {
          vy = segDf(sg, x) * nvx
          grounded = false
        }
      }
      x = nx
      vx = nvx
      if (grounded) {
        const s2 = segAt(ridge.terrain, x)
        if (s2) {
          y = segF(s2, x)
          vy = segDf(s2, x) * vx
        }
      }
    } else {
      const [nx, ny, nvx, nvy] = verletAir(x, y, vx, vy, PHYS_DT, ridge.rule)
      const land = findLanding(ridge.terrain, x, y, nx, ny)
      if (land) {
        const [lvx, lvy] = landVelocity(ridge.terrain, land.x, nvx, nvy)
        x = land.x
        y = land.y
        vx = lvx
        vy = lvy
        grounded = true
      } else {
        x = nx
        y = ny
        vx = nvx
        vy = nvy
      }
    }
    ema = ema * 0.98 + Math.abs(vx) * 0.02
    wallX += wallSpeedBase(ema) * PHYS_DT
    if (wallX >= x - 0.2) return { ok: false, why: `wall catches at x=${x.toFixed(1)} (wall speed ${wallSpeedBase(ema).toFixed(1)})` }
  }
  return { ok: false, why: 'timeout before goalX' }
}

if (BOSS.ridges.length !== 3) {
  fail('boss', 'The Avalanche', `expected 3 ridges, got ${BOSS.ridges.length}`)
} else {
  for (let i = 0; i < 3; i++) {
    const ridge = BOSS.ridges[i]!
    for (const s of ridge.terrain) {
      const err = crossCheckSeg(s)
      if (err) fail('boss', `ridge ${i + 1}`, err)
    }
    const r = simulateRidge(ridge, i)
    if (!r.ok) fail('boss', `ridge ${i + 1} ${ridge.name}`, r.why ?? 'unsolvable')
  }
  if (!failures.some((f) => f.startsWith('boss'))) pass('boss', 'The Avalanche', '3 ridges solvable')
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed:`)
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}
console.log(`\nAll 54 levels solvable. Boss: 3 ridges solvable.`)
