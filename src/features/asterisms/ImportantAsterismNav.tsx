import { AtlasIcon } from '../../components/AtlasIcon'
import { IMPORTANT_ASTERISMS } from '../../data/importantAsterisms'
import type { ImportantAsterismId } from '../../types/importantAsterism'
import { useLocale } from '../../i18n/i18n'
import { localizeImportantAsterism } from '../../i18n/localizedData'

interface ImportantAsterismNavProps {
  selectedId?: ImportantAsterismId
  onSelect: (id: ImportantAsterismId) => void
  onClose: () => void
}

export function ImportantAsterismNav({ selectedId, onSelect, onClose }: ImportantAsterismNavProps) {
  const { locale } = useLocale()
  const english = locale === 'en'
  return (
    <aside className='important-asterism-nav' id='sky-important-nav' aria-label={english ? 'Important asterism navigation' : '重要星官导航'}>
      <header>
        <div>
          <small>IMPORTANT ASTERISMS · 03</small>
          <strong>{english ? 'Important Asterisms' : '重要星官'}</strong>
        </div>
        <button
          className='atlas-panel-close'
          type='button'
          onClick={onClose}
          aria-label={english ? 'Collapse important asterism navigation' : '收起重要星官导航'}
        >
          <AtlasIcon name='close' />
          <span>{english ? 'Close' : '收起'}</span>
        </button>
      </header>
      <ol>
        {IMPORTANT_ASTERISMS.map((asterism) => {
          const display = localizeImportantAsterism(asterism, locale)
          return (
            <li key={asterism.id}>
              <button
                type='button'
                className={asterism.id === selectedId ? 'is-active' : ''}
                aria-current={asterism.id === selectedId ? 'true' : undefined}
                onClick={() => onSelect(asterism.id)}
              >
                <small>0{asterism.order}</small>
                <strong>{display.name}</strong>
                <span>{asterism.members.length} {english ? 'members' : '位'} · {display.traditionalRegion}</span>
              </button>
            </li>
          )
        })}
      </ol>
      <p>{english ? 'A supplementary cultural layer beyond the Twenty-Eight Mansions · three groups in this release' : '二十八宿之外的补充文化层 · 本期仅三组'}</p>
    </aside>
  )
}
