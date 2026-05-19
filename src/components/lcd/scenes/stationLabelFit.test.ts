import { describe, it, expect } from 'vitest'
import { estimateTextWidth, fitStationLabel, SAFE_RATIO } from './stationLabelFit'

describe('stationLabelFit', () => {
  describe('estimateTextWidth - 文本宽度估算', () => {
    it('ASCII 按约 0.55× 字号/字', () => {
      expect(estimateTextWidth('abcd', 10)).toBeCloseTo(4 * 0.55 * 10)
    })

    it('CJK 按约 1.0× 字号/字', () => {
      expect(estimateTextWidth('良乡', 10)).toBeCloseTo(2 * 1.0 * 10)
    })

    it('空串宽度为 0', () => {
      expect(estimateTextWidth('', 10)).toBe(0)
    })
  })

  describe('fitStationLabel - 字号适配', () => {
    const baseFontSize = 13
    const stationGap = 60

    it('短名不缩字号、不需压缩', () => {
      // 「西站」2 个 CJK 字，基准 13 → 26 unit，可用 54 unit，放得下
      const fit = fitStationLabel('西站', baseFontSize, stationGap)
      expect(fit.fontSize).toBe(baseFontSize)
      expect(fit.needsCompression).toBe(false)
    })

    it('短英文名不缩字号、不需压缩', () => {
      const fit = fitStationLabel('Suzhuang', 9, stationGap)
      expect(fit.fontSize).toBe(9)
      expect(fit.needsCompression).toBe(false)
    })

    it('中等超长名缩字号至恰好放入、不需压缩', () => {
      // 「良乡大学城北」6 CJK 字，基准 13 → 78 unit，可用 54 unit，超宽
      const fit = fitStationLabel('良乡大学城北', baseFontSize, stationGap)
      expect(fit.fontSize).toBeLessThan(baseFontSize)
      expect(fit.needsCompression).toBe(false)
      // 缩后估算宽度应不超过可用宽度
      expect(estimateTextWidth('良乡大学城北', fit.fontSize)).toBeLessThanOrEqual(
        fit.availableWidth + 1e-6
      )
      // 仍在字号下限之上
      expect(fit.fontSize).toBeGreaterThanOrEqual(Math.max(baseFontSize * 0.6, 7))
    })

    it('超长英文名字号触底并被标记为需压缩', () => {
      // 房山线「Liangxiang Daxuecheng Bei」级超长英文名，窄站间距下触底
      const fit = fitStationLabel('Liangxiang Daxuecheng Bei', 9, stationGap)
      // 字号下限 = max(9*0.6, 7) = 7
      expect(fit.fontSize).toBe(7)
      expect(fit.needsCompression).toBe(true)
      expect(fit.availableWidth).toBeCloseTo(stationGap * SAFE_RATIO)
    })

    it('可用宽度为站间距 × 安全系数', () => {
      const fit = fitStationLabel('x', 9, 100)
      expect(fit.availableWidth).toBeCloseTo(100 * SAFE_RATIO)
    })

    it('空串返回基准字号、不需压缩', () => {
      const fit = fitStationLabel('', baseFontSize, stationGap)
      expect(fit.fontSize).toBe(baseFontSize)
      expect(fit.needsCompression).toBe(false)
    })
  })
})
