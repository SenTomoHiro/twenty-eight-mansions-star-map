import { describe, expect, it } from 'vitest'
import { distanceFromParallax, formatStellarDistance } from './stellarDistance'

describe('Hipparcos parallax distance', () => {
  it('converts a reliable positive parallax to rounded light years', () => {
    const result = distanceFromParallax(80112, 4.68, 0.6)
    expect(result.status).toBe('available')
    expect(result.distanceLy).toBe(697)
    expect(formatStellarDistance(result)).toBe('约 697 光年')
  })

  it('rejects a missing parallax', () => {
    expect(distanceFromParallax(1).reason).toBe('missing-parallax')
  })

  it('rejects a non-positive parallax', () => {
    expect(distanceFromParallax(2, 0, 0.2).reason).toBe('non-positive-parallax')
    expect(distanceFromParallax(3, -1, 0.2).reason).toBe('non-positive-parallax')
  })

  it('rejects simple inversion when relative error exceeds 20 percent', () => {
    const result = distanceFromParallax(4, 2, 0.6)
    expect(result.status).toBe('insufficient')
    expect(result.reason).toBe('relative-error-above-20-percent')
  })
})
