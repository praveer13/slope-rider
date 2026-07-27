import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router'
import { bindKitSettings, applyThemeToDom, GRIDVERSE_BASE } from '@/kit'
import './index.css'
import App from './App.tsx'
import { useGameStore } from './store.ts'

// Wire kit libs to the app's settings slice once at boot.
bindKitSettings(() => useGameStore.getState().settings)
applyThemeToDom(GRIDVERSE_BASE)

// Long-press is a game input: never let the OS summon selection/callout UI.
window.addEventListener('contextmenu', (e) => e.preventDefault())

// MemoryRouter: in-app navigation never touches window.history — playing the
// game must not pollute the browser's back stack (series feedback, v3).
createRoot(document.getElementById('root')!).render(
  <MemoryRouter>
    <App />
  </MemoryRouter>,
)
