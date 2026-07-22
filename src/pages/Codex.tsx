import { TopBar, Chip } from '@gridverse/kit/ui'

const FRAGMENTS = [
  { id: 'f1', title: 'First Spark', body: 'The arrow that reaches the gold pad carries the spark forward.' },
  { id: 'f2', title: 'Grid Laws', body: 'Every move can be undone; every level can be solved with the canonical path.' },
]

export default function Codex() {
  return (
    <div className="flex min-h-full flex-col">
      <TopBar title="Codex" />
      <main className="flex flex-1 flex-col gap-3 px-4 pb-24 pt-4">
        {FRAGMENTS.map((f) => (
          <div key={f.id} className="rounded-lg border border-line bg-night-2 p-4">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg text-hi">{f.title}</span>
              <Chip tone="gold">Archive</Chip>
            </div>
            <p className="mt-2 text-body text-mid">{f.body}</p>
          </div>
        ))}
      </main>
    </div>
  )
}
