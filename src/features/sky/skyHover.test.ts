import { describe, expect, it } from 'vitest'
import { IMPORTANT_ASTERISMS } from '../../data/importantAsterisms'
import { MANSIONS } from '../../data/mansions'
import {
  importantAsterismHoverCard,
  mansionHoverCard,
  resolveSkyInteractionTarget,
} from './skyHover'

describe('shared sky hover card', () => {
  it('builds all 28 mansion titles from the unified mansion data', () => {
    const cards = MANSIONS.map(mansionHoverCard)

    expect(cards).toHaveLength(28)
    expect(new Set(cards.map(({ id }) => id)).size).toBe(28)
    expect(cards.map(({ title }) => title).join('')).toBe(
      '角宿亢宿氐宿房宿心宿尾宿箕宿斗宿牛宿女宿虚宿危宿室宿壁宿奎宿娄宿胃宿昴宿毕宿觜宿参宿井宿鬼宿柳宿星宿张宿翼宿轸宿',
    )
    expect(cards.every(({ eyebrow }) => eyebrow === 'CELESTIAL MANSION')).toBe(true)
  })

  it('preserves the important-asterism card wording', () => {
    const cards = IMPORTANT_ASTERISMS.map(importantAsterismHoverCard)
    expect(cards.map(({ title }) => title)).toEqual(['北斗九星', '南斗六星', '三台'])
    expect(cards.every(({ eyebrow }) => eyebrow === 'IMPORTANT ASTERISM')).toBe(true)
  })

  it('keeps Dou and Nandou in the intended interaction context', () => {
    const mansion = { id: 'xingxiu-08-dou', distance: 0 }
    const nandou = { id: 'nandou-six' as const, kind: 'member' as const, distance: 0 }

    expect(resolveSkyInteractionTarget({ mansion, importantAsterism: nandou, maxDistance: 28 })).toEqual({
      type: 'mansion',
      id: 'xingxiu-08-dou',
    })
    expect(resolveSkyInteractionTarget({
      mansion,
      importantAsterism: nandou,
      selectedImportantAsterismId: 'nandou-six',
      maxDistance: 28,
    })).toEqual({ type: 'importantAsterism', id: 'nandou-six' })
    expect(resolveSkyInteractionTarget({
      mansion,
      importantAsterism: { ...nandou, kind: 'label' },
      maxDistance: 28,
    })).toEqual({ type: 'importantAsterism', id: 'nandou-six' })
  })
})
