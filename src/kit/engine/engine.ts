/**
 * Gridverse canvas engine — extracted from VECTO.
 * Single 2D canvas, DPR-aware (cap 2.5), rAF loop paused on visibilitychange.
 * Camera: world units (math +y up) → css px. Per-level auto-fit + eased tweens.
 * Warped-grid overlay: grid lines sampled & mapped through the current warp
 * matrix (lerped during warp tweens) — no per-frame shadowBlur; glow comes
 * from pre-baked radial sprites. Particles pooled, cap 120, additive.
 */
import type { Mat, Vec } from './math.js'
import { IDENTITY, clamp, easeInOut, lerp, lerpMat } from './math.js'
import type { GridverseTheme, Palette } from './theme.js'
import { GRIDVERSE_BASE, kitTheme, paletteForMode } from './theme.js'
import type { KitSettings } from '../lib/settings.js'
import { kitSettings } from '../lib/settings.js'

export interface EngineHooks {
  onDown?: (w: Vec, s: Vec) => void
  onMove?: (w: Vec, s: Vec) => void
  onUp?: (w: Vec, s: Vec) => void
  update?: (dtMs: number, eng: Engine) => void
  draw?: (ctx: CanvasRenderingContext2D, eng: Engine) => void
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  t0: number
  life: number
  size: number
  color: string
  drag: number
}

interface CamTween {
  fromCx: number
  fromCy: number
  fromScale: number
  toCx: number
  toCy: number
  toScale: number
  t0: number
  dur: number
}

interface WarpAnim {
  from: Mat
  to: Mat
  t0: number
  dur: number
  onDone?: () => void
}

const PARTICLE_CAP = 120

export interface EngineOptions {
  theme?: GridverseTheme
  getSettings?: () => KitSettings
  fixedHz?: number
  /** 'grid' (default) draws nebula + warped grid + vignette; 'none' leaves background to hooks.draw */
  background?: 'grid' | 'none'
}

export class Engine {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  hooks: EngineHooks
  dpr = 1
  cssW = 0
  cssH = 0
  cam = { cx: 0, cy: 0, scale: 44 }
  camTween: CamTween | null = null
  warpCur: Mat = { ...IDENTITY }
  warpAnim: WarpAnim | null = null
  timeMs = 0
  lastFrame = 0
  running = false
  raf = 0
  shakeAmp = 0
  shakeT0 = 0
  particles: Particle[] = []
  palette: Palette = GRIDVERSE_BASE.palette
  gridIntensity = 0.8
  reduceMotion = false
  theme: GridverseTheme
  private getSettings: () => KitSettings
  private fixedHz?: number
  /** 'grid' (default) draws nebula + warped grid + vignette; 'none' leaves background to hooks.draw */
  private background: 'grid' | 'none'
  private accumulator = 0
  private glowCache = new Map<string, HTMLCanvasElement>()
  private vignette: HTMLCanvasElement | null = null
  private nebula: HTMLImageElement | null = null
  private mascotImg: HTMLImageElement | null = null
  private resizeObs: ResizeObserver | null = null
  private boundVis: () => void

  constructor(
    canvas: HTMLCanvasElement,
    hooks: EngineHooks,
    opts?: EngineOptions,
  ) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('no 2d context')
    this.ctx = ctx
    this.hooks = hooks
    this.theme = opts?.theme ?? kitTheme
    this.getSettings = opts?.getSettings ?? kitSettings
    this.fixedHz = opts?.fixedHz
    this.background = opts?.background ?? 'grid'

    canvas.style.touchAction = 'none'
    canvas.addEventListener('pointerdown', this.onPointerDown)
    canvas.addEventListener('pointermove', this.onPointerMove)
    canvas.addEventListener('pointerup', this.onPointerUp)
    canvas.addEventListener('pointercancel', this.onPointerUp)

    this.resizeObs = new ResizeObserver(() => this.resize())
    this.resizeObs.observe(canvas)
    this.resize()

    if (this.theme.assets?.nebula) {
      const neb = new Image()
      neb.src = this.theme.assets.nebula
      neb.onload = () => {
        this.nebula = neb
      }
    }
    if (this.theme.assets?.mascot) {
      const mascot = new Image()
      mascot.src = this.theme.assets.mascot
      mascot.onload = () => {
        this.mascotImg = mascot
      }
    }

    this.boundVis = () => {
      if (document.hidden) this.pause()
      else this.resume()
    }
    document.addEventListener('visibilitychange', this.boundVis)
  }

  dispose() {
    this.stop()
    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
    this.canvas.removeEventListener('pointermove', this.onPointerMove)
    this.canvas.removeEventListener('pointerup', this.onPointerUp)
    this.canvas.removeEventListener('pointercancel', this.onPointerUp)
    this.resizeObs?.disconnect()
    document.removeEventListener('visibilitychange', this.boundVis)
  }

  /* ---------------- sizing ---------------- */

  resize() {
    const rect = this.canvas.getBoundingClientRect()
    this.cssW = Math.max(1, rect.width)
    this.cssH = Math.max(1, rect.height)
    this.dpr = Math.min(2.5, window.devicePixelRatio || 1)
    this.canvas.width = Math.round(this.cssW * this.dpr)
    this.canvas.height = Math.round(this.cssH * this.dpr)
    this.vignette = null
  }

  /* ---------------- coordinate transforms ---------------- */

  worldToScreen(p: Vec): Vec {
    return {
      x: (p.x - this.cam.cx) * this.cam.scale + this.cssW / 2,
      y: this.cssH / 2 - (p.y - this.cam.cy) * this.cam.scale,
    }
  }

  screenToWorld(s: Vec): Vec {
    return {
      x: (s.x - this.cssW / 2) / this.cam.scale + this.cam.cx,
      y: (this.cssH / 2 - s.y) / this.cam.scale + this.cam.cy,
    }
  }

  visibleWorldRect(padU = 0): { x0: number; y0: number; x1: number; y1: number } {
    const tl = this.screenToWorld({ x: 0, y: 0 })
    const br = this.screenToWorld({ x: this.cssW, y: this.cssH })
    return { x0: tl.x - padU, y0: br.y - padU, x1: br.x + padU, y1: tl.y + padU }
  }

  /** frame a bounding box of world content + padding (design §12 auto-fit) */
  fitWorld(minX: number, minY: number, maxX: number, maxY: number, padU = 1.5, instant = false, minScale = 26) {
    const w = Math.max(1e-6, maxX - minX + padU * 2)
    const h = Math.max(1e-6, maxY - minY + padU * 2)
    const scale = clamp(Math.min(this.cssW / w, this.cssH / h), minScale, 56)
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    if (instant) {
      this.cam = { cx, cy, scale }
      this.camTween = null
    } else {
      this.tweenCam(cx, cy, scale, 500)
    }
  }

  tweenCam(cx: number, cy: number, scale: number, durMs = 500) {
    if (this.reduceMotion) {
      this.cam = { cx, cy, scale }
      return
    }
    this.camTween = {
      fromCx: this.cam.cx,
      fromCy: this.cam.cy,
      fromScale: this.cam.scale,
      toCx: cx,
      toCy: cy,
      toScale: scale,
      t0: this.timeMs,
      dur: durMs,
    }
  }

  /* ---------------- warp ---------------- */

  startWarp(to: Mat, durMs = 600, onDone?: () => void) {
    if (this.reduceMotion) durMs = 200
    this.warpAnim = { from: { ...this.warpCur }, to: { ...to }, t0: this.timeMs, dur: durMs, onDone }
  }

  /** current effective warp matrix (lerped mid-animation) */
  warpMatrix(): Mat {
    if (!this.warpAnim) return this.warpCur
    const t = clamp((this.timeMs - this.warpAnim.t0) / this.warpAnim.dur, 0, 1)
    return lerpMat(this.warpAnim.from, this.warpAnim.to, easeInOut(t))
  }

  get warping(): boolean {
    return this.warpAnim !== null
  }

  /* ---------------- particles ---------------- */

  burst(
    x: number,
    y: number,
    preset: 'snap' | 'collect' | 'win' | 'crit' | 'puff' | 'merge',
    color?: string,
  ) {
    if (this.reduceMotion && preset !== 'snap') return
    const defs: Record<
      'snap' | 'collect' | 'win' | 'crit' | 'puff' | 'merge',
      {
        n: number
        speed: [number, number]
        life: [number, number]
        size: [number, number]
        colors: string[]
      }
    > = {
      snap: {
        n: 6,
        speed: [1.5, 3],
        life: [350, 550],
        size: [2, 3.5],
        colors: [color ?? this.palette.gold],
      },
      collect: {
        n: 24,
        speed: [2, 6],
        life: [500, 900],
        size: [2.5, 5],
        colors: [this.palette.gold, this.palette.amber],
      },
      win: {
        n: 48,
        speed: [3, 9],
        life: [600, 1000],
        size: [3, 6],
        colors: [
          this.palette.gold,
          this.palette.mint,
          this.palette.cyan,
          this.palette.amber,
          this.palette.violet,
        ],
      },
      crit: {
        n: 32,
        speed: [3, 8],
        life: [400, 800],
        size: [3, 5],
        colors: [this.palette.magenta, this.palette.danger],
      },
      puff: {
        n: 12,
        speed: [0.8, 2],
        life: [500, 800],
        size: [4, 8],
        colors: [this.palette.coral, this.palette.low],
      },
      merge: {
        n: 16,
        speed: [2, 5],
        life: [400, 700],
        size: [2.5, 4.5],
        colors: [this.palette.violet, this.palette.cyan],
      },
    }
    const d = defs[preset]
    for (let i = 0; i < d.n; i++) {
      if (this.particles.length >= PARTICLE_CAP) this.particles.shift()
      const a = Math.random() * Math.PI * 2
      const sp = lerp(d.speed[0], d.speed[1], Math.random())
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp + (preset === 'win' ? 2 : 0),
        t0: this.timeMs,
        life: lerp(d.life[0], d.life[1], Math.random()),
        size: lerp(d.size[0], d.size[1], Math.random()),
        color: d.colors[i % d.colors.length]!,
        drag: 0.92,
      })
    }
  }

  shake(amp = 2) {
    this.shakeAmp = amp
    this.shakeT0 = this.timeMs
  }

  /* ---------------- glow sprites ---------------- */

  glow(color: string): HTMLCanvasElement {
    let c = this.glowCache.get(color)
    if (c) return c
    c = document.createElement('canvas')
    c.width = 64
    c.height = 64
    const g = c.getContext('2d')!
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    grad.addColorStop(0, color)
    grad.addColorStop(0.35, color + '66')
    grad.addColorStop(1, color + '00')
    g.fillStyle = grad
    g.fillRect(0, 0, 64, 64)
    this.glowCache.set(color, c)
    return c
  }

  drawGlow(x: number, y: number, radiusPx: number, color: string, alpha = 0.55) {
    const ctx = this.ctx
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.globalCompositeOperation = 'lighter'
    const s = radiusPx * 2
    ctx.drawImage(this.glow(color), x - radiusPx, y - radiusPx, s, s)
    ctx.restore()
  }

  /* ---------------- loop ---------------- */

  start() {
    if (this.running) return
    this.running = true
    this.lastFrame = performance.now()
    const loop = (now: number) => {
      if (!this.running) return
      this.raf = requestAnimationFrame(loop)
      const dt = clamp(now - this.lastFrame, 0, 50)
      this.lastFrame = now
      this.tick(dt)
    }
    this.raf = requestAnimationFrame(loop)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  pause() {
    this.stop()
  }

  resume() {
    this.lastFrame = performance.now()
    this.start()
  }

  private tick(dtMs: number) {
    if (this.fixedHz) {
      const stepMs = 1000 / this.fixedHz
      this.accumulator = Math.min(this.accumulator + dtMs, stepMs * 8)
      while (this.accumulator >= stepMs) {
        this.accumulator -= stepMs
        this.step(stepMs)
      }
    } else {
      this.step(dtMs)
    }
    this.render()
  }

  private step(dtMs: number) {
    this.timeMs += dtMs
    const s = this.getSettings()
    this.palette = paletteForMode(s.colorblind, this.theme)
    this.gridIntensity = s.gridIntensity
    this.reduceMotion = s.reduceMotion

    // camera tween
    if (this.camTween) {
      const t = clamp((this.timeMs - this.camTween.t0) / this.camTween.dur, 0, 1)
      const e = 1 - Math.pow(1 - t, 3)
      this.cam.cx = lerp(this.camTween.fromCx, this.camTween.toCx, e)
      this.cam.cy = lerp(this.camTween.fromCy, this.camTween.toCy, e)
      this.cam.scale = lerp(this.camTween.fromScale, this.camTween.toScale, e)
      if (t >= 1) this.camTween = null
    }
    // warp tween
    if (this.warpAnim) {
      const t = clamp((this.timeMs - this.warpAnim.t0) / this.warpAnim.dur, 0, 1)
      if (t >= 1) {
        this.warpCur = { ...this.warpAnim.to }
        const done = this.warpAnim.onDone
        this.warpAnim = null
        done?.()
      }
    }
    // particles
    const dt = dtMs / 1000
    this.particles = this.particles.filter((p) => {
      const age = this.timeMs - p.t0
      if (age > p.life) return false
      p.x += p.vx * dt
      p.y += p.vy * dt
      const dr = Math.pow(p.drag, dtMs / 16)
      p.vx *= dr
      p.vy *= dr
      return true
    })

    this.hooks.update?.(dtMs, this)
  }

  /* ---------------- pointer ---------------- */

  private eventPos = (e: PointerEvent): { w: Vec; s: Vec } => {
    const rect = this.canvas.getBoundingClientRect()
    const sp = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    return { w: this.screenToWorld(sp), s: sp }
  }

  private onPointerDown = (e: PointerEvent) => {
    e.preventDefault()
    try {
      this.canvas.setPointerCapture(e.pointerId)
    } catch {
      /* noop */
    }
    const { w, s } = this.eventPos(e)
    this.hooks.onDown?.(w, s)
  }

  private onPointerMove = (e: PointerEvent) => {
    const { w, s } = this.eventPos(e)
    this.hooks.onMove?.(w, s)
  }

  private onPointerUp = (e: PointerEvent) => {
    const { w, s } = this.eventPos(e)
    this.hooks.onUp?.(w, s)
  }

  /* ---------------- render ---------------- */

  private render() {
    const ctx = this.ctx
    const { cssW: w, cssH: h, dpr } = this
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    // shake
    const shakeAge = this.timeMs - this.shakeT0
    if (shakeAge < 300 && this.shakeAmp > 0) {
      const k = (1 - shakeAge / 300) * this.shakeAmp
      ctx.translate((Math.random() - 0.5) * 2 * k, (Math.random() - 0.5) * 2 * k)
    }

    // nebula bg
    ctx.fillStyle = this.palette.bg1
    ctx.fillRect(-8, -8, w + 16, h + 16)
    if (this.background === 'grid' && this.nebula) {
      ctx.save()
      ctx.globalAlpha = 0.55
      const img = this.nebula
      const ir = img.width / img.height
      const cr = w / h
      let dw = w
      let dh = h
      if (ir > cr) dw = h * ir
      else dh = w / ir
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
      ctx.restore()
    }

    if (this.background === 'grid') this.drawGrid()

    this.hooks.draw?.(ctx, this)

    // particles (stored in world coords)
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    for (const p of this.particles) {
      const age = this.timeMs - p.t0
      const k = 1 - age / p.life
      const sp = this.worldToScreen(p)
      ctx.globalAlpha = k
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(sp.x, sp.y, p.size * (0.5 + k * 0.5), 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()

    // vignette
    if (this.background !== 'grid') return
    if (!this.vignette) {
      const v = document.createElement('canvas')
      v.width = Math.max(2, Math.round(w / 2))
      v.height = Math.max(2, Math.round(h / 2))
      const g = v.getContext('2d')!
      const grad = g.createRadialGradient(
        v.width / 2,
        v.height / 2,
        Math.min(v.width, v.height) * 0.42,
        v.width / 2,
        v.height / 2,
        Math.max(v.width, v.height) * 0.72,
      )
      grad.addColorStop(0, 'rgba(4,8,16,0)')
      grad.addColorStop(1, 'rgba(4,8,16,0.5)')
      g.fillStyle = grad
      g.fillRect(0, 0, v.width, v.height)
      this.vignette = v
    }
    ctx.drawImage(this.vignette, 0, 0, w, h)
  }

  private drawGrid() {
    const ctx = this.ctx
    const M = this.warpMatrix()
    const warped =
      Math.abs(M.a - 1) > 1e-4 || Math.abs(M.b) > 1e-4 || Math.abs(M.c) > 1e-4 || Math.abs(M.d - 1) > 1e-4
    const rect = this.visibleWorldRect(warped ? 6 : 0.5)
    const x0 = Math.floor(rect.x0)
    const x1 = Math.ceil(rect.x1)
    const y0 = Math.floor(rect.y0)
    const y1 = Math.ceil(rect.y1)
    const gi = this.gridIntensity
    const minorA = 0.07 * (0.5 + gi * 0.5)
    const majorA = 0.15 * (0.5 + gi * 0.5)

    const mapPt = (x: number, y: number): Vec => {
      if (!warped) return this.worldToScreen({ x, y })
      return this.worldToScreen({ x: M.a * x + M.c * y, y: M.b * x + M.d * y })
    }

    const line = (pts: Vec[], color: string, width: number) => {
      ctx.strokeStyle = color
      ctx.lineWidth = width
      ctx.beginPath()
      pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
      ctx.stroke()
    }

    const sampleLine = (fx: number, fy: number, tx: number, ty: number): Vec[] => {
      const pts: Vec[] = []
      const segs = warped ? 14 : 1
      for (let i = 0; i <= segs; i++) {
        const t = i / segs
        pts.push(mapPt(lerp(fx, tx, t), lerp(fy, ty, t)))
      }
      return pts
    }

    for (let k = x0; k <= x1; k++) {
      if (k === 0) continue
      const major = k % 5 === 0
      line(
        sampleLine(k, y0, k, y1),
        major ? `rgba(56,189,248,${majorA})` : `rgba(56,189,248,${minorA})`,
        1,
      )
    }
    for (let k = y0; k <= y1; k++) {
      if (k === 0) continue
      const major = k % 5 === 0
      line(
        sampleLine(x0, k, x1, k),
        major ? `rgba(56,189,248,${majorA})` : `rgba(56,189,248,${minorA})`,
        1,
      )
    }
    // axes
    line(sampleLine(x0, 0, x1, 0), this.palette.axisX, 1.5)
    line(sampleLine(0, y0, 0, y1), this.palette.axisY, 1.5)
    // origin dot
    const o = mapPt(0, 0)
    ctx.fillStyle = this.palette.mid
    ctx.beginPath()
    ctx.arc(o.x, o.y, 2.5, 0, Math.PI * 2)
    ctx.fill()
  }

  /** Mascot sprite at a world position (bob + glow), size in world units */
  drawMascot(pos: Vec, sizeU = 0.95, opts?: { rotation?: number; squash?: number; alpha?: number }) {
    const ctx = this.ctx
    const sp = this.worldToScreen(pos)
    const s = sizeU * this.cam.scale
    const bob = this.reduceMotion ? 0 : Math.sin(this.timeMs / 350) * 0.08 * this.cam.scale
    this.drawGlow(sp.x, sp.y + bob, s * 1.1, this.palette.amber, 0.35)
    ctx.save()
    ctx.translate(sp.x, sp.y + bob)
    if (opts?.rotation) ctx.rotate(opts.rotation)
    if (opts?.squash) ctx.scale(1 + opts.squash, 1 - opts.squash)
    ctx.globalAlpha = opts?.alpha ?? 1
    if (this.mascotImg) {
      ctx.drawImage(this.mascotImg, -s / 2, -s / 2, s, s)
    } else {
      ctx.fillStyle = this.palette.amber
      ctx.beginPath()
      ctx.moveTo(s * 0.4, 0)
      ctx.lineTo(-s * 0.3, s * 0.3)
      ctx.lineTo(-s * 0.1, 0)
      ctx.lineTo(-s * 0.3, -s * 0.3)
      ctx.closePath()
      ctx.fill()
    }
    ctx.restore()
  }
}
