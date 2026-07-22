import { useNavigate } from 'react-router'
import { TopBar, Chip, NeonButton } from '@gridverse/kit/ui'
import { levels } from '../game/levels.ts'
import { useGameStore, chapterOf } from '../store.ts'

export default function Map() {
  const navigate = useNavigate()
  const progress = useGameStore((s) => s.levels)
  const setCurrent = useGameStore((s) => s.setCurrentLevel)

  return (
    <div className="flex min-h-full flex-col">
      <TopBar title="Map" />
      <main className="flex flex-1 flex-col gap-3 px-4 pb-24 pt-4">
        {levels.map((lvl) => {
          const p = progress[lvl.id]
          return (
            <button
              key={lvl.id}
              type="button"
              onClick={() => {
                setCurrent(lvl.id)
                navigate('/play')
              }}
              className="flex items-center justify-between rounded-lg border border-line bg-night-2 p-4 text-left active:scale-[0.98]"
            >
              <div>
                <div className="font-display text-lg text-hi">{lvl.name}</div>
                <Chip tone="neutral" className="mt-1">
                  Ch {chapterOf(lvl.id)}
                </Chip>
              </div>
              {p?.completed ? (
                <Chip tone="gold">{p.stars}★</Chip>
              ) : (
                <Chip tone="cyan">Locked</Chip>
              )}
            </button>
          )
        })}
        <NeonButton
          variant="secondary"
          onClick={() => navigate('/')}
          className="mt-4"
        >
          Back home
        </NeonButton>
      </main>
    </div>
  )
}
