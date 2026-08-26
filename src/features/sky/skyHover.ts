import type { ImportantAsterism, ImportantAsterismId } from '../../types/importantAsterism'
import type { Mansion } from '../../types/xingxiu'

export type SkyHoverTarget =
  | { type: 'mansion'; id: string }
  | { type: 'importantAsterism'; id: ImportantAsterismId }

export type SkyHoverCard = SkyHoverTarget & {
  eyebrow: 'CELESTIAL MANSION' | 'IMPORTANT ASTERISM'
  title: string
}

export interface MansionHitCandidate {
  id: string
  distance: number
}

export interface ImportantAsterismHitCandidate {
  id: ImportantAsterismId
  kind: 'label' | 'member' | 'line'
  distance: number
}

export function mansionHoverCard(mansion: Pick<Mansion, 'id' | 'name'>): SkyHoverCard {
  return {
    type: 'mansion',
    id: mansion.id,
    eyebrow: 'CELESTIAL MANSION',
    title: `${mansion.name}宿`,
  }
}

export function importantAsterismHoverCard(
  asterism: Pick<ImportantAsterism, 'id' | 'name'>,
): SkyHoverCard {
  return {
    type: 'importantAsterism',
    id: asterism.id,
    eyebrow: 'IMPORTANT ASTERISM',
    title: asterism.name,
  }
}

export function resolveSkyInteractionTarget({
  mansion,
  importantAsterism,
  nearestOrdinaryDistance = Number.POSITIVE_INFINITY,
  selectedImportantAsterismId,
  maxDistance,
}: {
  mansion?: MansionHitCandidate
  importantAsterism?: ImportantAsterismHitCandidate
  nearestOrdinaryDistance?: number
  selectedImportantAsterismId?: ImportantAsterismId
  maxDistance: number
}): SkyHoverTarget | undefined {
  const mansionHasPriority = Boolean(
    mansion
    && mansion.distance < maxDistance
    && (mansion.distance <= nearestOrdinaryDistance + 4 || nearestOrdinaryDistance >= 18),
  )
  const importantHasPriority = Boolean(
    importantAsterism
    && importantAsterism.distance < maxDistance
    && (
      importantAsterism.kind === 'label'
      || selectedImportantAsterismId === importantAsterism.id
      || !mansionHasPriority
      || (mansion && importantAsterism.distance + 5 < mansion.distance)
    ),
  )

  if (importantHasPriority && importantAsterism) {
    return { type: 'importantAsterism', id: importantAsterism.id }
  }
  if (mansionHasPriority && mansion) return { type: 'mansion', id: mansion.id }
  return undefined
}
