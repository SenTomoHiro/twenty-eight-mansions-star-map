import { useEffect, useMemo, useRef, useState } from 'react'
import { deityArtwork, mobileDeityArtwork, visualAsset } from '../../assets'
import { FOUR_SYMBOL_BY_ID } from '../../data/fourSymbols'
import { MANSIONS } from '../../data/mansions'
import { XINGXIU_CULTURE_BY_ID } from '../../data/xingxiuCulture'
import type { Mansion, MansionStarMapping } from '../../types/xingxiu'
import { formatStellarDistance } from '../../utils/stellarDistance'
import {
  HIGH_RES_DEITY_ARTWORK_TIMEOUT_MS,
  shouldAttemptArtworkTimeoutFallbackInBrowser,
  shouldUseMobileArtworkInBrowser,
} from '../../utils/deityArtworkLoading'
import { CultureArchive } from './CultureArchive'
import { SourceDisclosure } from './SourceDisclosure'
import { useLocale } from '../../i18n/i18n'
import { localizeCulture, localizeFourSymbol, localizeMansion, localizeMapping } from '../../i18n/localizedData'

interface DeityStageProps {
  mansion: Mansion
  mapping: MansionStarMapping
  onSelect: (id: string) => void
}

function useResponsiveDeityArtwork(highResolutionUrl: string | undefined, mobileUrl: string | undefined) {
  const [useMobileImmediately] = useState(() => shouldUseMobileArtworkInBrowser() && Boolean(mobileUrl))
  const [useTimeoutFallback] = useState(() => shouldAttemptArtworkTimeoutFallbackInBrowser())
  const [source, setSource] = useState(() => useMobileImmediately ? mobileUrl : highResolutionUrl)
  const session = useRef({ highResolutionLoaded: false, pendingFallback: false })

  useEffect(() => {
    session.current = { highResolutionLoaded: false, pendingFallback: false }
    const currentSession = session.current

    if (useMobileImmediately || !useTimeoutFallback || !highResolutionUrl || !mobileUrl) return undefined

    let active = true
    const timer = window.setTimeout(() => {
      if (currentSession.highResolutionLoaded || currentSession.pendingFallback) return
      currentSession.pendingFallback = true
      const fallbackImage = new Image()
      fallbackImage.decoding = 'async'
      fallbackImage.onload = () => {
        if (active && !currentSession.highResolutionLoaded && session.current === currentSession) setSource(mobileUrl)
      }
      fallbackImage.src = mobileUrl
    }, HIGH_RES_DEITY_ARTWORK_TIMEOUT_MS)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [highResolutionUrl, mobileUrl, useMobileImmediately, useTimeoutFallback])

  return {
    source,
    markHighResolutionLoaded: () => {
      if (source === highResolutionUrl) session.current.highResolutionLoaded = true
    },
  }
}

interface ResponsiveDeityImageProps {
  highResolutionUrl: string
  mobileUrl: string | undefined
  alt: string
}

function ResponsiveDeityImage({ highResolutionUrl, mobileUrl, alt }: ResponsiveDeityImageProps) {
  const { source, markHighResolutionLoaded } = useResponsiveDeityArtwork(highResolutionUrl, mobileUrl)
  if (!source) return null

  return (
    <img
      src={source}
      alt={alt}
      decoding="async"
      fetchPriority="high"
      onLoad={markHighResolutionLoaded}
    />
  )
}

export function DeityStage({ mansion, mapping, onSelect }: DeityStageProps) {
  const { locale } = useLocale()
  const highResolutionDeity = deityArtwork(mansion.assetStem)
  const mobileDeity = mobileDeityArtwork(mansion.assetStem)
  const symbol = FOUR_SYMBOL_BY_ID[mansion.symbolId]
  const culture = XINGXIU_CULTURE_BY_ID[mansion.id]
  if (!culture) throw new Error(`Missing cultural profile for ${mansion.id}`)
  const displayMansion = localizeMansion(mansion, locale)
  const displaySymbol = localizeFourSymbol(symbol, locale)
  const displayMapping = localizeMapping(mapping, displayMansion, locale)
  const displayCulture = localizeCulture(culture, displayMansion, locale)
  const background = visualAsset('backgrounds/02-ink-clouds.webp')
  const orbit = visualAsset('stage/stage-01-celestial-orbit.webp')
  const halo = visualAsset('stage/stage-02-soft-halo.webp')
  const cloud = visualAsset('decor/cloud-01-auspicious.webp')
  const index = MANSIONS.findIndex((item) => item.id === mansion.id)
  const previous = MANSIONS[(index - 1 + MANSIONS.length) % MANSIONS.length]
  const next = MANSIONS[(index + 1) % MANSIONS.length]

  const mappingStars = useMemo(
    () => [...mapping.stars].sort((a, b) => a.mag - b.mag),
    [mapping],
  )

  useEffect(() => {
    const useMobileArtwork = shouldUseMobileArtworkInBrowser()
    for (const candidate of [previous, next]) {
      if (!candidate) continue
      const url = useMobileArtwork
        ? mobileDeityArtwork(candidate.assetStem)
        : deityArtwork(candidate.assetStem)
      if (url) new Image().src = url
    }
  }, [next, previous])

  return (
    <section
      className="deity-section"
      id="deity"
      style={{ '--symbol-accent': symbol.accent } as React.CSSProperties}
      aria-labelledby="deity-title"
    >
      <div className="deity-stage" style={background ? { backgroundImage: `url(${background})` } : undefined}>
        <div className="deity-stage__veil" />
        {orbit ? <img className="deity-stage__orbit" src={orbit} alt="" aria-hidden="true" /> : null}
        {halo ? <img className="deity-stage__halo" src={halo} alt="" aria-hidden="true" /> : null}
        {cloud ? <img className="deity-stage__cloud deity-stage__cloud--back" src={cloud} alt="" aria-hidden="true" /> : null}
        <div className="deity-stage__ordinal" aria-hidden="true">
          {String(mansion.order).padStart(2, '0')}
        </div>
        <div className="deity-stage__figure">
          {highResolutionDeity ? (
            <ResponsiveDeityImage
              key={highResolutionDeity}
              highResolutionUrl={highResolutionDeity}
              mobileUrl={mobileDeity}
              alt={locale === 'en' ? `Reviewed deity illustration for ${displayMansion.fullName}` : `${mansion.fullName}正式神像插画`}
            />
          ) : (
            <div className="deity-stage__placeholder" role="img" aria-label={locale === 'en' ? `Deity artwork for ${displayMansion.fullName} is being prepared` : `${mansion.fullName}神像素材整理中`}>
              <span>{displayMansion.name}</span>
              <small>{locale === 'en' ? 'Artwork in preparation' : '神像素材整理中'}</small>
            </div>
          )}
        </div>
        {cloud ? (
          <div
            className="deity-stage__cloud-bed"
            style={{ backgroundImage: `url(${cloud})` }}
            aria-hidden="true"
          />
        ) : null}
      </div>

      <article className="deity-copy">
        <div className="eyebrow">
          <span>{locale === 'en' ? `${displaySymbol.name} · Mansion ${mansion.symbolOrder} of 7` : `${symbol.direction}方七宿 · 第 ${mansion.symbolOrder} 宿`}</span>
          <i />
          <span>{displaySymbol.latin}</span>
        </div>
        <header>
          <p>{mansion.pinyin}</p>
          <h2 id="deity-title">{displayMansion.name}</h2>
          <div>
            <strong>{displayMansion.fullName}</strong>
            <span>{displayMansion.nature} · {displayMansion.animal}</span>
          </div>
        </header>
        <p className="deity-copy__lead">{displayMansion.intro}</p>
        <p className="deity-copy__note">{displayMansion.culturalNote}</p>

        <CultureArchive profile={displayCulture} />

        <div className="mapping-facts">
          <div>
            <small>{locale === 'en' ? 'Traditional asterism' : '传统星官'}</small>
            <strong>{displayMapping.traditionalAsterism}</strong>
          </div>
          <div className="mapping-facts__distance">
            <small>{locale === 'en' ? 'Defining star' : '距星'}</small>
            <strong>HIP {mapping.definingStarHip} · {formatStellarDistance(mapping.definingStarDistance, locale)}</strong>
          </div>
          <div>
            <small>{locale === 'en' ? 'Members' : '本宿成员'}</small>
            <strong>{mapping.stars.length} {locale === 'en' ? 'stars' : '星'}</strong>
          </div>
        </div>

        <div className="mapped-stars" aria-label={locale === 'en' ? `Principal stars of ${displayMansion.name}` : `${mansion.name}宿主要恒星`}>
          <small>{locale === 'en' ? 'Principal stars in this display version' : '当前展示版主要恒星'}</small>
          <div>
            {mappingStars.slice(0, 8).map((star) => (
              <span key={star.hip} title={locale === 'en' ? `RA ${star.ra.toFixed(3)}° · Dec ${star.dec.toFixed(3)}°` : `赤经 ${star.ra.toFixed(3)}° · 赤纬 ${star.dec.toFixed(3)}°`}>
                HIP {star.hip} <i>{star.mag.toFixed(2)}m</i>
              </span>
            ))}
          </div>
        </div>

        <SourceDisclosure mansion={displayMansion} mapping={displayMapping} culture={displayCulture} />

        <nav className="deity-pager" aria-label={locale === 'en' ? 'Switch mansion' : '切换星宿'}>
          <button type="button" onClick={() => previous && onSelect(previous.id)}>
            <small>{locale === 'en' ? 'Previous' : '前一宿'}</small>
            <span>{previous ? localizeMansion(previous, locale).name : ''}</span>
          </button>
          <span>{String(mansion.order).padStart(2, '0')} / 28</span>
          <button type="button" onClick={() => next && onSelect(next.id)}>
            <small>{locale === 'en' ? 'Next' : '后一宿'}</small>
            <span>{next ? localizeMansion(next, locale).name : ''}</span>
          </button>
        </nav>
      </article>
    </section>
  )
}
