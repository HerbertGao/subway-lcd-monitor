/**
 * 换乘支线数据解析 —— 纯函数，不依赖 Vue。
 *
 * 全程线路图（`FullRouteScene`）在「下一站为换乘站」时，于该换乘站处渲染
 * 换乘线路「支线」。支线所需的数据（可换乘到的线路及其站点序列 / 颜色）
 * 由本模块的纯函数从换乘站的 `transfers` 与全部已加载线路解析得出。
 *
 * 设计依据 phase4-mtr-content 变更 design 决策 4。
 */
import type { Line, Station } from './models/network'

/** 一条可换乘到的支线。 */
export interface TransferBranch {
  /** 换乘线路 id */
  id: string
  /** 换乘线路中文名 */
  name: string
  /** 换乘线路英文名 */
  nameEn: string
  /** 换乘线路自身色（渲染支线线路条用） */
  color: string
  /** 换乘线路完整站点序列 */
  stations: Station[]
  /**
   * 该换乘站在换乘线路站点序列中的索引；
   * 在换乘线路中按站名匹配，匹配不到时为 -1。
   */
  interchangeIndex: number
}

/**
 * 解析某换乘站可换乘到的线路支线。
 *
 * 输入换乘站本身（其 `transfers`）与全部已加载线路 `allLines`，
 * 输出该站可解析到的换乘线路及其站点序列 / 颜色。
 * `transfers` 指向的线路不在 `allLines`（数据缺失）时降级跳过、不报错。
 * 指向 `currentLineId`（当前线路自身）的换乘项忽略。
 *
 * @param station 换乘站（来自当前线路的 `nextStation`）
 * @param allLines 全部已加载线路（来自 `line` store 的 `availableLines`）
 * @param currentLineId 当前线路 id（用于剔除指向自身的换乘项）
 * @returns 可解析的换乘支线列表；无可解析换乘线路时为空数组
 */
export function resolveTransferBranches(
  station: Station | null | undefined,
  allLines: readonly Line[],
  currentLineId: string | null | undefined
): TransferBranch[] {
  if (!station || station.transfers.length === 0) return []

  const lineById = new Map<string, Line>()
  for (const line of allLines) {
    lineById.set(line.id, line)
  }

  const branches: TransferBranch[] = []
  const seen = new Set<string>()

  for (const transfer of station.transfers) {
    if (transfer.lineId === currentLineId) continue
    if (seen.has(transfer.lineId)) continue
    const target = lineById.get(transfer.lineId)
    // transfers 指向的线路不在 allLines → 降级跳过、不报错
    if (!target) continue
    seen.add(transfer.lineId)
    branches.push({
      id: target.id,
      name: target.name,
      nameEn: target.nameEn,
      color: target.color,
      stations: target.stations,
      interchangeIndex: target.stations.findIndex((s) => s.name === station.name),
    })
  }

  return branches
}
