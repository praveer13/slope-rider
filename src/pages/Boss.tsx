import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { Pause, RotateCcw, Map as MapIcon, Settings as SettingsIcon } from 'lucide-react'
import { IconButton, NeonButton, EquationChip, Toast, BottomSheet, StarMeter } from '@gridverse/kit/ui'
import { useGameStore } from '../store.ts'
import type { UiState } from '@gridverse/kit/session'
import { AvalancheSession, type AvExtras } from '../game/boss/avalancheSession.ts'
import { BOSS, saveResult, type ResultPayload } from '../game/levels.ts'

/**
 * Boss fight — THE AVALANCHE. Route `/boss`.
 * Turn-free spatial pursuit: outrun the white wall across three ridges.
 */

const sheetSpring = { type: 'spring', stiffness: 320, damping: 28 } as const

function bossStars(got: number, total: number): number {
  if (total === 0) return 1
  const ratio = got / total
  if (ratio >= 0.9) return 3
  if (ratio >= 0.6) return 2
  return 1
}

function Banner({ main, sub }: { main: string; sub: string }) {
  const reduce = useGameStore((s) => s.settings.reduceMotion)
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="pointer-events-none absolute inset-x-0 top-[18%] z-30 flex flex-col items-center gap-2 px-6 text-center"
    >
      <h2
        className="font-display text-display-l text-coral"
        style={{ textShadow: '0 0 12px rgba(255,107,74,.6), 0 0 48px rgba(255,107,74,.25)' }}
      >
        {reduce
          ? main
          : main.split('').map((ch, i) => (
              <motion.span
                key={`${i}-${ch}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="inline-block"
              >
                {ch === ' ' ? '\u00A0' : ch}
              </motion.span>
            ))}
      </h2>
      {sub !== '' && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduce ? 0 : 0.4, duration: 0.3 }}
          className="text-caption font-extrabold uppercase tracking-[0.14em] text-mid"
        >
          {sub}
        </motion.p>
      )}
    </motion.div>
  )
}

export default function Boss() {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sessionRef = useRef<AvalancheSession | null>(null)
  const bannerTimer = useRef<number | undefined>(undefined)

  const [ui, setUi] = useState<UiState<AvExtras> | null>(null)
  const [eqText, setEqText] = useState('')
  const [banner, setBanner] = useState<{ main: string; sub: string; key: number } | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [pauseOpen, setPauseOpen] = useState(false)
  const [introOpen, setIntroOpen] = useState(true)
  const [victory, setVictory] = useState<{
    moves: number
    hintsUsed: number
    stars: number
    got: number
    total: number
  } | null>(null)

  /* engine lifecycle */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const session = new AvalancheSession(canvas, BOSS, {
      onUi: (state) => {
        setUi(state)
        setEqText(state.equation)
      },
      onToast: (msg) => setToast(msg),
      onWin: (moves, hintsUsed) => {
        const got = sessionRef.current?.lightGot() ?? 0
        const total = sessionRef.current?.lightTotal() ?? 1
        const stars = bossStars(got, total)
        setVictory({ moves, hintsUsed, stars, got, total })
      },
    })
    sessionRef.current = session
    window.__pw = session
    session.begin()
    session.engine.start()

    return () => {
      session.dispose()
      sessionRef.current = null
      clearTimeout(bannerTimer.current)
    }
  }, [])

  /* ridge banner */
  useEffect(() => {
    if (!ui) return
    const main = ui.ridgeName
    const sub = `RIDGE ${ui.ridgeIdx + 1} OF 3`
    setBanner({ main, sub, key: Date.now() })
    clearTimeout(bannerTimer.current)
    bannerTimer.current = window.setTimeout(() => setBanner(null), main.length * 40 + 1600 + 500)
  }, [ui?.ridgeIdx])

  /* pause while modals are open */
  useEffect(() => {
    sessionRef.current?.setPaused(pauseOpen || !!victory || introOpen)
  }, [pauseOpen, victory, introOpen])

  /* victory → write rewards, then results */
  useEffect(() => {
    if (!victory) return
    const s = useGameStore.getState()
    const firstClear = !s.levels['boss']?.completed
    const xpBefore = s.xp
    s.completeLevel('boss', victory.stars, 150, 200)
    const xpAfter = s.xp
    if (!s.cards.includes('the-white-wall')) s.unlockCard('the-white-wall')
    if (!s.cards.includes('fragment-3')) s.unlockCard('fragment-3')
    s.setResumeLevel(null)

    const payload: ResultPayload = {
      levelId: 'boss',
      chapter: 7,
      levelName: 'The Avalanche',
      stars: victory.stars,
      lightGot: victory.got,
      lightTotal: victory.total,
      xpEarned: 200,
      gearsEarned: 150,
      firstClear,
      cardId: 'the-white-wall',
      cardDuplicate: !firstClear && s.cards.includes('the-white-wall'),
      chapterComplete: false,
      nextLevelId: null,
      boss: true,
      tryAgain: false,
      coachLine: 'Outrun the white wall.',
      xpBefore,
      xpAfter,
    }
    saveResult(payload)

    const t = setTimeout(() => navigate('/results?level=boss'), 1400)
    return () => clearTimeout(t)
  }, [victory, navigate])

  const retry = () => {
    sessionRef.current?.reset()
    setVictory(null)
    setIntroOpen(false)
  }

  return (
    <div className="relative flex-1 overflow-hidden bg-night-0">
      {/* world canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          touchAction: 'none',
        }}
        aria-hidden
      />

      {/* HUD */}
      <div className="absolute inset-x-0 top-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex h-12 items-center justify-between px-3">
          <IconButton ariaLabel="Pause" onClick={() => setPauseOpen(true)}>
            <Pause className="h-5 w-5" />
          </IconButton>
          <h1
            className="font-display text-[15px] text-coral"
            style={{ textShadow: '0 0 12px rgba(255,107,74,.6)' }}
          >
            THE AVALANCHE
          </h1>
          <span className="w-10" aria-hidden />
        </div>
      </div>

      {/* wall meter + light */}
      <div className="pointer-events-none absolute left-3 top-[calc(3.5rem+env(safe-area-inset-top))] z-20 flex flex-col gap-2">
        <div className="rounded-md border border-line bg-night-1/80 px-2 py-1 text-caption font-extrabold uppercase text-hi backdrop-blur-sm">
          Wall {ui ? ui.wallDist.toFixed(1) : '--'}u
        </div>
        <div className="rounded-md border border-line bg-night-1/80 px-2 py-1 text-caption font-extrabold uppercase text-hi backdrop-blur-sm">
          Light {ui ? `${ui.lightGot}/${ui.lightTotal}` : '--/--'}
        </div>
      </div>

      <div className="pointer-events-none absolute right-3 top-[calc(3.5rem+env(safe-area-inset-top))] z-20">
        <StarMeter stars={victory?.stars ?? 0} size={18} />
      </div>

      {/* ridge banner */}
      <AnimatePresence>{banner && <Banner key={banner.key} main={banner.main} sub={banner.sub} />}</AnimatePresence>

      {/* equation chip */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[calc(96px+env(safe-area-inset-bottom)+8px)] z-30 flex justify-center">
        <EquationChip text={eqText} />
      </div>

      {/* intro scrim */}
      <AnimatePresence>
        {introOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-night-0/85 px-6 text-center backdrop-blur-sm"
            onPointerDown={() => setIntroOpen(false)}
          >
            <h2
              className="font-display text-display-xl text-coral"
              style={{ textShadow: '0 0 16px rgba(255,107,74,.6)' }}
            >
              The Avalanche
            </h2>
            <p className="max-w-[280px] text-body font-semibold text-mid">
              Outrun the white wall. Three ridges. No fail screens — just soft rewinds.
            </p>
            <p className="text-caption font-extrabold uppercase text-low">Tap anywhere to start</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* toast */}
      <Toast message={toast} onDone={() => setToast(null)} />

      {/* pause sheet */}
      <BottomSheet open={pauseOpen} onClose={() => setPauseOpen(false)} ariaLabel="Paused">
        <h2 className="mb-4 text-center font-display text-h1 text-hi">PAUSED</h2>
        <div className="flex flex-col gap-2">
          <NeonButton onClick={() => setPauseOpen(false)}>Resume</NeonButton>
          <NeonButton
            variant="secondary"
            onClick={() => {
              retry()
              setPauseOpen(false)
            }}
          >
            <RotateCcw className="h-4 w-4" /> Restart
          </NeonButton>
          <NeonButton variant="secondary" onClick={() => navigate('/settings')}>
            <SettingsIcon className="h-4 w-4" /> Settings
          </NeonButton>
          <NeonButton variant="ghost" onClick={() => navigate('/map')}>
            <MapIcon className="h-4 w-4" /> Quit to map
          </NeonButton>
        </div>
      </BottomSheet>

      {/* victory: letterbox + Fragment 3 reveal */}
      <AnimatePresence>
        {victory && (
          <div key="victory" className="absolute inset-0 z-40">
            <motion.div
              initial={{ y: -60 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-x-0 top-0 h-[60px] bg-black"
            />
            <motion.div
              initial={{ y: 60 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-x-0 bottom-0 h-[60px] bg-black"
            />
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <motion.h2
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={sheetSpring}
                className="font-display text-display-xl text-coral"
                style={{ textShadow: '0 0 12px rgba(255,107,74,.7), 0 0 48px rgba(255,107,74,.3)' }}
              >
                OUTRUN
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="max-w-[320px] text-body font-semibold text-mid"
              >
                Archive Fragment 3 recovered.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, ...sheetSpring }}
                className="max-w-[340px] rounded-xl border border-amber/40 bg-night-2 p-4 shadow-panel"
              >
                <p className="text-caption font-extrabold uppercase tracking-[0.12em] text-amber">
                  Fragment 3 — The Sum Sign
                </p>
                <blockquote className="mt-2 text-body font-semibold italic text-hi">
                  “Utile erit scribi ∫ pro omn. l”
                </blockquote>
                <p className="mt-2 text-[12px] font-bold text-low">
                  (“It will be useful to write ∫ for <em>omnia l</em> — the sum of all the l's.”)
                </p>
                <p className="mt-2 text-[12px] font-bold text-low">
                  ∫ is just a long S. What is the AreaBar summing?
                </p>
                <p className="mt-1 font-mono text-mono-s font-bold text-mint">
                  Answer: the light under the hill — infinitely many thin strips.
                </p>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
