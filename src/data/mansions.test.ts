import { describe, expect, it } from 'vitest'
import { MANSIONS } from './mansions'
import { XINGXIU_ASSET_MANIFEST } from './xingxiuAssetManifest'

describe('mansion data', () => {
  it('contains the canonical 28-item order', () => {
    expect(MANSIONS).toHaveLength(28)
    expect(MANSIONS.map((item) => item.name).join('')).toBe(
      '角亢氐房心尾箕斗牛女虚危室壁奎娄胃昴毕觜参井鬼柳星张翼轸',
    )
  })

  it('contains four groups of seven', () => {
    const counts = new Map<string, number>()
    MANSIONS.forEach((item) => counts.set(item.symbolId, (counts.get(item.symbolId) ?? 0) + 1))
    expect([...counts.values()]).toEqual([7, 7, 7, 7])
  })

  it('uses unique stable ids and asset stems', () => {
    expect(new Set(MANSIONS.map((item) => item.id)).size).toBe(28)
    expect(new Set(MANSIONS.map((item) => item.assetStem)).size).toBe(28)
  })

  it('maps all 28 approved artworks in canonical order', () => {
    expect(XINGXIU_ASSET_MANIFEST).toHaveLength(28)
    expect(XINGXIU_ASSET_MANIFEST.map((entry) => entry.order)).toEqual(
      Array.from({ length: 28 }, (_, index) => index + 1),
    )
    expect(XINGXIU_ASSET_MANIFEST.every((entry) => entry.approvedForUi)).toBe(true)
    expect(MANSIONS.every((entry) => entry.assetStatus === 'approved-artwork')).toBe(true)
    expect(XINGXIU_ASSET_MANIFEST.map((entry) => entry.artworkWebAsset)).toEqual(
      MANSIONS.map((mansion) => `src/assets/xingxiu/artworks/${mansion.assetStem}.png`),
    )
    expect(new Set(XINGXIU_ASSET_MANIFEST.map((entry) => entry.artworkWebAsset)).size).toBe(28)
    expect(XINGXIU_ASSET_MANIFEST.filter((entry) => entry.officialOriginalPhoto)).toHaveLength(6)
  })
})
