import { LEVELS } from '../src/game/levels.ts'
import { terrainF, segAt, segF, segDf, verletGround, verletAir, findLanding, landVelocity, PHYS_DT } from '../src/game/calculus.ts'

const id = process.argv[2] ?? '3-1'
const lvl = LEVELS[id]
if (!lvl) throw new Error(`no level ${id}`)
let x = lvl.spawnX ?? 0
let y = terrainF(lvl.terrain, x)!
let vx = 0.5
let vy = 0
let grounded = true
console.log('start', x.toFixed(3), y.toFixed(3), vx.toFixed(3))
for (let s = 0; s < 600; s++) {
  const carving = true
  if (grounded) {
    const [nx, nvx] = verletGround(lvl.terrain, x, vx, PHYS_DT, carving, undefined)
    if (!segAt(lvl.terrain, nx)) {
      const sg = segAt(lvl.terrain, x)!
      vy = segDf(sg, x) * nvx
      grounded = false
      x = nx
      vx = nvx
    } else {
      x = nx
      vx = nvx
      y = segF(segAt(lvl.terrain, x)!, x)
      vy = segDf(segAt(lvl.terrain, x)!, x) * vx
      if (Math.abs(vx) < 0.05 && s > 100) {
        console.log('strand at step', s, 'x', x.toFixed(3), 'vx', vx.toFixed(3))
        break
      }
    }
  } else {
    const [nx, ny, nvx, nvy] = verletAir(x, y, vx, vy, PHYS_DT, undefined)
    const land = findLanding(lvl.terrain, x, y, nx, ny)
    if (land) {
      const [lvx, lvy] = landVelocity(lvl.terrain, land.x, nvx, nvy)
      x = land.x
      y = land.y
      vx = lvx
      vy = lvy
      grounded = true
      console.log('land at', x.toFixed(3), y.toFixed(3), vx.toFixed(3))
    } else {
      x = nx
      y = ny
      vx = nvx
      vy = nvy
      if (y < -20) { console.log('fell'); break }
    }
  }
  if (s % 60 === 0) console.log(s, x.toFixed(3), y.toFixed(3), vx.toFixed(3), grounded)
}
