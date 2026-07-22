/**
 * SLOPE RIDER content catalog — mirrors phase-world/vecto shape.
 * Pure data + tiny helpers; no React, no store.
 */

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
    tagline: 'Hills push you; steep down = go.',
    glyph: 'carve',
    gateLabel: null,
  },
  {
    id: 2,
    name: 'Steep Reading',
    accent: '#22D3EE',
    tagline: 'The hill\'s number steers your speed.',
    glyph: 'steep',
    gateLabel: 'Clear First Descent to open',
  },
  {
    id: 3,
    name: 'Apex Ridge',
    accent: '#8B5CF6',
    tagline: 'Tops and bottoms are special places.',
    glyph: 'apex',
    gateLabel: 'Clear Steep Reading to open',
  },
  {
    id: 4,
    name: 'Lightfields',
    accent: '#FFB020',
    tagline: 'Light piles up under the hill.',
    glyph: 'area',
    gateLabel: 'Clear Apex Ridge to open',
  },
  {
    id: 5,
    name: 'Portal Peaks',
    accent: '#FF2E93',
    tagline: 'Doors trade height for speed, exactly.',
    glyph: 'portal',
    gateLabel: 'Clear Lightfields to open',
  },
  {
    id: 6,
    name: 'Wind & Spring',
    accent: '#FF6B4A',
    tagline: 'Motion follows rules you write.',
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

const L = (
  chapter: number,
  index: number,
  name: string,
  goal: string,
  opts?: { finale?: boolean },
): LevelMeta => ({
  id: opts?.finale ? `${chapter}-9` : `${chapter}-${index}`,
  chapter,
  index,
  name,
  goal,
  finale: opts?.finale,
})

export const ZONE_LEVELS: LevelMeta[][] = [
  // Zone 1 — First Descent
  [
    L(1, 1, 'First Push', 'Ride the slope to the gate.'),
    L(1, 2, 'Let Go', 'Release over the gap.'),
    L(1, 3, 'Uphill Cost', 'Carry speed through the uphill.'),
    L(1, 4, 'Little Hop', 'Hop to the flying light.'),
    L(1, 5, 'Two Hills', 'Read both hills.'),
    L(1, 6, 'Flat Means Flat', 'Use the flat run.'),
    L(1, 7, 'Long Flight', 'Launch far from the steep.'),
    L(1, 8, 'First Gauntlet', 'Chain carve and coast.'),
    L(1, 9, 'The Big Hill', 'Climb the big hill.', { finale: true }),
  ],
  // Zone 2 — Steep Reading
  [
    L(2, 1, 'The Number', 'Watch the slope number grow.'),
    L(2, 2, 'Sign Language', 'Follow the sign changes.'),
    L(2, 3, 'Gentle vs Wild', 'Compare gentle and wild.'),
    L(2, 4, 'Speed Limit', 'Feel the speed limit.'),
    L(2, 5, 'The SlopeChip', 'Track the slope chip.'),
    L(2, 6, 'Switchbacks', 'Flip signs, keep flow.'),
    L(2, 7, 'Curvy Steep', 'Steep on curves.'),
    L(2, 8, 'Reading Gauntlet', 'Read the gauntlet.'),
    L(2, 9, 'Steepest Descent', 'Take the steepest descent.', { finale: true }),
  ],
  // Zone 3 — Apex Ridge
  [
    L(3, 1, 'The Flat Top', 'Launch from the flat top.'),
    L(3, 2, 'Valley Floor', 'Slingshot from the bottom.'),
    L(3, 3, 'Top Then Drop', 'Crest, then fly.'),
    L(3, 4, 'Double Dip', 'Ride both dips.'),
    L(3, 5, 'Apex Slow-Mo', 'Float at the apex.'),
    L(3, 6, 'Land the Downside', 'Land on the downside.'),
    L(3, 7, 'Uphill Landing', 'Soften the uphill landing.'),
    L(3, 8, 'Ridge Gauntlet', 'Top, drop, roll.'),
    L(3, 9, 'The Great Apex', 'One perfect crest.', { finale: true }),
  ],
  // Zone 4 — Lightfields
  [
    L(4, 1, 'Gather Light', 'Gather the light.'),
    L(4, 2, 'Tall Hill, Big Bar', 'Fill the tall bar.'),
    L(4, 3, 'Fill as You Go', 'Collect as you ride.'),
    L(4, 4, 'Air Light', 'Grab light in the air.'),
    L(4, 5, 'The Wide Valley', 'Fill the wide valley.'),
    L(4, 6, "Don't Leave Any", 'Leave no shard behind.'),
    L(4, 7, 'Light Ladder', 'Climb the light ladder.'),
    L(4, 8, 'Field Gauntlet', 'Fill the whole field.'),
    L(4, 9, 'The Motherlode', 'Mine the motherlode.', { finale: true }),
  ],
  // Zone 5 — Portal Peaks
  [
    L(5, 1, 'The Blue Door', 'Pass through the blue door.'),
    L(5, 2, 'Up Door, Out Slow', 'Climb up, exit slow.'),
    L(5, 3, 'Down Door Dash', 'Drop down, dash out.'),
    L(5, 4, 'Two Doors', 'Chain two doors.'),
    L(5, 5, 'Bank the Hill', 'Bank height into speed.'),
    L(5, 6, 'Exact Trade', 'Make the exact trade.'),
    L(5, 7, 'Door Ladder', 'Climb the door ladder.'),
    L(5, 8, 'Portal Gauntlet', 'Read before the portal.'),
    L(5, 9, 'The Two-Way Door', 'Master the two-way trade.', { finale: true }),
  ],
  // Zone 6 — Wind & Spring
  [
    L(6, 1, 'The Wind Rule', 'Write the wind rule.'),
    L(6, 2, 'Stronger Wind', 'Push harder with k.'),
    L(6, 3, 'Wind Gap', 'Let wind carry the gap.'),
    L(6, 4, 'The Spring Rule', 'Feel the spring pull.'),
    L(6, 5, 'Soft vs Hard Spring', 'Tune spring stiffness.'),
    L(6, 6, 'Spring Launch', 'Sling from the spring.'),
    L(6, 7, 'Wind + Spring', 'Balance wind and spring.'),
    L(6, 8, 'Rule Gauntlet', 'Tune to the rule.'),
    L(6, 9, 'The Perfect Rule', 'Write the perfect rule.', { finale: true }),
  ],
]

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
