import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import {
  formatCoordinate,
} from './config/observation'
import { FOUR_SYMBOL_BY_ID } from './data/fourSymbols'
import { IMPORTANT_ASTERISM_BY_ID, IMPORTANT_ASTERISMS } from './data/importantAsterisms'
import mansionStarMappingsData from './data/mansion-star-mappings.json'
import { MANSION_BY_ID, MANSIONS } from './data/mansions'
import { ProvenancePage } from './features/provenance/ProvenancePage'
import { CelestialSphere } from './features/sky/CelestialSphere'
import {
  initialObserverSessionState,
  observerSessionReducer,
  observerStatusMessage,
  type ObserverMode,
} from './features/sky/observerSession'
import { PANORAMA_ORIENTATION, SKY_VIEW, type SkyViewMode } from './features/sky/panoramaProjection'
import { TimeControls } from './features/sky/TimeControls'
import { ImportantAsterismNav } from './features/asterisms/ImportantAsterismNav'
import { ImportantAsterismOverlay } from './features/asterisms/ImportantAsterismOverlay'
import { MansionDetailOverlay } from './features/xingxiu/MansionDetailOverlay'
import { SkyMansionNav } from './features/xingxiu/SkyMansionNav'
import type { MansionStarMapping } from './types/xingxiu'
import type { ImportantAsterismId } from './types/importantAsterism'
import { dateInputValue, equatorialToHorizontal, makeObservationDate } from './utils/astronomy'
import { requestCurrentObserver } from './utils/geolocation'

const mappings = mansionStarMappingsData.mappings as MansionStarMapping[]
const mappingById = Object.fromEntries(
  mappings.map((mapping) => [mapping.mansionId, mapping]),
) as Record<string, MansionStarMapping>

function currentPage() {
  return window.location.pathname === '/provenance' ? 'provenance' : 'sky'
}

export function App() {
  const [page, setPage] = useState(currentPage)
  const [date, setDate] = useState(dateInputValue())
  const [time, setTime] = useState('21:00')
  const [selectedId, setSelectedId] = useState(MANSIONS[0]?.id ?? '')
  const [resetToken, setResetToken] = useState(0)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedImportantId, setSelectedImportantId] = useState<ImportantAsterismId | undefined>()
  const [importantDetailOpen, setImportantDetailOpen] = useState(false)
  const [timePanelOpen, setTimePanelOpen] = useState(false)
  const [mansionNavOpen, setMansionNavOpen] = useState(false)
  const [importantNavOpen, setImportantNavOpen] = useState(false)
  const [observerSession, dispatchObserver] = useReducer(
    observerSessionReducer,
    undefined,
    initialObserverSessionState,
  )
  const [viewMode, setViewMode] = useState<SkyViewMode>(SKY_VIEW.observation)
  const [viewTransitioning, setViewTransitioning] = useState(false)
  const [panoramaResetToken, setPanoramaResetToken] = useState(0)
  const detailTimerRef = useRef<number | undefined>(undefined)
  const manualObserverChoiceRef = useRef<ObserverMode | null>(null)
  const observer = observerSession.observer

  const selectedMansion = MANSION_BY_ID[selectedId] ?? MANSIONS[0]
  if (!selectedMansion) throw new Error('Mansion data is unavailable')
  const selectedMapping = mappingById[selectedMansion.id]
  if (!selectedMapping) throw new Error(`Missing star mapping for ${selectedMansion.id}`)
  const selectedSymbol = FOUR_SYMBOL_BY_ID[selectedMansion.symbolId]
  const selectedImportantAsterism = selectedImportantId
    ? IMPORTANT_ASTERISM_BY_ID[selectedImportantId]
    : undefined

  const horizontal = useMemo(() => {
    const defining = selectedMapping.stars.find((star) => star.hip === selectedMapping.definingStarHip)
    return equatorialToHorizontal(
      defining ?? selectedMansion.anchor,
      makeObservationDate(date, time, observer.timezone),
      observer.latitude,
      observer.longitude,
    )
  }, [date, observer, selectedMansion.anchor, selectedMapping, time])

  useEffect(() => {
    let active = true
    dispatchObserver({ type: 'request-current' })
    void requestCurrentObserver().then((result) => {
      if (!active) return
      dispatchObserver({
        type: 'geolocation-result',
        result,
        activate: manualObserverChoiceRef.current !== 'yangcheng',
      })
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const handlePopState = () => setPage(currentPage())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('is-sky-home', page === 'sky')
    return () => document.body.classList.remove('is-sky-home')
  }, [page])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (importantDetailOpen) {
        window.clearTimeout(detailTimerRef.current)
        detailTimerRef.current = undefined
        setImportantDetailOpen(false)
      }
      else if (detailOpen) {
        window.clearTimeout(detailTimerRef.current)
        detailTimerRef.current = undefined
        setDetailOpen(false)
      }
      else if (importantNavOpen) setImportantNavOpen(false)
      else if (mansionNavOpen) setMansionNavOpen(false)
      else if (timePanelOpen) setTimePanelOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [detailOpen, importantDetailOpen, importantNavOpen, mansionNavOpen, timePanelOpen])

  useEffect(() => () => window.clearTimeout(detailTimerRef.current), [])

  const navigate = (path: '/' | '/provenance') => {
    window.clearTimeout(detailTimerRef.current)
    if (window.location.pathname !== path) window.history.pushState({}, '', path)
    setPage(path === '/provenance' ? 'provenance' : 'sky')
    setDetailOpen(false)
    setImportantDetailOpen(false)
    setTimePanelOpen(false)
    setMansionNavOpen(false)
    setImportantNavOpen(false)
  }

  const selectAndOpen = (id: string) => {
    window.clearTimeout(detailTimerRef.current)
    setSelectedId(id)
    setSelectedImportantId(undefined)
    setImportantDetailOpen(false)
    setMansionNavOpen(false)
    setImportantNavOpen(false)
    detailTimerRef.current = window.setTimeout(() => {
      detailTimerRef.current = undefined
      setDetailOpen(true)
    }, 560)
  }

  const selectImportantAndOpen = (id: ImportantAsterismId) => {
    window.clearTimeout(detailTimerRef.current)
    setSelectedImportantId(id)
    setDetailOpen(false)
    setMansionNavOpen(false)
    setImportantNavOpen(false)
    detailTimerRef.current = window.setTimeout(() => {
      detailTimerRef.current = undefined
      setImportantDetailOpen(true)
    }, 560)
  }

  const closeDetail = () => {
    window.clearTimeout(detailTimerRef.current)
    detailTimerRef.current = undefined
    setDetailOpen(false)
  }

  const closeImportantDetail = () => {
    window.clearTimeout(detailTimerRef.current)
    detailTimerRef.current = undefined
    setImportantDetailOpen(false)
  }

  const toggleView = () => {
    if (viewTransitioning) return
    setViewTransitioning(true)
    setTimePanelOpen(false)
    setMansionNavOpen(false)
    setImportantNavOpen(false)
    setViewMode((current) => current === SKY_VIEW.observation ? SKY_VIEW.panorama : SKY_VIEW.observation)
  }

  const restoreYangcheng = () => {
    manualObserverChoiceRef.current = 'yangcheng'
    dispatchObserver({ type: 'select-yangcheng' })
  }

  const useCurrentLocation = () => {
    manualObserverChoiceRef.current = 'current-location'
    if (observerSession.cachedCurrentObserver) {
      dispatchObserver({ type: 'request-current' })
      return
    }
    dispatchObserver({ type: 'request-current' })
    void requestCurrentObserver().then((result) => {
      dispatchObserver({
        type: 'geolocation-result',
        result,
        activate: manualObserverChoiceRef.current === 'current-location',
      })
    })
  }

  const coordinateText = `${formatCoordinate(observer.latitude, 'N', 'S', 4)} · ${formatCoordinate(observer.longitude, 'E', 'W', 4)}`
  const observerTitle = observerSession.mode === 'yangcheng'
    ? '夏都阳城 · 河南登封'
    : '当前位置'

  return (
    <div className={`site-shell site-shell--${page}`}>
      <a className="skip-link" href="#main-content">跳至主要内容</a>
      <header className="site-header site-header--hud">
        <a
          className="site-mark"
          href="/"
          aria-label="返回二十八宿星空"
          onClick={(event) => { event.preventDefault(); navigate('/') }}
        >
          <span>宿</span>
          <div><strong>廿八宿</strong><small>CELESTIAL MANSIONS</small></div>
        </a>
        <nav aria-label="主导航">
          <a
            className={page === 'sky' && !detailOpen ? 'is-active' : ''}
            href="/"
            onClick={(event) => { event.preventDefault(); navigate('/') }}
          >观星</a>
          <button
            className={detailOpen ? 'is-active' : ''}
            type="button"
            onClick={() => { if (page !== 'sky') navigate('/'); setSelectedImportantId(undefined); setImportantDetailOpen(false); setDetailOpen(true) }}
          >见神</button>
          <a
            className={page === 'provenance' ? 'is-active' : ''}
            href="/provenance"
            onClick={(event) => { event.preventDefault(); navigate('/provenance') }}
          >溯源</a>
        </nav>
        <div className="header-observation">
          <span>{page === 'sky'
            ? viewMode === SKY_VIEW.panorama ? '固定全景 · 不取地点与时刻' : `${date.replaceAll('-', '.')} · ${time}`
            : 'PROVENANCE'}</span>
          <small>{page === 'sky'
            ? viewMode === SKY_VIEW.panorama ? '完整中国传统星空' : observer.name
            : '天文 · 文化 · 文物'}</small>
        </div>
      </header>

      {page === 'provenance' ? (
        <ProvenancePage />
      ) : (
        <main className={`sky-home sky-home--${viewMode}${detailOpen || importantDetailOpen ? ' has-detail' : ''}${viewTransitioning ? ' is-view-transitioning' : ''}`} id="main-content" aria-label="全屏三维星空">
          <div className="sky-home__scene">
            <CelestialSphere
              date={date}
              time={time}
              latitude={observer.latitude}
              longitude={observer.longitude}
              timezone={observer.timezone}
              observerLabel={observer.name}
              mode={viewMode}
              selectedMansion={selectedMansion}
              selectedImportantAsterism={selectedImportantAsterism}
              onSelectMansion={selectAndOpen}
              onSelectImportantAsterism={selectImportantAndOpen}
              onTransitionChange={setViewTransitioning}
              resetToken={resetToken}
              panoramaResetToken={panoramaResetToken}
            />
          </div>

          <div className="sky-home__status" aria-live="polite">
            <small>{selectedImportantAsterism
              ? `重要星官 · 0${selectedImportantAsterism.order} / 03`
              : `${String(selectedMansion.order).padStart(2, '0')} / 28 · ${selectedSymbol.name}${viewMode === SKY_VIEW.observation ? ` · ${observer.shortName}` : ''}`}</small>
            <button type="button" onClick={() => selectedImportantAsterism ? setImportantDetailOpen(true) : setDetailOpen(true)}>
              <strong>{selectedImportantAsterism?.name ?? selectedMansion.name}</strong>
              <span>{selectedImportantAsterism
                ? `${selectedImportantAsterism.members.length} 位 · ${selectedImportantAsterism.traditionalRegion}`
                : `${selectedMansion.fullName} · HIP ${selectedMapping.definingStarHip}`}</span>
            </button>
            <p>{selectedImportantAsterism
              ? selectedImportantAsterism.modernMappingNotes
              : viewMode === SKY_VIEW.panorama
              ? '固定全天投影 · 不代表某地某时的瞬时天空'
              : `ALT ${horizontal.altitude.toFixed(1)}° · AZ ${horizontal.azimuth.toFixed(1)}° · ${horizontal.altitude >= 0 ? '地平线上' : '地平线下'}`}</p>
          </div>

          {viewMode === SKY_VIEW.observation ? <div className="sky-home__tools" aria-label="星空控制">
            <button
              type="button"
              className={timePanelOpen ? 'is-active' : ''}
              onClick={() => { setTimePanelOpen((value) => !value); setMansionNavOpen(false); setImportantNavOpen(false) }}
            ><span>日期时刻</span><small>{time}</small></button>
            <button
              type="button"
              className={mansionNavOpen ? 'is-active' : ''}
              onClick={() => { setMansionNavOpen((value) => !value); setTimePanelOpen(false); setImportantNavOpen(false) }}
            ><span>周天列宿</span><small>28</small></button>
            <button
              type="button"
              className={importantNavOpen ? 'is-active' : ''}
              onClick={() => { setImportantNavOpen((value) => !value); setTimePanelOpen(false); setMansionNavOpen(false) }}
            ><span>重要星官</span><small>{IMPORTANT_ASTERISMS.length}</small></button>
            <button type="button" onClick={() => setResetToken((value) => value + 1)}>
              <span>重置视角</span><small>◎</small>
            </button>
          </div> : null}

          {viewMode === SKY_VIEW.observation ? (
            <section className="sky-observer-control" aria-label="观测点状态">
              <header>
                <span>观测点</span>
                <div role="group" aria-label="切换观测点">
                  <button
                    type="button"
                    className={observerSession.mode === 'yangcheng' ? 'is-active' : ''}
                    aria-pressed={observerSession.mode === 'yangcheng'}
                    onClick={restoreYangcheng}
                  >阳城</button>
                  <i aria-hidden="true" />
                  <button
                    type="button"
                    className={observerSession.mode === 'current-location' ? 'is-active' : ''}
                    aria-pressed={observerSession.mode === 'current-location'}
                    disabled={observerSession.status === 'requesting' && !observerSession.cachedCurrentObserver}
                    onClick={useCurrentLocation}
                  >当前位置</button>
                </div>
              </header>
              <p><strong>{observerTitle}</strong><span>{coordinateText}</span></p>
              <small aria-live="polite">{observerStatusMessage(observerSession)}</small>
            </section>
          ) : null}

          <button
            type="button"
            className="sky-view-toggle"
            disabled={viewTransitioning}
            aria-label={viewMode === SKY_VIEW.observation ? '拉远至完整全景星图' : '返回原地理观测视角'}
            onClick={toggleView}
          >
            <i aria-hidden="true" />
            <span>{viewMode === SKY_VIEW.observation ? '全景' : '返回观测'}</span>
          </button>

          {viewMode === SKY_VIEW.panorama ? (
            <button
              type="button"
              className="sky-panorama-reset"
              disabled={viewTransitioning}
              onClick={() => setPanoramaResetToken((value) => value + 1)}
            >恢复全景</button>
          ) : null}

          {viewMode === SKY_VIEW.panorama ? (
            <div className="panorama-directions" aria-label="全景固定方位">
              <span className="is-top">{PANORAMA_ORIENTATION.top}</span>
              <span className="is-bottom">{PANORAMA_ORIENTATION.bottom}</span>
              <span className="is-left">{PANORAMA_ORIENTATION.left}</span>
              <span className="is-right">{PANORAMA_ORIENTATION.right}</span>
            </div>
          ) : null}

          {timePanelOpen ? (
            <aside className="sky-time-panel" aria-label="日期时刻与季节">
              <header><span>观测时刻</span><button type="button" onClick={() => setTimePanelOpen(false)}>收起 ×</button></header>
              <TimeControls date={date} time={time} timezone={observer.timezone} onDateChange={setDate} onTimeChange={setTime} />
            </aside>
          ) : null}

          {mansionNavOpen ? (
            <SkyMansionNav selectedId={selectedMansion.id} onSelect={selectAndOpen} onClose={() => setMansionNavOpen(false)} />
          ) : null}

          {importantNavOpen ? (
            <ImportantAsterismNav selectedId={selectedImportantId} onSelect={selectImportantAndOpen} onClose={() => setImportantNavOpen(false)} />
          ) : null}

          {detailOpen ? (
            <MansionDetailOverlay
              mansion={selectedMansion}
              mapping={selectedMapping}
              onClose={closeDetail}
              onSelect={setSelectedId}
            />
          ) : null}

          {importantDetailOpen && selectedImportantAsterism ? (
            <ImportantAsterismOverlay asterism={selectedImportantAsterism} onClose={closeImportantDetail} />
          ) : null}
        </main>
      )}
    </div>
  )
}
