import { levels, type LevelDef } from '../src/game/levels.ts'

/**
 * Solvability harness — canon definition of done.
 *
 * Imports the level registry and asserts every canonicalSolution passes
 * the mechanic's checker. Run with `npm run verify` before commit.
 */

/** Demo checker: the canonical vector must land within 1 unit of the goal. */
function check(level: LevelDef, solution: LevelDef['canonicalSolution']): boolean {
  const dx = solution.x - level.goal.x
  const dy = solution.y - level.goal.y
  return Math.hypot(dx, dy) < 1
}

let failed = 0
for (const level of levels) {
  const ok = check(level, level.canonicalSolution)
  console.log(`${ok ? '✓' : '✗'} ${level.id} ${level.name}`)
  if (!ok) failed++
}

if (failed > 0) {
  console.error(`${failed} level(s) failed canonical-solution check`)
  process.exit(1)
}

console.log('All levels solvable.')
