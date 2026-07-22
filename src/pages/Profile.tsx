import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { BookOpen, Star, Trophy, Zap } from 'lucide-react'
import { TopBar, Chip, GearCounter, XpBar } from '@gridverse/kit/ui'
import { asset } from '@/lib/asset'
import {
  useGameStore,
  selectPlayerLevel,
  selectXpIntoLevel,
  selectPlayerTitle,
  selectTotalStars,
} from '@/store'
import { countCleared, TOTAL_STARS } from '@/lib/content'
import { CARDS } from '@/lib/cards'

const pop = { type: 'spring', stiffness: 420, damping: 24 } as const

export default function Profile() {
  const navigate = useNavigate()
  const xp = useGameStore((s) => s.xp)
  const gears = useGameStore((s) => s.gears)
  const progress = useGameStore((s) => s.levels)
  const totalStars = useGameStore(selectTotalStars)
  const level = selectPlayerLevel(xp)
  const into = selectXpIntoLevel(xp)
  const title = selectPlayerTitle(level)
  const cleared = countCleared(progress)
  const foundCards = CARDS.filter(
    (c) =>
      !!progress[c.foundIn]?.completed ||
      (c.foundIn === 'boss' && !!progress['boss']?.completed),
  ).length

  return (
    <div className="flex min-h-full flex-col">
      <TopBar
        title="Profile"
        gears={gears}
        level={level}
        onSettings={() => navigate('/settings')}
      />

      <main className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={pop}
          className="rounded-2xl border border-line bg-night-2 p-6 text-center"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold shadow-glow-gold">
            <span className="font-display text-3xl text-gold">{level}</span>
          </div>
          <h2 className="mt-3 font-display text-2xl text-hi">{title}</h2>
          <Chip tone="gold" className="mt-2">
            Slope Rider
          </Chip>
        </motion.div>

        <XpBar ratio={into / 100} />

        <div className="grid grid-cols-2 gap-3">
          <StatTile
            icon={<Star className="h-5 w-5 text-gold" />}
            label="Stars"
            value={`${totalStars}/${TOTAL_STARS}`}
          />
          <StatTile
            icon={<Trophy className="h-5 w-5 text-cyan" />}
            label="Cleared"
            value={cleared}
          />
          <StatTile
            icon={<Zap className="h-5 w-5 text-amber" />}
            label="Level"
            value={level}
          />
          <StatTile
            icon={<BookOpen className="h-5 w-5 text-violet" />}
            label="Codex"
            value={`${foundCards}/${CARDS.length}`}
          />
        </div>

        <GearCounter
          count={gears}
          className="self-center text-lg"
          iconSrc={asset('icons-game.svg#i-gear-currency')}
        />

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          onClick={() => navigate('/codex')}
          className="flex items-center justify-between rounded-xl border border-line bg-night-2 p-4 active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet/15 text-violet">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="font-display text-hi">Codex</div>
              <div className="text-caption text-mid">{foundCards} cards found</div>
            </div>
          </div>
          <Chip tone="violet">Open</Chip>
        </motion.button>
      </main>
    </div>
  )
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-line bg-night-2 p-4">
      {icon}
      <span className="font-display text-2xl text-hi">{value}</span>
      <span className="text-caption uppercase text-mid">{label}</span>
    </div>
  )
}
