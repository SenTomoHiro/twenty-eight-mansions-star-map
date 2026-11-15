import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { formatCoordinate } from './config/observation'
import { AtlasIcon } from './components/AtlasIcon'
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
import { LocaleSwitch, useLocale } from './i18n/i18n'
import { localizeFourSymbol, localizeImportantAsterism, localizeMansion } from './i18n/localizedData'
import { appRouteUrl, pageFromLocation, type AppPage } from './routing'

const mappings = mansionStarMappingsData.mappings as MansionStarMapping[]
const mappingById = Object.fromEntries(
  mappings.map((mapping) => [mapping.mansionId, mapping]),
) as Record<string, MansionStarMapping>

const baseUrl = import.meta.env.BASE_URL

function currentPage() {
  return pageFromLocation(window.location.pathname, window.location.hash, baseUrl)
}

export function App() {
  const { locale, t } = useLocale()
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
  const displayMansion = localizeMansion(selectedMansion, locale)
  const displaySymbol = localizeFourSymbol(selectedSymbol, locale)
  const displayImportantAsterism = selectedImportantAsterism ? localizeImportantAsterism(selectedImportantAsterism, locale) : undefined

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
    window.addEventListener('hashchange', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('hashchange', handlePopState)
    }
  }, [])

  useEffect(() => {
    document.body.classList.toggle('is-sky-home', page === 'sky')
    return () => document.body.classList.remove('is-sky-home')
  }, [page])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      window.clearTimeout(detailTimerRef.current)
      detailTimerRef.current = undefined
      if (importantDetailOpen) {
        setImportantDetailOpen(false)
      }
      else if (detailOpen) {
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

  const navigate = (nextPage: AppPage) => {
    window.clearTimeout(detailTimerRef.current)
    const url = appRouteUrl(nextPage, baseUrl)
    if (`${window.location.pathname}${window.location.hash}` !== url) window.history.pushState({}, '', url)
    setPage(nextPage)
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
    window.clearTimeout(detailTimerRef.current)
    detailTimerRef.current = undefined
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
    ? t('yangchengTitle')
    : t('currentLocation')
  const observerName = observerSession.mode === 'yangcheng' ? t('yangchengTitle') : t('currentLocation')
  const directions = locale === 'zh-CN'
    ? PANORAMA_ORIENTATION
    : { top: 'South · Vermilion Bird', bottom: 'North · Black Tortoise', left: 'East · Azure Dragon', right: 'West · White Tiger' }
  const english = locale === 'en'
  const label = {
    time: english ? 'Time' : '时刻',
    mansions: english ? 'Mansions' : '列宿',
    asterisms: english ? 'Asterisms' : '星官',
    reset: english ? 'Reset' : '重置',
    close: english ? 'Close' : '收起',
    archive: english ? 'Open deity archive' : '打开神像档案',
    archiveNote: english ? 'Reviewed artwork · asterism · sources' : '正式神像 · 星官 · 古籍依据',
    asterismArchive: english ? 'Open asterism dossier' : '打开星官档案',
    asterismArchiveNote: english ? 'Member structure · astronomy · sources' : '成员结构 · 天文 · 资料依据',
    definingStar: english ? 'Defining star' : '距星',
    members: english ? 'Members' : '成员',
    region: english ? 'Region' : '所属',
    index: english ? 'Index' : '编号',
    projection: english ? 'Projection' : '投影',
  }
  const nowInPanorama = viewMode === SKY_VIEW.panorama

  return (
    <div className={`site-shell site-shell--${page}`}>
      <a className='skip-link' href='#main-content'>{t('skip')}</a>

      <header className='site-header site-header--hud atlas-header'>
        <a
          className='site-mark'
          href={appRouteUrl('sky', baseUrl)}
          aria-label={t('homeLabel')}
          onClick={(event) => { event.preventDefault(); navigate('sky') }}
        >
          <span className='site-mark__seal' aria-hidden='true'>宿</span>
          <span className='site-mark__type'>
            <strong>{t('brand')}</strong>
            <small>CELESTIAL MANSIONS · 二十八宿</small>
          </span>
        </a>
        <nav className='atlas-nav' aria-label={t('navLabel')}>
          <a
            className={page === 'sky' && !detailOpen ? 'is-active' : ''}
            href={appRouteUrl('sky', baseUrl)}
            aria-current={page === 'sky' ? 'page' : undefined}
            onClick={(event) => { event.preventDefault(); navigate('sky') }}
          >{t('sky')}</a>
          <a
            className={page === 'provenance' ? 'is-active' : ''}
            href={appRouteUrl('provenance', baseUrl)}
            aria-current={page === 'provenance' ? 'page' : undefined}
            onClick={(event) => { event.preventDefault(); navigate('provenance') }}
          >{t('provenance')}</a>
        </nav>
        <div className='atlas-header__meta'>
          <span>{page === 'sky'
            ? nowInPanorama ? t('panoramaStatic') : `${date.replaceAll('-', '.')} · ${time}`
            : 'PROVENANCE'}</span>
          <small>{page === 'sky'
            ? nowInPanorama ? t('traditionalSky') : observerName
            : t('provenanceKinds')}</small>
        </div>
        <LocaleSwitch />
      </header>

      {page === 'provenance' ? (
        <ProvenancePage />
      ) : (
        <main
          className={`sky-home sky-home--${viewMode}${detailOpen || importantDetailOpen ? ' has-detail' : ''}${viewTransitioning ? ' is-view-transitioning' : ''}`}
          id='main-content'
          aria-label={t('mainSkyLabel')}
        >
          <div className='sky-home__scene'>
            <CelestialSphere
              date={date}
              time={time}
              latitude={observer.latitude}
              longitude={observer.longitude}
              timezone={observer.timezone}
              observerLabel={observerName}
              key={locale}
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
          <div className='sky-home__gradient' aria-hidden='true' />

          <div className='sky-home__status atlas-selection'>
            <div className='atlas-card' style={{ '--symbol-accent': selectedSymbol.accent } as React.CSSProperties}>
              <div className='atlas-card__top'>
                <p className='atlas-card__eyebrow'>
                  <AtlasIcon name='compass' />
                  <span>{selectedImportantAsterism
                    ? `${t('importantAsterism')} · 0${selectedImportantAsterism.order} / 03`
                    : `${String(selectedMansion.order).padStart(2, '0')} / 28 · ${displaySymbol.name}`}</span>
                </p>
                <button
                  type='button'
                  className='sky-view-toggle'
                  disabled={viewTransitioning}
                  aria-label={nowInPanorama ? t('returnObservationLabel') : t('panoramaOut')}
                  onClick={toggleView}
                >
                  <AtlasIcon name={nowInPanorama ? 'compress' : 'expand'} />
                  <span>{nowInPanorama ? t('returnObservation') : t('panorama')}</span>
                </button>
              </div>

              <p className='atlas-card__title' aria-live='polite'>
                {displayImportantAsterism?.name ?? displayMansion.name}
              </p>
              <p className='atlas-card__sub'>
                {selectedImportantAsterism
                  ? (displayImportantAsterism?.aliases.join(' · ') ?? '')
                  : displayMansion.fullName}
              </p>

              <dl className='atlas-card__facts'>
                {selectedImportantAsterism ? (
                  <>
                    <div>
                      <dt>{label.members}</dt>
                      <dd>{selectedImportantAsterism.members.length}{english ? '' : ' 位'}</dd>
                    </div>
                    <div>
                      <dt>{label.region}</dt>
                      <dd>{displayImportantAsterism?.traditionalRegion}</dd>
                    </div>
                    <div>
                      <dt>{label.index}</dt>
                      <dd>0{selectedImportantAsterism.order}</dd>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <dt>{label.definingStar}</dt>
                      <dd>HIP {selectedMapping.definingStarHip}</dd>
                    </div>
                    {nowInPanorama ? (
                      <div className='is-wide'>
                        <dt>{label.projection}</dt>
                        <dd>{t('traditionalSky')}</dd>
                      </div>
                    ) : (
                      <>
                        <div>
                          <dt>ALT</dt>
                          <dd>{horizontal.altitude.toFixed(1)}°</dd>
                        </div>
                        <div>
                          <dt>AZ</dt>
                          <dd>{horizontal.azimuth.toFixed(1)}°</dd>
                        </div>
                      </>
                    )}
                  </>
                )}
              </dl>

              <p className='atlas-card__note'>
                <AtlasIcon name={nowInPanorama ? 'compass' : 'location'} />
                <span>{nowInPanorama
                  ? t('fixedProjection')
                  : selectedImportantAsterism
                    ? observerName
                    : `${horizontal.altitude >= 0 ? t('aboveHorizon') : t('belowHorizon')} · ${observerName}`}</span>
              </p>

              <button
                type='button'
                className='atlas-card__open'
                onClick={() => selectedImportantAsterism ? setImportantDetailOpen(true) : setDetailOpen(true)}
              >
                <span>
                  <strong>{selectedImportantAsterism ? label.asterismArchive : label.archive}</strong>
                  <small>{selectedImportantAsterism ? label.asterismArchiveNote : label.archiveNote}</small>
                </span>
                <AtlasIcon name='arrow' />
              </button>
            </div>
          </div>

          <div className='sky-home__rail'>
            <div className='sky-home__tools' role='group' aria-label={t('skyControls')}>
              {nowInPanorama ? null : (
                <button
                  type='button'
                  className={`atlas-tool${timePanelOpen ? ' is-active' : ''}`}
                  aria-expanded={timePanelOpen}
                  aria-controls='sky-time-panel'
                  aria-label={t('dateTime')}
                  title={t('dateTime')}
                  onClick={() => { setTimePanelOpen((value) => !value); setMansionNavOpen(false); setImportantNavOpen(false) }}
                >
                  <AtlasIcon name='clock' />
                  <span className='atlas-tool__label'>{label.time}</span>
                  <small>{time}</small>
                </button>
              )}
              <button
                type='button'
                className={`atlas-tool${mansionNavOpen ? ' is-active' : ''}`}
                aria-expanded={mansionNavOpen}
                aria-controls='sky-mansion-nav'
                aria-label={t('mansionsNav')}
                title={t('mansionsNav')}
                onClick={() => { setMansionNavOpen((value) => !value); setTimePanelOpen(false); setImportantNavOpen(false) }}
              >
                <AtlasIcon name='mansions' />
                <span className='atlas-tool__label'>{label.mansions}</span>
                <small>28</small>
              </button>
              <button
                type='button'
                className={`atlas-tool${importantNavOpen ? ' is-active' : ''}`}
                aria-expanded={importantNavOpen}
                aria-controls='sky-important-nav'
                aria-label={t('importantAsterism')}
                title={t('importantAsterism')}
                onClick={() => { setImportantNavOpen((value) => !value); setTimePanelOpen(false); setMansionNavOpen(false) }}
              >
                <AtlasIcon name='asterism' />
                <span className='atlas-tool__label'>{label.asterisms}</span>
                <small>{IMPORTANT_ASTERISMS.length}</small>
              </button>
              <button
                type='button'
                className='atlas-tool'
                disabled={viewTransitioning}
                title={nowInPanorama ? t('resetPanorama') : t('resetView')}
                aria-label={nowInPanorama ? t('resetPanorama') : t('resetView')}
                onClick={() => {
                  if (nowInPanorama) setPanoramaResetToken((value) => value + 1)
                  else setResetToken((value) => value + 1)
                }}
              >
                <AtlasIcon name='reset' />
                <span className='atlas-tool__label'>{label.reset}</span>
              </button>
            </div>

            {nowInPanorama ? null : (
              <section className='sky-observer-control' aria-label={t('observationStatus')}>
                <header>
                  <span className='sky-observer-control__label'>
                    <AtlasIcon name='location' />
                    {t('observationPoint')}
                  </span>
                  <div role='group' aria-label={t('switchObservationPoint')}>
                    <button
                      type='button'
                      className={observerSession.mode === 'yangcheng' ? 'is-active' : ''}
                      aria-pressed={observerSession.mode === 'yangcheng'}
                      onClick={restoreYangcheng}
                    >{t('yangcheng')}</button>
                    <i aria-hidden='true' />
                    <button
                      type='button'
                      className={observerSession.mode === 'current-location' ? 'is-active' : ''}
                      aria-pressed={observerSession.mode === 'current-location'}
                      disabled={observerSession.status === 'requesting' && !observerSession.cachedCurrentObserver}
                      onClick={useCurrentLocation}
                    >{t('currentLocation')}</button>
                  </div>
                </header>
                <p><strong>{observerTitle}</strong><span>{coordinateText}</span></p>
                <small aria-live='polite'>{observerStatusMessage(observerSession, locale)}</small>
              </section>
            )}
          </div>

          {nowInPanorama ? (
            <div className='panorama-directions' aria-label={t('panoramaDirections')}>
              <span className='is-top'>{directions.top}</span>
              <span className='is-bottom'>{directions.bottom}</span>
              <span className='is-left'>{directions.left}</span>
              <span className='is-right'>{directions.right}</span>
            </div>
          ) : null}

          {timePanelOpen ? (
            <aside className='sky-time-panel' id='sky-time-panel' aria-label={t('dateTimeSeason')}>
              <header>
                <span><AtlasIcon name='clock' />{t('observationTime')}</span>
                <button type='button' className='atlas-panel-close' onClick={() => setTimePanelOpen(false)} aria-label={t('collapse')}>
                  <AtlasIcon name='close' />
                  <span>{label.close}</span>
                </button>
              </header>
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
