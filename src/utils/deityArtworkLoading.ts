export const HIGH_RES_DEITY_ARTWORK_TIMEOUT_MS = 4_500

export type DeityArtworkSource = 'high' | 'mobile'

export interface ArtworkNetworkInformation {
  effectiveType?: string
  saveData?: boolean
}

export interface ArtworkLoadingEnvironment {
  connection?: ArtworkNetworkInformation
}

/** Maps the official high-resolution asset stem to its generated mobile derivative. */
export function mobileArtworkStem(assetStem: string) {
  return `${assetStem}.mobile`
}

/** Use browser-provided low-bandwidth signals on every device. */
export function shouldUseMobileArtwork({ connection }: ArtworkLoadingEnvironment) {
  return connection?.saveData === true
    || connection?.effectiveType === 'slow-2g'
    || connection?.effectiveType === '2g'
    || connection?.effectiveType === '3g'
}

/** Browsers without Network Information use the one-way load-time fallback. */
export function shouldAttemptArtworkTimeoutFallback(connection: ArtworkNetworkInformation | undefined) {
  return connection === undefined
}

/**
 * Small state machine for the one-way high-resolution to mobile fallback.
 * Keeping it independent from React makes the no-repeat behavior testable.
 */
export function createArtworkLoadController(initialSource: DeityArtworkSource = 'high') {
  let source = initialSource
  let highResolutionLoaded = initialSource === 'mobile'
  let downgraded = initialSource === 'mobile'

  return {
    get source() {
      return source
    },
    get hasDowngraded() {
      return downgraded
    },
    markHighResolutionLoaded() {
      highResolutionLoaded = true
    },
    downgradeAfterTimeout() {
      if (source !== 'high' || highResolutionLoaded || downgraded) return false
      source = 'mobile'
      downgraded = true
      return true
    },
  }
}

interface BrowserNavigator extends Navigator {
  connection?: ArtworkNetworkInformation
  mozConnection?: ArtworkNetworkInformation
  webkitConnection?: ArtworkNetworkInformation
}

function browserNetworkInformation() {
  if (typeof navigator === 'undefined') return undefined
  const browserNavigator = navigator as BrowserNavigator
  return browserNavigator.connection ?? browserNavigator.mozConnection ?? browserNavigator.webkitConnection
}

export function shouldUseMobileArtworkInBrowser() {
  return shouldUseMobileArtwork({
    connection: browserNetworkInformation(),
  })
}

export function shouldAttemptArtworkTimeoutFallbackInBrowser() {
  return shouldAttemptArtworkTimeoutFallback(browserNetworkInformation())
}
