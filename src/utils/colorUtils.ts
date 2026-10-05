/**
 * 颜色工具函数
 * Color Utility Functions
 */

/**
 * 将十六进制颜色转换为 RGB 字符串
 * @param hex - 十六进制颜色值 (如 "#a8845e")
 * @returns RGB 字符串 (如 "168, 132, 94")
 */
export function hexToRgb(hex: string): string {
  // 移除 # 号
  const cleanHex = hex.replace('#', '')

  // 解析 RGB 值
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex)

  if (!result) {
    console.warn(`Invalid hex color: ${hex}, using default`)
    return '168, 132, 94' // 默认青铜色
  }

  const r = parseInt(result[1]!, 16)
  const g = parseInt(result[2]!, 16)
  const b = parseInt(result[3]!, 16)

  return `${r}, ${g}, ${b}`
}

/**
 * 将 RGB 字符串转换为十六进制颜色
 * @param rgb - RGB 字符串 (如 "168, 132, 94")
 * @returns 十六进制颜色 (如 "#a8845e")
 */
export function rgbToHex(rgb: string): string {
  const parts = rgb.split(',').map(s => parseInt(s.trim(), 10))

  if (parts.length !== 3 || parts.some(isNaN)) {
    console.warn(`Invalid RGB string: ${rgb}`)
    return '#a8845e'
  }

  const [r = 0, g = 0, b = 0] = parts
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

/**
 * 计算两个颜色之间的插值
 * @param color1 - 起始颜色 (十六进制)
 * @param color2 - 结束颜色 (十六进制)
 * @param factor - 插值因子 (0-1)
 * @returns 插值后的颜色 (十六进制)
 */
export function lerpColor(color1: string, color2: string, factor: number): string {
  const rgb1 = hexToRgb(color1).split(',').map(s => parseInt(s.trim(), 10))
  const rgb2 = hexToRgb(color2).split(',').map(s => parseInt(s.trim(), 10))

  const r = Math.round(rgb1[0]! + (rgb2[0]! - rgb1[0]!) * factor)
  const g = Math.round(rgb1[1]! + (rgb2[1]! - rgb1[1]!) * factor)
  const b = Math.round(rgb1[2]! + (rgb2[2]! - rgb1[2]!) * factor)

  return rgbToHex(`${r}, ${g}, ${b}`)
}

/**
 * 调整颜色的亮度
 * @param hex - 十六进制颜色
 * @param amount - 亮度调整量 (-1 到 1，负值变暗，正值变亮)
 * @returns 调整后的颜色 (十六进制)
 */
export function adjustBrightness(hex: string, amount: number): string {
  const rgb = hexToRgb(hex).split(',').map(s => parseInt(s.trim(), 10))

  const adjust = (value: number) => {
    const newValue = value + (255 * amount)
    return Math.max(0, Math.min(255, Math.round(newValue)))
  }

  const r = adjust(rgb[0]!)
  const g = adjust(rgb[1]!)
  const b = adjust(rgb[2]!)

  return rgbToHex(`${r}, ${g}, ${b}`)
}

/**
 * 获取颜色的 CSS 变量值
 * @param variableName - CSS 变量名 (如 "--bronze")
 * @returns 颜色值
 */
export function getCssVariable(variableName: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim()
}

/**
 * 设置 CSS 变量
 * @param variableName - CSS 变量名
 * @param value - 变量值
 */
export function setCssVariable(variableName: string, value: string): void {
  document.documentElement.style.setProperty(variableName, value)
}
