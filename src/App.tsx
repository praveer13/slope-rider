import { Home, Map, BookOpen, User } from 'lucide-react'
import { AppShell } from '@gridverse/kit/shell'
import HomePage from './pages/Home.tsx'
import MapPage from './pages/Map.tsx'
import CodexPage from './pages/Codex.tsx'
import GameplayPage from './pages/Gameplay.tsx'
import ResultsPage from './pages/Results.tsx'
import ProfilePage from './pages/Profile.tsx'
import SettingsPage from './pages/Settings.tsx'
import BossPage from './pages/Boss.tsx'

const routes = [
  { path: '/', element: <HomePage />, navId: 'home' },
  { path: '/map', element: <MapPage />, navId: 'map' },
  { path: '/codex', element: <CodexPage />, navId: 'codex' },
  { path: '/play', element: <GameplayPage /> },
  { path: '/boss', element: <BossPage /> },
  { path: '/results', element: <ResultsPage /> },
  { path: '/profile', element: <ProfilePage />, navId: 'profile' },
  { path: '/settings', element: <SettingsPage /> },
  { path: '*', element: <HomePage />, navId: 'home' },
]

const tabs = [
  { id: 'home', label: 'Home', icon: <Home className="h-5 w-5" /> },
  { id: 'map', label: 'Map', icon: <Map className="h-5 w-5" /> },
  { id: 'codex', label: 'Codex', icon: <BookOpen className="h-5 w-5" /> },
  { id: 'profile', label: 'Profile', icon: <User className="h-5 w-5" /> },
]

export default function App() {
  return <AppShell routes={routes} nav={tabs} />
}
