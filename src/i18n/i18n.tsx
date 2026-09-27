/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Locale = 'zh-CN' | 'en'

const STORAGE_KEY = 'twenty-eight-mansions-locale'

export const messages = {
  'zh-CN': {
    skip: '跳至主要内容', homeLabel: '返回二十八宿星空', brand: '廿八宿', navLabel: '主导航', sky: '观星', provenance: '溯源',
    panoramaStatic: '固定全景 · 不取地点与时刻', traditionalSky: '完整中国传统星空', provenanceKinds: '天文 · 文化 · 文物',
    importantAsterism: '重要星官', fixedProjection: '固定全天投影 · 不代表某地某时的瞬时天空', aboveHorizon: '地平线上', belowHorizon: '地平线下',
    skyControls: '星空控制', dateTime: '日期时刻', mansionsNav: '周天列宿', resetView: '重置视角', observationStatus: '观测点状态', observationPoint: '观测点', switchObservationPoint: '切换观测点', yangcheng: '阳城', currentLocation: '当前位置', yangchengTitle: '夏都阳城 · 河南登封',
    panoramaOut: '拉远至完整全景星图', returnObservationLabel: '返回原地理观测视角', panorama: '全景', returnObservation: '返回观测', resetPanorama: '恢复全景', panoramaDirections: '全景固定方位', dateTimeSeason: '日期时刻与季节', observationTime: '观测时刻', collapse: '收起 ×',
    mainSkyLabel: '全屏三维星空', localeLabel: '语言', chinese: '中文', english: 'English',
    metadataTitle: '二十八宿｜中国传统星图', metadataDescription: '交互浏览二十八宿、中国传统星官、文化档案、正式神像与北斗、南斗、三台重要星官。',
  },
  en: {
    skip: 'Skip to main content', homeLabel: 'Return to the Twenty-Eight Mansions sky', brand: '28 Mansions', navLabel: 'Main navigation', sky: 'Sky', provenance: 'Sources',
    panoramaStatic: 'Fixed all-sky view · independent of place and time', traditionalSky: 'Complete traditional Chinese sky', provenanceKinds: 'Astronomy · Culture · Heritage',
    importantAsterism: 'Important asterism', fixedProjection: 'Fixed all-sky projection · not the instantaneous sky at a specific place or time', aboveHorizon: 'above horizon', belowHorizon: 'below horizon',
    skyControls: 'Sky controls', dateTime: 'Date & time', mansionsNav: 'Twenty-Eight Mansions', resetView: 'Reset view', observationStatus: 'Observer status', observationPoint: 'Observer', switchObservationPoint: 'Switch observer location', yangcheng: 'Yangcheng', currentLocation: 'Current location', yangchengTitle: 'Yangcheng reference · Dengfeng, Henan',
    panoramaOut: 'Zoom out to the complete all-sky map', returnObservationLabel: 'Return to the geographic observation view', panorama: 'All-sky', returnObservation: 'Observation', resetPanorama: 'Reset all-sky view', panoramaDirections: 'Fixed all-sky directions', dateTimeSeason: 'Date, time, and season', observationTime: 'Observation time', collapse: 'Collapse ×',
    mainSkyLabel: 'Full-screen three-dimensional sky', localeLabel: 'Language', chinese: '中文', english: 'English',
    metadataTitle: 'Twenty-Eight Mansions | Traditional Chinese Star Map', metadataDescription: 'Explore the Twenty-Eight Mansions, traditional Chinese asterisms, cultural archives, reviewed deity art, Beidou, Nandou, and Santai.',
  },
} as const

export type MessageKey = keyof typeof messages['zh-CN']

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: MessageKey) => string
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined)

export function resolveLocalePreference(stored: string | null): Locale {
  return stored === 'en' || stored === 'zh-CN' ? stored : 'en'
}

export function persistLocalePreference(storage: Pick<Storage, 'setItem'>, locale: Locale): void {
  storage.setItem(STORAGE_KEY, locale)
}

function initialLocale(): Locale {
  try {
    return resolveLocalePreference(window.localStorage.getItem(STORAGE_KEY))
  } catch { /* localStorage can be unavailable in privacy modes */ }
  return 'en'
}

export function LocaleProvider({ children, initialLocaleOverride }: { children: ReactNode; initialLocaleOverride?: Locale }) {
  const [locale, setLocale] = useState<Locale>(() => initialLocaleOverride ?? initialLocale())
  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale,
    t: (key) => messages[locale][key],
  }), [locale])

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = messages[locale].metadataTitle
    document.querySelector('meta[name="description"]')?.setAttribute('content', messages[locale].metadataDescription)
    try { persistLocalePreference(window.localStorage, locale) } catch { /* preference persistence is best effort */ }
  }, [locale])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) throw new Error('useLocale must be used inside LocaleProvider')
  return context
}

export function LocaleSwitch() {
  const { locale, setLocale, t } = useLocale()
  return (
    <div className="locale-switch" role="group" aria-label={t('localeLabel')}>
      <button type="button" className={locale === 'zh-CN' ? 'is-active' : ''} aria-pressed={locale === 'zh-CN'} onClick={() => setLocale('zh-CN')}>{t('chinese')}</button>
      <span aria-hidden="true">/</span>
      <button type="button" className={locale === 'en' ? 'is-active' : ''} aria-pressed={locale === 'en'} onClick={() => setLocale('en')}>{t('english')}</button>
    </div>
  )
}

export const localeStorageKey = STORAGE_KEY
