import { describe, expect, it } from 'vitest'
import traditionalSkyData from '../../data/traditional-chinese-sky.json'
import { MANSIONS } from '../../data/mansions'
import type { TraditionalChineseSkyData } from '../../types/xingxiu'
import {
  DEFAULT_PANORAMA_VIEWPORT,
  PANORAMA_ORIENTATION,
  PANORAMA_VIEWPORT,
  panoramaPanLimit,
  panoramaPanFromDrag,
  panoramaZoomFromPinch,
  panoramaZoomFromWheel,
  projectEquatorialToPanorama,
  resetPanoramaViewport,
  restoreObservationState,
} from './panoramaProjection'

const data = traditionalSkyData as TraditionalChineseSkyData

describe('fixed all-sky panorama projection', () => {
  it('uses the same 1,460 HIP and 339 figure RA/Dec source', () => {
    expect(data.stars).toHaveLength(1460)
    expect(data.figures).toHaveLength(339)
    expect(projectEquatorialToPanorama(data.stars[0]!)).toEqual(expect.objectContaining({ z: 0 }))
  })

  it('depends only on RA/Dec, not observer or clock state', () => {
    const coordinate = { ra: 142, dec: 0 }
    expect(projectEquatorialToPanorama(coordinate)).toEqual(projectEquatorialToPanorama(coordinate))
  })

  it('pins the cultural screen directions', () => {
    expect(PANORAMA_ORIENTATION).toMatchObject({
      top: '南 · 朱雀',
      bottom: '北 · 玄武',
      left: '东 · 青龙',
      right: '西 · 白虎',
    })
    expect(Object.isFrozen(PANORAMA_ORIENTATION)).toBe(true)
  })

  it('applies one global rotation that places the four mansion groups in their fixed quadrants', () => {
    const center = (symbolId: string) => {
      const points = MANSIONS
        .filter((mansion) => mansion.symbolId === symbolId)
        .map((mansion) => projectEquatorialToPanorama(mansion.anchor))
      return {
        x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
        y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
      }
    }
    expect(center('vermillion-bird').y).toBeGreaterThan(0)
    expect(center('black-tortoise').y).toBeLessThan(0)
    expect(center('azure-dragon').x).toBeLessThan(0)
    expect(center('white-tiger').x).toBeGreaterThan(0)
  })

  it('restores the exact pre-panorama observation camera', () => {
    const state = { azimuth: 243, altitude: -25, fov: 46 }
    expect(restoreObservationState(state)).toEqual(state)
  })

  it('zooms in and out within finite panorama limits without changing orientation', () => {
    expect(PANORAMA_VIEWPORT.maxZoom).toBe(7)
    const orientation = { ...PANORAMA_ORIENTATION }
    const zoomedIn = panoramaZoomFromWheel(resetPanoramaViewport(), -420)
    const zoomedOut = panoramaZoomFromWheel(zoomedIn, 420)
    expect(zoomedIn.zoom).toBeGreaterThan(DEFAULT_PANORAMA_VIEWPORT.zoom)
    expect(zoomedOut.zoom).toBeCloseTo(DEFAULT_PANORAMA_VIEWPORT.zoom, 8)
    expect(panoramaZoomFromWheel(zoomedIn, -100_000).zoom).toBe(PANORAMA_VIEWPORT.maxZoom)
    expect(panoramaZoomFromWheel(zoomedIn, 100_000).zoom).toBe(PANORAMA_VIEWPORT.minZoom)
    expect(PANORAMA_ORIENTATION).toEqual(orientation)
  })

  it('maps a two-pointer pinch to panorama zoom', () => {
    const expanded = panoramaZoomFromPinch(resetPanoramaViewport(), 100, 180)
    const contracted = panoramaZoomFromPinch(expanded, 180, 100)
    expect(expanded.zoom).toBeCloseTo(PANORAMA_VIEWPORT.defaultZoom * 1.8, 8)
    expect(contracted.zoom).toBeCloseTo(PANORAMA_VIEWPORT.defaultZoom, 8)
  })

  it('pans a zoomed panorama in x/y while retaining zoom and fixed orientation', () => {
    const orientation = { ...PANORAMA_ORIENTATION }
    const zoomed = panoramaZoomFromWheel(resetPanoramaViewport(), -520)
    const panned = panoramaPanFromDrag(zoomed, 120, -80, 1200, 800, 156, 104)
    expect(panned.zoom).toBe(zoomed.zoom)
    expect(panned.panX).toBeLessThan(0)
    expect(panned.panY).toBeLessThan(0)
    // A positive pointer delta moves the orthographic camera left, so the chart follows right.
    expect(panned.panX).toBeLessThan(zoomed.panX)
    expect(PANORAMA_ORIENTATION).toEqual(orientation)
  })

  it('constrains pan so the chart cannot be lost and resets to the full-sky fit', () => {
    const zoomed = panoramaZoomFromWheel(resetPanoramaViewport(), -2_000)
    const panned = panoramaPanFromDrag(zoomed, 1_000_000, 1_000_000, 390, 844, 104, 225)
    expect(Math.hypot(panned.panX, panned.panY)).toBeLessThan(PANORAMA_VIEWPORT.radius)
    expect(resetPanoramaViewport()).toEqual(DEFAULT_PANORAMA_VIEWPORT)
  })

  it('expands pan reach at the new maximum zoom without producing invalid projection values', () => {
    expect(panoramaPanLimit(PANORAMA_VIEWPORT.maxZoom))
      .toBeGreaterThan(panoramaPanLimit(3.25))
    const viewport = panoramaPanFromDrag(
      { zoom: PANORAMA_VIEWPORT.maxZoom, panX: 0, panY: 0 },
      1_000_000,
      -1_000_000,
      390,
      844,
      104,
      225,
    )
    expect(Number.isFinite(viewport.panX)).toBe(true)
    expect(Number.isFinite(viewport.panY)).toBe(true)
    data.stars.slice(0, 100).forEach((star) => {
      const point = projectEquatorialToPanorama(star)
      expect(Number.isFinite(point.x)).toBe(true)
      expect(Number.isFinite(point.y)).toBe(true)
    })
  })

  it('retains viewport values across unrelated overlay selection state', () => {
    const viewport = panoramaPanFromDrag(
      panoramaZoomFromWheel(resetPanoramaViewport(), -360),
      80,
      40,
      1280,
      720,
      184,
      104,
    )
    const overlaySession = { selectedMansion: 'jiao', detailOpen: true, viewport }
    const closedSession = { ...overlaySession, detailOpen: false }
    expect(closedSession.viewport).toEqual(viewport)
  })
})
