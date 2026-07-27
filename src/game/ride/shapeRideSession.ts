import type { EngineOptions, Vec } from '@/kit/engine'
import { clamp, dist, lerp } from '@/kit/engine'
import { Engine } from '@/kit/engine'
import { Session } from '@/kit/session'
import type { HintGesture, SessionEvents } from '@/kit/session'
import { haptics, kitSettings } from '@/kit/lib'
import {
  AIR_SHARD_TOL,
  areaBetween,
  findLanding,
  HOP_IMPULSE,
  landVelocity,
  PHYS_DT,
  portalExitSpeed,
  segAt,
  segDf,
  segF,
  SHARD_TOL,
  terrainF,
  verletAir,
  verletGround,
  type MotionRule,
  type Seg,
} from '../calculus.js'
import { solvableRule, type SRLevel, saveMidLevel } from '../levels.js'
import {
  arcLength,
  buildTerrain,
  buildWindowSegs,
  defaultKnotYs,
  knotXs,
  snapKnotY,
  withinBudget,
} from '../shape.js'
import {
  failThud,
  hop,
  knotTick,
  landThump,
  lineChime,
  overBudgetBuzz,
  portalPass,
  shardChime,
  slowMoIn,
} from '../sfx.js'
import { drawShapeRide } from './shapeRideDraw.js'

/** SHAPE → RIDE → TUNE phase machine (design v3 §2/§6) */
export type Phase = 'shape' | 'ride' | 'freeze'

export type FailReason = 'stall' | 'gate' | 'portal' | 'fell'

export interface FailMarker {
  x: number
  y: number
  reason: FailReason
  /** engine timeMs when the freeze began */
  t0: number
}

export interface ShapeRideExtras {
  phase: Phase
  speed: number
  slope: number
  area: number
  areaTotal: number
  lightGot: number
  lightTotal: number
  slowMo: number
  rule?: MotionRule
  showRuleChip: boolean
  /** per-window arc length vs budget (undefined budget → NaN budget) */
  ink: { used: number; budget?: number }[]
  overBudget: boolean
  canRide: boolean
  attempts: number
  ghostVisible: boolean
  marker: FailMarker | null
}

export interface ShapeRideSerialized {
  knotYs: number[][]
  attempts: number
  rule?: MotionRule
  ghostDismissed: boolean
}

interface PointerState {
  down: boolean
  startX: number
  startY: number
  startMs: number
  x: number
  y: number
}

interface PhysicsState {
  x: number
  y: number
  vx: number
  vy: number
  grounded: boolean
}

interface DragKnot {
  win: number
  knot: number
  /** last quantized y — haptic/sfx tick only on quantum change */
  lastY: number
  overBudgetWarned: boolean
}

const STOP_VX = 0.05
const STALL_AFTER_S = 0.5
const ROLLBACK_VX = -0.15
const ROLLBACK_AFTER_S = 0.75
const FREEZE_MS = 900
const FELL_BELOW_Y = -14
const HOP_ZONE_FRACTION = 0.25
const KNOT_HIT_PX = 44
const SLOW_MO_VY = 1.2
const SLOW_MO_MAX_S = 0.8
const SLOW_MO_COOLDOWN_S = 3
const GHOST_AFTER_ATTEMPTS = 3
const PERSIST_MS = 2000
const CARVE_INPUT_KEY = 'sr-carve-input'

function readCarveInput(): 'hold' | 'toggle' {
  try {
    const v = localStorage.getItem(CARVE_INPUT_KEY)
    if (v === 'toggle') return 'toggle'
  } catch {
    /* noop */
  }
  return 'hold'
}

function isLocalMax(terrain: readonly Seg[], x: number): boolean {
  const y = terrainF(terrain, x)
  if (y === null) return false
  const left = terrainF(terrain, x - 1.5)
  const right = terrainF(terrain, x + 1.5)
  if (left === null || right === null) return false
  return y > left + 0.08 && y > right + 0.08
}

export class ShapeRideSession extends Session<SRLevel, ShapeRideExtras> {
  phase: Phase = 'shape'

  /** per-window player knot y's — the shaped line, the unit of value */
  knotYs: number[][] = []
  /** terrain rebuilt from bedrock + knots after every edit */
  private terrain: Seg[] = []

  private attempts = 0
  private ghostVisible = false
  private ghostDismissed = false
  private marker: FailMarker | null = null
  private freezeT0 = -1000

  private drag: DragKnot | null = null

  // ride state (v2 physics, verbatim behavior)
  private runStarted = false
  private autoHold = false
  private carveInput: 'hold' | 'toggle' = 'hold'
  private pointer: PointerState = { down: false, startX: 0, startY: 0, startMs: 0, x: 0, y: 0 }
  private x = 0
  private y = 0
  private vx = 0
  private vy = 0
  private grounded = true
  private carving = false
  private prev: PhysicsState = { x: 0, y: 0, vx: 0, vy: 0, grounded: true }
  private alpha = 0
  private rule: MotionRule | undefined
  private shardsGot: Set<number> = new Set()
  private portalsCrossed: Set<number> = new Set()
  private accumulator = 0
  private stepDt = PHYS_DT
  private stallTime = 0
  private rollbackTime = 0
  private slowMoActive = false
  private slowMoT0 = -1000
  private slowMoCooldownT0 = -1000
  private slowMoFactor = 0
  private lastPersist = 0

  constructor(
    canvas: HTMLCanvasElement,
    level: SRLevel,
    events: SessionEvents<ShapeRideExtras>,
  ) {
    super(canvas, level, events, { engine: { background: 'none' } as EngineOptions })
    this.carveInput = readCarveInput()
    this.rule = solvableRule(level)
    this.knotYs = (level.shape ?? []).map((w) => defaultKnotYs(w))
    this.rebuildTerrain()
    this.resetRideState()
  }

  /* ---- shape phase ---- */

  private rebuildTerrain(): void {
    const windows = this.level.shape ?? []
    this.terrain = windows.length
      ? buildTerrain(this.level.terrain, windows, this.knotYs)
      : [...this.level.terrain].sort((a, b) => a.x0 - b.x0)
  }

  /** all knots as world points, for hit-testing and drawing */
  knotPoints(): { win: number; knot: number; x: number; y: number }[] {
    const pts: { win: number; knot: number; x: number; y: number }[] = []
    ;(this.level.shape ?? []).forEach((w, wi) => {
      knotXs(w).forEach((x, ki) => {
        pts.push({ win: wi, knot: ki, x, y: this.knotYs[wi]![ki]! })
      })
    })
    return pts
  }

  private hitKnot(s: Vec): DragKnot | null {
    let best: DragKnot | null = null
    let bestD = KNOT_HIT_PX
    for (const p of this.knotPoints()) {
      const sp = this.engine.worldToScreen(p)
      const d = Math.hypot(sp.x - s.x, sp.y - s.y)
      if (d < bestD) {
        bestD = d
        best = { win: p.win, knot: p.knot, lastY: p.y, overBudgetWarned: false }
      }
    }
    return best
  }

  private dragKnotTo(w: Vec): void {
    if (!this.drag) return
    const win = this.level.shape![this.drag.win]!
    const ys = this.knotYs[this.drag.win]!
    const ny = snapKnotY(win, w.y)
    if (ny === ys[this.drag.knot]) return
    ys[this.drag.knot] = ny
    if (ny !== this.drag.lastY) {
      this.drag.lastY = ny
      haptics.tick()
      knotTick((ny - win.minY) / Math.max(1e-6, win.maxY - win.minY))
      if (!withinBudget(win, ys) && !this.drag.overBudgetWarned) {
        this.drag.overBudgetWarned = true
        overBudgetBuzz()
      }
      if (withinBudget(win, ys)) this.drag.overBudgetWarned = false
    }
    this.rebuildTerrain()
    this.marker = null
    this.persistSoon()
  }

  get canRide(): boolean {
    const windows = this.level.shape ?? []
    return windows.every((w, i) => withinBudget(w, this.knotYs[i]!))
  }

  get inkInfo(): { used: number; budget?: number }[] {
    return (this.level.shape ?? []).map((w, i) => ({
      used: arcLength(buildWindowSegs(w, this.knotYs[i]!)),
      budget: w.ink,
    }))
  }

  /* ---- public controls (Gameplay.tsx) ---- */

  startRide(): void {
    if (this.phase === 'ride') return
    if (!this.canRide) {
      this.events.onToast('Line is over the ink limit')
      overBudgetBuzz()
      this.engine.shake(0.4)
      return
    }
    this.marker = null
    this.ghostVisible = false
    this.phase = 'ride'
    this.resetRideState()
    this.runStarted = true
    this.autoHold = true
    this.carving = true
    this.persistSoon()
    this.emit()
  }

  backToShape(): void {
    if (this.phase === 'shape') return
    this.phase = 'shape'
    this.marker = null
    this.autoHold = false
    this.frameContent()
    this.persistSoon()
    this.emit()
  }

  /** ghost = solution knots as a translucent line (design v3 §6) */
  showGhost(): void {
    this.ghostVisible = true
    this.ghostDismissed = false
    this.emit()
  }

  dismissGhost(): void {
    this.ghostVisible = false
    this.ghostDismissed = true
    this.emit()
  }

  setRule(rule: MotionRule | undefined): void {
    this.rule = rule
  }

  /* ---- subclass contract ---- */

  onDown(_w: Vec, s: Vec): void {
    if (this.phase === 'shape') {
      this.drag = this.hitKnot(s)
      if (this.drag) haptics.tick()
      return
    }
    if (this.phase !== 'ride') return
    this.autoHold = false
    this.pointer.down = true
    this.pointer.startX = s.x
    this.pointer.startY = s.y
    this.pointer.startMs = this.engine.timeMs
    this.pointer.x = s.x
    this.pointer.y = s.y
    const inCarveZone = s.y <= this.engine.cssH * (1 - HOP_ZONE_FRACTION)
    if (inCarveZone) {
      this.carving = this.carveInput === 'toggle' ? !this.carving : true
    }
  }

  onMove(w: Vec, s: Vec): void {
    if (this.phase === 'shape') {
      this.dragKnotTo(w)
      return
    }
    this.pointer.x = s.x
    this.pointer.y = s.y
  }

  onUp(_w: Vec, _s: Vec): void {
    if (this.phase === 'shape') {
      if (this.drag) {
        const win = this.level.shape![this.drag.win]!
        if (withinBudget(win, this.knotYs[this.drag.win]!)) lineChime()
        this.drag = null
        this.persistSoon()
      }
      return
    }
    if (this.phase !== 'ride') return
    const wasTap =
      this.pointer.down &&
      this.engine.timeMs - this.pointer.startMs < 250 &&
      Math.hypot(this.pointer.x - this.pointer.startX, this.pointer.y - this.pointer.startY) < 12
    const inHopZone = this.pointer.startY > this.engine.cssH * (1 - HOP_ZONE_FRACTION)
    if (wasTap && inHopZone && this.grounded) this.hop()
    if (this.carveInput === 'hold') this.carving = false
    this.pointer.down = false
  }

  update(dtMs: number): void {
    if (this.state === 'won') return
    const dt = clamp(dtMs / 1000, 0, 0.1)

    if (this.phase === 'freeze') {
      if (this.engine.timeMs - this.freezeT0 > FREEZE_MS) {
        this.phase = 'shape'
        if (
          this.attempts >= GHOST_AFTER_ATTEMPTS &&
          !this.ghostDismissed &&
          kitSettings().ghostHints
        ) {
          this.ghostVisible = true
        }
        this.frameContent()
      }
      this.emit()
      return
    }

    if (this.phase === 'ride') {
      const lowEnd =
        typeof navigator !== 'undefined' && (navigator.hardwareConcurrency ?? 8) <= 4
      this.stepDt = lowEnd ? PHYS_DT * 2 : PHYS_DT
      if (this.runStarted) {
        this.accumulator += dt
        while (this.accumulator >= this.stepDt) {
          this.savePrev()
          this.stepPhysics(this.stepDt)
          this.accumulator -= this.stepDt
        }
        this.alpha = this.accumulator / this.stepDt
      }
      this.updateRideCamera()
      this.updateSlowMo()
      this.checkRideFailure(dt)
      if (this.x >= this.level.canonical.goalX) this.doWin()
      this.emit()
      return
    }

    // shape phase: idle camera only
    this.emit()
  }

  drawWorld(ctx: CanvasRenderingContext2D, eng: Engine): void {
    drawShapeRide(ctx, eng, this)
  }

  equation(): string {
    return this.phase === 'ride' ? `${this.speed.toFixed(1)} u/s` : ''
  }

  go(): void {
    /* shape/ride has no commit action; Ride is a DOM button */
  }

  reset(): void {
    this.knotYs = (this.level.shape ?? []).map((w) => defaultKnotYs(w))
    this.rebuildTerrain()
    this.attempts = 0
    this.marker = null
    this.ghostVisible = false
    this.phase = 'shape'
    this.resetRideState()
    this.engine.shake(0)
    this.frameContent()
    this.emit()
  }

  hintPath(): HintGesture | null {
    return null
  }

  winBursts(): Vec[] {
    const gx = this.level.canonical.goalX
    const gy = terrainF(this.terrain, gx) ?? this.y
    return [{ x: gx, y: gy }]
  }

  contentBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (const s of this.terrain) {
      minX = Math.min(minX, s.x0)
      maxX = Math.max(maxX, s.x1)
      for (let i = 0; i <= 24; i++) {
        const y = segF(s, s.x0 + ((s.x1 - s.x0) * i) / 24)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)
      }
    }
    for (const sh of this.level.shards) {
      maxY = Math.max(maxY, sh.y + 0.5)
    }
    return { minX: minX - 1.5, minY: minY - 1.5, maxX: maxX + 1.5, maxY: maxY + 2 }
  }

  uiExtras(): ShapeRideExtras {
    const ink = this.inkInfo
    return {
      phase: this.phase,
      speed: this.speed,
      slope: this.slope,
      area: this.area,
      areaTotal: this.areaTotal,
      lightGot: this.shardsGot.size,
      lightTotal: this.level.shards.length,
      slowMo: this.slowMoFactor,
      rule: this.rule,
      showRuleChip: this.level.zone === 6,
      ink,
      overBudget: !this.canRide,
      canRide: this.canRide,
      attempts: this.attempts,
      ghostVisible: this.ghostVisible,
      marker: this.marker,
    }
  }

  serialize(): ShapeRideSerialized {
    return {
      knotYs: this.knotYs.map((ys) => [...ys]),
      attempts: this.attempts,
      rule: this.rule,
      ghostDismissed: this.ghostDismissed,
    }
  }

  restore(data: unknown): void {
    if (!data || typeof data !== 'object') return
    const d = data as Partial<ShapeRideSerialized>
    if (Array.isArray(d.knotYs)) {
      const windows = this.level.shape ?? []
      this.knotYs = windows.map((w, i) => {
        const saved = d.knotYs![i]
        if (!Array.isArray(saved) || saved.length !== w.knots) return defaultKnotYs(w)
        return saved.map((y) => snapKnotY(w, typeof y === 'number' ? y : 0))
      })
      this.rebuildTerrain()
    }
    if (typeof d.attempts === 'number') this.attempts = d.attempts
    if (d.rule !== undefined) this.rule = d.rule
    if (d.ghostDismissed !== undefined) this.ghostDismissed = d.ghostDismissed
    this.phase = 'shape'
    this.resetRideState()
  }

  persist(): void {
    if (this.state === 'won') return
    this.persistSoon()
  }

  private persistSoon(): void {
    if (this.engine.timeMs - this.lastPersist < PERSIST_MS) return
    this.lastPersist = this.engine.timeMs
    saveMidLevel(this.level.id, this.serialize())
  }

  /* ---- draw accessors ---- */

  get terrainSegs(): readonly Seg[] {
    return this.terrain
  }

  get renderState(): PhysicsState & { alpha: number; pointer: PointerState } {
    const alpha = this.alpha
    const rx = lerp(this.prev.x, this.x, alpha)
    const ry =
      this.grounded && this.prev.grounded
        ? terrainF(this.terrain, rx) ?? lerp(this.prev.y, this.y, alpha)
        : lerp(this.prev.y, this.y, alpha)
    return {
      x: rx,
      y: ry,
      vx: lerp(this.prev.vx, this.vx, alpha),
      vy: lerp(this.prev.vy, this.vy, alpha),
      grounded: this.prev.grounded,
      alpha,
      pointer: this.pointer,
    }
  }

  get extrasForDraw() {
    return {
      phase: this.phase,
      slowMoFactor: this.slowMoFactor,
      shards: this.level.shards,
      shardsGot: this.shardsGot,
      portals: this.level.portals ?? [],
      goalX: this.level.canonical.goalX,
      zone: this.level.zone,
      windows: this.level.shape ?? [],
      knotYs: this.knotYs,
      drag: this.drag,
      marker: this.marker,
      ghostVisible: this.ghostVisible,
      freezeT0: this.freezeT0,
      runStarted: this.runStarted,
    }
  }

  /* ---- ride internals (v2 physics, verbatim) ---- */

  private resetRideState(): void {
    const x0 = this.level.spawnX ?? 0
    const y0 = terrainF(this.terrain, x0)
    this.x = x0
    this.y = y0 ?? 0
    this.vx = 0
    this.vy = 0
    this.grounded = y0 !== null
    this.carving = false
    this.runStarted = false
    this.autoHold = false
    this.accumulator = 0
    this.alpha = 0
    this.shardsGot = new Set()
    this.portalsCrossed = new Set()
    this.stallTime = 0
    this.rollbackTime = 0
    this.slowMoFactor = 0
    this.slowMoActive = false
    this.prev = { x: this.x, y: this.y, vx: 0, vy: 0, grounded: this.grounded }
  }

  private savePrev(): void {
    this.prev = { x: this.x, y: this.y, vx: this.vx, vy: this.vy, grounded: this.grounded }
  }

  private stepPhysics(dt: number): void {
    if (this.grounded) {
      this.stepGrounded(dt)
    } else {
      this.stepAirborne(dt)
    }
    this.collectShards()
  }

  private stepGrounded(dt: number): void {
    const terrain = this.terrain
    const s = segAt(terrain, this.x)
    if (!s) {
      this.grounded = false
      return
    }
    const p = segDf(s, this.x)
    const [nx, nvx] = verletGround(terrain, this.x, this.vx, dt, this.carving, this.rule)
    const ns = segAt(terrain, nx)

    if (!this.carving || ns === null) {
      let launchX = nx
      if (ns === null) launchX = s.x1
      const ls = segAt(terrain, launchX) ?? s
      const lp = segDf(ls, launchX)
      const speed = Math.abs(nvx) * Math.sqrt(1 + p * p)
      const ln = Math.sqrt(1 + lp * lp)
      const sign = nvx >= 0 ? 1 : -1
      this.vx = (sign * speed) / ln
      this.vy = this.vx * lp
      this.x = launchX
      this.y = terrainF(terrain, launchX) ?? segF(ls, launchX)
      this.grounded = false
      return
    }

    this.x = nx
    this.vx = nvx
    this.y = terrainF(terrain, this.x) ?? segF(ns, this.x)
    const np = segDf(ns, this.x)
    this.vy = np * this.vx
    this.checkPortals()
  }

  private stepAirborne(dt: number): void {
    const terrain = this.terrain
    const [nx, ny, nvx, nvy] = verletAir(this.x, this.y, this.vx, this.vy, dt, this.rule)
    const land = findLanding(terrain, this.x, this.y, nx, ny)
    if (land) {
      const vyBefore = this.vy
      this.x = land.x
      this.y = land.y
      ;[this.vx, this.vy] = landVelocity(terrain, this.x, this.vx, this.vy)
      this.grounded = true
      this.carving = this.carveInput === 'toggle' ? this.carving : this.pointer.down || this.autoHold
      const impact = Math.abs(nvy - vyBefore)
      landThump(clamp(impact / 8, 0, 1))
      haptics.tick()
    } else {
      this.x = nx
      this.y = ny
      this.vx = nvx
      this.vy = nvy
    }
  }

  private hop(): void {
    if (!this.grounded) return
    const s = segAt(this.terrain, this.x)
    if (!s) return
    const p = segDf(s, this.x)
    const n = Math.sqrt(1 + p * p)
    this.vx += (-p / n) * HOP_IMPULSE
    this.vy += (1 / n) * HOP_IMPULSE
    this.grounded = false
    hop()
    haptics.tick()
  }

  private checkPortals(): void {
    const terrain = this.terrain
    const portals = this.level.portals
    if (!portals) return
    for (let i = 0; i < portals.length; i++) {
      if (this.portalsCrossed.has(i)) continue
      const portal = portals[i]!
      const crossed = this.prev.x < portal.a && this.x >= portal.a
      if (!crossed) continue
      const ya = terrainF(terrain, portal.a)
      if (ya === null) continue
      if (this.y < ya - 0.5 || this.y > ya + 2) continue
      const vin = Math.hypot(this.vx, this.vy)
      const vout = portalExitSpeed(terrain, portal, vin)
      if (Number.isNaN(vout)) {
        this.failRide('portal', portal.a, ya)
        return
      }
      const sb = segAt(terrain, portal.b)
      if (!sb) continue
      const pb = segDf(sb, portal.b)
      const nb = Math.sqrt(1 + pb * pb)
      this.x = portal.b
      this.y = terrainF(terrain, portal.b) ?? segF(sb, portal.b)
      this.vx = vout / nb
      this.vy = pb * this.vx
      this.portalsCrossed.add(i)
      portalPass()
      haptics.tick()
      break
    }
  }

  private collectShards(): void {
    for (let i = 0; i < this.level.shards.length; i++) {
      if (this.shardsGot.has(i)) continue
      const shard = this.level.shards[i]!
      const limit = shard.air ? AIR_SHARD_TOL : SHARD_TOL
      if (dist({ x: this.x, y: this.y }, { x: shard.x, y: shard.y }) <= limit) {
        this.shardsGot.add(i)
        const frac = this.areaTotal > 0 ? this.area / this.areaTotal : 0
        shardChime(frac)
        haptics.tick()
      }
    }
  }

  /** design v3 §6: failure → freeze → TUNE (never a fail screen) */
  private checkRideFailure(dt: number): void {
    if (this.phase !== 'ride' || !this.runStarted || this.state === 'won') return
    if (this.grounded && Math.abs(this.vx) < STOP_VX) {
      this.stallTime += dt
      if (this.stallTime >= STALL_AFTER_S) return this.failRide('stall', this.x, this.y)
    } else {
      this.stallTime = 0
    }
    if (this.grounded && this.vx < ROLLBACK_VX) {
      this.rollbackTime += dt
      if (this.rollbackTime >= ROLLBACK_AFTER_S) return this.failRide('stall', this.x, this.y)
    } else {
      this.rollbackTime = 0
    }
    if (this.y < FELL_BELOW_Y) return this.failRide('fell', this.x, this.y)
    const lastX = this.terrain[this.terrain.length - 1]?.x1 ?? this.level.canonical.goalX
    if (this.x > lastX + 3 || this.x < (this.terrain[0]?.x0 ?? 0) - 3) {
      return this.failRide('gate', this.level.canonical.goalX, terrainF(this.terrain, this.level.canonical.goalX) ?? this.y)
    }
  }

  private failRide(reason: FailReason, x: number, y: number): void {
    if (this.phase !== 'ride') return
    this.attempts++
    this.marker = { x, y, reason, t0: this.engine.timeMs }
    this.phase = 'freeze'
    this.freezeT0 = this.engine.timeMs
    this.autoHold = false
    failThud()
    haptics.tick()
    this.persistSoon()
    this.emit()
  }

  private updateRideCamera(): void {
    const eng = this.engine
    const targetX = this.x + clamp(this.vx * 0.35, 1, 4)
    const visibleH = eng.cssH / eng.cam.scale
    const targetY = this.y - 0.1 * visibleH
    const targetScale = clamp(eng.cssW / 8, 26, 56)
    const reduce = eng.reduceMotion
    eng.cam.cx = reduce ? targetX : lerp(eng.cam.cx, targetX, 0.08)
    eng.cam.cy = reduce ? targetY : lerp(eng.cam.cy, targetY, 0.08)
    eng.cam.scale = reduce ? targetScale : lerp(eng.cam.scale, targetScale, 0.04)
  }

  private updateSlowMo(): void {
    if (kitSettings().reduceMotion) {
      this.slowMoFactor = 0
      return
    }
    const now = this.engine.timeMs
    const canTrigger =
      !this.grounded &&
      Math.abs(this.vy) < SLOW_MO_VY &&
      isLocalMax(this.terrain, this.x) &&
      now - this.slowMoCooldownT0 > SLOW_MO_COOLDOWN_S * 1000

    if (canTrigger && !this.slowMoActive) {
      this.slowMoActive = true
      this.slowMoT0 = now
      slowMoIn()
      haptics.purr()
    }

    if (this.slowMoActive) {
      const age = (now - this.slowMoT0) / 1000
      if (age < 0.2) {
        this.slowMoFactor = age / 0.2
      } else if (age < 0.2 + SLOW_MO_MAX_S) {
        this.slowMoFactor = 1
      } else if (age < 0.2 + SLOW_MO_MAX_S + 0.2) {
        this.slowMoFactor = 1 - (age - (0.2 + SLOW_MO_MAX_S)) / 0.2
      } else {
        this.slowMoActive = false
        this.slowMoCooldownT0 = now
        this.slowMoFactor = 0
      }
      if (!canTrigger && this.slowMoFactor < 0.5) {
        this.slowMoActive = false
        this.slowMoCooldownT0 = now
      }
    } else {
      this.slowMoFactor = 0
    }
  }

  /* ---- derived values ---- */

  private get speed(): number {
    return Math.hypot(this.vx, this.vy)
  }

  private get slope(): number {
    const s = segAt(this.terrain, this.x)
    if (!s) return 0
    return clamp(segDf(s, this.x), -3, 3)
  }

  private get area(): number {
    const x0 = this.level.spawnX ?? 0
    return Math.max(0, areaBetween(this.terrain, x0, this.x))
  }

  private get areaTotal(): number {
    const x0 = this.level.spawnX ?? 0
    const last = this.terrain[this.terrain.length - 1]
    const x1 = last?.x1 ?? x0 + 1
    return Math.max(1e-6, areaBetween(this.terrain, x0, x1))
  }
}
