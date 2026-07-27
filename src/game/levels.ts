import type { Seg, Portal, Shard, MotionRule } from './calculus'
import type { ShapeWindow } from './shape'
export type { MotionRule } from './calculus'
export type { ShapeWindow } from './shape'

/**
 * SLOPE RIDER v3 level data contracts (design v3 §4).
 * A level = fixed bedrock Seg[] + shape windows the player edits.
 * The harness simulates the canonical ride on the SOLVED curve
 * (bedrock + windows filled with `solution` knots) and requires 3★.
 */

interface Base {
  id: string
  zone: 1 | 2 | 3 | 4 | 5 | 6
  name: string
  goal: string
  /** coach mark, ≤ 6 words (harness lints) */
  coach: string
  finale?: boolean
  cardId?: string
}

/** witness input script the harness simulates on the solved curve */
export interface CanonicalLine {
  goalX: number
  /** coast windows [x0,x1]: carve released over these x-ranges */
  coast: [number, number][]
  /** hop trigger x positions */
  hops: number[]
}

/** Z6 editable rule spec: range + the solvable coefficient witness */
export interface RuleSpec {
  wind?: { range: [number, number]; solvable: number }
  spring?: { range: [number, number]; x0: number; solvable: number }
}

export interface SRLevel extends Base {
  /** fixed bedrock segments (gaps between them host shape windows / coast gaps) */
  terrain: Seg[]
  /** editable shape windows (design v3 §4) — absent only on pure-ride levels */
  shape?: ShapeWindow[]
  shards: Shard[]
  canonical: CanonicalLine
  portals?: Portal[]
  ruleSpec?: RuleSpec
  /** spawn x (default 0, grounded on terrain) */
  spawnX?: number
}

export const LEVELS: Record<string, SRLevel> = {
  '1-1': {
    id: '1-1', zone: 1, name: 'First Push', cardId: 'z1-1',
    goal: 'Draw the line through the light.', coach: 'Drag knots to the light.',
    terrain: [
      { kind: 'ramp', p: [0, 6], x0: 0, x1: 6 },
      { kind: 'ramp', p: [0, 1.5], x0: 24, x1: 40 },
    ],
    shape: [
      { x0: 6, x1: 24, knots: 3, minY: 0, maxY: 8, startY: 6, endY: 1.5, solution: [5.75, 5, 2.5] },
    ],
    shards: [
      { x: 3, y: 6.50 },
      { x: 10.5, y: 6.25 },
      { x: 15, y: 5.50 },
      { x: 19.5, y: 3.00 },
      { x: 30, y: 2.00 },
    ],
    canonical: { goalX: 38.5, coast: [], hops: [] },
  },
  '1-2': {
    id: '1-2', zone: 1, name: 'Let Go', cardId: 'z1-1',
    goal: 'Shape the line that clears the gap.', coach: 'Release to fly.',
    terrain: [
      { kind: 'ramp', p: [-0.3, 9.7], x0: 14, x1: 18 },
      { kind: 'ramp', p: [0.2, -1.4], x0: 26, x1: 46 },
    ],
    shape: [
      { x0: 2, x1: 14, knots: 2, minY: 3, maxY: 9, startY: 8, endY: 5.5, solution: [7.5, 6.25] },
    ],
    shards: [
      { x: 6, y: 8.00 },
      { x: 10, y: 6.75 },
      { x: 16, y: 5.40 },
      { x: 20, y: 2.60, air: true },
      { x: 22, y: 2.50, air: true },
      { x: 24, y: 1.90, air: true },
      { x: 33, y: 5.70 },
      { x: 40, y: 7.10 },
    ],
    canonical: { goalX: 44.5, coast: [[18, 26]], hops: [] },
    spawnX: 2,
  },
  '1-3': {
    id: '1-3', zone: 1, name: 'Dip Down', cardId: 'z1-1',
    goal: 'Draw the long slide down.', coach: 'Keep the line dropping.',
    terrain: [
      { kind: 'ramp', p: [0, 8], x0: 0, x1: 6 },
      { kind: 'ramp', p: [0, 1.5], x0: 24, x1: 44 },
    ],
    shape: [
      { x0: 6, x1: 24, knots: 3, minY: 0, maxY: 9, startY: 8, endY: 1.5, solution: [6.5, 4.75, 3.25] },
    ],
    shards: [
      { x: 3, y: 8.50 },
      { x: 10.5, y: 7.00 },
      { x: 15, y: 5.25 },
      { x: 19.5, y: 3.75 },
      { x: 30, y: 2.00 },
      { x: 38, y: 2.00 },
    ],
    canonical: { goalX: 42.5, coast: [], hops: [] },
  },
  '1-4': {
    id: '1-4', zone: 1, name: 'Long Slide', cardId: 'z1-1',
    goal: 'Draw one smooth downhill line.', coach: 'One smooth drop.',
    terrain: [
      { kind: 'ramp', p: [0, 9], x0: 0, x1: 5 },
      { kind: 'ramp', p: [0, 1.5], x0: 28, x1: 48 },
    ],
    shape: [
      { x0: 5, x1: 28, knots: 4, minY: 0, maxY: 10, startY: 9, endY: 1.5, solution: [7.5, 6, 4.5, 3] },
    ],
    shards: [
      { x: 2.5, y: 9.50 },
      { x: 9, y: 8.20 },
      { x: 14, y: 6.57 },
      { x: 19, y: 4.93 },
      { x: 24, y: 3.30 },
      { x: 33, y: 2.00 },
      { x: 40, y: 2.00 },
    ],
    canonical: { goalX: 46.5, coast: [], hops: [] },
  },
  '1-5': {
    id: '1-5', zone: 1, name: 'Air Walk', cardId: 'z1-2',
    goal: 'Shape the takeoff over the gap.', coach: 'Crest the end hard.',
    terrain: [
      { kind: 'ramp', p: [0, 8], x0: 0, x1: 8 },
      { kind: 'ramp', p: [0, 3], x0: 26, x1: 30 },
      { kind: 'ramp', p: [0, 1], x0: 34, x1: 52 },
    ],
    shape: [
      { x0: 8, x1: 26, knots: 3, minY: 1, maxY: 10, startY: 8, endY: 3, solution: [6.75, 5.5, 4.25] },
    ],
    shards: [
      { x: 4, y: 8.50 },
      { x: 12, y: 7.39 },
      { x: 17, y: 6.00 },
      { x: 21, y: 4.89 },
      { x: 28, y: 3.50 },
      { x: 31, y: 3.00, air: true },
      { x: 42, y: 1.50 },
    ],
    canonical: { goalX: 50.5, coast: [[26, 34]], hops: [] },
  },
  '1-6': {
    id: '1-6', zone: 1, name: 'Twin Drops', cardId: 'z1-2',
    goal: 'Shape both descents to carry speed.', coach: 'Two drops, one ride.',
    terrain: [
      { kind: 'ramp', p: [0, 9], x0: 0, x1: 5 },
      { kind: 'ramp', p: [0, 6], x0: 18, x1: 22 },
      { kind: 'ramp', p: [0, 1], x0: 40, x1: 56 },
    ],
    shape: [
      { x0: 5, x1: 18, knots: 3, minY: 3, maxY: 10, startY: 9, endY: 6, solution: [8.25, 7.5, 6.75] },
      { x0: 22, x1: 40, knots: 3, minY: 0, maxY: 7, startY: 6, endY: 1, solution: [4.75, 3.5, 2.25] },
    ],
    shards: [
      { x: 2.5, y: 9.50 },
      { x: 9, y: 8.58 },
      { x: 14, y: 7.42 },
      { x: 20, y: 6.50 },
      { x: 27, y: 5.11 },
      { x: 33, y: 3.44 },
      { x: 45, y: 1.50 },
    ],
    canonical: { goalX: 54.5, coast: [], hops: [] },
  },
  '1-7': {
    id: '1-7', zone: 1, name: 'Long Drop', cardId: 'z1-2',
    goal: 'Draw a smooth drop to the end.', coach: 'Bowl feeds the exit.',
    terrain: [
      { kind: 'ramp', p: [0, 8], x0: 0, x1: 6 },
      { kind: 'ramp', p: [0, 2], x0: 30, x1: 48 },
    ],
    shape: [
      { x0: 6, x1: 30, knots: 4, minY: 0, maxY: 9, startY: 8, endY: 2, solution: [6.75, 5.5, 4.5, 3.25] },
    ],
    shards: [
      { x: 3, y: 8.50 },
      { x: 10, y: 7.46 },
      { x: 15, y: 6.14 },
      { x: 20, y: 5.09 },
      { x: 25, y: 3.80 },
      { x: 36, y: 2.50 },
      { x: 42, y: 2.50 },
    ],
    canonical: { goalX: 46.5, coast: [], hops: [] },
  },
  '1-8': {
    id: '1-8', zone: 1, name: 'First Gauntlet', cardId: 'z1-2',
    goal: 'Shape two drops in one run.', coach: 'Keep speed through both.',
    terrain: [
      { kind: 'ramp', p: [0, 9], x0: 0, x1: 4 },
      { kind: 'ramp', p: [0, 5], x0: 16, x1: 20 },
      { kind: 'ramp', p: [0, 1], x0: 36, x1: 54 },
    ],
    shape: [
      { x0: 4, x1: 16, knots: 3, minY: 3, maxY: 10, startY: 9, endY: 5, solution: [8, 7, 6] },
      { x0: 20, x1: 36, knots: 3, minY: 0, maxY: 6, startY: 5, endY: 1, solution: [4, 3, 2] },
    ],
    shards: [
      { x: 2, y: 9.50 },
      { x: 8, y: 8.17 },
      { x: 13, y: 6.50 },
      { x: 18, y: 5.50 },
      { x: 25, y: 4.25 },
      { x: 31, y: 2.75 },
      { x: 45, y: 1.50 },
    ],
    canonical: { goalX: 52.5, coast: [], hops: [] },
  },
  '1-9': {
    id: '1-9', zone: 1, name: 'The Big Hill', cardId: 'z1-3', finale: true,
    goal: 'Draw the long way down.', coach: 'Draw the whole mountain.',
    terrain: [
      { kind: 'ramp', p: [0, 10], x0: 0, x1: 6 },
      { kind: 'ramp', p: [0, 1], x0: 30, x1: 54 },
    ],
    shape: [
      { x0: 6, x1: 30, knots: 5, minY: 0, maxY: 11, startY: 10, endY: 1, solution: [8.5, 7, 5.5, 4, 2.5] },
    ],
    shards: [
      { x: 3, y: 10.50 },
      { x: 9, y: 9.38 },
      { x: 13, y: 7.88 },
      { x: 17, y: 6.38 },
      { x: 21, y: 4.88 },
      { x: 25, y: 3.38 },
      { x: 34, y: 1.50 },
      { x: 42, y: 1.50 },
    ],
    canonical: { goalX: 52.5, coast: [], hops: [] },
  },
  '2-1': {
    id: '2-1', zone: 2, name: 'The Number', cardId: 'z2-1',
    goal: 'Draw within the steepness cap.', coach: 'The cap is the lesson.',
    terrain: [
      { kind: 'ramp', p: [-0.2, 9], x0: 0, x1: 8 },
      { kind: 'ramp', p: [0, 2.4], x0: 26, x1: 42 },
    ],
    shape: [
      { x0: 8, x1: 26, knots: 4, minY: 0, maxY: 9, startY: 7.4, endY: 2.4, slopeClamp: 0.6, solution: [6.5, 5.5, 4.25, 3.25] },
    ],
    shards: [
      { x: 4, y: 8.70 },
      { x: 11.6, y: 7.10 },
      { x: 15.2, y: 5.90 },
      { x: 18.8, y: 4.70 },
      { x: 22.4, y: 3.70 },
      { x: 33, y: 2.90 },
      { x: 38, y: 2.90 },
    ],
    canonical: { goalX: 40.5, coast: [], hops: [] },
  },
  '2-2': {
    id: '2-2', zone: 2, name: 'Gentle Cap', cardId: 'z2-1',
    goal: 'Shape a line under the cap.', coach: 'The cap is the limit.',
    terrain: [
      { kind: 'ramp', p: [0, 9], x0: 0, x1: 8 },
      { kind: 'ramp', p: [0, 2], x0: 26, x1: 46 },
    ],
    shape: [
      { x0: 8, x1: 26, knots: 3, minY: 0, maxY: 10, startY: 9, endY: 2, slopeClamp: 0.5, solution: [7.25, 5.5, 3.75] },
    ],
    shards: [
      { x: 4, y: 9.50 },
      { x: 11, y: 8.33 },
      { x: 15, y: 6.78 },
      { x: 19, y: 5.22 },
      { x: 30, y: 2.50 },
      { x: 38, y: 2.50 },
    ],
    canonical: { goalX: 44.5, coast: [], hops: [] },
  },
  '2-3': {
    id: '2-3', zone: 2, name: 'Flat Top', cardId: 'z2-1',
    goal: 'Flatten the middle of your line.', coach: 'Top stays low.',
    terrain: [
      { kind: 'ramp', p: [0, 8], x0: 0, x1: 6 },
      { kind: 'ramp', p: [0, 2], x0: 26, x1: 46 },
    ],
    shape: [
      { x0: 6, x1: 26, knots: 4, minY: 1, maxY: 9, startY: 8, endY: 2, slopeClamp: 0.4, solution: [6.75, 5.5, 4.5, 3.25] },
    ],
    shards: [
      { x: 3, y: 8.50 },
      { x: 10, y: 7.25 },
      { x: 15, y: 5.74 },
      { x: 20, y: 4.39 },
      { x: 30, y: 2.50 },
      { x: 38, y: 2.50 },
    ],
    canonical: { goalX: 44.5, coast: [], hops: [] },
  },
  '2-4': {
    id: '2-4', zone: 2, name: 'Ink Meter', cardId: 'z2-1',
    goal: 'Shape the line inside the ink.', coach: 'Ink is tight.',
    terrain: [
      { kind: 'ramp', p: [0, 8], x0: 0, x1: 5 },
      { kind: 'ramp', p: [0, 2], x0: 28, x1: 48 },
    ],
    shape: [
      { x0: 5, x1: 28, knots: 4, minY: 0, maxY: 9, startY: 8, endY: 2, ink: 24, slopeClamp: 0.6, solution: [6.75, 5.5, 4.5, 3.25] },
    ],
    shards: [
      { x: 2.5, y: 8.50 },
      { x: 10, y: 7.14 },
      { x: 15, y: 5.81 },
      { x: 20, y: 4.69 },
      { x: 30, y: 2.50 },
      { x: 38, y: 2.50 },
    ],
    canonical: { goalX: 46.5, coast: [], hops: [] },
  },
  '2-5': {
    id: '2-5', zone: 2, name: 'Steep Costs', cardId: 'z2-2',
    goal: 'Steep lines drink ink.', coach: 'Steep costs ink.',
    terrain: [
      { kind: 'ramp', p: [0, 8], x0: 0, x1: 5 },
      { kind: 'ramp', p: [0, 2], x0: 26, x1: 46 },
    ],
    shape: [
      { x0: 5, x1: 26, knots: 4, minY: 0, maxY: 9, startY: 8, endY: 2, ink: 22, slopeClamp: 0.6, solution: [6.75, 5.5, 4.5, 3.25] },
    ],
    shards: [
      { x: 2.5, y: 8.50 },
      { x: 9, y: 7.31 },
      { x: 13, y: 6.11 },
      { x: 17, y: 5.15 },
      { x: 21, y: 3.99 },
      { x: 30, y: 2.50 },
      { x: 38, y: 2.50 },
    ],
    canonical: { goalX: 44.5, coast: [], hops: [] },
  },
  '2-6': {
    id: '2-6', zone: 2, name: 'Steep Drop', cardId: 'z2-2',
    goal: 'Draw a steep downhill line.', coach: 'Drop but stay capped.',
    terrain: [
      { kind: 'ramp', p: [0, 9], x0: 0, x1: 6 },
      { kind: 'ramp', p: [0, 1], x0: 28, x1: 50 },
    ],
    shape: [
      { x0: 6, x1: 28, knots: 4, minY: 0, maxY: 10, startY: 9, endY: 1, ink: 25, slopeClamp: 0.5, solution: [7.5, 5.75, 4.25, 2.5] },
    ],
    shards: [
      { x: 3, y: 9.50 },
      { x: 10, y: 8.15 },
      { x: 14, y: 6.56 },
      { x: 18, y: 5.17 },
      { x: 22, y: 3.63 },
      { x: 32, y: 1.50 },
      { x: 40, y: 1.50 },
    ],
    canonical: { goalX: 48.5, coast: [], hops: [] },
  },
  '2-7': {
    id: '2-7', zone: 2, name: 'Ink Saver', cardId: 'z2-2',
    goal: 'Draw a shorter curve.', coach: 'Less ink, same drop.',
    terrain: [
      { kind: 'ramp', p: [0, 9], x0: 0, x1: 5 },
      { kind: 'ramp', p: [0, 3], x0: 26, x1: 46 },
    ],
    shape: [
      { x0: 5, x1: 26, knots: 5, minY: 1, maxY: 10, startY: 9, endY: 3, ink: 23, slopeClamp: 0.55, solution: [8, 7, 6, 5, 4] },
    ],
    shards: [
      { x: 2.5, y: 9.50 },
      { x: 8, y: 8.64 },
      { x: 12, y: 7.50 },
      { x: 16, y: 6.36 },
      { x: 20, y: 5.21 },
      { x: 30, y: 3.50 },
      { x: 38, y: 3.50 },
    ],
    canonical: { goalX: 44.5, coast: [], hops: [] },
  },
  '2-8': {
    id: '2-8', zone: 2, name: 'Tight Cap', cardId: 'z2-2',
    goal: 'Stay shallow and make it fit.', coach: 'Shallow saves ink.',
    terrain: [
      { kind: 'ramp', p: [0, 8], x0: 0, x1: 5 },
      { kind: 'ramp', p: [0, 2], x0: 28, x1: 50 },
    ],
    shape: [
      { x0: 5, x1: 28, knots: 5, minY: 0, maxY: 9, startY: 8, endY: 2, ink: 25, slopeClamp: 0.45, solution: [7, 6, 5, 4, 3] },
    ],
    shards: [
      { x: 2.5, y: 8.50 },
      { x: 9, y: 7.46 },
      { x: 13, y: 6.41 },
      { x: 17, y: 5.37 },
      { x: 21, y: 4.33 },
      { x: 32, y: 2.50 },
      { x: 40, y: 2.50 },
    ],
    canonical: { goalX: 48.5, coast: [], hops: [] },
  },
  '2-9': {
    id: '2-9', zone: 2, name: 'Steepest Descent', cardId: 'z2-3', finale: true,
    goal: 'Draw the steepest drop yet.', coach: 'Spend ink for speed.',
    terrain: [
      { kind: 'ramp', p: [0, 10], x0: 0, x1: 6 },
      { kind: 'ramp', p: [0, 1], x0: 30, x1: 56 },
    ],
    shape: [
      { x0: 6, x1: 30, knots: 5, minY: 0, maxY: 11, startY: 10, endY: 1, ink: 27, slopeClamp: 0.5, solution: [8.5, 7, 5.5, 4, 2.5] },
    ],
    shards: [
      { x: 3, y: 10.50 },
      { x: 10, y: 9.00 },
      { x: 14, y: 7.50 },
      { x: 18, y: 6.00 },
      { x: 22, y: 4.50 },
      { x: 26, y: 3.00 },
      { x: 36, y: 1.50 },
      { x: 44, y: 1.50 },
    ],
    canonical: { goalX: 54.5, coast: [], hops: [] },
  },
  '3-1': {
    id: '3-1', zone: 3, name: 'The Flat Top', cardId: 'z3-1',
    goal: 'Shape a flat top to launch.', coach: 'Flat top, big launch.',
    terrain: [
      { kind: 'ramp', p: [-0.25, 8], x0: 0, x1: 10 },
      { kind: 'ramp', p: [-0.2, 10.4], x0: 32, x1: 46 },
    ],
    shape: [
      { x0: 10, x1: 26, knots: 3, minY: 2, maxY: 9, startY: 5.5, endY: 6.5, solution: [3.5, 4, 5.75] },
    ],
    shards: [
      { x: 5, y: 7.25 },
      { x: 14, y: 4.00 },
      { x: 18, y: 4.50 },
      { x: 22, y: 6.25 },
      { x: 28, y: 6.20, air: true },
      { x: 30, y: 5.40, air: true },
      { x: 36, y: 3.80 },
      { x: 42, y: 2.60 },
    ],
    canonical: { goalX: 44.5, coast: [[26, 32]], hops: [] },
  },
  '3-2': {
    id: '3-2', zone: 3, name: 'Valley Floor', cardId: 'z3-1',
    goal: 'Slingshot out of the bowl.', coach: 'Rise, then release.',
    terrain: [
      { kind: 'ramp', p: [0, 7], x0: 0, x1: 6 },
      { kind: 'ramp', p: [0, 1], x0: 36, x1: 54 },
    ],
    shape: [
      { x0: 6, x1: 26, knots: 3, minY: 2, maxY: 10, startY: 7, endY: 8, solution: [5, 4.5, 7.5] },
    ],
    shards: [
      { x: 3, y: 7.50 },
      { x: 12, y: 5.25 },
      { x: 17, y: 5.42 },
      { x: 21, y: 8.00 },
      { x: 27, y: 8.50, air: true },
      { x: 42, y: 1.50 },
    ],
    canonical: { goalX: 52.5, coast: [[26, 36]], hops: [] },
  },
  '3-3': {
    id: '3-3', zone: 3, name: 'Top Then Drop', cardId: 'z3-1',
    goal: 'Shape a crest, then fly.', coach: 'Peak at the edge.',
    terrain: [
      { kind: 'ramp', p: [0, 8], x0: 0, x1: 8 },
      { kind: 'ramp', p: [0, 2], x0: 34, x1: 52 },
    ],
    shape: [
      { x0: 8, x1: 26, knots: 3, minY: 2, maxY: 10, startY: 8, endY: 8, solution: [6, 5, 7.5] },
    ],
    shards: [
      { x: 4, y: 8.50 },
      { x: 12, y: 6.68 },
      { x: 17, y: 5.50 },
      { x: 21, y: 7.79 },
      { x: 27, y: 8.50, air: true },
      { x: 42, y: 2.50 },
    ],
    canonical: { goalX: 50.5, coast: [[26, 34]], hops: [] },
  },
  '3-4': {
    id: '3-4', zone: 3, name: 'Flat Run', cardId: 'z3-1',
    goal: 'Draw a high flat line.', coach: 'Bowl throws you.',
    terrain: [
      { kind: 'ramp', p: [0, 9], x0: 0, x1: 6 },
      { kind: 'ramp', p: [0, 9], x0: 28, x1: 48 },
    ],
    shape: [
      { x0: 6, x1: 28, knots: 4, minY: 1, maxY: 10, startY: 9, endY: 9, solution: [9, 9, 9, 9] },
    ],
    shards: [
      { x: 3, y: 9.50 },
      { x: 10, y: 9.50 },
      { x: 15, y: 9.50 },
      { x: 20, y: 9.50 },
      { x: 25, y: 9.50 },
      { x: 36, y: 9.50 },
      { x: 42, y: 9.50 },
    ],
    canonical: { goalX: 46.5, coast: [], hops: [] },
  },
  '3-5': {
    id: '3-5', zone: 3, name: 'Apex Slow-Mo', cardId: 'z3-2',
    goal: 'Shape a late crest to launch.', coach: 'Crest late and high.',
    terrain: [
      { kind: 'ramp', p: [0, 8], x0: 0, x1: 8 },
      { kind: 'ramp', p: [0, 1], x0: 36, x1: 56 },
    ],
    shape: [
      { x0: 8, x1: 28, knots: 4, minY: 2, maxY: 10, startY: 8, endY: 8, solution: [6.5, 5, 6, 7.5] },
    ],
    shards: [
      { x: 4, y: 8.50 },
      { x: 13, y: 6.57 },
      { x: 18, y: 5.81 },
      { x: 23, y: 7.68 },
      { x: 30, y: 8.50, air: true },
      { x: 44, y: 1.50 },
    ],
    canonical: { goalX: 54.5, coast: [[28, 36]], hops: [] },
  },
  '3-6': {
    id: '3-6', zone: 3, name: 'Bowl Toss', cardId: 'z3-2',
    goal: 'Shape a bowl that throws you out.', coach: 'Use the bottom.',
    terrain: [
      { kind: 'ramp', p: [0, 9], x0: 0, x1: 6 },
      { kind: 'ramp', p: [0.75, -19], x0: 28, x1: 32 },
      { kind: 'ramp', p: [0, 7], x0: 40, x1: 56 },
    ],
    shape: [
      { x0: 6, x1: 28, knots: 4, minY: 1, maxY: 10, startY: 9, endY: 2, solution: [7.5, 6.25, 4.75, 3.5] },
    ],
    shards: [
      { x: 3, y: 9.50 },
      { x: 10, y: 8.13 },
      { x: 15, y: 6.69 },
      { x: 20, y: 5.01 },
      { x: 24, y: 3.87 },
      { x: 30, y: 4.00 },
      { x: 38, y: 7.50, air: true },
      { x: 46, y: 7.50 },
    ],
    canonical: { goalX: 54.5, coast: [[32, 40]], hops: [] },
  },
  '3-7': {
    id: '3-7', zone: 3, name: 'High Crest', cardId: 'z3-2',
    goal: 'Shape a high crest to clear.', coach: 'Save height for crest.',
    terrain: [
      { kind: 'ramp', p: [0, 8], x0: 0, x1: 7 },
      { kind: 'ramp', p: [0, 1], x0: 38, x1: 58 },
    ],
    shape: [
      { x0: 7, x1: 30, knots: 4, minY: 1, maxY: 11, startY: 8, endY: 9, solution: [6, 5, 7, 8.5] },
    ],
    shards: [
      { x: 3.5, y: 8.50 },
      { x: 13, y: 6.03 },
      { x: 18, y: 6.09 },
      { x: 23, y: 8.31 },
      { x: 28, y: 9.34 },
      { x: 31, y: 9.00, air: true },
      { x: 46, y: 1.50 },
    ],
    canonical: { goalX: 56.5, coast: [[30, 38]], hops: [] },
  },
  '3-8': {
    id: '3-8', zone: 3, name: 'Ridge Gauntlet', cardId: 'z3-2',
    goal: 'Shape two crests in one run.', coach: 'Shape both takeoffs.',
    terrain: [
      { kind: 'ramp', p: [0, 9], x0: 0, x1: 5 },
      { kind: 'ramp', p: [0, 1], x0: 34, x1: 52 },
    ],
    shape: [
      { x0: 5, x1: 18, knots: 3, minY: 3, maxY: 11, startY: 9, endY: 8, solution: [6.5, 6, 7.5] },
      { x0: 22, x1: 34, knots: 3, minY: 1, maxY: 9, startY: 8, endY: 1, solution: [6, 4, 2] },
    ],
    shards: [
      { x: 2.5, y: 9.50 },
      { x: 8, y: 7.13 },
      { x: 13, y: 7.12 },
      { x: 16, y: 8.27 },
      { x: 20, y: 8.25, air: true },
      { x: 24, y: 7.17 },
      { x: 30, y: 3.09 },
      { x: 38, y: 1.50 },
      { x: 45, y: 1.50 },
    ],
    canonical: { goalX: 50.5, coast: [[18, 22]], hops: [] },
  },
  '3-9': {
    id: '3-9', zone: 3, name: 'The Great Apex', cardId: 'z3-3', finale: true,
    goal: 'Draw the highest launch yet.', coach: 'Build height, release.',
    terrain: [
      { kind: 'ramp', p: [0, 10], x0: 0, x1: 6 },
      { kind: 'ramp', p: [0, 1], x0: 32, x1: 58 },
    ],
    shape: [
      { x0: 6, x1: 24, knots: 5, minY: 2, maxY: 12, startY: 10, endY: 9, solution: [7, 6, 7.5, 8.5, 8.5] },
    ],
    shards: [
      { x: 3, y: 10.50 },
      { x: 10, y: 6.93 },
      { x: 14, y: 7.44 },
      { x: 18, y: 9.00 },
      { x: 22, y: 9.13 },
      { x: 28, y: 9.50, air: true },
      { x: 40, y: 1.50 },
      { x: 48, y: 1.50 },
    ],
    canonical: { goalX: 56.5, coast: [[24, 32]], hops: [] },
  },
  '4-1': {
    id: '4-1', zone: 4, name: 'Gather Light', cardId: 'z4-1',
    goal: 'Spend ink where the light is.', coach: 'Ink is limited. Spend well.',
    terrain: [
      { kind: 'ramp', p: [0, 6], x0: 0, x1: 6 },
      { kind: 'ramp', p: [0, 2], x0: 30, x1: 42 },
    ],
    shape: [
      { x0: 6, x1: 30, knots: 5, minY: 0, maxY: 8, startY: 6, endY: 2, ink: 26, solution: [6.25, 5.75, 5, 4, 3] },
    ],
    shards: [
      { x: 3, y: 6.50 },
      { x: 10, y: 6.75 },
      { x: 14, y: 6.25 },
      { x: 18, y: 5.50 },
      { x: 22, y: 4.50 },
      { x: 26, y: 3.50 },
      { x: 33, y: 2.50 },
      { x: 38, y: 2.50 },
    ],
    canonical: { goalX: 40.5, coast: [], hops: [] },
  },
  '4-2': {
    id: '4-2', zone: 4, name: 'Tall Hill', cardId: 'z4-1',
    goal: 'Pile light under your line.', coach: 'High holds more.',
    terrain: [
      { kind: 'ramp', p: [0, 7], x0: 0, x1: 5 },
      { kind: 'ramp', p: [0, 2], x0: 28, x1: 50 },
    ],
    shape: [
      { x0: 5, x1: 28, knots: 4, minY: 0, maxY: 9, startY: 7, endY: 2, ink: 24, solution: [6, 5, 4, 3] },
    ],
    shards: [
      { x: 2.5, y: 7.50 },
      { x: 8, y: 6.85 },
      { x: 12, y: 5.98 },
      { x: 16, y: 5.11 },
      { x: 20, y: 4.24 },
      { x: 24, y: 3.37 },
      { x: 31, y: 2.50 },
      { x: 38, y: 2.50 },
      { x: 44, y: 2.50 },
    ],
    canonical: { goalX: 48.5, coast: [], hops: [] },
  },
  '4-3': {
    id: '4-3', zone: 4, name: 'Keep Filling', cardId: 'z4-1',
    goal: 'Draw high to pile light.', coach: 'Spend ink on height.',
    terrain: [
      { kind: 'ramp', p: [0, 8], x0: 0, x1: 5 },
      { kind: 'ramp', p: [0, 1], x0: 26, x1: 50 },
    ],
    shape: [
      { x0: 5, x1: 26, knots: 5, minY: 0, maxY: 10, startY: 8, endY: 1, ink: 24, solution: [6.75, 5.75, 4.5, 3.25, 2.25] },
    ],
    shards: [
      { x: 2.5, y: 8.50 },
      { x: 8, y: 7.42 },
      { x: 12, y: 6.25 },
      { x: 16, y: 4.82 },
      { x: 20, y: 3.45 },
      { x: 24, y: 2.23 },
      { x: 30, y: 1.50 },
      { x: 38, y: 1.50 },
      { x: 44, y: 1.50 },
    ],
    canonical: { goalX: 48.5, coast: [], hops: [] },
  },
  '4-4': {
    id: '4-4', zone: 4, name: 'Air Light', cardId: 'z4-1',
    goal: 'Gather light in the air.', coach: 'Ink follows light.',
    terrain: [
      { kind: 'ramp', p: [0, 8], x0: 0, x1: 6 },
      { kind: 'ramp', p: [0, 2], x0: 30, x1: 52 },
    ],
    shape: [
      { x0: 6, x1: 30, knots: 5, minY: 0, maxY: 9, startY: 8, endY: 2, ink: 26, solution: [7, 6, 5, 4, 3] },
    ],
    shards: [
      { x: 3, y: 8.50 },
      { x: 10, y: 7.50 },
      { x: 14, y: 6.50 },
      { x: 18, y: 5.50 },
      { x: 22, y: 4.50 },
      { x: 26, y: 3.50 },
      { x: 34, y: 2.50 },
      { x: 40, y: 2.50 },
      { x: 46, y: 2.50 },
    ],
    canonical: { goalX: 50.5, coast: [], hops: [] },
  },
  '4-5': {
    id: '4-5', zone: 4, name: 'The Wide Valley', cardId: 'z4-2',
    goal: 'Pile light across the wide valley.', coach: 'Bulk up the middle.',
    terrain: [
      { kind: 'ramp', p: [0, 7], x0: 0, x1: 5 },
      { kind: 'ramp', p: [0, 2], x0: 28, x1: 50 },
    ],
    shape: [
      { x0: 5, x1: 28, knots: 5, minY: 0, maxY: 9, startY: 7, endY: 2, ink: 24, solution: [6.25, 5.25, 4.5, 3.75, 2.75] },
    ],
    shards: [
      { x: 2.5, y: 7.50 },
      { x: 8, y: 6.93 },
      { x: 12, y: 5.91 },
      { x: 16, y: 5.10 },
      { x: 20, y: 4.32 },
      { x: 24, y: 3.29 },
      { x: 31, y: 2.50 },
      { x: 38, y: 2.50 },
      { x: 44, y: 2.50 },
    ],
    canonical: { goalX: 48.5, coast: [], hops: [] },
  },
  '4-6': {
    id: '4-6', zone: 4, name: 'Clean Sweep', cardId: 'z4-2',
    goal: 'Gather every scrap of light.', coach: 'Max out the area.',
    terrain: [
      { kind: 'ramp', p: [0, 8], x0: 0, x1: 5 },
      { kind: 'ramp', p: [0, 1], x0: 30, x1: 52 },
    ],
    shape: [
      { x0: 5, x1: 30, knots: 5, minY: 0, maxY: 10, startY: 8, endY: 1, ink: 27, solution: [6.75, 5.75, 4.5, 3.25, 2.25] },
    ],
    shards: [
      { x: 2.5, y: 8.50 },
      { x: 9, y: 7.30 },
      { x: 13, y: 6.34 },
      { x: 17, y: 5.15 },
      { x: 21, y: 3.94 },
      { x: 25, y: 2.96 },
      { x: 33, y: 1.50 },
      { x: 40, y: 1.50 },
      { x: 46, y: 1.50 },
    ],
    canonical: { goalX: 50.5, coast: [], hops: [] },
  },
  '4-7': {
    id: '4-7', zone: 4, name: 'Light Ladder', cardId: 'z4-2',
    goal: 'Split ink across two windows.', coach: 'Split the ink.',
    terrain: [
      { kind: 'ramp', p: [0, 9], x0: 0, x1: 5 },
      { kind: 'ramp', p: [0, 3], x0: 16, x1: 20 },
      { kind: 'ramp', p: [0, 1], x0: 36, x1: 56 },
    ],
    shape: [
      { x0: 5, x1: 16, knots: 3, minY: 0, maxY: 10, startY: 9, endY: 3, ink: 13, solution: [7.5, 6, 4.5] },
      { x0: 20, x1: 36, knots: 3, minY: 0, maxY: 5, startY: 3, endY: 1, ink: 17, solution: [2.5, 2, 1.5] },
    ],
    shards: [
      { x: 2.5, y: 9.50 },
      { x: 8, y: 7.86 },
      { x: 12, y: 5.68 },
      { x: 18, y: 3.50 },
      { x: 24, y: 3.00 },
      { x: 28, y: 2.50 },
      { x: 32, y: 2.00 },
      { x: 44, y: 1.50 },
    ],
    canonical: { goalX: 54.5, coast: [], hops: [] },
  },
  '4-8': {
    id: '4-8', zone: 4, name: 'Field Gauntlet', cardId: 'z4-2',
    goal: 'Draw one tall line of light.', coach: 'Tall bridge.',
    terrain: [
      { kind: 'ramp', p: [0, 8], x0: 0, x1: 5 },
      { kind: 'ramp', p: [0, 1], x0: 30, x1: 52 },
    ],
    shape: [
      { x0: 5, x1: 30, knots: 6, minY: 0, maxY: 10, startY: 8, endY: 1, ink: 28, solution: [7, 6, 5, 4, 3, 2] },
    ],
    shards: [
      { x: 2.5, y: 8.50 },
      { x: 9, y: 7.38 },
      { x: 13, y: 6.26 },
      { x: 17, y: 5.14 },
      { x: 21, y: 4.02 },
      { x: 25, y: 2.90 },
      { x: 33, y: 1.50 },
      { x: 40, y: 1.50 },
      { x: 46, y: 1.50 },
    ],
    canonical: { goalX: 50.5, coast: [], hops: [] },
  },
  '4-9': {
    id: '4-9', zone: 4, name: 'The Motherlode', cardId: 'z4-3', finale: true,
    goal: 'Pile up every bit of light.', coach: 'Fill the whole hill.',
    terrain: [
      { kind: 'ramp', p: [0, 9], x0: 0, x1: 6 },
      { kind: 'ramp', p: [0, 1], x0: 32, x1: 60 },
    ],
    shape: [
      { x0: 6, x1: 32, knots: 6, minY: 0, maxY: 11, startY: 9, endY: 1, ink: 29, solution: [7.75, 6.75, 5.5, 4.5, 3.25, 2.25] },
    ],
    shards: [
      { x: 3, y: 9.50 },
      { x: 10, y: 8.17 },
      { x: 14, y: 7.07 },
      { x: 18, y: 5.76 },
      { x: 22, y: 4.63 },
      { x: 26, y: 3.36 },
      { x: 30, y: 2.19 },
      { x: 38, y: 1.50 },
      { x: 46, y: 1.50 },
      { x: 54, y: 1.50 },
    ],
    canonical: { goalX: 58.5, coast: [], hops: [] },
  },
  '5-1': {
    id: '5-1', zone: 5, name: 'The Blue Door', cardId: 'z5-1',
    goal: 'Draw fast to trade up.', coach: 'Doors trade height.',
    terrain: [
      { kind: 'ramp', p: [-0.3, 9], x0: 0, x1: 6 },
      { kind: 'ramp', p: [-0.2, 8], x0: 16, x1: 20 },
      { kind: 'ramp', p: [0.3, -2], x0: 28, x1: 44 },
    ],
    shape: [
      { x0: 6, x1: 16, knots: 2, minY: 2, maxY: 9, startY: 7.2, endY: 4.8, solution: [6.5, 5.5] },
    ],
    shards: [
      { x: 3, y: 8.60 },
      { x: 9.33, y: 7.00 },
      { x: 12.67, y: 6.00 },
      { x: 18, y: 4.90 },
      { x: 31, y: 7.80 },
      { x: 37, y: 9.60 },
    ],
    canonical: { goalX: 42.5, coast: [[20, 28]], hops: [] },
    portals: [{ a: 20, b: 28 }],
  },
  '5-2': {
    id: '5-2', zone: 5, name: 'First Trade', cardId: 'z5-1',
    goal: 'Shape the drop through the door.', coach: 'Dive to the door.',
    terrain: [
      { kind: 'ramp', p: [0, 9], x0: 0, x1: 5 },
      { kind: 'ramp', p: [0, 7], x0: 18, x1: 22 },
      { kind: 'ramp', p: [0, 3], x0: 28, x1: 50 },
    ],
    shape: [
      { x0: 5, x1: 18, knots: 2, minY: 3, maxY: 10, startY: 9, endY: 7, solution: [8.25, 7.75] },
    ],
    shards: [
      { x: 2.5, y: 9.50 },
      { x: 9, y: 8.80 },
      { x: 13, y: 8.34 },
      { x: 17, y: 7.68 },
      { x: 20, y: 7.50 },
      { x: 30, y: 3.50 },
      { x: 38, y: 3.50 },
      { x: 44, y: 3.50 },
    ],
    canonical: { goalX: 48.5, coast: [], hops: [] },
    portals: [{ a: 22, b: 28 }],
  },
  '5-3': {
    id: '5-3', zone: 5, name: 'Speed Door', cardId: 'z5-1',
    goal: 'Draw speed into the door.', coach: 'Speed opens doors.',
    terrain: [
      { kind: 'ramp', p: [0, 10], x0: 0, x1: 6 },
      { kind: 'ramp', p: [0, 6], x0: 20, x1: 24 },
      { kind: 'ramp', p: [0, 2], x0: 34, x1: 56 },
    ],
    shape: [
      { x0: 6, x1: 20, knots: 3, minY: 2, maxY: 11, startY: 10, endY: 6, solution: [9, 8, 7] },
    ],
    shards: [
      { x: 3, y: 10.50 },
      { x: 10, y: 9.36 },
      { x: 14, y: 8.21 },
      { x: 18, y: 7.07 },
      { x: 22, y: 6.50 },
      { x: 36, y: 2.50 },
      { x: 38, y: 2.50 },
      { x: 46, y: 2.50 },
    ],
    canonical: { goalX: 54.5, coast: [], hops: [] },
    portals: [{ a: 24, b: 34 }],
  },
  '5-4': {
    id: '5-4', zone: 5, name: 'High Door', cardId: 'z5-1',
    goal: 'Shape high before the door.', coach: 'High in, fast out.',
    terrain: [
      { kind: 'ramp', p: [0, 10], x0: 0, x1: 6 },
      { kind: 'ramp', p: [0, 7], x0: 22, x1: 26 },
      { kind: 'ramp', p: [0, 3], x0: 32, x1: 54 },
    ],
    shape: [
      { x0: 6, x1: 22, knots: 3, minY: 2, maxY: 11, startY: 10, endY: 7, solution: [9.25, 8.5, 7.75] },
    ],
    shards: [
      { x: 3, y: 10.50 },
      { x: 10, y: 9.75 },
      { x: 14, y: 9.00 },
      { x: 18, y: 8.25 },
      { x: 24, y: 7.50 },
      { x: 36, y: 3.50 },
      { x: 42, y: 3.50 },
      { x: 48, y: 3.50 },
    ],
    canonical: { goalX: 52.5, coast: [], hops: [] },
    portals: [{ a: 26, b: 32 }],
  },
  '5-5': {
    id: '5-5', zone: 5, name: 'Two-Way Door', cardId: 'z5-2',
    goal: 'Shape both sides of the door.', coach: 'Shape before and after.',
    terrain: [
      { kind: 'ramp', p: [0, 9], x0: 0, x1: 5 },
      { kind: 'ramp', p: [0, 7], x0: 16, x1: 20 },
      { kind: 'ramp', p: [0, 3], x0: 28, x1: 32 },
      { kind: 'ramp', p: [0, 1], x0: 42, x1: 60 },
    ],
    shape: [
      { x0: 5, x1: 16, knots: 2, minY: 3, maxY: 10, startY: 9, endY: 7, solution: [8.25, 7.75] },
      { x0: 32, x1: 42, knots: 3, minY: 0, maxY: 5, startY: 3, endY: 1, solution: [2.5, 2, 1.5] },
    ],
    shards: [
      { x: 2.5, y: 9.50 },
      { x: 8, y: 8.87 },
      { x: 12, y: 8.30 },
      { x: 18, y: 7.50 },
      { x: 30, y: 3.50 },
      { x: 36, y: 2.70 },
      { x: 40, y: 1.90 },
      { x: 46, y: 1.50 },
      { x: 52, y: 1.50 },
    ],
    canonical: { goalX: 58.5, coast: [], hops: [] },
    portals: [{ a: 20, b: 28 }],
  },
  '5-6': {
    id: '5-6', zone: 5, name: 'The Climb', cardId: 'z5-2',
    goal: 'Climb through the door with speed.', coach: 'Arrive very fast.',
    terrain: [
      { kind: 'ramp', p: [0, 9], x0: 0, x1: 5 },
      { kind: 'ramp', p: [0, 2], x0: 24, x1: 28 },
      { kind: 'ramp', p: [0, 5], x0: 36, x1: 40 },
      { kind: 'ramp', p: [0, 1], x0: 46, x1: 62 },
    ],
    shape: [
      { x0: 5, x1: 24, knots: 3, minY: 1, maxY: 10, startY: 9, endY: 2, solution: [7.25, 5.5, 3.75] },
      { x0: 40, x1: 46, knots: 2, minY: 0, maxY: 7, startY: 5, endY: 1, solution: [3.75, 2.25] },
    ],
    shards: [
      { x: 2.5, y: 9.50 },
      { x: 9, y: 8.03 },
      { x: 14, y: 6.18 },
      { x: 19, y: 4.34 },
      { x: 26, y: 2.50 },
      { x: 36, y: 5.50 },
      { x: 38, y: 5.50 },
      { x: 44, y: 2.75 },
      { x: 52, y: 1.50 },
    ],
    canonical: { goalX: 60.5, coast: [], hops: [] },
    portals: [{ a: 28, b: 36 }],
  },
  '5-7': {
    id: '5-7', zone: 5, name: 'Exact Change', cardId: 'z5-2',
    goal: 'Trade exactly through the door.', coach: 'Match the trade.',
    terrain: [
      { kind: 'ramp', p: [0, 10], x0: 0, x1: 5 },
      { kind: 'ramp', p: [0, 5], x0: 22, x1: 26 },
      { kind: 'ramp', p: [0, 8], x0: 34, x1: 38 },
      { kind: 'ramp', p: [0, 1], x0: 46, x1: 62 },
    ],
    shape: [
      { x0: 5, x1: 22, knots: 3, minY: 2, maxY: 11, startY: 10, endY: 5, solution: [8.75, 7.5, 6.25] },
      { x0: 38, x1: 46, knots: 3, minY: 0, maxY: 9, startY: 8, endY: 1, solution: [6.25, 4.5, 2.75] },
    ],
    shards: [
      { x: 2.5, y: 10.50 },
      { x: 9, y: 9.32 },
      { x: 13, y: 8.15 },
      { x: 17, y: 6.97 },
      { x: 24, y: 5.50 },
      { x: 30, y: 7.75, air: true },
      { x: 36, y: 8.50 },
      { x: 42, y: 5.00 },
      { x: 52, y: 1.50 },
    ],
    canonical: { goalX: 60.5, coast: [], hops: [] },
    portals: [{ a: 26, b: 34 }],
  },
  '5-8': {
    id: '5-8', zone: 5, name: 'Bank Before', cardId: 'z5-2',
    goal: 'Shape speed before the door.', coach: 'Speed buys height.',
    terrain: [
      { kind: 'ramp', p: [0, 9], x0: 0, x1: 5 },
      { kind: 'ramp', p: [0, 3], x0: 20, x1: 24 },
      { kind: 'ramp', p: [0, -1], x0: 32, x1: 54 },
    ],
    shape: [
      { x0: 5, x1: 20, knots: 3, minY: 1, maxY: 10, startY: 9, endY: 3, solution: [7.5, 6, 4.5] },
      { x0: 32, x1: 46, knots: 3, minY: -4, maxY: 4, startY: -1, endY: -1, solution: [-1, -1, -1] },
    ],
    shards: [
      { x: 2.5, y: 9.50 },
      { x: 8, y: 8.30 },
      { x: 12, y: 6.70 },
      { x: 16, y: 5.10 },
      { x: 22, y: 3.50 },
      { x: 34, y: -0.50 },
      { x: 40, y: -0.50 },
      { x: 52, y: -0.50 },
    ],
    canonical: { goalX: 52.5, coast: [], hops: [] },
    portals: [{ a: 24, b: 32 }],
  },
  '5-9': {
    id: '5-9', zone: 5, name: 'The Final Door', cardId: 'z5-3', finale: true,
    goal: 'Shape through the final door.', coach: 'Bank big, trade up.',
    terrain: [
      { kind: 'ramp', p: [0, 11], x0: 0, x1: 5 },
      { kind: 'ramp', p: [0, 4], x0: 22, x1: 26 },
      { kind: 'ramp', p: [0, 0], x0: 34, x1: 66 },
    ],
    shape: [
      { x0: 5, x1: 22, knots: 4, minY: 1, maxY: 12, startY: 11, endY: 4, solution: [9.5, 8.25, 6.75, 5.5] },
      { x0: 34, x1: 48, knots: 3, minY: -2, maxY: 5, startY: 0, endY: 0, solution: [0, 0, 0] },
    ],
    shards: [
      { x: 2.5, y: 11.50 },
      { x: 9, y: 9.77 },
      { x: 13, y: 8.23 },
      { x: 17, y: 6.59 },
      { x: 21, y: 4.95 },
      { x: 24, y: 4.50 },
      { x: 36, y: 0.50 },
      { x: 42, y: 0.50 },
      { x: 54, y: 0.50 },
    ],
    canonical: { goalX: 64.5, coast: [], hops: [] },
    portals: [{ a: 26, b: 34 }],
  },
  '6-1': {
    id: '6-1', zone: 6, name: 'The Wind Rule', cardId: 'z6-1',
    goal: 'Wind climbs the hill you draw.', coach: 'Write the wind.',
    terrain: [
      { kind: 'ramp', p: [0, 10.8], x0: 30, x1: 44 },
    ],
    shape: [
      { x0: 8, x1: 30, knots: 4, minY: 2, maxY: 11.5, startY: 2, endY: 10.8, solution: [3.75, 5.5, 7.25, 9] },
    ],
    shards: [
      { x: 12.4, y: 4.25 },
      { x: 16.8, y: 6.00 },
      { x: 21.2, y: 7.75 },
      { x: 25.6, y: 9.50 },
      { x: 34, y: 11.30 },
      { x: 38, y: 11.30 },
    ],
    canonical: { goalX: 42.5, coast: [], hops: [] },
    ruleSpec: { wind: { range: [0.5, 3], solvable: 2 } },
    spawnX: 8,
  },
  '6-2': {
    id: '6-2', zone: 6, name: 'Wind Hill', cardId: 'z6-1',
    goal: 'Draw a hill the wind climbs.', coach: 'Wind beats the climb.',
    terrain: [
      { kind: 'ramp', p: [0, 1], x0: 0, x1: 6 },
      { kind: 'ramp', p: [0, 12], x0: 32, x1: 50 },
    ],
    shape: [
      { x0: 6, x1: 32, knots: 4, minY: 0, maxY: 14, startY: 1, endY: 12, solution: [3.25, 5.5, 7.5, 9.75] },
    ],
    shards: [
      { x: 3, y: 1.50 },
      { x: 12, y: 4.10 },
      { x: 17, y: 6.24 },
      { x: 22, y: 8.16 },
      { x: 27, y: 10.34 },
      { x: 36, y: 12.50 },
      { x: 42, y: 12.50 },
    ],
    canonical: { goalX: 48.5, coast: [], hops: [] },
    ruleSpec: { wind: { range: [1, 3], solvable: 2 } },
  },
  '6-3': {
    id: '6-3', zone: 6, name: 'Wind Climb', cardId: 'z6-1',
    goal: 'Shape a climb the wind pushes.', coach: 'Wind is constant.',
    terrain: [
      { kind: 'ramp', p: [0, 2], x0: 0, x1: 6 },
      { kind: 'ramp', p: [0, 13], x0: 34, x1: 52 },
    ],
    shape: [
      { x0: 6, x1: 34, knots: 4, minY: 1, maxY: 14, startY: 2, endY: 13, solution: [4.25, 6.5, 8.5, 10.75] },
    ],
    shards: [
      { x: 3, y: 2.50 },
      { x: 11, y: 4.51 },
      { x: 16, y: 6.53 },
      { x: 21, y: 8.35 },
      { x: 26, y: 10.27 },
      { x: 36, y: 13.50 },
      { x: 42, y: 13.50 },
    ],
    canonical: { goalX: 50.5, coast: [], hops: [] },
    ruleSpec: { wind: { range: [1, 3], solvable: 2.5 } },
  },
  '6-4': {
    id: '6-4', zone: 6, name: 'Wind Flat', cardId: 'z6-1',
    goal: 'Wind pushes you up the line.', coach: 'Wind fights the hill.',
    terrain: [
      { kind: 'ramp', p: [0, 2], x0: 0, x1: 6 },
      { kind: 'ramp', p: [0, 13.5], x0: 34, x1: 58 },
    ],
    shape: [
      { x0: 6, x1: 34, knots: 4, minY: 0, maxY: 14, startY: 2, endY: 13.5, solution: [4.25, 6.5, 9, 11.25] },
    ],
    shards: [
      { x: 3, y: 2.50 },
      { x: 12, y: 4.91 },
      { x: 17, y: 6.92 },
      { x: 22, y: 9.15 },
      { x: 27, y: 11.19 },
      { x: 36, y: 14.00 },
      { x: 44, y: 14.00 },
    ],
    canonical: { goalX: 56.5, coast: [], hops: [] },
    ruleSpec: { wind: { range: [1, 3], solvable: 2.5 } },
  },
  '6-5': {
    id: '6-5', zone: 6, name: 'The Spring', cardId: 'z6-2',
    goal: 'Spring pulls you up the hill.', coach: 'Spring climbs the hill.',
    terrain: [
      { kind: 'ramp', p: [0, 1], x0: 0, x1: 6 },
      { kind: 'ramp', p: [0, 13], x0: 30, x1: 48 },
    ],
    shape: [
      { x0: 6, x1: 30, knots: 4, minY: 0, maxY: 14, startY: 1, endY: 13, solution: [3.5, 5.75, 8.25, 10.5] },
    ],
    shards: [
      { x: 3, y: 1.50 },
      { x: 10, y: 3.60 },
      { x: 15, y: 5.96 },
      { x: 20, y: 8.55 },
      { x: 25, y: 10.90 },
      { x: 34, y: 13.50 },
      { x: 40, y: 13.50 },
    ],
    canonical: { goalX: 46.5, coast: [], hops: [] },
    ruleSpec: { spring: { range: [0.5, 2], x0: 40, solvable: 1.5 } },
  },
  '6-6': {
    id: '6-6', zone: 6, name: 'Spring Pull', cardId: 'z6-2',
    goal: 'Spring pulls you up the bowl.', coach: 'Pull beats the slope.',
    terrain: [
      { kind: 'ramp', p: [0, 2], x0: 0, x1: 6 },
      { kind: 'ramp', p: [0, 13], x0: 32, x1: 52 },
    ],
    shape: [
      { x0: 6, x1: 32, knots: 4, minY: 0, maxY: 14, startY: 2, endY: 13, solution: [4.25, 6.5, 8.5, 10.75] },
    ],
    shards: [
      { x: 3, y: 2.50 },
      { x: 10, y: 4.23 },
      { x: 15, y: 6.41 },
      { x: 20, y: 8.37 },
      { x: 25, y: 10.46 },
      { x: 36, y: 13.50 },
      { x: 44, y: 13.50 },
    ],
    canonical: { goalX: 50.5, coast: [], hops: [] },
    ruleSpec: { spring: { range: [0.5, 2], x0: 45, solvable: 1.5 } },
  },
  '6-7': {
    id: '6-7', zone: 6, name: 'Wind Gap', cardId: 'z6-2',
    goal: 'Wind carries you over the gap.', coach: 'Climb, then leap.',
    terrain: [
      { kind: 'ramp', p: [0, 1], x0: 0, x1: 6 },
      { kind: 'ramp', p: [0.75, -12], x0: 28, x1: 32 },
      { kind: 'ramp', p: [0, 7], x0: 44, x1: 58 },
    ],
    shape: [
      { x0: 6, x1: 28, knots: 4, minY: 0, maxY: 14, startY: 1, endY: 9, solution: [2.5, 4.25, 5.75, 7.5] },
    ],
    shards: [
      { x: 3, y: 1.50 },
      { x: 11, y: 3.23 },
      { x: 16, y: 5.17 },
      { x: 21, y: 6.96 },
      { x: 26, y: 8.83 },
      { x: 30, y: 11.00 },
      { x: 38, y: 9.00, air: true },
      { x: 48, y: 7.50 },
    ],
    canonical: { goalX: 56.5, coast: [[32, 44]], hops: [] },
    ruleSpec: { wind: { range: [1, 3], solvable: 2 } },
  },
  '6-8': {
    id: '6-8', zone: 6, name: 'Spring Bowl', cardId: 'z6-2',
    goal: 'Spring pushes you up the bowl.', coach: 'Spring fills the bowl.',
    terrain: [
      { kind: 'ramp', p: [0, 2], x0: 0, x1: 5 },
      { kind: 'ramp', p: [0, 12], x0: 30, x1: 50 },
    ],
    shape: [
      { x0: 5, x1: 30, knots: 4, minY: 0, maxY: 14, startY: 2, endY: 12, solution: [4, 6, 8, 10] },
    ],
    shards: [
      { x: 2.5, y: 2.50 },
      { x: 10, y: 4.50 },
      { x: 15, y: 6.50 },
      { x: 20, y: 8.50 },
      { x: 25, y: 10.50 },
      { x: 34, y: 12.50 },
      { x: 40, y: 12.50 },
    ],
    canonical: { goalX: 48.5, coast: [], hops: [] },
    ruleSpec: { spring: { range: [0.5, 2], x0: 35, solvable: 1.5 } },
  },
  '6-9': {
    id: '6-9', zone: 6, name: 'The Perfect Rule', cardId: 'z6-3', finale: true,
    goal: 'Shape for wind and spring.', coach: 'Climb hard, leap far.',
    terrain: [
      { kind: 'ramp', p: [0, 1], x0: 0, x1: 6 },
      { kind: 'ramp', p: [0.75, -9], x0: 24, x1: 28 },
      { kind: 'ramp', p: [0, 7], x0: 44, x1: 66 },
    ],
    shape: [
      { x0: 6, x1: 24, knots: 5, minY: 0, maxY: 14, startY: 1, endY: 9, solution: [2.25, 3.75, 5, 6.25, 7.75] },
    ],
    shards: [
      { x: 3, y: 1.50 },
      { x: 10, y: 3.24 },
      { x: 14, y: 5.09 },
      { x: 18, y: 6.75 },
      { x: 22, y: 8.69 },
      { x: 26, y: 11.00 },
      { x: 34, y: 9.00, air: true },
      { x: 52, y: 7.50 },
      { x: 58, y: 7.50 },
    ],
    canonical: { goalX: 64.5, coast: [[28, 44]], hops: [] },
    ruleSpec: { wind: { range: [1.5, 3], solvable: 2.5 } },
  },
}

/** the solvable rule for a level as a MotionRule (defaults = solvable witness) */
export function solvableRule(lvl: SRLevel): MotionRule | undefined {
  if (!lvl.ruleSpec) return undefined
  const r: MotionRule = {}
  if (lvl.ruleSpec.wind) r.windK = lvl.ruleSpec.wind.solvable
  if (lvl.ruleSpec.spring) {
    r.springK = lvl.ruleSpec.spring.solvable
    r.springX0 = lvl.ruleSpec.spring.x0
  }
  return r
}

/* ---------- stars (design §3: no timers, no flow gates) ---------- */
export function starsForLight(finished: boolean, got: number, total: number): number {
  if (!finished) return 0
  if (total > 0 && got >= total) return 3
  if (total === 0 || got / total >= 0.7) return 2
  return 1
}

/* ---------- boss (design §6) ---------- */
export interface BossRidge {
  name: string
  coach: string
  terrain: Seg[]
  shards: Shard[]
  canonical: CanonicalLine
  portals?: Portal[]
  rule?: MotionRule
}

export interface BossDef {
  /** wall starts this many u/s under rider speed */
  wallStartOffset: number
  /** wall speed gain per ridge */
  wallGainPerRidge: number
  /** rewind setback on catch */
  rewindSetback: number
  ridges: BossRidge[]
}

export const BOSS: BossDef = {
  wallStartOffset: 2,
  wallGainPerRidge: 0.5,
  rewindSetback: 6,
  ridges: [
    {
      name: 'The Perfect Rule',
      coach: 'Stay low, stay fast.',
      terrain: [
        { kind: 'sine', p: [2, 0.3, 3.1415926536, 5], x0: 0, x1: 30 },
        { kind: 'ramp', p: [-0.25, 11.6757630295], x0: 30, x1: 50 },
      ],
      shards: [
        { x: 1.5, y: 4.6300689318 }, { x: 3.5, y: 3.7651535488 }, { x: 17, y: 7.3516293647 },
        { x: 19, y: 6.6013710852 }, { x: 21, y: 5.466372199 }, { x: 23, y: 4.3431204712 },
        { x: 25, y: 3.6240000465 }, { x: 33, y: 3.9257630295 }, { x: 39, y: 2.4257630295 },
        { x: 45, y: 0.9257630295 },
      ],
      canonical: { goalX: 48.5, coast: [], hops: [] },
    },
    {
      name: 'The Perfect Rule',
      coach: 'Bank height before doors.',
      terrain: [
        { kind: 'ramp', p: [-0.2, 8], x0: 0, x1: 15 },
        { kind: 'ramp', p: [-0.2, 11], x0: 22, x1: 36 },
        { kind: 'ramp', p: [-0.3, 17.8], x0: 44, x1: 58 },
      ],
      shards: [
        { x: 3, y: 7.9 }, { x: 7, y: 7.1 }, { x: 11, y: 6.3 }, { x: 24, y: 6.7 },
        { x: 28, y: 5.9 }, { x: 33, y: 4.9 }, { x: 46, y: 4.5 }, { x: 52, y: 2.7 },
      ],
      portals: [{ a: 15, b: 22 }, { a: 36, b: 44 }],
      canonical: { goalX: 56.5, coast: [], hops: [] },
    },
    {
      name: 'The Perfect Rule',
      coach: 'Let the spring pull.',
      terrain: [
        { kind: 'sine', p: [1.5, 0.25, 0, 5], x0: 0, x1: 40 },
        { kind: 'ramp', p: [-0.2, 12.1839683336], x0: 40, x1: 56 },
      ],
      shards: [
        { x: 3, y: 6.52245814 }, { x: 8, y: 6.8639461402 }, { x: 13, y: 5.3377072982 },
        { x: 18, y: 4.0337048235 }, { x: 23, y: 4.7375813838 }, { x: 30, y: 6.9069999652 },
        { x: 44, y: 3.8839683336 }, { x: 50, y: 2.6839683336 },
      ],
      rule: { springK: 1.2, springX0: 50 },
      canonical: { goalX: 54.5, coast: [], hops: [] },
    },
  ],
}

/* ---------- result payload (series shape, consumed by Results.tsx) ---------- */

export interface ResultPayload {
  levelId: string
  chapter: number
  levelName: string
  stars: number
  lightGot: number
  lightTotal: number
  xpEarned: number
  gearsEarned: number
  firstClear: boolean
  cardId?: string
  cardDuplicate?: boolean
  chapterComplete?: boolean
  nextLevelId: string | null
  boss?: boolean
  tryAgain?: boolean
  coachLine?: string
  xpBefore: number
  xpAfter: number
  /** the exact curve the player cleared with (design v3 §8 "your line") */
  lineSegs?: Seg[]
}

const RESULT_KEY = 'slope-rider-result-v1'

export function saveResult(p: ResultPayload): void {
  try {
    sessionStorage.setItem(RESULT_KEY, JSON.stringify(p))
  } catch {
    /* private mode — results falls back gracefully */
  }
}

export function loadResult(): ResultPayload | null {
  try {
    const raw = sessionStorage.getItem(RESULT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ResultPayload
  } catch {
    return null
  }
}

/* ---------- mid-level resume ---------- */
const MID_KEY = 'slope-rider-midlevel-v1'

export function saveMidLevel(levelId: string, data: unknown): void {
  try {
    sessionStorage.setItem(MID_KEY, JSON.stringify({ levelId, data }))
  } catch {
    /* no-op */
  }
}

export function loadMidLevel(levelId: string): unknown | null {
  try {
    const raw = sessionStorage.getItem(MID_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { levelId: string; data: unknown }
    return parsed.levelId === levelId ? parsed.data : null
  } catch {
    return null
  }
}

export function clearMidLevel(): void {
  try {
    sessionStorage.removeItem(MID_KEY)
  } catch {
    /* no-op */
  }
}
