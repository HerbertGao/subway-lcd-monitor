import { describe, it, expect } from 'vitest'
import { registerTheme, getRegisteredTheme, resolveTheme } from './theme-resolver'
import type { Theme } from './models/theme'

/** 构造一个完整的默认主题 */
function makeDefaultTheme(): Theme {
  return {
    id: 'default',
    name: '默认主题',
    transition: 'fade',
    scenes: {},
    visual: {
      stationMarker: 'circle',
      lineCap: 'round',
      colors: {
        background: '#000000',
        foreground: '#ffffff',
        lineColor: '#888888',
        passedStation: '#444444',
        currentStation: '#ff0000',
        futureStation: '#cccccc',
        headerBackground: '#111111',
        headerForeground: '#eeeeee',
        safetyBar: '#f2b600',
        safetyBarText: '#1a1a1a',
        infoBar: '#13315c',
        infoBarText: '#ffffff',
        stationDot: '#ffffff',
      },
      fonts: {
        stationName: 'FontA',
        stationNameEn: 'FontA',
        info: 'FontA',
        title: 'FontA',
      },
    },
  }
}

describe('theme-resolver', () => {
  describe('注册表', () => {
    it('registerTheme 后可通过 getRegisteredTheme 取回', () => {
      const theme = { id: 'reg-test', name: '注册测试' }
      registerTheme(theme)
      expect(getRegisteredTheme('reg-test')).toEqual(theme)
    })

    it('未注册的主题返回 undefined', () => {
      expect(getRegisteredTheme('never-registered-xyz')).toBeUndefined()
    })
  })

  describe('三级优先级合并', () => {
    it('无城市/线路主题时返回默认主题副本', () => {
      const def = makeDefaultTheme()
      const resolved = resolveTheme(def)
      expect(resolved).toEqual(def)
      expect(resolved).not.toBe(def)
    })

    it('城市级主题覆盖默认级', () => {
      registerTheme({
        id: 'city-only',
        name: '城市主题',
        transition: 'slide',
      })
      const resolved = resolveTheme(makeDefaultTheme(), 'city-only')
      expect(resolved.transition).toBe('slide')
      expect(resolved.name).toBe('城市主题')
      // 未覆盖字段保留默认
      expect(resolved.visual.colors.background).toBe('#000000')
    })

    it('线路级主题覆盖城市级', () => {
      registerTheme({
        id: 'city-a',
        name: '城市A',
        transition: 'slide',
      })
      registerTheme({
        id: 'line-a',
        name: '线路A',
        transition: 'fade',
      })
      const resolved = resolveTheme(makeDefaultTheme(), 'city-a', 'line-a')
      // 线路级最高优先级
      expect(resolved.name).toBe('线路A')
      expect(resolved.transition).toBe('fade')
    })

    it('线路 > 城市 > 默认 三级同字段冲突时线路级胜出', () => {
      registerTheme({
        id: 'city-b',
        name: '城市B',
      })
      registerTheme({
        id: 'line-b',
        name: '线路B',
      })
      const resolved = resolveTheme(makeDefaultTheme(), 'city-b', 'line-b')
      expect(resolved.name).toBe('线路B')
    })

    it('仅城市级提供某字段时，该字段来自城市级', () => {
      registerTheme({
        id: 'city-c',
        name: '城市C',
        transition: 'slide',
      })
      registerTheme({
        id: 'line-c',
        name: '线路C',
      })
      const resolved = resolveTheme(makeDefaultTheme(), 'city-c', 'line-c')
      // name 被线路级覆盖
      expect(resolved.name).toBe('线路C')
      // transition 线路级未提供，沿用城市级
      expect(resolved.transition).toBe('slide')
    })
  })

  describe('深层字段覆盖', () => {
    it('深度合并：仅覆盖嵌套对象中的指定字段，兄弟字段保留', () => {
      registerTheme({
        id: 'deep-city',
        name: '深合并城市',
        visual: {
          colors: {
            background: '#ff0000',
          },
        },
      } as Parameters<typeof registerTheme>[0])
      const resolved = resolveTheme(makeDefaultTheme(), 'deep-city')
      // 被覆盖的深层字段
      expect(resolved.visual.colors.background).toBe('#ff0000')
      // 同一嵌套对象内未覆盖的兄弟字段保留默认值
      expect(resolved.visual.colors.foreground).toBe('#ffffff')
      // 其它嵌套对象完全保留
      expect(resolved.visual.fonts.title).toBe('FontA')
      expect(resolved.visual.stationMarker).toBe('circle')
    })

    it('线路级深层字段覆盖城市级深层字段', () => {
      registerTheme({
        id: 'deep-city-2',
        name: '城市',
        visual: {
          colors: {
            background: '#111111',
            foreground: '#222222',
          },
        },
      } as Parameters<typeof registerTheme>[0])
      registerTheme({
        id: 'deep-line-2',
        name: '线路',
        visual: {
          colors: {
            background: '#999999',
          },
        },
      } as Parameters<typeof registerTheme>[0])
      const resolved = resolveTheme(makeDefaultTheme(), 'deep-city-2', 'deep-line-2')
      // background 被线路级覆盖
      expect(resolved.visual.colors.background).toBe('#999999')
      // foreground 线路级未提供，沿用城市级
      expect(resolved.visual.colors.foreground).toBe('#222222')
      // lineColor 城市/线路均未提供，沿用默认
      expect(resolved.visual.colors.lineColor).toBe('#888888')
    })
  })

  describe('边界场景', () => {
    it('cityThemeId 等于默认主题 id 时跳过城市级合并', () => {
      const def = makeDefaultTheme()
      const resolved = resolveTheme(def, def.id)
      expect(resolved).toEqual(def)
    })

    it('引用未注册的城市/线路主题时安全降级，不抛错', () => {
      const def = makeDefaultTheme()
      const resolved = resolveTheme(def, 'no-such-city', 'no-such-line')
      expect(resolved).toEqual(def)
    })
  })
})
