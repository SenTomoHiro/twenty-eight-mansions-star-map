import { describe, expect, it } from 'vitest'
import { YANGCHENG_REFERENCE } from '../config/observation'
import {
  angularDistance,
  equatorialToCartesian,
  equatorialToHorizontal,
  greenwichMeanSiderealTime,
  horizontalToCartesian,
  julianDate,
  normalizeDegrees,
} from './astronomy'

describe('astronomy utilities', () => {
  it('computes the J2000 Julian date', () => {
    expect(julianDate(new Date('2000-01-01T12:00:00Z'))).toBeCloseTo(2451545, 6)
  })

  it('computes GMST at J2000 within display precision', () => {
    expect(greenwichMeanSiderealTime(new Date('2000-01-01T12:00:00Z'))).toBeCloseTo(
      280.460618,
      5,
    )
  })

  it('normalizes wrapped angles', () => {
    expect(normalizeDegrees(-10)).toBe(350)
    expect(normalizeDegrees(370)).toBe(10)
  })

  it('places a meridian star at the expected altitude', () => {
    const date = new Date('2026-08-24T13:00:00Z')
    const longitude = YANGCHENG_REFERENCE.longitude
    const ra = normalizeDegrees(greenwichMeanSiderealTime(date) + longitude)
    const result = equatorialToHorizontal(
      { ra, dec: 0 },
      date,
      YANGCHENG_REFERENCE.latitude,
      longitude,
    )
    expect(result.altitude).toBeCloseTo(55.599722, 3)
  })

  it('returns zero angular distance for the same coordinate', () => {
    expect(angularDistance({ ra: 20, dec: -5 }, { ra: 20, dec: -5 })).toBeCloseTo(0, 6)
  })

  it('uses the local 3D frame with east +X, zenith +Y and north +Z', () => {
    expect(horizontalToCartesian(0, 90)).toEqual({ x: 1, y: 0, z: expect.closeTo(0, 12) })
    expect(horizontalToCartesian(90, 0)).toEqual({ x: 0, y: 1, z: expect.closeTo(0, 12) })
    expect(horizontalToCartesian(0, 0)).toEqual({ x: 0, y: 0, z: 1 })
  })

  it('moves an RA/Dec direction through the 3D horizon frame as time changes', () => {
    const coordinate = { ra: 201.2983523, dec: -11.16124491 }
    const evening = equatorialToCartesian(
      coordinate,
      new Date('2026-08-24T13:00:00Z'),
      YANGCHENG_REFERENCE.latitude,
      YANGCHENG_REFERENCE.longitude,
    )
    const later = equatorialToCartesian(
      coordinate,
      new Date('2026-08-24T17:00:00Z'),
      YANGCHENG_REFERENCE.latitude,
      YANGCHENG_REFERENCE.longitude,
    )

    expect(Math.hypot(evening.x, evening.y, evening.z)).toBeCloseTo(1, 10)
    expect(Math.hypot(later.x, later.y, later.z)).toBeCloseTo(1, 10)
    expect(Math.hypot(evening.x - later.x, evening.y - later.y, evening.z - later.z)).toBeGreaterThan(0.5)
  })

  it('changes horizontal coordinates with observer location without mutating RA/Dec', () => {
    const coordinate = { ra: 201.2983523, dec: -11.16124491 }
    const original = { ...coordinate }
    const date = new Date('2026-08-24T13:00:00Z')
    const yangcheng = equatorialToHorizontal(
      coordinate,
      date,
      YANGCHENG_REFERENCE.latitude,
      YANGCHENG_REFERENCE.longitude,
    )
    const elsewhere = equatorialToHorizontal(coordinate, date, 51.5, -0.12)
    expect(elsewhere.altitude).not.toBeCloseTo(yangcheng.altitude, 3)
    expect(elsewhere.azimuth).not.toBeCloseTo(yangcheng.azimuth, 3)
    expect(coordinate).toEqual(original)
  })
})
