export interface ObserverLocation {
  name: string
  shortName: string
  detail: string
  latitude: number
  longitude: number
  timezone: string
}

/**
 * Engineering reference point for the Wangchenggang site near Gaocheng.
 * Coordinate source: Quaternary Sciences 38(2), 2018, 34°24′01″N / 113°07′32″E.
 */
export const YANGCHENG_REFERENCE: ObserverLocation = Object.freeze({
  name: '夏都阳城参考视角',
  shortName: '夏都阳城',
  detail: '今河南登封告成·王城岗一带',
  latitude: 34.400278,
  longitude: 113.125556,
  timezone: 'Asia/Shanghai',
})

export const OBSERVATION_CAMERA = Object.freeze({
  azimuth: 180,
  altitude: 35,
  fov: 58,
  maxAltitude: 86,
  minAltitude: -86,
})

export const GEOLOCATION_OPTIONS: PositionOptions = Object.freeze({
  enableHighAccuracy: false,
  timeout: 8_000,
  maximumAge: 10 * 60 * 1_000,
})

export function currentObserver(latitude: number, longitude: number, timezone: string): ObserverLocation {
  return {
    name: '当前位置',
    shortName: '当前位置',
    detail: '仅用于本次浏览器运行',
    latitude,
    longitude,
    timezone,
  }
}

export function formatCoordinate(value: number, positive: string, negative: string, digits = 2) {
  return `${Math.abs(value).toFixed(digits)}°${value >= 0 ? positive : negative}`
}
