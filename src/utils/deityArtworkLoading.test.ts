import { describe, expect, it } from 'vitest'
import { MANSIONS } from '../data/mansions'
import {
  createArtworkLoadController,
  mobileArtworkStem,
  shouldAttemptArtworkTimeoutFallback,
  shouldUseMobileArtwork,
} from './deityArtworkLoading'

describe('low-network deity artwork selection', () => {
  it('selects a compressed derivative for every device when data saving is enabled', () => {
    expect(shouldUseMobileArtwork({ connection: { saveData: true } })).toBe(true)
  })

  it('keeps the high-resolution artwork on a normal connection', () => {
    expect(shouldUseMobileArtwork({ connection: { effectiveType: '4g' } })).toBe(false)
  })

  it.each(['slow-2g', '2g', '3g'])('selects the compressed derivative on every device at %s', (effectiveType) => {
    expect(shouldUseMobileArtwork({ connection: { effectiveType } })).toBe(true)
  })

  it('only enables the timeout fallback when network information is unavailable', () => {
    expect(shouldAttemptArtworkTimeoutFallback(undefined)).toBe(true)
    expect(shouldAttemptArtworkTimeoutFallback({ effectiveType: '4g' })).toBe(false)
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

  it('keeps timeout sessions independent when the displayed deity changes quickly', () => {
    const previousDeity = createArtworkLoadController()
    const currentDeity = createArtworkLoadController()

    previousDeity.downgradeAfterTimeout()
    expect(previousDeity.source).toBe('mobile')
    expect(currentDeity.source).toBe('high')
    expect(currentDeity.hasDowngraded).toBe(false)
  })
})
