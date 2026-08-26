import { describe, expect, it } from 'vitest'
import { XINGXIU_CULTURE_PROFILES } from './xingxiuCulture'

describe('unified xingxiu culture archive', () => {
  it('covers all 28 mansions with the frozen five-field schema', () => {
    expect(XINGXIU_CULTURE_PROFILES).toHaveLength(28)
    const expectedTitles = ['名与星象', '人间秩序', '占候之义', '分野传统', '道教星君']
    for (const profile of XINGXIU_CULTURE_PROFILES) {
      const fields = [
        profile.nameAndImage,
        profile.humanOrder,
        profile.omenTradition,
        profile.regionalField,
        profile.daoistTradition,
      ]
      expect(fields.map((field) => field.title)).toEqual(expectedTitles)
      expect(fields.every((field) => field.text.length > 20)).toBe(true)
      expect(profile.ancientEvidence).toHaveLength(2)
      expect(profile.ancientEvidence.every((citation) => citation.quote.length > 10)).toBe(true)
    }
  })

  it('keeps one unique profile per mansion', () => {
    expect(new Set(XINGXIU_CULTURE_PROFILES.map((profile) => profile.mansionId)).size).toBe(28)
  })
})

