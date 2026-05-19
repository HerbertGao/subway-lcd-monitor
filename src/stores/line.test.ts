import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { Network, Line } from '@/core/models/network'

// 替换 data-loader：用 mock 函数构造缺失文件、有效数据、含校验问题数据等场景
vi.mock('@/core/data-loader', () => ({
  loadNetwork: vi.fn(),
  loadLine: vi.fn(),
  listCities: vi.fn(() => ['beijing']),
}))

import { loadNetwork, loadLine } from '@/core/data-loader'
import { useLineStore } from './line'

const mockedLoadNetwork = vi.mocked(loadNetwork)
const mockedLoadLine = vi.mocked(loadLine)

function makeStation(id: string, transferLineIds: string[] = []): Line['stations'][number] {
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

function makeLine(id: string, stations = [makeStation(`${id}-s1`), makeStation(`${id}-s2`)]): Line {
  return {
    id,
    name: id,
    nameEn: id,
    color: '#ff0000',
    stations,
    isLoop: false,
  }
}

function makeNetwork(city: string, lineIds: string[]): Network {
  return {
    city,
    cityEn: city,
    defaultThemeId: 'default',
    lines: lineIds,
  }
}

describe('line store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('成功加载城市后写入状态、loadError 为 null、无校验问题', () => {
    const network = makeNetwork('beijing', ['l1', 'l2'])
    const l1 = makeLine('l1')
    const l2 = makeLine('l2')
    mockedLoadNetwork.mockReturnValue(network)
    mockedLoadLine.mockImplementation((_city, lineId) => (lineId === 'l1' ? l1 : l2))

    const store = useLineStore()
    store.selectCity('beijing')

    expect(store.currentCity).toBe('beijing')
    expect(store.currentNetwork).toEqual(network)
    expect(store.availableLines).toEqual([l1, l2])
    expect(store.loadError).toBeNull()
    expect(store.validationErrors).toEqual([])
  })

  it('城市线网文件缺失时兜底，loadError.operation === loadNetwork，不抛出', () => {
    mockedLoadNetwork.mockImplementation(() => {
      throw new Error('线网数据文件不存在: /src/data/ghost/network.json')
    })

    const store = useLineStore()
    expect(() => store.selectCity('ghost')).not.toThrow()

    expect(store.loadError).not.toBeNull()
    expect(store.loadError?.operation).toBe('loadNetwork')
    expect(store.loadError?.city).toBe('ghost')
    expect(store.loadError?.message).toContain('ghost')
    expect(store.currentCity).toBeNull()
    expect(store.currentNetwork).toBeNull()
    expect(store.availableLines).toEqual([])
  })

  it('城市引用的某线路文件缺失时，loadError.operation === loadLine 且含 lineId', () => {
    const network = makeNetwork('beijing', ['l1', 'missing-line'])
    mockedLoadNetwork.mockReturnValue(network)
    mockedLoadLine.mockImplementation((_city, lineId) => {
      if (lineId === 'l1') return makeLine('l1')
      throw new Error(`线路数据文件不存在: /src/data/beijing/lines/${lineId}.json`)
    })

    const store = useLineStore()
    expect(() => store.selectCity('beijing')).not.toThrow()

    expect(store.loadError?.operation).toBe('loadLine')
    expect(store.loadError?.lineId).toBe('missing-line')
    expect(store.loadError?.city).toBe('beijing')
    expect(store.loadError?.message).toContain('missing-line')
    // 部分加载不得污染状态
    expect(store.currentCity).toBeNull()
    expect(store.availableLines).toEqual([])
  })

  it('加载失败不污染既有有效状态', () => {
    const network = makeNetwork('beijing', ['l1'])
    const l1 = makeLine('l1')
    mockedLoadNetwork.mockReturnValueOnce(network)
    mockedLoadLine.mockReturnValueOnce(l1)

    const store = useLineStore()
    store.selectCity('beijing')
    expect(store.currentCity).toBe('beijing')

    // 再选一个缺失城市
    mockedLoadNetwork.mockImplementationOnce(() => {
      throw new Error('线网数据文件不存在: /src/data/ghost/network.json')
    })
    store.selectCity('ghost')

    expect(store.loadError?.operation).toBe('loadNetwork')
    // 既有数据保持不变
    expect(store.currentCity).toBe('beijing')
    expect(store.currentNetwork).toEqual(network)
    expect(store.availableLines).toEqual([l1])
  })

  it('失败后再成功加载会清空 loadError', () => {
    const store = useLineStore()

    mockedLoadNetwork.mockImplementationOnce(() => {
      throw new Error('线网数据文件不存在: /src/data/ghost/network.json')
    })
    store.selectCity('ghost')
    expect(store.loadError).not.toBeNull()

    const network = makeNetwork('beijing', ['l1'])
    mockedLoadNetwork.mockReturnValueOnce(network)
    mockedLoadLine.mockReturnValueOnce(makeLine('l1'))
    store.selectCity('beijing')

    expect(store.loadError).toBeNull()
    expect(store.currentCity).toBe('beijing')
  })

  it('校验集成：含重复站点 ID / 无效换乘引用时写入 validationErrors 但不阻断加载', () => {
    const network = makeNetwork('beijing', ['l1'])
    // 重复站点 ID + 引用了不存在的换乘线路
    const l1 = makeLine('l1', [makeStation('dup', ['no-such-line']), makeStation('dup')])
    mockedLoadNetwork.mockReturnValue(network)
    mockedLoadLine.mockReturnValue(l1)

    const store = useLineStore()
    store.selectCity('beijing')

    // 校验问题非致命：线路仍正常加载
    expect(store.currentCity).toBe('beijing')
    expect(store.availableLines).toEqual([l1])
    expect(store.loadError).toBeNull()
    // 校验问题被记入状态
    expect(store.validationErrors.length).toBeGreaterThan(0)
    const types = store.validationErrors.map((e) => e.type)
    expect(types).toContain('duplicate-station-id')
    expect(types).toContain('invalid-transfer-ref')
  })

  it('selectLine 加载缺失线路时兜底，loadError 含 lineId', () => {
    const network = makeNetwork('beijing', ['l1'])
    mockedLoadNetwork.mockReturnValue(network)
    mockedLoadLine.mockReturnValueOnce(makeLine('l1'))

    const store = useLineStore()
    store.selectCity('beijing')

    mockedLoadLine.mockImplementationOnce(() => {
      throw new Error('线路数据文件不存在: /src/data/beijing/lines/gone.json')
    })
    expect(() => store.selectLine('gone')).not.toThrow()

    expect(store.loadError?.operation).toBe('loadLine')
    expect(store.loadError?.lineId).toBe('gone')
    expect(store.currentLine).toBeNull()
  })
})
