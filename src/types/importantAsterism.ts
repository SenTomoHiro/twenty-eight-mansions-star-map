import type { MansionMappedStar } from './xingxiu'

export type ImportantAsterismId = 'beidou-nine' | 'nandou-six' | 'santai'
export type ImportantMappingConfidence = 'high' | 'mixed'
export type ImportantMemberMapping = 'modern-star' | 'shared-mansion-star' | 'traditional-position-only'

export interface ImportantAsterismMember {
  id: string
  name: string
  hip?: number
  designation?: string
  commonName?: string
  mapping: ImportantMemberMapping
  childGroupId?: string
  note: string
}

export interface ImportantAsterismChildGroup {
  id: string
  name: string
  memberIds: string[]
  summary: string
}

export interface ImportantAsterism {
  id: ImportantAsterismId
  order: number
  name: string
  latin: string
  aliases: string[]
  category: 'important-asterism'
  traditionalRegion: string
  members: ImportantAsterismMember[]
  lines: number[][]
  childGroups: ImportantAsterismChildGroup[]
  astronomySummary: string
  daoistSummary: string
  culturalMeaning: string
  modernMappingNotes: string
  mappingConfidence: ImportantMappingConfidence
  sourceIds: string[]
  sourceFigureIds: string[]
  sharedMansionId?: string
}

export interface ResolvedImportantMember extends ImportantAsterismMember {
  star?: MansionMappedStar
}

