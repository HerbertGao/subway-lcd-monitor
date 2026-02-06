/** 列车运行状态 */
export enum TrainState {
  STOPPED = 'STOPPED',
  DEPARTING = 'DEPARTING',
  RUNNING = 'RUNNING',
  ARRIVING = 'ARRIVING',
}

/** 运行方向 */
export enum Direction {
  FORWARD = 'FORWARD',
  BACKWARD = 'BACKWARD',
}

/** 列车状态的中文描述 */
export const TrainStateLabel: Record<TrainState, string> = {
  [TrainState.STOPPED]: '停靠在站',
  [TrainState.DEPARTING]: '关门出发',
  [TrainState.RUNNING]: '运行中',
  [TrainState.ARRIVING]: '即将到站',
}
