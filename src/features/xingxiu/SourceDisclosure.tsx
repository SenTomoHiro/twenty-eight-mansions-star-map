import { CULTURAL_SOURCE_BY_ID } from '../../data/culturalSources'
import { SOURCE_BY_ID } from '../../data/sources'
import type { XingxiuCultureProfile } from '../../types/culture'
import type { CulturalSourceRecord } from '../../types/culture'
import type { Mansion, MansionStarMapping, SourceRecord } from '../../types/xingxiu'
import { useLocale } from '../../i18n/i18n'
import { localizeCulturalSource, localizeSource } from '../../i18n/localizedData'

interface SourceDisclosureProps {
  mansion: Mansion
  mapping: MansionStarMapping
  culture: XingxiuCultureProfile
}

export function SourceDisclosure({ mansion, mapping, culture }: SourceDisclosureProps) {
  const { locale } = useLocale()
  const sourceIds = [...new Set([...mansion.sourceIds, ...mapping.sourceIds])]
  const sources = sourceIds
    .map((id) => SOURCE_BY_ID[id])
    .filter((source): source is SourceRecord => Boolean(source)).map((source) => localizeSource(source, locale))
  const culturalSources = culture.sourceIds
    .map((id) => CULTURAL_SOURCE_BY_ID[id])
    .filter((source): source is CulturalSourceRecord => Boolean(source)).map((source) => localizeCulturalSource(source, locale))
  const groups = [
    {
      title: locale === 'en' ? 'Historical texts' : '古籍',
      items: culturalSources.filter((source) => source.category === 'ancient-history' || source.category === 'ancient-astronomy'),
    },
    {
      title: locale === 'en' ? 'Daoist texts' : '道教文献',
      items: culturalSources.filter((source) => source.category === 'daoist-canon'),
    },
    {
      title: locale === 'en' ? 'Modern research' : '现代研究',
      items: culturalSources.filter((source) => source.category === 'modern-research'),
    },
  ]

  return (
    <details className="source-disclosure">
      <summary>
        <span>{locale === 'en' ? 'View heritage, cultural, and astronomical evidence' : '查看文物、文化与天文依据'}</span>
        <small>{sources.length + culturalSources.length} {locale === 'en' ? 'verified sources' : '项已校验来源'}</small>
      </summary>
      <div className="source-disclosure__body">
        <p className="source-disclosure__difference">{mapping.differenceNote}</p>
        {groups.map((group) => (
          <section key={group.title} className="source-disclosure__group">
            <h4>{group.title}</h4>
            <ul>
              {group.items.map((source) => (
                <li key={source.id}>
                  <div><span>{group.title}</span><strong>{source.title}</strong></div>
                  <p>{source.locator}{locale === 'en' ? '. ' : '。'}{source.note}</p>
                  <a href={source.url} rel="noreferrer" target="_blank">{locale === 'en' ? 'Open original source' : '查看原始来源'} <span aria-hidden="true">↗</span></a>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {(['astronomy', 'relic'] as const).map((type) => (
          <section key={type} className="source-disclosure__group">
            <h4>{type === 'astronomy' ? (locale === 'en' ? 'Astronomical sources' : '天文资料') : (locale === 'en' ? 'Heritage form evidence' : '文物造型依据')}</h4>
            <ul>
              {sources.filter((source) => source.type === type).map((source) => (
                <li key={source.id}>
                  <div><span>{type === 'astronomy' ? (locale === 'en' ? 'Astronomy' : '天文') : (locale === 'en' ? 'Heritage' : '文物')}</span><strong>{source.title}</strong></div>
                  <p>{source.note}</p>
                  {source.url ? <a href={source.url} rel="noreferrer" target="_blank">{locale === 'en' ? 'Open original source' : '查看原始来源'} <span aria-hidden="true">↗</span></a> : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </details>
  )
}
