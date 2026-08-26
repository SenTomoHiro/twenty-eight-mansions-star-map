import { useEffect, useMemo } from 'react'
import { deityArtwork, visualAsset } from '../../assets'
import { FOUR_SYMBOL_BY_ID } from '../../data/fourSymbols'
import { MANSIONS } from '../../data/mansions'
import { XINGXIU_CULTURE_BY_ID } from '../../data/xingxiuCulture'
import type { Mansion, MansionStarMapping } from '../../types/xingxiu'
import { formatStellarDistance } from '../../utils/stellarDistance'
import { CultureArchive } from './CultureArchive'
import { SourceDisclosure } from './SourceDisclosure'

interface DeityStageProps {
  mansion: Mansion
  mapping: MansionStarMapping
  onSelect: (id: string) => void
}

export function DeityStage({ mansion, mapping, onSelect }: DeityStageProps) {
  const deity = deityArtwork(mansion.assetStem)
  const symbol = FOUR_SYMBOL_BY_ID[mansion.symbolId]
  const culture = XINGXIU_CULTURE_BY_ID[mansion.id]
  if (!culture) throw new Error(`Missing cultural profile for ${mansion.id}`)
  const background = visualAsset('backgrounds/02-ink-clouds.webp')
  const orbit = visualAsset('stage/stage-01-celestial-orbit.webp')
  const halo = visualAsset('stage/stage-02-soft-halo.webp')
  const cloud = visualAsset('decor/cloud-01-auspicious.webp')
  const haze = visualAsset('decor/smoke-03-soft-haze.webp')
  const index = MANSIONS.findIndex((item) => item.id === mansion.id)
  const previous = MANSIONS[(index - 1 + MANSIONS.length) % MANSIONS.length]
  const next = MANSIONS[(index + 1) % MANSIONS.length]

  const mappingStars = useMemo(
    () => [...mapping.stars].sort((a, b) => a.mag - b.mag),
    [mapping],
  )

  useEffect(() => {
    for (const candidate of [previous, next]) {
      if (!candidate) continue
      const url = deityArtwork(candidate.assetStem)
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
        {haze ? <img className="deity-stage__haze" src={haze} alt="" aria-hidden="true" /> : null}
        <div className="deity-stage__ordinal" aria-hidden="true">
          {String(mansion.order).padStart(2, '0')}
        </div>
        <div className="deity-stage__figure">
          {deity ? (
            <img
              key={deity}
              src={deity}
              alt={`${mansion.fullName}正式神像插画`}
              decoding="async"
              fetchPriority="high"
            />
          ) : (
            <div className="deity-stage__placeholder" role="img" aria-label={`${mansion.fullName}神像素材整理中`}>
              <span>{mansion.name}</span>
              <small>神像素材整理中</small>
            </div>
          )}
        </div>
        {cloud ? <img className="deity-stage__cloud deity-stage__cloud--front" src={cloud} alt="" aria-hidden="true" /> : null}
        <p className="deity-stage__caption">
          {deity ? '经确认的统一画风正式神像' : '造型考据资料已保留 · 正式神像暂未接入'}
        </p>
      </div>

      <article className="deity-copy">
        <div className="eyebrow">
          <span>{symbol.direction}方七宿 · 第 {mansion.symbolOrder} 宿</span>
          <i />
          <span>{symbol.latin}</span>
        </div>
        <header>
          <p>{mansion.pinyin}</p>
          <h2 id="deity-title">{mansion.name}</h2>
          <div>
            <strong>{mansion.fullName}</strong>
            <span>{mansion.nature} · {mansion.animal}</span>
          </div>
        </header>
        <p className="deity-copy__lead">{mansion.intro}</p>
        <p className="deity-copy__note">{mansion.culturalNote}</p>

        <CultureArchive profile={culture} />

        <div className="mapping-facts">
          <div>
            <small>传统星官</small>
            <strong>{mapping.traditionalAsterism}</strong>
          </div>
          <div className="mapping-facts__distance">
            <small>距星</small>
            <strong>HIP {mapping.definingStarHip} · {formatStellarDistance(mapping.definingStarDistance)}</strong>
          </div>
          <div>
            <small>本宿成员</small>
            <strong>{mapping.stars.length} 星</strong>
          </div>
        </div>

        <div className="mapped-stars" aria-label={`${mansion.name}宿主要恒星`}>
          <small>当前展示版主要恒星</small>
          <div>
            {mappingStars.slice(0, 8).map((star) => (
              <span key={star.hip} title={`赤经 ${star.ra.toFixed(3)}° · 赤纬 ${star.dec.toFixed(3)}°`}>
                HIP {star.hip} <i>{star.mag.toFixed(2)}m</i>
              </span>
            ))}
          </div>
        </div>

        <SourceDisclosure mansion={mansion} mapping={mapping} culture={culture} />

        <nav className="deity-pager" aria-label="切换星宿">
          <button type="button" onClick={() => previous && onSelect(previous.id)}>
            <small>前一宿</small>
            <span>{previous?.name}</span>
          </button>
          <span>{String(mansion.order).padStart(2, '0')} / 28</span>
          <button type="button" onClick={() => next && onSelect(next.id)}>
            <small>后一宿</small>
            <span>{next?.name}</span>
          </button>
        </nav>
      </article>
    </section>
  )
}
