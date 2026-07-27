import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StoreApi, UseBoundStore } from 'zustand'
import { DEFAULT_KIT_SETTINGS } from '../lib/settings.js'
import type { GameState, GameStoreConfig } from './types.js'

/**
 * Factory for a VECTO-shaped game store.
 *
 * Parameterized over save key, chapters, player titles, skins, and first level.
 * Apps bind settings once via `bindKitSettings(() => store.getState().settings)`.
 */

const today = () => new Date().toISOString().slice(0, 10)

export interface GameStore extends UseBoundStore<StoreApi<GameState>> {}

export function createGameStore(config: GameStoreConfig): GameStore {
  const initialSkins = config.defaultSkins ?? ['amber']

  const INITIAL: Pick<
    GameState,
    | 'visited'
    | 'levels'
    | 'gears'
    | 'xp'
    | 'streakDays'
    | 'lastPlayedDay'
    | 'dailyLastCompleted'
    | 'cards'
    | 'badges'
    | 'skins'
    | 'activeSkin'
    | 'currentLevel'
    | 'resumeLevel'
    | 'settings'
  > = {
    visited: false,
    levels: {},
    gears: 0,
    xp: 0,
    streakDays: 0,
    lastPlayedDay: null,
    dailyLastCompleted: null,
    cards: [],
    badges: [],
    skins: initialSkins,
    activeSkin: initialSkins[0] ?? 'amber',
    currentLevel: config.firstLevelId ?? '1-1',
    resumeLevel: null,
    settings: DEFAULT_KIT_SETTINGS,
  }

  return create<GameState>()(
    persist(
      (set) => ({
        ...INITIAL,

        markVisited: () => set({ visited: true }),

        completeLevel: (id, stars, gearsEarned = 0, xpEarned = 0) =>
          set((s) => {
            const prev = s.levels[id]
            return {
              levels: {
                ...s.levels,
                [id]: { stars: Math.max(stars, prev?.stars ?? 0), completed: true },
              },
              gears: s.gears + gearsEarned,
              xp: s.xp + xpEarned,
              resumeLevel: s.resumeLevel === id ? null : s.resumeLevel,
            }
          }),

        setCurrentLevel: (id) => set({ currentLevel: id }),
        setResumeLevel: (id) => set({ resumeLevel: id }),
        addGears: (n) => set((s) => ({ gears: Math.max(0, s.gears + n) })),
        addXp: (n) => set((s) => ({ xp: Math.max(0, s.xp + n) })),

        unlockCard: (id) =>
          set((s) => (s.cards.includes(id) ? s : { cards: [...s.cards, id] })),
        unlockBadge: (id) =>
          set((s) => (s.badges.includes(id) ? s : { badges: [...s.badges, id] })),
        unlockSkin: (id) =>
          set((s) => (s.skins.includes(id) ? s : { skins: [...s.skins, id] })),
        setActiveSkin: (id) => set({ activeSkin: id }),

        completeDaily: (gearsEarned = 40) =>
          set((s) => ({ dailyLastCompleted: today(), gears: s.gears + gearsEarned })),

        touchStreak: () =>
          set((s) => {
            const t = today()
            if (s.lastPlayedDay === t) return s
            const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10)
            return {
              lastPlayedDay: t,
              streakDays: s.lastPlayedDay === yesterday ? s.streakDays + 1 : 1,
            }
          }),

        updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

        resetAll: () => set({ ...INITIAL, settings: { ...DEFAULT_KIT_SETTINGS } }),
      }),
      {
        name: config.saveKey,
        version: 1,
      },
    ),
  )
}
