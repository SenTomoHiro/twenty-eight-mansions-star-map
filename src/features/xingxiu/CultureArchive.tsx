import type { XingxiuCultureProfile } from '../../types/culture'

interface CultureArchiveProps {
  profile: XingxiuCultureProfile
}

const reliabilityLabels = {
  'primary-source-confirmed': '古籍直证',
  'multiple-sources': '多源互校',
  'secondary-source-only': '现代研究',
  disputed: '版本有异',
  insufficient: '史料不足',
} as const

export function CultureArchive({ profile }: CultureArchiveProps) {
  const fields = [
    profile.nameAndImage,
    profile.humanOrder,
    profile.omenTradition,
    profile.regionalField,
    profile.daoistTradition,
  ]

  return (
    <section className="culture-archive" aria-label="统一文化档案">
      <header>
        <small>TRADITIONAL CULTURE ARCHIVE</small>
        <strong>传统文化五章</strong>
      </header>
      <div className="culture-archive__fields">
        {fields.map((field, index) => (
          <article key={field.title}>
            <div>
              <small>0{index + 1}</small>
              <h3>{field.title}</h3>
              <span>{reliabilityLabels[field.reliability]}</span>
            </div>
            <p>{field.text}</p>
          </article>
        ))}
      </div>
      <details className="ancient-evidence">
        <summary>
          <span>古籍依据</span>
          <small>正史天文志 + 道教文献</small>
        </summary>
        <div>
          {profile.ancientEvidence.map((citation) => (
            <figure key={citation.id}>
              <blockquote>“{citation.quote}”</blockquote>
              <figcaption>
                <strong>{citation.book}{citation.section}</strong>
                <span>{citation.dynasty} · {citation.authorOrCompiler} · {citation.locator}</span>
                <p>{citation.interpretation}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </details>
    </section>
  )
}

