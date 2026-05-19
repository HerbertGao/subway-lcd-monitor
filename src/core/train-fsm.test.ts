import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TrainFSM } from './train-fsm'
import type { Line, Station } from './models/network'
import { TrainState, Direction } from './models/train'

function makeStation(id: string): Station {
  return {
    id,
    name: id,
    nameEn: id,
    transfers: [],
    doorSide: 'right',
  }
}

/** 构造一条非环线（3 站） */
function makeLinearLine(): Line {
  return {
    id: 'line-linear',
    name: '直线线路',
    nameEn: 'Linear Line',
    color: '#000000',
    isLoop: false,
    stations: [makeStation('a'), makeStation('b'), makeStation('c')],
  }
}

/** 构造一条环线（3 站） */
function makeLoopLine(): Line {
  return {
    id: 'line-loop',
    name: '环线',
    nameEn: 'Loop Line',
    color: '#000000',
    isLoop: true,
    stations: [makeStation('x'), makeStation('y'), makeStation('z')],
  }
}

describe('TrainFSM', () => {
  describe('状态循环', () => {
    it('next() 按 STOPPED→DEPARTING→RUNNING→ARRIVING→STOPPED 循环', () => {
      const fsm = new TrainFSM(makeLinearLine())
      expect(fsm.getState().trainState).toBe(TrainState.STOPPED)

      fsm.next()
      expect(fsm.getState().trainState).toBe(TrainState.DEPARTING)

      fsm.next()
      expect(fsm.getState().trainState).toBe(TrainState.RUNNING)

      fsm.next()
      expect(fsm.getState().trainState).toBe(TrainState.ARRIVING)

      fsm.next()
      expect(fsm.getState().trainState).toBe(TrainState.STOPPED)
    })

    it('每次 next() 触发 onStateChange 回调', () => {
      const onStateChange = vi.fn()
      const fsm = new TrainFSM(makeLinearLine(), { onStateChange })
      fsm.next()
      fsm.next()
      expect(onStateChange).toHaveBeenCalledTimes(2)
    })

    it('一个完整循环（ARRIVING→STOPPED）后推进站点', () => {
      const fsm = new TrainFSM(makeLinearLine())
      expect(fsm.getState().currentStationIndex).toBe(0)
      // 走完一个完整状态循环
      fsm.next() // DEPARTING
      fsm.next() // RUNNING
      fsm.next() // ARRIVING
      fsm.next() // STOPPED + advanceStation
      expect(fsm.getState().currentStationIndex).toBe(1)
    })
  })

  describe('非环线', () => {
    it('FORWARD 方向逐站推进', () => {
      const fsm = new TrainFSM(makeLinearLine())
      const advanceOneCycle = () => {
        fsm.next()
        fsm.next()
        fsm.next()
        fsm.next()
      }
      advanceOneCycle()
      expect(fsm.getState().currentStationIndex).toBe(1)
      expect(fsm.getState().direction).toBe(Direction.FORWARD)
    })

    it('到达终点站后方向自动反转为 BACKWARD', () => {
      const onDirectionChange = vi.fn()
      const fsm = new TrainFSM(makeLinearLine(), { onDirectionChange })
      const advanceOneCycle = () => {
        fsm.next()
        fsm.next()
        fsm.next()
        fsm.next()
      }
      advanceOneCycle() // index 0 -> 1
      advanceOneCycle() // index 1 -> 2 (终点)
      expect(fsm.getState().currentStationIndex).toBe(2)
      expect(fsm.getState().direction).toBe(Direction.BACKWARD)
      expect(onDirectionChange).toHaveBeenCalled()
    })

    it('到达起点站后方向自动反转回 FORWARD', () => {
      const fsm = new TrainFSM(makeLinearLine())
      const advanceOneCycle = () => {
        fsm.next()
        fsm.next()
        fsm.next()
        fsm.next()
      }
      advanceOneCycle() // 0 -> 1
      advanceOneCycle() // 1 -> 2，反转为 BACKWARD
      advanceOneCycle() // 2 -> 1
      expect(fsm.getState().currentStationIndex).toBe(1)
      expect(fsm.getState().direction).toBe(Direction.BACKWARD)
      advanceOneCycle() // 1 -> 0，反转为 FORWARD
      expect(fsm.getState().currentStationIndex).toBe(0)
      expect(fsm.getState().direction).toBe(Direction.FORWARD)
    })

    it('getNextStation 在终点（FORWARD）前一刻仍有下一站，终点处由方向反转决定', () => {
      const fsm = new TrainFSM(makeLinearLine())
      expect(fsm.getCurrentStation().id).toBe('a')
      expect(fsm.getNextStation()?.id).toBe('b')
    })

    it('reset 到 BACKWARD 时起始站为末站', () => {
      const fsm = new TrainFSM(makeLinearLine())
      fsm.reset(makeLinearLine(), Direction.BACKWARD)
      expect(fsm.getState().currentStationIndex).toBe(2)
      expect(fsm.getState().direction).toBe(Direction.BACKWARD)
    })
  })

  describe('环线', () => {
    it('FORWARD 方向到末站后循环回首站，方向不反转', () => {
      const fsm = new TrainFSM(makeLoopLine())
      const advanceOneCycle = () => {
        fsm.next()
        fsm.next()
        fsm.next()
        fsm.next()
      }
      advanceOneCycle() // 0 -> 1
      advanceOneCycle() // 1 -> 2
      advanceOneCycle() // 2 -> 0（循环）
      expect(fsm.getState().currentStationIndex).toBe(0)
      expect(fsm.getState().direction).toBe(Direction.FORWARD)
    })

    it('BACKWARD 方向从首站循环回末站', () => {
      const fsm = new TrainFSM(makeLoopLine())
      // STOPPED 状态下切换方向
      expect(fsm.toggleDirection()).toBe(true)
      expect(fsm.getState().direction).toBe(Direction.BACKWARD)
      const advanceOneCycle = () => {
        fsm.next()
        fsm.next()
        fsm.next()
        fsm.next()
      }
      advanceOneCycle() // 0 -> 2（环线倒序循环）
      expect(fsm.getState().currentStationIndex).toBe(2)
      expect(fsm.getState().direction).toBe(Direction.BACKWARD)
    })

    it('getNextStation 在环线 FORWARD 末站指向首站', () => {
      const line = makeLoopLine()
      const fsm = new TrainFSM(line)
      fsm.reset(line, Direction.FORWARD)
      // 推进到末站
      const advanceOneCycle = () => {
        fsm.next()
        fsm.next()
        fsm.next()
        fsm.next()
      }
      advanceOneCycle()
      advanceOneCycle()
      expect(fsm.getCurrentStation().id).toBe('z')
      expect(fsm.getNextStation()?.id).toBe('x')
    })
  })

  describe('方向控制', () => {
    it('toggleDirection 仅 STOPPED 状态允许', () => {
      const fsm = new TrainFSM(makeLinearLine())
      expect(fsm.toggleDirection()).toBe(true)
      expect(fsm.getState().direction).toBe(Direction.BACKWARD)

      fsm.next() // DEPARTING
      expect(fsm.toggleDirection()).toBe(false)
      expect(fsm.getState().direction).toBe(Direction.BACKWARD)
    })

    it('setDirection 仅在 STOPPED 且方向变化时触发回调', () => {
      const onDirectionChange = vi.fn()
      const fsm = new TrainFSM(makeLinearLine(), { onDirectionChange })
      expect(fsm.setDirection(Direction.FORWARD)).toBe(true)
      expect(onDirectionChange).not.toHaveBeenCalled()

      expect(fsm.setDirection(Direction.BACKWARD)).toBe(true)
      expect(onDirectionChange).toHaveBeenCalledTimes(1)

      fsm.next() // 离开 STOPPED
      expect(fsm.setDirection(Direction.FORWARD)).toBe(false)
    })
  })

  describe('自动与手动模式', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('默认手动模式：不推进状态直到调用 next()', () => {
      const fsm = new TrainFSM(makeLinearLine())
      expect(fsm.getState().isAutoMode).toBe(false)
      vi.advanceTimersByTime(60000)
      expect(fsm.getState().trainState).toBe(TrainState.STOPPED)
    })

    it('自动模式：按 autoIntervals 推进状态', () => {
      const fsm = new TrainFSM(
        makeLinearLine(),
        {},
        {
          [TrainState.STOPPED]: 1000,
          [TrainState.DEPARTING]: 1000,
          [TrainState.RUNNING]: 1000,
          [TrainState.ARRIVING]: 1000,
        }
      )
      fsm.setAutoMode(true)
      expect(fsm.getState().isAutoMode).toBe(true)
      expect(fsm.getState().trainState).toBe(TrainState.STOPPED)

      vi.advanceTimersByTime(1000)
      expect(fsm.getState().trainState).toBe(TrainState.DEPARTING)

      vi.advanceTimersByTime(1000)
      expect(fsm.getState().trainState).toBe(TrainState.RUNNING)

      vi.advanceTimersByTime(1000)
      expect(fsm.getState().trainState).toBe(TrainState.ARRIVING)

      vi.advanceTimersByTime(1000)
      expect(fsm.getState().trainState).toBe(TrainState.STOPPED)
      fsm.destroy()
    })

    it('关闭自动模式后停止推进', () => {
      const fsm = new TrainFSM(makeLinearLine(), {}, { [TrainState.STOPPED]: 1000 })
      fsm.setAutoMode(true)
      vi.advanceTimersByTime(1000)
      expect(fsm.getState().trainState).toBe(TrainState.DEPARTING)

      fsm.setAutoMode(false)
      const stateBefore = fsm.getState().trainState
      vi.advanceTimersByTime(60000)
      expect(fsm.getState().trainState).toBe(stateBefore)
    })

    it('destroy 清除自动计时器', () => {
      const fsm = new TrainFSM(makeLinearLine(), {}, { [TrainState.STOPPED]: 1000 })
      fsm.setAutoMode(true)
      fsm.destroy()
      const stateBefore = fsm.getState().trainState
      vi.advanceTimersByTime(60000)
      expect(fsm.getState().trainState).toBe(stateBefore)
    })
  })
})
