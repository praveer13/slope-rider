import { Home, Map, BookOpen, User } from 'lucide-react'
import type { RouteObject } from 'react-router'
import { AppShell } from '@gridverse/kit/shell'
import HomePage from './pages/Home.tsx'
import MapPage from './pages/Map.tsx'
import CodexPage from './pages/Codex.tsx'
import GameplayPage from './pages/Gameplay.tsx'
import ResultsPage from './pages/Results.tsx'
import ProfilePage from './pages/Profile.tsx'
import SettingsPage from './pages/Settings.tsx'

const routes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/map', element: <MapPage /> },
  { path: '/codex', element: <CodexPage /> },
  { path: '/play', element: <GameplayPage /> },
  { path: '/results', element: <ResultsPage /> },
  { path: '/profile', element: <ProfilePage /> },
  { path: '/settings', element: <SettingsPage /> },
  { path: '*', element: <HomePage /> },
]

const tabs = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/map', label: 'Map', icon: Map },
  { to: '/codex', label: 'Codex', icon: BookOpen },
  { to: '/profile', label: 'Profile', icon: User },
]

export default function App() {
  return <AppShell routes={routes} nav={tabs} />
}
