import { clamp } from '../../utils/astronomy'

export const SKY_FOV = {
  min: 18,
  default: 58,
  max: 82,
} as const

export function fovFromPinch(startFov: number, startDistance: number, currentDistance: number) {
  if (startDistance <= 0 || currentDistance <= 0) return clamp(startFov, SKY_FOV.min, SKY_FOV.max)
  return clamp(startFov / (currentDistance / startDistance), SKY_FOV.min, SKY_FOV.max)
}

export function fovFromWheel(currentFov: number, deltaY: number) {
  return clamp(currentFov + deltaY * 0.028, SKY_FOV.min, SKY_FOV.max)
}

export const SKY_DRAG_SENSITIVITY = 0.0042

export function observationCameraFromDrag(
  yaw: number,
  pitch: number,
  deltaX: number,
  deltaY: number,
  minPitch: number,
  maxPitch: number,
) {
  return {
    yaw: yaw + deltaX * SKY_DRAG_SENSITIVITY,
    pitch: clamp(pitch + deltaY * SKY_DRAG_SENSITIVITY, minPitch, maxPitch),
  }
}

export function azimuthDegreesFromYaw(yaw: number) {
  const degrees = yaw * 180 / Math.PI
  return ((degrees % 360) + 360) % 360
}
