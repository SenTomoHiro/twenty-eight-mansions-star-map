import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { FOUR_SYMBOLS } from '../data/fourSymbols'
import { IMPORTANT_ASTERISMS } from '../data/importantAsterisms'
import mansionStarMappingsData from '../data/mansion-star-mappings.json'
import { MANSIONS } from '../data/mansions'
import { XINGXIU_CULTURE_BY_ID } from '../data/xingxiuCulture'
import type { MansionStarMapping } from '../types/xingxiu'
import { LocaleProvider, LocaleSwitch, messages, persistLocalePreference, resolveLocalePreference } from './i18n'
import { localizeCulture, localizeFourSymbol, localizeImportantAsterism, localizeMansion, localizeMapping } from './localizedData'

describe('localization', () => {
  it('keeps Chinese and English translation keys identical', () => {
    expect(Object.keys(messages.en).sort()).toEqual(Object.keys(messages['zh-CN']).sort())
  })

  it('renders both locale choices and selects the requested locale', () => {
    const chinese = renderToStaticMarkup(<LocaleProvider initialLocaleOverride="zh-CN"><LocaleSwitch /></LocaleProvider>)
    const english = renderToStaticMarkup(<LocaleProvider initialLocaleOverride="en"><LocaleSwitch /></LocaleProvider>)
    expect(chinese).toContain('aria-pressed="true">中文')
    expect(english).toContain('aria-pressed="true">English')
  })

  it('defaults missing and invalid preferences to English', () => {
    expect(resolveLocalePreference(null)).toBe('en')
    expect(resolveLocalePreference('en')).toBe('en')
    expect(resolveLocalePreference('zh-CN')).toBe('zh-CN')
    expect(resolveLocalePreference('unknown')).toBe('en')
  })

  it('keeps an explicit language selection after a later initialization', () => {
    let stored: string | null = null
    const storage = {
      setItem: (_key: string, value: string) => { stored = value },
      getItem: () => stored,
    }
    persistLocalePreference(storage, 'zh-CN')
    expect(resolveLocalePreference(storage.getItem())).toBe('zh-CN')
    persistLocalePreference(storage, 'en')
    expect(resolveLocalePreference(storage.getItem())).toBe('en')
  })

  it('has complete English data for every mansion, symbol, culture profile, and important asterism', () => {
    const mappings = mansionStarMappingsData.mappings as MansionStarMapping[]
    for (const mansion of MANSIONS) {
      const translated = localizeMansion(mansion, 'en')
      const mapping = mappings.find((candidate) => candidate.mansionId === mansion.id)
      const culture = XINGXIU_CULTURE_BY_ID[mansion.id]
      expect(translated.name).toMatch(/[A-Za-z]/)
      expect(mapping).toBeDefined()
      expect(culture).toBeDefined()
      expect(localizeMapping(mapping!, translated, 'en').stars).toBe(mapping!.stars)
      expect(localizeCulture(culture!, translated, 'en').humanOrder.text).toMatch(/[A-Za-z]/)
    }
    expect(FOUR_SYMBOLS.map((symbol) => localizeFourSymbol(symbol, 'en').name)).toHaveLength(4)
    expect(IMPORTANT_ASTERISMS.map((item) => localizeImportantAsterism(item, 'en').name)).toHaveLength(3)
  })

  it('does not duplicate or alter astronomical identities and interaction geometry', () => {
    const mappings = mansionStarMappingsData.mappings as MansionStarMapping[]
    for (const [index, mansion] of MANSIONS.entries()) {
      const mapping = mappings[index]!
      const translated = localizeMapping(mapping, localizeMansion(mansion, 'en'), 'en')
      expect(translated.mansionId).toBe(mapping.mansionId)
      expect(translated.definingStarHip).toBe(mapping.definingStarHip)
      expect(translated.stars).toBe(mapping.stars)
      expect(translated.lines).toBe(mapping.lines)
    }
  })
})
