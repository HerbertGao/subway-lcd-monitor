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
      stationDotUpcoming: '#f2b600',
      doorHintGreen: '#00a040',
      doorHintText: '#ffffff',
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
    // 停站/关门/到站显示站名特写（arrival 为列表唯一项、必然渲染），
    // 运行中显示线路图。RUNNING 的两个线路图场景 duration 约 2.5s，
    // 使 FSM RUNNING 自动时长 5s 内 full-route 与 nearby 均可轮到。
    [TrainState.STOPPED]: [{ id: 'arrival', name: '到站提示', duration: 5 }],
    [TrainState.DEPARTING]: [{ id: 'arrival', name: '到站提示', duration: 5 }],
    [TrainState.RUNNING]: [
      { id: 'full-route', name: '全线路图', duration: 2.5 },
      { id: 'nearby', name: '近几站', duration: 2.5 },
    ],
    [TrainState.ARRIVING]: [{ id: 'arrival', name: '到站提示', duration: 5 }],
  },
  transition: 'fade',
}
