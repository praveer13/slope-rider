import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { Lock, Sparkles } from 'lucide-react'
import { Chip, StarMeter } from '@gridverse/kit/ui'
import { cn } from '@gridverse/kit/lib'
import { useGameStore, selectTotalStars } from '@/store'
import {
  ZONES,
  ALL_LEVELS,
  isLevelUnlocked,
  isZoneOpen,
  zoneStars,
  TOTAL_STARS,
} from '@/lib/content'
import { GLYPH_COMPONENTS } from '@/lib/glyphs'

const pop = { type: 'spring', stiffness: 420, damping: 24 } as const

export default function Map() {
  const navigate = useNavigate()
  const progress = useGameStore((s) => s.levels)
  const totalStars = useGameStore(selectTotalStars)

  const bossUnlocked = isLevelUnlocked('boss', progress)

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-line/60 bg-night-1/90 px-4 py-3 backdrop-blur-[12px]">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl text-hi">Map</h1>
          <Chip tone="gold">
            {totalStars} / {TOTAL_STARS} ★
          </Chip>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-4">
        {ZONES.map((zone, zi) => {
          const Glyph = GLYPH_COMPONENTS[zone.glyph]
          const locked = !isZoneOpen(zone.id, progress)
          const stars = zoneStars(zone.id, progress)
          const zoneLevels = ALL_LEVELS.filter((l) => l.chapter === zone.id)

          return (
            <motion.section
              key={zone.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...pop, delay: zi * 0.05 }}
              className={cn(
                'relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br p-4 shadow-md',
                locked && 'opacity-80',
              )}
              style={{
                backgroundImage: `linear-gradient(135deg, ${zone.accent}15, ${zone.accent}05)`,
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-night-1/80"
                    style={{ color: zone.accent }}
                  >
                    <Glyph className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg text-hi">{zone.name}</h2>
                    <p className="text-caption text-mid">{zone.tagline}</p>
                  </div>
                </div>
                <Chip tone="gold" className="shrink-0">
                  {stars} ★
                </Chip>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {zoneLevels.map((lvl) => {
                  const unlocked = isLevelUnlocked(lvl.id, progress)
                  const p = progress[lvl.id]
                  const cleared = !!p?.completed
                  const isFinale = lvl.finale

                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      disabled={!unlocked}
                      onClick={() => navigate(`/play?level=${lvl.id}`)}
                      className={cn(
                        'flex h-11 w-11 items-center justify-center border transition-transform active:scale-95 disabled:cursor-not-allowed',
                        isFinale
                          ? 'aspect-[1.15] w-[50px]'
                          : 'aspect-square rounded-full',
                        cleared
                          ? 'border-gold/60 bg-gold/10'
                          : unlocked
                            ? 'border-current bg-night-1/80'
                            : 'border-line bg-night-2/80',
                        unlocked && !cleared && 'text-mid hover:text-hi',
                      )}
                      style={{
                        color: unlocked && !cleared ? zone.accent : undefined,
                        clipPath: isFinale
                          ? 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
                          : undefined,
                      }}
                      aria-label={`Level ${lvl.id}`}
                    >
                      {cleared ? (
                        <StarMeter stars={p.stars} size={16} />
                      ) : unlocked ? (
                        <span className="font-display text-sm">{lvl.index}</span>
                      ) : (
                        <Lock className="h-4 w-4 text-low" />
                      )}
                    </button>
                  )
                })}
              </div>

              {locked && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-night-0/70 backdrop-blur-[2px]">
                  <Lock className="h-8 w-8 text-mid" />
                  <Chip tone="neutral">{zone.gateLabel}</Chip>
                </div>
              )}
            </motion.section>
          )
        })}

        {/* Boss card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...pop, delay: ZONES.length * 0.05 }}
          className={cn(
            'relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br p-4 shadow-md',
            !bossUnlocked && 'opacity-80',
          )}
          style={{ backgroundImage: 'linear-gradient(135deg, #FF6B4A15, #FF6B4A05)' }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-night-1/80 text-coral">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <h2 className="font-display text-lg text-hi">The Avalanche</h2>
              <p className="text-caption text-mid">Outrun the white wall.</p>
            </div>
          </div>
          <button
            type="button"
            disabled={!bossUnlocked}
            onClick={() => navigate('/boss')}
            className="mt-4 w-full rounded-pill border border-coral/40 bg-coral/10 py-3 text-title font-extrabold text-coral disabled:opacity-50"
          >
            {bossUnlocked ? 'Enter Arena' : 'Locked'}
          </button>
          {!bossUnlocked && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-night-0/70 backdrop-blur-[2px]">
              <Lock className="h-8 w-8 text-mid" />
              <Chip tone="neutral">Clear all zones to open</Chip>
            </div>
          )}
        </motion.section>
      </main>
    </div>
  )
}
