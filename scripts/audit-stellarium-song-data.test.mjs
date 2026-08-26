import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import generatedSky from '../src/data/traditional-chinese-sky.json'
import mansionMappings from '../src/data/mansion-star-mappings.json'
import { auditStellariumSongData } from './lib/stellarium-song-audit.mjs'

const snapshotDirectory = 'data-sources/stellarium/chinese_song_dynasty/v26.2'
const sourceCulture = JSON.parse(await readFile(`${snapshotDirectory}/index.json`, 'utf8'))
const sourceDescription = await readFile(`${snapshotDirectory}/description.md`, 'utf8')
const audit = auditStellariumSongData(sourceCulture, sourceDescription)

describe('Stellarium Chinese Song Dynasty source audit', () => {
  it('reconciles the historical and render-figure counting scopes', () => {
    expect(audit.sourceNarrative.historicalXingguans).toBe(283)
    expect(audit.structure.constellationEntries).toBe(339)
    expect(audit.structure.asterismEntries).toBe(0)
    expect(audit.structure.logicalFiguresAfterSplitMerge).toBe(295)
    expect(audit.structure.exactDuplicateNameSurplus).toBe(30)
    expect(audit.structure.twelveStatesSplitSurplus).toBe(11)
    expect(audit.structure.threeStepsSplitSurplus).toBe(3)
    expect(audit.structure.renderFragmentSurplus).toBe(44)
    expect(audit.structure.auxiliaryVassalLogicalFigures).toBe(12)
    expect(audit.structure.historicalXingguansFromOfficialLabels).toBe(283)
    expect(audit.structure.lunarMansionRenderFigures).toBe(28)
  })

  it('reproduces HIP, DSO, duplicate-reference and line statistics', () => {
    expect(audit.references.hipReferenceOccurrences).toBe(1678)
    expect(audit.references.uniqueHipStars).toBe(1460)
    expect(audit.references.hipIdsReferencedMoreThanOnce).toBe(187)
    expect(audit.references.hipsUsedByMultipleFigures).toBe(17)
    expect(audit.references.nonHipReferenceOccurrences).toBe(4)
    expect(audit.references.nonHipIds).toEqual(['DSO:M44', 'DSO:M7'])
    expect(audit.references.uniqueRenderableObjects).toBe(1462)
    expect(audit.sourceNarrative.starsIncludingClusters).toBe(1464)
    expect(audit.references.narrativeMinusRenderableObjects).toBe(2)
    expect(audit.lines.drawableLineSegments).toBe(1187)
  })

  it('keeps every source figure in the generated runtime snapshot', () => {
    expect(generatedSky.figures).toHaveLength(audit.structure.constellationEntries)
    expect(generatedSky.metadata.counts.renderFigures).toBe(audit.structure.constellationEntries)
    expect(generatedSky.metadata.counts.historicalXingguans).toBe(283)
    expect(generatedSky.stars).toHaveLength(audit.references.uniqueHipStars)
    expect(generatedSky.deepSkyObjects).toHaveLength(audit.references.uniqueNonHipObjects)
    expect(mansionMappings.mappings).toHaveLength(28)
  })
})
