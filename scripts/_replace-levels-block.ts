import { readFileSync, writeFileSync } from 'fs'

const levelsPath = new URL('../src/game/levels.ts', import.meta.url).pathname
let src = readFileSync(levelsPath, 'utf8')

const newBlock = readFileSync('/tmp/slope-fix/levels_block.ts', 'utf8')

const match = src.match(/export const LEVELS: Record<string, SRLevel> = \{[\s\S]*?\n\}\s*\n/)
if (!match) {
  console.error('Could not find LEVELS block')
  process.exit(1)
}

src = src.slice(0, match.index) + newBlock + src.slice(match.index! + match[0].length)
writeFileSync(levelsPath, src)
console.log('Replaced LEVELS block in', levelsPath)
