import type { Seg, Portal, Shard, MotionRule } from './calculus'

/**
 * SLOPE RIDER level data contracts — main-owned types.
 * ChromeBuild populates LEVELS values under design §4 constraints.
 * BOSS authored by main (integration).
 */

interface Base {
  id: string
  zone: 1 | 2 | 3 | 4 | 5 | 6
  name: string
  goal: string
  /** coach mark, ≤ 6 words (harness lints) */
  coach: string
  finale?: boolean
  cardId?: string
}

/** witness input script the harness simulates (design §4) */
export interface CanonicalLine {
  goalX: number
  /** coast windows [x0,x1]: carve released over these x-ranges */
  coast: [number, number][]
  /** hop trigger x positions */
  hops: number[]
}

/** Z6 editable rule spec: range + the solvable coefficient witness */
export interface RuleSpec {
  wind?: { range: [number, number]; solvable: number }
  spring?: { range: [number, number]; x0: number; solvable: number }
}

export interface SRLevel extends Base {
  terrain: Seg[]
  shards: Shard[]
  canonical: CanonicalLine
  portals?: Portal[]
  ruleSpec?: RuleSpec
  /** spawn x (default 0, grounded on terrain) */
  spawnX?: number
}

export const LEVELS: Record<string, SRLevel> = {}

/** the solvable rule for a level as a MotionRule (defaults = solvable witness) */
export function solvableRule(lvl: SRLevel): MotionRule | undefined {
  if (!lvl.ruleSpec) return undefined
  const r: MotionRule = {}
  if (lvl.ruleSpec.wind) r.windK = lvl.ruleSpec.wind.solvable
  if (lvl.ruleSpec.spring) {
    r.springK = lvl.ruleSpec.spring.solvable
    r.springX0 = lvl.ruleSpec.spring.x0
  }
  return r
}

/* ---------- stars (design §3: no timers, no flow gates) ---------- */
export function starsForLight(finished: boolean, got: number, total: number): number {
  if (!finished) return 0
  if (total > 0 && got >= total) return 3
  if (total === 0 || got / total >= 0.7) return 2
  return 1
}

/* ---------- boss (design §6) ---------- */
export interface BossRidge {
  name: string
  coach: string
  terrain: Seg[]
  shards: Shard[]
  canonical: CanonicalLine
  portals?: Portal[]
  rule?: MotionRule
}

export interface BossDef {
  /** wall starts this many u/s under rider speed */
  wallStartOffset: number
  /** wall speed gain per ridge */
  wallGainPerRidge: number
  /** rewind setback on catch */
  rewindSetback: number
  ridges: BossRidge[]
}

export const BOSS: BossDef = {
  wallStartOffset: 2,
  wallGainPerRidge: 0.5,
  rewindSetback: 6,
  ridges: [], // authored by main (integration)
}

/* ---------- result payload (series shape, consumed by Results.tsx) ---------- */

export interface ResultPayload {
  levelId: string
  chapter: number
  levelName: string
  stars: number
  lightGot: number
  lightTotal: number
  xpEarned: number
  gearsEarned: number
  firstClear: boolean
  cardId?: string
  cardDuplicate?: boolean
  chapterComplete?: boolean
  nextLevelId: string | null
  boss?: boolean
  tryAgain?: boolean
  coachLine?: string
  xpBefore: number
  xpAfter: number
}

const RESULT_KEY = 'slope-rider-result-v1'

export function saveResult(p: ResultPayload): void {
  try {
    sessionStorage.setItem(RESULT_KEY, JSON.stringify(p))
  } catch {
    /* private mode — results falls back gracefully */
  }
}

export function loadResult(): ResultPayload | null {
  try {
    const raw = sessionStorage.getItem(RESULT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ResultPayload
  } catch {
    return null
  }
}

/* ---------- mid-level resume ---------- */
const MID_KEY = 'slope-rider-midlevel-v1'

export function saveMidLevel(levelId: string, data: unknown): void {
  try {
    sessionStorage.setItem(MID_KEY, JSON.stringify({ levelId, data }))
  } catch {
    /* no-op */
  }
}

export function loadMidLevel(levelId: string): unknown | null {
  try {
    const raw = sessionStorage.getItem(MID_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { levelId: string; data: unknown }
    return parsed.levelId === levelId ? parsed.data : null
  } catch {
    return null
  }
}

export function clearMidLevel(): void {
  try {
    sessionStorage.removeItem(MID_KEY)
  } catch {
    /* no-op */
  }
}
