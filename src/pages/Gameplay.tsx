import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Engine, drawArrow, drawPad } from '@gridverse/kit/engine'
import { Session } from '@gridverse/kit/session'
import type { Vec } from '@gridverse/kit/engine'
import { vec, dist } from '@gridverse/kit/engine'
import { TopBar, Chip, NeonButton, Toast, StarMeter } from '@gridverse/kit/ui'
import { levels, type LevelDef } from '../game/levels.ts'
import { useGameStore } from '../store.ts'

/**
 * Reference Session subclass for the hello-grid demo.
 *
 * Contract:
 * - onDown/onMove/onUp react to world-space pointer events.
 * - update() runs each frame (empty here).
 * - drawWorld() renders the world; the base class overlays ghost hints.
 * - equation()/uiExtras() feed the HUD.
 * - go() commits the primary action.
 * - winBursts()/contentBounds() power camera + win particles.
 */
class ArrowSession extends Session<LevelDef, { reached: boolean }> {
  private drag: Vec | null = null
  private reached = false

  onDown(w: Vec) {
    if (dist(w, this.level.origin) < 1.2) {
      this.drag = w
    }
  }

  onMove(w: Vec) {
    if (this.drag) {
      this.drag = w
      this.emit()
    }
  }

  onUp(w: Vec) {
    if (!this.drag) return
    if (dist(w, this.level.goal) < 1) {
      this.reached = true
      this.doWin()
    } else {
      this.doMiss('Drag to the gold pad')
    }
    this.drag = null
  }

  update() {}

  drawWorld(ctx: CanvasRenderingContext2D, eng: Engine) {
    drawPad(eng, this.level.goal, { label: 'Goal', lockOn: this.lockOn() })
    const tip = this.drag ?? this.level.origin
    drawArrow(eng, this.level.origin, tip, eng.palette.mint, {
      glow: true,
      width: 4,
    })
  }

  equation() {
    const t = this.drag ?? this.level.origin
    const dx = Math.round(t.x - this.level.origin.x)
    const dy = Math.round(t.y - this.level.origin.y)
    return `${dx},${dy}`
  }

  go() {
    if (this.reached) this.doWin(0)
    else this.doMiss('Reach the goal first')
  }

  reset() {
    this.drag = null
    this.reached = false
    this.moves = 0
    this.hintsUsed = 0
    this.engine.fitWorld(-4, -4, 4, 4, 1.5, true)
    this.emit()
  }

  hintPath() {
    return {
      path: [this.level.origin, this.level.goal],
      caption: 'Drag the spark to the gold pad',
    }
  }

  winBursts() {
    return [this.level.goal]
  }

  contentBounds() {
    return { minX: -4, minY: -4, maxX: 4, maxY: 4 }
  }

  uiExtras() {
    return { reached: this.reached }
  }

  serialize() {
    return { reached: this.reached }
  }

  restore() {
    this.reached = false
  }
}

export default function Gameplay() {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sessionRef = useRef<ArrowSession | null>(null)
  const levelId = useGameStore((s) => s.currentLevel)
  const level = levels.find((l) => l.id === levelId) ?? levels[0]!
  const completeLevel = useGameStore((s) => s.completeLevel)
  const [ui, setUi] = useState({
    equation: '',
    moves: 0,
    hints: 0,
    lockOn: false,
    state: 'intro' as const,
    reached: false,
  })
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const session = new ArrowSession(canvas, level, {
      onUi: (state) => setUi(state),
      onToast: (msg) => setToast(msg),
      onWin: (moves) => {
        const stars = Math.min(3, Math.max(1, 5 - moves))
        completeLevel(level.id, stars, 5, 20)
        navigate('/results')
      },
    })
    sessionRef.current = session
    session.begin()
    session.engine.start()
    return () => {
      session.dispose()
      sessionRef.current = null
    }
  }, [level, completeLevel, navigate])

  return (
    <div className="relative flex h-full flex-col">
      <TopBar title={level.name} />
      <div className="pointer-events-none absolute left-4 top-[calc(3.5rem+env(safe-area-inset-top))] z-10 flex gap-2">
        <Chip tone="cyan">{ui.equation}</Chip>
        <StarMeter stars={ui.reached ? 3 : 0} size={16} />
      </div>
      <canvas ref={canvasRef} className="flex-1 touch-none bg-night-0" />
      <div className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 right-4 z-10">
        <NeonButton
          ariaLabel="Submit move"
          disabled={!ui.lockOn}
          onClick={() => sessionRef.current?.go()}
          className="w-full"
        >
          Go
        </NeonButton>
      </div>
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  )
}
