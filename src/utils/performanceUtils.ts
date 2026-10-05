/**
 * 设备性能检测工具
 * Device Performance Detection Utilities
 */

/**
 * 设备性能等级
 */
export enum PerformanceTier {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/**
 * 检测设备性能等级
 * @returns 设备性能等级
 */
export function detectPerformanceTier(): PerformanceTier {
  // 检测 CPU 核心数
  const cores = navigator.hardwareConcurrency || 1

  // 检测设备内存 (仅部分浏览器支持)
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4

  // 检测是否为移动设备
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )

  // 综合判断
  if (isMobile) {
    // 移动设备
    if (memory <= 2 || cores <= 2) {
      return PerformanceTier.LOW
    } else if (memory <= 4 || cores <= 4) {
      return PerformanceTier.MEDIUM
    } else {
      return PerformanceTier.HIGH
    }
  } else {
    // 桌面设备
    if (memory <= 4 || cores <= 2) {
      return PerformanceTier.LOW
    } else if (memory <= 8 || cores <= 4) {
      return PerformanceTier.MEDIUM
    } else {
      return PerformanceTier.HIGH
    }
  }
}

/**
 * 检测是否为低端设备
 * @returns 是否为低端设备
 */
export function isLowEndDevice(): boolean {
  return detectPerformanceTier() === PerformanceTier.LOW
}

/**
 * 检测是否支持 backdrop-filter
 * @returns 是否支持
 */
export function supportsBackdropFilter(): boolean {
  return (
    CSS.supports('backdrop-filter', 'blur(1px)') ||
    CSS.supports('-webkit-backdrop-filter', 'blur(1px)')
  )
}

/**
 * 检测是否支持 WebGL
 * @returns 是否支持
 */
export function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}

/**
 * 检测是否支持 WebGL2
 * @returns 是否支持
 */
export function supportsWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!canvas.getContext('webgl2')
  } catch {
    return false
  }
}

/**
 * 获取 GPU 信息 (如果可用)
 * @returns GPU 信息或 null
 */
export function getGPUInfo(): { vendor: string; renderer: string } | null {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null

    if (!gl) return null

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    if (!debugInfo) return null

    return {
      vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
      renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
    }
  } catch {
    return null
  }
}

/**
 * 性能配置接口
 */
export interface PerformanceConfig {
  // 渲染配置
  pixelRatio: number
  antialias: boolean
  shadowQuality: 'high' | 'medium' | 'low' | 'off'

  // 效果配置
  useBackdropFilter: boolean
  useTextShadow: boolean
  useBoxShadow: boolean
  animationDuration: number

  // Three.js 配置
  starCount: 'full' | 'reduced' | 'minimal'
  labelDensity: 'full' | 'reduced' | 'minimal'
  updateFrequency: number // FPS
}

/**
 * 根据设备性能获取推荐配置
 * @param tier - 性能等级 (可选，自动检测)
 * @returns 性能配置
 */
export function getPerformanceConfig(tier?: PerformanceTier): PerformanceConfig {
  const detectedTier = tier || detectPerformanceTier()
  const supportsBackdrop = supportsBackdropFilter()

  switch (detectedTier) {
    case PerformanceTier.HIGH:
      return {
        pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        antialias: true,
        shadowQuality: 'high',
        useBackdropFilter: supportsBackdrop,
        useTextShadow: true,
        useBoxShadow: true,
        animationDuration: 1,
        starCount: 'full',
        labelDensity: 'full',
        updateFrequency: 60,
      }

    case PerformanceTier.MEDIUM:
      return {
        pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
        antialias: true,
        shadowQuality: 'medium',
        useBackdropFilter: supportsBackdrop,
        useTextShadow: true,
        useBoxShadow: true,
        animationDuration: 1,
        starCount: 'reduced',
        labelDensity: 'reduced',
        updateFrequency: 45,
      }

    case PerformanceTier.LOW:
      return {
        pixelRatio: 1,
        antialias: false,
        shadowQuality: 'off',
        useBackdropFilter: false,
        useTextShadow: false,
        useBoxShadow: false,
        animationDuration: 0.5,
        starCount: 'minimal',
        labelDensity: 'minimal',
        updateFrequency: 30,
      }
  }
}

/**
 * 应用性能配置到 DOM
 * @param config - 性能配置
 */
export function applyPerformanceConfig(config: PerformanceConfig): void {
  const root = document.documentElement

  // 设置性能等级类名
  root.classList.remove('perf-high', 'perf-medium', 'perf-low')

  if (config.updateFrequency >= 60) {
    root.classList.add('perf-high')
  } else if (config.updateFrequency >= 45) {
    root.classList.add('perf-medium')
  } else {
    root.classList.add('perf-low')
  }

  // 设置 CSS 变量
  root.style.setProperty(
    '--anim-duration-factor',
    config.animationDuration.toString()
  )

  // 禁用效果类名
  if (!config.useBackdropFilter) {
    root.classList.add('no-backdrop-filter')
  }
  if (!config.useTextShadow) {
    root.classList.add('no-text-shadow')
  }
  if (!config.useBoxShadow) {
    root.classList.add('no-box-shadow')
  }

  // 输出配置信息到控制台
  console.log('Performance config applied:', config)
}

/**
 * 监控 FPS
 */
export class FPSMonitor {
  private lastTime = performance.now()
  private frames = 0
  private fps = 0
  private callback?: (fps: number) => void

  constructor(callback?: (fps: number) => void) {
    this.callback = callback
  }

  update(): void {
    const now = performance.now()
    this.frames++

    if (now >= this.lastTime + 1000) {
      this.fps = Math.round((this.frames * 1000) / (now - this.lastTime))
      this.frames = 0
      this.lastTime = now

      if (this.callback) {
        this.callback(this.fps)
      }
    }
  }

  getFPS(): number {
    return this.fps
  }

  start(): void {
    const loop = () => {
      this.update()
      requestAnimationFrame(loop)
    }
    loop()
  }
}

/**
 * 自适应性能调整器
 */
export class AdaptivePerformance {
  private fpsMonitor: FPSMonitor
  private config: PerformanceConfig
  private targetFPS: number
  private checkInterval = 3000 // 每 3 秒检查一次
  private lastCheck = 0
  private consecutiveLowFrames = 0
  private onChange?: (config: PerformanceConfig) => void

  constructor(
    initialConfig: PerformanceConfig,
    targetFPS = 30,
    onChange?: (config: PerformanceConfig) => void
  ) {
    this.config = initialConfig
    this.targetFPS = targetFPS
    this.onChange = onChange

    this.fpsMonitor = new FPSMonitor((fps) => {
      this.checkPerformance(fps)
    })
  }

  private checkPerformance(fps: number): void {
    const now = performance.now()
    if (now - this.lastCheck < this.checkInterval) return

    this.lastCheck = now

    // 如果连续低于目标 FPS，降低质量
    if (fps < this.targetFPS) {
      this.consecutiveLowFrames++

      if (this.consecutiveLowFrames >= 3) {
        this.downgrade()
        this.consecutiveLowFrames = 0
      }
    } else if (fps > this.targetFPS + 15) {
      // 如果 FPS 持续较高，可以尝试提升质量
      this.consecutiveLowFrames = Math.max(0, this.consecutiveLowFrames - 1)
    }
  }

  private downgrade(): void {
    console.log('Performance downgrade triggered')

    // 逐步降低配置
    if (this.config.pixelRatio > 1) {
      this.config.pixelRatio = Math.max(1, this.config.pixelRatio - 0.25)
    } else if (this.config.labelDensity === 'full') {
      this.config.labelDensity = 'reduced'
    } else if (this.config.labelDensity === 'reduced') {
      this.config.labelDensity = 'minimal'
    } else if (this.config.useBackdropFilter) {
      this.config.useBackdropFilter = false
    } else if (this.config.useBoxShadow) {
      this.config.useBoxShadow = false
    }

    if (this.onChange) {
      this.onChange(this.config)
    }

    applyPerformanceConfig(this.config)
  }

  start(): void {
    this.fpsMonitor.start()
  }

  getConfig(): PerformanceConfig {
    return { ...this.config }
  }

  getFPS(): number {
    return this.fpsMonitor.getFPS()
  }
}
