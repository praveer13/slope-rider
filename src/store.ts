import { createGameStore } from '@gridverse/kit/store'
import {
  selectPlayerLevel,
  selectXpIntoLevel,
  selectPlayerTitle,
  selectTotalStars,
  selectHasAnyProgress,
  chapterOf as kitChapterOf,
  chapterName as kitChapterName,
} from '@gridverse/kit/store'
import { ZONES } from './lib/content'

export const useGameStore = createGameStore({
  saveKey: 'slope-rider-save-v1',
  firstLevelId: '1-1',
})

export const CHAPTERS: Array<{ id: string; name: string; accent: string }> = ZONES.map(
  (z) => ({ id: String(z.id), name: z.name, accent: z.accent }),
)

export const chapterOf = kitChapterOf
export const chapterName = (levelId: string): string =>
  levelId === 'boss' ? 'The Avalanche' : kitChapterName(levelId, CHAPTERS)

export {
  selectPlayerLevel,
  selectXpIntoLevel,
  selectPlayerTitle,
  selectTotalStars,
  selectHasAnyProgress,
}
