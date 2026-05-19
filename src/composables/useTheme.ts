import { computed, watchEffect, type Ref } from 'vue'
import type { Theme } from '@/core/models/theme'
import { resolveTheme } from '@/core/theme-resolver'
import { defaultTheme } from '@/themes/default'
import { useLineStore } from '@/stores/line'

export function useTheme() {
  const lineStore = useLineStore()

  const currentTheme = computed<Theme>(() => {
    return resolveTheme(
      defaultTheme,
      lineStore.currentNetwork?.defaultThemeId,
      lineStore.currentLine?.themeId
    )
  })

  /** 将主题 CSS 变量注入到指定元素 */
  function injectCSSVariables(elRef: Ref<HTMLElement | null>) {
    watchEffect(() => {
      const el = elRef.value
      if (!el) return
      const { colors, fonts } = currentTheme.value.visual
      el.style.setProperty('--lcd-bg', colors.background)
      el.style.setProperty('--lcd-fg', colors.foreground)
      el.style.setProperty('--lcd-line-color', colors.lineColor)
      el.style.setProperty('--lcd-passed-station', colors.passedStation)
      el.style.setProperty('--lcd-current-station', colors.currentStation)
      el.style.setProperty('--lcd-future-station', colors.futureStation)
      el.style.setProperty('--lcd-header-bg', colors.headerBackground)
      el.style.setProperty('--lcd-header-fg', colors.headerForeground)
      el.style.setProperty('--lcd-safety-bar', colors.safetyBar)
      el.style.setProperty('--lcd-safety-bar-text', colors.safetyBarText)
      el.style.setProperty('--lcd-info-bar', colors.infoBar)
      el.style.setProperty('--lcd-info-bar-text', colors.infoBarText)
      el.style.setProperty('--lcd-station-dot', colors.stationDot)
      el.style.setProperty('--lcd-font-station', fonts.stationName)
      el.style.setProperty('--lcd-font-station-en', fonts.stationNameEn)
      el.style.setProperty('--lcd-font-info', fonts.info)
      el.style.setProperty('--lcd-font-title', fonts.title)
    })
  }

  return {
    currentTheme,
    injectCSSVariables,
  }
}
