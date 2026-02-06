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
  visual?: Partial<VisualConfig & {
    colors?: Partial<ColorConfig>
    fonts?: Partial<FontConfig>
  }>
  scenes?: Partial<Record<TrainState, SceneConfig[]>>
}
