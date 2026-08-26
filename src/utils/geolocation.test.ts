import { describe, expect, it } from 'vitest'
import { YANGCHENG_REFERENCE } from '../config/observation'
import { requestCurrentObserver } from './geolocation'

function geolocationWith(
  result: { latitude: number; longitude: number } | GeolocationPositionError,
): Geolocation {
  return {
    getCurrentPosition(success, failure) {
      if ('latitude' in result) {
        success({
          coords: { ...result } as GeolocationCoordinates,
          timestamp: 0,
          toJSON: () => ({}),
        })
      } else {
        failure?.(result)
      }
    },
    watchPosition: () => 0,
    clearWatch: () => undefined,
  }
}

function positionError(code: number): GeolocationPositionError {
  return {
    code,
    message: 'mock',
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  }
}

describe('browser geolocation fallback', () => {
  it('switches to an in-memory current observer on success', async () => {
    const result = await requestCurrentObserver(
      geolocationWith({ latitude: 31.23, longitude: 121.47 }),
      'Asia/Shanghai',
    )
    expect(result).toEqual({
      status: 'success',
      observer: expect.objectContaining({ latitude: 31.23, longitude: 121.47 }),
    })
  })

  it.each([
    [1, 'denied'],
    [2, 'unavailable'],
    [3, 'timeout'],
  ])('returns a quiet fallback status for error %s', async (code, status) => {
    await expect(requestCurrentObserver(geolocationWith(positionError(code)))).resolves.toEqual({ status })
    expect(YANGCHENG_REFERENCE.shortName).toBe('夏都阳城')
  })

  it('handles browsers without geolocation', async () => {
    await expect(requestCurrentObserver(undefined)).resolves.toEqual({ status: 'unsupported' })
  })
})
