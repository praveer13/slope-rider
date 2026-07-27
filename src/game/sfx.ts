import { sfx, tone } from '@/kit'

/**
 * srSfx — SLOPE RIDER sound design on the kit tone primitive.
 * Everything not listed here is re-exported from kit unchanged.
 */

/** shard pickup — chime rises with area fraction (0..1) */
export const shardChime = (frac = 0.5): void => {
  tone({ freq: 660 + 440 * Math.min(1, Math.max(0, frac)), dur: 0.1, type: 'triangle', vol: 0.2 })
}

/** portal pass-through — two-tone */
export const portalPass = (): void => {
  tone({ freq: 520, endFreq: 780, dur: 0.1, type: 'sine', vol: 0.18 })
  tone({ freq: 780, endFreq: 1040, dur: 0.12, type: 'sine', vol: 0.14, delay: 0.08 })
}

/** landing thump — strength 0..1 by normal impact */
export const landThump = (strength = 0.5): void => {
  tone({ freq: 120 + 80 * strength, dur: 0.1 + 0.06 * strength, type: 'sine', vol: 0.12 + 0.14 * strength })
}

/** hop */
export const hop = (): void => {
  tone({ freq: 440, endFreq: 660, dur: 0.07, type: 'sine', vol: 0.14 })
}

/** apex slow-mo enter/exit */
export const slowMoIn = (): void => {
  tone({ freq: 880, endFreq: 440, dur: 0.25, type: 'sine', vol: 0.1 })
}

/** nudge chip prompt */
export const nudge = (): void => sfx.tick()

/** soft rewind (boss) — neutral wind settle, NOT an error sound */
export const rewind = (): void => {
  tone({ freq: 300, endFreq: 180, dur: 0.4, type: 'sine', vol: 0.1 })
}

/** rule stepper tick */
export const ruleTick = (): void => sfx.snap()

/** knot drag quantum tick — pitch rises with y */
export const knotTick = (frac = 0.5): void => {
  tone({ freq: 500 + 300 * Math.min(1, Math.max(0, frac)), dur: 0.04, type: 'sine', vol: 0.1 })
}

/** knot released inside budget — soft confirmation */
export const lineChime = (): void => {
  tone({ freq: 620, endFreq: 760, dur: 0.08, type: 'triangle', vol: 0.12 })
}

/** over-budget drag — low buzz, no harshness */
export const overBudgetBuzz = (): void => {
  tone({ freq: 160, dur: 0.12, type: 'square', vol: 0.06 })
}

/** ride failure freeze — soft thud, never an error sting */
export const failThud = (): void => {
  tone({ freq: 200, endFreq: 110, dur: 0.3, type: 'sine', vol: 0.12 })
}

// kit carryover, single import surface
export const { tick, pluck, squeak, win, error, snap, whoosh } = sfx
