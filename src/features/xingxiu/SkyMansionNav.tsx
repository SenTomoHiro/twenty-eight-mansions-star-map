import type { CSSProperties } from 'react'
import { AtlasIcon } from '../../components/AtlasIcon'
import { FOUR_SYMBOLS } from '../../data/fourSymbols'
import { mansionsForSymbol } from '../../data/mansions'
import { useLocale } from '../../i18n/i18n'
import { localizeFourSymbol, localizeMansion } from '../../i18n/localizedData'

interface SkyMansionNavProps {
  selectedId: string
  onSelect: (id: string) => void
  onClose: () => void
}

export function SkyMansionNav({ selectedId, onSelect, onClose }: SkyMansionNavProps) {
  const { locale } = useLocale()
  const english = locale === 'en'
  return (
    <aside className='sky-mansion-nav' id='sky-mansion-nav' aria-label={english ? 'Twenty-Eight Mansions navigation' : '二十八宿导航'}>
      <header>
        <div>
          <small>CELESTIAL ORDER · 04 × 07</small>
          <strong>{english ? 'Twenty-Eight Mansions' : '周天二十八宿'}</strong>
        </div>
        <button
          className='atlas-panel-close'
          type='button'
          onClick={onClose}
          aria-label={english ? 'Collapse mansion navigation' : '收起二十八宿导航'}
        >
          <AtlasIcon name='close' />
          <span>{english ? 'Close' : '收起'}</span>
        </button>
      </header>
      <div className='sky-mansion-nav__groups'>
        {FOUR_SYMBOLS.map((symbol) => {
          const displaySymbol = localizeFourSymbol(symbol, locale)
          return (
            <section key={symbol.id} style={{ '--symbol-accent': symbol.accent } as CSSProperties}>
              <div>
                <small>{displaySymbol.direction} · {displaySymbol.season}</small>
                <strong>{displaySymbol.shortName}</strong>
              </div>
              <ol>
                {mansionsForSymbol(symbol.id).map((mansion) => {
                  const displayMansion = localizeMansion(mansion, locale)
                  const active = mansion.id === selectedId
                  return (
                    <li key={mansion.id}>
                      <button
                        className={active ? 'is-active' : ''}
                        type='button'
                        aria-current={active ? 'true' : undefined}
                        onClick={() => onSelect(mansion.id)}
                      >
                        <small>{String(mansion.order).padStart(2, '0')}</small>
                        <span>{displayMansion.name}</span>
                      </button>
                    </li>
                  )
                })}
              </ol>
            </section>
          )
        })}
      </div>
    </aside>
  )
}
