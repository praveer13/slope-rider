import type { Seg, Portal, Shard, MotionRule } from './calculus'

/**
 * SLOPE RIDER level data contracts — main-owned types.
 * ChromeBuild populates LEVELS values under design §4 constraints.
 * BOSS authored by main (integration).
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

/** witness input script the harness simulates (design §4) */
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
  terrain: Seg[]
  shards: Shard[]
  canonical: CanonicalLine
  portals?: Portal[]
  ruleSpec?: RuleSpec
  /** spawn x (default 0, grounded on terrain) */
  spawnX?: number
}

export const LEVELS: Record<string, SRLevel> = {
  '1-1': { id: '1-1', zone: 1, name: "First Push", goal: "Ride the slope to the gate.", coach: "Hold to carve.", cardId: 'z1-1', terrain: [{ kind: 'ramp', p: [-0.15, 6], x0: 0, x1: 30 }, { kind: 'ramp', p: [0, 1.5], x0: 30, x1: 40 }], shards: [{ x: 8.0, y: 5.3 }, { x: 16.0, y: 4.1 }, { x: 24.0, y: 2.9 }, { x: 32.0, y: 2.0 }], canonical: { goalX: 38.5, coast: [], hops: [] }, spawnX: 0 },
  '1-2': { id: '1-2', zone: 1, name: "Let Go", goal: "Release over the gap.", coach: "Release to fly.", cardId: 'z1-1', terrain: [{ kind: 'ramp', p: [-0.25, 7], x0: 0, x1: 20 }, { kind: 'ramp', p: [0.15, 0], x0: 26, x1: 46 }], shards: [{ x: 6.667, y: 5.833 }, { x: 13.333, y: 4.167 }, { x: 20.0, y: 2.5 }, { x: 32.667, y: 5.4 }, { x: 39.333, y: 6.4 }], canonical: { goalX: 44.5, coast: [[20, 26]], hops: [] }, spawnX: 0 },
  '1-3': { id: '1-3', zone: 1, name: "Uphill Cost", goal: "Carry speed through the uphill.", coach: "Uphill eats speed.", cardId: 'z1-1', terrain: [{ kind: 'ramp', p: [-0.2, 8], x0: 0, x1: 20 }, { kind: 'ramp', p: [0.1, 2], x0: 20, x1: 40 }], shards: [{ x: 6.667, y: 7.167 }, { x: 13.333, y: 5.833 }, { x: 20.0, y: 4.5 }, { x: 26.667, y: 5.167 }, { x: 33.333, y: 5.833 }], canonical: { goalX: 38.5, coast: [], hops: [] }, spawnX: 0 },
  '1-4': { id: '1-4', zone: 1, name: "Little Hop", goal: "Hop to the flying light.", coach: "Tap low to hop.", cardId: 'z1-2', terrain: [{ kind: 'ramp', p: [-0.15, 6], x0: 0, x1: 18 }, { kind: 'ramp', p: [0, 3.3], x0: 18, x1: 26 }, { kind: 'ramp', p: [-0.1, 5.9], x0: 26, x1: 44 }], shards: [{ x: 8.8, y: 5.18 }, { x: 14.667, y: 5.8, air: true }, { x: 17.6, y: 3.86 }, { x: 26.4, y: 3.76 }, { x: 29.333, y: 4.967, air: true }, { x: 35.2, y: 2.88 }], canonical: { goalX: 42.5, coast: [], hops: [14.667, 29.333] }, spawnX: 0 },
  '1-5': { id: '1-5', zone: 1, name: "Two Hills", goal: "Read both hills.", coach: "Read the steepness.", cardId: 'z1-2', terrain: [{ kind: 'sine', p: [1.5, 0.35, 0, 4], x0: 0, x1: 36 }, { kind: 'ramp', p: [0, 4.0504345708], x0: 36, x1: 44 }], shards: [{ x: 6.286, y: 5.713 }, { x: 12.571, y: 3.073 }, { x: 18.857, y: 3.014 }, { x: 25.143, y: 5.573 }, { x: 31.429, y: 5.486 }, { x: 38.857, y: 4.55 }], canonical: { goalX: 42.5, coast: [], hops: [] }, spawnX: 0 },
  '1-6': { id: '1-6', zone: 1, name: "Flat Means Flat", goal: "Use the flat run.", coach: "Flat keeps speed.", cardId: 'z1-2', terrain: [{ kind: 'ramp', p: [0, 5], x0: 0, x1: 10 }, { kind: 'ramp', p: [-0.2, 7], x0: 10, x1: 30 }, { kind: 'ramp', p: [0, 1], x0: 30, x1: 42 }], shards: [{ x: 6.0, y: 5.5 }, { x: 12.0, y: 5.6 }, { x: 18.0, y: 4.6 }, { x: 24.0, y: 3.6 }, { x: 30.0, y: 2.6 }, { x: 36.0, y: 2.5 }], canonical: { goalX: 40.5, coast: [], hops: [] }, spawnX: 0 },
  '1-7': { id: '1-7', zone: 1, name: "Long Flight", goal: "Launch far from the steep.", coach: "Steep launch, far flight.", cardId: 'z1-3', terrain: [{ kind: 'ramp', p: [-0.3, 9], x0: 0, x1: 18 }, { kind: 'ramp', p: [0.2, -1.4], x0: 26, x1: 46 }], shards: [{ x: 7.6, y: 7.22 }, { x: 15.2, y: 4.94 }, { x: 20.0, y: 2.087, air: true }, { x: 22.0, y: -0.353, air: true }, { x: 24.0, y: -4.018, air: true }, { x: 30.8, y: 5.26 }, { x: 38.4, y: 6.78 }], canonical: { goalX: 44.5, coast: [[18, 26]], hops: [] }, spawnX: 0 },
  '1-8': { id: '1-8', zone: 1, name: "First Gauntlet", goal: "Chain carve and coast.", coach: "Carve, coast, carve.", cardId: 'z1-3', terrain: [{ kind: 'sine', p: [1, 0.3, 0, 5], x0: 0, x1: 22 }, { kind: 'ramp', p: [-0.2, 9.7115413635], x0: 22, x1: 34 }, { kind: 'ramp', p: [0.1, -0.4884586365], x0: 34, x1: 48 }], shards: [{ x: 6.286, y: 5.809 }, { x: 12.571, y: 4.47 }, { x: 18.857, y: 5.174 }, { x: 25.143, y: 5.437 }, { x: 31.429, y: 3.776 }, { x: 38.286, y: 2.84 }, { x: 44.0, y: 3.17 }], canonical: { goalX: 46.5, coast: [], hops: [] }, spawnX: 0 },
  '1-9': { id: '1-9', zone: 1, name: "The Big Hill", goal: "Climb the big hill.", coach: "One big read.", finale: true, cardId: 'z1-3', terrain: [{ kind: 'ramp', p: [-0.12, 8], x0: 0, x1: 25 }, { kind: 'sine', p: [2, 0.25, 0, 5.0663584331], x0: 25, x1: 55 }, { kind: 'ramp', p: [0, 6.9183233187], x0: 55, x1: 64 }], shards: [{ x: 7.111, y: 7.746 }, { x: 14.222, y: 6.895 }, { x: 21.333, y: 5.44 }, { x: 28.444, y: 6.816 }, { x: 35.556, y: 7.066 }, { x: 42.667, y: 4.984 }, { x: 49.778, y: 5.805 }, { x: 56.0, y: 7.419 }, { x: 60.0, y: 7.419 }, { x: 62.0, y: 7.419 }], canonical: { goalX: 62.5, coast: [], hops: [] }, spawnX: 0 },
  '2-1': { id: '2-1', zone: 2, name: "The Number", goal: "Watch the slope number grow.", coach: "Steeper down, more go.", cardId: 'z2-1', terrain: [{ kind: 'ramp', p: [-0.1, 6], x0: 0, x1: 15 }, { kind: 'ramp', p: [-0.3, 9], x0: 15, x1: 25 }, { kind: 'ramp', p: [-0.6, 16.5], x0: 25, x1: 32 }, { kind: 'ramp', p: [0, -2.7], x0: 32, x1: 42 }], shards: [{ x: 7.0, y: 5.8 }, { x: 14.0, y: 5.1 }, { x: 20.0, y: 3.9 }, { x: 26.5, y: 1.2 }, { x: 33.5, y: -1.05 }, { x: 38.5, y: -1.35 }], canonical: { goalX: 40.5, coast: [], hops: [] }, spawnX: 0 },
  '2-2': { id: '2-2', zone: 2, name: "Sign Language", goal: "Follow the sign changes.", coach: "Minus goes down.", cardId: 'z2-1', terrain: [{ kind: 'ramp', p: [0.3, 0], x0: 0, x1: 12 }, { kind: 'ramp', p: [-0.3, 7.2], x0: 12, x1: 30 }, { kind: 'ramp', p: [0, -1.8], x0: 30, x1: 40 }], shards: [{ x: 6.667, y: 3.167 }, { x: 13.333, y: 3.6 }, { x: 20.0, y: 1.8 }, { x: 26.667, y: 0.0 }, { x: 33.333, y: -0.6 }, { x: 37.333, y: -1.05 }], canonical: { goalX: 38.5, coast: [], hops: [] }, spawnX: 0 },
  '2-3': { id: '2-3', zone: 2, name: "Gentle vs Wild", goal: "Compare gentle and wild.", coach: "Same drop, different hill.", cardId: 'z2-1', terrain: [{ kind: 'ramp', p: [-0.05, 5], x0: 0, x1: 20 }, { kind: 'ramp', p: [-0.5, 14], x0: 20, x1: 30 }, { kind: 'ramp', p: [0, -1], x0: 30, x1: 42 }], shards: [{ x: 7.0, y: 5.15 }, { x: 14.0, y: 4.8 }, { x: 21.0, y: 3.5 }, { x: 25.0, y: 1.5 }, { x: 32.0, y: -0.2 }, { x: 37.0, y: -0.45 }, { x: 40.5, y: -0.6 }], canonical: { goalX: 40.5, coast: [], hops: [] }, spawnX: 0 },
  '2-4': { id: '2-4', zone: 2, name: "Speed Limit", goal: "Feel the speed limit.", coach: "Push changes where steep.", cardId: 'z2-2', terrain: [{ kind: 'sine', p: [2, 0.4, 0, 5], x0: 0, x1: 32 }, { kind: 'ramp', p: [0, 5.4630196502], x0: 32, x1: 42 }], shards: [{ x: 5.333, y: 5.82 }, { x: 10.667, y: 3.65 }, { x: 16.0, y: 4.22 }, { x: 21.333, y: 6.82 }, { x: 26.667, y: 5.78 }, { x: 32.0, y: 5.963 }, { x: 37.0, y: 5.463 }], canonical: { goalX: 40.5, coast: [], hops: [] }, spawnX: 0 },
  '2-5': { id: '2-5', zone: 2, name: "The SlopeChip", goal: "Track the slope chip.", coach: "Watch the number change.", cardId: 'z2-2', terrain: [{ kind: 'poly2', p: [-0.01, -0.05, 4.5], x0: 0, x1: 30 }, { kind: 'ramp', p: [0, -6], x0: 30, x1: 42 }], shards: [{ x: 5.714, y: 4.464 }, { x: 11.429, y: 3.513 }, { x: 17.143, y: 2.304 }, { x: 22.857, y: 1.169 }, { x: 28.571, y: 0.265 }, { x: 34.0, y: -4.8 }, { x: 38.0, y: -4.8 }, { x: 40.0, y: -4.8 }], canonical: { goalX: 40.5, coast: [], hops: [] }, spawnX: 0 },
  '2-6': { id: '2-6', zone: 2, name: "Switchbacks", goal: "Flip signs, keep flow.", coach: "Flip signs, keep flow.", cardId: 'z2-2', terrain: [{ kind: 'ramp', p: [-0.4, 8], x0: 0, x1: 10 }, { kind: 'ramp', p: [0.4, 0], x0: 10, x1: 20 }, { kind: 'ramp', p: [-0.4, 16], x0: 20, x1: 30 }, { kind: 'ramp', p: [0.3, -5], x0: 30, x1: 40 }, { kind: 'ramp', p: [0, 7], x0: 40, x1: 46 }], shards: [{ x: 5.0, y: 6.5 }, { x: 10.0, y: 4.5 }, { x: 15.0, y: 7.5 }, { x: 20.0, y: 8.5 }, { x: 25.0, y: 6.5 }, { x: 30.0, y: 4.0 }, { x: 35.0, y: 5.5 }, { x: 42.5, y: 7.5 }], canonical: { goalX: 44.5, coast: [], hops: [] }, spawnX: 0 },
  '2-7': { id: '2-7', zone: 2, name: "Curvy Steep", goal: "Steep on curves.", coach: "Steep moves on curves.", cardId: 'z2-3', terrain: [{ kind: 'sine', p: [2.5, 0.5, 0, 6], x0: 0, x1: 26 }, { kind: 'ramp', p: [-0.2, 12.2504175921], x0: 26, x1: 40 }], shards: [{ x: 5.2, y: 6.827 }, { x: 10.4, y: 3.748 }, { x: 15.6, y: 6.828 }, { x: 20.8, y: 5.934 }, { x: 23.0, y: 8.25, air: true }, { x: 25.0, y: 9.54, air: true }, { x: 31.0, y: 6.15 }, { x: 37.0, y: 4.95 }], canonical: { goalX: 38.5, coast: [], hops: [23.0, 25.0] }, spawnX: 0 },
  '2-8': { id: '2-8', zone: 2, name: "Reading Gauntlet", goal: "Read the gauntlet.", coach: "Number shows steepness.", cardId: 'z2-3', terrain: [{ kind: 'poly2', p: [0.01, -0.5, 9], x0: 0, x1: 25 }, { kind: 'sine', p: [1.5, 0.4, 0, 3.5660316663], x0: 25, x1: 45 }], shards: [{ x: 5.0, y: 7.75 }, { x: 10.0, y: 5.0 }, { x: 15.0, y: 3.75 }, { x: 20.0, y: 4.0 }, { x: 25.0, y: 3.566 }, { x: 30.0, y: 5.99 }, { x: 35.0, y: 4.226 }, { x: 40.0, y: 5.07 }, { x: 43.0, y: 3.871 }], canonical: { goalX: 43.5, coast: [], hops: [] }, spawnX: 0 },
  '2-9': { id: '2-9', zone: 2, name: "Steepest Descent", goal: "Take the steepest descent.", coach: "Steepest wins.", finale: true, cardId: 'z2-3', terrain: [{ kind: 'ramp', p: [-0.08, 8], x0: 0, x1: 12 }, { kind: 'poly2', p: [-0.005, 0, 7.76], x0: 12, x1: 40 }, { kind: 'ramp', p: [-0.6, 23.76], x0: 40, x1: 48 }, { kind: 'ramp', p: [0, -5.04], x0: 48, x1: 58 }], shards: [{ x: 6.0, y: 7.52 }, { x: 12.0, y: 7.04 }, { x: 18.0, y: 6.14 }, { x: 24.0, y: 4.88 }, { x: 30.0, y: 3.26 }, { x: 36.0, y: 1.28 }, { x: 42.0, y: -1.44 }, { x: 44.0, y: -2.64 }, { x: 50.0, y: -4.04 }, { x: 54.0, y: -4.04 }], canonical: { goalX: 56.5, coast: [], hops: [] }, spawnX: 0 },
  '3-1': { id: '3-1', zone: 3, name: "The Flat Top", goal: "Launch from the flat top.", coach: "Flat top, big launch.", cardId: 'z3-1', terrain: [{ kind: 'poly2', p: [-0.03, 1.2, -5], x0: 0, x1: 20 }, { kind: 'ramp', p: [-0.2, 11], x0: 20, x1: 38 }], shards: [{ x: 6.667, y: 1.467 }, { x: 13.333, y: 3.533 }, { x: 20.0, y: 7.5 }, { x: 26.0, y: 5.9 }, { x: 32.0, y: 4.7 }, { x: 36.0, y: 3.9 }], canonical: { goalX: 36.5, coast: [], hops: [] }, spawnX: 0 },
  '3-2': { id: '3-2', zone: 3, name: "Valley Floor", goal: "Slingshot from the bottom.", coach: "Bottoms slingshot.", cardId: 'z3-1', terrain: [{ kind: 'poly2', p: [0.04, -1.6, 14], x0: 0, x1: 20 }, { kind: 'ramp', p: [0.2, -6], x0: 20, x1: 38 }], shards: [{ x: 6.667, y: 9.378 }, { x: 13.333, y: 5.244 }, { x: 20.0, y: -2.0 }, { x: 26.0, y: -0.8 }, { x: 32.0, y: 0.4 }, { x: 36.0, y: 1.2 }], canonical: { goalX: 36.5, coast: [], hops: [] }, spawnX: 0 },
  '3-3': { id: '3-3', zone: 3, name: "Top Then Drop", goal: "Crest, then fly.", coach: "Crest, then fly.", cardId: 'z3-1', terrain: [{ kind: 'sine', p: [2, 0.3, 0, 5], x0: 0, x1: 21 }, { kind: 'ramp', p: [-0.35, 12.383627801], x0: 21, x1: 40 }], shards: [{ x: 8.0, y: 6.851 }, { x: 10.0, y: 7.282, air: true }, { x: 16.0, y: 3.508 }, { x: 20.0, y: 6.441, air: true }, { x: 24.0, y: 4.484 }, { x: 30.0, y: 3.884, air: true }, { x: 32.0, y: 1.684 }], canonical: { goalX: 38.5, coast: [], hops: [10.0, 20.0, 30.0] }, spawnX: 0 },
  '3-4': { id: '3-4', zone: 3, name: "Double Dip", goal: "Ride both dips.", coach: "Two bottoms, two boosts.", cardId: 'z3-2', terrain: [{ kind: 'sine', p: [1.5, 0.5, 0, 4], x0: 0, x1: 25 }, { kind: 'ramp', p: [0, 3.900517154], x0: 25, x1: 34 }], shards: [{ x: 5.0, y: 5.5 }, { x: 10.0, y: 2.51 }, { x: 15.0, y: 5.5 }, { x: 20.0, y: 2.51 }, { x: 25.0, y: 4.401 }, { x: 28.0, y: 3.901 }, { x: 32.0, y: 3.901 }], canonical: { goalX: 32.5, coast: [], hops: [] }, spawnX: 0 },
  '3-5': { id: '3-5', zone: 3, name: "Apex Slow-Mo", goal: "Float at the apex.", coach: "Float at the top.", cardId: 'z3-2', terrain: [{ kind: 'poly2', p: [-0.025, 1, -5], x0: 0, x1: 20 }, { kind: 'ramp', p: [-0.25, 10], x0: 20, x1: 38 }], shards: [{ x: 6.333, y: 0.831 }, { x: 9.5, y: 4.244, air: true }, { x: 12.667, y: 4.156 }, { x: 19.0, y: 5.475 }, { x: 25.333, y: 4.167 }, { x: 28.5, y: 4.875, air: true }, { x: 31.667, y: 2.583 }, { x: 38.0, y: 2.5, air: true }], canonical: { goalX: 36.5, coast: [], hops: [9.5, 28.5, 38.0] }, spawnX: 0 },
  '3-6': { id: '3-6', zone: 3, name: "Land the Downside", goal: "Land on the downside.", coach: "Land going down.", cardId: 'z3-2', terrain: [{ kind: 'ramp', p: [-0.3, 9], x0: 0, x1: 14 }, { kind: 'gap', x0: 14, x1: 22 }, { kind: 'sine', p: [1.8, 0.35, 0, 4.8], x0: 22, x1: 44 }], shards: [{ x: 4.667, y: 7.1 }, { x: 9.333, y: 5.9 }, { x: 14.0, y: 4.7 }, { x: 26.0, y: 5.8 }, { x: 30.0, y: 6.6 }, { x: 34.0, y: 4.8 }, { x: 38.0, y: 6.6 }, { x: 42.0, y: 5.4 }], canonical: { goalX: 42.5, coast: [[14, 22]], hops: [] }, spawnX: 0 },
  '3-7': { id: '3-7', zone: 3, name: "Uphill Landing", goal: "Soften the uphill landing.", coach: "Soft landings lose less.", cardId: 'z3-3', terrain: [{ kind: 'ramp', p: [-0.35, 10], x0: 0, x1: 14 }, { kind: 'gap', x0: 14, x1: 22 }, { kind: 'ramp', p: [0.15, -0.1], x0: 22, x1: 40 }], shards: [{ x: 4.667, y: 7.867 }, { x: 9.333, y: 6.133 }, { x: 14.0, y: 5.1 }, { x: 25.0, y: 3.65 }, { x: 28.0, y: 4.1 }, { x: 31.0, y: 4.55 }, { x: 34.0, y: 5.0 }, { x: 37.0, y: 5.45 }], canonical: { goalX: 38.5, coast: [[14, 22]], hops: [] }, spawnX: 0 },
  '3-8': { id: '3-8', zone: 3, name: "Ridge Gauntlet", goal: "Top, drop, roll.", coach: "Top, drop, roll.", cardId: 'z3-3', terrain: [{ kind: 'poly2', p: [-0.03, 1.2, -6], x0: 0, x1: 20 }, { kind: 'sine', p: [1.2, 0.4, 0, 4.8127701041], x0: 20, x1: 42 }], shards: [{ x: 6.667, y: 0.267 }, { x: 13.333, y: 4.533 }, { x: 20.0, y: 4.813 }, { x: 23.5, y: 8.013, air: true }, { x: 27.0, y: 6.013, air: true }, { x: 31.0, y: 5.245 }, { x: 36.0, y: 6.606 }, { x: 40.0, y: 5.173 }], canonical: { goalX: 40.5, coast: [], hops: [23.5, 27.0] }, spawnX: 0 },
  '3-9': { id: '3-9', zone: 3, name: "The Great Apex", goal: "One perfect crest.", coach: "One perfect crest.", finale: true, cardId: 'z3-3', terrain: [{ kind: 'poly2', p: [-0.005, 0.4, 0], x0: 0, x1: 40 }, { kind: 'ramp', p: [-0.4, 24], x0: 40, x1: 55 }, { kind: 'ramp', p: [0, 2], x0: 55, x1: 64 }], shards: [{ x: 9.143, y: 3.739 }, { x: 12.8, y: 6.301, air: true }, { x: 18.286, y: 6.142 }, { x: 25.6, y: 8.963, air: true }, { x: 27.429, y: 7.71 }, { x: 36.571, y: 8.441 }, { x: 38.4, y: 9.987, air: true }, { x: 45.714, y: 6.214 }, { x: 51.2, y: 5.52, air: true }, { x: 54.857, y: 2.557 }], canonical: { goalX: 62.5, coast: [], hops: [12.8, 25.6, 38.4, 51.2] }, spawnX: 0 },
  '4-1': { id: '4-1', zone: 4, name: "Gather Light", goal: "Gather the light.", coach: "Light fills the bar.", cardId: 'z4-1', terrain: [{ kind: 'ramp', p: [-0.15, 6], x0: 0, x1: 30 }, { kind: 'ramp', p: [0, 1.5], x0: 30, x1: 40 }], shards: [{ x: 4.444, y: 5.833 }, { x: 8.889, y: 5.167 }, { x: 13.333, y: 4.5 }, { x: 17.778, y: 3.833 }, { x: 22.222, y: 3.167 }, { x: 26.667, y: 2.5 }, { x: 31.111, y: 2.0 }, { x: 36.667, y: 2.0 }], canonical: { goalX: 38.5, coast: [], hops: [] }, spawnX: 0 },
  '4-2': { id: '4-2', zone: 4, name: "Tall Hill, Big Bar", goal: "Fill the tall bar.", coach: "High hills hold more.", cardId: 'z4-1', terrain: [{ kind: 'ramp', p: [-0.15, 9], x0: 0, x1: 30 }, { kind: 'ramp', p: [0, 4.5], x0: 30, x1: 40 }], shards: [{ x: 4.444, y: 8.833 }, { x: 8.889, y: 8.167 }, { x: 13.333, y: 7.5 }, { x: 17.778, y: 6.833 }, { x: 22.222, y: 6.167 }, { x: 26.667, y: 5.5 }, { x: 31.111, y: 5.0 }, { x: 36.667, y: 5.0 }], canonical: { goalX: 38.5, coast: [], hops: [] }, spawnX: 0 },
  '4-3': { id: '4-3', zone: 4, name: "Fill as You Go", goal: "Collect as you ride.", coach: "Every bit counts.", cardId: 'z4-1', terrain: [{ kind: 'sine', p: [1, 0.25, 0, 5], x0: 0, x1: 40 }], shards: [{ x: 4.0, y: 5.49 }, { x: 8.0, y: 5.91 }, { x: 12.0, y: 5.5 }, { x: 16.0, y: 5.0 }, { x: 20.0, y: 5.49 }, { x: 24.0, y: 5.91 }, { x: 28.0, y: 5.5 }, { x: 32.0, y: 5.0 }, { x: 36.0, y: 5.49 }, { x: 38.0, y: 5.7 }], canonical: { goalX: 38.5, coast: [], hops: [] }, spawnX: 0 },
  '4-4': { id: '4-4', zone: 4, name: "Air Light", goal: "Grab light in the air.", coach: "Flying finds more.", cardId: 'z4-2', terrain: [{ kind: 'ramp', p: [-0.3, 9], x0: 0, x1: 16 }, { kind: 'ramp', p: [0.2, -1.2], x0: 24, x1: 44 }], shards: [{ x: 3.2, y: 8.54 }, { x: 6.4, y: 7.58 }, { x: 9.6, y: 6.62 }, { x: 12.8, y: 5.66 }, { x: 17.6, y: 3.028, air: true }, { x: 19.2, y: 1.37, air: true }, { x: 20.8, y: -1.072, air: true }, { x: 22.4, y: -4.298, air: true }, { x: 29.6, y: 5.22 }, { x: 36.8, y: 6.66 }], canonical: { goalX: 42.5, coast: [[16, 24]], hops: [] }, spawnX: 0 },
  '4-5': { id: '4-5', zone: 4, name: "The Wide Valley", goal: "Fill the wide valley.", coach: "Wide floor, wide bar.", cardId: 'z4-2', terrain: [{ kind: 'poly2', p: [0.02, -0.8, 12], x0: 0, x1: 20 }, { kind: 'ramp', p: [0.1, 2], x0: 20, x1: 40 }], shards: [{ x: 4.444, y: 10.716 }, { x: 8.889, y: 8.711 }, { x: 13.333, y: 6.844 }, { x: 17.778, y: 5.116 }, { x: 22.222, y: 4.222 }, { x: 26.667, y: 4.667 }, { x: 31.111, y: 5.111 }, { x: 35.556, y: 5.556 }, { x: 38.5, y: 5.85 }], canonical: { goalX: 38.5, coast: [], hops: [] }, spawnX: 0 },
  '4-6': { id: '4-6', zone: 4, name: "Don't Leave Any", goal: "Leave no shard behind.", coach: "Clean the curve.", cardId: 'z4-2', terrain: [{ kind: 'sine', p: [1.5, 0.4, 0, 5], x0: 0, x1: 32 }, { kind: 'ramp', p: [-0.2, 11.7472647377], x0: 32, x1: 44 }], shards: [{ x: 3.692, y: 5.735 }, { x: 7.385, y: 6.705 }, { x: 11.077, y: 5.162 }, { x: 14.769, y: 4.094 }, { x: 18.462, y: 5.735 }, { x: 22.154, y: 6.705 }, { x: 25.846, y: 5.162 }, { x: 29.538, y: 4.094 }, { x: 33.333, y: 7.28 }, { x: 36.667, y: 5.48 }, { x: 40.0, y: 4.747 }, { x: 42.5, y: 4.247 }], canonical: { goalX: 42.5, coast: [], hops: [] }, spawnX: 0 },
  '4-7': { id: '4-7', zone: 4, name: "Light Ladder", goal: "Climb the light ladder.", coach: "Steps of light.", cardId: 'z4-3', terrain: [{ kind: 'ramp', p: [-0.2, 8], x0: 0, x1: 20 }, { kind: 'ramp', p: [0, 4], x0: 20, x1: 28 }, { kind: 'ramp', p: [-0.2, 9.6], x0: 28, x1: 40 }], shards: [{ x: 4.0, y: 7.7 }, { x: 8.0, y: 6.9 }, { x: 10.0, y: 8.0, air: true }, { x: 12.0, y: 6.1 }, { x: 16.0, y: 5.3 }, { x: 20.0, y: 4.5 }, { x: 24.0, y: 4.5 }, { x: 28.0, y: 4.5 }, { x: 30.0, y: 5.6, air: true }, { x: 32.0, y: 3.7 }, { x: 36.0, y: 2.9 }, { x: 40.0, y: 3.6, air: true }], canonical: { goalX: 38.5, coast: [], hops: [10.0, 30.0, 40.0] }, spawnX: 0 },
  '4-8': { id: '4-8', zone: 4, name: "Field Gauntlet", goal: "Fill the whole field.", coach: "Full bar, full flow.", cardId: 'z4-3', terrain: [{ kind: 'poly2', p: [-0.01, 0.2, 5], x0: 0, x1: 25 }, { kind: 'sine', p: [1, 0.35, 0, 3.1252760462], x0: 25, x1: 45 }], shards: [{ x: 2.0, y: 5.46 }, { x: 5.0, y: 5.75 }, { x: 8.0, y: 5.56 }, { x: 11.0, y: 5.29 }, { x: 14.0, y: 5.24 }, { x: 17.0, y: 5.51 }, { x: 20.0, y: 5.0 }, { x: 23.0, y: 4.91 }, { x: 26.0, y: 4.125 }, { x: 29.0, y: 4.184 }, { x: 32.0, y: 5.763 }, { x: 35.0, y: 4.194 }, { x: 38.0, y: 3.953 }, { x: 42.0, y: 4.583 }], canonical: { goalX: 43.5, coast: [], hops: [] }, spawnX: 0 },
  '4-9': { id: '4-9', zone: 4, name: "The Motherlode", goal: "Mine the motherlode.", coach: "Fill it all.", finale: true, cardId: 'z4-3', terrain: [{ kind: 'sine', p: [2, 0.2, 0, 6], x0: 0, x1: 50 }, { kind: 'ramp', p: [0, 4.9119577782], x0: 50, x1: 60 }], shards: [{ x: 3.333, y: 7.319 }, { x: 6.667, y: 6.0 }, { x: 10.0, y: 5.317 }, { x: 13.333, y: 5.583 }, { x: 16.667, y: 6.95 }, { x: 20.0, y: 7.418 }, { x: 23.333, y: 6.583 }, { x: 26.667, y: 5.488 }, { x: 30.0, y: 5.317 }, { x: 33.333, y: 6.0 }, { x: 36.667, y: 7.319 }, { x: 40.0, y: 7.902 }, { x: 43.333, y: 7.319 }, { x: 46.667, y: 6.0 }, { x: 51.25, y: 5.412 }, { x: 56.25, y: 5.412 }], canonical: { goalX: 58.5, coast: [], hops: [] }, spawnX: 0 },
  '5-1': { id: '5-1', zone: 5, name: "The Blue Door", goal: "Pass through the blue door.", coach: "Doors trade height.", cardId: 'z5-1', terrain: [{ kind: 'ramp', p: [-0.2, 8], x0: 0, x1: 20 }, { kind: 'ramp', p: [0.3, -2], x0: 28, x1: 44 }], shards: [{ x: 5.143, y: 7.471 }, { x: 10.286, y: 6.443 }, { x: 15.429, y: 5.414 }, { x: 28.571, y: 7.071 }, { x: 33.714, y: 8.614 }, { x: 38.857, y: 10.157 }], canonical: { goalX: 42.5, coast: [[20, 28]], hops: [] }, portals: [{ a: 20, b: 28 }], spawnX: 0 },
  '5-2': { id: '5-2', zone: 5, name: "Up Door, Out Slow", goal: "Climb up, exit slow.", coach: "Higher door, slower out.", cardId: 'z5-1', terrain: [{ kind: 'ramp', p: [-0.15, 6], x0: 0, x1: 18 }, { kind: 'ramp', p: [0.4, -4.7], x0: 30, x1: 42 }], shards: [{ x: 5.143, y: 5.229 }, { x: 10.286, y: 4.457 }, { x: 15.429, y: 3.686 }, { x: 31.714, y: 2.086 }, { x: 35.143, y: 3.457 }, { x: 38.571, y: 4.829 }], canonical: { goalX: 40.5, coast: [[18, 30]], hops: [] }, portals: [{ a: 18, b: 30 }], spawnX: 0 },
  '5-3': { id: '5-3', zone: 5, name: "Down Door Dash", goal: "Drop down, dash out.", coach: "Lower door, faster out.", cardId: 'z5-1', terrain: [{ kind: 'ramp', p: [-0.1, 7], x0: 0, x1: 16 }, { kind: 'ramp', p: [-0.4, 13.8], x0: 30, x1: 44 }], shards: [{ x: 4.571, y: 6.543 }, { x: 9.143, y: 6.086 }, { x: 13.714, y: 5.629 }, { x: 32.0, y: 11.0 }, { x: 35.333, y: 9.667 }, { x: 38.667, y: 8.333 }, { x: 42.0, y: 7.0 }], canonical: { goalX: 42.5, coast: [[16, 30]], hops: [] }, portals: [{ a: 16, b: 30 }], spawnX: 0 },
  '5-4': { id: '5-4', zone: 5, name: "Two Doors", goal: "Chain two doors.", coach: "Chain the doors.", cardId: 'z5-2', terrain: [{ kind: 'sine', p: [1.5, 0.3, 0, 5], x0: 0, x1: 20 }, { kind: 'ramp', p: [0, 3.2], x0: 24, x1: 28 }, { kind: 'ramp', p: [-0.3, 11], x0: 32, x1: 46 }], shards: [{ x: 4.444, y: 6.112 }, { x: 8.889, y: 5.134 }, { x: 13.333, y: 5.579 }, { x: 17.778, y: 6.905 }, { x: 24.571, y: 4.4 }, { x: 26.0, y: 3.2 }, { x: 34.667, y: 8.6 }, { x: 40.0, y: 6.8 }], canonical: { goalX: 44.5, coast: [[20, 24], [28, 32]], hops: [] }, portals: [{ a: 20, b: 24 }, { a: 28, b: 32 }], spawnX: 0 },
  '5-5': { id: '5-5', zone: 5, name: "Bank the Hill", goal: "Bank height into speed.", coach: "Spend height, keep speed.", cardId: 'z5-2', terrain: [{ kind: 'ramp', p: [-0.25, 9], x0: 0, x1: 20 }, { kind: 'ramp', p: [0.5, -7], x0: 30, x1: 42 }], shards: [{ x: 5.0, y: 7.75 }, { x: 10.0, y: 6.5 }, { x: 15.0, y: 5.25 }, { x: 31.5, y: 8.75 }, { x: 34.5, y: 10.25 }, { x: 37.5, y: 11.75 }, { x: 40.5, y: 13.25 }], canonical: { goalX: 40.5, coast: [[20, 30]], hops: [] }, portals: [{ a: 20, b: 30 }], spawnX: 0 },
  '5-6': { id: '5-6', zone: 5, name: "Exact Trade", goal: "Make the exact trade.", coach: "The trade is exact.", cardId: 'z5-2', terrain: [{ kind: 'poly2', p: [-0.02, 0.8, -2], x0: 0, x1: 20 }, { kind: 'ramp', p: [-0.2, 10], x0: 32, x1: 46 }], shards: [{ x: 4.444, y: 0.711 }, { x: 8.889, y: 3.911 }, { x: 13.333, y: 6.444 }, { x: 17.778, y: 8.311 }, { x: 34.667, y: 8.4 }, { x: 38.667, y: 7.6 }, { x: 42.667, y: 6.8 }, { x: 44.5, y: 6.4 }], canonical: { goalX: 44.5, coast: [[20, 32]], hops: [] }, portals: [{ a: 20, b: 32 }], spawnX: 0 },
  '5-7': { id: '5-7', zone: 5, name: "Door Ladder", goal: "Climb the door ladder.", coach: "Climb the ladder down.", cardId: 'z5-3', terrain: [{ kind: 'ramp', p: [-0.2, 10], x0: 0, x1: 14 }, { kind: 'ramp', p: [-0.2, 12.8], x0: 22, x1: 32 }, { kind: 'ramp', p: [-0.2, 15.6], x0: 40, x1: 50 }], shards: [{ x: 3.5, y: 9.3 }, { x: 7.0, y: 8.6 }, { x: 10.5, y: 7.9 }, { x: 25.0, y: 7.8 }, { x: 28.0, y: 7.2 }, { x: 31.0, y: 6.6 }, { x: 43.0, y: 7.0 }, { x: 46.0, y: 6.4 }, { x: 49.0, y: 5.8 }], canonical: { goalX: 48.5, coast: [[14, 22], [32, 40]], hops: [] }, portals: [{ a: 14, b: 22 }, { a: 32, b: 40 }], spawnX: 0 },
  '5-8': { id: '5-8', zone: 5, name: "Portal Gauntlet", goal: "Read before the portal.", coach: "Read before the door.", cardId: 'z5-3', terrain: [{ kind: 'sine', p: [1, 0.4, 0, 6], x0: 0, x1: 16 }, { kind: 'poly2', p: [0.02, -1.2, 20], x0: 26, x1: 40 }, { kind: 'ramp', p: [0, 4], x0: 40, x1: 48 }], shards: [{ x: 3.455, y: 7.482 }, { x: 6.909, y: 6.869 }, { x: 10.364, y: 5.656 }, { x: 13.818, y: 5.814 }, { x: 27.273, y: 2.649 }, { x: 30.727, y: 2.511 }, { x: 34.182, y: 2.85 }, { x: 37.636, y: 3.666 }, { x: 41.091, y: 4.5 }, { x: 44.545, y: 4.5 }], canonical: { goalX: 46.5, coast: [[16, 26]], hops: [] }, portals: [{ a: 16, b: 26 }], spawnX: 0 },
  '5-9': { id: '5-9', zone: 5, name: "The Two-Way Door", goal: "Master the two-way trade.", coach: "Master the trade.", finale: true, cardId: 'z5-3', terrain: [{ kind: 'ramp', p: [-0.3, 2], x0: 0, x1: 18 }, { kind: 'sine', p: [1.5, 0.3, 0, -2.3], x0: 28, x1: 50 }], shards: [{ x: 3.6, y: 0.92 }, { x: 7.2, y: -0.16 }, { x: 10.8, y: -1.24 }, { x: 14.4, y: -2.32 }, { x: 23.0, y: -0.63, air: true }, { x: 25.0, y: -2.018, air: true }, { x: 31.0, y: -1.652, air: true }, { x: 39.0, y: -1.495, air: true }, { x: 31.5, y: -0.8 }, { x: 39.5, y: -0.8 }, { x: 47.0, y: -0.8 }, { x: 48.5, y: -0.8 }], canonical: { goalX: 48.5, coast: [[18, 28]], hops: [] }, portals: [{ a: 18, b: 28 }], spawnX: 0 },
  '6-1': { id: '6-1', zone: 6, name: "The Wind Rule", goal: "Write the wind rule.", coach: "Write the wind.", cardId: 'z6-1', terrain: [{ kind: 'ramp', p: [-0.1, 6], x0: 0, x1: 40 }], shards: [{ x: 6.667, y: 5.833 }, { x: 13.333, y: 5.667 }, { x: 20.0, y: 5.5 }, { x: 26.667, y: 5.333 }, { x: 33.333, y: 5.167 }, { x: 38.0, y: 5.05 }], canonical: { goalX: 38.5, coast: [], hops: [] }, ruleSpec: {wind: { range: [0.5, 3], solvable: 1 }}, spawnX: 0 },
  '6-2': { id: '6-2', zone: 6, name: "Stronger Wind", goal: "Push harder with k.", coach: "More k, more push.", cardId: 'z6-1', terrain: [{ kind: 'ramp', p: [0.15, 0], x0: 0, x1: 36 }], shards: [{ x: 6.0, y: 1.4 }, { x: 12.0, y: 2.3 }, { x: 18.0, y: 3.2 }, { x: 24.0, y: 4.1 }, { x: 30.0, y: 5.0 }, { x: 34.0, y: 5.6 }], canonical: { goalX: 34.5, coast: [], hops: [] }, ruleSpec: {wind: { range: [0.5, 3], solvable: 2.5 }}, spawnX: 0 },
  '6-3': { id: '6-3', zone: 6, name: "Wind Gap", goal: "Let wind carry the gap.", coach: "Wind carries you.", cardId: 'z6-1', terrain: [{ kind: 'ramp', p: [-0.2, 8], x0: 0, x1: 16 }, { kind: 'gap', x0: 16, x1: 24 }, { kind: 'ramp', p: [0.2, -1.2], x0: 24, x1: 44 }], shards: [{ x: 6.0, y: 7.3 }, { x: 12.0, y: 6.1 }, { x: 18.667, y: 2.927, air: true }, { x: 21.333, y: -0.727, air: true }, { x: 26.0, y: 4.5 }, { x: 32.0, y: 5.7 }, { x: 38.0, y: 6.9 }], canonical: { goalX: 42.5, coast: [[16, 24]], hops: [] }, ruleSpec: {wind: { range: [1, 4], solvable: 3 }}, spawnX: 0 },
  '6-4': { id: '6-4', zone: 6, name: "The Spring Rule", goal: "Feel the spring pull.", coach: "The rule pulls back.", cardId: 'z6-2', terrain: [{ kind: 'ramp', p: [0, 6], x0: 0, x1: 40 }], shards: [{ x: 6.667, y: 6.5 }, { x: 13.333, y: 6.5 }, { x: 20.0, y: 6.5 }, { x: 26.667, y: 6.5 }, { x: 33.333, y: 6.5 }, { x: 38.0, y: 6.5 }], canonical: { goalX: 38.5, coast: [], hops: [] }, ruleSpec: {spring: { range: [0.2, 1.5], x0: 20, solvable: 0.8 }}, spawnX: 0 },
  '6-5': { id: '6-5', zone: 6, name: "Soft vs Hard Spring", goal: "Tune spring stiffness.", coach: "Hard pulls harder.", cardId: 'z6-2', terrain: [{ kind: 'sine', p: [0.5, 0.2, 0, 5], x0: 0, x1: 44 }], shards: [{ x: 5.5, y: 6.197 }, { x: 11.0, y: 5.476 }, { x: 16.5, y: 5.197 }, { x: 22.0, y: 5.476 }, { x: 27.5, y: 6.197 }, { x: 33.0, y: 5.476 }, { x: 38.5, y: 5.197 }, { x: 42.0, y: 5.476 }], canonical: { goalX: 42.5, coast: [], hops: [] }, ruleSpec: {spring: { range: [0.2, 2], x0: 24, solvable: 1.2 }}, spawnX: 0 },
  '6-6': { id: '6-6', zone: 6, name: "Spring Launch", goal: "Sling from the spring.", coach: "Pull back, sling forward.", cardId: 'z6-2', terrain: [{ kind: 'ramp', p: [0, 4], x0: 0, x1: 12 }, { kind: 'ramp', p: [-0.3, 7.6], x0: 12, x1: 32 }], shards: [{ x: 4.571, y: 4.5 }, { x: 9.143, y: 4.5 }, { x: 10.667, y: 6.0, air: true }, { x: 13.714, y: 3.986 }, { x: 18.286, y: 2.614 }, { x: 21.333, y: 3.2, air: true }, { x: 22.857, y: 1.243 }, { x: 27.429, y: -0.129 }], canonical: { goalX: 30.5, coast: [], hops: [10.667, 21.333] }, ruleSpec: {spring: { range: [0.5, 2.5], x0: 12, solvable: 2 }}, spawnX: 0 },
  '6-7': { id: '6-7', zone: 6, name: "Wind + Spring", goal: "Balance wind and spring.", coach: "Two rules, one ride.", cardId: 'z6-3', terrain: [{ kind: 'ramp', p: [-0.1, 7], x0: 0, x1: 44 }], shards: [{ x: 5.5, y: 7.05 }, { x: 11.0, y: 6.9 }, { x: 16.5, y: 6.75 }, { x: 22.0, y: 6.6 }, { x: 27.5, y: 6.45 }, { x: 33.0, y: 6.3 }, { x: 38.5, y: 6.15 }, { x: 42.0, y: 6.05 }], canonical: { goalX: 42.5, coast: [], hops: [] }, ruleSpec: {wind: { range: [0, 2], solvable: 1 }, spring: { range: [0.2, 1.5], x0: 24, solvable: 0.8 }}, spawnX: 0 },
  '6-8': { id: '6-8', zone: 6, name: "Rule Gauntlet", goal: "Tune to the rule.", coach: "Tune the rule.", cardId: 'z6-3', terrain: [{ kind: 'sine', p: [1, 0.3, 0, 5], x0: 0, x1: 42 }], shards: [{ x: 4.667, y: 6.803 }, { x: 9.333, y: 5.486 }, { x: 14.0, y: 5.0 }, { x: 18.667, y: 5.486 }, { x: 23.333, y: 6.803 }, { x: 28.0, y: 5.486 }, { x: 32.667, y: 5.0 }, { x: 37.333, y: 5.486 }, { x: 40.0, y: 6.411 }, { x: 41.0, y: 6.252 }], canonical: { goalX: 40.5, coast: [], hops: [] }, ruleSpec: {spring: { range: [0.4, 2], x0: 20, solvable: 1.5 }}, spawnX: 0 },
  '6-9': { id: '6-9', zone: 6, name: "The Perfect Rule", goal: "Write the perfect rule.", coach: "Write the perfect rule.", finale: true, cardId: 'z6-3', terrain: [{ kind: 'poly2', p: [0.01, -0.3, 8], x0: 0, x1: 30 }, { kind: 'ramp', p: [-0.2, 14], x0: 30, x1: 55 }], shards: [{ x: 5.5, y: 7.152 }, { x: 11.0, y: 6.41 }, { x: 13.75, y: 7.766, air: true }, { x: 16.5, y: 6.272 }, { x: 22.0, y: 6.74 }, { x: 27.5, y: 7.813 }, { x: 33.0, y: 7.9 }, { x: 38.5, y: 6.8 }, { x: 41.25, y: 7.75, air: true }, { x: 44.0, y: 5.7 }, { x: 49.5, y: 4.6 }, { x: 55.0, y: 5.0, air: true }], canonical: { goalX: 53.5, coast: [], hops: [13.75, 41.25, 55.0] }, ruleSpec: {wind: { range: [0.5, 3], solvable: 2 }, spring: { range: [0.2, 2], x0: 30, solvable: 1 }}, spawnX: 0 },
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
  ridges: [], // authored by main (integration)
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
