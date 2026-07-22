import { useState } from 'react'
import { clamp } from '@gridverse/kit/engine'
import { BottomSheet, Chip } from '@gridverse/kit/ui'
import { cardById } from '@/lib/cards'

interface SlopeChipProps {
  speed: number
  slope: number
  zone: number
  levelId: string
  mathLabels?: boolean
}

const ZONE_TONE: Record<number, string> = {
  1: 'mint',
  2: 'cyan',
  3: 'violet',
  4: 'amber',
  5: 'magenta',
  6: 'coral',
}

export default function SlopeChip({
  speed,
  slope,
  zone,
  levelId,
  mathLabels = false,
}: SlopeChipProps) {
  const [open, setOpen] = useState(false)
  const card = cardById(levelId)
  const tone = ZONE_TONE[zone] ?? 'cyan'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-w-[104px] flex-col items-start rounded-lg border border-line bg-night-2/90 px-3 py-2 shadow-panel backdrop-blur-sm active:scale-[0.98]"
        aria-label="Speed and slope. Tap for nerd note."
      >
        <span className="font-display text-[22px] leading-none text-hi">
          {speed.toFixed(1)}
        </span>
        <span className="mt-0.5 flex items-center gap-1 text-caption font-extrabold uppercase text-mid">
          {mathLabels ? (
            <span>
              f′(x)={slope.toFixed(1)}
            </span>
          ) : (
            <>
              <HillGlyph slope={slope} />
              {slope.toFixed(1)}
            </>
          )}
        </span>
      </button>

      {open && card && (
        <BottomSheet onClose={() => setOpen(false)} title={card.flavor}>
          <div className="flex flex-col gap-3 px-1 pb-2">
            <p className="text-body font-semibold text-mid">{card.note}</p>
            <p className="rounded-sm bg-night-3 px-2 py-1 font-mono text-[12px] font-bold text-cyan">
              {card.example}
            </p>
            <Chip tone={tone}>Zone {zone}</Chip>
          </div>
        </BottomSheet>
      )}
    </>
  )
}

function HillGlyph({ slope }: { slope: number }) {
  const angle = clamp(slope * 18, -35, 35)
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden>
      <line
        x1="2"
        y1="10"
        x2="16"
        y2="10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="2"
        y1="10"
        x2="16"
        y2="10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        transform={`rotate(${-angle}, 9, 10)`}
      />
    </svg>
  )
}

