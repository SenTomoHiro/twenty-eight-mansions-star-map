import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { OBSERVATION_CAMERA } from '../../config/observation'
import {
  SKY_DRAG_SENSITIVITY,
  SKY_FOV,
  azimuthDegreesFromYaw,
  fovFromPinch,
  fovFromWheel,
  observationCameraFromDrag,
} from './skyInteraction'

const maxPitch = THREE.MathUtils.degToRad(OBSERVATION_CAMERA.maxAltitude)

function projectFixedStarX(cameraYaw: number) {
  const camera = new THREE.PerspectiveCamera(58, 16 / 9, 0.1, 150)
  const direction = new THREE.Vector3(Math.sin(cameraYaw), 0, Math.cos(cameraYaw))
  camera.lookAt(direction)
  camera.updateMatrixWorld()
  const fixedStar = new THREE.Vector3(0, 0, -100)
  return fixedStar.project(camera).x
}

describe('3D sky camera interaction', () => {
  it('narrows FOV when a two-pointer pinch expands', () => {
    expect(fovFromPinch(58, 100, 160)).toBeCloseTo(36.25, 6)
  })

  it('widens FOV when a two-pointer pinch contracts', () => {
    expect(fovFromPinch(58, 160, 100)).toBeCloseTo(82, 6)
  })

  it('keeps wheel FOV inside the perspective camera limits', () => {
    expect(SKY_FOV).toEqual({ min: 18, default: 58, max: 82 })
    expect(fovFromWheel(58, -10_000)).toBe(SKY_FOV.min)
    expect(fovFromWheel(58, 10_000)).toBe(SKY_FOV.max)
  })

  it('moves the rendered sky right when observation deltaX is positive', () => {
    const startYaw = Math.PI
    const next = observationCameraFromDrag(startYaw, 0, 40, 0, -maxPitch, maxPitch)
    expect(next.yaw).toBeCloseTo(startYaw + 40 * SKY_DRAG_SENSITIVITY, 10)
    expect(projectFixedStarX(next.yaw)).toBeGreaterThan(projectFixedStarX(startYaw))
  })

  it('moves the rendered sky left when observation deltaX is negative', () => {
    const startYaw = Math.PI
    const next = observationCameraFromDrag(startYaw, 0, -40, 0, -maxPitch, maxPitch)
    expect(projectFixedStarX(next.yaw)).toBeLessThan(projectFixedStarX(startYaw))
  })

  it('preserves the existing vertical delta mapping', () => {
    const next = observationCameraFromDrag(Math.PI, 0.25, 0, 30, -maxPitch, maxPitch)
    expect(next.pitch).toBeCloseTo(0.25 + 30 * SKY_DRAG_SENSITIVITY, 10)
  })

  it('derives displayed azimuth directly from the actual camera yaw', () => {
    expect(azimuthDegreesFromYaw(Math.PI)).toBeCloseTo(180, 10)
    expect(azimuthDegreesFromYaw(Math.PI * 2 + 0.25)).toBeCloseTo(THREE.MathUtils.radToDeg(0.25), 10)
  })

  it('retains the confirmed reset camera', () => {
    expect(OBSERVATION_CAMERA).toMatchObject({ azimuth: 180, altitude: 35, fov: 58 })
  })
})
