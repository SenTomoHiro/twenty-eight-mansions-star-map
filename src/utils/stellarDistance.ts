import type { StellarDistance } from '../types/xingxiu'

const PARSEC_TO_LIGHT_YEAR = 3.26156
export const MAX_SIMPLE_INVERSION_RELATIVE_ERROR = 0.2

export function distanceFromParallax(
  hip: number,
  parallaxMas?: number,
  parallaxErrorMas?: number,
): StellarDistance {
  const sourceId = 'astronomy-hipparcos-2' as const
  if (parallaxMas === undefined || parallaxErrorMas === undefined) {
    return { hip, status: 'insufficient', sourceId, reason: 'missing-parallax' }
  }
  if (parallaxMas <= 0) {
    return {
      hip,
      parallaxMas,
      parallaxErrorMas,
      status: 'insufficient',
      sourceId,
      reason: 'non-positive-parallax',
    }
  }
  const relativeError = parallaxErrorMas / parallaxMas
  if (!Number.isFinite(relativeError) || relativeError > MAX_SIMPLE_INVERSION_RELATIVE_ERROR) {
    return {
      hip,
      parallaxMas,
      parallaxErrorMas,
      relativeError,
      status: 'insufficient',
      sourceId,
      reason: 'relative-error-above-20-percent',
    }
  }
  return {
    hip,
    parallaxMas,
    parallaxErrorMas,
    relativeError,
    distanceLy: Math.round((1000 / parallaxMas) * PARSEC_TO_LIGHT_YEAR),
    status: 'available',
    sourceId,
  }
}

export function formatStellarDistance(distance: StellarDistance) {
  return distance.status === 'available' && distance.distanceLy !== undefined
    ? `约 ${distance.distanceLy.toLocaleString('zh-CN')} 光年`
    : '距离数据不足'
}
