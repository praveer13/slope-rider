import type { Engine } from './engine.js'
import type { Vec } from './math.js'

/* ---------------- shared canvas draw helpers ---------------- */

/** arrow from a to b (world), chevron head, optional dashed + glow */
export function drawArrow(
  eng: Engine,
  a: Vec,
  b: Vec,
  color: string,
  opts?: {
    width?: number
    dashed?: boolean
    glow?: boolean
    headScale?: number
    alpha?: number
  },
) {
  const ctx = eng.ctx
  const pa = eng.worldToScreen(a)
  const pb = eng.worldToScreen(b)
  const dx = pb.x - pa.x
  const dy = pb.y - pa.y
  const L = Math.hypot(dx, dy)
  if (L < 2) return
  const ux = dx / L
  const uy = dy / L
  const w = opts?.width ?? 3.5
  const head = Math.min(16, L * 0.4) * (opts?.headScale ?? 1)

  ctx.save()
  ctx.globalAlpha = opts?.alpha ?? 1
  if (opts?.dashed) ctx.setLineDash([7, 6])
  ctx.strokeStyle = color
  ctx.lineWidth = w
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(pa.x, pa.y)
  ctx.lineTo(pb.x - ux * head * 0.55, pb.y - uy * head * 0.55)
  ctx.stroke()
  ctx.setLineDash([])
  // chevron head
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(pb.x, pb.y)
  ctx.lineTo(pb.x - ux * head - uy * head * 0.55, pb.y - uy * head + ux * head * 0.55)
  ctx.lineTo(pb.x - ux * head * 0.55, pb.y - uy * head * 0.55)
  ctx.lineTo(pb.x - ux * head + uy * head * 0.55, pb.y - uy * head - ux * head * 0.55)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
  if (opts?.glow !== false) eng.drawGlow(pb.x, pb.y, head * 1.4, color, 0.4)
}

/** goal pad ring (gold), slow rotate; lockOn snaps shut + pulses */
export function drawPad(
  eng: Engine,
  p: Vec,
  opts?: {
    rU?: number
    lockOn?: boolean
    collected?: boolean
    color?: string
    label?: string
  },
) {
  const ctx = eng.ctx
  const sp = eng.worldToScreen(p)
  const r = (opts?.rU ?? 0.6) * eng.cam.scale
  const color = opts?.color ?? eng.palette.gold
  const t = eng.timeMs / 1000
  const pulse = opts?.lockOn ? 1 + Math.sin(t * 10) * 0.06 : 1
  ctx.save()
  ctx.translate(sp.x, sp.y)
  ctx.rotate(eng.reduceMotion ? 0 : t * (Math.PI / 4))
  ctx.strokeStyle = color
  ctx.lineWidth = 2.5
  ctx.globalAlpha = opts?.collected ? 1 : 0.9
  ctx.setLineDash([r * 0.5, r * 0.28])
  ctx.beginPath()
  ctx.arc(0, 0, r * pulse, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()
  eng.drawGlow(sp.x, sp.y, r * 1.15, color, opts?.lockOn ? 0.7 : 0.35)
  if (opts?.collected) {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(sp.x, sp.y, 6, 0, Math.PI * 2)
    ctx.fill()
  }
  if (opts?.label) {
    ctx.fillStyle = eng.palette.mid
    ctx.font = '700 11px "JetBrains Mono", monospace'
    ctx.textAlign = 'center'
    ctx.fillText(opts.label, sp.x, sp.y + r + 14)
  }
}

/** coordinate label chip above a world point (mono S) */
export function drawCoordLabel(
  eng: Engine,
  p: Vec,
  text: string,
  color?: string,
  offsetPx = 40,
) {
  const ctx = eng.ctx
  const sp = eng.worldToScreen(p)
  ctx.save()
  ctx.font = '700 12px "JetBrains Mono", monospace'
  const w = ctx.measureText(text).width + 14
  const x = sp.x - w / 2
  const y = sp.y - offsetPx
  ctx.fillStyle = 'rgba(17,27,48,0.92)'
  ctx.strokeStyle = eng.palette.line
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(x, y - 11, w, 20, 6)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = color ?? eng.palette.hi
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, sp.x, y)
  ctx.restore()
}

/** obstacle wall block: bg-3 fill + danger 1px edge */
export function drawWall(
  eng: Engine,
  r: { x: number; y: number; w: number; h: number },
) {
  const ctx = eng.ctx
  const tl = eng.worldToScreen({ x: r.x, y: r.y + r.h })
  const w = r.w * eng.cam.scale
  const h = r.h * eng.cam.scale
  ctx.save()
  ctx.fillStyle = eng.palette.bg3
  ctx.strokeStyle = eng.palette.danger
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(tl.x, tl.y, w, h, 6)
  ctx.fill()
  ctx.stroke()
  ctx.globalAlpha = 0.5
  ctx.strokeStyle = eng.palette.danger
  ctx.beginPath()
  for (let x = 6; x < w - 4; x += 12) {
    ctx.moveTo(tl.x + x, tl.y + 4)
    ctx.lineTo(tl.x + x + 6, tl.y + 12)
  }
  ctx.stroke()
  ctx.restore()
}
