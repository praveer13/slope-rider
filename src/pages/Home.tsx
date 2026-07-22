import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { Play, Star } from 'lucide-react'
import { NeonButton, Chip, XpBar } from '@gridverse/kit/ui'
import {
  useGameStore,
  selectPlayerLevel,
  selectXpIntoLevel,
  selectTotalStars,
} from '@/store'
import { asset } from '@/lib/asset'
import { currentNodeId } from '@/lib/content'

export default function Home() {
  const navigate = useNavigate()
  const progress = useGameStore((s) => s.levels)
  const xp = useGameStore((s) => s.xp)
  const gears = useGameStore((s) => s.gears)
  const level = selectPlayerLevel(xp)
  const into = selectXpIntoLevel(xp)
  const totalStars = useGameStore(selectTotalStars)

  const nextId = currentNodeId(progress)
  const href = nextId === 'boss' ? '/boss' : `/play?level=${nextId}`

  return (
    <div className="relative flex min-h-full flex-col overflow-hidden">
      <img
        src={asset('nebula-bg.png')}
        alt=""
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-60"
      />
      <div className="absolute inset-0 z-0 bg-night-0/40" />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-8 pt-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 360, damping: 24 }}
          className="relative"
        >
          <img
            src={asset('mascot-vex.png')}
            alt="Vex"
            className="h-28 w-28 rounded-2xl border-2 border-line bg-night-2 object-cover shadow-glow-cyan"
          />
          <div className="absolute -bottom-2 -right-2 rounded-full border border-line bg-night-1 p-1.5 shadow-md">
            <Star className="h-5 w-5 text-gold" fill="currentColor" />
          </div>
        </motion.div>

        <div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-5xl text-hi text-glow-amber"
          >
            SLOPE RIDER
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-2 text-body text-mid"
          >
            Hold the hill. Release the sky.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="w-full max-w-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <Chip tone="amber">LV {level}</Chip>
            <Chip tone="cyan">{totalStars} ★</Chip>
          </div>
          <XpBar ratio={into / 100} />
          <div className="flex items-center justify-center gap-2 text-caption text-mid">
            <span className="rounded-sm border border-line bg-night-2 px-2 py-1">
              {gears} gears
            </span>
            <span className="rounded-sm border border-line bg-night-2 px-2 py-1">
              Next: {nextId === 'boss' ? 'The Avalanche' : nextId}
            </span>
          </div>
          <NeonButton ariaLabel="Play current level" onClick={() => navigate(href)}>
            <Play className="h-5 w-5" />
            Play
          </NeonButton>
        </motion.div>
      </main>
    </div>
  )
}
