import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { bindKitSettings, applyThemeToDom, GRIDVERSE_BASE } from '@gridverse/kit'
import './index.css'
import App from './App.tsx'
import { useGameStore } from './store.ts'

// Wire kit libs to the app's settings slice once at boot.
bindKitSettings(() => useGameStore.getState().settings)
applyThemeToDom(GRIDVERSE_BASE)

createRoot(document.getElementById('root')!).render(
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <App />
  </BrowserRouter>,
)
