import {
  GEOLOCATION_OPTIONS,
  currentObserver,
  type ObserverLocation,
} from '../config/observation'

export type GeolocationResult =
  | { status: 'success'; observer: ObserverLocation }
  | { status: 'unsupported' | 'denied' | 'unavailable' | 'timeout' | 'failed' }

function failureStatus(
  error: GeolocationPositionError,
): Exclude<GeolocationResult['status'], 'success'> {
  if (error.code === error.PERMISSION_DENIED) return 'denied'
  if (error.code === error.POSITION_UNAVAILABLE) return 'unavailable'
  if (error.code === error.TIMEOUT) return 'timeout'
  return 'failed'
}

export function requestCurrentObserver(
  geolocation?: Geolocation,
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
): Promise<GeolocationResult> {
  const source = geolocation ?? (typeof navigator === 'undefined' ? undefined : navigator.geolocation)
  if (!source) return Promise.resolve({ status: 'unsupported' })

  return new Promise((resolve) => {
    source.getCurrentPosition(
      ({ coords }) => resolve({
        status: 'success',
        observer: currentObserver(coords.latitude, coords.longitude, timezone),
      }),
      (error) => resolve({ status: failureStatus(error) }),
      GEOLOCATION_OPTIONS,
    )
  })
}
