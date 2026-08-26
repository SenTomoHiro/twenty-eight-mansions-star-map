import { readFile } from 'node:fs/promises'
import { auditStellariumSongData } from './lib/stellarium-song-audit.mjs'

const snapshotDirectory = 'data-sources/stellarium/chinese_song_dynasty/v26.2'
const culture = JSON.parse(await readFile(`${snapshotDirectory}/index.json`, 'utf8'))
const description = await readFile(`${snapshotDirectory}/description.md`, 'utf8')

console.log(JSON.stringify(auditStellariumSongData(culture, description), null, 2))

