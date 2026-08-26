export type MansionVisualRole = 'selected' | 'related' | 'other'

export interface SkyLayerVisualState {
  starOpacity: number
  lineOpacity: number
  labelOpacity: number
}

const OBSERVATION_MANSION_ABOVE: Record<MansionVisualRole, SkyLayerVisualState> = {
  selected: { starOpacity: 1, lineOpacity: 0.98, labelOpacity: 1 },
  related: { starOpacity: 0.82, lineOpacity: 0.48, labelOpacity: 0.82 },
  other: { starOpacity: 0.64, lineOpacity: 0.3, labelOpacity: 0.68 },
}

const OBSERVATION_MANSION_BELOW: Record<MansionVisualRole, SkyLayerVisualState> = {
  selected: { starOpacity: 0.9, lineOpacity: 0.84, labelOpacity: 0.9 },
  related: { starOpacity: 0.68, lineOpacity: 0.38, labelOpacity: 0.68 },
  other: { starOpacity: 0.54, lineOpacity: 0.23, labelOpacity: 0.56 },
}

export const OBSERVATION_TRADITIONAL_VISUAL = Object.freeze({
  above: Object.freeze({ starOpacity: 0.62, lineOpacity: 0.23, labelOpacity: 0.58 }),
  below: Object.freeze({ starOpacity: 0.52, lineOpacity: 0.18, labelOpacity: 0.48 }),
})

export const BACKGROUND_STAR_VISUAL = Object.freeze({
  aboveAlphaFloor: 0.48,
  belowAlphaFloor: 0.44,
  belowAlphaCeiling: 0.68,
})

export const PANORAMA_VISUAL = Object.freeze({
  backgroundStarOpacity: 0.72,
  traditionalStarOpacity: 0.52,
  traditionalLineOpacity: 0.2,
  traditionalLabelOpacity: 0.48,
  mansionStarOpacity: Object.freeze({ selected: 1, other: 0.78 }),
  mansionLineOpacity: Object.freeze({ selected: 0.98, other: 0.48 }),
  mansionLabelOpacity: Object.freeze({ selected: 1, other: 0.82 }),
})

export function observationMansionVisualState(
  role: MansionVisualRole,
  belowHorizon: boolean,
): SkyLayerVisualState {
  return { ...(belowHorizon ? OBSERVATION_MANSION_BELOW : OBSERVATION_MANSION_ABOVE)[role] }
}

export function mansionVisualRole(selected: boolean, related: boolean): MansionVisualRole {
  if (selected) return 'selected'
  return related ? 'related' : 'other'
}
