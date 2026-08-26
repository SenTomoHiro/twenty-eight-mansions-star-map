import { FOUR_SYMBOLS } from '../../data/fourSymbols'
import { mansionsForSymbol } from '../../data/mansions'

interface SkyMansionNavProps {
  selectedId: string
  onSelect: (id: string) => void
  onClose: () => void
}

export function SkyMansionNav({ selectedId, onSelect, onClose }: SkyMansionNavProps) {
  return (
    <aside className="sky-mansion-nav" aria-label="二十八宿导航">
      <header>
        <div><small>CELESTIAL ORDER</small><strong>周天二十八宿</strong></div>
        <button type="button" onClick={onClose} aria-label="收起二十八宿导航">收起 ×</button>
      </header>
      <div className="sky-mansion-nav__groups">
        {FOUR_SYMBOLS.map((symbol) => (
          <section key={symbol.id} style={{ '--symbol-accent': symbol.accent } as React.CSSProperties}>
            <div><small>{symbol.direction} · {symbol.season}</small><strong>{symbol.shortName}</strong></div>
            <ol>
              {mansionsForSymbol(symbol.id).map((mansion) => (
                <li key={mansion.id}>
                  <button
                    className={mansion.id === selectedId ? 'is-active' : ''}
                    type="button"
                    aria-current={mansion.id === selectedId ? 'true' : undefined}
                    onClick={() => onSelect(mansion.id)}
                  >
                    <small>{String(mansion.order).padStart(2, '0')}</small><span>{mansion.name}</span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </aside>
  )
}
