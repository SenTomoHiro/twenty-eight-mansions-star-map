import { useRef } from 'react'
import { AtlasIcon } from '../../components/AtlasIcon'
import { useDialogFocus } from '../useDialogFocus'
import type { Mansion, MansionStarMapping } from '../../types/xingxiu'
import { DeityStage } from './DeityStage'
import { useLocale } from '../../i18n/i18n'
import { localizeMansion } from '../../i18n/localizedData'

interface MansionDetailOverlayProps {
  mansion: Mansion
  mapping: MansionStarMapping
  onClose: () => void
  onSelect: (id: string) => void
}

export function MansionDetailOverlay({ mansion, mapping, onClose, onSelect }: MansionDetailOverlayProps) {
  const { locale } = useLocale()
  const displayMansion = localizeMansion(mansion, locale)
  const dialogRef = useRef<HTMLDivElement>(null)
  useDialogFocus(dialogRef)

  return (
    <div ref={dialogRef} className='mansion-detail-overlay' role='dialog' aria-modal='true' aria-labelledby='deity-title' tabIndex={-1}>
      <button
        className='detail-overlay__close'
        type='button'
        onClick={onClose}
        aria-label={locale === 'en' ? `Close details for ${displayMansion.name}` : `关闭${mansion.name}宿详情`}
      >
        <AtlasIcon name='close' />
        <span>{locale === 'en' ? 'Close' : '关闭'}</span>
      </button>
      <div className='detail-overlay__content'>
        <DeityStage mansion={mansion} mapping={mapping} onSelect={onSelect} />
      </div>
    </div>
  )
}
