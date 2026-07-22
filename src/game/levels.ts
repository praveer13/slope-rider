import type { Vec } from '@gridverse/kit/engine'

/**
 * Pure level data + canonicalSolution.
 *
 * The canonicalSolution field is the contract with scripts/verify-levels.ts:
 * every shipped level must include a solution that the mechanic's checker
 * accepts (definition of done for the series).
 */
export interface LevelDef {
  id: string
  name: string
  origin: Vec
  goal: Vec
  canonicalSolution: Vec
}

export const levels: LevelDef[] = [
  {
    id: '1-1',
    name: 'First Spark',
    origin: { x: 0, y: 0 },
    goal: { x: 2, y: 1 },
    canonicalSolution: { x: 2, y: 1 },
  },
  {
    id: '1-2',
    name: 'Upward Drift',
    origin: { x: 0, y: 0 },
    goal: { x: 1, y: 3 },
    canonicalSolution: { x: 1, y: 3 },
  },
  {
    id: '1-3',
    name: 'Long Leap',
    origin: { x: 0, y: 0 },
    goal: { x: 3, y: 2 },
    canonicalSolution: { x: 3, y: 2 },
  },
]
