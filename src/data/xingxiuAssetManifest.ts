import { MANSIONS } from './mansions'

export interface XingxiuAssetManifestEntry {
  id: string
  order: number
  name: string
  officialOriginalPhoto: boolean
  artworkWebAsset: string
  approvedForUi: true
}

/** Public runtime mapping for the 28 individually approved Web illustrations. */
export const XINGXIU_ASSET_MANIFEST: XingxiuAssetManifestEntry[] = MANSIONS.map((mansion) => ({
  id: mansion.id,
  order: mansion.order,
  name: mansion.name,
  officialOriginalPhoto: mansion.officialOriginalPhoto,
  artworkWebAsset: `src/assets/xingxiu/artworks/${mansion.assetStem}.png`,
  approvedForUi: true,
}))
