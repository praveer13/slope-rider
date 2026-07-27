import type { KitSettings } from '../lib/settings.js'

export interface LevelProgress {
  stars: number // 0-3
  completed: boolean
}

export interface GameState {
  /** false until the player has seen the title entrance once */
  visited: boolean
  /** level id ("1-1".."6-8", "boss") -> progress */
  levels: Record<string, LevelProgress>
  gears: number
  xp: number
  streakDays: number
  /** ISO date (yyyy-mm-dd) of last session, for streak logic */
  lastPlayedDay: string | null
  /** ISO date of last completed Daily Drift */
  dailyLastCompleted: string | null
  /** unlocked concept-card ids, e.g. "ch1-1" */
  cards: string[]
  badges: string[]
  skins: string[]
  activeSkin: string
  /** next level to play, e.g. "2-3" - drives the home CTA chip */
  currentLevel: string
  /** level quit mid-play; home CTA offers RESUME */
  resumeLevel: string | null
  settings: KitSettings

  markVisited: () => void
  completeLevel: (id: string, stars: number, gearsEarned?: number, xpEarned?: number) => void
  setCurrentLevel: (id: string) => void
  setResumeLevel: (id: string | null) => void
  addGears: (n: number) => void
  addXp: (n: number) => void
  unlockCard: (id: string) => void
  unlockBadge: (id: string) => void
  unlockSkin: (id: string) => void
  setActiveSkin: (id: string) => void
  completeDaily: (gearsEarned?: number) => void
  /** call once per session - rolls the streak forward on consecutive days */
  touchStreak: () => void
  updateSettings: (patch: Partial<KitSettings>) => void
  resetAll: () => void
}

export interface ChapterConfig {
  id: string
  name: string
  accent: string
}

export interface GameStoreConfig {
  saveKey: string
  chapters?: ChapterConfig[]
  playerTitles?: Array<[number, string]>
  defaultSkins?: string[]
  firstLevelId?: string
}
