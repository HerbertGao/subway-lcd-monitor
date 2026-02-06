import type { Line } from './models/network'
import { TrainState, Direction } from './models/train'

/** 状态流转顺序 */
const STATE_ORDER: TrainState[] = [
  TrainState.STOPPED,
  TrainState.DEPARTING,
  TrainState.RUNNING,
  TrainState.ARRIVING,
]

export interface TrainFSMState {
  trainState: TrainState
  currentStationIndex: number
  direction: Direction
  isAutoMode: boolean
}

export interface TrainFSMCallbacks {
  onStateChange?: (state: TrainFSMState) => void
  onStationChange?: (state: TrainFSMState) => void
  onDirectionChange?: (state: TrainFSMState) => void
}

export class TrainFSM {
  private state: TrainFSMState
  private line: Line
  private callbacks: TrainFSMCallbacks
  private autoTimer: ReturnType<typeof setInterval> | null = null
  private autoIntervals: Record<TrainState, number>

  constructor(
    line: Line,
    callbacks: TrainFSMCallbacks = {},
    autoIntervals?: Partial<Record<TrainState, number>>
  ) {
    this.line = line
    this.callbacks = callbacks
    this.autoIntervals = {
      [TrainState.STOPPED]: 3000,
      [TrainState.DEPARTING]: 2000,
      [TrainState.RUNNING]: 5000,
      [TrainState.ARRIVING]: 3000,
      ...autoIntervals,
    }
    this.state = {
      trainState: TrainState.STOPPED,
      currentStationIndex: 0,
      direction: Direction.FORWARD,
      isAutoMode: false,
    }
  }

  getState(): Readonly<TrainFSMState> {
    return { ...this.state }
  }

  getLine(): Line {
    return this.line
  }

  /** 获取当前站点 */
  getCurrentStation() {
    return this.line.stations[this.state.currentStationIndex]
  }

  /** 获取下一站（根据方向） */
  getNextStation() {
    const nextIndex = this.getNextStationIndex()
    if (nextIndex === null) return null
    return this.line.stations[nextIndex]
  }

  /** 推进到下一个状态 */
  next(): void {
    const currentIndex = STATE_ORDER.indexOf(this.state.trainState)
    const nextStateIndex = (currentIndex + 1) % STATE_ORDER.length

    // ARRIVING → STOPPED: 需要推进站点
    if (this.state.trainState === TrainState.ARRIVING) {
      this.advanceStation()
    }

    this.state.trainState = STATE_ORDER[nextStateIndex]
    this.callbacks.onStateChange?.(this.getState())
  }

  /** 切换运行方向（仅 STOPPED 状态允许） */
  toggleDirection(): boolean {
    if (this.state.trainState !== TrainState.STOPPED) {
      return false
    }
    this.state.direction =
      this.state.direction === Direction.FORWARD
        ? Direction.BACKWARD
        : Direction.FORWARD
    this.callbacks.onDirectionChange?.(this.getState())
    return true
  }

  /** 设置运行方向（仅 STOPPED 状态允许） */
  setDirection(direction: Direction): boolean {
    if (this.state.trainState !== TrainState.STOPPED) {
      return false
    }
    if (this.state.direction !== direction) {
      this.state.direction = direction
      this.callbacks.onDirectionChange?.(this.getState())
    }
    return true
  }

  /** 切换自动/手动模式 */
  setAutoMode(auto: boolean): void {
    this.state.isAutoMode = auto
    if (auto) {
      this.startAutoTimer()
    } else {
      this.stopAutoTimer()
    }
  }

  /** 重置到指定线路 */
  reset(line: Line, direction: Direction = Direction.FORWARD): void {
    this.stopAutoTimer()
    this.line = line
    this.state = {
      trainState: TrainState.STOPPED,
      currentStationIndex: direction === Direction.FORWARD ? 0 : line.stations.length - 1,
      direction,
      isAutoMode: false,
    }
    this.callbacks.onStateChange?.(this.getState())
    this.callbacks.onStationChange?.(this.getState())
  }

  /** 销毁，清除计时器 */
  destroy(): void {
    this.stopAutoTimer()
  }

  private getNextStationIndex(): number | null {
    const { currentStationIndex, direction } = this.state
    const lastIndex = this.line.stations.length - 1

    if (this.line.isLoop) {
      if (direction === Direction.FORWARD) {
        return (currentStationIndex + 1) % this.line.stations.length
      } else {
        return (currentStationIndex - 1 + this.line.stations.length) % this.line.stations.length
      }
    }

    if (direction === Direction.FORWARD) {
      return currentStationIndex < lastIndex ? currentStationIndex + 1 : null
    } else {
      return currentStationIndex > 0 ? currentStationIndex - 1 : null
    }
  }

  private advanceStation(): void {
    const lastIndex = this.line.stations.length - 1

    if (this.line.isLoop) {
      // 环线：循环
      if (this.state.direction === Direction.FORWARD) {
        this.state.currentStationIndex = (this.state.currentStationIndex + 1) % this.line.stations.length
      } else {
        this.state.currentStationIndex = (this.state.currentStationIndex - 1 + this.line.stations.length) % this.line.stations.length
      }
    } else {
      // 非环线
      if (this.state.direction === Direction.FORWARD) {
        if (this.state.currentStationIndex < lastIndex) {
          this.state.currentStationIndex++
        }
        // 到达终点，反转方向
        if (this.state.currentStationIndex === lastIndex) {
          this.state.direction = Direction.BACKWARD
          this.callbacks.onDirectionChange?.(this.getState())
        }
      } else {
        if (this.state.currentStationIndex > 0) {
          this.state.currentStationIndex--
        }
        // 到达起点，反转方向
        if (this.state.currentStationIndex === 0) {
          this.state.direction = Direction.FORWARD
          this.callbacks.onDirectionChange?.(this.getState())
        }
      }
    }
    this.callbacks.onStationChange?.(this.getState())
  }

  private startAutoTimer(): void {
    this.stopAutoTimer()
    const tick = () => {
      const interval = this.autoIntervals[this.state.trainState]
      this.autoTimer = setTimeout(() => {
        this.next()
        if (this.state.isAutoMode) {
          tick()
        }
      }, interval)
    }
    tick()
  }

  private stopAutoTimer(): void {
    if (this.autoTimer !== null) {
      clearTimeout(this.autoTimer)
      this.autoTimer = null
    }
  }
}
