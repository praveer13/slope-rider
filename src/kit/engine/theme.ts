/**
 * Gridverse theme — canvas palette + chapter accent + injectable art assets.
 * One theme object per game; chapter accent swaps via `applyThemeToDom`.
 * Canvas colors come from `Palette`; DOM colors come from the kit Tailwind
 * preset (semantic tokens: night-0..3, hi/mid/low, line, accent hues).
 */
import type { ColorblindMode } from '../lib/settings.js'

export interface Palette {
  cyan: string
  mint: string
  violet: string
  magenta: string
  amber: string
  coral: string
  danger: string
  gold: string
  hi: string
  mid: string
  low: string
  gridMinor: string
  gridMajor: string
  axisX: string
  axisY: string
  bg0: string
  bg1: string
  bg2: string
  bg3: string
  line: string
}

export interface GridverseAssets {
  /** full-bleed ambient backdrop image url (drawn at 0.55 alpha) */
  nebula?: string
  /** mascot sprite url for drawMascot; falls back to vector arrow */
  mascot?: string
}

export interface GridverseTheme {
  palette: Palette
  /** Okabe-Ito rebase applied for any colorblind mode != 'off' */
  colorblind: Partial<Palette>
  /** chapter accent hue — drives --gv-accent CSS var and canvas highlights */
  accent: string
  assets?: GridverseAssets
}

export const BASE_PALETTE: Palette = {
  cyan: '#22D3EE',
  mint: '#3DFFA2',
  violet: '#8B5CF6',
  magenta: '#FF2E93',
  amber: '#FFB020',
  coral: '#FF6B4A',
  danger: '#FF4D6D',
  gold: '#FFD166',
  hi: '#EAF2FF',
  mid: '#9DB0D6',
  low: '#64769C',
  gridMinor: 'rgba(56,189,248,0.07)',
  gridMajor: 'rgba(56,189,248,0.15)',
  axisX: 'rgba(255,176,32,0.35)',
  axisY: 'rgba(34,211,238,0.35)',
  bg0: '#060A13',
  bg1: '#0B1220',
  bg2: '#111B30',
  bg3: '#182642',
  line: '#223354',
}

/** Okabe-Ito rebase for colorblind modes */
export const OKABE_ITO: Partial<Palette> = {
  amber: '#E69F00',
  cyan: '#56B4E9',
  mint: '#009E73',
  magenta: '#CC79A7',
  gold: '#F0E442',
}

/** The default series theme (VECTO's look). Games override accent/assets. */
export const GRIDVERSE_BASE: GridverseTheme = {
  palette: BASE_PALETTE,
  colorblind: OKABE_ITO,
  accent: '#FFB020',
  assets: {},
}

/** App-wide default theme, bound once at startup via bindKitTheme. */
export let kitTheme: GridverseTheme = GRIDVERSE_BASE

/** Bind the app-wide default theme once at startup (Engine default, DOM accent). */
export function bindKitTheme(theme: GridverseTheme): void {
  kitTheme = theme
}

/** Palette adjusted for a colorblind mode ('off' = base palette). */
export function paletteForMode(mode: ColorblindMode | string, theme: GridverseTheme = GRIDVERSE_BASE): Palette {
  if (mode === 'off') return theme.palette
  return { ...theme.palette, ...theme.colorblind }
}

/** Push theme accents into DOM CSS vars consumed by the Tailwind preset. */
export function applyThemeToDom(theme: GridverseTheme, root: HTMLElement = document.documentElement): void {
  root.style.setProperty('--gv-accent', theme.accent)
}
