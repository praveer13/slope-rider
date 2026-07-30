import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { haptics } from '@/kit/lib'

/**
 * First-run ghost coach (canon: ghost-hand hint, never forced, ≤ 6 words).
 * A glowing pointer walks the three steps of a fight once ever
 * (localStorage flag). Tap anywhere to skip.
 */

export interface CoachStep {
  /** caption ≤ 6 words */
  text: string
  /** target: css selector to point at (first match) */
  selector: string
}

const FLAG_KEY = 'slope-rider-coached-v1'

export function coachSeen(): boolean {
  try {
    return localStorage.getItem(FLAG_KEY) === '1'
  } catch {
    return true
  }
}

export function markCoachSeen(): void {
  try {
    localStorage.setItem(FLAG_KEY, '1')
  } catch {
    /* no-op */
  }
}

export default function OnboardCoach({ steps, onDone }: { steps: CoachStep[]; onDone: () => void }) {
  const [idx, setIdx] = useState(0)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (idx >= steps.length) return // past the end: onDone fires in the sibling effect
    const place = () => {
      const el = document.querySelector(steps[idx]!.selector)
      const r = el?.getBoundingClientRect()
      setPos(r ? { x: r.x + r.width / 2, y: r.y + r.height / 2 } : null)
    }
    place()
    const t = setTimeout(place, 350)
    return () => clearTimeout(t)
  }, [idx, steps])

  useEffect(() => {
    if (idx >= steps.length) {
      onDone()
      return
    }
    const t = setTimeout(() => setIdx((i) => i + 1), 2200)
    return () => clearTimeout(t)
  }, [idx, steps.length, onDone])

  const skip = () => {
    haptics.tick()
    markCoachSeen()
    onDone()
  }

  const step = steps[Math.min(idx, steps.length - 1)]!

  return (
    <AnimatePresence>
      {idx < steps.length && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60]"
          onClick={skip}
          role="button"
          aria-label="Skip tips"
        >
          <div className="absolute inset-0 bg-night-0/55" />
          {pos && (
            <motion.div
              key={idx}
              initial={{ x: pos.x - 40, y: pos.y - 60, opacity: 0, scale: 0.7 }}
              animate={{ x: pos.x - 12, y: pos.y - 28, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="absolute z-10"
              style={{ left: 0, top: 0 }}
            >
              <div className="h-7 w-7 rounded-full border-2 border-gold bg-gold/40 shadow-[0_0_18px_rgba(255,209,102,0.7)]" />
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 0.9 }}
                className="absolute -bottom-2 left-1/2 h-3 w-1.5 -translate-x-1/2 rounded-full bg-gold"
              />
            </motion.div>
          )}
          {pos && (
            <motion.div
              key={`cap-${idx}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute left-1/2 z-10 -translate-x-1/2 rounded-xl border border-line bg-night-2 px-4 py-2 shadow-panel"
              style={{ top: Math.max(72, pos.y - 108) }}
            >
              <p className="whitespace-nowrap text-center text-body font-extrabold text-hi">{step.text}</p>
              <p className="mt-0.5 text-center text-caption text-low">tap to skip</p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
