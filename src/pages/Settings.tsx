import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  Music,
  Volume2,
  VolumeX,
  Vibrate,
  Sparkles,
  Eye,
  Grid3x3,
  Trash2,
  Minus,
  Plus,
  Hand,
  Gamepad2,
} from 'lucide-react'
import { IconButton, NeonButton, Toast } from '@gridverse/kit/ui'
import { useGameStore } from '../store.ts'
import { haptics, sfx, cn } from '@gridverse/kit/lib'
import type { KitSettings } from '@gridverse/kit/lib'

/**
 * Settings — SLOPE RIDER copy. Route `/settings`.
 * Calm panel: audio / feel / display & access / about / data.
 */

const outExpo = [0.16, 1, 0.3, 1] as [number, number, number, number]

function useSettingsWriter() {
  const updateSettings = useGameStore((s) => s.updateSettings)
  const timer = useRef<number | undefined>(undefined)
  const pending = useRef<Partial<KitSettings>>({})
  useEffect(() => {
    return () => {
      clearTimeout(timer.current)
      useGameStore.getState().updateSettings(pending.current)
    }
  }, [])
  return useCallback(
    (patch: Partial<KitSettings>, debounce = false) => {
      if (!debounce) {
        updateSettings(patch)
        return
      }
      pending.current = { ...pending.current, ...patch }
      clearTimeout(timer.current)
      timer.current = window.setTimeout(() => {
        useGameStore.getState().updateSettings(pending.current)
        pending.current = {}
        timer.current = undefined
      }, 150)
    },
    [updateSettings],
  )
}

let musicCtx: AudioContext | null = null
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}

function previewMusicLoop() {
  const { musicOn, musicVolume, masterVolume } = useGameStore.getState().settings
  const v = musicOn ? musicVolume * masterVolume : 0
  if (typeof window === 'undefined' || v <= 0) return
  const AC = window.AudioContext ?? window.webkitAudioContext
  if (!AC) return
  if (!musicCtx) musicCtx = new AC()
  const ac = musicCtx
  if (ac.state === 'suspended') void ac.resume()
  const t0 = ac.currentTime + 0.02
  const master = ac.createGain()
  master.gain.setValueAtTime(0, t0)
  master.gain.linearRampToValueAtTime(0.22 * v, t0 + 0.15)
  master.gain.setValueAtTime(0.22 * v, t0 + 1.7)
  master.gain.linearRampToValueAtTime(0, t0 + 2)
  master.connect(ac.destination)
  const note = (freq: number, at: number, dur: number, type: OscillatorType, vol: number) => {
    const o = ac.createOscillator()
    const g = ac.createGain()
    o.type = type
    o.frequency.value = freq
    g.gain.setValueAtTime(0, t0 + at)
    g.gain.linearRampToValueAtTime(vol, t0 + at + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur)
    o.connect(g).connect(master)
    o.start(t0 + at)
    o.stop(t0 + at + dur + 0.05)
  }
  for (let i = 0; i < 4; i++) note(110, i * 0.5, 0.12, 'triangle', 0.5)
  ;[261.63, 329.63, 392.0, 523.25, 392.0, 329.63].forEach((f, i) => note(f, 0.12 + i * 0.3, 0.18, 'triangle', 0.25))
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const sectionItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: outExpo } },
}

function Section({
  title,
  children,
  danger = false,
  pulse = false,
}: {
  title: string
  children: ReactNode
  danger?: boolean
  pulse?: boolean
}) {
  return (
    <motion.section
      variants={sectionItem}
      className={cn(
        'rounded-lg border bg-night-2',
        danger ? 'border-danger/40' : 'border-line',
        pulse && 'shadow-glow-danger',
      )}
    >
      <h2 className="px-4 pt-3 text-caption font-extrabold uppercase text-low">{title}</h2>
      <div className="mt-1 flex flex-col divide-y divide-line/60">{children}</div>
    </motion.section>
  )
}

function Row({
  icon: Icon,
  label,
  sub,
  right,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  sub?: string
  right?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="px-4 py-2">
      <div className="flex min-h-[56px] items-center gap-3">
        <Icon className="h-5 w-5 shrink-0 text-mid" />
        <div className="min-w-0 flex-1">
          <div className="text-title font-extrabold text-hi">{label}</div>
          {sub && <div className="text-[12px] font-bold leading-snug text-low">{sub}</div>}
        </div>
        {right}
      </div>
      {children}
    </div>
  )
}

function NeonSwitch({
  checked,
  onChange,
  ariaLabel,
  danger = false,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  ariaLabel: string
  danger?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => {
        haptics.tick()
        onChange(!checked)
      }}
      className={cn(
        'relative h-6 w-11 rounded-full border transition-colors',
        checked ? (danger ? 'border-danger bg-danger' : 'border-mint bg-mint') : 'border-line bg-night-3',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-hi transition-all',
          checked ? 'left-[22px]' : 'left-0.5',
        )}
      />
    </button>
  )
}

function NeonSlider({
  value,
  onChange,
  onCommit,
  ariaLabel,
  accent = 'mint',
}: {
  value: number
  onChange: (v: number) => void
  onCommit?: (v: number) => void
  ariaLabel: string
  accent?: 'mint' | 'cyan' | 'amber'
}) {
  const bucket = useRef(Math.round(value / 10))
  const range =
    accent === 'mint'
      ? 'accent-mint'
      : accent === 'cyan'
        ? 'accent-cyan'
        : 'accent-amber'
  const step = (d: number) => {
    const v = Math.min(100, Math.max(0, Math.round(value + d)))
    haptics.tick()
    sfx.tick()
    onChange(v)
    onCommit?.(v)
  }
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={`${ariaLabel} down`}
        onClick={() => step(-5)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-night-1 text-mid active:scale-90"
      >
        <Minus className="h-4 w-4" />
      </button>
      <div className="flex min-h-[44px] flex-1 items-center">
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          aria-label={ariaLabel}
          onChange={(e) => {
            const v = Number(e.target.value)
            const b = Math.round(v / 10)
            if (b !== bucket.current) {
              bucket.current = b
              haptics.tick()
            }
            onChange(v)
          }}
          onMouseUp={() => onCommit?.(value)}
          onPointerUp={() => onCommit?.(value)}
          className={cn(
            'h-2 w-full cursor-pointer appearance-none rounded-full bg-night-3',
            '[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-line [&::-webkit-slider-thumb]:bg-night-2 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:active:scale-125',
            range,
          )}
        />
      </div>
      <button
        type="button"
        aria-label={`${ariaLabel} up`}
        onClick={() => step(5)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-night-1 text-mid active:scale-90"
      >
        <Plus className="h-4 w-4" />
      </button>
      <span className="w-9 shrink-0 text-right font-mono text-mono-s font-bold text-mid">{value}</span>
    </div>
  )
}

function SliderWell({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: outExpo }}
          className="overflow-hidden"
        >
          <div className="pb-3 pl-8 pr-1 pt-1">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function SelectRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { id: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <label className="flex min-h-[56px] items-center justify-between px-4 py-3">
      <span className="text-title font-extrabold text-hi">{label}</span>
      <select
        value={value}
        onChange={(e) => {
          haptics.tick()
          sfx.tick()
          const next = options.find((o) => o.id === e.target.value)?.id
          if (next) onChange(next)
        }}
        className="rounded-md border border-line bg-night-3 px-2 py-1 text-body text-hi"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function ImplodeBurst() {
  const dots = useRef(
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 320,
      y: (Math.random() - 0.5) * 480,
      color: ['#FFB020', '#22D3EE', '#3DFFA2', '#FF2E93', '#FFD166'][i % 5],
    })),
  )
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center" aria-hidden>
      {dots.current.map((d) => (
        <motion.span
          key={d.id}
          initial={{ x: d.x, y: d.y, opacity: 1, scale: 1 }}
          animate={{ x: 0, y: 0, opacity: 0, scale: 0.2 }}
          transition={{ duration: 0.4, ease: 'easeIn' }}
          className="absolute h-2 w-2 rounded-full"
          style={{ backgroundColor: d.color }}
        />
      ))}
    </div>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const settings = useGameStore((s) => s.settings)
  const write = useSettingsWriter()

  const muted = settings.masterVolume === 0
  const prevMaster = useRef(settings.masterVolume > 0 ? settings.masterVolume : 0.8)

  const [carveInput, setCarveInput] = useState<'hold' | 'toggle'>(() => {
    try {
      const v = localStorage.getItem('sr-carve-input')
      return v === 'toggle' ? 'toggle' : 'hold'
    } catch {
      return 'hold'
    }
  })

  const [resetOpen, setResetOpen] = useState(false)
  const [armed, setArmed] = useState(false)
  const [holding, setHolding] = useState(false)
  const [wiping, setWiping] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const setMuted = (m: boolean) => {
    if (m) {
      if (settings.masterVolume > 0) prevMaster.current = settings.masterVolume
      write({ masterVolume: 0 })
      sfx.error()
    } else {
      write({ masterVolume: prevMaster.current > 0 ? prevMaster.current : 0.8 })
      sfx.tick()
    }
  }

  const setCarveInputValue = (v: 'hold' | 'toggle') => {
    setCarveInput(v)
    try {
      localStorage.setItem('sr-carve-input', v)
    } catch {
      /* no-op */
    }
    haptics.tick()
    sfx.tick()
  }

  const doWipe = () => {
    setHolding(false)
    setArmed(false)
    setResetOpen(false)
    setWiping(true)
    haptics.phaseBreak()
    useGameStore.getState().resetAll()
    setTimeout(() => {
      setToast('Fresh slope. Good luck, Spark.')
      setTimeout(() => navigate('/'), 500)
    }, 400)
  }

  return (
    <div className="flex flex-1 flex-col">
      <header
        className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-line/60 bg-night-1/90 px-4 backdrop-blur-[12px]"
        style={{ marginTop: 'env(safe-area-inset-top)' }}
      >
        <IconButton ariaLabel="Back" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </IconButton>
        <h1 className="font-display text-h1 text-hi">SETTINGS</h1>
        <span className="w-11" aria-hidden />
      </header>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-6 px-4 pb-12 pt-4"
      >
        {/* Audio */}
        <Section title="Audio">
          <Row
            icon={Music}
            label="Music"
            sub="Adaptive zone tunes"
            right={
              <NeonSwitch
                checked={settings.musicOn}
                ariaLabel="Music on or off"
                onChange={(v) => {
                  write({ musicOn: v })
                  if (v) previewMusicLoop()
                  else sfx.tick()
                }}
              />
            }
          >
            <SliderWell open={settings.musicOn && !muted}>
              <div className={cn(muted && 'pointer-events-none opacity-40')}>
                <NeonSlider
                  value={Math.round(settings.musicVolume * 100)}
                  ariaLabel="Music volume"
                  accent="cyan"
                  onChange={(v) => write({ musicVolume: v / 100 }, true)}
                  onCommit={() => previewMusicLoop()}
                />
              </div>
            </SliderWell>
          </Row>

          <Row
            icon={Volume2}
            label="Sound FX"
            sub="Carve, land, chime"
            right={
              <NeonSwitch
                checked={settings.sfxOn}
                ariaLabel="Sound effects on or off"
                onChange={(v) => {
                  write({ sfxOn: v })
                  if (v) sfx.pluck(0.7)
                }}
              />
            }
          >
            <SliderWell open={settings.sfxOn && !muted}>
              <div className={cn(muted && 'pointer-events-none opacity-40')}>
                <NeonSlider
                  value={Math.round(settings.sfxVolume * 100)}
                  ariaLabel="Sound effects volume"
                  accent="mint"
                  onChange={(v) => write({ sfxVolume: v / 100 }, true)}
                  onCommit={(v) => sfx.pluck(v / 100)}
                />
              </div>
            </SliderWell>
          </Row>

          <Row
            icon={VolumeX}
            label="Mute all"
            sub="Silence everything, fast"
            right={<NeonSwitch checked={muted} danger ariaLabel="Mute all audio" onChange={setMuted} />}
          />
        </Section>

        {/* Feel */}
        <Section title="Feel">
          <Row
            icon={Vibrate}
            label="Haptics"
            sub="Little buzzes on snaps & wins."
            right={
              <NeonSwitch
                checked={settings.hapticsOn}
                ariaLabel="Haptics on or off"
                onChange={(v) => {
                  write({ hapticsOn: v })
                  if (v) setTimeout(() => haptics.star(), 60)
                  sfx.tick()
                }}
              />
            }
          />
          <Row
            icon={Sparkles}
            label="Reduce Motion"
            sub="Calms particles, pulses & warps."
            right={
              <NeonSwitch
                checked={settings.reduceMotion}
                ariaLabel="Reduce motion on or off"
                onChange={(v) => write({ reduceMotion: v })}
              />
            }
          />
          <Row icon={Grid3x3} label="Grid Intensity" sub="How loud the grid glows.">
            <div className="pb-2 pl-8 pt-1">
              <NeonSlider
                value={Math.round(settings.gridIntensity * 100)}
                ariaLabel="Grid intensity"
                accent="amber"
                onChange={(v) => write({ gridIntensity: v / 100 }, true)}
              />
            </div>
          </Row>
        </Section>

        {/* Display & Access */}
        <Section title="Display & Access">
          <SelectRow
            label="Colorblind Mode"
            value={settings.colorblind}
            options={[
              { id: 'off', label: 'Default' },
              { id: 'protan', label: 'Protan' },
              { id: 'deutan', label: 'Deutan' },
              { id: 'tritan', label: 'Tritan' },
            ]}
            onChange={(v) => write({ colorblind: v })}
          />
          <Row
            icon={Eye}
            label="Math Labels"
            sub="Show the live equation chip in levels."
            right={
              <NeonSwitch
                checked={settings.mathLabels}
                ariaLabel="Math labels on or off"
                onChange={(v) => write({ mathLabels: v })}
              />
            }
          />
          <Row
            icon={Hand}
            label="Ghost Hints"
            sub="The ghost-rider replay."
            right={
              <NeonSwitch
                checked={settings.ghostHints}
                ariaLabel="Ghost hints on or off"
                onChange={(v) => write({ ghostHints: v })}
              />
            }
          />
          <SelectRow
            label="Snap Strength"
            value={settings.snapStrength}
            options={[
              { id: 'gentle', label: 'Gentle' },
              { id: 'normal', label: 'Normal' },
              { id: 'sticky', label: 'Sticky' },
            ]}
            onChange={(v) => write({ snapStrength: v })}
          />
          <SelectRow
            label="Carve Input"
            value={carveInput}
            options={[
              { id: 'hold', label: 'Hold' },
              { id: 'toggle', label: 'Tap to toggle' },
            ]}
            onChange={(v) => setCarveInputValue(v)}
          />
        </Section>

        {/* About */}
        <motion.div variants={sectionItem} className="flex flex-col items-center gap-1.5 py-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-night-2 shadow-glow-coral">
            <Gamepad2 className="h-8 w-8 text-coral" />
          </div>
          <p className="font-mono text-mono-s text-low">SLOPE RIDER v0.1.0</p>
          <p className="text-caption font-extrabold uppercase text-low">Ride the derivative.</p>
          <p className="text-body font-semibold text-mid">Made for math lovers who’d rather play.</p>
        </motion.div>

        {/* Data */}
        <Section title="Data" danger>
          <div className="px-4 py-4">
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                haptics.error()
                sfx.error()
                setArmed(false)
                setResetOpen(true)
              }}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-pill border-[1.5px] border-danger text-title font-extrabold text-danger transition-shadow active:shadow-glow-danger"
            >
              <Trash2 className="h-5 w-5" />
              Reset all progress
            </motion.button>
            <p className="mt-2 text-center text-[12px] font-bold text-low">
              Wipes levels, stars, gears, cards & settings. Forever.
            </p>
          </div>
        </Section>
      </motion.div>

      {/* reset confirm */}
      <AnimatePresence>
        {resetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="scrim fixed inset-0 z-40"
              onClick={() => {
                setResetOpen(false)
                setArmed(false)
                setHolding(false)
              }}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Confirm reset"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 24 }}
              className="fixed left-1/2 top-1/2 z-40 w-[86%] max-w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-line bg-night-2 p-5 shadow-panel"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <h2 className="font-display text-display-l text-hi">SURE?</h2>
                <p className="text-body font-semibold text-mid">The mountain will forget you were here.</p>
                <div className="mt-2 flex w-full flex-col gap-2">
                  <NeonButton
                    onClick={() => {
                      setResetOpen(false)
                      setArmed(false)
                      setHolding(false)
                    }}
                  >
                    Keep my stuff
                  </NeonButton>
                  {!armed ? (
                    <button
                      type="button"
                      onClick={() => {
                        haptics.error()
                        setArmed(true)
                      }}
                      className="flex h-14 items-center justify-center rounded-pill bg-danger text-title font-extrabold text-night-0"
                    >
                      Yes, wipe it
                    </button>
                  ) : (
                    <button
                      type="button"
                      aria-label="Hold for one second to wipe all progress"
                      onPointerDown={() => setHolding(true)}
                      onPointerUp={() => setHolding(false)}
                      onPointerLeave={() => setHolding(false)}
                      className="relative flex h-14 items-center justify-center overflow-hidden rounded-pill border-[1.5px] border-danger text-title font-extrabold text-danger"
                    >
                      <motion.span
                        className="absolute inset-y-0 left-0 bg-danger/50"
                        initial={false}
                        animate={{ width: holding ? '100%' : '0%' }}
                        transition={{ duration: holding ? 1 : 0.15, ease: 'linear' }}
                        onAnimationComplete={() => holding && doWipe()}
                      />
                      <span className="relative">HOLD TO WIPE</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {wiping && <ImplodeBurst />}
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  )
}
