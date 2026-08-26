import { describe, expect, it, vi } from 'vitest'
import traditionalSkyData from '../../data/traditional-chinese-sky.json'
import type { TraditionalChineseSkyData } from '../../types/xingxiu'
import {
  calculateLabelTextureLayout,
  clearLabelLayoutCache,
  getCachedLabelTextureLayout,
  labelFitsViewport,
  labelLayoutCacheKey,
  type LabelTextMeasurer,
} from './skyLabelTexture'

const data = traditionalSkyData as TraditionalChineseSkyData

const measuredWidth = (text: string) => [...text].reduce(
  (width, character) => width + ((character.codePointAt(0) ?? 0) <= 0xff ? 18 : 50),
  0,
)

const measure: LabelTextMeasurer = (text) => {
  const width = measuredWidth(text)
  return {
    width,
    actualBoundingBoxLeft: 4,
    actualBoundingBoxRight: width + 6,
    actualBoundingBoxAscent: 44,
    actualBoundingBoxDescent: 10,
  }
}

describe('measured sky label textures', () => {
  it('measures at least ten real figure names across all available lengths', () => {
    const names = [...new Set(data.figures.map((figure) => figure.name))]
    const longest = [...names].sort((a, b) => [...b].length - [...a].length).slice(0, 5)
    const byLength = [...new Set(names.map((name) => [...name].length))]
      .map((length) => names.find((name) => [...name].length === length))
      .filter((name): name is string => Boolean(name))
    const samples = [...new Set([...longest, ...byLength])]
    expect(samples.length).toBeGreaterThanOrEqual(10)
    expect(samples).toContain('五诸侯(太微垣)')

    samples.forEach((title) => {
      const layout = calculateLabelTextureLayout({ title, subtitle: '', compact: true }, measure)
      expect(layout.width).toBeGreaterThanOrEqual(measuredWidth(title) + layout.paddingX * 2)
      expect(layout.paddingX).toBeGreaterThanOrEqual(30)
    })
  })

  it('uses actual measured glyph bearings plus left and right padding', () => {
    const spy = vi.fn(measure)
    const title = '五诸侯(太微垣)'
    const layout = calculateLabelTextureLayout({ title, subtitle: '', compact: true }, spy)
    expect(spy).toHaveBeenCalledWith(title, expect.stringContaining('52px'))
    expect(layout.width).toBeGreaterThanOrEqual(measuredWidth(title) + 10 + layout.paddingX * 2)
  })

  it('keeps the texture and sprite aspect ratio derived from measured dimensions', () => {
    const layout = calculateLabelTextureLayout(
      { title: '三公(紫微垣)', subtitle: '', compact: true },
      measure,
    )
    expect(layout.aspectRatio).toBeCloseTo(layout.width / layout.height, 10)
    expect(layout.aspectRatio).toBeGreaterThan(1)
  })

  it('keys cached measurements by text, subtitle, font size, and compact mode', () => {
    clearLabelLayoutCache()
    const spy = vi.fn(measure)
    const firstInput = { title: '北极', subtitle: '', compact: true }
    const secondInput = { title: '五诸侯(太微垣)', subtitle: '', compact: true }
    const regularInput = { ...firstInput, compact: false }
    const first = getCachedLabelTextureLayout(firstInput, spy)
    const callsAfterFirst = spy.mock.calls.length
    expect(getCachedLabelTextureLayout(firstInput, spy)).toBe(first)
    expect(spy).toHaveBeenCalledTimes(callsAfterFirst)
    expect(getCachedLabelTextureLayout(secondInput, spy).width).not.toBe(first.width)
    expect(labelLayoutCacheKey(firstInput)).not.toBe(labelLayoutCacheKey(secondInput))
    expect(labelLayoutCacheKey(firstInput)).not.toBe(labelLayoutCacheKey(regularInput))
  })

  it('keeps texture dimensions independent of observation FOV and panorama zoom', () => {
    const input = { title: '土司空(轸宿)', subtitle: '', compact: true }
    const atDefaultView = calculateLabelTextureLayout(input, measure)
    const afterCameraChanges = calculateLabelTextureLayout(input, measure)
    expect(afterCameraChanges).toEqual(atDefaultView)
  })

  it('shows only labels whose full measured sprite fits the safe viewport', () => {
    const bounds = { left: 8, right: 1272, top: 70, bottom: 582 }
    expect(labelFitsViewport(
      { x: 640, y: 320 },
      { width: 120, height: 24 },
      bounds,
    )).toBe(true)
    expect(labelFitsViewport(
      { x: 40, y: 320 },
      { width: 120, height: 24 },
      bounds,
    )).toBe(false)
  })
})
