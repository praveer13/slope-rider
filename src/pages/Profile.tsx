import { TopBar, XpBar, GearCounter, Chip } from '@gridverse/kit/ui'
import {
  useGameStore,
  selectPlayerLevel,
  selectXpIntoLevel,
  selectPlayerTitle,
} from '../store.ts'

export default function Profile() {
  const xp = useGameStore((s) => s.xp)
  const gears = useGameStore((s) => s.gears)
  const streak = useGameStore((s) => s.streakDays)
  const level = selectPlayerLevel(xp)
  const into = selectXpIntoLevel(xp)
  const title = selectPlayerTitle(level)

  return (
    <div className="flex min-h-full flex-col">
      <TopBar title="Profile" gears={gears} />
      <main className="flex flex-1 flex-col gap-4 px-4 pb-24 pt-6">
        <div className="rounded-2xl border border-line bg-night-2 p-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold shadow-glow-gold">
            <span className="font-display text-2xl text-gold">{level}</span>
          </div>
          <h2 className="mt-3 font-display text-2xl text-hi">{title}</h2>
          <Chip tone="gold" className="mt-2">
            {streak} day streak
          </Chip>
        </div>
        <GearCounter count={gears} className="self-center text-lg" />
        <XpBar ratio={into / 100} shimmer={into >= 100} />
      </main>
    </div>
  )
}
