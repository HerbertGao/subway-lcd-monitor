import type { Theme } from './models/theme'

/** 深度合并两个对象，source 覆盖 target */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepMerge(target: any, source: any): any {
  const result = { ...target }
  for (const key of Object.keys(source)) {
    const sourceVal = source[key]
    const targetVal = target[key]
    if (
      sourceVal !== undefined &&
      sourceVal !== null &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      typeof targetVal === 'object' &&
      targetVal !== null &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(targetVal, sourceVal)
    } else if (sourceVal !== undefined) {
      result[key] = sourceVal
    }
  }
  return result
}

/** 主题注册表 */
const themeRegistry = new Map<string, Partial<Theme>>()

/** 注册一个主题 */
export function registerTheme(theme: Partial<Theme> & { id: string }): void {
  themeRegistry.set(theme.id, theme)
}

/** 获取已注册的主题 */
export function getRegisteredTheme(id: string): Partial<Theme> | undefined {
  return themeRegistry.get(id)
}

/**
 * 解析主题：按优先级合并
 * 线路级 > 城市级 > 全局默认
 */
export function resolveTheme(
  defaultTheme: Theme,
  cityThemeId?: string,
  lineThemeId?: string
): Theme {
  let resolved = { ...defaultTheme }

  // 城市级主题覆盖
  if (cityThemeId && cityThemeId !== defaultTheme.id) {
    const cityTheme = themeRegistry.get(cityThemeId)
    if (cityTheme) {
      resolved = deepMerge(resolved, cityTheme) as Theme
    }
  }

  // 线路级主题覆盖
  if (lineThemeId && lineThemeId !== cityThemeId && lineThemeId !== defaultTheme.id) {
    const lineTheme = themeRegistry.get(lineThemeId)
    if (lineTheme) {
      resolved = deepMerge(resolved, lineTheme) as Theme
    }
  }

  return resolved
}
