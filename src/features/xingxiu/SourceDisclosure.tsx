import { CULTURAL_SOURCE_BY_ID } from '../../data/culturalSources'
import { SOURCE_BY_ID } from '../../data/sources'
import type { XingxiuCultureProfile } from '../../types/culture'
import type { CulturalSourceRecord } from '../../types/culture'
import type { Mansion, MansionStarMapping, SourceRecord } from '../../types/xingxiu'

interface SourceDisclosureProps {
  mansion: Mansion
  mapping: MansionStarMapping
  culture: XingxiuCultureProfile
}

export function SourceDisclosure({ mansion, mapping, culture }: SourceDisclosureProps) {
  const sourceIds = [...new Set([...mansion.sourceIds, ...mapping.sourceIds])]
  const sources = sourceIds
    .map((id) => SOURCE_BY_ID[id])
    .filter((source): source is SourceRecord => Boolean(source))
  const culturalSources = culture.sourceIds
    .map((id) => CULTURAL_SOURCE_BY_ID[id])
    .filter((source): source is CulturalSourceRecord => Boolean(source))
  const groups = [
    {
      title: '古籍',
      items: culturalSources.filter((source) => source.category === 'ancient-history' || source.category === 'ancient-astronomy'),
    },
    {
      title: '道教文献',
      items: culturalSources.filter((source) => source.category === 'daoist-canon'),
    },
    {
      title: '现代研究',
      items: culturalSources.filter((source) => source.category === 'modern-research'),
    },
  ]

  return (
    <details className="source-disclosure">
      <summary>
        <span>查看文物、文化与天文依据</span>
        <small>{sources.length + culturalSources.length} 项已校验来源</small>
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
                  <p>{source.locator}。{source.note}</p>
                  <a href={source.url} rel="noreferrer" target="_blank">查看原始来源 <span aria-hidden="true">↗</span></a>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {(['astronomy', 'relic'] as const).map((type) => (
          <section key={type} className="source-disclosure__group">
            <h4>{type === 'astronomy' ? '天文资料' : '文物造型依据'}</h4>
            <ul>
              {sources.filter((source) => source.type === type).map((source) => (
                <li key={source.id}>
                  <div><span>{type === 'astronomy' ? '天文' : '文物'}</span><strong>{source.title}</strong></div>
                  <p>{source.note}</p>
                  {source.url ? <a href={source.url} rel="noreferrer" target="_blank">查看原始来源 <span aria-hidden="true">↗</span></a> : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </details>
  )
}
