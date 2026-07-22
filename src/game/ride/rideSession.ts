import type { EngineOptions, Vec } from '@gridverse/kit/engine'
import { clamp, dist, lerp } from '@gridverse/kit/engine'
import { Engine } from '@gridverse/kit/engine'
import { Session } from '@gridverse/kit/session'
import type { HintGesture, SessionEvents } from '@gridverse/kit/session'
import { haptics, kitSettings } from '@gridverse/kit/lib'
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
  type GhostFrame,
  type MotionRule,
  type Seg,
} from '../calculus.js'
import { solvableRule, type SRLevel, saveMidLevel } from '../levels.js'
import {
  hop,
  landThump,
  nudge as nudgeSfx,
  portalPass,
  shardChime,
  slowMoIn,
} from '../sfx.js'
import { drawRide } from './rideDraw.js'

export interface RideExtras {
  speed: number
  slope: number
  area: number
  areaTotal: number
  lightGot: number
  lightTotal: number
  nudgePrompt: boolean
  slowMo: number
  rule?: MotionRule
  showRuleChip: boolean
}

export interface RideSerialized {
  x: number
  y: number
  vx: number
  vy: number
  grounded: boolean
  carving: boolean
  shardsGot: number[]
  portalsCrossed: number[]
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

const STOP_VX = 0.05
const NUDGE_AFTER_STOP = 3
const HOP_ZONE_FRACTION = 0.25
const SLOW_MO_VY = 1.2
const SLOW_MO_MAX_S = 0.8
const SLOW_MO_COOLDOWN_S = 3
const CARVE_INPUT_KEY = 'sr-carve-input'
const PERSIST_MS = 2000

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

export class RideSession extends Session<SRLevel, RideExtras> {
  private runStarted = false
  private carveInput: 'hold' | 'toggle' = 'hold'
  private pointer: PointerState = {
    down: false,
    startX: 0,
    startY: 0,
    startMs: 0,
    x: 0,
    y: 0,
  }

  // current physics state
  private x = 0
  private y = 0
  private vx = 0
  private vy = 0
  private grounded = true
  private carving = false

  // previous state for render interpolation
  private prev: PhysicsState = { x: 0, y: 0, vx: 0, vy: 0, grounded: true }
  private alpha = 0

  private rule: MotionRule | undefined
  private shardsGot: Set<number> = new Set()
  private portalsCrossed: Set<number> = new Set()

  private accumulator = 0
  private stepDt = PHYS_DT

  private stopTime = 0
  private nudgePrompt = false

  private slowMoActive = false
  private slowMoT0 = -1000
  private slowMoCooldownT0 = -1000
  private slowMoFactor = 0

  private ghostFrames: GhostFrame[] = []
  private ghostReplay = false
  private ghostDismissed = false

  private lastPersist = 0

  constructor(
    canvas: HTMLCanvasElement,
    level: SRLevel,
    events: SessionEvents<RideExtras>,
  ) {
    super(canvas, level, events, {
      engine: { background: 'none' } as EngineOptions,
    })
    this.carveInput = readCarveInput()
    this.rule = solvableRule(level)
    this.resetState()
    this.ghostFrames = this.simulateCanonical()
  }

  /* ---- subclass contract ---- */

  onDown(_w: Vec, s: Vec): void {
    this.pointer.down = true
    this.pointer.startX = s.x
    this.pointer.startY = s.y
    this.pointer.startMs = this.engine.timeMs
    this.pointer.x = s.x
    this.pointer.y = s.y

    const inCarveZone = s.y <= this.engine.cssH * (1 - HOP_ZONE_FRACTION)
    if (inCarveZone) {
      if (this.carveInput === 'toggle') {
        this.carving = !this.carving
      } else {
        this.carving = true
      }
      if (!this.runStarted) {
        this.runStarted = true
      }
      this.dismissGhost()
    }
  }

  onMove(_w: Vec, s: Vec): void {
    this.pointer.x = s.x
    this.pointer.y = s.y
  }

  onUp(_w: Vec, _s: Vec): void {
    const wasTap =
      this.pointer.down &&
      this.engine.timeMs - this.pointer.startMs < 250 &&
      Math.hypot(this.pointer.x - this.pointer.startX, this.pointer.y - this.pointer.startY) < 12

    const inHopZone = this.pointer.startY > this.engine.cssH * (1 - HOP_ZONE_FRACTION)
    if (wasTap && inHopZone && this.grounded) {
      this.hop()
      if (!this.runStarted) this.runStarted = true
    }

    if (this.carveInput === 'hold') {
      this.carving = false
    }
    this.pointer.down = false
  }

  update(dtMs: number): void {
    if (this.state === 'won') return

    const dt = clamp(dtMs / 1000, 0, 0.1)
    const lowEnd =
      typeof navigator !== 'undefined' && (navigator.hardwareConcurrency ?? 8) <= 4
    this.stepDt = lowEnd ? PHYS_DT * 2 : PHYS_DT

    if (this.runStarted && this.state === 'play') {
      this.accumulator += dt
      while (this.accumulator >= this.stepDt) {
        this.savePrev()
        this.step(this.stepDt)
        this.accumulator -= this.stepDt
      }
      this.alpha = this.accumulator / this.stepDt
    } else {
      this.alpha = 0
    }

    this.updateCamera()
    this.updateSlowMo(dt)
    this.updateNudge(dt)
    this.checkGhostIdle()

    if (this.x >= this.level.canonical.goalX && this.state === 'play') {
      this.doWin()
    }

    this.emit()
  }

  drawWorld(ctx: CanvasRenderingContext2D, eng: Engine): void {
    drawRide(ctx, eng, this)
  }

  equation(): string {
    return `${this.speed.toFixed(1)} u/s`
  }

  go(): void {
    /* no-op: runner has no commit action */
  }

  reset(): void {
    this.runStarted = false
    this.carving = false
    this.pointer.down = false
    this.accumulator = 0
    this.alpha = 0
    this.ghostReplay = false
    this.ghostDismissed = false
    this.resetState()
    this.ghostFrames = this.simulateCanonical()
    this.engine.shake(0)
    this.emit()
  }

  hintPath(): HintGesture | null {
    return null
  }

  winBursts(): Vec[] {
    const gx = this.level.canonical.goalX
    const gy = terrainF(this.level.terrain, gx) ?? this.y
    return [{ x: gx, y: gy }]
  }

  contentBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    const x0 = this.level.spawnX ?? 0
    const y0 = terrainF(this.level.terrain, x0) ?? 0
    return { minX: x0 - 4, minY: y0 - 3, maxX: x0 + 12, maxY: y0 + 7 }
  }

  uiExtras(): RideExtras {
    return {
      speed: this.speed,
      slope: this.slope,
      area: this.area,
      areaTotal: this.areaTotal,
      lightGot: this.shardsGot.size,
      lightTotal: this.level.shards.length,
      nudgePrompt: this.nudgePrompt,
      slowMo: this.slowMoFactor,
      rule: this.rule,
      showRuleChip: this.level.zone === 6,
    }
  }

  serialize(): RideSerialized {
    return {
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      grounded: this.grounded,
      carving: this.carving,
      shardsGot: Array.from(this.shardsGot),
      portalsCrossed: Array.from(this.portalsCrossed),
      rule: this.rule,
      ghostDismissed: this.ghostDismissed,
    }
  }

  restore(data: unknown): void {
    if (!data || typeof data !== 'object') return
    const d = data as Partial<RideSerialized>
    if (d.x !== undefined) this.x = d.x
    if (d.y !== undefined) this.y = d.y
    if (d.vx !== undefined) this.vx = d.vx
    if (d.vy !== undefined) this.vy = d.vy
    if (d.grounded !== undefined) this.grounded = d.grounded
    if (d.carving !== undefined) this.carving = d.carving
    if (Array.isArray(d.shardsGot)) this.shardsGot = new Set(d.shardsGot)
    if (Array.isArray(d.portalsCrossed)) this.portalsCrossed = new Set(d.portalsCrossed)
    if (d.rule !== undefined) this.rule = d.rule
    if (d.ghostDismissed !== undefined) this.ghostDismissed = d.ghostDismissed
    this.prev = { x: this.x, y: this.y, vx: this.vx, vy: this.vy, grounded: this.grounded }
    this.runStarted = true
  }

  persist(): void {
    if (this.state === 'won') return
    if (this.engine.timeMs - this.lastPersist < PERSIST_MS) return
    this.lastPersist = this.engine.timeMs
    saveMidLevel(this.level.id, this.serialize())
  }

  /* ---- public controls used by Gameplay.tsx ---- */

  nudge(): void {
    this.vx += 2
    this.nudgePrompt = false
    this.stopTime = 0
    nudgeSfx()
    haptics.tick()
  }

  setRule(rule: MotionRule | undefined): void {
    this.rule = rule
  }

  showGhost(): void {
    this.ghostReplay = true
    this.ghostDismissed = false
  }

  dismissGhost(): void {
    this.ghostReplay = false
    this.ghostDismissed = true
  }

  get renderState(): PhysicsState & { alpha: number; pointer: PointerState } {
    const alpha = this.alpha
    const rx = lerp(this.prev.x, this.x, alpha)
    const ry =
      this.grounded && this.prev.grounded
        ? terrainF(this.level.terrain, rx) ?? lerp(this.prev.y, this.y, alpha)
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
      ghostFrames: this.ghostFrames,
      ghostReplay: this.ghostReplay,
      slowMoFactor: this.slowMoFactor,
      shards: this.level.shards,
      shardsGot: this.shardsGot,
      portals: this.level.portals ?? [],
      goalX: this.level.canonical.goalX,
      zone: this.level.zone,
    }
  }

  /* ---- private physics ---- */

  private resetState(): void {
    const x0 = this.level.spawnX ?? 0
    const y0 = terrainF(this.level.terrain, x0)
    this.x = x0
    this.y = y0 ?? 0
    this.vx = 0
    this.vy = 0
    this.grounded = y0 !== null
    this.carving = false
    this.shardsGot = new Set()
    this.portalsCrossed = new Set()
    this.stopTime = 0
    this.nudgePrompt = false
    this.rule = solvableRule(this.level)
    this.prev = { x: this.x, y: this.y, vx: 0, vy: 0, grounded: this.grounded }
  }

  private savePrev(): void {
    this.prev = {
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      grounded: this.grounded,
    }
  }

  private step(dt: number): void {
    if (this.grounded) {
      this.stepGrounded(dt)
    } else {
      this.stepAirborne(dt)
    }
    this.collectShards()
  }

  private stepGrounded(dt: number): void {
    const terrain = this.level.terrain
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
      if (ns === null) {
        launchX = s.x1
      }
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
    const terrain = this.level.terrain
    const [nx, ny, nvx, nvy] = verletAir(this.x, this.y, this.vx, this.vy, dt, this.rule)
    const land = findLanding(terrain, this.x, this.y, nx, ny)
    if (land) {
      const vyBefore = this.vy
      this.x = land.x
      this.y = land.y
      ;[this.vx, this.vy] = landVelocity(terrain, this.x, this.vx, this.vy)
      this.grounded = true
      this.carving = this.carveInput === 'toggle' ? this.carving : this.pointer.down
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
    const s = segAt(this.level.terrain, this.x)
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
    const terrain = this.level.terrain
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
        this.events.onToast('Faster for the door')
        continue
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

  private updateCamera(): void {
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

  private updateSlowMo(_dt: number): void {
    if (kitSettings().reduceMotion) {
      this.slowMoFactor = 0
      return
    }

    const now = this.engine.timeMs
    const canTrigger =
      !this.grounded &&
      Math.abs(this.vy) < SLOW_MO_VY &&
      isLocalMax(this.level.terrain, this.x) &&
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

  private updateNudge(dt: number): void {
    if (this.grounded && Math.abs(this.vx) < STOP_VX) {
      this.stopTime += dt
    } else {
      this.stopTime = 0
      this.nudgePrompt = false
    }
    if (this.stopTime >= NUDGE_AFTER_STOP && !this.nudgePrompt) {
      this.nudgePrompt = true
    }
  }

  private checkGhostIdle(): void {
    if (this.ghostDismissed) return
    if (this.ghostReplay) return
    const idle = this.engine.timeMs - this.lastInputMs > 30000
    if (idle && this.state === 'play') {
      this.ghostReplay = true
    }
  }

  private simulateCanonical(): GhostFrame[] {
    const frames: GhostFrame[] = []
    let x = this.level.spawnX ?? 0
    let y = terrainF(this.level.terrain, x) ?? 0
    let vx = 0
    let vy = 0
    let grounded = true
    let carving = true
    const terrain = this.level.terrain
    const rule = this.rule
    const stepDt = PHYS_DT
    const maxSteps = 120 * 90
    let steps = 0

    while (x < this.level.canonical.goalX && steps < maxSteps) {
      const coastNow = this.level.canonical.coast.some(([a, b]) => x >= a && x <= b)
      const shouldHop =
        grounded && this.level.canonical.hops.some((hx) => Math.abs(x - hx) < 0.04)

      carving = !coastNow

      if (grounded) {
        if (shouldHop) {
          const s = segAt(terrain, x)
          if (s) {
            const p = segDf(s, x)
            const n = Math.sqrt(1 + p * p)
            vx += (-p / n) * HOP_IMPULSE
            vy += (1 / n) * HOP_IMPULSE
            grounded = false
          }
        } else {
          const [nx, nvx] = verletGround(terrain, x, vx, stepDt, carving, rule)
          const ns = segAt(terrain, nx)
          if (!carving || ns === null) {
            const s = segAt(terrain, x) ?? ns
            if (s) {
              const launchX = ns === null ? s.x1 : nx
              const ls = segAt(terrain, launchX) ?? s
              const lp = segDf(ls, launchX)
              const p = segDf(s, x)
              const speed = Math.abs(nvx) * Math.sqrt(1 + p * p)
              const ln = Math.sqrt(1 + lp * lp)
              const sign = nvx >= 0 ? 1 : -1
              vx = (sign * speed) / ln
              vy = vx * lp
              x = launchX
              y = terrainF(terrain, launchX) ?? segF(ls, launchX)
              grounded = false
            }
          } else {
            x = nx
            vx = nvx
            y = terrainF(terrain, x) ?? segF(ns, x)
            const np = segDf(ns, x)
            vy = np * vx
          }
        }
      } else {
        const [nx, ny, nvx, nvy] = verletAir(x, y, vx, vy, stepDt, rule)
        const land = findLanding(terrain, x, y, nx, ny)
        if (land) {
          x = land.x
          y = land.y
          ;[vx, vy] = landVelocity(terrain, x, vx, vy)
          grounded = true
          carving = !coastNow
        } else {
          x = nx
          y = ny
          vx = nvx
          vy = nvy
        }
      }

      frames.push({ x, y, vx, vy, carving })
      steps++
    }

    return frames
  }

  /* ---- derived values ---- */

  private get speed(): number {
    return Math.hypot(this.vx, this.vy)
  }

  private get slope(): number {
    const s = segAt(this.level.terrain, this.x)
    if (!s) return 0
    return clamp(segDf(s, this.x), -3, 3)
  }

  private get area(): number {
    const x0 = this.level.spawnX ?? 0
    return Math.max(0, areaBetween(this.level.terrain, x0, this.x))
  }

  private get areaTotal(): number {
    const x0 = this.level.spawnX ?? 0
    const last = this.level.terrain[this.level.terrain.length - 1]
    const x1 = last?.x1 ?? x0 + 1
    return Math.max(1e-6, areaBetween(this.level.terrain, x0, x1))
  }
}
