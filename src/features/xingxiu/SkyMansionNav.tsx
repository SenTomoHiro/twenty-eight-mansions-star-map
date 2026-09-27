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
  return (
    <aside className="sky-mansion-nav" aria-label={locale === 'en' ? 'Twenty-Eight Mansions navigation' : '二十八宿导航'}>
      <header>
        <div><small>CELESTIAL ORDER</small><strong>{locale === 'en' ? 'Twenty-Eight Mansions' : '周天二十八宿'}</strong></div>
        <button type="button" onClick={onClose} aria-label={locale === 'en' ? 'Collapse mansion navigation' : '收起二十八宿导航'}>{locale === 'en' ? 'Collapse ×' : '收起 ×'}</button>
      </header>
      <div className="sky-mansion-nav__groups">
        {FOUR_SYMBOLS.map((symbol) => {
          const displaySymbol = localizeFourSymbol(symbol, locale)
          return <section key={symbol.id} style={{ '--symbol-accent': symbol.accent } as React.CSSProperties}>
            <div><small>{displaySymbol.direction} · {displaySymbol.season}</small><strong>{displaySymbol.shortName}</strong></div>
            <ol>
              {mansionsForSymbol(symbol.id).map((mansion) => {
                const displayMansion = localizeMansion(mansion, locale)
                return (
                <li key={mansion.id}>
                  <button
                    className={mansion.id === selectedId ? 'is-active' : ''}
                    type="button"
                    aria-current={mansion.id === selectedId ? 'true' : undefined}
                    onClick={() => onSelect(mansion.id)}
                  >
                    <small>{String(mansion.order).padStart(2, '0')}</small><span>{displayMansion.name}</span>
                  </button>
                </li>
              )})}
            </ol>
          </section>
        })}
      </div>
    </aside>
  )
}
