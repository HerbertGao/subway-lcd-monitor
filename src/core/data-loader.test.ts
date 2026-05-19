import { describe, it, expect } from 'vitest'
import { loadNetwork, loadLine, listCities, loadAllLines } from './data-loader'

describe('data-loader', () => {
  describe('loadNetwork', () => {
    it('正常加载已存在城市的线网数据', () => {
      const network = loadNetwork('beijing')
      expect(network.city).toBe('北京')
      expect(network.cityEn).toBe('Beijing')
      expect(network.lines).toContain('line-yanfang')
    })

    it('城市数据文件缺失时抛错', () => {
      expect(() => loadNetwork('atlantis')).toThrow(/线网数据文件不存在/)
    })
  })

  describe('loadLine', () => {
    it('正常加载已存在线路的数据', () => {
      const line = loadLine('beijing', 'line-yanfang')
      expect(line.id).toBe('line-yanfang')
      expect(line.name).toBe('燕房线')
      expect(line.isLoop).toBe(false)
      expect(line.stations.length).toBeGreaterThan(0)
    })

    it('线路数据文件缺失时抛错', () => {
      expect(() => loadLine('beijing', 'line-nonexistent')).toThrow(/线路数据文件不存在/)
    })

    it('城市不存在时加载线路也抛错', () => {
      expect(() => loadLine('atlantis', 'line-yanfang')).toThrow(/线路数据文件不存在/)
    })
  })

  describe('listCities', () => {
    it('列出所有可用城市', () => {
      const cities = listCities()
      expect(cities).toContain('beijing')
    })
  })

  describe('loadAllLines', () => {
    it('加载城市下的所有线路', () => {
      const lines = loadAllLines('beijing')
      expect(lines.length).toBeGreaterThan(0)
      expect(lines.map((l) => l.id)).toContain('line-yanfang')
    })

    it('城市不存在时抛错', () => {
      expect(() => loadAllLines('atlantis')).toThrow(/线网数据文件不存在/)
    })
  })
})
