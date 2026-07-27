/**
 * Kit settings contract — the single seam between the engine/lib layer and the
 * app's store. Apps call `bindKitSettings(() => store.getState().settings)` once
 * at startup; engine, sfx, and haptics read through `kitSettings()`.
 *
 * Shape is the series canon (identical across all games).
 */

export type ColorblindMode = 'off' | 'protan' | 'deutan' | 'tritan'
export type SnapStrength = 'gentle' | 'normal' | 'sticky'

export interface KitSettings {
  masterVolume: number // 0..1
  musicVolume: number // 0..1
  sfxVolume: number // 0..1
  musicOn: boolean
  sfxOn: boolean
  hapticsOn: boolean
  gridIntensity: number // 0..1 — canvas grid brightness
  reduceMotion: boolean
  colorblind: ColorblindMode
  mathLabels: boolean // show real math terms instead of stealth names
  ghostHints: boolean // ghost-hand hint overlay
  snapStrength: SnapStrength // drag snap assist
}

export const DEFAULT_KIT_SETTINGS: KitSettings = {
  masterVolume: 0.8,
  musicVolume: 0.7,
  sfxVolume: 0.9,
  musicOn: true,
  sfxOn: true,
  hapticsOn: true,
  gridIntensity: 0.8,
  reduceMotion: false,
  colorblind: 'off',
  mathLabels: false,
  ghostHints: true,
  snapStrength: 'normal',
}

export type SettingsGetter = () => KitSettings

let getter: SettingsGetter = () => DEFAULT_KIT_SETTINGS

/** Bind once at app startup, e.g. bindKitSettings(() => useGameStore.getState().settings) */
export function bindKitSettings(g: SettingsGetter): void {
  getter = g
}

/** Current settings (defaults until bound). Also honors prefers-reduced-motion. */
export function kitSettings(): KitSettings {
  const s = getter()
  if (
    !s.reduceMotion &&
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ) {
    return { ...s, reduceMotion: true }
  }
  return s
}

/** Effective sfx gain (0 when muted) — shared by every audio emitter. */
export function sfxGain(): number {
  const { sfxOn, sfxVolume, masterVolume } = kitSettings()
  return sfxOn ? sfxVolume * masterVolume : 0
}
