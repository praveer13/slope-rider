import { clamp } from '@gridverse/kit/engine'

interface AreaBarProps {
  area: number
  total: number
}

export default function AreaBar({ area, total }: AreaBarProps) {
  const frac = clamp(total > 0 ? area / total : 0, 0, 1)
  const pulse = frac >= 0.7 ? 'animate-pulse' : ''

  return (
    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-2 w-full overflow-hidden bg-night-3/60">
      <div
        className={`h-full bg-gradient-to-r from-mint via-amber to-gold shadow-glow-amber ${pulse}`}
        style={{ width: `${frac * 100}%` }}
      />
    </div>
  )
}
