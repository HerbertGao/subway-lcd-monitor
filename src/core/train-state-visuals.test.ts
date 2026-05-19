import { describe, it, expect } from 'vitest'
import { TrainState } from './models/train'
import {
  SAFETY_BAR_TEXT,
  SAFETY_BAR_HAS_ICON,
  INFO_BAR_MESSAGES,
  getSafetyBarText,
  safetyBarHasIcon,
  getDisplayedArrivalStation,
  getDoorHint,
  getStationDotState,
  getTransferHintText,
} from './train-state-visuals'

describe('train-state-visuals', () => {
  describe('getSafetyBarText - 黄条文案', () => {
    it('STOPPED 显示「請小心空隙」', () => {
      expect(getSafetyBarText(TrainState.STOPPED)).toBe('請小心空隙　Please mind the gap')
    })

    it('DEPARTING 显示「請勿靠近車門」', () => {
      expect(getSafetyBarText(TrainState.DEPARTING)).toBe(
        '請勿靠近車門　Please stand back from the doors'
      )
    })

    it('ARRIVING 显示「請小心空隙」', () => {
      expect(getSafetyBarText(TrainState.ARRIVING)).toBe('請小心空隙　Please mind the gap')
    })

    it('RUNNING 有兜底文案', () => {
      expect(getSafetyBarText(TrainState.RUNNING)).toBe('請小心空隙　Please mind the gap')
    })

    it('四个 TrainState 均有非空文案', () => {
      for (const state of Object.values(TrainState)) {
        expect(getSafetyBarText(state).length).toBeGreaterThan(0)
        expect(SAFETY_BAR_TEXT[state].length).toBeGreaterThan(0)
      }
    })
  })

  describe('safetyBarHasIcon - 黄条是否带警示图标', () => {
    it('STOPPED（請小心空隙类）带图标', () => {
      expect(safetyBarHasIcon(TrainState.STOPPED)).toBe(true)
    })

    it('ARRIVING（請小心空隙类）带图标', () => {
      expect(safetyBarHasIcon(TrainState.ARRIVING)).toBe(true)
    })

    it('DEPARTING（請勿靠近車門类）不带图标', () => {
      expect(safetyBarHasIcon(TrainState.DEPARTING)).toBe(false)
    })

    it('RUNNING 兜底与請小心空隙同类、带图标', () => {
      expect(safetyBarHasIcon(TrainState.RUNNING)).toBe(true)
    })

    it('四个 TrainState 在 SAFETY_BAR_HAS_ICON 中均有布尔值', () => {
      for (const state of Object.values(TrainState)) {
        expect(typeof SAFETY_BAR_HAS_ICON[state]).toBe('boolean')
      }
    })
  })

  describe('getDisplayedArrivalStation - 展示站', () => {
    const current = { id: 'cur', name: '当前站' }
    const next = { id: 'nxt', name: '下一站' }

    it('ARRIVING 展示 nextStation', () => {
      expect(getDisplayedArrivalStation(TrainState.ARRIVING, current, next)).toBe(next)
    })

    it('STOPPED 展示 currentStation', () => {
      expect(getDisplayedArrivalStation(TrainState.STOPPED, current, next)).toBe(current)
    })

    it('DEPARTING 展示 currentStation', () => {
      expect(getDisplayedArrivalStation(TrainState.DEPARTING, current, next)).toBe(current)
    })

    it('RUNNING 无展示站（null）', () => {
      expect(getDisplayedArrivalStation(TrainState.RUNNING, current, next)).toBeNull()
    })

    it('数据缺失时返回 null', () => {
      expect(getDisplayedArrivalStation(TrainState.ARRIVING, current, null)).toBeNull()
      expect(getDisplayedArrivalStation(TrainState.STOPPED, undefined, next)).toBeNull()
    })
  })

  describe('getDoorHint - 开门方向提示', () => {
    it('right → 绿底黑字「請在這邊落車」（中英双语两段）', () => {
      expect(getDoorHint('right')).toEqual({
        zh: '請在這邊落車',
        en: 'Please exit this side',
        variant: 'green',
      })
    })

    it('left → 深色字「請往另一邊落車」（中英双语两段）', () => {
      expect(getDoorHint('left')).toEqual({
        zh: '請往另一邊落車',
        en: 'Please exit from the opposite side',
        variant: 'dark',
      })
    })

    it('both → 绿底黑字「兩邊車門都會開」（中英双语两段）', () => {
      expect(getDoorHint('both')).toEqual({
        zh: '兩邊車門都會開',
        en: 'Doors open on both sides',
        variant: 'green',
      })
    })

    it('空值 → 不显示（null）', () => {
      expect(getDoorHint(null)).toBeNull()
      expect(getDoorHint(undefined)).toBeNull()
    })
  })

  describe('getTransferHintText - 全程线路图换乘蓝条文案', () => {
    it('换乘线路为空 → 兜底通用换乘提示', () => {
      expect(getTransferHintText([])).toBe('請在此站換乘　Change here for connecting lines')
    })

    it('单条换乘线路 → 含该线中英文名', () => {
      const text = getTransferHintText([{ name: '房山线', nameEn: 'Fangshan Line' }])
      expect(text).toBe('往房山线各站，請在此站換乘　Change to Fangshan Line')
    })

    it('多条换乘线路 → 中文以「、」连接、英文以「 / 」连接', () => {
      const text = getTransferHintText([
        { name: '房山线', nameEn: 'Fangshan Line' },
        { name: '燕房线', nameEn: 'Yanfang Line' },
      ])
      expect(text).toBe(
        '往房山线、燕房线各站，請在此站換乘　Change to Fangshan Line / Yanfang Line'
      )
    })
  })

  describe('getStationDotState - 圆点状态', () => {
    it('下一站 → next（优先于已过判定）', () => {
      expect(getStationDotState(false, true)).toBe('next')
      expect(getStationDotState(true, true)).toBe('next')
    })

    it('已过站、非下一站 → passed', () => {
      expect(getStationDotState(true, false)).toBe('passed')
    })

    it('未过站、非下一站 → upcoming', () => {
      expect(getStationDotState(false, false)).toBe('upcoming')
    })
  })

  describe('INFO_BAR_MESSAGES - 蓝条提示文案集', () => {
    it('非空集合且每条文案均非空', () => {
      expect(INFO_BAR_MESSAGES.length).toBeGreaterThan(0)
      // FullRouteScene 取 [0]、NearbyScene 取 [1]，至少需 2 条
      expect(INFO_BAR_MESSAGES.length).toBeGreaterThanOrEqual(2)
      for (const msg of INFO_BAR_MESSAGES) {
        expect(msg.length).toBeGreaterThan(0)
      }
    })
  })
})
