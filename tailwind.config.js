import kitPreset from './src/kit/tailwind.preset.cjs'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  presets: [kitPreset],
}
