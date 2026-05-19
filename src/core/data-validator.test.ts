import { describe, it, expect } from 'vitest'
import { validateLine, validateNetwork } from './data-validator'
import type { Line, Network, Station } from './models/network'

function makeStation(id: string, transfers: Station['transfers'] = []): Station {
  return {
    id,
    name: id,
    nameEn: id,
    transfers,
    doorSide: 'left',
  }
}

function makeLine(id: string, stations: Station[]): Line {
  return {
    id,
    name: id,
    nameEn: id,
    color: '#000000',
    stations,
    isLoop: false,
  }
}

function makeNetwork(lineIds: string[]): Network {
  return {
    city: '测试城市',
    cityEn: 'Test City',
    defaultThemeId: 'default',
    lines: lineIds,
  }
}

describe('data-validator', () => {
  describe('validateLine - 重复站点 ID', () => {
    it('线路含重复站点 ID 时产出 duplicate-station-id', () => {
      const line = makeLine('line-1', [makeStation('s1'), makeStation('s2'), makeStation('s1')])
      const network = makeNetwork(['line-1'])
      const errors = validateLine(line, network)
      const dup = errors.filter((e) => e.type === 'duplicate-station-id')
      expect(dup).toHaveLength(1)
      expect(dup[0].stationId).toBe('s1')
      expect(dup[0].lineId).toBe('line-1')
    })

    it('线路站点 ID 唯一时无重复站点错误', () => {
      const line = makeLine('line-1', [makeStation('s1'), makeStation('s2')])
      const network = makeNetwork(['line-1'])
      const errors = validateLine(line, network)
      expect(errors.filter((e) => e.type === 'duplicate-station-id')).toHaveLength(0)
    })
  })

  describe('validateLine - 无效换乘引用', () => {
    it('站点引用了不存在的换乘线路 ID 时产出 invalid-transfer-ref', () => {
      const station = makeStation('s1', [
        { lineId: 'line-unknown', lineName: '未知线', lineColor: '#fff' },
      ])
      const line = makeLine('line-1', [station])
      const network = makeNetwork(['line-1'])
      const errors = validateLine(line, network)
      const bad = errors.filter((e) => e.type === 'invalid-transfer-ref')
      expect(bad).toHaveLength(1)
      expect(bad[0].stationId).toBe('s1')
      expect(bad[0].message).toContain('line-unknown')
    })

    it('换乘引用指向有效线路 ID 时无错误', () => {
      const station = makeStation('s1', [
        { lineId: 'line-2', lineName: '二号线', lineColor: '#fff' },
      ])
      const line = makeLine('line-1', [station])
      const network = makeNetwork(['line-1', 'line-2'])
      const errors = validateLine(line, network)
      expect(errors.filter((e) => e.type === 'invalid-transfer-ref')).toHaveLength(0)
    })
  })

  describe('validateNetwork - 重复线路 ID', () => {
    it('线网含重复线路 ID 时产出 duplicate-line-id（而非 duplicate-station-id）', () => {
      const lines = [
        makeLine('line-1', [makeStation('s1')]),
        makeLine('line-1', [makeStation('s2')]),
      ]
      const network = makeNetwork(['line-1'])
      const errors = validateNetwork(network, lines)
      const dup = errors.filter((e) => e.type === 'duplicate-line-id')
      expect(dup).toHaveLength(1)
      expect(dup[0].lineId).toBe('line-1')
      expect(dup[0].type).toBe('duplicate-line-id')
      expect(errors.some((e) => e.type === 'duplicate-station-id')).toBe(false)
    })

    it('线网线路 ID 唯一时无重复线路错误', () => {
      const lines = [
        makeLine('line-1', [makeStation('s1')]),
        makeLine('line-2', [makeStation('s2')]),
      ]
      const network = makeNetwork(['line-1', 'line-2'])
      const errors = validateNetwork(network, lines)
      expect(errors.filter((e) => e.type === 'duplicate-line-id')).toHaveLength(0)
    })

    it('同时存在重复站点 ID 与重复线路 ID 时两类问题被分别标识', () => {
      const lines = [
        makeLine('line-1', [makeStation('s1'), makeStation('s1')]),
        makeLine('line-1', [makeStation('s2')]),
      ]
      const network = makeNetwork(['line-1'])
      const errors = validateNetwork(network, lines)
      expect(errors.filter((e) => e.type === 'duplicate-line-id')).toHaveLength(1)
      expect(errors.filter((e) => e.type === 'duplicate-station-id')).toHaveLength(1)
    })
  })
})
