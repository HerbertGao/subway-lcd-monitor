import type { Theme } from '@/core/models/theme'
import { TrainState } from '@/core/models/train'

export const defaultTheme: Theme = {
  id: 'default',
  name: '默认主题',
  visual: {
    colors: {
      // 港铁西铁线 LCD 报站屏配色
      background: '#e8e8e8',
      foreground: '#1a1a1a',
      lineColor: '#3399ff',
      passedStation: '#9a9a9a',
      currentStation: '#1a1a1a',
      futureStation: '#1a1a1a',
      headerBackground: '#13315c',
      headerForeground: '#ffffff',
      safetyBar: '#f2b600',
      safetyBarText: '#1a1a1a',
      infoBar: '#13315c',
      infoBarText: '#ffffff',
      stationDot: '#ffffff',
    },
    fonts: {
      stationName: '"Microsoft YaHei", "PingFang SC", sans-serif',
      stationNameEn: 'Arial, Helvetica, sans-serif',
      info: '"Microsoft YaHei", "PingFang SC", sans-serif',
      title: '"Microsoft YaHei", "PingFang SC", sans-serif',
    },
    stationMarker: 'circle',
    lineCap: 'round',
  },
  scenes: {
    [TrainState.STOPPED]: [
      { id: 'full-route', name: '全线路图', duration: 5 },
      { id: 'nearby', name: '近几站', duration: 5 },
    ],
    [TrainState.DEPARTING]: [{ id: 'nearby', name: '近几站', duration: 5 }],
    [TrainState.RUNNING]: [
      { id: 'full-route', name: '全线路图', duration: 5 },
      { id: 'nearby', name: '近几站', duration: 5 },
    ],
    [TrainState.ARRIVING]: [{ id: 'arrival', name: '到站提示', duration: 5 }],
  },
  transition: 'fade',
}
