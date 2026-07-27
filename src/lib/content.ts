/**
 * SLOPE RIDER content catalog — mirrors phase-world/vecto shape.
 * Pure data + tiny helpers; no React, no store.
 */
import { LEVELS } from '@/game/levels'

export interface ZoneMeta {
  id: number
  name: string
  accent: string
  tagline: string
  glyph: 'carve' | 'steep' | 'apex' | 'area' | 'portal' | 'wind-spring'
  gateLabel: string | null
}

export const ZONES: ZoneMeta[] = [
  {
    id: 1,
    name: 'First Descent',
    accent: '#3DFFA2',
    tagline: 'Draw the drop; hills push you.',
    glyph: 'carve',
    gateLabel: null,
  },
  {
    id: 2,
    name: 'Steep Reading',
    accent: '#22D3EE',
    tagline: 'Steep lines are fast but thirsty.',
    glyph: 'steep',
    gateLabel: 'Clear First Descent to open',
  },
  {
    id: 3,
    name: 'Apex Ridge',
    accent: '#8B5CF6',
    tagline: 'Draw crests to launch; bowls to sling.',
    glyph: 'apex',
    gateLabel: 'Clear Steep Reading to open',
  },
  {
    id: 4,
    name: 'Lightfields',
    accent: '#FFB020',
    tagline: 'Light piles up under your line.',
    glyph: 'area',
    gateLabel: 'Clear Apex Ridge to open',
  },
  {
    id: 5,
    name: 'Portal Peaks',
    accent: '#FF2E93',
    tagline: 'Doors trade height-pile for speed, exactly.',
    glyph: 'portal',
    gateLabel: 'Clear Lightfields to open',
  },
  {
    id: 6,
    name: 'Wind & Spring',
    accent: '#FF6B4A',
    tagline: 'Write the rule, then draw around it.',
    glyph: 'wind-spring',
    gateLabel: 'Clear Portal Peaks to open',
  },
]

export interface LevelMeta {
  id: string
  chapter: number
  index: number
  name: string
  goal: string
  finale?: boolean
}

/**
 * LEVEL METADATA IS DERIVED FROM src/game/levels.ts — the game data is the
 * single source of truth for names/goals (v3: the two copies diverged once;
 * never again). Do not reintroduce a literal list here.
 */
export const ZONE_LEVELS: LevelMeta[][] = [1, 2, 3, 4, 5, 6].map((chapter) =>
  Object.values(LEVELS)
    .filter((l) => l.zone === chapter)
    .sort((a, b) => Number(a.id.split('-')[1]) - Number(b.id.split('-')[1]))
    .map((l) => ({
      id: l.id,
      chapter,
      index: Number(l.id.split('-')[1]),
      name: l.name,
      goal: l.goal,
      finale: l.finale || undefined,
    })),
)

export const ALL_LEVELS: LevelMeta[] = ZONE_LEVELS.flat()

export const levelById = (id: string): LevelMeta | undefined =>
  ALL_LEVELS.find((l) => l.id === id)

export const finaleIdOf = (chapter: number): string => `${chapter}-9`

export interface LevelStateLike {
  stars: number
  completed: boolean
}

type LevelsLike = Record<string, LevelStateLike | undefined>

const isNodeCleared = (id: string, levels: LevelsLike): boolean =>
  !!levels[id]?.completed || (id === 'boss' && !!levels['boss']?.completed)

export const isZoneOpen = (chapter: number, levels: LevelsLike): boolean =>
  chapter <= 1 || isNodeCleared(finaleIdOf(chapter - 1), levels)

export const isLevelUnlocked = (id: string, levels: LevelsLike): boolean => {
  if (id === 'boss') {
    return [1, 2, 3, 4, 5, 6].every((c) => isNodeCleared(finaleIdOf(c), levels))
  }
  const meta = levelById(id)
  if (!meta) return false
  if (!isZoneOpen(meta.chapter, levels)) return false
  if (meta.finale) {
    for (let i = 1; i <= 8; i++) {
      if (!isNodeCleared(`${meta.chapter}-${i}`, levels)) return false
    }
    return true
  }
  if (meta.index <= 1) return true
  return isNodeCleared(`${meta.chapter}-${meta.index - 1}`, levels)
}

export const currentNodeId = (levels: LevelsLike): string => {
  for (const l of ALL_LEVELS) {
    if (isLevelUnlocked(l.id, levels) && !levels[l.id]?.completed) return l.id
  }
  if (isLevelUnlocked('boss', levels) && !levels['boss']?.completed) return 'boss'
  return ALL_LEVELS[ALL_LEVELS.length - 1]?.id ?? '1-1'
}

export const nextLevelId = (id: string, levels: LevelsLike): string | undefined => {
  if (id === 'boss') return undefined
  const idx = ALL_LEVELS.findIndex((l) => l.id === id)
  if (idx < 0) return undefined
  for (let i = idx + 1; i < ALL_LEVELS.length; i++) {
    const l = ALL_LEVELS[i]!
    if (isLevelUnlocked(l.id, levels)) return l.id
  }
  if (isLevelUnlocked('boss', levels)) return 'boss'
  return undefined
}

export const zoneStars = (chapter: number, levels: LevelsLike): number =>
  ZONE_LEVELS[chapter - 1]?.reduce((n, l) => n + (levels[l.id]?.stars ?? 0), 0) ?? 0

export const TOTAL_STARS = 54 * 3

export const countCleared = (levels: LevelsLike): number =>
  ALL_LEVELS.filter((l) => levels[l.id]?.completed).length

export const countStars = (levels: LevelsLike): number =>
  ALL_LEVELS.reduce((n, l) => n + (levels[l.id]?.stars ?? 0), 0)
