// 集成示例：如何在 main.tsx 中初始化性能优化

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { LocaleProvider } from './i18n/i18n'

// 导入样式文件（按顺序）
import './styles/global.css'
import './styles/ui-enhancements.css'
import './styles/sky-mansion-nav-enhanced.css'
import './styles/control-panels-enhanced.css'
import './styles/performance-degradation.css'

// 导入工具函数
import {
  detectPerformanceTier,
  getPerformanceConfig,
  applyPerformanceConfig,
  AdaptivePerformance,
} from './utils/performanceUtils'

// 初始化性能配置
function initializePerformance() {
  const tier = detectPerformanceTier()
  const config = getPerformanceConfig(tier)

  // 应用到 DOM
  applyPerformanceConfig(config)

  // 启动自适应性能监控（可选）
  const adaptivePerf = new AdaptivePerformance(
    config,
    30, // 目标 30 FPS
    (newConfig) => {
      console.log('Performance config updated:', newConfig)
      applyPerformanceConfig(newConfig)
    }
  )
  adaptivePerf.start()

  // 开发环境下显示 FPS
  if (import.meta.env.DEV) {
    const fpsDisplay = document.createElement('div')
    fpsDisplay.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      padding: 8px 12px;
      background: rgba(0, 0, 0, 0.8);
      color: #0f0;
      font-family: monospace;
      font-size: 14px;
      z-index: 10000;
      border-radius: 4px;
    `
    document.body.appendChild(fpsDisplay)

    setInterval(() => {
      const fps = adaptivePerf.getFPS()
      fpsDisplay.textContent = `FPS: ${fps}`
      fpsDisplay.style.color = fps >= 30 ? '#0f0' : fps >= 20 ? '#ff0' : '#f00'
    }, 500)
  }

  return config
}

// 性能配置
initializePerformance()

// 创建根组件
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider><App /></LocaleProvider>
  </StrictMode>,
)
