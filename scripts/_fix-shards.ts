import { LEVELS, type SRLevel } from '../src/game/levels.ts'
import { terrainF } from '../src/game/calculus.ts'

function correctLevel(lvl: SRLevel): SRLevel {
  const shards = lvl.shards.map((sh) => {
    if (sh.air) return sh
    const f = terrainF(lvl.terrain, sh.x)
    if (f === null) {
      console.error(`  ${lvl.id}: grounded shard in gap at x=${sh.x}`)
      return sh
    }
    const y = Math.round((f + 0.5) * 1000) / 1000
    if (Math.abs(sh.y - y) > 0.001) {
      console.error(`  ${lvl.id}: shard at x=${sh.x} ${sh.y} -> ${y}`)
    }
    return { ...sh, y }
  })
  return { ...lvl, shards }
}

const corrected: Record<string, SRLevel> = {}
for (const [id, lvl] of Object.entries(LEVELS)) {
  corrected[id] = correctLevel(lvl)
}

console.log(JSON.stringify(corrected, null, 2))
