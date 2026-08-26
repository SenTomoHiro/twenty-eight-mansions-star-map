import type { EquatorialCoordinate } from '../../types/xingxiu'

export const SKY_VIEW = {
  observation: 'observation',
  panorama: 'panorama',
} as const

export type SkyViewMode = (typeof SKY_VIEW)[keyof typeof SKY_VIEW]

export const PANORAMA_ORIENTATION = Object.freeze({
  top: '南 · 朱雀',
  bottom: '北 · 玄武',
  left: '东 · 青龙',
  right: '西 · 白虎',
  raRotationDegrees: -52,
})

export const VIEW_TRANSITION_DURATION = 1_000

export interface PanoramaViewportState {
  zoom: number
  panX: number
  panY: number
}

export const PANORAMA_VIEWPORT = Object.freeze({
  minZoom: 1,
  defaultZoom: 1.08,
  maxZoom: 7,
  radius: 42,
  wheelSensitivity: 0.0015,
})

export const DEFAULT_PANORAMA_VIEWPORT: Readonly<PanoramaViewportState> = Object.freeze({
  zoom: PANORAMA_VIEWPORT.defaultZoom,
  panX: 0,
  panY: 0,
})

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function panoramaPanLimit(zoom: number) {
  const safeZoom = clamp(zoom, PANORAMA_VIEWPORT.minZoom, PANORAMA_VIEWPORT.maxZoom)
  return PANORAMA_VIEWPORT.radius * Math.max(0, 1 - PANORAMA_VIEWPORT.defaultZoom / safeZoom)
}

export function constrainPanoramaViewport(state: PanoramaViewportState): PanoramaViewportState {
  const zoom = clamp(state.zoom, PANORAMA_VIEWPORT.minZoom, PANORAMA_VIEWPORT.maxZoom)
  const limit = panoramaPanLimit(zoom)
  const distance = Math.hypot(state.panX, state.panY)
  const factor = distance > limit && distance > 0 ? limit / distance : 1
  return { zoom, panX: state.panX * factor, panY: state.panY * factor }
}

export function panoramaZoomFromWheel(state: PanoramaViewportState, deltaY: number) {
  return constrainPanoramaViewport({
    ...state,
    zoom: state.zoom * Math.exp(-deltaY * PANORAMA_VIEWPORT.wheelSensitivity),
  })
}

export function panoramaZoomFromPinch(
  state: PanoramaViewportState,
  startDistance: number,
  currentDistance: number,
) {
  if (startDistance <= 0 || currentDistance <= 0) return constrainPanoramaViewport(state)
  return constrainPanoramaViewport({
    ...state,
    zoom: state.zoom * currentDistance / startDistance,
  })
}

export function panoramaPanFromDrag(
  state: PanoramaViewportState,
  deltaX: number,
  deltaY: number,
  viewportWidth: number,
  viewportHeight: number,
  worldWidth: number,
  worldHeight: number,
) {
  const width = Math.max(1, viewportWidth)
  const height = Math.max(1, viewportHeight)
  return constrainPanoramaViewport({
    ...state,
    panX: state.panX - deltaX * worldWidth / width / state.zoom,
    panY: state.panY + deltaY * worldHeight / height / state.zoom,
  })
}

export function panoramaPanByWorld(state: PanoramaViewportState, deltaX: number, deltaY: number) {
  return constrainPanoramaViewport({
    ...state,
    panX: state.panX + deltaX,
    panY: state.panY + deltaY,
  })
}

export function resetPanoramaViewport(): PanoramaViewportState {
  return { ...DEFAULT_PANORAMA_VIEWPORT }
}

/** North-pole-centred azimuthal equidistant projection of the same RA/Dec data. */
export function projectEquatorialToPanorama(
  coordinate: EquatorialCoordinate,
  radius = 42,
) {
  const radialDistance = ((90 - coordinate.dec) / 180) * radius
  const angle = (coordinate.ra + PANORAMA_ORIENTATION.raRotationDegrees) * Math.PI / 180
  return {
    x: Math.cos(angle) * radialDistance,
    y: Math.sin(angle) * radialDistance,
    z: 0,
    radialDistance,
  }
}

export interface ObservationCameraState {
  azimuth: number
  altitude: number
  fov: number
}

export function restoreObservationState(state: ObservationCameraState) {
  return { ...state }
}
