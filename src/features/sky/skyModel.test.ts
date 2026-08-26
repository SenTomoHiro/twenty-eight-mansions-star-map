import { describe, expect, it } from 'vitest'
import { YANGCHENG_REFERENCE } from '../../config/observation'
import mansionStarMappingsData from '../../data/mansion-star-mappings.json'
import traditionalSkyData from '../../data/traditional-chinese-sky.json'
import type { MansionStarMapping, TraditionalChineseSkyData } from '../../types/xingxiu'
import { makeObservationDate } from '../../utils/astronomy'
import {
  buildTraditionalPositionCache,
  danglingTraditionalReferences,
  mansionFrameSummary,
} from './skyModel'

const data = traditionalSkyData as TraditionalChineseSkyData
const mappings = mansionStarMappingsData.mappings as MansionStarMapping[]

describe('traditional Chinese sky model', () => {
  it('loads the complete pinned Stellarium snapshot', () => {
    expect(data.metadata.version).toBe('26.2')
    expect(data.figures).toHaveLength(data.metadata.counts.renderFigures)
    expect(data.figures).toHaveLength(339)
    expect(data.metadata.counts.historicalXingguans).toBe(283)
    expect(data.stars).toHaveLength(1460)
    expect(data.deepSkyObjects).toHaveLength(2)
    expect(data.metadata.counts.lineStrips).toBe(432)
    expect(data.metadata.counts.lineSegments).toBe(1250)
    expect(data.metadata.counts.drawableLineSegments).toBe(1187)
  })

  it('resolves every official line reference without a dangling HIP or DSO', () => {
    const positions = buildTraditionalPositionCache(
      data,
      makeObservationDate('2026-08-24', '21:00'),
      YANGCHENG_REFERENCE.latitude,
      YANGCHENG_REFERENCE.longitude,
      100,
    )
    expect(danglingTraditionalReferences(data, positions)).toEqual([])
  })

  it.each(['00:00', '06:00', '12:00', '18:00', '21:00'])(
    'keeps all 28 mansion entities while positions change at %s',
    (time) => {
      const positions = buildTraditionalPositionCache(
        data,
        makeObservationDate('2026-08-24', time),
        YANGCHENG_REFERENCE.latitude,
        YANGCHENG_REFERENCE.longitude,
        100,
      )
      const frame = mansionFrameSummary(mappings, positions)
      expect(frame).toHaveLength(28)
      expect(frame.every((entry) => entry.interactive)).toBe(true)
      expect(frame.some((entry) => entry.visibleMemberCount > 0)).toBe(true)
      expect(frame.some((entry) => entry.visibleSegmentCount > 0)).toBe(true)
      expect(frame.every((entry) => entry.totalMemberCount > 0)).toBe(true)
      expect(frame.some((entry) => entry.belowHorizonMemberCount > 0)).toBe(true)
      expect(frame.some((entry) => entry.belowHorizonSegmentCount > 0)).toBe(true)
      expect(frame.every((entry) =>
        entry.totalSegmentCount === entry.visibleSegmentCount + entry.belowHorizonSegmentCount
      )).toBe(true)
    },
  )

  it('moves the full traditional sky between dates and times', () => {
    const first = buildTraditionalPositionCache(
      data,
      makeObservationDate('2026-03-20', '00:00'),
      YANGCHENG_REFERENCE.latitude,
      YANGCHENG_REFERENCE.longitude,
      100,
    )
    const second = buildTraditionalPositionCache(
      data,
      makeObservationDate('2026-12-21', '18:00'),
      YANGCHENG_REFERENCE.latitude,
      YANGCHENG_REFERENCE.longitude,
      100,
    )
    const hip = data.stars[0]!.hip
    expect(first.get(hip)).not.toEqual(second.get(hip))
  })

  it('isolates interaction to the 28 mansion layer', () => {
    expect(mappings.every((mapping) => mapping.interactive)).toBe(true)
    expect(data.figures.every((figure) => !figure.interactive)).toBe(true)
  })

  it('keeps every below-horizon mansion interactive instead of deleting its targets', () => {
    const positions = buildTraditionalPositionCache(
      data,
      makeObservationDate('2026-08-24', '21:00'),
      YANGCHENG_REFERENCE.latitude,
      YANGCHENG_REFERENCE.longitude,
      100,
    )
    const below = mansionFrameSummary(mappings, positions).filter(
      (entry) => entry.belowHorizonMemberCount > 0,
    )
    expect(below.length).toBeGreaterThan(0)
    expect(below.every((entry) => entry.interactive)).toBe(true)
  })
})
