import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { NeonButton, StarMeter, TopBar } from '@gridverse/kit/ui'
import { useGameStore } from '../store.ts'

export default function Results() {
  const navigate = useNavigate()
  const currentLevel = useGameStore((s) => s.currentLevel)
  const lastStars = useGameStore((s) => s.levels[currentLevel]?.stars ?? 0)

  return (
    <div className="flex min-h-full flex-col">
      <TopBar title="Results" />
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 24 }}
        >
          <StarMeter stars={lastStars} size={48} animateEarn />
        </motion.div>
        <h1 className="font-display text-3xl text-hi">Level Complete</h1>
        <div className="flex w-full max-w-xs flex-col gap-3">
          <NeonButton onClick={() => navigate('/play')}>Next Level</NeonButton>
          <NeonButton variant="secondary" onClick={() => navigate('/map')}>
            Map
          </NeonButton>
        </div>
      </main>
    </div>
  )
}
