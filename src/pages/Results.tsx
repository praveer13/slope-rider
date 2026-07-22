import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Map as MapIcon, RotateCcw, Sparkles } from 'lucide-react'
import { clamp } from '@gridverse/kit/engine'
import { Chip, NeonButton, StarMeter, XpBar } from '@gridverse/kit/ui'
import {
  useGameStore,
  selectPlayerLevel,
  selectXpIntoLevel,
  selectPlayerTitle,
  chapterName,
} from '../store.ts'
import { loadResult, LEVELS, type ResultPayload } from '../game/levels.ts'
import { cardById, CARDS, type CardMeta } from '@/lib/cards'
import { ZONES } from '@/lib/content'
import { haptics, sfx, cn } from '@gridverse/kit/lib'

const pop = { type: 'spring', stiffness: 420, damping: 24 } as const
const gentle = { type: 'spring', stiffness: 180, damping: 22 } as const

const CH_TONE = {
  1: 'mint',
  2: 'cyan',
  3: 'violet',
  4: 'amber',
  5: 'magenta',
  6: 'coral',
} as const
type Tone = (typeof CH_TONE)[keyof typeof CH_TONE]

function CountUp({ to, duration = 0.7, delay = 0 }: { to: number; duration?: number; delay?: number }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let raf = 0
    const t0 = performance.now() + delay * 1000
    const step = (t: number) => {
      const k = clamp((t - t0) / (duration * 1000), 0, 1)
      setN(Math.round(to * (1 - Math.pow(1 - k, 3))))
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [to, duration, delay])
  return <>{n}</>
}

function Confetti({ fire }: { fire: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduceMotion = useGameStore((s) => s.settings.reduceMotion)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !fire || reduceMotion) return
    const ctx = canvas.getContext('2d')!
    const w = (canvas.width = canvas.offsetWidth)
    const h = (canvas.height = canvas.offsetHeight)
    const colors = ['#FFD166', '#3DFFA2', '#22D3EE', '#FFB020', '#8B5CF6', '#FF2E93']
    const parts = Array.from({ length: 48 }, (_, i) => ({
      x: w / 2 + (Math.random() - 0.5) * w * 0.3,
      y: h * 0.28,
      vx: (Math.random() - 0.5) * 7,
      vy: -Math.random() * 8 - 2,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: colors[i % colors.length]!,
      len: 6 + Math.random() * 8,
    }))
    const t0 = performance.now()
    let raf = 0
    const step = (t: number) => {
      const el = t - t0
      ctx.clearRect(0, 0, w, h)
      if (el > 1600) return
      const alpha = el > 1200 ? 1 - (el - 1200) / 400 : 1
      for (const p of parts) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.35
        p.rot += p.vr
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.strokeStyle = p.color
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(-p.len / 2, 0)
        ctx.lineTo(p.len / 2, 0)
        ctx.stroke()
        ctx.restore()
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [fire, reduceMotion])
  if (!fire || reduceMotion) return null
  return <canvas ref={ref} className="pointer-events-none absolute inset-0 z-20 h-full w-full" aria-hidden />
}
function ConceptCardFlip({ card, delay = 0 }: { card: CardMeta; delay?: number }) {
  const [flipped, setFlipped] = useState(false)
  const [dealt, setDealt] = useState(false)
  const accent = ZONES[card.zone - 1]?.accent ?? '#22D3EE'

  useEffect(() => {
    const t1 = window.setTimeout(() => setDealt(true), delay * 1000)
    return () => window.clearTimeout(t1)
  }, [delay])
  return (
    <div className="flex flex-col items-center gap-2" style={{ perspective: 900 }}>
      <motion.div
        initial={{ y: 120, rotate: -14, opacity: 0 }}
        animate={dealt ? { y: 0, rotate: 0, opacity: 1 } : {}}
        transition={gentle}
        className="relative h-[224px] w-[168px] cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
        onClick={() => {
          setFlipped((f) => !f)
          haptics.tick()
          sfx.tick()
        }}
        role="button"
        aria-label={`Concept card ${card.front}. Tap to flip.`}
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div
            className="absolute inset-0 overflow-hidden rounded-lg border-2 bg-night-2"
            style={{ borderColor: accent, backfaceVisibility: 'hidden', boxShadow: `0 0 24px ${accent}44` }}
          >
            <div
              className="absolute inset-0 flex flex-col justify-end p-3"
              style={{ background: `linear-gradient(135deg, ${accent}33, #0B1628)` }}
            >
              <p className="relative text-[10px] font-extrabold uppercase tracking-widest" style={{ color: accent }}>
                concept card
              </p>
              <p className="text-title font-extrabold leading-tight text-hi">{card.front}</p>
              <p className="text-[11px] font-bold text-mid">{card.term}</p>
            </div>
          </div>
          <div
            className="absolute inset-0 flex flex-col gap-1.5 rounded-lg border-2 bg-night-2 p-3"
            style={{
              borderColor: accent,
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              boxShadow: `0 0 24px ${accent}44`,
            }}
          >
            <p className="relative text-[10px] font-extrabold uppercase tracking-widest" style={{ color: accent }}>
              nerd note
            </p>
            <p className="relative text-title font-extrabold text-hi">{card.term}</p>
            <p className="relative text-[13px] font-semibold leading-snug text-mid">{card.note}</p>
            <p className="relative mt-auto rounded-sm bg-night-3 px-2 py-1 font-mono text-[11px] font-bold text-cyan">
              {card.foundLabel}
            </p>
          </div>
        </motion.div>
      </motion.div>
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-low">tap to flip</p>
    </div>
  )
}

function CardsFan({ chapter }: { chapter: number }) {
  const cards = CARDS.filter((c) => c.zone === chapter)
  const owned = useGameStore((s) => s.cards)
  const accent = ZONES[chapter - 1]?.accent ?? '#22D3EE'
  return (
    <div className="flex items-center justify-center">
      {cards.map((card, i) => {
        const has = owned.includes(card.id)
        return (
          <motion.div
            key={card.id}
            initial={{ y: 40, opacity: 0, rotate: 0 }}
            animate={{ y: 0, opacity: 1, rotate: (i - 1) * 12 }}
            transition={{ ...pop, delay: 0.12 * i }}
            className={cn('h-[120px] w-[86px] overflow-hidden rounded-md border-2 bg-night-2', i > 0 && '-ml-5')}
            style={{ borderColor: has ? accent : '#223354', zIndex: i }}
          >
            {has ? (
              <div
                className="flex h-full w-full flex-col justify-end p-1.5"
                style={{ background: `linear-gradient(135deg, ${accent}33, #0B1628)` }}
              >
                <p className="text-[9px] font-extrabold uppercase leading-tight tracking-tight text-hi">{card.front}</p>
                <p className="text-[8px] font-bold text-low">{card.term}</p>
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-night-3 text-2xl font-black text-low">?</div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

export default function Results() {
  const navigate = useNavigate()
  const payload = useMemo(() => loadResult(), [])
  const [phase, setPhase] = useState(0)
  const reduceMotion = useGameStore((s) => s.settings.reduceMotion)

  useEffect(() => {
    if (!payload) return
    const steps = [500, 1300, 1900, 2500, 3100]
    const timers = steps.map((ms, i) => window.setTimeout(() => setPhase(i + 1), reduceMotion ? ms * 0.4 : ms))
    return () => timers.forEach(clearTimeout)
  }, [payload, reduceMotion])

  useEffect(() => {
    if (payload) sfx.win()
  }, [payload])

  if (!payload) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-body font-semibold text-mid">No run to report — the Gridverse awaits!</p>
        <NeonButton onClick={() => navigate('/map')}>To the map</NeonButton>
      </div>
    )
  }

  return <ResultsBody payload={payload} phase={phase} setPhase={setPhase} navigate={navigate} />
}

function ResultsBody({
  payload,
  phase,
  setPhase,
  navigate,
}: {
  payload: ResultPayload
  phase: number
  setPhase: (p: number) => void
  navigate: (to: string) => void
}) {
  const level = LEVELS[payload.levelId]
  const tone = (CH_TONE[payload.chapter as keyof typeof CH_TONE] ?? 'mint') as Tone
  const tryAgain = !!payload.tryAgain
  const lvlBefore = selectPlayerLevel(payload.xpBefore)
  const lvlAfter = selectPlayerLevel(payload.xpAfter)
  const leveledUp = lvlAfter > lvlBefore
  const ratioTo = selectXpIntoLevel(payload.xpAfter) / 100
  const fresh = Date.now()
  const replayTo = `/play?level=${payload.levelId}&r=${fresh}`
  const nextTo = payload.nextLevelId ? `/play?level=${payload.nextLevelId}` : '/map'
  const card = payload.cardId ? cardById(payload.cardId) : undefined

  const headline = tryAgain ? 'SO CLOSE!' : payload.chapterComplete ? `${chapterName(payload.levelId).toUpperCase()} CLEARED!` : 'CLEAR!'

  return (
    <div
      className="relative flex flex-1 flex-col items-center overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-10"
      onClick={() => setPhase(5)}
    >
      <Confetti fire={!tryAgain && phase >= 1} />

      <div className="sr-only" aria-live="polite">
        {`${headline} Level ${payload.levelId} ${payload.levelName}. ${payload.stars} of 3 stars. ` +
          `${payload.xpEarned} XP and ${payload.gearsEarned} gears earned. ` +
          (card ? `Concept card ${card.front} unlocked.` : '') +
          (payload.chapterComplete ? ' Chapter complete!' : '')}
      </div>

      <div className="z-10 flex flex-wrap justify-center gap-x-2">
        {headline.split(' ').map((word, wi) => (
          <span key={wi} className="flex">
            {word.split('').map((ch, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0, y: -30, rotate: -12 }}
                animate={{ scale: 1, y: 0, rotate: 0 }}
                transition={{ ...pop, delay: 0.05 * (wi * 6 + i) }}
                className={cn('font-display text-[32px] leading-none tracking-wide', tryAgain ? 'text-coral' : 'text-gold')}
                style={{ textShadow: tryAgain ? '0 0 16px rgba(255,107,74,.5)' : '0 0 16px rgba(255,209,102,.5)' }}
              >
                {ch}
              </motion.span>
            ))}
          </span>
        ))}
      </div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={gentle}
        className="z-10 mt-4 flex h-28 w-28 items-center justify-center rounded-full border-2 border-line bg-night-2"
        style={{ borderColor: ZONE_ACCENT[payload.chapter] }}
      >
        <span className="font-display text-4xl" style={{ color: ZONE_ACCENT[payload.chapter] }}>
          {payload.stars}
        </span>
        <span className="text-caption font-extrabold text-low">/3</span>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="z-10 mt-1 text-center text-body font-semibold text-mid"
      >
        {tryAgain
          ? (payload.coachLine ?? level?.coach ?? 'Try a different line.')
          : `LV ${payload.levelId} · ${payload.levelName} — LIGHT ${payload.lightGot}/${payload.lightTotal}`}
      </motion.p>

      {tryAgain ? (
        <div className="z-10 mt-8 flex w-full max-w-[300px] flex-col gap-2" onClick={(e) => e.stopPropagation()}>
          <NeonButton onClick={() => navigate(replayTo)}>
            <RotateCcw size={18} /> Try again
          </NeonButton>
          <NeonButton variant="ghost" onClick={() => navigate('/map')}>
            <MapIcon size={18} /> Map
          </NeonButton>
        </div>
      ) : (
        <>
          <div className="z-10 mt-4 h-[60px]">{phase >= 1 && <StarMeter stars={payload.stars} size={48} animateEarn />}</div>

          <div className="z-10 mt-4 flex w-full max-w-[300px] flex-col gap-1.5">
            {phase >= 2 && (
              <>
                <motion.div initial={{ x: -24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center justify-between rounded-md border border-line bg-night-2 px-3 py-2">
                  <span className="text-title font-extrabold text-mint">XP</span>
                  <span className="font-mono text-mono-m font-bold text-mint">+<CountUp to={payload.xpEarned} /></span>
                </motion.div>
                <motion.div initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex items-center justify-between rounded-md border border-line bg-night-2 px-3 py-2">
                  <span className="text-title font-extrabold text-gold">GEARS</span>
                  <span className="font-mono text-mono-m font-bold text-gold">+<CountUp to={payload.gearsEarned} /></span>
                </motion.div>
                {!payload.firstClear && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-caption font-extrabold uppercase text-low">
                    replay pays light — practice pays off
                  </motion.p>
                )}
              </>
            )}
          </div>

          {phase >= 3 && <XpSection payload={payload} lvlAfter={lvlAfter} leveledUp={leveledUp} ratioTo={ratioTo} />}

          <AnimatePresence>
            {leveledUp && phase >= 3 && phase < 5 && (
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                transition={pop}
                className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-night-0/80 backdrop-blur-sm"
              >
                <Sparkles size={32} className="mb-2 text-gold" />
                <p className="font-display text-[28px] text-gold" style={{ textShadow: '0 0 20px rgba(255,209,102,.6)' }}>
                  LEVEL UP!
                </p>
                <p className="mt-1 text-h2 font-black text-hi">LV {lvlAfter} · {selectPlayerTitle(lvlAfter)}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {payload.chapterComplete && phase >= 4 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="z-10 mt-5 flex w-full max-w-[320px] flex-col items-center gap-3 rounded-xl border border-line bg-night-2 p-4"
            >
              <div
                className="relative h-[86px] w-[128px] overflow-hidden rounded-lg border-2"
                style={{ borderColor: ZONE_ACCENT[payload.chapter] }}
              >
                <div
                  className="h-full w-full"
                  style={{
                    background: `linear-gradient(135deg, ${ZONE_ACCENT[payload.chapter]}44, #0B1628)`,
                  }}
                />
              </div>
              <CardsFan chapter={payload.chapter} />
              {payload.firstClear && <Chip tone="gold">chapter bonus · +100 XP · +50 gears</Chip>}
            </motion.div>
          )}

          {phase >= 4 && card && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="z-10 mt-5 flex flex-col items-center gap-2">
              <p className="text-caption font-extrabold uppercase tracking-widest text-low">
                <Chip tone={tone}>concept card unlocked</Chip>
              </p>
              <ConceptCardFlip card={card} />
            </motion.div>
          )}

          {phase >= 4 && payload.cardDuplicate && !card && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="z-10 mt-5">
              <Chip tone="gold">duplicate → +5 gears</Chip>
            </motion.div>
          )}

          {phase >= 5 && (
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={pop}
              className="z-10 mt-6 flex w-full max-w-[300px] flex-col gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <NeonButton onClick={() => navigate(payload.chapterComplete ? '/map' : nextTo)}>
                {payload.chapterComplete ? 'Next chapter' : 'Next level'} <ChevronRight size={18} />
              </NeonButton>
              <NeonButton variant="secondary" onClick={() => navigate(replayTo)}>
                <RotateCcw size={18} /> Replay
              </NeonButton>
              <NeonButton variant="ghost" onClick={() => navigate('/map')}>
                <MapIcon size={18} /> Map
              </NeonButton>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}

function XpSection({
  payload,
  lvlAfter,
  leveledUp,
  ratioTo,
}: {
  payload: ResultPayload
  lvlAfter: number
  leveledUp: boolean
  ratioTo: number
}) {
  const [ratio, setRatio] = useState(() => selectXpIntoLevel(payload.xpBefore) / 100)
  const [done, setDone] = useState(false)
  useEffect(() => {
    const timers: number[] = []
    if (leveledUp) {
      timers.push(window.setTimeout(() => setRatio(1), 250))
      timers.push(
        window.setTimeout(() => {
          setRatio(ratioTo)
          setDone(true)
        }, 1350),
      )
    } else {
      timers.push(
        window.setTimeout(() => {
          setRatio(ratioTo)
          setDone(true)
        }, 250),
      )
    }
    return () => timers.forEach(clearTimeout)
  }, [leveledUp, ratioTo])
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="z-10 mt-4 w-full max-w-[300px]">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-caption font-extrabold uppercase text-low">
          LV {lvlAfter} · {selectPlayerTitle(lvlAfter)}
        </span>
        <span className="font-mono text-mono-s font-bold text-low">
          {done ? selectXpIntoLevel(payload.xpAfter) : selectXpIntoLevel(payload.xpBefore)}/100
        </span>
      </div>
      <XpBar ratio={ratio} shimmer={done} />
    </motion.div>
  )
}

const ZONE_ACCENT: Record<number, string> = {
  1: '#3DFFA2',
  2: '#22D3EE',
  3: '#8B5CF6',
  4: '#FFB020',
  5: '#FF2E93',
  6: '#FF6B4A',
}
