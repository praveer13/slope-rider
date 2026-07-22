import { readFileSync, writeFileSync } from 'fs'
import { LEVELS } from '../src/game/levels.ts'
import { terrainF } from '../src/game/calculus.ts'

const levelsPath = new URL('../src/game/levels.ts', import.meta.url).pathname
let src = readFileSync(levelsPath, 'utf8')

for (const [id, lvl] of Object.entries(LEVELS)) {
  for (const sh of lvl.shards) {
    if (sh.air) continue
    const f = terrainF(lvl.terrain, sh.x)
    if (f === null) continue
    const y = Math.round((f + 0.5) * 1000) / 1000
    if (Math.abs(sh.y - y) <= 0.001) continue

    // Build regex that matches this shard inside the level object.
    // We match the level id first, then any characters up to the shard entry.
    const xStr = Number.isInteger(sh.x) ? String(sh.x) : sh.x.toString()
    const oldYStr = sh.y.toString()
    const newYStr = y.toString()

    // Pattern: within the level, find  { x: <x>, y: <oldY>  (not air)
    // Use a non-greedy prefix anchored on the level id string.
    const pattern = new RegExp(
      `('${id}':[\\s\\S]*?\\{ x: ${xStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}, y: )${oldYStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
      'g',
    )

    const before = src
    src = src.replace(pattern, `$1${newYStr}`)
    if (src === before) {
      console.error(`FAILED to patch ${id} shard x=${sh.x} ${sh.y} -> ${y}`)
    } else {
      console.log(`patched ${id} shard x=${sh.x} ${sh.y} -> ${y}`)
    }
  }
}

writeFileSync(levelsPath, src)
console.log('Wrote', levelsPath)
