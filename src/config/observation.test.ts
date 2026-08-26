import { describe, expect, it } from 'vitest'
import { OBSERVATION_CAMERA, YANGCHENG_REFERENCE } from './observation'

describe('Yangcheng observation defaults', () => {
  it('keeps the engineering reference in one immutable configuration', () => {
    expect(YANGCHENG_REFERENCE).toMatchObject({
      name: '夏都阳城参考视角',
      latitude: 34.400278,
      longitude: 113.125556,
      timezone: 'Asia/Shanghai',
    })
    expect(Object.isFrozen(YANGCHENG_REFERENCE)).toBe(true)
  })

  it('enters and resets to the confirmed south-facing camera', () => {
    expect(OBSERVATION_CAMERA).toMatchObject({ azimuth: 180, altitude: 35, fov: 58 })
  })
})
