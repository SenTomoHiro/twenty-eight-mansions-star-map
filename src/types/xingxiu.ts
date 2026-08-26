export type FourSymbolId =
  | 'azure-dragon'
  | 'black-tortoise'
  | 'white-tiger'
  | 'vermillion-bird'

export type AssetStatus = 'approved-artwork' | 'artwork-pending'

export interface EquatorialCoordinate {
  ra: number
  dec: number
}

export interface MansionAnchor extends EquatorialCoordinate {
  designation: string
  commonName?: string
}

export interface Mansion {
  id: string
  order: number
  name: string
  fullName: string
  pinyin: string
  latin: string
  gloss: string
  nature: string
  animal: string
  symbolId: FourSymbolId
  symbolOrder: number
  anchor: MansionAnchor
  intro: string
  culturalNote: string
  sculptureNotes: string
  officialOriginalPhoto: boolean
  assetStem: string
  assetStatus: AssetStatus
  sourceIds: string[]
}

export interface FourSymbol {
  id: FourSymbolId
  name: string
  shortName: string
  direction: string
  latin: string
  season: string
  accent: string
  statement: string
}

export interface SourceRecord {
  id: string
  title: string
  type: 'astronomy' | 'culture' | 'relic' | 'location' | 'production'
  authorOrInstitution: string
  publication?: string
  url?: string
  licenseOrStatus: string
  publicUse: 'yes' | 'reference-only' | 'metadata-only'
  attributionRequired: boolean
  verified: boolean
  note: string
}

export interface BrightStar {
  id: number
  ra: number
  dec: number
  mag: number
}

export interface MansionMappedStar extends EquatorialCoordinate {
  hip: number
  mag: number
}

export interface StellarDistance {
  hip: number
  parallaxMas?: number
  parallaxErrorMas?: number
  relativeError?: number
  distanceLy?: number
  status: 'available' | 'insufficient'
  sourceId: 'astronomy-hipparcos-2'
  reason?: 'missing-parallax' | 'non-positive-parallax' | 'relative-error-above-20-percent'
}

export interface MansionStarMapping {
  mansionId: string
  order: number
  name: string
  traditionalAsterism: string
  englishName: string
  definingStarHip: number
  starCultureId: string
  stars: MansionMappedStar[]
  lines: number[][]
  definingStarDistance: StellarDistance
  interactive: true
  mappingStatus: 'adopted-display-version'
  differenceNote: string
  sourceIds: string[]
}

export type TraditionalSkyReference = number | `DSO:${string}`

export interface TraditionalSkyStar extends EquatorialCoordinate {
  hip: number
  mag: number
}

export interface TraditionalSkyDeepObject extends EquatorialCoordinate {
  id: `DSO:${string}`
  designation: string
  canonicalName?: string
  coordinateSource: string
}

export interface TraditionalSkyFigure {
  id: string
  name: string
  englishName: string
  pronunciation?: string
  group: { id: string; name: string }
  memberRefs: TraditionalSkyReference[]
  memberHips: number[]
  lines: TraditionalSkyReference[][]
  isLunarMansion: boolean
  interactive: false
}

export interface TraditionalChineseSkyData {
  metadata: {
    source: string
    repository: string
    path: string
    descriptionPath: string
    version: string
    tag: string
    commit: string
    sourceLicense: string
    contributor: string
    retrievedOn: string
    coordinateSource: string
    coordinateEpoch: string
    parallaxSource: string
    sourceNarrative: {
      historicalXingguans: number
      starsIncludingClusters: number
    }
    counts: {
      historicalXingguans: number
      ordinaryHistoricalXingguans: number
      renderFigures: number
      nonMansionRenderFigures: number
      lunarMansionRenderFigures: number
      auxiliaryVassalFigureEntries: number
      auxiliaryVassalLogicalFigures: number
      uniqueHipStars: number
      deepSkyObjects: number
      lineStrips: number
      lineSegments: number
      drawableLineSegments: number
    }
  }
  stars: TraditionalSkyStar[]
  deepSkyObjects: TraditionalSkyDeepObject[]
  figures: TraditionalSkyFigure[]
}

export interface SkyState {
  date: string
  time: string
  latitude: number
  longitude: number
  selectedMansionId: string
  selectedSymbolId: FourSymbolId
}
