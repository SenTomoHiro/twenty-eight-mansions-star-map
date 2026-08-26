import { mkdir, writeFile } from 'node:fs/promises'
import { auditStellariumSongData } from './lib/stellarium-song-audit.mjs'

const STELLARIUM_VERSION = '26.2'
const STELLARIUM_TAG = 'v26.2'
const STELLARIUM_COMMIT = '2b10b1a3bb534eb4e7586751054bf67b36c22e53'
const repository = 'Stellarium/stellarium'
const skyCulturePath = 'skycultures/chinese_song_dynasty/index.json'
const descriptionPath = 'skycultures/chinese_song_dynasty/description.md'
const skyCultureContributor = 'Sun Shuwei (孙殳玮)'
const rawBase = `https://raw.githubusercontent.com/${repository}/${STELLARIUM_TAG}`
const generatedOn = new Date().toISOString().slice(0, 10)

async function fetchWithRetry(url, label, attempts = 3) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'twenty-eight-mansions-data-builder' },
        signal: AbortSignal.timeout(45_000),
      })
      if (!response.ok) throw new Error(`${label} failed: ${response.status}`)
      return response
    } catch (error) {
      lastError = error
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 500))
    }
  }
  throw new Error(`${label} failed after ${attempts} attempts`, { cause: lastError })
}

async function fetchText(url, label) {
  return (await fetchWithRetry(url, `${label} download`)).text()
}

function parseVizierTsv(tsv) {
  const lines = tsv.split('\n')
  const separatorIndex = lines.findIndex((line) => line.startsWith('------'))
  if (separatorIndex < 2) throw new Error('Unable to parse the VizieR TSV response')
  const headings = lines[separatorIndex - 2].split('\t').map((value) => value.trim())
  return lines.slice(separatorIndex + 1)
    .filter((line) => line.trim() && !line.startsWith('#'))
    .map((line) => Object.fromEntries(
      line.split('\t').map((value, index) => [headings[index], value.trim()]),
    ))
}

async function queryVizier(source, fields, hips, batchSize = 180) {
  const rows = []
  for (let offset = 0; offset < hips.length; offset += batchSize) {
    const batch = hips.slice(offset, offset + batchSize)
    const query = new URLSearchParams({
      '-source': source,
      '-out': fields.join(','),
      HIP: batch.join(','),
      '-out.max': String(batch.length + 10),
    })
    const response = await fetchWithRetry(
      `https://vizier.cds.unistra.fr/viz-bin/asu-tsv?${query}`,
      `VizieR ${source} query`,
    )
    rows.push(...parseVizierTsv(await response.text()))
  }
  return rows
}

async function querySesame(reference) {
  const identifier = reference.replace('DSO:', '').replace(/^M(\d+)$/, 'M $1')
  const xml = await fetchText(
    `https://cds.unistra.fr/cgi-bin/nph-sesame/-oxp/SNV?${encodeURIComponent(identifier)}`,
    `CDS Sesame ${identifier}`,
  )
  const ra = Number(xml.match(/<jradeg>([^<]+)<\/jradeg>/)?.[1])
  const dec = Number(xml.match(/<jdedeg>([^<]+)<\/jdedeg>/)?.[1])
  const canonicalName = xml.match(/<oname>([^<]+)<\/oname>/)?.[1]?.replace(/\s+/g, ' ').trim()
  if (!Number.isFinite(ra) || !Number.isFinite(dec)) {
    throw new Error(`Unable to resolve ${reference} with CDS Sesame`)
  }
  return {
    id: reference,
    designation: identifier,
    canonicalName,
    ra,
    dec,
    coordinateSource: 'CDS Sesame / SIMBAD name resolver',
  }
}

function groupForCultureId(id) {
  const code = id.replace('CON chinese_song_dynasty ', '')
  if (code.startsWith('P')) return { id: 'purple-forbidden-enclosure', name: '紫微垣' }
  if (code.startsWith('S')) return { id: 'supreme-palace-enclosure', name: '太微垣' }
  if (code.startsWith('H')) return { id: 'heavenly-market-enclosure', name: '天市垣' }
  const mansionRegion = Number(code.slice(0, 2))
  if (mansionRegion >= 1 && mansionRegion <= 7) return { id: 'azure-dragon-region', name: '东方七宿区' }
  if (mansionRegion >= 8 && mansionRegion <= 14) return { id: 'black-tortoise-region', name: '北方七宿区' }
  if (mansionRegion >= 15 && mansionRegion <= 21) return { id: 'white-tiger-region', name: '西方七宿区' }
  if (mansionRegion >= 22 && mansionRegion <= 28) return { id: 'vermillion-bird-region', name: '南方七宿区' }
  return { id: 'other', name: '其他星官' }
}

function finiteNumber(value) {
  if (typeof value === 'string' && value.trim() === '') return undefined
  if (value === null || value === undefined) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function distanceRecord(hip, row) {
  const parallaxMas = finiteNumber(row?.Plx)
  const parallaxErrorMas = finiteNumber(row?.e_Plx)
  const sourceId = 'astronomy-hipparcos-2'
  if (parallaxMas === undefined || parallaxErrorMas === undefined) {
    return { hip, status: 'insufficient', sourceId, reason: 'missing-parallax' }
  }
  if (parallaxMas <= 0) {
    return { hip, parallaxMas, parallaxErrorMas, status: 'insufficient', sourceId, reason: 'non-positive-parallax' }
  }
  const relativeError = parallaxErrorMas / parallaxMas
  if (!Number.isFinite(relativeError) || relativeError > 0.2) {
    return {
      hip,
      parallaxMas,
      parallaxErrorMas,
      relativeError,
      status: 'insufficient',
      sourceId,
      reason: 'relative-error-above-20-percent',
    }
  }
  return {
    hip,
    parallaxMas,
    parallaxErrorMas,
    relativeError,
    distanceLy: Math.round((1000 / parallaxMas) * 3.26156),
    status: 'available',
    sourceId,
  }
}

const cultureText = await fetchText(`${rawBase}/${skyCulturePath}`, 'Sky-culture index')
const descriptionText = await fetchText(`${rawBase}/${descriptionPath}`, 'Sky-culture description')
const culture = JSON.parse(cultureText)
const sourceAudit = auditStellariumSongData(culture, descriptionText)

if (culture.id !== 'chinese_song_dynasty') throw new Error('Unexpected sky-culture identifier')
if (!descriptionText.includes('## License\n\nCC BY-SA 4.0')) {
  throw new Error('Unable to verify the Chinese Song Dynasty sky-culture license')
}

const names = '角亢氐房心尾箕斗牛女虚危室壁奎娄胃昴毕觜参井鬼柳星张翼轸'.split('')
const slugs = [
  'jiao', 'kang', 'di', 'fang', 'xin', 'wei-east', 'ji-east', 'dou', 'niu', 'nv',
  'xu', 'wei-north', 'shi', 'bi-north', 'kui', 'lou', 'wei-west', 'mao', 'bi-west',
  'zi', 'shen', 'jing', 'gui', 'liu', 'xing', 'zhang', 'yi', 'zhen',
]

const mansionCultureIds = new Set()
const rawMappings = names.map((name, index) => {
  const constellation = culture.constellations.find(
    (entry) => entry.common_name?.native === `${name}宿`,
  )
  if (!constellation) throw new Error(`Missing Stellarium mapping for ${name}宿`)
  mansionCultureIds.add(constellation.id)
  const hips = [...new Set(constellation.lines.flat())]
  return {
    mansionId: `xingxiu-${String(index + 1).padStart(2, '0')}-${slugs[index]}`,
    order: index + 1,
    name,
    traditionalAsterism: constellation.common_name.native,
    englishName: constellation.common_name.english,
    definingStarHip: culture.lunar_system.defining_stars[index],
    starCultureId: constellation.id,
    hips,
    lines: constellation.lines,
  }
})

const allReferences = [...new Set(culture.constellations.flatMap((entry) => entry.lines.flat(2)))]
const allHips = allReferences.filter((reference) => Number.isInteger(reference)).sort((a, b) => a - b)
const deepSkyReferences = allReferences.filter((reference) => typeof reference === 'string').sort()
const definingHips = culture.lunar_system.defining_stars

const coordinateRows = await queryVizier(
  'I/239/hip_main',
  ['HIP', 'RAICRS', 'DEICRS', 'Vmag'],
  allHips,
)
const parallaxRows = await queryVizier(
  'I/311/hip2',
  ['HIP', 'Plx', 'e_Plx'],
  definingHips,
)
const deepSkyObjects = await Promise.all(deepSkyReferences.map(querySesame))

const coordinateRowByHip = new Map(coordinateRows.map((row) => [Number(row.HIP), row]))
const coordinateByHip = new Map(await Promise.all(allHips.map(async (hip) => {
  const row = coordinateRowByHip.get(hip)
  const catalogueRa = finiteNumber(row?.RAICRS)
  const catalogueDec = finiteNumber(row?.DEICRS)
  if (catalogueRa !== undefined && catalogueDec !== undefined) {
    return [hip, { hip, ra: catalogueRa, dec: catalogueDec, mag: finiteNumber(row?.Vmag) ?? 7 }]
  }
  const resolved = await querySesame(`HIP ${hip}`)
  return [hip, {
    hip,
    ra: resolved.ra,
    dec: resolved.dec,
    mag: finiteNumber(row?.Vmag) ?? 7,
  }]
})))
const parallaxByHip = new Map(parallaxRows.map((row) => [Number(row.HIP), row]))
const distanceByHip = new Map(definingHips.map((hip) => [hip, distanceRecord(hip, parallaxByHip.get(hip))]))

const missingCoordinates = allHips.filter((hip) => !coordinateByHip.has(hip))
if (missingCoordinates.length > 0) {
  throw new Error(`Hipparcos coordinate lookup incomplete: ${missingCoordinates.join(', ')}`)
}

const figures = culture.constellations.map((constellation) => {
  const memberRefs = [...new Set(constellation.lines.flat())]
  return {
    id: constellation.id,
    name: constellation.common_name.native,
    englishName: constellation.common_name.english,
    pronunciation: constellation.common_name.pronounce,
    group: groupForCultureId(constellation.id),
    memberRefs,
    memberHips: memberRefs.filter((reference) => Number.isInteger(reference)),
    lines: constellation.lines,
    isLunarMansion: mansionCultureIds.has(constellation.id),
    interactive: false,
  }
})

const lineStripCount = sourceAudit.lines.lineStrips
const lineSegmentCount = sourceAudit.lines.sourceAdjacentPairs
const drawableLineSegmentCount = sourceAudit.lines.drawableLineSegments

const traditionalSkySnapshot = {
  metadata: {
    source: 'Stellarium Chinese Song Dynasty sky culture',
    repository,
    path: skyCulturePath,
    descriptionPath,
    version: STELLARIUM_VERSION,
    tag: STELLARIUM_TAG,
    commit: STELLARIUM_COMMIT,
    sourceLicense: 'CC BY-SA 4.0',
    contributor: skyCultureContributor,
    retrievedOn: generatedOn,
    coordinateSource: 'ESA Hipparcos Main Catalogue I/239 via CDS VizieR; CDS Sesame / SIMBAD fallback for blank catalogue coordinates',
    coordinateEpoch: 'ICRS, epoch J1991.25',
    parallaxSource: 'Hipparcos, the New Reduction I/311 via CDS VizieR',
    sourceNarrative: sourceAudit.sourceNarrative,
    counts: {
      historicalXingguans: sourceAudit.sourceNarrative.historicalXingguans,
      ordinaryHistoricalXingguans: sourceAudit.structure.ordinaryHistoricalXingguans,
      renderFigures: sourceAudit.structure.constellationEntries,
      nonMansionRenderFigures: sourceAudit.structure.nonMansionRenderFigures,
      lunarMansionRenderFigures: sourceAudit.structure.lunarMansionRenderFigures,
      auxiliaryVassalFigureEntries: sourceAudit.structure.auxiliaryVassalFigureEntries,
      auxiliaryVassalLogicalFigures: sourceAudit.structure.auxiliaryVassalLogicalFigures,
      uniqueHipStars: allHips.length,
      deepSkyObjects: deepSkyObjects.length,
      lineStrips: lineStripCount,
      lineSegments: lineSegmentCount,
      drawableLineSegments: drawableLineSegmentCount,
    },
  },
  stars: allHips.map((hip) => coordinateByHip.get(hip)),
  deepSkyObjects,
  figures,
}

const mappings = rawMappings.map(({ hips, ...mapping }) => ({
  ...mapping,
  stars: hips.map((hip) => coordinateByHip.get(hip)),
  definingStarDistance: distanceByHip.get(mapping.definingStarHip),
  interactive: true,
  mappingStatus: 'adopted-display-version',
  differenceNote:
    '采用 Stellarium 26.2 中国宋代星空文化的星官线与距星定义；不同历史时期对距星、增星及星官成员可能有异，页面不将其宣称为唯一古代定本。',
  sourceIds: ['astronomy-hipparcos', 'astronomy-hipparcos-2', 'culture-stellarium-song'],
}))

await mkdir('data-sources/stellarium/chinese_song_dynasty/v26.2', { recursive: true })
await mkdir('src/data', { recursive: true })
await writeFile('data-sources/stellarium/chinese_song_dynasty/v26.2/index.json', cultureText)
await writeFile('data-sources/stellarium/chinese_song_dynasty/v26.2/description.md', descriptionText)
await writeFile(
  'data-sources/stellarium/chinese_song_dynasty/v26.2/README.md',
  `# Stellarium Chinese Song Dynasty sky culture snapshot\n\n- Stellarium version: ${STELLARIUM_VERSION}\n- Git tag: \`${STELLARIUM_TAG}\`\n- Commit: \`${STELLARIUM_COMMIT}\`\n- Sky culture: \`chinese_song_dynasty\` / Chinese Song Dynasty Sky\n- Contributor: ${skyCultureContributor}\n- Source directory: https://github.com/${repository}/tree/${STELLARIUM_TAG}/skycultures/chinese_song_dynasty\n- Official index: https://github.com/${repository}/blob/${STELLARIUM_TAG}/${skyCulturePath}\n- Official description: https://github.com/${repository}/blob/${STELLARIUM_TAG}/${descriptionPath}\n- Sky-culture license: CC BY-SA 4.0\n- Retrieved: ${generatedOn}\n- Runtime derivative: \`src/data/traditional-chinese-sky.json\`\n\nThe two source files in this directory are an unmodified local snapshot. The source description records 283 historical Xingguans and 1,464 stars including M7 and M44; the machine-readable index contains 339 render figures and 1,462 unique render references (1,460 HIP plus two DSO identifiers). Run \`npm run audit:stellarium-song\` to reproduce the structural counts.\n`,
)
await writeFile(
  'src/data/traditional-chinese-sky.json',
  `${JSON.stringify(traditionalSkySnapshot, null, 2)}\n`,
)
await writeFile(
  'src/data/mansion-star-mappings.json',
  `${JSON.stringify({
    metadata: {
      mappingSource: 'Stellarium Chinese Song Dynasty sky culture',
      repository,
      path: skyCulturePath,
      descriptionPath,
      version: STELLARIUM_VERSION,
      tag: STELLARIUM_TAG,
      commit: STELLARIUM_COMMIT,
      sourceLicense: 'CC BY-SA 4.0',
      contributor: skyCultureContributor,
      coordinateSource: 'ESA Hipparcos Main Catalogue I/239 via CDS VizieR; CDS Sesame / SIMBAD fallback for blank catalogue coordinates',
      parallaxSource: 'Hipparcos, the New Reduction I/311 via CDS VizieR',
      coordinateEpoch: 'ICRS, epoch J1991.25',
      generatedOn,
    },
    mappings,
  }, null, 2)}\n`,
)

const availableDistances = [...distanceByHip.values()].filter((entry) => entry.status === 'available').length
console.log(
  `Generated ${sourceAudit.structure.constellationEntries} render figures ` +
  `(${sourceAudit.sourceNarrative.historicalXingguans} historical Xingguans; 28 mansion figures), ` +
  `${allHips.length} unique HIP stars, ${drawableLineSegmentCount} drawable line segments, and ` +
  `${availableDistances}/28 reliable defining-star distances.`,
)
