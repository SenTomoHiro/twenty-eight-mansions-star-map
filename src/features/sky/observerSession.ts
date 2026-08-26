import { YANGCHENG_REFERENCE, type ObserverLocation } from '../../config/observation'
import type { GeolocationResult } from '../../utils/geolocation'

export type ObserverMode = 'yangcheng' | 'current-location'
export type ObserverLocationStatus = GeolocationResult['status'] | 'idle' | 'requesting'

export interface ObserverSessionState {
  mode: ObserverMode
  observer: ObserverLocation
  cachedCurrentObserver?: ObserverLocation
  status: ObserverLocationStatus
}

export type ObserverSessionAction =
  | { type: 'select-yangcheng' }
  | { type: 'request-current' }
  | { type: 'geolocation-result'; result: GeolocationResult; activate: boolean }

export function initialObserverSessionState(): ObserverSessionState {
  return {
    mode: 'yangcheng',
    observer: YANGCHENG_REFERENCE,
    status: 'idle',
  }
}

export function observerSessionReducer(
  state: ObserverSessionState,
  action: ObserverSessionAction,
): ObserverSessionState {
  if (action.type === 'select-yangcheng') {
    return { ...state, mode: 'yangcheng', observer: YANGCHENG_REFERENCE }
  }
  if (action.type === 'request-current') {
    return state.cachedCurrentObserver
      ? {
          ...state,
          mode: 'current-location',
          observer: state.cachedCurrentObserver,
          status: 'success',
        }
      : { ...state, status: 'requesting' }
  }
  if (action.result.status !== 'success') {
    return { ...state, status: action.result.status }
  }
  return {
    ...state,
    mode: action.activate ? 'current-location' : state.mode,
    observer: action.activate ? action.result.observer : state.observer,
    cachedCurrentObserver: action.result.observer,
    status: 'success',
  }
}

export function observerStatusMessage(state: ObserverSessionState) {
  if (state.status === 'requesting') return '正在获取当前位置；继续使用当前有效观测点。'
  if (state.status === 'denied') return '未获得位置权限，继续使用阳城。'
  if (state.status === 'timeout') return '定位请求超时，继续使用当前有效观测点。'
  if (state.status === 'unavailable') return '当前位置暂不可用，继续使用当前有效观测点。'
  if (state.status === 'unsupported') return '浏览器不支持定位，继续使用阳城。'
  if (state.status === 'failed') return '定位未完成，继续使用当前有效观测点。'
  if (state.mode === 'current-location') return '位置仅保留在当前浏览器会话，不会上传。'
  if (state.cachedCurrentObserver) return '当前位置已在本次会话缓存，可随时切换。'
  return '当前以夏都阳城为文化参考观测点。'
}
