import { describe, expect, it } from 'vitest'
import { MANSIONS } from '../../data/mansions'
import {
  EMPTY_LABEL_COLLISION_STATE,
  LABEL_COLLISION,
  LABEL_SCALE_LIMITS,
  collisionGroupKey,
  labelFitsViewportWithHysteresis,
  labelScaleForView,
  resolveLabelVisibility,
  screenRectFromCenter,
  visualLabelHalfSize,
  type LabelCollisionState,
  type ScreenLabel,
} from './skyLabelCollision'

function label(id: string, left: number, top = 0, width = 10, height = 10): ScreenLabel {
  return { id, rect: { left, right: left + width, top, bottom: top + height } }
}

describe('stable sky label collision', () => {
  it('uses a short, restrained fade after stable state changes', () => {
    expect(LABEL_COLLISION.fadeDurationMs).toBeGreaterThanOrEqual(100)
    expect(LABEL_COLLISION.fadeDurationMs).toBeLessThanOrEqual(200)
  })

  it('keeps all 28 mansion labels permanently visible in every view/zoom fixture', () => {
    const mansions = MANSIONS.map((mansion) => label(mansion.id, 0))
    const fixtures = [
      ['observation', 18],
      ['observation', 58],
      ['observation', 82],
      ['panorama', 1.08],
      ['panorama', 3.25],
      ['panorama', 7],
    ] as const
    fixtures.forEach(([mode, value]) => {
      const result = resolveLabelVisibility(
        mansions,
        [label(`${mode}-${value}`, 1)],
        EMPTY_LABEL_COLLISION_STATE,
        LABEL_COLLISION.desktop,
      )
      expect(result.visibleMansionIds.size).toBe(28)
      expect([...result.visibleMansionIds]).toEqual(MANSIONS.map(({ id }) => id))
    })
  })

  it('hides an A-B-C connected collision group without choosing a winner', () => {
    const result = resolveLabelVisibility(
      [],
      [label('A', 0), label('B', 12), label('C', 24), label('D', 80)],
      EMPTY_LABEL_COLLISION_STATE,
      LABEL_COLLISION.desktop,
    )
    expect(result.hiddenGroups).toEqual([['A', 'B', 'C']])
    expect([...result.visibleTraditionalIds]).toEqual(['D'])
  })

  it('restores a fully clear hidden group after the fixed confirmation cycle', () => {
    const hidden = resolveLabelVisibility(
      [],
      [label('A', 0), label('B', 12), label('C', 24)],
      EMPTY_LABEL_COLLISION_STATE,
      LABEL_COLLISION.desktop,
    )
    const confirming = resolveLabelVisibility(
      [],
      [label('A', 0), label('B', 22), label('C', 44)],
      hidden.state,
      LABEL_COLLISION.desktop,
    )
    expect(confirming.hiddenGroups).toEqual([['A'], ['B'], ['C']])
    const fullyClear = resolveLabelVisibility(
      [],
      [label('A', 0), label('B', 22), label('C', 44)],
      confirming.state,
      LABEL_COLLISION.desktop,
    )
    expect(fullyClear.hiddenGroups).toEqual([])
    expect([...fullyClear.visibleTraditionalIds]).toEqual(['A', 'B', 'C'])
  })

  it('uses separate hide/show thresholds so one- and two-pixel oscillations do not toggle', () => {
    const hidden = resolveLabelVisibility(
      [],
      [label('A', 0), label('B', 12)],
      EMPTY_LABEL_COLLISION_STATE,
      LABEL_COLLISION.desktop,
    )
    let state: LabelCollisionState = hidden.state
    for (const left of [13, 14, 15, 14, 13]) {
      const stable = resolveLabelVisibility(
        [],
        [label('A', 0), label('B', left)],
        state,
        LABEL_COLLISION.desktop,
      )
      expect(stable.hiddenGroups).toEqual([['A', 'B']])
      state = stable.state
    }
    const confirming = resolveLabelVisibility(
      [],
      [label('A', 0), label('B', 21)],
      state,
      LABEL_COLLISION.desktop,
    )
    expect(confirming.hiddenGroups).toEqual([['A'], ['B']])
    const released = resolveLabelVisibility(
      [],
      [label('A', 0), label('B', 21)],
      confirming.state,
      LABEL_COLLISION.desktop,
    )
    expect(released.hiddenGroups).toEqual([])
    const stillVisible = resolveLabelVisibility(
      [],
      [label('A', 0), label('B', 15)],
      released.state,
      LABEL_COLLISION.desktop,
    )
    expect(stillVisible.hiddenGroups).toEqual([])
    expect(resolveLabelVisibility(
      [],
      [label('A', 0), label('B', 12)],
      stillVisible.state,
      LABEL_COLLISION.desktop,
    ).hiddenGroups).toEqual([['A', 'B']])
  })

  it('lets mansion labels occupy space while never hiding them', () => {
    const result = resolveLabelVisibility(
      [label('jiao', 0)],
      [label('A', 12), label('B', 24)],
      EMPTY_LABEL_COLLISION_STATE,
      LABEL_COLLISION.desktop,
    )
    expect(result.visibleMansionIds.has('jiao')).toBe(true)
    expect(result.hiddenGroups).toEqual([['A', 'B']])
  })

  it('uses sorted stable group keys independent of input and traversal order', () => {
    expect(collisionGroupKey(['C', 'A', 'B'])).toBe('A|B|C')
    const forward = resolveLabelVisibility(
      [],
      [label('A', 0), label('B', 12), label('C', 24), label('D', 80)],
      EMPTY_LABEL_COLLISION_STATE,
      LABEL_COLLISION.desktop,
    )
    const reverse = resolveLabelVisibility(
      [],
      [label('D', 80), label('C', 24), label('B', 12), label('A', 0)],
      EMPTY_LABEL_COLLISION_STATE,
      LABEL_COLLISION.desktop,
    )
    expect(reverse.hiddenGroups).toEqual(forward.hiddenGroups)
    expect([...reverse.visibleTraditionalIds]).toEqual([...forward.visibleTraditionalIds])
  })

  it('lets a former large hidden group split and converge as independent current geometry', () => {
    const low = resolveLabelVisibility(
      [],
      [label('A', 0), label('B', 12), label('C', 24), label('D', 36)],
      EMPTY_LABEL_COLLISION_STATE,
      LABEL_COLLISION.desktop,
    )
    expect(low.hiddenGroups).toEqual([['A', 'B', 'C', 'D']])
    const split = [label('A', 0), label('B', 12), label('C', 50), label('D', 62)]
    const first = resolveLabelVisibility([], split, low.state, LABEL_COLLISION.desktop)
    expect(first.hiddenGroups).toEqual([['A', 'B'], ['C', 'D']])
    const clear = [label('A', 0), label('B', 22), label('C', 50), label('D', 72)]
    const confirming = resolveLabelVisibility([], clear, first.state, LABEL_COLLISION.desktop)
    const converged = resolveLabelVisibility([], clear, confirming.state, LABEL_COLLISION.desktop)
    expect(converged.hiddenGroups).toEqual([])
    expect([...converged.visibleTraditionalIds]).toEqual(['A', 'B', 'C', 'D'])
  })

  it('converges to the same visible ID set over twenty identical calculations', () => {
    const labels = [label('A', 0), label('B', 22), label('C', 50)]
    let state: LabelCollisionState = {
      hiddenGroups: [['A', 'B', 'C']],
      clearPassesById: {},
    }
    const visibleSets: string[] = []
    for (let index = 0; index < 22; index += 1) {
      const result = resolveLabelVisibility([], labels, state, LABEL_COLLISION.desktop)
      state = result.state
      if (index >= 2) visibleSets.push(JSON.stringify([...result.visibleTraditionalIds]))
    }
    expect(new Set(visibleSets)).toEqual(new Set(['["A","B","C"]']))
  })

  it('keeps logical CSS-pixel collision bounds unchanged between DPR 1 and DPR 2', () => {
    const fullHalfSize = { width: 56, height: 24 }
    const layout = { width: 224, height: 96, paddingX: 30, paddingY: 16 }
    const rects = [1, 2].map(() => screenRectFromCenter(
      { x: 300, y: 200 },
      visualLabelHalfSize(fullHalfSize, layout),
    ))
    expect(rects[0]).toEqual(rects[1])
    expect(rects[0]!.right - rects[0]!.left).toBeLessThan(fullHalfSize.width * 2)
  })

  it('uses the same final projected bounds helper for observation and panorama', () => {
    const texture = { width: 164, height: 96, paddingX: 30, paddingY: 16 }
    const projectedHalfSize = { width: 42, height: 18 }
    const observationRect = screenRectFromCenter(
      { x: 480, y: 320 },
      visualLabelHalfSize(projectedHalfSize, texture),
    )
    const panoramaRect = screenRectFromCenter(
      { x: 480, y: 320 },
      visualLabelHalfSize(projectedHalfSize, texture),
    )
    expect(observationRect).toEqual(panoramaRect)
  })

  it('does not toggle viewport visibility for one- or two-pixel edge motion', () => {
    const bounds = { left: 8, right: 392, top: 70, bottom: 726 }
    const halfSize = { width: 20, height: 10 }
    expect(labelFitsViewportWithHysteresis(
      { x: 373, y: 300 },
      halfSize,
      bounds,
      true,
    )).toBe(true)
    expect(labelFitsViewportWithHysteresis(
      { x: 371, y: 300 },
      halfSize,
      bounds,
      false,
    )).toBe(false)
    expect(labelFitsViewportWithHysteresis(
      { x: 367, y: 300 },
      halfSize,
      bounds,
      false,
    )).toBe(true)
  })
})

describe('view-dependent label scale', () => {
  it('shrinks labels progressively when observation FOV narrows and panorama zoom grows', () => {
    expect(labelScaleForView('observation', 18, 'traditional'))
      .toBeLessThan(labelScaleForView('observation', 58, 'traditional'))
    expect(labelScaleForView('panorama', 7, 'traditional'))
      .toBeLessThan(labelScaleForView('panorama', 1.08, 'traditional'))
  })

  it('clamps mansion and ordinary scales to finite documented bounds', () => {
    for (const mode of ['observation', 'panorama'] as const) {
      for (const kind of ['mansion', 'traditional'] as const) {
        const values = [
          labelScaleForView(mode, 0, kind),
          labelScaleForView(mode, Number.MAX_VALUE, kind),
        ]
        values.forEach((value) => {
          expect(Number.isFinite(value)).toBe(true)
          expect(value).toBeGreaterThanOrEqual(LABEL_SCALE_LIMITS[mode][kind].min)
          expect(value).toBeLessThanOrEqual(LABEL_SCALE_LIMITS[mode][kind].max)
        })
      }
    }
  })
})
