import type { Vec } from '@gridverse/kit/engine'
import type { Engine } from '@gridverse/kit/engine'
import type { Seg, Shard, GhostFrame } from '../calculus'
import { segF, terrainF } from '../calculus'

export function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number, pal: { bg0: string; bg1: string }) {
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, pal.bg0)
  g.addColorStop(1, pal.bg1)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}

function sampleTerrain(terrain: readonly Seg[], step = 0.25): Vec[] {
  const pts: Vec[] = []
  for (const s of terrain) {
    const n = Math.max(2, Math.ceil((s.x1 - s.x0) / step))
    for (let i = 0; i <= n; i++) {
      const x = s.x0 + ((s.x1 - s.x0) * i) / n
      pts.push({ x, y: segF(s, x) })
    }
  }
  return pts
}

export function drawTerrain(ctx: CanvasRenderingContext2D, eng: Engine, terrain: readonly Seg[]) {
  const pts = sampleTerrain(terrain)
  if (pts.length < 2) return
  ctx.save()
  ctx.lineWidth = 3
  ctx.strokeStyle = eng.palette.hi
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  let first = true
  for (const p of pts) {
    const s = eng.worldToScreen(p)
    if (first) {
      ctx.moveTo(s.x, s.y)
      first = false
    } else {
      ctx.lineTo(s.x, s.y)
    }
  }
  ctx.stroke()
  // faint fill below the curve
  ctx.lineTo(eng.worldToScreen(pts[pts.length - 1]!).x, eng.cssH)
  ctx.lineTo(eng.worldToScreen(pts[0]!).x, eng.cssH)
  ctx.closePath()
  ctx.fillStyle = 'rgba(234,242,255,0.04)'
  ctx.fill()
  ctx.restore()
}

export function drawBasin(ctx: CanvasRenderingContext2D, eng: Engine, terrain: readonly Seg[], goalX: number) {
  const y = terrainF(terrain, goalX) ?? terrainF(terrain, terrain[terrain.length - 1]?.x1 ?? goalX) ?? 0
  const pad = eng.worldToScreen({ x: goalX + 2, y })
  ctx.save()
  ctx.strokeStyle = eng.palette.mint
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(pad.x - 30, pad.y)
  ctx.lineTo(pad.x + 30, pad.y)
  ctx.stroke()
  ctx.fillStyle = 'rgba(61,255,162,0.12)'
  ctx.fillRect(pad.x - 30, pad.y, 60, 16)
  ctx.restore()
}

export function drawShards(ctx: CanvasRenderingContext2D, eng: Engine, shards: readonly Shard[]) {
  for (const s of shards) {
    if (s.got) continue
    const p = eng.worldToScreen({ x: s.x, y: s.y })
    ctx.save()
    ctx.fillStyle = eng.palette.amber
    ctx.beginPath()
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
    ctx.fill()
    eng.drawGlow(p.x, p.y, 14, eng.palette.amber, 0.45)
    ctx.restore()
  }
}

export function drawGhost(
  ctx: CanvasRenderingContext2D,
  eng: Engine,
  frames: readonly GhostFrame[],
  elapsedMs: number,
) {
  if (frames.length < 2) return
  const idx = Math.floor((elapsedMs / 1000) * 120) % frames.length
  const f = frames[idx]!
  const p = eng.worldToScreen({ x: f.x, y: f.y })
  ctx.save()
  ctx.globalAlpha = 0.35
  ctx.strokeStyle = eng.palette.cyan
  ctx.setLineDash([4, 5])
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let i = idx; i < frames.length && i < idx + 60; i++) {
    const q = eng.worldToScreen(frames[i]!)
    if (i === idx) ctx.moveTo(q.x, q.y)
    else ctx.lineTo(q.x, q.y)
  }
  ctx.stroke()
  ctx.fillStyle = eng.palette.cyan
  ctx.beginPath()
  ctx.arc(p.x, p.y, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

export function drawWall(
  ctx: CanvasRenderingContext2D,
  eng: Engine,
  noise: HTMLCanvasElement,
  wallX: number,
  timeMs: number,
) {
  const topWorld = eng.screenToWorld({ x: 0, y: 0 }).y
  const bottomWorld = eng.screenToWorld({ x: 0, y: eng.cssH }).y
  const topSp = eng.worldToScreen({ x: 0, y: topWorld + 4 }).y
  const h = eng.cssH - topSp + 100

  ctx.save()
  ctx.globalAlpha = 0.9
  const tileW = noise.width / eng.cam.scale
  const offset = (timeMs / 1000) * 2
  const leftWorld = eng.screenToWorld({ x: 0, y: 0 }).x - 4
  const startTile = Math.floor((leftWorld - offset) / tileW)
  const endTile = Math.ceil((wallX - offset) / tileW)
  for (let t = startTile; t <= endTile; t++) {
    const tx = offset + t * tileW
    const tSp0 = eng.worldToScreen({ x: tx, y: 0 })
    const tSp1 = eng.worldToScreen({ x: tx + tileW, y: 0 })
    ctx.drawImage(noise, tSp0.x, topSp - 20, tSp1.x - tSp0.x, h)
  }
  // jagged edge line at wallX
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let i = 0; i <= 40; i++) {
    const yWorld = bottomWorld + ((topWorld + 4 - bottomWorld) * i) / 40
    const jitter = Math.sin(i * 0.8 + timeMs / 200) * 0.15
    const p = eng.worldToScreen({ x: wallX + jitter, y: yWorld })
    if (i === 0) ctx.moveTo(p.x, p.y)
    else ctx.lineTo(p.x, p.y)
  }
  ctx.stroke()
  ctx.restore()
}

export function drawRider(ctx: CanvasRenderingContext2D, eng: Engine, x: number, y: number, vx: number, vy: number, mode: 'ground' | 'air') {
  const pos = { x, y }
  const angle = mode === 'ground' ? 0 : Math.atan2(vy, vx)
  eng.drawMascot(pos, 0.75, { rotation: angle * 0.35, squash: mode === 'air' ? 0.08 : 0 })
}

export function drawWallMeter(ctx: CanvasRenderingContext2D, eng: Engine, dist: number) {
  const text = `${Math.max(0, dist).toFixed(1)}u`
  ctx.save()
  ctx.font = 'bold 14px JetBrains Mono, monospace'
  ctx.textAlign = 'right'
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(0,0,0,0.8)'
  ctx.shadowBlur = 4
  ctx.fillText(text, eng.cssW - 12, 28)
  ctx.restore()
}

let snowSettleT0 = 0
export function drawSnowSettle(ctx: CanvasRenderingContext2D, eng: Engine, timeMs: number) {
  if (snowSettleT0 === 0) snowSettleT0 = timeMs
  const age = (timeMs - snowSettleT0) / 1000
  if (age > 4) return
  ctx.save()
  ctx.globalAlpha = 0.6 * (1 - age / 4)
  ctx.fillStyle = '#ffffff'
  for (let i = 0; i < 30; i++) {
    const sx = (i * 137.5) % eng.cssW
    const sy = (age * 40 + i * 13) % (eng.cssH * 0.6)
    ctx.beginPath()
    ctx.arc(sx, sy, 1.5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}
