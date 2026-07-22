import { useNavigate } from 'react-router'
import { TopBar } from '@gridverse/kit/ui'
import { useGameStore, selectPlayerLevel } from '@/store'
import CodexSection from '@/pages/CodexSection'

export default function Codex() {
  const navigate = useNavigate()
  const xp = useGameStore((s) => s.xp)
  const gears = useGameStore((s) => s.gears)
  const level = selectPlayerLevel(xp)

  return (
    <div className="flex min-h-full flex-col">
      <TopBar
        title="Codex"
        gears={gears}
        level={level}
        onProfile={() => navigate('/profile')}
        onSettings={() => navigate('/settings')}
      />
      <main className="flex-1 px-4 py-4">
        <p className="mb-3 px-1 text-body font-semibold text-mid">
          Real math hides on the back of every card. Collect them all.
        </p>
        <CodexSection />
      </main>
    </div>
  )
}
