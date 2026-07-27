import { useEffect, useRef } from 'react'
import { segDf, segF, type Seg } from '@/game/calculus'
import { slopeTint } from '@/game/tint'

const ZONE_ACCENT: Record<number, string> = {
  1: '#3DFFA2',
  2: '#22D3EE',
  3: '#8B5CF6',
  4: '#FFB020',
  5: '#FF2E93',
  6: '#FF6B4A',
}

/**
 * "Your line" receipt — the exact curve the player cleared with, rendered
 * static on a small canvas (design v3 §8). Bedrock in zone accent, shaped
 * hermite pieces derivative-tinted, matching the gameplay renderer.
 */
export default function LineThumbnail({
  segs,
  zone,
  goalX,
}: {
  segs: Seg[]
  zone: number
  goalX?: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || segs.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(2.5, window.devicePixelRatio || 1)
    const W = 288
    const H = 96
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (const s of segs) {
      minX = Math.min(minX, s.x0)
      maxX = Math.max(maxX, s.x1)
      for (let i = 0; i <= 16; i++) {
        const y = segF(s, s.x0 + ((s.x1 - s.x0) * i) / 16)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)
      }
    }
    const spanX = Math.max(1e-6, maxX - minX)
    const spanY = Math.max(1e-6, maxY - minY)
    const scale = Math.min((W - 16) / spanX, (H - 16) / spanY)
    const ox = (W - spanX * scale) / 2
    const oy = (H - spanY * scale) / 2
    const px = (x: number, y: number) => ({ sx: ox + (x - minX) * scale, sy: H - (oy + (y - minY) * scale) })

    const accent = ZONE_ACCENT[zone] ?? '#22D3EE'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (const s of segs) {
      const samples = Math.max(4, Math.min(48, Math.ceil((s.x1 - s.x0) * 4)))
      if (s.kind !== 'hermite') {
        ctx.strokeStyle = accent
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i <= samples; i++) {
          const x = s.x0 + ((s.x1 - s.x0) * i) / samples
          const { sx, sy } = px(x, segF(s, x))
          if (i === 0) ctx.moveTo(sx, sy)
          else ctx.lineTo(sx, sy)
        }
        ctx.stroke()
        continue
      }
      ctx.lineWidth = 2
      for (let i = 0; i < samples; i++) {
        const xa = s.x0 + ((s.x1 - s.x0) * i) / samples
        const xb = s.x0 + ((s.x1 - s.x0) * (i + 1)) / samples
        const m = segDf(s, (xa + xb) / 2)
        ctx.strokeStyle = slopeTint(m)
        const a = px(xa, segF(s, xa))
        const b = px(xb, segF(s, xb))
        ctx.beginPath()
        ctx.moveTo(a.sx, a.sy)
        ctx.lineTo(b.sx, b.sy)
        ctx.stroke()
      }
    }
    if (goalX !== undefined) {
      const gy = segs.reduce<number | null>((acc, s) => (goalX >= s.x0 - 1e-9 && goalX <= s.x1 + 1e-9 ? segF(s, goalX) : acc), null)
      if (gy !== null) {
        const { sx, sy } = px(goalX, gy)
        ctx.strokeStyle = '#FFB020'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(sx, sy - 10)
        ctx.lineTo(sx, sy + 10)
        ctx.stroke()
      }
    }
  }, [segs, zone, goalX])

  return (
    <canvas
      ref={ref}
      style={{ width: 288, height: 96 }}
      role="img"
      aria-label="The line you cleared with"
    />
  )
}
