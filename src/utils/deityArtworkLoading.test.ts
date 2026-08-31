import { describe, expect, it } from 'vitest'
import { MANSIONS } from '../data/mansions'
import {
  createArtworkLoadController,
  mobileArtworkStem,
  shouldUseMobileArtwork,
} from './deityArtworkLoading'

describe('mobile deity artwork selection', () => {
  it('never selects a mobile derivative for desktop, even on a low-speed connection', () => {
    expect(shouldUseMobileArtwork({ mobile: false, connection: { effectiveType: '2g', saveData: true } })).toBe(false)
  })

  it('keeps the high-resolution artwork on a normal mobile connection', () => {
    expect(shouldUseMobileArtwork({ mobile: true, connection: { effectiveType: '4g' } })).toBe(false)
  })

  it.each(['slow-2g', '2g', '3g'])('selects the mobile derivative on %s mobile networks', (effectiveType) => {
    expect(shouldUseMobileArtwork({ mobile: true, connection: { effectiveType } })).toBe(true)
  })

  it('selects the mobile derivative when the browser reports data saving', () => {
    expect(shouldUseMobileArtwork({ mobile: true, connection: { saveData: true } })).toBe(true)
  })

  it('maps every approved mansion artwork to one deterministic mobile filename', () => {
    expect(MANSIONS.map((mansion) => mobileArtworkStem(mansion.assetStem))).toEqual(
      MANSIONS.map((mansion) => `${mansion.assetStem}.mobile`),
    )
  })

})

describe('high-resolution artwork timeout fallback', () => {
  it('downgrades a pending high-resolution image exactly once', () => {
    const controller = createArtworkLoadController()

    expect(controller.downgradeAfterTimeout()).toBe(true)
    expect(controller.source).toBe('mobile')
    expect(controller.downgradeAfterTimeout()).toBe(false)
  })

  it('does not downgrade after the high-resolution image has loaded', () => {
    const controller = createArtworkLoadController()
    controller.markHighResolutionLoaded()

    expect(controller.downgradeAfterTimeout()).toBe(false)
    expect(controller.source).toBe('high')
  })
})
