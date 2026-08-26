export interface LabelTextureInput {
  title: string
  subtitle: string
  compact: boolean
}

export interface LabelTextMeasurement {
  width: number
  actualBoundingBoxLeft?: number
  actualBoundingBoxRight?: number
  actualBoundingBoxAscent?: number
  actualBoundingBoxDescent?: number
}

export interface LabelTextureLayout {
  width: number
  height: number
  aspectRatio: number
  paddingX: number
  paddingY: number
  titleFont: string
  subtitleFont: string
  titleBaseline: number
  subtitleBaseline?: number
}

export type LabelTextMeasurer = (text: string, font: string) => LabelTextMeasurement

const TITLE_FONT_COMPACT = '500 52px "Songti SC", "STSong", serif'
const TITLE_FONT_REGULAR = '500 58px "Songti SC", "STSong", serif'
const SUBTITLE_FONT_COMPACT = '500 15px ui-sans-serif, system-ui'
const SUBTITLE_FONT_REGULAR = '500 18px ui-sans-serif, system-ui'
const layoutCache = new Map<string, LabelTextureLayout>()

function measuredWidth(metrics: LabelTextMeasurement) {
  const bearingWidth = Math.max(0, metrics.actualBoundingBoxLeft ?? 0)
    + Math.max(0, metrics.actualBoundingBoxRight ?? 0)
  return Math.max(metrics.width, bearingWidth)
}

function measuredHeight(metrics: LabelTextMeasurement, fallback: number) {
  return Math.max(
    fallback,
    Math.max(0, metrics.actualBoundingBoxAscent ?? 0)
      + Math.max(0, metrics.actualBoundingBoxDescent ?? 0),
  )
}

export function labelLayoutCacheKey(input: LabelTextureInput) {
  const titleFont = input.compact ? TITLE_FONT_COMPACT : TITLE_FONT_REGULAR
  const subtitleFont = input.compact ? SUBTITLE_FONT_COMPACT : SUBTITLE_FONT_REGULAR
  return JSON.stringify([input.title, input.subtitle, input.compact, titleFont, subtitleFont])
}

export function calculateLabelTextureLayout(
  input: LabelTextureInput,
  measureText: LabelTextMeasurer,
): LabelTextureLayout {
  const titleFont = input.compact ? TITLE_FONT_COMPACT : TITLE_FONT_REGULAR
  const subtitleFont = input.compact ? SUBTITLE_FONT_COMPACT : SUBTITLE_FONT_REGULAR
  const paddingX = input.compact ? 30 : 34
  const paddingY = input.compact ? 16 : 18
  const titleFallbackHeight = input.compact ? 56 : 62
  const subtitleFallbackHeight = input.compact ? 18 : 22
  const lineGap = input.compact ? 5 : 7
  const titleMetrics = measureText(input.title, titleFont)
  const subtitleMetrics = input.subtitle ? measureText(input.subtitle, subtitleFont) : undefined
  const contentWidth = Math.max(
    measuredWidth(titleMetrics),
    subtitleMetrics ? measuredWidth(subtitleMetrics) : 0,
  )
  const titleHeight = measuredHeight(titleMetrics, titleFallbackHeight)
  const subtitleHeight = subtitleMetrics
    ? measuredHeight(subtitleMetrics, subtitleFallbackHeight)
    : 0
  const naturalHeight = paddingY * 2 + titleHeight
    + (subtitleMetrics ? lineGap + subtitleHeight : 0)
  const minimumHeight = input.compact
    ? input.subtitle ? 124 : 96
    : input.subtitle ? 144 : 112
  const width = Math.ceil(contentWidth + paddingX * 2)
  const height = Math.ceil(Math.max(naturalHeight, minimumHeight))
  const titleAscent = Math.max(
    titleFallbackHeight * 0.78,
    titleMetrics.actualBoundingBoxAscent ?? 0,
  )
  const titleBaseline = input.subtitle
    ? paddingY + titleAscent
    : height / 2 + titleAscent / 2 - Math.max(0, titleMetrics.actualBoundingBoxDescent ?? 0) / 2
  const subtitleBaseline = subtitleMetrics
    ? titleBaseline
      + Math.max(titleFallbackHeight * 0.22, titleMetrics.actualBoundingBoxDescent ?? 0)
      + lineGap
      + Math.max(subtitleFallbackHeight * 0.78, subtitleMetrics.actualBoundingBoxAscent ?? 0)
    : undefined

  return {
    width,
    height,
    aspectRatio: width / height,
    paddingX,
    paddingY,
    titleFont,
    subtitleFont,
    titleBaseline,
    subtitleBaseline,
  }
}

export function getCachedLabelTextureLayout(
  input: LabelTextureInput,
  measureText: LabelTextMeasurer,
) {
  const key = labelLayoutCacheKey(input)
  const cached = layoutCache.get(key)
  if (cached) return cached
  const layout = calculateLabelTextureLayout(input, measureText)
  layoutCache.set(key, layout)
  return layout
}

export function clearLabelLayoutCache() {
  layoutCache.clear()
}

export function labelFitsViewport(
  center: { x: number; y: number },
  halfSize: { width: number; height: number },
  bounds: { left: number; right: number; top: number; bottom: number },
) {
  return center.x - halfSize.width >= bounds.left
    && center.x + halfSize.width <= bounds.right
    && center.y - halfSize.height >= bounds.top
    && center.y + halfSize.height <= bounds.bottom
}
