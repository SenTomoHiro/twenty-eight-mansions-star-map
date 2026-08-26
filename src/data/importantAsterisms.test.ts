import { describe, expect, it } from 'vitest'
import mansionStarMappingsData from './mansion-star-mappings.json'
import traditionalSkyData from './traditional-chinese-sky.json'
import { IMPORTANT_ASTERISMS, resolveImportantMembers } from './importantAsterisms'
import type { MansionStarMapping, TraditionalChineseSkyData } from '../types/xingxiu'

const mappings = mansionStarMappingsData.mappings as MansionStarMapping[]
const traditionalSky = traditionalSkyData as TraditionalChineseSkyData

describe('important asterism data', () => {
  it('contains exactly the three approved topics', () => {
    expect(IMPORTANT_ASTERISMS.map((item) => item.name)).toEqual(['北斗九星', '南斗六星', '三台'])
  })

  it('maps the seven Beidou stars and Alcor without inventing a Bi star', () => {
    const beidou = IMPORTANT_ASTERISMS[0]!
    expect(beidou.members.slice(0, 8).map((member) => member.hip)).toEqual([
      54061, 53910, 58001, 59774, 62956, 65378, 67301, 65477,
    ])
    expect(beidou.members[8]).toMatchObject({ name: '弼星', mapping: 'traditional-position-only' })
    expect(beidou.members[8]?.hip).toBeUndefined()
    expect(resolveImportantMembers(beidou).filter((member) => member.star)).toHaveLength(8)
  })

  it('reuses the exact Dou mansion star and line objects for Nandou', () => {
    const nandou = IMPORTANT_ASTERISMS[1]!
    const dou = mappings.find((mapping) => mapping.mansionId === 'xingxiu-08-dou')!
    expect(nandou.sharedMansionId).toBe(dou.mansionId)
    expect(nandou.lines).toBe(dou.lines)
    expect(resolveImportantMembers(nandou).map((member) => member.star)).toEqual(dou.stars)
  })

  it('models Santai as three two-star groups and six valid modern positions', () => {
    const santai = IMPORTANT_ASTERISMS[2]!
    expect(santai.members).toHaveLength(6)
    expect(santai.childGroups.map((group) => group.memberIds.length)).toEqual([2, 2, 2])
    expect(santai.lines.map((line) => line.length)).toEqual([2, 2, 2])
    const lowerSecond = traditionalSky.stars.find((star) => star.hip === 55203)
    expect(lowerSecond).toMatchObject({ hip: 55203, ra: 169.5455495, dec: 31.5292889 })
    expect(lowerSecond?.ra).not.toBe(0)
    expect(lowerSecond?.dec).not.toBe(0)
  })

  it('does not duplicate coordinates inside the important-asterism module', () => {
    expect(IMPORTANT_ASTERISMS.flatMap((item) => item.members).some((member) => 'ra' in member || 'dec' in member)).toBe(false)
  })
})
