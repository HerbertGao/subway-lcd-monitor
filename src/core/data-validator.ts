import type { Line, Network } from './models/network'

export interface ValidationError {
  type: 'duplicate-station-id' | 'duplicate-line-id' | 'invalid-transfer-ref'
  message: string
  lineId: string
  stationId?: string
}

/** 校验单条线路数据：站点 ID 唯一性 */
function validateStationIds(line: Line): ValidationError[] {
  const errors: ValidationError[] = []
  const seen = new Set<string>()
  for (const station of line.stations) {
    if (seen.has(station.id)) {
      errors.push({
        type: 'duplicate-station-id',
        message: `线路 "${line.name}" (${line.id}) 中存在重复的站点 ID: "${station.id}"`,
        lineId: line.id,
        stationId: station.id,
      })
    }
    seen.add(station.id)
  }
  return errors
}

/** 校验换乘线路引用有效性 */
function validateTransferRefs(line: Line, network: Network): ValidationError[] {
  const errors: ValidationError[] = []
  const validLineIds = new Set(network.lines)
  for (const station of line.stations) {
    for (const transfer of station.transfers) {
      if (!validLineIds.has(transfer.lineId)) {
        errors.push({
          type: 'invalid-transfer-ref',
          message: `线路 "${line.name}" 的站点 "${station.name}" (${station.id}) 引用了无效的换乘线路 ID: "${transfer.lineId}"`,
          lineId: line.id,
          stationId: station.id,
        })
      }
    }
  }
  return errors
}

/** 校验线路数据 */
export function validateLine(line: Line, network: Network): ValidationError[] {
  return [...validateStationIds(line), ...validateTransferRefs(line, network)]
}

/** 校验整个线网数据 */
export function validateNetwork(network: Network, lines: Line[]): ValidationError[] {
  const errors: ValidationError[] = []

  // 线路 ID 唯一性
  const lineIdsSeen = new Set<string>()
  for (const line of lines) {
    if (lineIdsSeen.has(line.id)) {
      errors.push({
        type: 'duplicate-line-id',
        message: `城市 "${network.city}" 中存在重复的线路 ID: "${line.id}"`,
        lineId: line.id,
      })
    }
    lineIdsSeen.add(line.id)
    errors.push(...validateLine(line, network))
  }

  return errors
}
