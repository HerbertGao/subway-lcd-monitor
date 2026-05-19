import type { Network, Line } from './models/network'

const dataModules = import.meta.glob<Network | Line>('/src/data/**/*.json', {
  eager: true,
  import: 'default',
})

/** 加载指定城市的线网数据 */
export function loadNetwork(city: string): Network {
  const key = `/src/data/${city}/network.json`
  const data = dataModules[key]
  if (!data) {
    throw new Error(`线网数据文件不存在: ${key}`)
  }
  return data as Network
}

/** 加载指定城市下指定线路的数据 */
export function loadLine(city: string, lineId: string): Line {
  const key = `/src/data/${city}/lines/${lineId}.json`
  const data = dataModules[key]
  if (!data) {
    throw new Error(`线路数据文件不存在: ${key}`)
  }
  return data as Line
}

/** 获取所有可用的城市列表 */
export function listCities(): string[] {
  const cities = new Set<string>()
  for (const key of Object.keys(dataModules)) {
    const match = key.match(/^\/src\/data\/([^/]+)\/network\.json$/)
    if (match) {
      cities.add(match[1])
    }
  }
  return Array.from(cities)
}

/** 加载城市下的所有线路 */
export function loadAllLines(city: string): Line[] {
  const network = loadNetwork(city)
  return network.lines.map((lineId) => loadLine(city, lineId))
}
