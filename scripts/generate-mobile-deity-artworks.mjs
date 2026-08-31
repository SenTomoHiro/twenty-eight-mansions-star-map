import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const artworkDirectory = join(scriptDirectory, '../src/assets/xingxiu/artworks')
const mobileLongEdge = 840
const quality = 84
const force = process.argv.includes('--force')

const originals = readdirSync(artworkDirectory)
  .filter((filename) => filename.endsWith('.png'))
  .sort()

for (const original of originals) {
  const source = join(artworkDirectory, original)
  const target = join(artworkDirectory, original.replace(/\.png$/, '.mobile.webp'))
  if (!force && existsSync(target)) {
    console.log(`keep ${target}`)
    continue
  }

  execFileSync('cwebp', [
    '-quiet',
    '-q', String(quality),
    '-resize', '0', String(mobileLongEdge),
    source,
    '-o', target,
  ], { stdio: 'inherit' })
  console.log(`generated ${target}`)
}
