import type {
  MansionStarMapping,
  TraditionalChineseSkyData,
  TraditionalSkyReference,
} from '../../types/xingxiu'
import { equatorialToCartesian } from '../../utils/astronomy'

export interface SkyObjectPosition {
  x: number
  y: number
  z: number
  altitude: number
  azimuth: number
}

export type SkyPositionCache = Map<TraditionalSkyReference, SkyObjectPosition>

export function buildTraditionalPositionCache(
  data: TraditionalChineseSkyData,
  observationDate: Date,
  latitude: number,
  longitude: number,
  radius: number,
): SkyPositionCache {
  const cache: SkyPositionCache = new Map()
  data.stars.forEach((star) => {
    const position = equatorialToCartesian(star, observationDate, latitude, longitude, radius)
    cache.set(star.hip, {
      x: position.x,
      y: position.y,
      z: position.z,
      altitude: position.horizontal.altitude,
      azimuth: position.horizontal.azimuth,
    })
  })
  data.deepSkyObjects.forEach((object) => {
    const position = equatorialToCartesian(object, observationDate, latitude, longitude, radius)
    cache.set(object.id, {
      x: position.x,
      y: position.y,
      z: position.z,
      altitude: position.horizontal.altitude,
      azimuth: position.horizontal.azimuth,
    })
  })
  return cache
}

export function mansionFrameSummary(
  mappings: MansionStarMapping[],
  positions: SkyPositionCache,
) {
  return mappings.map((mapping) => {
    const totalMemberCount = mapping.stars.filter((star) => positions.has(star.hip)).length
    const visibleMemberCount = mapping.stars.filter(
      (star) => (positions.get(star.hip)?.altitude ?? -90) >= 0,
    ).length
    let visibleSegmentCount = 0
    let belowHorizonSegmentCount = 0
    let totalSegmentCount = 0
    mapping.lines.forEach((strip) => {
      for (let index = 1; index < strip.length; index += 1) {
        const previous = positions.get(strip[index - 1]!)
        const current = positions.get(strip[index]!)
        if (previous && current) {
          totalSegmentCount += 1
          if (previous.altitude >= 0 || current.altitude >= 0) visibleSegmentCount += 1
          else belowHorizonSegmentCount += 1
        }
      }
    })
    return {
      id: mapping.mansionId,
      interactive: mapping.interactive,
      totalMemberCount,
      visibleMemberCount,
      belowHorizonMemberCount: totalMemberCount - visibleMemberCount,
      totalSegmentCount,
      visibleSegmentCount,
      belowHorizonSegmentCount,
    }
  })
}

export function danglingTraditionalReferences(
  data: TraditionalChineseSkyData,
  positions: SkyPositionCache,
) {
  return data.figures.flatMap((figure) =>
    figure.memberRefs
      .filter((reference) => !positions.has(reference))
      .map((reference) => ({ figureId: figure.id, reference })),
  )
}
