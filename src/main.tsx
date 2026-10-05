import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { LocaleProvider } from './i18n/i18n'
import './styles/global.css'
import './styles/ui-enhancements.css'
import './styles/sky-mansion-nav-enhanced.css'
import './styles/control-panels-enhanced.css'
import './styles/performance-degradation.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider><App /></LocaleProvider>
  </StrictMode>,
)
