import type { Theme } from '@/core/models/theme'
import { TrainState } from '@/core/models/train'

export const defaultTheme: Theme = {
  id: 'default',
  name: '默认主题',
  visual: {
    colors: {
      background: '#001428',
      foreground: '#ffffff',
      lineColor: '#3399ff',
      passedStation: '#666666',
      currentStation: '#ff6600',
      futureStation: '#ffffff',
      headerBackground: '#002850',
      headerForeground: '#ffffff',
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
    [TrainState.DEPARTING]: [
      { id: 'nearby', name: '近几站', duration: 5 },
    ],
    [TrainState.RUNNING]: [
      { id: 'full-route', name: '全线路图', duration: 5 },
      { id: 'nearby', name: '近几站', duration: 5 },
    ],
    [TrainState.ARRIVING]: [
      { id: 'arrival', name: '到站提示', duration: 5 },
    ],
  },
  transition: 'fade',
}
