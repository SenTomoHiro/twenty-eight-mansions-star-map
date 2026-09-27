import { describe, expect, it } from 'vitest'
import { appRouteUrl, pageFromLocation } from './routing'

describe('GitHub Pages routing', () => {
  const base = '/twenty-eight-mansions-star-map/'

  it('keeps every internal route under the configured Vite base', () => {
    expect(appRouteUrl('sky', base)).toBe(base)
    expect(appRouteUrl('provenance', base)).toBe(`${base}#/provenance`)
  })

  it('restores the provenance page after a static-host refresh', () => {
    expect(pageFromLocation(base, '#/provenance', base)).toBe('provenance')
    expect(pageFromLocation(`${base}provenance`, '', base)).toBe('provenance')
    expect(pageFromLocation(base, '', base)).toBe('sky')
  })
})
