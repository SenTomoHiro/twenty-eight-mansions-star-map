import { describe, expect, it } from 'vitest'
import { YANGCHENG_REFERENCE, currentObserver } from '../../config/observation'
import {
  initialObserverSessionState,
  observerSessionReducer,
  observerStatusMessage,
} from './observerSession'

const current = currentObserver(31.2304, 121.4737, 'Asia/Shanghai')

describe('observer session state', () => {
  it('starts explicitly in Yangcheng mode', () => {
    expect(initialObserverSessionState()).toMatchObject({
      mode: 'yangcheng',
      observer: YANGCHENG_REFERENCE,
      status: 'idle',
    })
  })

  it('automatically activates a successful current location and synchronizes the HUD state', () => {
    const state = observerSessionReducer(initialObserverSessionState(), {
      type: 'geolocation-result',
      result: { status: 'success', observer: current },
      activate: true,
    })
    expect(state).toMatchObject({
      mode: 'current-location',
      observer: current,
      cachedCurrentObserver: current,
      status: 'success',
    })
    expect(observerStatusMessage(state)).toContain('当前浏览器会话')
  })

  it('switches to Yangcheng without discarding the cached session location', () => {
    const located = observerSessionReducer(initialObserverSessionState(), {
      type: 'geolocation-result',
      result: { status: 'success', observer: current },
      activate: true,
    })
    const yangcheng = observerSessionReducer(located, { type: 'select-yangcheng' })
    expect(yangcheng.mode).toBe('yangcheng')
    expect(yangcheng.observer).toBe(YANGCHENG_REFERENCE)
    expect(yangcheng.cachedCurrentObserver).toBe(current)
  })

  it('reuses a cached current location without another request', () => {
    const state = observerSessionReducer(
      {
        ...initialObserverSessionState(),
        cachedCurrentObserver: current,
      },
      { type: 'request-current' },
    )
    expect(state).toMatchObject({ mode: 'current-location', observer: current, status: 'success' })
  })

  it('requests geolocation when no session location exists', () => {
    expect(observerSessionReducer(initialObserverSessionState(), { type: 'request-current' }).status)
      .toBe('requesting')
  })

  it.each(['denied', 'timeout', 'unavailable'] as const)(
    'keeps the active valid observer when geolocation is %s',
    (status) => {
      const active = {
        ...initialObserverSessionState(),
        mode: 'current-location' as const,
        observer: current,
        cachedCurrentObserver: current,
      }
      const failed = observerSessionReducer(active, {
        type: 'geolocation-result',
        result: { status },
        activate: true,
      })
      expect(failed.observer).toBe(current)
      expect(failed.cachedCurrentObserver).toBe(current)
      expect(failed.mode).toBe('current-location')
    },
  )

  it('caches a late automatic result without overriding an explicit Yangcheng choice', () => {
    const state = observerSessionReducer(initialObserverSessionState(), {
      type: 'geolocation-result',
      result: { status: 'success', observer: current },
      activate: false,
    })
    expect(state.mode).toBe('yangcheng')
    expect(state.observer).toBe(YANGCHENG_REFERENCE)
    expect(state.cachedCurrentObserver).toBe(current)
  })

  it('keeps location state independent of panorama projection state', () => {
    const state = observerSessionReducer(initialObserverSessionState(), {
      type: 'geolocation-result',
      result: { status: 'success', observer: current },
      activate: true,
    })
    const panoramaSession = { viewMode: 'panorama', observerSession: state }
    const restored = { ...panoramaSession, viewMode: 'observation' }
    expect(restored.observerSession).toBe(state)
    expect(restored.observerSession.mode).toBe('current-location')
  })

  it('does not alter camera, FOV, time, or selected mansion when switching location', () => {
    const skyState = {
      camera: { azimuth: 217, altitude: -18, fov: 31 },
      date: '2026-08-24',
      time: '21:00',
      selectedMansion: 'wei',
    }
    const located = observerSessionReducer(initialObserverSessionState(), {
      type: 'geolocation-result',
      result: { status: 'success', observer: current },
      activate: true,
    })
    const switched = { ...skyState, observerSession: located }
    expect(switched.camera).toBe(skyState.camera)
    expect(switched).toMatchObject({
      date: skyState.date,
      time: skyState.time,
      selectedMansion: skyState.selectedMansion,
    })
  })
})
