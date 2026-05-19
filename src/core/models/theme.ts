import type { Component } from 'vue'
import type { TrainState } from './train'

/** 场景配置 */
export interface SceneConfig {
  id: string
  name: string
  duration: number
  component?: Component
}

/** 颜色配置 */
export interface ColorConfig {
  background: string
  foreground: string
  lineColor: string
  passedStation: string
  currentStation: string
  futureStation: string
  headerBackground: string
  headerForeground: string
  /** 站名特写黄色安全条背景色 */
  safetyBar: string
  /** 黄色安全条文字色 */
  safetyBarText: string
  /** 线路图底部蓝色提示条背景色 */
  infoBar: string
  /** 蓝色提示条文字色 */
  infoBarText: string
  /** 站点圆点填充色（白色实心） */
  stationDot: string
  /** 未过站站点圆点填充色（黄色实心） */
  stationDotUpcoming: string
  /** 开门方向提示绿底色（港铁式右上角开门方向提示「绿底白字」态背景） */
  doorHintGreen: string
  /** 开门方向提示绿底态文字色（与 doorHintGreen 成对的「白字」） */
  doorHintText: string
}

/** 字体配置 */
export interface FontConfig {
  stationName: string
  stationNameEn: string
  info: string
  title: string
}

/** 视觉样式配置 */
export interface VisualConfig {
  colors: ColorConfig
  fonts: FontConfig
  stationMarker: 'circle' | 'square' | 'diamond'
  lineCap: 'round' | 'square'
}

/** 主题定义 */
export interface Theme {
  id: string
  name: string
  visual: VisualConfig
  scenes: Partial<Record<TrainState, SceneConfig[]>>
  transition: 'fade' | 'slide'
}

/** 可部分覆盖的主题（用于主题合并） */
export type PartialTheme = Partial<Omit<Theme, 'visual' | 'scenes'>> & {
  visual?: Partial<
    VisualConfig & {
      colors?: Partial<ColorConfig>
      fonts?: Partial<FontConfig>
    }
  >
  scenes?: Partial<Record<TrainState, SceneConfig[]>>
}
