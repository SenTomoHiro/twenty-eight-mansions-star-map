// Only explicitly approved, independently redrawn deity artworks may live here.
// Reference material and generated study candidates are intentionally outside
// this import boundary, so a missing artwork can never fall back to them.
const deityArtworkModules = import.meta.glob('./assets/xingxiu/artworks/*.{webp,png}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const visualModules = import.meta.glob('./assets/visual-layers/**/*.{webp,png,jpg,jpeg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

function findAsset(modules: Record<string, string>, ending: string) {
  const entry = Object.entries(modules).find(([path]) => path.endsWith(ending))
  return entry?.[1]
}

export function deityArtwork(assetStem: string) {
  return findAsset(deityArtworkModules, `/${assetStem}.webp`)
    ?? findAsset(deityArtworkModules, `/${assetStem}.png`)
}

export function mobileDeityArtwork(assetStem: string) {
  return findAsset(deityArtworkModules, `/${assetStem}.mobile.webp`)
}

export function visualAsset(relativePath: string) {
  return findAsset(visualModules, `/${relativePath}`)
}
