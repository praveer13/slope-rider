import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { Map as MapIcon, Minus, Pause, Pencil, Play, Plus, RefreshCw, Settings as SettingsIcon, Zap } from 'lucide-react'
import { bindKitSettings } from '@gridverse/kit/lib'
import { IconButton, NeonButton, StarMeter, Toast, Chip, BottomSheet } from '@gridverse/kit/ui'
import type { UiState } from '@gridverse/kit/session'
import { useGameStore, chapterName } from '../store.ts'
import { LEVELS, loadMidLevel, saveMidLevel, clearMidLevel, saveResult, starsForLight, type SRLevel, type MotionRule, type ResultPayload } from '../game/levels.ts'
import { RideSession } from '../game/ride/rideSession.ts'
import type { RideExtras } from '../game/ride/rideSession.ts'
import { ruleTick } from '../game/sfx.ts'
import SlopeChip from '../components/SlopeChip.tsx'
import AreaBar from '../components/AreaBar.tsx'

bindKitSettings(() => useGameStore.getState().settings)

const pop = { type: 'spring', stiffness: 420, damping: 24 } as const

const ZONE_ACCENT: Record<number, string> = {
  1: '#3DFFA2',
  2: '#22D3EE',
  3: '#8B5CF6',
  4: '#FFB020',
  5: '#FF2E93',
  6: '#FF6B4A',
}

const ZONE_TONE = {
  1: 'mint',
  2: 'cyan',
  3: 'violet',
  4: 'amber',
  5: 'magenta',
  6: 'coral',
} as const
type Tone = (typeof ZONE_TONE)[keyof typeof ZONE_TONE]

export default function Gameplay() {
  const [params] = useSearchParams()
  const wantResume = params.get('resume') === '1'
  const storeCurrent = useGameStore((s) => s.currentLevel)
  const levelId = params.get('level') ?? storeCurrent
  const level = LEVELS[levelId]

  if (!level) {
    return <Navigate to="/map" replace />
  }

  return <GameplayBody level={level} wantResume={wantResume} />
}

function GameplayBody({ level, wantResume }: { level: SRLevel; wantResume: boolean }) {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sessionRef = useRef<RideSession | null>(null)
  const [ui, setUi] = useState<UiState<RideExtras> | null>(null)
  const [intro, setIntro] = useState(true)
  const [paused, setPaused] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [ruleOpen, setRuleOpen] = useState(false)
  const settings = useGameStore((s) => s.settings)

  const handleWin = useCallback(
    (_moves: number, _hints: number) => {
      const s = useGameStore.getState()
      const prev = s.levels[level.id]
      const firstClear = !prev?.completed
      const stars = starsForLight(true, sessionRef.current?.uiExtras().lightGot ?? 0, level.shards.length)
      const starsDelta = Math.max(0, stars - (prev?.stars ?? 0))
      const chapterComplete = !!level.finale
      let xpEarned = firstClear ? 75 : 15
      let gearsEarned = (firstClear ? 10 : 2) + starsDelta * 5
      if (chapterComplete && firstClear) {
        xpEarned += 100
        gearsEarned += 50
      }
      let cardId: string | undefined
      let cardDuplicate = false
      if (level.cardId && firstClear) {
        if (s.cards.includes(level.cardId)) {
          cardDuplicate = true
          gearsEarned += 5
        } else {
          cardId = level.cardId
        }
      }
      const xpBefore = s.xp
      s.completeLevel(level.id, stars, gearsEarned, xpEarned)
      if (cardId) s.unlockCard(cardId)
      const next = nextLevelId(level.id)
      s.setCurrentLevel(next ?? level.id)
      s.setResumeLevel(null)
      clearMidLevel()
      const payload: ResultPayload = {
        levelId: level.id,
        chapter: level.zone,
        levelName: level.name,
        stars,
        lightGot: sessionRef.current?.uiExtras().lightGot ?? 0,
        lightTotal: level.shards.length,
        xpEarned,
        gearsEarned,
        firstClear,
        cardId,
        cardDuplicate,
        chapterComplete,
        nextLevelId: next ?? null,
        xpBefore,
        xpAfter: xpBefore + xpEarned,
      }
      saveResult(payload)
      navigate('/results')
    },
    [level, navigate],
  )
  const winRef = useRef(handleWin)
  winRef.current = handleWin

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const session = new RideSession(canvas, level, {
      onUi: (u) => setUi(u as UiState<RideExtras>),
      onToast: (msg) => setToast(msg),
      onWin: () => winRef.current(0, 0),
    })
    sessionRef.current = session
    window.__pw = session
    if (wantResume) {
      const mid = loadMidLevel(level.id)
      if (mid) session.restore(mid)
    } else {
      clearMidLevel()
    }
    session.engine.start()
    session.begin()
    session.emit()
    return () => {
      if (session.state !== 'won') saveMidLevel(level.id, session.serialize())
      session.dispose()
      sessionRef.current = null
      window.__pw = undefined
    }
  }, [level.id, level, wantResume])

  useEffect(() => {
    if (ui && ui.speed > 0.1 && intro) {
      setIntro(false)
    }
  }, [ui, intro])

  const setPause = (p: boolean) => {
    setPaused(p)
    sessionRef.current?.setPaused(p)
  }

  const quitToMap = () => {
    useGameStore.getState().setResumeLevel(level.id)
    const s = sessionRef.current
    if (s) {
      s.setPaused(false)
      saveMidLevel(level.id, s.serialize())
    }
    navigate('/map')
  }

  const tone = (ZONE_TONE[level.zone as keyof typeof ZONE_TONE] ?? 'mint') as Tone
  const starPreview = starsForLight(true, ui?.lightGot ?? 0, level.shards.length)

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-night-1">
      {/* HUD */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex h-12 items-center justify-between px-3"
      >
        <IconButton ariaLabel="Back" onClick={() => navigate(-1)}>
          <MapIcon size={18} />
        </IconButton>
        <StarMeter stars={starPreview} size={28} />
        <IconButton ariaLabel="Pause" onClick={() => setPause(true)}>
          <Pause size={18} />
        </IconButton>
      </motion.div>

      {/* World */}
      <div className="relative min-h-0 flex-1">
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
        />
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 z-[5] bg-night-0/40 backdrop-blur-[4px] transition-opacity duration-200 ${paused || intro ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Slope chip */}
        <div className="absolute left-3 top-3 z-10">
          <SlopeChip
            speed={ui?.speed ?? 0}
            slope={ui?.slope ?? 0}
            zone={level.zone}
            levelId={level.id}
            mathLabels={settings.mathLabels}
          />
        </div>

        {/* Z6 rule pencil */}
        {ui?.showRuleChip && (
          <button
            type="button"
            onClick={() => {
              setRuleOpen(true)
              sessionRef.current?.setPaused(true)
            }}
            className="absolute right-3 top-3 z-10 flex h-10 items-center gap-1 rounded-lg border border-line bg-night-2/90 px-2 shadow-panel backdrop-blur-sm active:scale-[0.98]"
          >
            <Pencil size={14} className="text-mid" />
            <span className="text-caption font-extrabold uppercase text-mid">Rule</span>
          </button>
        )}

        {/* Nudge chip */}
        <AnimatePresence>
          {ui?.nudgePrompt && (
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              type="button"
              onClick={() => sessionRef.current?.nudge()}
              className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 flex items-center gap-2 rounded-full border border-line bg-night-2/95 px-4 py-2 shadow-panel active:scale-[0.98]"
            >
              <Zap size={16} className="text-amber" />
              <span className="text-body font-extrabold text-hi">Nudge</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Area bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <AreaBar area={ui?.area ?? 0} total={ui?.areaTotal ?? 1} />
        </div>
      </div>

      {/* Intro scrim */}
      <AnimatePresence>
        {intro && (
          <motion.div
            key="intro-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="scrim pointer-events-none fixed inset-0 z-40 flex items-center justify-center px-6 backdrop-blur-[8px]"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={pop}
              className="flex w-full max-w-[320px] flex-col items-center gap-3 rounded-xl border border-line bg-night-2 p-6 text-center shadow-panel"
              role="dialog"
              aria-modal="true"
              aria-label={`Level ${level.id} ${level.name}`}
            >
              <Chip tone={tone}>LV {level.id} · {chapterName(level.id)}</Chip>
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full border border-line bg-night-3"
                style={{ boxShadow: `0 0 20px ${ZONE_ACCENT[level.zone]}44` }}
              >
                <span className="text-2xl" style={{ color: ZONE_ACCENT[level.zone] }}>∿</span>
              </div>
              <h2 className="text-h2 font-black text-hi">{level.name}</h2>
              <p className="text-body font-semibold text-mid">{level.goal}</p>
              <p className="text-caption font-extrabold uppercase text-amber">{level.coach}</p>
              <p className="text-caption font-extrabold uppercase text-low">Hold top of screen to start</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pause sheet */}
      <AnimatePresence>
        {paused && !intro && (
          <motion.div
            key="pause-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="scrim fixed inset-0 z-40 flex items-center justify-center px-8 backdrop-blur-[8px]"
            onClick={() => setPause(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={pop}
              className="flex w-full max-w-[300px] flex-col gap-2 rounded-xl border border-line bg-night-2 p-5 shadow-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Paused"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-1 text-center text-h2 font-black text-hi">Paused</h2>
              <NeonButton onClick={() => setPause(false)}>
                <Play size={18} /> Resume
              </NeonButton>
              <NeonButton
                variant="secondary"
                onClick={() => {
                  sessionRef.current?.reset()
                  setPause(false)
                  setIntro(true)
                }}
              >
                <RefreshCw size={18} /> Restart
              </NeonButton>
              <NeonButton variant="ghost" onClick={() => navigate('/settings')}>
                <SettingsIcon size={18} /> Settings
              </NeonButton>
              <NeonButton variant="ghost" onClick={quitToMap}>
                <MapIcon size={18} /> Quit to map
              </NeonButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rule editor sheet */}
      {ruleOpen && (
        <RuleEditorSheet
          level={level}
          rule={ui?.rule}
          onChange={(r) => sessionRef.current?.setRule(r)}
          onClose={() => {
            setRuleOpen(false)
            sessionRef.current?.setPaused(false)
          }}
        />
      )}

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  )
}

function RuleEditorSheet({
  level,
  rule,
  onChange,
  onClose,
}: {
  level: SRLevel
  rule?: MotionRule
  onChange: (r: MotionRule) => void
  onClose: () => void
}) {
  const [local, setLocal] = useState<MotionRule>(() => ({ ...(rule ?? {}) }))
  const spec = level.ruleSpec

  const commit = (patch: MotionRule) => {
    const next = { ...local, ...patch }
    setLocal(next)
    onChange(next)
  }

  return (
    <BottomSheet open onClose={onClose} ariaLabel="Motion rule editor">
      <div className="flex flex-col gap-4 px-1 pb-4">
        <h2 className="text-h2 font-black text-hi">Motion rule</h2>
        {spec?.wind && (
          <Stepper
            label="Wind k"
            value={local.windK ?? spec.wind.solvable}
            min={spec.wind.range[0]}
            max={spec.wind.range[1]}
            step={0.1}
            onChange={(v) => commit({ windK: v })}
          />
        )}
        {spec?.spring && (
          <>
            <Stepper
              label="Spring k"
              value={local.springK ?? spec.spring.solvable}
              min={spec.spring.range[0]}
              max={spec.spring.range[1]}
              step={0.1}
              onChange={(v) => commit({ springK: v })}
            />
            <div className="flex items-center justify-between rounded-md border border-line bg-night-3 px-3 py-2">
              <span className="text-body font-semibold text-mid">Center x₀</span>
              <span className="font-mono text-mono-m font-bold text-hi">{spec.spring.x0}</span>
            </div>
          </>
        )}
        <NeonButton onClick={onClose}>Done</NeonButton>
      </div>
    </BottomSheet>
  )
}

function Stepper({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  const dec = () => {
    onChange(Math.max(min, +(value - step).toFixed(2)))
    ruleTick()
  }
  const inc = () => {
    onChange(Math.min(max, +(value + step).toFixed(2)))
    ruleTick()
  }
  return (
    <div className="flex items-center justify-between rounded-md border border-line bg-night-3 px-3 py-2">
      <span className="text-body font-semibold text-mid">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={dec}
          className="flex h-11 w-11 items-center justify-center rounded-md border border-line bg-night-2 active:scale-[0.96]"
          aria-label={`Decrease ${label}`}
        >
          <Minus size={18} />
        </button>
        <span className="min-w-[3ch] text-center font-mono text-mono-m font-bold text-hi">{value.toFixed(1)}</span>
        <button
          type="button"
          onClick={inc}
          className="flex h-11 w-11 items-center justify-center rounded-md border border-line bg-night-2 active:scale-[0.96]"
          aria-label={`Increase ${label}`}
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  )
}

function nextLevelId(id: string): string | null {
  const [z, n] = id.split('-')
  if (!z || !n) return null
  const zone = parseInt(z, 10)
  const idx = parseInt(n, 10)
  if (Number.isNaN(zone) || Number.isNaN(idx)) return null
  const same = `${zone}-${idx + 1}`
  if (LEVELS[same]) return same
  const nextZone = `${zone + 1}-1`
  if (LEVELS[nextZone]) return nextZone
  return null
}
