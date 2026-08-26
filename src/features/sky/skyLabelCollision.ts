export interface ScreenRect {
  left: number
  right: number
  top: number
  bottom: number
}

export interface ScreenLabel {
  id: string
  rect: ScreenRect
}

export type LabelVisibilityReason = 'visible' | 'collision' | 'hysteresis'

export interface LabelCollisionState {
  hiddenGroups: string[][]
  clearPassesById: Record<string, number>
}

export interface LabelCollisionConfig {
  hidePadding: number
  showPadding: number
  releaseConfirmations: number
}

export interface LabelVisibilityResult {
  visibleMansionIds: Set<string>
  visibleTraditionalIds: Set<string>
  hiddenGroups: string[][]
  hiddenReasons: Record<string, Exclude<LabelVisibilityReason, 'visible'>>
  conflictsById: Record<string, string[]>
  state: LabelCollisionState
}

export const EMPTY_LABEL_COLLISION_STATE: LabelCollisionState = Object.freeze({
  hiddenGroups: [],
  clearPassesById: {},
})

export const LABEL_COLLISION = Object.freeze({
  desktop: Object.freeze({ hidePadding: 3, showPadding: 10, releaseConfirmations: 2 }),
  mobile: Object.freeze({ hidePadding: 2, showPadding: 8, releaseConfirmations: 2 }),
  fadeDurationMs: 150,
})

export const LABEL_SCALE_LIMITS = Object.freeze({
  observation: Object.freeze({ traditional: Object.freeze({ min: 0.56, max: 1.05 }), mansion: Object.freeze({ min: 0.62, max: 1.05 }) }),
  panorama: Object.freeze({ traditional: Object.freeze({ min: 0.4, max: 1 }), mansion: Object.freeze({ min: 0.46, max: 1 }) }),
})

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function labelScaleForView(
  mode: 'observation' | 'panorama',
  viewValue: number,
  kind: 'mansion' | 'traditional',
) {
  const limits = LABEL_SCALE_LIMITS[mode][kind]
  const raw = mode === 'observation'
    ? Math.sqrt(Math.max(1, viewValue) / 58)
    : Math.sqrt(1.08 / Math.max(0.01, viewValue))
  return clamp(raw, limits.min, limits.max)
}

export function rectsConflict(a: ScreenRect, b: ScreenRect, padding: number) {
  return a.left < b.right + padding
    && a.right + padding > b.left
    && a.top < b.bottom + padding
    && a.bottom + padding > b.top
}

export function screenRectFromCenter(
  center: { x: number; y: number },
  halfSize: { width: number; height: number },
): ScreenRect {
  return {
    left: center.x - halfSize.width,
    right: center.x + halfSize.width,
    top: center.y - halfSize.height,
    bottom: center.y + halfSize.height,
  }
}

export function labelFitsViewportWithHysteresis(
  center: { x: number; y: number },
  halfSize: { width: number; height: number },
  bounds: { left: number; right: number; top: number; bottom: number },
  previouslyVisible: boolean,
  margin = 4,
) {
  const adjusted = previouslyVisible
    ? {
        left: bounds.left - margin,
        right: bounds.right + margin,
        top: bounds.top - margin,
        bottom: bounds.bottom + margin,
      }
    : {
        left: bounds.left + margin,
        right: bounds.right - margin,
        top: bounds.top + margin,
        bottom: bounds.bottom - margin,
      }
  return center.x - halfSize.width >= adjusted.left
    && center.x + halfSize.width <= adjusted.right
    && center.y - halfSize.height >= adjusted.top
    && center.y + halfSize.height <= adjusted.bottom
}

/** Removes transparent texture safety padding from the visual collision box. */
export function visualLabelHalfSize(
  fullHalfSize: { width: number; height: number },
  texture: { width: number; height: number; paddingX: number; paddingY: number },
) {
  const visibleWidthRatio = clamp((texture.width - texture.paddingX * 2) / texture.width, 0.2, 1)
  const visibleHeightRatio = clamp((texture.height - texture.paddingY * 2) / texture.height, 0.2, 1)
  return {
    width: fullHalfSize.width * visibleWidthRatio,
    height: fullHalfSize.height * visibleHeightRatio,
  }
}

function canonicalGroup(ids: Iterable<string>) {
  return [...ids].sort((a, b) => a.localeCompare(b))
}

export function collisionGroupKey(ids: Iterable<string>) {
  return canonicalGroup(ids).join('|')
}

function connectedGroups(ids: string[], edges: Array<readonly [string, string]>) {
  const parent = new Map(ids.map((id) => [id, id]))
  const find = (id: string): string => {
    const current = parent.get(id) ?? id
    if (current === id) return id
    const root = find(current)
    parent.set(id, root)
    return root
  }
  const union = (left: string, right: string) => {
    const leftRoot = find(left)
    const rightRoot = find(right)
    if (leftRoot === rightRoot) return
    const first = leftRoot.localeCompare(rightRoot) <= 0 ? leftRoot : rightRoot
    const second = first === leftRoot ? rightRoot : leftRoot
    parent.set(second, first)
  }
  edges.forEach(([left, right]) => union(left, right))
  const groups = new Map<string, string[]>()
  ids.forEach((id) => {
    const root = find(id)
    const members = groups.get(root) ?? []
    members.push(id)
    groups.set(root, members)
  })
  return [...groups.values()]
    .map(canonicalGroup)
    .sort((a, b) => collisionGroupKey(a).localeCompare(collisionGroupKey(b)))
}

/**
 * Resolves current geometry deterministically. Previous hidden groups are never
 * unioned back into the current graph: hysteresis is per label and can delay a
 * release briefly, but cannot prevent a component from splitting or converging.
 */
export function resolveLabelVisibility(
  mansionLabels: ScreenLabel[],
  traditionalLabels: ScreenLabel[],
  previousState: LabelCollisionState,
  config: LabelCollisionConfig,
): LabelVisibilityResult {
  const mansions = [...mansionLabels].sort((a, b) => a.id.localeCompare(b.id))
  const labels = [...traditionalLabels].sort((a, b) => a.id.localeCompare(b.id))
  const previousHiddenIds = new Set(previousState.hiddenGroups.flat())
  const hideEdges: Array<readonly [string, string]> = []
  const showEdges: Array<readonly [string, string]> = []
  const hideConflicts = new Map<string, Set<string>>()
  const showConflicts = new Map<string, Set<string>>()

  const addConflict = (map: Map<string, Set<string>>, id: string, conflictId: string) => {
    const conflicts = map.get(id) ?? new Set<string>()
    conflicts.add(conflictId)
    map.set(id, conflicts)
  }

  for (let leftIndex = 0; leftIndex < labels.length; leftIndex += 1) {
    const left = labels[leftIndex]!
    for (let rightIndex = leftIndex + 1; rightIndex < labels.length; rightIndex += 1) {
      const right = labels[rightIndex]!
      if (rectsConflict(left.rect, right.rect, config.hidePadding)) {
        hideEdges.push([left.id, right.id])
        addConflict(hideConflicts, left.id, right.id)
        addConflict(hideConflicts, right.id, left.id)
      }
      if (rectsConflict(left.rect, right.rect, config.showPadding)) {
        showEdges.push([left.id, right.id])
        addConflict(showConflicts, left.id, right.id)
        addConflict(showConflicts, right.id, left.id)
      }
    }
  }

  labels.forEach((label) => {
    mansions.forEach((mansion) => {
      if (rectsConflict(label.rect, mansion.rect, config.hidePadding)) {
        addConflict(hideConflicts, label.id, `mansion:${mansion.id}`)
      }
      if (rectsConflict(label.rect, mansion.rect, config.showPadding)) {
        addConflict(showConflicts, label.id, `mansion:${mansion.id}`)
      }
    })
  })

  const hardCollisionIds = new Set<string>()
  connectedGroups(labels.map(({ id }) => id), hideEdges).forEach((group) => {
    if (group.length > 1) group.forEach((id) => hardCollisionIds.add(id))
  })
  hideConflicts.forEach((conflicts, id) => {
    if ([...conflicts].some((conflictId) => conflictId.startsWith('mansion:'))) {
      hardCollisionIds.add(id)
    }
  })

  const hiddenIds = new Set<string>()
  const hiddenReasons: LabelVisibilityResult['hiddenReasons'] = {}
  const nextClearPasses: Record<string, number> = {}
  labels.forEach(({ id }) => {
    if (hardCollisionIds.has(id)) {
      hiddenIds.add(id)
      hiddenReasons[id] = 'collision'
      return
    }
    if (!previousHiddenIds.has(id)) return
    const stillInsideShowThreshold = (showConflicts.get(id)?.size ?? 0) > 0
    const clearPasses = stillInsideShowThreshold
      ? 0
      : (previousState.clearPassesById[id] ?? 0) + 1
    if (stillInsideShowThreshold || clearPasses < config.releaseConfirmations) {
      hiddenIds.add(id)
      hiddenReasons[id] = 'hysteresis'
      nextClearPasses[id] = clearPasses
    }
  })

  const hiddenEdges = [
    ...hideEdges,
    ...showEdges.filter(([left, right]) => hiddenIds.has(left) && hiddenIds.has(right)),
  ].filter(([left, right]) => hiddenIds.has(left) && hiddenIds.has(right))
  const hiddenGroups = connectedGroups([...hiddenIds].sort(), hiddenEdges)
  const conflictsById = Object.fromEntries(labels.map(({ id }) => [
    id,
    canonicalGroup(new Set([
      ...(hideConflicts.get(id) ?? []),
      ...(showConflicts.get(id) ?? []),
    ])),
  ]))

  return {
    visibleMansionIds: new Set(mansions.map(({ id }) => id)),
    visibleTraditionalIds: new Set(
      labels.map(({ id }) => id).filter((id) => !hiddenIds.has(id)),
    ),
    hiddenGroups,
    hiddenReasons,
    conflictsById,
    state: { hiddenGroups, clearPassesById: nextClearPasses },
  }
}
