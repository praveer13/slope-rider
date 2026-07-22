import kitPreset from '@gridverse/kit/tailwind.preset'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    './node_modules/@gridverse/kit/dist/**/*.js',
  ],
  presets: [kitPreset],
}
