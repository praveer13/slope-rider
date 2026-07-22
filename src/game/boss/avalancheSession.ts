import type { Vec } from '@gridverse/kit/engine'
import type { Engine } from '@gridverse/kit/engine'
import { clamp } from '@gridverse/kit/engine'
import { Session, type UiState, type HintGesture } from '@gridverse/kit/session'
import type { BossDef, BossRidge } from '../levels'
import { saveMidLevel, loadMidLevel } from '../levels'
import {
  type Seg,
  type GhostFrame,
  terrainF,
  segAt,
  segF,
  segDf,
  verletGround,
  verletAir,
  findLanding,
  landVelocity,
  portalExitSpeed,
  PHYS_DT,
  HOP_IMPULSE,
  SHARD_TOL,
  AIR_SHARD_TOL,
} from '../calculus'
import { rewind, shardChime, landThump, hop as hopSfx } from '../sfx'
import { haptics } from '@gridverse/kit'
import {
  drawSky,
  drawTerrain,
  drawBasin,
  drawShards,
  drawGhost,
  drawWall,
  drawRider,
  drawWallMeter,
  drawSnowSettle,
} from './avalancheDraw'

export interface AvExtras {
  ridgeIdx: number
  ridgeName: string
  coach: string
  wallDist: number
  speed: number
  lightGot: number
  lightTotal: number
  banner: boolean
  started: boolean
}

export interface AvSerialize {
  ridgeIdx: number
  x: number
  y: number
  vx: number
  vy: number
  wallX: number
  shardsGot: boolean[][]
  mode: 'ground' | 'air'
  carving: boolean
}

interface PointerState {
  startS: Vec
  startMs: number
  zone: 'carve' | 'hop'
}

function spawnXOf(ridge: BossRidge): number {
  return ridge.terrain[0]?.x0 ?? 0
}

function terrainMinMaxY(terrain: readonly Seg[]): { minY: number; maxY: number } {
  let minY = 0
  let maxY = 0
  for (const s of terrain) {
    const y0 = segF(s, s.x0)
    const y1 = segF(s, s.x1)
    minY = Math.min(minY, y0, y1)
    maxY = Math.max(maxY, y0, y1)
    if (s.kind === 'sine' || s.kind === 'poly2') {
      const n = 8
      for (let i = 1; i < n; i++) {
        const x = s.x0 + ((s.x1 - s.x0) * i) / n
        const y = segF(s, x)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)
      }
    }
  }
  return { minY, maxY }
}

export class AvalancheSession extends Session<BossDef, AvExtras> {
  private ridgeIdx = 0
  private x = 0
  private y = 0
  private vx = 0
  private vy = 0
  private mode: 'ground' | 'air' = 'ground'
  private carving = false
  private started = false
  private wallX = 0
  private wallSpeed = 3
  private pointer: PointerState | null = null
  private carveInput: 'hold' | 'toggle' = 'hold'
  private pendingHop = false
  private rewindCount = 0
  private ghostReplay: GhostFrame[] = []
  private ghostT0 = 0
  private ghostPlaying = false
  private bannerT0 = 0
  private won = false
  private noiseCanvas: HTMLCanvasElement | null = null

  constructor(
    canvas: HTMLCanvasElement,
    level: BossDef,
    events: { onUi: (ui: UiState<AvExtras>) => void; onToast: (msg: string) => void; onWin: (moves: number, hintsUsed: number) => void },
  ) {
    super(canvas, level, events, {
      engine: { fixedHz: 120, background: 'none' as const },
    })
    try {
      const saved = localStorage.getItem('sr-carve-input')
      if (saved === 'hold' || saved === 'toggle') this.carveInput = saved
    } catch {
      /* noop */
    }
    this.initRidge(0, true)
    const saved = loadMidLevel('boss')
    if (saved) this.restore(saved)
  }

  /* ---- subclass contract ---- */

  onDown(_w: Vec, s: Vec) {
    if (this.state !== 'play') return
    this.lastInputMs = this.engine.timeMs
    this.dismissGhost()
    this.started = true
    const zone = s.y > this.engine.cssH * 0.75 ? 'hop' : 'carve'
    this.pointer = { startS: s, startMs: this.engine.timeMs, zone }
    if (this.carveInput === 'hold' && zone === 'carve') {
      this.carving = true
    }
  }

  onMove() {
    /* drag is not part of the one-finger contract */
  }

  onUp(_w: Vec, s: Vec) {
    if (!this.pointer) return
    const dur = this.engine.timeMs - this.pointer.startMs
    const d = Math.hypot(s.x - this.pointer.startS.x, s.y - this.pointer.startS.y)
    const tap = dur < 250 && d < 12
    const zone = this.pointer.zone
    this.pointer = null
    this.lastInputMs = this.engine.timeMs

    if (this.carveInput === 'hold') {
      if (this.carving) {
        this.carving = false
        if (this.mode === 'ground') this.launchTangent()
      }
    } else {
      if (tap && zone === 'carve') {
        const wasCarving = this.carving
        this.carving = !this.carving
        if (wasCarving && !this.carving && this.mode === 'ground') this.launchTangent()
      }
    }

    if (tap && zone === 'hop') {
      this.pendingHop = true
    }
  }

  update(dtMs: number) {
    if (this.state !== 'play' || this.won) return
    const ridge = this.level.ridges[this.ridgeIdx]
    if (!ridge) return

    const dt = dtMs / 1000
    if (!this.started) {
      this.updateCamera(dt)
      return
    }
    const oldX = this.x

    // canonical inputs for ghost replay are handled in simulateGhost; here use player state
    this.stepPhysics(dt, ridge)
    this.checkPortalCross(ridge, oldX, this.x)
    this.collectShards(ridge)
    this.updateWall(dt, ridge)
    this.updateCamera(dt)

    if (this.wallX >= this.x - 0.2) {
      this.rewindToCheckpoint()
      return
    }

    if (this.x >= ridge.canonical.goalX) {
      this.advanceRidge()
    }

    if (this.ghostShouldPlay()) {
      this.ghostPlaying = true
      this.ghostT0 = this.engine.timeMs
    }

    this.emit()
  }

  drawWorld(ctx: CanvasRenderingContext2D, _eng: Engine) {
    const ridge = this.level.ridges[this.ridgeIdx]
    if (!ridge) return
    drawSky(ctx, this.engine.cssW, this.engine.cssH, this.engine.palette)
    drawTerrain(ctx, this.engine, ridge.terrain)
    drawBasin(ctx, this.engine, ridge.terrain, ridge.canonical.goalX)
    drawShards(ctx, this.engine, ridge.shards)
    if (this.ghostPlaying) drawGhost(ctx, this.engine, this.ghostReplay, this.engine.timeMs - this.ghostT0)
    drawWall(ctx, this.engine, this.ensureNoise(), this.wallX, this.engine.timeMs)
    drawRider(ctx, this.engine, this.x, this.y, this.vx, this.vy, this.mode)
    drawWallMeter(ctx, this.engine, this.x - this.wallX)
    if (this.state === 'won') drawSnowSettle(ctx, this.engine, this.engine.timeMs)
  }

  equation(): string {
    return `${this.speed().toFixed(1)}`
  }

  go() {
    /* boss is turn-free; GO is a no-op */
  }

  reset() {
    this.ridgeIdx = 0
    this.rewindCount = 0
    this.ghostPlaying = false
    this.won = false
    this.moves = 0
    this.hintsUsed = 0
    this.resetShardsAll()
    this.initRidge(0, false)
    this.engine.shake(0)
    this.emit()
  }

  hintPath(): HintGesture | null {
    return null
  }

  winBursts(): Vec[] {
    const ridge = this.level.ridges[this.ridgeIdx]
    const x = ridge ? ridge.canonical.goalX + 2 : this.x
    const y = ridge ? terrainF(ridge.terrain, x) ?? this.y : this.y
    return [{ x, y }]
  }

  contentBounds() {
    const ridge = this.level.ridges[this.ridgeIdx]
    if (!ridge) return { minX: -10, minY: -10, maxX: 10, maxY: 10 }
    const { minY, maxY } = terrainMinMaxY(ridge.terrain)
    const sx = spawnXOf(ridge)
    return { minX: sx - 1, minY: minY - 2, maxX: sx + 9, maxY: maxY + 6 }
  }

  uiExtras(): AvExtras {
    const ridge = this.level.ridges[this.ridgeIdx]
    return {
      ridgeIdx: this.ridgeIdx,
      ridgeName: ridge?.name ?? '',
      coach: ridge?.coach ?? '',
      wallDist: Math.max(0, this.x - this.wallX),
      speed: this.speed(),
      lightGot: this.lightGot(),
      lightTotal: this.lightTotal(),
      banner: this.engine.timeMs - this.bannerT0 < 2500,
      started: this.started,
    }
  }

  serialize(): AvSerialize {
    return {
      ridgeIdx: this.ridgeIdx,
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      wallX: this.wallX,
      shardsGot: this.level.ridges.map((r) => r.shards.map((s) => !!s.got)),
      mode: this.mode,
      carving: this.carving,
    }
  }

  restore(data: unknown) {
    const s = data as Partial<AvSerialize>
    if (typeof s.ridgeIdx === 'number') this.ridgeIdx = clamp(s.ridgeIdx, 0, this.level.ridges.length - 1)
    if (typeof s.x === 'number') this.x = s.x
    if (typeof s.y === 'number') this.y = s.y
    if (typeof s.vx === 'number') this.vx = s.vx
    if (typeof s.vy === 'number') this.vy = s.vy
    if (typeof s.wallX === 'number') this.wallX = s.wallX
    if (typeof s.mode === 'string') this.mode = s.mode === 'air' ? 'air' : 'ground'
    if (typeof s.carving === 'boolean') this.carving = s.carving
    if (Array.isArray(s.shardsGot)) {
      for (let i = 0; i < s.shardsGot.length && i < this.level.ridges.length; i++) {
        const got = s.shardsGot[i]
        const ridge = this.level.ridges[i]
        if (!ridge || !Array.isArray(got)) continue
        for (let j = 0; j < got.length && j < ridge.shards.length; j++) {
          ridge.shards[j]!.got = !!got[j]
        }
      }
    }
    const ridge = this.level.ridges[this.ridgeIdx]
    if (ridge) {
      if (typeof s.wallX !== 'number') {
        this.wallX = spawnXOf(ridge) - this.level.rewindSetback
      }
      this.ghostReplay = this.simulateGhost(ridge)
      this.bannerT0 = this.engine.timeMs
      this.ghostPlaying = false
      const b = this.contentBounds()
      this.engine.fitWorld(b.minX, b.minY, b.maxX, b.maxY, 1.2, true)
    }
  }

  persist() {
    saveMidLevel('boss', this.serialize())
  }

  begin() {
    this.state = 'play'
    this.lastInputMs = this.engine.timeMs
    this.emit()
  }

  /* ---- internals ---- */

  private speed(): number {
    return Math.hypot(this.vx, this.vy)
  }

  lightGot(): number {
    let n = 0
    for (const ridge of this.level.ridges) {
      for (const s of ridge.shards) if (s.got) n++
    }
    return n
  }

  lightTotal(): number {
    let n = 0
    for (const ridge of this.level.ridges) n += ridge.shards.length
    return n
  }

  private resetShardsAll() {
    for (const ridge of this.level.ridges) {
      for (const s of ridge.shards) s.got = false
    }
  }

  private initRidge(idx: number, instant: boolean) {
    this.ridgeIdx = idx
    const ridge = this.level.ridges[idx]
    if (!ridge) return
    const sx = spawnXOf(ridge)
    this.x = sx
    this.y = terrainF(ridge.terrain, sx) ?? 0
    this.vx = 0
    this.vy = 0
    this.mode = 'ground'
    this.carving = false
    this.wallX = sx - this.level.rewindSetback
    this.wallSpeed = 3
    this.bannerT0 = this.engine.timeMs
    this.ghostReplay = this.simulateGhost(ridge)
    this.ghostPlaying = false
    const b = this.contentBounds()
    this.engine.fitWorld(b.minX, b.minY, b.maxX, b.maxY, 1.2, instant)
  }

  private launchTangent() {
    const ridge = this.level.ridges[this.ridgeIdx]
    if (!ridge || this.mode !== 'ground') return
    const s = segAt(ridge.terrain, this.x)
    if (!s) return
    const p = segDf(s, this.x)
    this.y = terrainF(ridge.terrain, this.x) ?? this.y
    this.vy = p * this.vx
    this.mode = 'air'
  }

  private doHop() {
    if (this.mode !== 'ground') return
    const ridge = this.level.ridges[this.ridgeIdx]
    if (!ridge) return
    const s = segAt(ridge.terrain, this.x)
    if (!s) return
    const p = segDf(s, this.x)
    const n = Math.sqrt(1 + p * p)
    const imp = HOP_IMPULSE / n
    this.vx += -p * imp
    this.vy += imp
    this.mode = 'air'
    hopSfx()
    haptics.tick()
  }

  private stepPhysics(dt: number, ridge: BossRidge) {
    if (this.pendingHop) {
      this.pendingHop = false
      this.doHop()
    }

    if (this.mode === 'ground') {
      const [x1, vx1] = verletGround(ridge.terrain, this.x, this.vx, dt, this.carving, ridge.rule)
      const segOld = segAt(ridge.terrain, this.x)
      const segNew = segAt(ridge.terrain, x1)

      if (segOld && !segNew) {
        // launched over a gap
        const boundary = x1 > this.x ? segOld.x1 : segOld.x0
        const p = segDf(segOld, boundary)
        this.x = boundary
        this.y = segF(segOld, boundary)
        this.vx = vx1
        this.vy = p * vx1
        this.mode = 'air'
      } else {
        this.x = x1
        this.y = terrainF(ridge.terrain, x1) ?? this.y
        this.vx = vx1
        const slope = segDf(segNew ?? segOld!, this.x)
        this.vy = slope * this.vx
      }
    } else {
      let [x1, y1, vx1, vy1] = verletAir(this.x, this.y, this.vx, this.vy, dt, ridge.rule)
      const landing = findLanding(ridge.terrain, this.x, this.y, x1, y1)
      if (landing) {
        const [lvx, lvy] = landVelocity(ridge.terrain, landing.x, vx1, vy1)
        this.x = landing.x
        this.y = landing.y
        this.vx = lvx
        this.vy = lvy
        this.mode = 'ground'
        const impact = Math.abs(vy1 - lvy)
        landThump(clamp(impact / 8, 0, 1))
      } else {
        this.x = x1
        this.y = y1
        this.vx = vx1
        this.vy = vy1
      }
    }

    // never go backward past spawn
    const sx = spawnXOf(ridge)
    if (this.x < sx) {
      this.x = sx
      this.vx = Math.max(0, this.vx)
    }
  }

  private checkPortalCross(ridge: BossRidge, oldX: number, newX: number) {
    if (!ridge.portals) return
    for (const portal of ridge.portals) {
      if (oldX < portal.a && newX >= portal.a) {
        const vin = Math.hypot(this.vx, this.vy)
        let vout = portalExitSpeed(ridge.terrain, portal, vin)
        if (Number.isNaN(vout)) vout = 4 // boss portals are always passable; backstop
        const yb = terrainF(ridge.terrain, portal.b)
        if (yb === null) continue
        const s = segAt(ridge.terrain, portal.b)
        const p = s ? segDf(s, portal.b) : 0
        const n = Math.sqrt(1 + p * p)
        this.x = portal.b
        this.y = yb
        this.vx = vout / n
        this.vy = (p * vout) / n
        this.mode = 'ground'
      }
    }
  }

  private collectShards(ridge: BossRidge) {
    for (const shard of ridge.shards) {
      if (shard.got) continue
      const tol = shard.air ? AIR_SHARD_TOL : SHARD_TOL
      const dy = this.y - shard.y
      const dx = this.x - shard.x
      if (dx * dx + dy * dy <= tol * tol) {
        shard.got = true
        const frac = this.lightTotal() > 0 ? this.lightGot() / this.lightTotal() : 0.5
        shardChime(frac)
        haptics.tick()
      }
    }
  }

  private updateWall(_dt: number, ridge: BossRidge) {
    const spd = this.speed()
    const base = Math.max(3, spd - this.level.wallStartOffset)
    this.wallSpeed = base + this.ridgeIdx * this.level.wallGainPerRidge
    this.wallX += this.wallSpeed * _dt
    // wall never passes rider without triggering caught; keep it clamped behind spawn for sanity
    const sx = spawnXOf(ridge)
    if (this.wallX > this.x + 2) this.wallX = this.x + 2
    if (this.wallX < sx - 20) this.wallX = sx - 20
  }

  private updateCamera(_dt: number) {
    const ridge = this.level.ridges[this.ridgeIdx]
    if (!ridge) return
    const visibleW = this.engine.cssW / this.engine.cam.scale
    const lookahead = clamp(this.vx * 0.35, 1, 4)
    const targetCx = this.x + 0.1 * visibleW + lookahead
    const groundY = terrainF(ridge.terrain, this.x) ?? this.y
    const targetCy = groundY + 2.4
    const ease = this.engine.reduceMotion ? 1 : 0.12
    this.engine.cam.cx += (targetCx - this.engine.cam.cx) * ease
    this.engine.cam.cy += (targetCy - this.engine.cam.cy) * ease
  }

  private rewindToCheckpoint() {
    this.rewindCount++
    const ridge = this.level.ridges[this.ridgeIdx]
    if (!ridge) return
    const sx = spawnXOf(ridge)
    this.x = sx
    this.y = terrainF(ridge.terrain, sx) ?? 0
    this.vx = 0
    this.vy = 0
    this.mode = 'ground'
    this.carving = false
    this.wallX = sx - this.level.rewindSetback
    this.pointer = null
    this.pendingHop = false
    rewind()
    haptics.tick()
    if (this.rewindCount >= 3) {
      this.ghostPlaying = true
      this.ghostT0 = this.engine.timeMs
    }
  }

  private advanceRidge() {
    if (this.ridgeIdx >= this.level.ridges.length - 1) {
      this.won = true
      this.doWin(1100)
      return
    }
    this.initRidge(this.ridgeIdx + 1, false)
  }

  private ghostShouldPlay(): boolean {
    if (this.ghostPlaying) return false
    if (this.rewindCount >= 3) return true
    return this.engine.timeMs - this.lastInputMs > 30000
  }

  private dismissGhost() {
    this.ghostPlaying = false
  }

  private simulateGhost(ridge: BossRidge): GhostFrame[] {
    const frames: GhostFrame[] = []
    const sx = spawnXOf(ridge)
    let x = sx
    let y = terrainF(ridge.terrain, sx) ?? 0
    let vx = 0
    let vy = 0
    let mode: 'ground' | 'air' = 'ground'
    let carving = true
    const coasts = ridge.canonical.coast
    const hops = ridge.canonical.hops

    for (let i = 0; i < 120 * 30; i++) {
      const inCoast = coasts.some(([a, b]) => x >= a && x <= b)
      const wasCarving = carving
      carving = !inCoast
      if (wasCarving && !carving && mode === 'ground') {
        const s = segAt(ridge.terrain, x)
        if (s) {
          const p = segDf(s, x)
          vy = p * vx
          mode = 'air'
        }
      }

      for (const hx of hops) {
        if (i === 0) continue
        const prev = frames[frames.length - 1]!
        if (prev.x < hx && x >= hx && mode === 'ground') {
          const s = segAt(ridge.terrain, x)
          if (s) {
            const p = segDf(s, x)
            const n = Math.sqrt(1 + p * p)
            const imp = HOP_IMPULSE / n
            vx += -p * imp
            vy += imp
            mode = 'air'
          }
        }
      }

      if (mode === 'ground') {
        const [x1, vx1] = verletGround(ridge.terrain, x, vx, PHYS_DT, carving, ridge.rule)
        const segOld = segAt(ridge.terrain, x)
        const segNew = segAt(ridge.terrain, x1)
        if (segOld && !segNew) {
          const boundary = x1 > x ? segOld.x1 : segOld.x0
          const p = segDf(segOld, boundary)
          x = boundary
          y = segF(segOld, boundary)
          vx = vx1
          vy = p * vx1
          mode = 'air'
        } else {
          x = x1
          y = terrainF(ridge.terrain, x1) ?? y
          vx = vx1
          const slope = segDf(segNew ?? segOld!, x)
          vy = slope * vx
        }
      } else {
        const [x1, y1, vx1, vy1] = verletAir(x, y, vx, vy, PHYS_DT, ridge.rule)
        const landing = findLanding(ridge.terrain, x, y, x1, y1)
        if (landing) {
          const [lvx, lvy] = landVelocity(ridge.terrain, landing.x, vx1, vy1)
          x = landing.x
          y = landing.y
          vx = lvx
          vy = lvy
          mode = 'ground'
        } else {
          x = x1
          y = y1
          vx = vx1
          vy = vy1
        }
      }

      if (ridge.portals) {
        for (const portal of ridge.portals) {
          const prev = frames[frames.length - 1]
          const oldX = prev ? prev.x : sx
          if (oldX < portal.a && x >= portal.a) {
            const vin = Math.hypot(vx, vy)
            let vout = portalExitSpeed(ridge.terrain, portal, vin)
            if (Number.isNaN(vout)) vout = 4
            const yb = terrainF(ridge.terrain, portal.b)
            if (yb !== null) {
              const s = segAt(ridge.terrain, portal.b)
              const p = s ? segDf(s, portal.b) : 0
              const n = Math.sqrt(1 + p * p)
              x = portal.b
              y = yb
              vx = vout / n
              vy = (p * vout) / n
              mode = 'ground'
            }
          }
        }
      }

      frames.push({ x, y, vx, vy, carving })
      if (x >= ridge.canonical.goalX) break
    }
    return frames
  }

  private ensureNoise(): HTMLCanvasElement {
    if (this.noiseCanvas) return this.noiseCanvas
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 256
    const g = c.getContext('2d')!
    g.fillStyle = '#0B1220'
    g.fillRect(0, 0, c.width, c.height)
    for (let i = 0; i < 6000; i++) {
      const px = Math.floor(Math.random() * c.width)
      const py = Math.floor(Math.random() * c.height)
      const a = 0.05 + Math.random() * 0.25
      g.fillStyle = `rgba(255,255,255,${a})`
      g.fillRect(px, py, 1, 1)
    }
    // jagged top edge: fill white from a noisy top down
    g.fillStyle = 'rgba(255,255,255,0.92)'
    for (let col = 0; col < c.width; col += 2) {
      const top = 30 + Math.random() * 70 + Math.sin(col * 0.1) * 20
      g.fillRect(col, top, 2, c.height - top)
    }
    this.noiseCanvas = c
    return c
  }
}


