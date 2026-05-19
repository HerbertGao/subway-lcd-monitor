import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { Line, Station } from '@/core/models/network'
import { TrainState } from '@/core/models/train'
import { useSimulationStore } from './simulation'

/**
 * simulation store 的 `updateScenes()` 场景列表测试。
 *
 * 换乘网络信息已融入全程线路图（不再有独立的 `network-map` 场景），故
 * `updateScenes()` 的场景列表恒为 `theme.scenes[trainState]` 基础列表，
 * 不再随是否临近换乘站做条件拼接。
 */

function makeStation(id: string, transferLineIds: string[] = []): Station {
  return {
    id,
    name: id,
    nameEn: id,
    doorSide: 'left',
    transfers: transferLineIds.map((lineId) => ({
      lineId,
      lineName: lineId,
      lineColor: '#000000',
    })),
  }
}

function makeLine(id: string, stations: Station[]): Line {
  return { id, name: id, nameEn: id, color: '#ff0000', stations, isLoop: false }
}

describe('simulation store - updateScenes 场景列表', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('场景列表不含已移除的独立 network-map 场景', () => {
    const mainLine = makeLine('l-main', [
      makeStation('s0'),
      makeStation('s1', ['l-transfer']),
      makeStation('s2'),
    ])

    const sim = useSimulationStore()
    sim.init(mainLine)

    expect(sim.trainState).toBe(TrainState.STOPPED)
    expect(sim.sceneList.some((s) => s.id === 'network-map')).toBe(false)
  })

  it('RUNNING 下一站为换乘站时场景列表仍为基础线路图列表、不插入独立场景', () => {
    const mainLine = makeLine('l-main', [
      makeStation('s0'),
      makeStation('s1', ['l-transfer']),
      makeStation('s2'),
    ])

    const sim = useSimulationStore()
    sim.init(mainLine)
    // STOPPED → DEPARTING → RUNNING
    sim.next()
    sim.next()

    expect(sim.trainState).toBe(TrainState.RUNNING)
    expect(sim.nextStation?.id).toBe('s1')
    expect(sim.sceneList.some((s) => s.id === 'network-map')).toBe(false)
    // RUNNING 场景列表恒为主题基础线路图列表
    expect(sim.sceneList.map((s) => s.id)).toEqual(['full-route', 'nearby'])
  })
})
