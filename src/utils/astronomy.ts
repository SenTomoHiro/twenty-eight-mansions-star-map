import type { EquatorialCoordinate } from '../types/xingxiu'
import { YANGCHENG_REFERENCE } from '../config/observation'

export interface HorizontalCoordinate {
  altitude: number
  azimuth: number
  hourAngle: number
}

export interface CartesianDirection {
  x: number
  y: number
  z: number
}

const DEG = Math.PI / 180
const RAD = 180 / Math.PI

export function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function julianDate(date: Date) {
  return date.getTime() / 86_400_000 + 2_440_587.5
}

export function greenwichMeanSiderealTime(date: Date) {
  const jd = julianDate(date)
  const t = (jd - 2_451_545) / 36_525
  return normalizeDegrees(
    280.46061837 +
      360.98564736629 * (jd - 2_451_545) +
      0.000387933 * t * t -
      (t * t * t) / 38_710_000,
  )
}

export function localSiderealTime(date: Date, longitude: number) {
  return normalizeDegrees(greenwichMeanSiderealTime(date) + longitude)
}

export function equatorialToHorizontal(
  coordinate: EquatorialCoordinate,
  date: Date,
  latitude: number,
  longitude: number,
): HorizontalCoordinate {
  const hourAngle = normalizeDegrees(localSiderealTime(date, longitude) - coordinate.ra)
  const signedHourAngle = hourAngle > 180 ? hourAngle - 360 : hourAngle
  const h = signedHourAngle * DEG
  const dec = coordinate.dec * DEG
  const lat = latitude * DEG

  const sinAltitude =
    Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(h)
  const altitude = Math.asin(clamp(sinAltitude, -1, 1))

  const azimuth = Math.atan2(
    Math.sin(h),
    Math.cos(h) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat),
  )

  return {
    altitude: altitude * RAD,
    azimuth: normalizeDegrees(azimuth * RAD + 180),
    hourAngle: signedHourAngle,
  }
}

/**
 * Convert an altitude/azimuth direction into the local Three.js horizon frame.
 * +X is east, +Y is zenith and +Z is north, so the observer can remain at the
 * origin while looking outward at a celestial sphere.
 */
export function horizontalToCartesian(
  altitude: number,
  azimuth: number,
  radius = 1,
): CartesianDirection {
  const altitudeRadians = altitude * DEG
  const azimuthRadians = azimuth * DEG
  const horizontalRadius = Math.cos(altitudeRadians) * radius

  return {
    x: Math.sin(azimuthRadians) * horizontalRadius,
    y: Math.sin(altitudeRadians) * radius,
    z: Math.cos(azimuthRadians) * horizontalRadius,
  }
}

export function equatorialToCartesian(
  coordinate: EquatorialCoordinate,
  date: Date,
  latitude: number,
  longitude: number,
  radius = 1,
) {
  const horizontal = equatorialToHorizontal(coordinate, date, latitude, longitude)
  return {
    ...horizontalToCartesian(horizontal.altitude, horizontal.azimuth, radius),
    horizontal,
  }
}

function partsAsUtc(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const numberPart = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0)
  return Date.UTC(
    numberPart('year'),
    numberPart('month') - 1,
    numberPart('day'),
    numberPart('hour'),
    numberPart('minute'),
    numberPart('second'),
  )
}

export function makeObservationDate(
  date: string,
  time: string,
  timeZone = YANGCHENG_REFERENCE.timezone,
) {
  const [year = 1970, month = 1, day = 1] = date.split('-').map(Number)
  const [hour = 0, minute = 0] = time.split(':').map(Number)
  const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0)
  let instant = new Date(wallClockAsUtc)
  for (let pass = 0; pass < 2; pass += 1) {
    const offset = partsAsUtc(instant, timeZone) - instant.getTime()
    instant = new Date(wallClockAsUtc - offset)
  }
  return instant
}

export function formatChineseDate(date: string, timeZone = YANGCHENG_REFERENCE.timezone) {
  const parsed = makeObservationDate(date, '12:00', timeZone)
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(parsed)
}

export function dateInputValue(date = new Date(), timeZone = YANGCHENG_REFERENCE.timezone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

export function representativeSeasonDate(year: number, season: 'spring' | 'summer' | 'autumn' | 'winter') {
  const dates = {
    spring: `${year}-03-20`,
    summer: `${year}-06-21`,
    autumn: `${year}-09-22`,
    winter: `${year}-12-21`,
  }
  return dates[season]
}

export function angularDistance(a: EquatorialCoordinate, b: EquatorialCoordinate) {
  const ra1 = a.ra * DEG
  const ra2 = b.ra * DEG
  const dec1 = a.dec * DEG
  const dec2 = b.dec * DEG
  return (
    Math.acos(
      clamp(
        Math.sin(dec1) * Math.sin(dec2) +
          Math.cos(dec1) * Math.cos(dec2) * Math.cos(ra1 - ra2),
        -1,
        1,
      ),
    ) * RAD
  )
}
