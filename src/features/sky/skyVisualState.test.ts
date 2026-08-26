import { describe, expect, it } from 'vitest'
import {
  OBSERVATION_TRADITIONAL_VISUAL,
  mansionVisualRole,
  observationMansionVisualState,
} from './skyVisualState'

describe('observation sky visual hierarchy', () => {
  it('makes the selected mansion stronger than the other mansions', () => {
    const selected = observationMansionVisualState('selected', false)
    const other = observationMansionVisualState('other', false)
    expect(selected.starOpacity).toBeGreaterThan(other.starOpacity)
    expect(selected.lineOpacity).toBeGreaterThan(other.lineOpacity)
    expect(selected.labelOpacity).toBeGreaterThan(other.labelOpacity)
  })

  it('keeps the other 27 mansions stronger than ordinary traditional figures', () => {
    const other = observationMansionVisualState('other', false)
    expect(other.starOpacity).toBeGreaterThan(OBSERVATION_TRADITIONAL_VISUAL.above.starOpacity)
    expect(other.lineOpacity).toBeGreaterThan(OBSERVATION_TRADITIONAL_VISUAL.above.lineOpacity)
    expect(other.labelOpacity).toBeGreaterThan(OBSERVATION_TRADITIONAL_VISUAL.above.labelOpacity)
  })

  it.each(['selected', 'related', 'other'] as const)(
    'makes above-horizon %s material parameters stronger than below-horizon parameters',
    (role) => {
      const above = observationMansionVisualState(role, false)
      const below = observationMansionVisualState(role, true)
      expect(above.starOpacity).toBeGreaterThan(below.starOpacity)
      expect(above.lineOpacity).toBeGreaterThan(below.lineOpacity)
      expect(above.labelOpacity).toBeGreaterThan(below.labelOpacity)
    },
  )

  it('keeps a selected underground mansion above other underground objects', () => {
    const selectedBelow = observationMansionVisualState('selected', true)
    const otherBelow = observationMansionVisualState('other', true)
    expect(selectedBelow.starOpacity).toBeGreaterThan(otherBelow.starOpacity)
    expect(selectedBelow.lineOpacity).toBeGreaterThan(otherBelow.lineOpacity)
    expect(selectedBelow.labelOpacity).toBeGreaterThan(otherBelow.labelOpacity)
    expect(selectedBelow.lineOpacity).toBeGreaterThan(OBSERVATION_TRADITIONAL_VISUAL.below.lineOpacity)
  })

  it('returns distinct centralized material values for every mansion role', () => {
    const selected = observationMansionVisualState(mansionVisualRole(true, true), false)
    const related = observationMansionVisualState(mansionVisualRole(false, true), false)
    const other = observationMansionVisualState(mansionVisualRole(false, false), false)
    expect(new Set([selected.starOpacity, related.starOpacity, other.starOpacity]).size).toBe(3)
    expect(new Set([selected.lineOpacity, related.lineOpacity, other.lineOpacity]).size).toBe(3)
    expect(new Set([selected.labelOpacity, related.labelOpacity, other.labelOpacity]).size).toBe(3)
  })
})
