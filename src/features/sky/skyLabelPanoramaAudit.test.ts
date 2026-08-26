import { describe, expect, it } from 'vitest'
import traditionalSkyData from '../../data/traditional-chinese-sky.json'
import type { TraditionalChineseSkyData, TraditionalSkyReference } from '../../types/xingxiu'
import { projectEquatorialToPanorama } from './panoramaProjection'
import {
  EMPTY_LABEL_COLLISION_STATE,
  LABEL_COLLISION,
  labelScaleForView,
  resolveLabelVisibility,
  screenRectFromCenter,
  visualLabelHalfSize,
  type LabelCollisionState,
  type ScreenLabel,
} from './skyLabelCollision'
import { calculateLabelTextureLayout } from './skyLabelTexture'

const data = traditionalSkyData as TraditionalChineseSkyData
const viewport = { width: 1440, height: 900 }

function measuredText(text: string) {
  const width = [...text].reduce((sum, character) => (
    sum + (/\p{Script=Han}/u.test(character) ? 52 : 27)
  ), 0)
  return {
    width,
    actualBoundingBoxLeft: 1,
    actualBoundingBoxRight: Math.max(1, width - 1),
    actualBoundingBoxAscent: 43,
    actualBoundingBoxDescent: 11,
  }
}

function panoramaCenters() {
  const positions = new Map<TraditionalSkyReference, { x: number; y: number }>()
  data.stars.forEach((star) => positions.set(star.hip, projectEquatorialToPanorama(star)))
  data.deepSkyObjects.forEach((object) => positions.set(object.id, projectEquatorialToPanorama(object)))
  return new Map(data.figures
    .filter((figure) => !figure.isLunarMansion)
    .map((figure) => {
      const members = figure.memberRefs
        .map((reference) => positions.get(reference))
        .filter((point): point is { x: number; y: number } => Boolean(point))
      return [figure.id, {
        x: members.reduce((sum, point) => sum + point.x, 0) / members.length,
        y: members.reduce((sum, point) => sum + point.y, 0) / members.length,
      }] as const
    }))
}

const centers = panoramaCenters()

function screenLabelsAtZoom(zoom: number) {
  const pixelsPerWorldUnit = viewport.height / 104 * zoom
  const scaleFactor = labelScaleForView('panorama', zoom, 'traditional')
  return data.figures
    .filter((figure) => !figure.isLunarMansion)
    .map((figure): ScreenLabel | undefined => {
      const center = centers.get(figure.id)
      if (!center) return undefined
      const layout = calculateLabelTextureLayout(
        { title: figure.name, subtitle: '', compact: true },
        (text) => measuredText(text),
      )
      const screenCenter = {
        x: viewport.width / 2 + center.x * pixelsPerWorldUnit,
        y: viewport.height / 2 - center.y * pixelsPerWorldUnit,
      }
      const spriteHeight = 3.6 * 0.45 * scaleFactor * pixelsPerWorldUnit
      const fullHalfSize = {
        width: spriteHeight * layout.aspectRatio / 2,
        height: spriteHeight / 2,
      }
      if (
        screenCenter.x - fullHalfSize.width < 8
        || screenCenter.x + fullHalfSize.width > viewport.width - 8
        || screenCenter.y - fullHalfSize.height < 70
        || screenCenter.y + fullHalfSize.height > viewport.height - 138
      ) return undefined
      return {
        id: figure.id,
        rect: screenRectFromCenter(
          screenCenter,
          visualLabelHalfSize(fullHalfSize, layout),
        ),
      }
    })
    .filter((label): label is ScreenLabel => Boolean(label))
}

describe('real Purple Forbidden Enclosure label audit', () => {
  it('converges deterministically and reveals more of the fixed high-zoom cohort as zoom increases', () => {
    const purpleIds = new Set(data.figures
      .filter((figure) => figure.group.id === 'purple-forbidden-enclosure')
      .map((figure) => figure.id))
    const highZoomCohort = new Set(
      screenLabelsAtZoom(7).filter(({ id }) => purpleIds.has(id)).map(({ id }) => id),
    )
    expect(highZoomCohort.size).toBeGreaterThan(20)

    let state: LabelCollisionState = {
      ...EMPTY_LABEL_COLLISION_STATE,
      hiddenGroups: [],
      clearPassesById: {},
    }
    const counts: number[] = []
    const audits: Array<{ zoom: number; visible: string[]; hiddenGroups: number; maxGroupSize: number }> = []
    for (const zoom of [1.08, 2, 4, 7]) {
      const labels = screenLabelsAtZoom(zoom)
      let result = resolveLabelVisibility([], labels, state, LABEL_COLLISION.desktop)
      for (let pass = 0; pass < 3; pass += 1) {
        result = resolveLabelVisibility([], labels, result.state, LABEL_COLLISION.desktop)
      }
      state = result.state
      const visible = [...result.visibleTraditionalIds]
        .filter((id) => highZoomCohort.has(id))
        .sort()
      counts.push(visible.length)
      audits.push({
        zoom,
        visible,
        hiddenGroups: result.hiddenGroups.length,
        maxGroupSize: Math.max(0, ...result.hiddenGroups.map((group) => group.length)),
      })
      const repeated = Array.from({ length: 20 }, () => (
        resolveLabelVisibility([], labels, result.state, LABEL_COLLISION.desktop)
      ))
      expect(new Set(repeated.map((item) => JSON.stringify([...item.visibleTraditionalIds]))).size).toBe(1)
    }

    expect(counts[1]).toBeGreaterThanOrEqual(counts[0]!)
    expect(counts[2]).toBeGreaterThanOrEqual(counts[1]!)
    expect(counts[3]).toBeGreaterThanOrEqual(counts[2]!)
    expect(counts[3]).toBeGreaterThan(15)
    expect(audits.at(-1)?.maxGroupSize).toBeLessThan(audits[0]!.maxGroupSize)
  })
})
