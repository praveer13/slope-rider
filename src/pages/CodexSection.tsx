import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, RotateCcw } from 'lucide-react'
import { Chip } from '@gridverse/kit/ui'
import { cn } from '@gridverse/kit/lib'
import { useGameStore } from '@/store'
import { CARDS, FRAGMENTS } from '@/lib/cards'
import { ZONES } from '@/lib/content'

const pop = { type: 'spring', stiffness: 420, damping: 24 } as const

export default function CodexSection() {
  const progress = useGameStore((s) => s.levels)

  return (
    <div className="flex flex-col gap-6">
      {ZONES.map((zone) => {
        const zoneCards = CARDS.filter(
          (c) => c.zone === zone.id && c.id !== 'the-white-wall',
        )
        return (
          <section key={zone.id}>
            <h3
              className="mb-2 px-1 font-display text-lg"
              style={{ color: zone.accent }}
            >
              {zone.name}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {zoneCards.map((card) => (
                <ConceptCard key={card.id} card={card} progress={progress} />
              ))}
            </div>
          </section>
        )
      })}

      {/* Boss reward card */}
      <section>
        <h3 className="mb-2 px-1 font-display text-lg text-coral">Boss Reward</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ConceptCard
            card={CARDS.find((c) => c.id === 'the-white-wall')!}
            progress={progress}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-2 px-1 font-display text-lg text-gold">Founders' Archive</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FRAGMENTS.map((fragment) => (
            <FragmentCard key={fragment.id} fragment={fragment} progress={progress} />
          ))}
        </div>
      </section>
    </div>
  )
}

function ConceptCard({
  card,
  progress,
}: {
  card: (typeof CARDS)[number]
  progress: Record<string, { completed?: boolean } | undefined>
}) {
  const [flipped, setFlipped] = useState(false)
  const unlocked =
    !!progress[card.foundIn]?.completed ||
    (card.foundIn === 'boss' && !!progress['boss']?.completed)

  return (
    <motion.button
      type="button"
      onClick={() => unlocked && setFlipped((f) => !f)}
      className={cn(
        'relative h-40 w-full rounded-xl border border-line bg-night-2 p-4 text-left',
        !unlocked && 'cursor-default opacity-70',
      )}
      style={{ perspective: '1000px' }}
      whileTap={unlocked ? { scale: 0.98 } : undefined}
    >
      <AnimatePresence mode="wait" initial={false}>
        {flipped ? (
          <motion.div
            key="back"
            initial={{ rotateY: 90 }}
            animate={{ rotateY: 0 }}
            exit={{ rotateY: -90 }}
            transition={pop}
            className="flex h-full flex-col"
          >
            <Chip tone="gold" className="mb-2 w-fit">
              {card.term}
            </Chip>
            <p className="text-body text-mid">{card.note}</p>
            <p className="mt-auto text-caption text-low">Tap to flip back</p>
          </motion.div>
        ) : (
          <motion.div
            key="front"
            initial={{ rotateY: -90 }}
            animate={{ rotateY: 0 }}
            exit={{ rotateY: 90 }}
            transition={pop}
            className="flex h-full flex-col"
          >
            <div className="flex items-start justify-between">
              <span className="font-display text-hi">{card.term}</span>
              {!unlocked && <Lock className="h-4 w-4 text-low" />}
              {unlocked && <RotateCcw className="h-4 w-4 text-low" />}
            </div>
            <p className="mt-2 text-body text-mid">{card.front}</p>
            <p className="mt-auto text-caption text-low">
              Found in {card.foundLabel}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

function FragmentCard({
  fragment,
  progress,
}: {
  fragment: (typeof FRAGMENTS)[number]
  progress: Record<string, { completed?: boolean } | undefined>
}) {
  const [flipped, setFlipped] = useState(false)
  const unlocked = !!progress[fragment.unlockLevel]?.completed

  return (
    <motion.button
      type="button"
      onClick={() => unlocked && setFlipped((f) => !f)}
      className={cn(
        'relative h-44 w-full rounded-xl border border-line bg-night-2 p-4 text-left',
        !unlocked && 'cursor-default opacity-70',
      )}
      whileTap={unlocked ? { scale: 0.98 } : undefined}
    >
      <AnimatePresence mode="wait" initial={false}>
        {flipped ? (
          <motion.div
            key="back"
            initial={{ rotateY: 90 }}
            animate={{ rotateY: 0 }}
            exit={{ rotateY: -90 }}
            transition={pop}
            className="flex h-full flex-col"
          >
            <p className="text-body text-mid">{fragment.prompt}</p>
            <p className="mt-auto font-display text-gold">
              Answer: {fragment.answer}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="front"
            initial={{ rotateY: -90 }}
            animate={{ rotateY: 0 }}
            exit={{ rotateY: 90 }}
            transition={pop}
            className="flex h-full flex-col"
          >
            <div className="flex items-start justify-between">
              <Chip tone="gold" className="w-fit">
                {fragment.title}
              </Chip>
              {!unlocked && <Lock className="h-4 w-4 text-low" />}
            </div>
            <p
              className="mt-2 overflow-hidden text-body text-mid"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
              }}
            >
              &ldquo;{fragment.quote}&rdquo;
            </p>
            <p className="mt-auto text-caption text-low">
              Unlocked by clearing{' '}
              {fragment.unlockLevel === 'boss' ? 'The Avalanche' : fragment.unlockLevel}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
