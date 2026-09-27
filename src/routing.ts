export type AppPage = 'sky' | 'provenance'

function normalizedBase(baseUrl: string) {
  const withLeadingSlash = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

export function appRouteUrl(page: AppPage, baseUrl = import.meta.env.BASE_URL) {
  const base = normalizedBase(baseUrl)
  return page === 'provenance' ? `${base}#/provenance` : base
}

export function pageFromLocation(pathname: string, hash: string, baseUrl = import.meta.env.BASE_URL): AppPage {
  if (hash === '#/provenance') return 'provenance'
  const legacyPath = `${normalizedBase(baseUrl).replace(/\/$/, '')}/provenance`
  return pathname === legacyPath || pathname === '/provenance' ? 'provenance' : 'sky'
}
