import { createGameStore } from '@gridverse/kit/store'
import {
  selectPlayerLevel,
  selectXpIntoLevel,
  selectPlayerTitle,
  selectTotalStars,
  selectHasAnyProgress,
  chapterOf,
  chapterName,
} from '@gridverse/kit/store'

export const useGameStore = createGameStore({
  saveKey: 'slope-rider-save-v1',
  firstLevelId: '1-1',
})

export {
  selectPlayerLevel,
  selectXpIntoLevel,
  selectPlayerTitle,
  selectTotalStars,
  selectHasAnyProgress,
  chapterOf,
  chapterName,
}
