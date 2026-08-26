export type CulturalReliability =
  | 'primary-source-confirmed'
  | 'multiple-sources'
  | 'secondary-source-only'
  | 'disputed'
  | 'insufficient'

export type CulturalLayer = 'traditional-astronomy' | 'omen' | 'daoist' | 'later-custom'

export interface CulturalField {
  title: string
  text: string
  reliability: CulturalReliability
  sourceIds: string[]
}

export interface AncientCitation {
  id: string
  sourceId: string
  layer: CulturalLayer
  book: string
  section: string
  dynasty: string
  authorOrCompiler: string
  locator: string
  quote: string
  interpretation: string
  reliability: CulturalReliability
}

export interface XingxiuCultureProfile {
  mansionId: string
  editorialStatus: CulturalReliability
  oneLinePosition: string
  nameAndImage: CulturalField
  humanOrder: CulturalField
  omenTradition: CulturalField
  regionalField: CulturalField
  daoistTradition: CulturalField
  ancientEvidence: [AncientCitation, AncientCitation]
  sourceIds: string[]
}

export interface CulturalSourceRecord {
  id: string
  category: 'ancient-astronomy' | 'ancient-history' | 'daoist-canon' | 'modern-research'
  title: string
  authorOrCompiler: string
  dynastyOrYear: string
  edition: string
  locator: string
  url: string
  verification: 'facsimile-or-edition-checked' | 'parallel-transcriptions-checked' | 'bibliographic-only'
  note: string
}

