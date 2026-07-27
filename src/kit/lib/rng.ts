/**
 * Deterministic mulberry32 RNG.
 * Reproducible across runs/platforms for seeded level generation, daily seeds, etc.
 */

function hashSeed(seed: string | number): number {
  if (typeof seed === 'number') {
    return seed === 0 ? 0x811c_9dc5 : seed | 0
  }
  // FNV-1a 32-bit
  let h = 0x811c_9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x0100_0193)
  }
  return h
}

function mulberry32(state: number) {
  return function next() {
    let t = (state += 0x6d2b_79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
  }
}

export interface Rng {
  next(): number
  int(lo: number, hi: number): number
  range(lo: number, hi: number): number
  pick<T>(arr: readonly T[]): T
  shuffle<T>(arr: readonly T[]): T[]
  gaussian(mean?: number, sd?: number): number
  fork(salt: number | string): Rng
}

export function createRng(seed: number | string): Rng {
  let state = hashSeed(seed)
  const next = mulberry32(state)

  let spare: number | null = null

  return {
    next,

    int(lo: number, hi: number): number {
      const min = Math.min(lo, hi)
      const max = Math.max(lo, hi)
      return Math.floor(next() * (max - min + 1)) + min
    },

    range(lo: number, hi: number): number {
      const min = Math.min(lo, hi)
      const max = Math.max(lo, hi)
      return next() * (max - min) + min
    },

    pick<T>(arr: readonly T[]): T {
      if (arr.length === 0) {
        throw new Error('pick() called on empty array')
      }
      return arr[Math.floor(next() * arr.length)]!
    },

    shuffle<T>(arr: readonly T[]): T[] {
      const out = arr.slice()
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        const tmp = out[i]!
        out[i] = out[j]!
        out[j] = tmp
      }
      return out
    },

    gaussian(mean = 0, sd = 1): number {
      if (spare !== null) {
        const z = spare
        spare = null
        return mean + z * sd
      }
      let u = 0
      let v = 0
      do {
        u = next() * 2 - 1
        v = next() * 2 - 1
      } while (u * u + v * v >= 1 || u === 0)
      const s = u * u + v * v
      const r = Math.sqrt((-2 * Math.log(s)) / s)
      spare = v * r
      return mean + u * r * sd
    },

    fork(salt: number | string): Rng {
      return createRng(state ^ hashSeed(salt))
    },
  }
}
