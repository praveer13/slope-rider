import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { NeonButton, Chip, XpBar, TopBar } from '@gridverse/kit/ui'
import {
  useGameStore,
  selectPlayerLevel,
  selectXpIntoLevel,
  selectTotalStars,
} from '../store.ts'

export default function Home() {
  const navigate = useNavigate()
  const currentLevel = useGameStore((s) => s.currentLevel)
  const xp = useGameStore((s) => s.xp)
  const level = selectPlayerLevel(xp)
  const into = selectXpIntoLevel(xp)
  const totalStars = useGameStore(selectTotalStars)
  const gears = useGameStore((s) => s.gears)

  return (
    <div className="flex min-h-full flex-col">
      <TopBar title="__GAME_NAME__" gears={gears} />
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-8 pt-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex h-24 w-24 items-center justify-center rounded-2xl border border-line bg-night-2 shadow-glow-cyan"
        >
          <Zap className="h-12 w-12 text-amber" />
        </motion.div>
        <div>
          <h1 className="font-display text-4xl text-hi text-glow-amber">
            __GAME_NAME__
          </h1>
          <p className="mt-2 text-body text-mid">
            Drag the spark to the gold pad.
          </p>
        </div>
        <div className="w-full max-w-xs space-y-3">
          <div className="flex items-center justify-between">
            <Chip tone="amber">LV {level}</Chip>
            <Chip tone="cyan">{totalStars} ★</Chip>
          </div>
          <XpBar ratio={into / 100} />
          <NeonButton
            ariaLabel="Play current level"
            onClick={() => navigate('/play')}
          >
            Play {currentLevel}
          </NeonButton>
        </div>
      </main>
    </div>
  )
}
