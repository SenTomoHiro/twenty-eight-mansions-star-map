function sourceCount(description, pattern, label) {
  const value = Number(description.match(pattern)?.[1])
  if (!Number.isInteger(value)) throw new Error(`Missing ${label} count in description.md`)
  return value
}

function logicalFigureName(nativeName) {
  if (/^十二国\([^)]+\)$/.test(nativeName)) return '十二国'
  if (/^三台(?:\([^)]+\))?$/.test(nativeName)) return '三台'
  return nativeName
}

function isVassalFigure(figure) {
  return /\bVassal of\b/.test(figure.common_name?.english ?? '')
}

export function auditStellariumSongData(culture, description) {
  if (culture.id !== 'chinese_song_dynasty') throw new Error('Unexpected sky-culture identifier')

  const figures = culture.constellations ?? []
  const strips = figures.flatMap((figure) => figure.lines ?? [])
  const references = strips.flat()
  const hipReferences = references.filter(Number.isInteger)
  const nonHipReferences = references.filter((reference) => !Number.isInteger(reference))
  const uniqueHips = new Set(hipReferences)
  const uniqueNonHip = new Set(nonHipReferences)
  const logicalFigures = new Set(figures.map((figure) => logicalFigureName(figure.common_name.native)))
  const figureNameFrequency = new Map()
  for (const figure of figures) {
    const name = figure.common_name.native
    figureNameFrequency.set(name, (figureNameFrequency.get(name) ?? 0) + 1)
  }
  const vassalFigureEntries = figures.filter(isVassalFigure)
  const vassalLogicalFigures = new Set(
    vassalFigureEntries.map((figure) => logicalFigureName(figure.common_name.native)),
  )
  const historicalXingguanNames = [...logicalFigures].filter((name) => !vassalLogicalFigures.has(name))
  const mansionNames = new Set(
    (culture.lunar_system?.names ?? []).map((entry) => `${entry.native}宿`),
  )
  const mansionFigures = figures.filter((figure) => mansionNames.has(figure.common_name.native))

  const hipsByFigure = new Map()
  const hipReferenceFrequency = new Map()
  for (const hip of hipReferences) {
    hipReferenceFrequency.set(hip, (hipReferenceFrequency.get(hip) ?? 0) + 1)
  }
  for (const figure of figures) {
    for (const hip of new Set((figure.lines ?? []).flat().filter(Number.isInteger))) {
      const figureIds = hipsByFigure.get(hip) ?? new Set()
      figureIds.add(figure.id)
      hipsByFigure.set(hip, figureIds)
    }
  }

  const sourceAdjacentPairs = strips.reduce(
    (sum, strip) => sum + Math.max(0, strip.length - 1),
    0,
  )
  const drawableLineSegments = strips.reduce((sum, strip) => {
    let count = 0
    for (let index = 1; index < strip.length; index += 1) {
      if (strip[index - 1] !== strip[index]) count += 1
    }
    return sum + count
  }, 0)
  const selfConnectionStrips = strips.filter(
    (strip) => strip.length === 2 && strip[0] === strip[1],
  )
  const narrativeHistoricalXingguans = sourceCount(
    description,
    /comprises\s+(\d+)\s+Xingguans/i,
    'historical Xingguan',
  )
  const narrativeStarsIncludingClusters = sourceCount(
    description,
    /and\s+(\d+)\s+stars\s+\(including clusters M7, M44\)/i,
    'historical star',
  )

  return {
    sourceNarrative: {
      historicalXingguans: narrativeHistoricalXingguans,
      starsIncludingClusters: narrativeStarsIncludingClusters,
    },
    structure: {
      constellationEntries: figures.length,
      asterismEntries: Array.isArray(culture.asterisms) ? culture.asterisms.length : 0,
      lunarSystemObjects: culture.lunar_system ? 1 : 0,
      lunarMansionDefinitions: culture.lunar_system?.names?.length ?? 0,
      lunarMansionDefiningStars: culture.lunar_system?.defining_stars?.length ?? 0,
      lunarMansionRenderFigures: mansionFigures.length,
      nonMansionRenderFigures: figures.length - mansionFigures.length,
      logicalFiguresAfterSplitMerge: logicalFigures.size,
      renderFragmentSurplus: figures.length - logicalFigures.size,
      exactDuplicateNameSurplus: [...figureNameFrequency.values()]
        .reduce((sum, count) => sum + Math.max(0, count - 1), 0),
      twelveStatesSplitSurplus: Math.max(
        0,
        figures.filter((figure) => /^十二国\([^)]+\)$/.test(figure.common_name.native)).length - 1,
      ),
      threeStepsSplitSurplus: Math.max(
        0,
        figures.filter((figure) => /^三台(?:\([^)]+\))?$/.test(figure.common_name.native)).length - 1,
      ),
      auxiliaryVassalFigureEntries: vassalFigureEntries.length,
      auxiliaryVassalLogicalFigures: vassalLogicalFigures.size,
      explicitHelpRayEntries: 0,
      historicalXingguansFromOfficialLabels: historicalXingguanNames.length,
      ordinaryHistoricalXingguans: historicalXingguanNames.length - mansionFigures.length,
    },
    lines: {
      lineStrips: strips.length,
      figuresWithEmptyLines: figures.filter(
        (figure) => !figure.lines?.length || figure.lines.every((strip) => strip.length === 0),
      ).length,
      emptyLineStrips: strips.filter((strip) => strip.length === 0).length,
      singletonLineStrips: strips.filter((strip) => strip.length === 1).length,
      selfConnectionStrips: selfConnectionStrips.length,
      hipSelfConnectionStrips: selfConnectionStrips.filter((strip) => Number.isInteger(strip[0])).length,
      nonHipSelfConnectionStrips: selfConnectionStrips.filter((strip) => !Number.isInteger(strip[0])).length,
      sourceAdjacentPairs,
      drawableLineSegments,
    },
    references: {
      hipReferenceOccurrences: hipReferences.length,
      uniqueHipStars: uniqueHips.size,
      repeatedHipOccurrences: hipReferences.length - uniqueHips.size,
      hipIdsReferencedMoreThanOnce: [...hipReferenceFrequency.values()]
        .filter((count) => count > 1).length,
      hipsUsedByMultipleFigures: [...hipsByFigure.values()].filter((ids) => ids.size > 1).length,
      nonHipReferenceOccurrences: nonHipReferences.length,
      uniqueNonHipObjects: uniqueNonHip.size,
      nonHipIds: [...uniqueNonHip].sort(),
      uniqueRenderableObjects: uniqueHips.size + uniqueNonHip.size,
      narrativeMinusRenderableObjects:
        narrativeStarsIncludingClusters - uniqueHips.size - uniqueNonHip.size,
    },
  }
}
