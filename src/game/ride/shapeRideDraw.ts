import type { Vec } from '@/kit/engine'
import type { Engine } from '@/kit/engine'
import type { Portal, Seg, Shard } from '../calculus.js'
import { segDf, segF, terrainF } from '../calculus.js'
import { buildWindowSegs, knotXs, type ShapeWindow } from '../shape.js'
import { slopeTint } from '../tint.js'
import type { ShapeRideSession } from './shapeRideSession.js'

const ZONE_ACCENT: Record<number, string> = {
  1: '#3DFFA2',
  2: '#22D3EE',
  3: '#8B5CF6',
  4: '#FFB020',
  5: '#FF2E93',
  6: '#FF6B4A',
}

const MARKER_TEXT: Record<string, string> = {
  stall: 'stalled — steeper before this',
  gate: 'the gate is here',
  portal: 'faster for the door',
  fell: 'too much sky — soften it',
}

/**
 * v3 draw: one canvas, two modes.
 * SHAPE: whole-level camera; bedrock in zone accent; the player's line tinted
 * by its own derivative (design §5.3); knots, anchors, ghost solution.
 * RIDE/FREEZE: v2 chase presentation + freeze failure marker.
 */
export function drawShapeRide(
  ctx: CanvasRenderingContext2D,
  eng: Engine,
  session: ShapeRideSession,
): void {
  const state = session.renderState
  const extras = session.extrasForDraw
  const ui = session.uiExtras()
  const terrain = session.terrainSegs
  const zone = extras.zone
  const shaping = extras.phase === 'shape'

  drawSky(ctx, eng, zone)
  drawParallaxRidges(ctx, eng, zone)
  if (extras.ghostVisible && extras.windows.length > 0) {
    drawGhostSolution(ctx, eng, extras.windows, extras.knotYs)
  }
  drawTerrain(ctx, eng, terrain, zone)
  if (shaping) {
    drawWindows(ctx, eng, extras.windows, extras.knotYs, extras.drag, ui.overBudget)
  }
  drawPortals(ctx, eng, terrain, extras.portals)
  drawShards(ctx, eng, extras.shards, extras.shardsGot)
  drawGoal(ctx, eng, terrain, extras.goalX, state.y)
  if (extras.marker) {
    drawMarker(ctx, eng, extras.marker)
  }
  if (!shaping && extras.runStarted) {
    drawRider(ctx, eng, state, zone, ui.speed)
    drawPointer(ctx, state.pointer)
  }
  if (extras.slowMoFactor > 0) {
    drawSlowMoOverlay(ctx, eng, extras.slowMoFactor)
  }
}

function drawSky(ctx: CanvasRenderingContext2D, eng: Engine, zone: number): void {
  const accent = ZONE_ACCENT[zone] ?? '#22D3EE'
  const grad = ctx.createLinearGradient(0, 0, 0, eng.cssH)
  grad.addColorStop(0, '#050A14')
  grad.addColorStop(0.55, '#0B1628')
  grad.addColorStop(1, accent + '18')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, eng.cssW, eng.cssH)
}

function drawParallaxRidges(ctx: CanvasRenderingContext2D, eng: Engine, zone: number): void {
  const accent = ZONE_ACCENT[zone] ?? '#22D3EE'
  const rect = eng.visibleWorldRect(2)
  for (let i = 0; i < 3; i++) {
    const parallax = 0.15 + i * 0.12
    const yBase = rect.y0 - 2 - i * 1.8
    const amp = 0.6 + i * 0.35
    const freq = 0.9 + i * 0.4
    const offset = eng.cam.cx * parallax
    ctx.beginPath()
    ctx.strokeStyle = accent + (20 + i * 10).toString(16).padStart(2, '0')
    ctx.lineWidth = 1 + i * 0.5
    const samples = Math.max(20, Math.min(60, Math.ceil((rect.x1 - rect.x0) * 3)))
    for (let s = 0; s <= samples; s++) {
      const x = rect.x0 + ((rect.x1 - rect.x0) * s) / samples
      const y = yBase + Math.sin((x - offset) * freq) * amp
      const p = eng.worldToScreen({ x, y })
      if (s === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    }
    ctx.stroke()
  }
}

/**
 * Terrain: bedrock glows zone-accent; player-drawn hermite pieces are tinted
 * per-sample by f′ (mint flat → cyan/violet downhill → amber/red uphill;
 * uphill also dashed — sign is never color-only).
 */
function drawTerrain(
  ctx: CanvasRenderingContext2D,
  eng: Engine,
  terrain: readonly Seg[],
  zone: number,
): void {
  const rect = eng.visibleWorldRect(1)
  const accent = ZONE_ACCENT[zone] ?? '#22D3EE'
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (const s of terrain) {
    if (s.x1 < rect.x0 || s.x0 > rect.x1) continue
    const lo = Math.max(rect.x0, s.x0)
    const hi = Math.min(rect.x1, s.x1)
    const samples = Math.max(2, Math.min(64, Math.ceil((hi - lo) * 8)))
    if (s.kind !== 'hermite') {
      ctx.shadowColor = accent
      ctx.shadowBlur = 12
      ctx.strokeStyle = accent
      ctx.lineWidth = 3
      ctx.beginPath()
      for (let i = 0; i <= samples; i++) {
        const x = lo + ((hi - lo) * i) / samples
        const p = eng.worldToScreen({ x, y: segF(s, x) })
        if (i === 0) ctx.moveTo(p.x, p.y)
        else ctx.lineTo(p.x, p.y)
      }
      ctx.stroke()
      ctx.shadowBlur = 0
      ctx.strokeStyle = '#E8F0FF'
      ctx.lineWidth = 1.5
      ctx.stroke()
      continue
    }
    // player line: derivative tint, per-sample segments
    ctx.shadowBlur = 10
    ctx.lineWidth = 3
    for (let i = 0; i < samples; i++) {
      const xa = lo + ((hi - lo) * i) / samples
      const xb = lo + ((hi - lo) * (i + 1)) / samples
      const m = segDf(s, (xa + xb) / 2)
      const color = slopeTint(m)
      ctx.strokeStyle = color
      ctx.shadowColor = color
      const uphill = m > 0.08
      ctx.setLineDash(uphill ? [5, 4] : [])
      const pa = eng.worldToScreen({ x: xa, y: segF(s, xa) })
      const pb = eng.worldToScreen({ x: xb, y: segF(s, xb) })
      ctx.beginPath()
      ctx.moveTo(pa.x, pa.y)
      ctx.lineTo(pb.x, pb.y)
      ctx.stroke()
    }
    ctx.setLineDash([])
    ctx.shadowBlur = 0
  }
  ctx.restore()
}

/** knots, anchors, span rails, drag guide — SHAPE mode only */
function drawWindows(
  ctx: CanvasRenderingContext2D,
  eng: Engine,
  windows: readonly ShapeWindow[],
  knotYs: readonly (readonly number[])[],
  drag: { win: number; knot: number } | null,
  overBudget: boolean,
): void {
  for (let wi = 0; wi < windows.length; wi++) {
    const w = windows[wi]!
    const xs = knotXs(w)
    // span rails at anchors
    for (const [ax, ay] of [
      [w.x0, w.startY],
      [w.x1, w.endY],
    ] as const) {
      const p = eng.worldToScreen({ x: ax, y: ay })
      ctx.save()
      ctx.fillStyle = '#A0B4D0'
      ctx.strokeStyle = '#A0B4D088'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(p.x, p.y - 7)
      ctx.lineTo(p.x + 6, p.y)
      ctx.lineTo(p.x, p.y + 7)
      ctx.lineTo(p.x - 6, p.y)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }
    // clamp band edges (subtle)
    const top = eng.worldToScreen({ x: w.x0, y: w.maxY }).y
    const bot = eng.worldToScreen({ x: w.x0, y: w.minY }).y
    const left = eng.worldToScreen({ x: w.x0, y: 0 }).x
    const right = eng.worldToScreen({ x: w.x1, y: 0 }).x
    ctx.save()
    ctx.strokeStyle = overBudget ? '#FF6B4A55' : '#A0B4D022'
    ctx.setLineDash([2, 6])
    ctx.lineWidth = 1
    ctx.strokeRect(left, top, right - left, bot - top)
    ctx.restore()
    // knots
    for (let ki = 0; ki < xs.length; ki++) {
      const kp = eng.worldToScreen({ x: xs[ki]!, y: knotYs[wi]![ki]! })
      const active = drag !== null && drag.win === wi && drag.knot === ki
      ctx.save()
      if (active) {
        // vertical guide rail while dragging
        ctx.strokeStyle = '#E8F0FF44'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 5])
        ctx.beginPath()
        ctx.moveTo(kp.x, top)
        ctx.lineTo(kp.x, bot)
        ctx.stroke()
        ctx.setLineDash([])
      }
      ctx.fillStyle = active ? '#FFFFFF' : '#E8F0FF'
      ctx.shadowColor = active ? '#FFFFFF' : '#7DD3FC'
      ctx.shadowBlur = active ? 18 : 10
      ctx.beginPath()
      ctx.arc(kp.x, kp.y, active ? 11 : 9, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      // 44px hit affordance ring
      ctx.strokeStyle = '#E8F0FF2E'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(kp.x, kp.y, 22, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }
  }
}

/** ghost solution: translucent dashed line + pulsing rings on solution knots */
function drawGhostSolution(
  ctx: CanvasRenderingContext2D,
  eng: Engine,
  windows: readonly ShapeWindow[],
  _knotYs: readonly (readonly number[])[],
): void {
  ctx.save()
  ctx.globalAlpha = 0.35
  ctx.strokeStyle = '#A0B4D0'
  ctx.lineWidth = 2
  ctx.setLineDash([6, 6])
  for (const w of windows) {
    const segs = buildWindowSegs(w, w.solution)
    ctx.beginPath()
    let first = true
    for (const s of segs) {
      const samples = 16
      for (let i = 0; i <= samples; i++) {
        const x = s.x0 + ((s.x1 - s.x0) * i) / samples
        const p = eng.worldToScreen({ x, y: segF(s, x) })
        if (first) {
          ctx.moveTo(p.x, p.y)
          first = false
        } else {
          ctx.lineTo(p.x, p.y)
        }
      }
    }
    ctx.stroke()
    const xs = knotXs(w)
    for (let i = 0; i < xs.length; i++) {
      const p = eng.worldToScreen({ x: xs[i]!, y: w.solution[i]! })
      const pulse = 1 + 0.25 * Math.sin(eng.timeMs / 300 + i)
      ctx.beginPath()
      ctx.arc(p.x, p.y, 10 * pulse, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
  ctx.restore()
}

/** freeze failure marker — pulsing ring + short reason, shape+freeze phases */
function drawMarker(
  ctx: CanvasRenderingContext2D,
  eng: Engine,
  marker: { x: number; y: number; reason: string; t0: number },
): void {
  const p = eng.worldToScreen({ x: marker.x, y: marker.y })
  const age = eng.timeMs - marker.t0
  const pulse = 1 + 0.2 * Math.sin(age / 180)
  ctx.save()
  ctx.strokeStyle = '#FFB020'
  ctx.shadowColor = '#FFB020'
  ctx.shadowBlur = 12
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.arc(p.x, p.y, 16 * pulse, 0, Math.PI * 2)
  ctx.stroke()
  ctx.shadowBlur = 0
  const label = MARKER_TEXT[marker.reason] ?? marker.reason
  ctx.font = '700 11px "JetBrains Mono", monospace'
  const w = ctx.measureText(label).width
  const ly = Math.max(18, p.y - 34)
  ctx.fillStyle = '#050A14CC'
  ctx.fillRect(p.x - w / 2 - 7, ly - 11, w + 14, 18)
  ctx.fillStyle = '#FFB020'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, p.x, ly - 2)
  ctx.restore()
}

function drawPortals(
  ctx: CanvasRenderingContext2D,
  eng: Engine,
  terrain: readonly Seg[],
  portals: readonly Portal[],
): void {
  const pal = eng.palette
  for (const portal of portals) {
    const ya = terrainF(terrain, portal.a)
    const yb = terrainF(terrain, portal.b)
    if (ya === null || yb === null) continue
    drawPortalGlyph(ctx, eng, { x: portal.a, y: ya }, pal.cyan, 'circle')
    drawPortalGlyph(ctx, eng, { x: portal.b, y: yb }, pal.magenta, 'triangle')
    const pa = eng.worldToScreen({ x: portal.a, y: ya })
    const pb = eng.worldToScreen({ x: portal.b, y: yb })
    ctx.save()
    ctx.strokeStyle = pal.hi + '22'
    ctx.setLineDash([4, 6])
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(pa.x, pa.y)
    ctx.lineTo(pb.x, pb.y)
    ctx.stroke()
    ctx.restore()
  }
}

function drawPortalGlyph(
  ctx: CanvasRenderingContext2D,
  eng: Engine,
  pos: Vec,
  color: string,
  shape: 'circle' | 'triangle',
): void {
  const p = eng.worldToScreen(pos)
  ctx.save()
  ctx.fillStyle = color
  ctx.shadowColor = color
  ctx.shadowBlur = 10
  ctx.beginPath()
  if (shape === 'circle') {
    ctx.arc(p.x, p.y, 7, 0, Math.PI * 2)
  } else {
    ctx.moveTo(p.x, p.y - 8)
    ctx.lineTo(p.x + 7, p.y + 6)
    ctx.lineTo(p.x - 7, p.y + 6)
    ctx.closePath()
  }
  ctx.fill()
  ctx.restore()
}

function drawShards(
  ctx: CanvasRenderingContext2D,
  eng: Engine,
  shards: readonly Shard[],
  got: Set<number>,
): void {
  const pal = eng.palette
  for (let i = 0; i < shards.length; i++) {
    if (got.has(i)) continue
    const shard = shards[i]!
    const p = eng.worldToScreen({ x: shard.x, y: shard.y })
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(eng.timeMs / 800)
    ctx.fillStyle = pal.gold
    ctx.shadowColor = pal.gold
    ctx.shadowBlur = 12
    ctx.beginPath()
    ctx.moveTo(0, -6)
    ctx.lineTo(5, 0)
    ctx.lineTo(0, 6)
    ctx.lineTo(-5, 0)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
}

function drawGoal(
  ctx: CanvasRenderingContext2D,
  eng: Engine,
  terrain: readonly Seg[],
  goalX: number,
  riderY: number,
): void {
  const y = terrainF(terrain, goalX) ?? riderY
  const p = eng.worldToScreen({ x: goalX, y })
  ctx.save()
  ctx.strokeStyle = eng.palette.gold
  ctx.fillStyle = eng.palette.gold
  ctx.shadowColor = eng.palette.gold
  ctx.shadowBlur = 16
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(p.x, p.y - 40)
  ctx.lineTo(p.x, p.y + 40)
  ctx.stroke()
  ctx.globalAlpha = 0.9
  ctx.fillRect(p.x - 18, p.y - 44, 36, 12)
  ctx.restore()
}

function drawRider(
  ctx: CanvasRenderingContext2D,
  eng: Engine,
  state: {
    x: number
    y: number
    vx: number
    vy: number
    grounded: boolean
    pointer: { down: boolean; x: number; y: number }
  },
  zone: number,
  speed: number,
): void {
  const p = eng.worldToScreen({ x: state.x, y: state.y })
  const color = ZONE_ACCENT[zone] ?? '#22D3EE'
  drawRiderArrow(ctx, p, state.vx, state.vy, color, 1)
  if (state.grounded && Math.abs(speed) > 0.5) drawSparks(ctx, eng, p, speed)
  if (speed > 2) drawSpeedLines(ctx, eng, state, speed)
}

function drawRiderArrow(
  ctx: CanvasRenderingContext2D,
  p: Vec,
  vx: number,
  vy: number,
  color: string,
  scale: number,
): void {
  const angle = Math.atan2(vy, vx)
  const len = 16 + 10 * Math.min(1, Math.hypot(vx, vy) / 8)
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(angle)
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.shadowColor = color
  ctx.shadowBlur = 10
  ctx.lineWidth = 3 * scale
  ctx.beginPath()
  ctx.moveTo(-len * 0.35 * scale, 0)
  ctx.lineTo(len * 0.65 * scale, 0)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(len * 0.45 * scale, -5 * scale)
  ctx.lineTo(len * scale, 0)
  ctx.lineTo(len * 0.45 * scale, 5 * scale)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawSparks(ctx: CanvasRenderingContext2D, eng: Engine, p: Vec, speed: number): void {
  const n = Math.min(5, Math.floor(speed / 2))
  ctx.save()
  ctx.fillStyle = eng.palette.gold
  for (let i = 0; i < n; i++) {
    const t = (eng.timeMs / 60 + i * 1.3) % 1
    const dx = -t * 18 - Math.random() * 4
    const dy = (Math.random() - 0.5) * 8
    ctx.globalAlpha = 1 - t
    ctx.beginPath()
    ctx.arc(p.x + dx, p.y + dy, 1.5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawSpeedLines(
  ctx: CanvasRenderingContext2D,
  eng: Engine,
  state: { x: number; y: number },
  speed: number,
): void {
  const rect = eng.visibleWorldRect(0)
  const count = Math.min(40, Math.floor(speed * 3))
  ctx.save()
  ctx.strokeStyle = '#FFFFFF'
  ctx.globalAlpha = 0.12
  ctx.lineWidth = 1
  for (let i = 0; i < count; i++) {
    const seed = i * 123.45 + state.x
    const x = rect.x0 + (((seed * 9301 + 49297) % 233280) / 233280) * (rect.x1 - rect.x0)
    const y = rect.y0 + (((seed * 49297 + 9301) % 233280) / 233280) * (rect.y1 - rect.y0)
    const p = eng.worldToScreen({ x, y })
    const len = 12 + speed * 2
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    ctx.lineTo(p.x - len, p.y)
    ctx.stroke()
  }
  ctx.restore()
}

function drawPointer(
  ctx: CanvasRenderingContext2D,
  pointer: { down: boolean; x: number; y: number },
): void {
  if (!pointer.down) return
  ctx.save()
  ctx.fillStyle = '#FFFFFF33'
  ctx.strokeStyle = '#FFFFFF66'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(pointer.x, pointer.y, 22, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

function drawSlowMoOverlay(ctx: CanvasRenderingContext2D, eng: Engine, factor: number): void {
  ctx.save()
  ctx.globalAlpha = factor * 0.25
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, eng.cssW, eng.cssH)
  ctx.restore()
}
