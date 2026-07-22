import type { Vec } from '@gridverse/kit/engine'
import type { Engine } from '@gridverse/kit/engine'
import type { GhostFrame, Portal, Seg, Shard } from '../calculus.js'
import { segF, terrainF } from '../calculus.js'
import type { RideSession } from './rideSession.js'

const ZONE_ACCENT: Record<number, string> = {
  1: '#3DFFA2',
  2: '#22D3EE',
  3: '#8B5CF6',
  4: '#FFB020',
  5: '#FF2E93',
  6: '#FF6B4A',
}

export function drawRide(
  ctx: CanvasRenderingContext2D,
  eng: Engine,
  session: RideSession,
): void {
  const state = session.renderState
  const extras = session.extrasForDraw
  const ui = session.uiExtras()
  const terrain = session.level.terrain
  const zone = extras.zone

  drawSky(ctx, eng, zone)
  drawParallaxRidges(ctx, eng, zone)
  drawTerrain(ctx, eng, terrain, zone)
  drawPortals(ctx, eng, terrain, extras.portals)
  drawShards(ctx, eng, extras.shards, extras.shardsGot)
  drawGoal(ctx, eng, terrain, extras.goalX, state.y)
  if (extras.ghostReplay && extras.ghostFrames.length >= 2) {
    drawGhost(ctx, eng, extras.ghostFrames)
  }
  drawRider(ctx, eng, state, zone, ui.speed)
  drawPointer(ctx, state.pointer)
  if (extras.slowMoFactor > 0) {
    drawSlowMoOverlay(ctx, eng, extras.slowMoFactor)
  }
}

function drawSky(
  ctx: CanvasRenderingContext2D,
  eng: Engine,
  zone: number,
): void {
  const accent = ZONE_ACCENT[zone] ?? '#22D3EE'
  const grad = ctx.createLinearGradient(0, 0, 0, eng.cssH)
  grad.addColorStop(0, '#050A14')
  grad.addColorStop(0.55, '#0B1628')
  grad.addColorStop(1, accent + '18')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, eng.cssW, eng.cssH)
}

function drawParallaxRidges(
  ctx: CanvasRenderingContext2D,
  eng: Engine,
  zone: number,
): void {
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

function drawTerrain(
  ctx: CanvasRenderingContext2D,
  eng: Engine,
  terrain: readonly Seg[],
  zone: number,
): void {
  const rect = eng.visibleWorldRect(1)
  ctx.save()
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const accent = ZONE_ACCENT[zone] ?? '#22D3EE'
  ctx.shadowColor = accent
  ctx.shadowBlur = 14
  ctx.strokeStyle = accent
  ctx.beginPath()
  sampleTerrainPath(ctx, eng, terrain, rect)
  ctx.stroke()

  ctx.shadowBlur = 0
  ctx.strokeStyle = '#E8F0FF'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  sampleTerrainPath(ctx, eng, terrain, rect)
  ctx.stroke()

  ctx.restore()
}

function sampleTerrainPath(
  ctx: CanvasRenderingContext2D,
  eng: Engine,
  terrain: readonly Seg[],
  rect: { x0: number; y0: number; x1: number; y1: number },
): void {
  const segs = terrain.filter((s) => s.x1 >= rect.x0 && s.x0 <= rect.x1)
  let first = true
  for (const s of segs) {
    const lo = Math.max(rect.x0, s.x0)
    const hi = Math.min(rect.x1, s.x1)
    const samples = Math.max(2, Math.min(200, Math.ceil((hi - lo) * 8)))
    for (let i = 0; i <= samples; i++) {
      const x = lo + ((hi - lo) * i) / samples
      const y = segF(s, x)
      const p = eng.worldToScreen({ x, y })
      if (first) {
        ctx.moveTo(p.x, p.y)
        first = false
      } else {
        ctx.lineTo(p.x, p.y)
      }
    }
  }
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

function drawGhost(
  ctx: CanvasRenderingContext2D,
  eng: Engine,
  frames: readonly GhostFrame[],
): void {
  const now = eng.timeMs
  const idx = Math.floor(now / (1000 / 120)) % frames.length
  const frame = frames[idx]!
  const p = eng.worldToScreen({ x: frame.x, y: frame.y })
  ctx.save()
  ctx.globalAlpha = 0.35
  drawRiderArrow(ctx, p, frame.vx, frame.vy, '#A0B4D0', 0.7)
  ctx.restore()
}

function drawRider(
  ctx: CanvasRenderingContext2D,
  eng: Engine,
  state: { x: number; y: number; vx: number; vy: number; grounded: boolean; pointer: { down: boolean; x: number; y: number } },
  zone: number,
  speed: number,
): void {
  const p = eng.worldToScreen({ x: state.x, y: state.y })
  const color = ZONE_ACCENT[zone] ?? '#22D3EE'
  drawRiderArrow(ctx, p, state.vx, state.vy, color, 1)

  if (state.grounded && Math.abs(speed) > 0.5) {
    drawSparks(ctx, eng, p, speed)
  }
  if (speed > 2) {
    drawSpeedLines(ctx, eng, state, speed)
  }
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

function drawSparks(
  ctx: CanvasRenderingContext2D,
  eng: Engine,
  p: Vec,
  speed: number,
): void {
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

function drawSlowMoOverlay(
  ctx: CanvasRenderingContext2D,
  eng: Engine,
  factor: number,
): void {
  ctx.save()
  ctx.globalAlpha = factor * 0.25
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, eng.cssW, eng.cssH)
  ctx.restore()
}
