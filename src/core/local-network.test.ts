import { describe, it, expect } from 'vitest'
import type { Line, Station } from './models/network'
import { resolveTransferBranches } from './local-network'

/** 构造测试站点的便捷工厂。 */
function station(id: string, name: string, transfers: Station['transfers'] = []): Station {
  return { id, name, nameEn: name, transfers, doorSide: 'right' }
}

/** 构造测试线路的便捷工厂。 */
function line(id: string, name: string, color: string, stations: Station[]): Line {
  return { id, name, nameEn: name + ' Line', color, stations, isLoop: false }
}

describe('resolveTransferBranches', () => {
  // 燕房线（简化）与房山线（简化），两线在阎村东互为换乘
  const fangshan = line('fangshan', '房山线', '#d4007f', [
    station('fs-1', '阎村东', [{ lineId: 'yanfang', lineName: '燕房线', lineColor: '#ed8b00' }]),
    station('fs-2', '紫草坞'),
    station('fs-3', '阎村'),
  ])
  const yanfang = line('yanfang', '燕房线', '#ed8b00', [
    station('yf-1', '燕山'),
    station('yf-2', '星城'),
    station('yf-3', '阎村东', [{ lineId: 'fangshan', lineName: '房山线', lineColor: '#d4007f' }]),
  ])

  describe('可解析换乘线路', () => {
    it('换乘站解析出换乘线路及其站点序列 / 颜色', () => {
      const branches = resolveTransferBranches(
        yanfang.stations[2], // 阎村东
        [yanfang, fangshan],
        'yanfang'
      )
      expect(branches).toHaveLength(1)
      expect(branches[0].id).toBe('fangshan')
      expect(branches[0].name).toBe('房山线')
      expect(branches[0].nameEn).toBe('房山线 Line')
      expect(branches[0].color).toBe('#d4007f')
      expect(branches[0].stations).toHaveLength(3)
    })

    it('换乘站在换乘线路中的索引按站名匹配', () => {
      const branches = resolveTransferBranches(
        yanfang.stations[2], // 阎村东，在房山线为首站（index 0）
        [yanfang, fangshan],
        'yanfang'
      )
      expect(branches[0].interchangeIndex).toBe(0)
    })

    it('换乘站在换乘线路中无同名站时索引为 -1', () => {
      const oddLine = line('odd', '怪线', '#abcdef', [station('o-1', '别处')])
      const branches = resolveTransferBranches(
        station('x-1', '换乘站', [{ lineId: 'odd', lineName: '怪线', lineColor: '#abcdef' }]),
        [oddLine],
        'main'
      )
      expect(branches[0].interchangeIndex).toBe(-1)
    })
  })

  describe('无换乘', () => {
    it('换乘站为 transfers 空 → 返回空数组', () => {
      const branches = resolveTransferBranches(
        yanfang.stations[0], // 燕山，无换乘
        [yanfang, fangshan],
        'yanfang'
      )
      expect(branches).toEqual([])
    })

    it('换乘站为 null / undefined → 返回空数组', () => {
      expect(resolveTransferBranches(null, [yanfang], 'yanfang')).toEqual([])
      expect(resolveTransferBranches(undefined, [yanfang], 'yanfang')).toEqual([])
    })

    it('换乘项仅指向当前线路自身 → 返回空数组', () => {
      const branches = resolveTransferBranches(
        station('m-1', '甲', [{ lineId: 'main', lineName: '主线', lineColor: '#000000' }]),
        [line('main', '主线', '#000000', [])],
        'main'
      )
      expect(branches).toEqual([])
    })
  })

  describe('缺失线路降级', () => {
    it('换乘项指向的线路不在 allLines → 降级跳过、不报错', () => {
      const branches = resolveTransferBranches(
        station('m-1', '换乘站', [{ lineId: 'ghost', lineName: '幽灵线', lineColor: '#999999' }]),
        [yanfang, fangshan],
        'main'
      )
      expect(branches).toEqual([])
    })

    it('部分换乘线路缺失时仅纳入可解析的线路', () => {
      const branches = resolveTransferBranches(
        station('m-1', '阎村东', [
          { lineId: 'fangshan', lineName: '房山线', lineColor: '#d4007f' },
          { lineId: 'ghost', lineName: '幽灵线', lineColor: '#999999' },
        ]),
        [yanfang, fangshan],
        'main'
      )
      expect(branches.map((b) => b.id)).toEqual(['fangshan'])
    })
  })

  describe('边界情形', () => {
    it('同一换乘线路在 transfers 中重复出现时去重', () => {
      const branches = resolveTransferBranches(
        station('m-1', '阎村东', [
          { lineId: 'fangshan', lineName: '房山线', lineColor: '#d4007f' },
          { lineId: 'fangshan', lineName: '房山线', lineColor: '#d4007f' },
        ]),
        [yanfang, fangshan],
        'main'
      )
      expect(branches.map((b) => b.id)).toEqual(['fangshan'])
    })
  })
})
