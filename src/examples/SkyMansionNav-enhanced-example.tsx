// 集成示例：在 SkyMansionNav 组件中应用增强样式

import { FOUR_SYMBOLS } from '../data/fourSymbols'
import { mansionsForSymbol } from '../data/mansions'
import { useLocale } from '../i18n/i18n'
import { localizeFourSymbol, localizeMansion } from '../i18n/localizedData'
import { hexToRgb } from '../utils/colorUtils'

interface SkyMansionNavProps {
  selectedId: string
  onSelect: (id: string) => void
  onClose: () => void
}

export function SkyMansionNav({ selectedId, onSelect, onClose }: SkyMansionNavProps) {
  const { locale } = useLocale()

  return (
    <aside
      className="sky-mansion-nav"
      aria-label={locale === 'en' ? 'Twenty-Eight Mansions navigation' : '二十八宿导航'}
    >
      <header>
        <div>
          <small>CELESTIAL ORDER</small>
          <strong>{locale === 'en' ? 'Twenty-Eight Mansions' : '周天二十八宿'}</strong>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={locale === 'en' ? 'Collapse mansion navigation' : '收起二十八宿导航'}
        >
          {locale === 'en' ? 'Collapse ×' : '收起 ×'}
        </button>
      </header>

      <div className="sky-mansion-nav__groups">
        {FOUR_SYMBOLS.map((symbol) => {
          const displaySymbol = localizeFourSymbol(symbol, locale)

          // 将十六进制颜色转换为 RGB 用于 CSS 变量
          const accentRgb = hexToRgb(symbol.accent)

          return (
            <section
              key={symbol.id}
              style={{
                '--symbol-accent': symbol.accent,
                '--symbol-accent-rgb': accentRgb,
              } as React.CSSProperties}
            >
              <div>
                <small>{displaySymbol.direction} · {displaySymbol.season}</small>
                <strong>{displaySymbol.shortName}</strong>
              </div>

              <ol>
                {mansionsForSymbol(symbol.id).map((mansion) => {
                  const displayMansion = localizeMansion(mansion, locale)
                  const isActive = mansion.id === selectedId

                  return (
                    <li key={mansion.id}>
                      <button
                        className={isActive ? 'is-active' : ''}
                        type="button"
                        aria-current={isActive ? 'true' : undefined}
                        aria-label={`${displayMansion.name}宿，${displayMansion.fullName}`}
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
