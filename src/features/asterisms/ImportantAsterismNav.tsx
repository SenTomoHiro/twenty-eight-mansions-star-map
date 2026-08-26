import { IMPORTANT_ASTERISMS } from '../../data/importantAsterisms'
import type { ImportantAsterismId } from '../../types/importantAsterism'

interface ImportantAsterismNavProps {
  selectedId?: ImportantAsterismId
  onSelect: (id: ImportantAsterismId) => void
  onClose: () => void
}

export function ImportantAsterismNav({ selectedId, onSelect, onClose }: ImportantAsterismNavProps) {
  return (
    <aside className="important-asterism-nav" aria-label="重要星官导航">
      <header>
        <div><small>IMPORTANT ASTERISMS</small><strong>重要星官</strong></div>
        <button type="button" onClick={onClose} aria-label="收起重要星官导航">收起 ×</button>
      </header>
      <ol>
        {IMPORTANT_ASTERISMS.map((asterism) => (
          <li key={asterism.id}>
            <button
              type="button"
              className={asterism.id === selectedId ? 'is-active' : ''}
              aria-current={asterism.id === selectedId ? 'true' : undefined}
              onClick={() => onSelect(asterism.id)}
            >
              <small>0{asterism.order}</small>
              <strong>{asterism.name}</strong>
              <span>{asterism.members.length} 位 · {asterism.traditionalRegion}</span>
            </button>
          </li>
        ))}
      </ol>
      <p>二十八宿之外的补充文化层 · 本期仅三组</p>
    </aside>
  )
}

