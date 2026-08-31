export const HIGH_RES_DEITY_ARTWORK_TIMEOUT_MS = 4_500

export type DeityArtworkSource = 'high' | 'mobile'

export interface ArtworkNetworkInformation {
  effectiveType?: string
  saveData?: boolean
}

export interface ArtworkLoadingEnvironment {
  connection?: ArtworkNetworkInformation
  mobile: boolean
}

/** Maps the official high-resolution asset stem to its generated mobile derivative. */
export function mobileArtworkStem(assetStem: string) {
  return `${assetStem}.mobile`
}

/** Use browser-provided low-bandwidth signals only when the device is mobile. */
export function shouldUseMobileArtwork({ mobile, connection }: ArtworkLoadingEnvironment) {
  if (!mobile) return false
  return connection?.saveData === true
    || connection?.effectiveType === 'slow-2g'
    || connection?.effectiveType === '2g'
    || connection?.effectiveType === '3g'
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
  userAgentData?: { mobile?: boolean }
}

function isMobileBrowser() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  const browserNavigator = navigator as BrowserNavigator
  if (browserNavigator.userAgentData?.mobile === true) return true
  if (/Android|iPhone|iPod|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent)) return true
  return navigator.maxTouchPoints > 0 && window.innerWidth <= 767
}

export function shouldUseMobileArtworkInBrowser() {
  if (typeof navigator === 'undefined') return false
  const browserNavigator = navigator as BrowserNavigator
  return shouldUseMobileArtwork({
    mobile: isMobileBrowser(),
    connection: browserNavigator.connection ?? browserNavigator.mozConnection ?? browserNavigator.webkitConnection,
  })
}
