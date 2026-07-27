import type { GameState, ChapterConfig } from './types.js'

/** Player titles per design.md content inventory */
export const DEFAULT_PLAYER_TITLES: Array<[number, string]> = [
  [30, 'Riftwalker'],
  [25, 'Eigen Hunter'],
  [20, 'Chainwright'],
  [15, 'Machinist'],
  [10, 'Sailor'],
  [5, 'Drifter'],
  [1, 'Spark'],
]

/** 100 XP per player level (flat arcade curve) */
export const selectPlayerLevel = (xp: number): number => Math.floor(xp / 100) + 1
export const selectXpIntoLevel = (xp: number): number => xp % 100

export const selectPlayerTitle = (
  level: number,
  titles: Array<[number, string]> = DEFAULT_PLAYER_TITLES,
): string => {
  for (const [min, title] of titles) if (level >= min) return title
  return 'Spark'
}

export const selectTotalStars = (s: Pick<GameState, 'levels'>): number =>
  Object.values(s.levels).reduce((n, l) => n + l.stars, 0)

export const selectHasAnyProgress = (s: Pick<GameState, 'levels'>): boolean =>
  Object.values(s.levels).some((l) => l.completed)

/** Chapter id ("1".."6") of a level id ("3-4" -> "3") */
export const chapterOf = (levelId: string): string => levelId.split('-')[0] ?? ''

export const chapterName = (
  levelId: string,
  chapters: ChapterConfig[] = [],
): string =>
  chapters.find((c) => c.id === chapterOf(levelId))?.name ?? 'Vector Valley'
