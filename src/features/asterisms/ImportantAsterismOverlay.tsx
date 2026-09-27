import { useEffect, useState, useRef } from 'react'
import { IMPORTANT_ASTERISM_SOURCE_BY_ID } from '../../data/importantAsterismSources'
import type { ImportantAsterismSource } from '../../data/importantAsterismSources'
import { resolveImportantMembers } from '../../data/importantAsterisms'
import type { ImportantAsterism } from '../../types/importantAsterism'
import { ImportantAsterismDiagram } from './ImportantAsterismDiagram'
import { useLocale } from '../../i18n/i18n'
import { localizeImportantAsterism, localizeImportantSource } from '../../i18n/localizedData'

interface ImportantAsterismOverlayProps {
  asterism: ImportantAsterism
  onClose: () => void
}

export function ImportantAsterismOverlay({ asterism, onClose }: ImportantAsterismOverlayProps) {
  const { locale } = useLocale()
  const display = localizeImportantAsterism(asterism, locale)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const members = resolveImportantMembers(display)

  useEffect(() => {
    closeButtonRef.current?.focus()
  }, [])

  const selectMember = (id: string) => setSelectedMemberIds((current) => current.length === 1 && current[0] === id ? [] : [id])
  const selectGroup = (memberIds: string[]) => setSelectedMemberIds((current) => (
    current.length === memberIds.length && memberIds.every((id) => current.includes(id)) ? [] : memberIds
  ))

  return (
    <div className="important-detail-overlay" role="dialog" aria-modal="true" aria-labelledby="important-title">
      <button ref={closeButtonRef} className="detail-overlay__close" type="button" onClick={onClose}>
        <span>{locale === 'en' ? 'Close' : '关闭'}</span><i aria-hidden="true">×</i>
      </button>
      <div className="important-detail-overlay__content">
        <section className="important-detail-overlay__sky">
          <header><small>IMPORTANT ASTERISM · 0{asterism.order}</small><span>{asterism.mappingConfidence === 'high' ? (locale === 'en' ? 'Modern mapping verified' : '现代映射已核验') : (locale === 'en' ? 'Includes an unresolved traditional position' : '含未定传统星位')}</span></header>
          <ImportantAsterismDiagram asterism={display} selectedMemberIds={selectedMemberIds} />
          <p>{display.modernMappingNotes}</p>
        </section>
        <article className="important-detail-overlay__archive">
          <header>
            <small>{display.latin}</small>
            <h2 id="important-title">{display.name}</h2>
            <p>{display.aliases.join(' · ')} / {display.traditionalRegion}</p>
          </header>

          {asterism.childGroups.length > 0 ? (
            <div className="important-detail-overlay__groups" aria-label={locale === 'en' ? 'Internal groups' : '内部子组'}>
              {display.childGroups.map((group) => (
                <button key={group.id} type="button" onClick={() => selectGroup(group.memberIds)}>
                  <strong>{group.name}</strong><span>2 {locale === 'en' ? 'stars' : '星'}</span><small>{group.summary}</small>
                </button>
              ))}
            </div>
          ) : null}

          <section className="important-detail-overlay__members">
            <div><small>MEMBERS</small><h3>{locale === 'en' ? 'Member structure' : '成员结构'}</h3></div>
            <ol>
              {members.map((member, index) => (
                <li key={member.id}>
                  <button
                    type="button"
                    className={selectedMemberIds.includes(member.id) ? 'is-active' : ''}
                    onClick={() => selectMember(member.id)}
                  >
                    <small>{String(index + 1).padStart(2, '0')}</small>
                    <strong>{member.name}</strong>
                    <span>{member.hip ? `${member.designation ?? ''} · HIP ${member.hip}` : (locale === 'en' ? 'Traditional position · modern counterpart undetermined' : '传统星位 · 现代对应未作确定')}</span>
                    <i>{member.mapping === 'traditional-position-only' ? (locale === 'en' ? 'Unresolved' : '未定') : member.mapping === 'shared-mansion-star' ? (locale === 'en' ? 'Shared with Dou' : '复用斗宿') : (locale === 'en' ? 'Physical star' : '真实恒星')}</i>
                  </button>
                </li>
              ))}
            </ol>
          </section>

          <div className="important-detail-overlay__chapters">
            <section><small>01 · ANCIENT ASTRONOMY</small><h3>{locale === 'en' ? 'Ancient astronomy' : '古代天文学'}</h3><p>{display.astronomySummary}</p></section>
            <section><small>02 · DAOIST CULTURE</small><h3>{locale === 'en' ? 'Daoist culture' : '道教文化'}</h3><p>{display.daoistSummary}</p></section>
            <section><small>03 · CULTURAL MEANING</small><h3>{locale === 'en' ? 'Cultural meaning' : '文化意义'}</h3><p>{display.culturalMeaning}</p></section>
          </div>

          <section className="important-detail-overlay__sources">
            <small>SOURCES</small><h3>{locale === 'en' ? 'Evidence and sources' : '资料依据'}</h3>
            <ul>
              {asterism.sourceIds.map((id) => IMPORTANT_ASTERISM_SOURCE_BY_ID[id]).filter((source): source is ImportantAsterismSource => Boolean(source)).map((source) => localizeImportantSource(source, locale)).map((source) => (
                <li key={source.id}>
                  <a href={source.url} target="_blank" rel="noreferrer"><strong>{source.title}</strong><span>{source.authorOrInstitution}</span><i>↗</i></a>
                  <p>{source.note}</p>
                </li>
              ))}
            </ul>
          </section>
        </article>
      </div>
    </div>
  )
}
