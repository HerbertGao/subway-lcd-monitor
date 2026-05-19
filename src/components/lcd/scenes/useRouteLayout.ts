import { computed, type ComputedRef } from 'vue'
import type { Station } from '@/core/models/network'
import { Direction, TrainState } from '@/core/models/train'
import { getStationDotState, type StationDotState } from '@/core/train-state-visuals'
import { useSimulationStore } from '@/stores/simulation'

/**
 * 港铁线路图场景共享布局逻辑（图层式分层架构的「线路层 / 站点层 / 标记层」共用计算）。
 *
 * FullRouteScene 与 NearbyScene 共用此组合式函数：两者只是可见站点范围不同，
 * 站点坐标、双色线路条分段、行进方向箭头的几何计算完全一致，故抽出复用。
 * 层间通过明确输入（stations 范围）通信，不读取调用方内部状态。
 */
export interface RouteLayoutOptions {
  /** 本场景渲染的站点序列（全程或近段切片） */
  stations: ComputedRef<Station[]>
  /** 当前站在 stations 序列中的索引（不在范围内时为 -1） */
  currentVisibleIndex: ComputedRef<number>
  /** SVG 画布宽度 */
  svgWidth: ComputedRef<number> | number
  /** SVG 画布高度 */
  svgHeight: number
  /** 站点圆点居中的纵坐标 */
  lineY: number
  /** 线路条左右内边距 */
  padding: number
  /** 站点圆点半径 */
  dotRadius: number
}

export function useRouteLayout(opts: RouteLayoutOptions) {
  const sim = useSimulationStore()

  const isForward = computed(() => sim.direction === Direction.FORWARD)
  const isRunning = computed(() => sim.trainState === TrainState.RUNNING)

  const width = computed(() =>
    typeof opts.svgWidth === 'number' ? opts.svgWidth : opts.svgWidth.value
  )

  /** 站点圆点横坐标 */
  function stationX(index: number): number {
    const count = opts.stations.value.length
    if (count <= 1) return width.value / 2
    const usable = width.value - opts.padding * 2
    return opts.padding + (index / (count - 1)) * usable
  }

  /**
   * 某站点是否已过。
   * 运行中出发站也算已过，与阶段三既有判定保持一致。
   */
  function isPassed(visibleIndex: number): boolean {
    const cur = opts.currentVisibleIndex.value
    if (cur < 0) return false
    if (isForward.value) {
      return isRunning.value ? visibleIndex <= cur : visibleIndex < cur
    }
    return isRunning.value ? visibleIndex >= cur : visibleIndex > cur
  }

  /**
   * 判定某站点圆点的状态（已过 / 未过 / 下一站）。
   *
   * 复用 `src/core/train-state-visuals.ts` 的纯映射 `getStationDotState`：
   * - `next`：该站为列车正驶向的下一站（`id === simulation.nextStation?.id`）
   * - `passed`：已过站（沿用 `isPassed` 判定）
   * - `upcoming`：其余未过站
   *
   * 「下一站」优先于「已过」判定（见纯映射约定）。组件据此着色，
   * 其中 `next` 态应用闪烁动画。
   *
   * @param visibleIndex 站点在本场景 stations 序列中的索引
   * @param station 站点对象（用于与 `nextStation` 比对 id）
   */
  function dotState(visibleIndex: number, station: Station): StationDotState {
    const isNext = sim.nextStation?.id === station.id
    return getStationDotState(isPassed(visibleIndex), isNext)
  }

  /** 当前站索引（即灰 / 未过色的分界点，行进方向箭头落点） */
  const currentIndex = computed(() => opts.currentVisibleIndex.value)

  /**
   * 双色线路条分段：已过段灰、未过段线路自身色。
   * 返回自底向上叠加用的线段列表（先整条未过色，再叠已过段灰色）。
   */
  const lineSegments = computed(() => {
    const stations = opts.stations.value
    if (stations.length < 1) return []
    const x1 = stationX(0)
    const x2 = stationX(stations.length - 1)
    const cur = currentIndex.value
    const segments: { x1: number; x2: number; passed: boolean }[] = []
    // 基础整条线（未过色）
    segments.push({ x1, x2, passed: false })
    if (cur >= 0) {
      const cx = stationX(Math.min(Math.max(cur, 0), stations.length - 1))
      if (isForward.value && cur > 0) {
        segments.push({ x1, x2: cx, passed: true })
      } else if (!isForward.value && cur < stations.length - 1) {
        segments.push({ x1: cx, x2, passed: true })
      }
    }
    return segments
  })

  /**
   * 行进方向箭头：定位在「最后一个已过站与下一站之间」的线路段中部。
   *
   * 取下一站（`sim.nextStation`）在本场景可见序列中的索引，与其相邻的已过站
   * 构成区间，箭头落在两站 `stationX` 的中点附近、实心三角指向行进方向。
   * 下一站不在可见范围（或无下一站）时不渲染。
   */
  const directionArrow = computed(() => {
    const stations = opts.stations.value
    const nextId = sim.nextStation?.id
    if (!nextId) return null
    const nextIdx = stations.findIndex((s) => s.id === nextId)
    if (nextIdx < 0) return null
    // 最后一个已过站：行进方向上紧邻下一站的前一站
    const passedIdx = isForward.value ? nextIdx - 1 : nextIdx + 1
    if (passedIdx < 0 || passedIdx > stations.length - 1) return null
    const mid = (stationX(passedIdx) + stationX(nextIdx)) / 2
    // 箭头尺寸与站点圆点直径（2×dotRadius）相近、不大于圆点：
    // 总高 = 2h ≈ 1.4×dotRadius，总宽 = w ≈ 1.0×dotRadius。
    const h = opts.dotRadius * 0.7
    const w = opts.dotRadius * 1.0
    if (isForward.value) {
      // 向右箭头，置于区间线段中部
      const base = mid - w / 2
      return `${base},${opts.lineY - h} ${base},${opts.lineY + h} ${base + w},${opts.lineY}`
    }
    // 向左箭头，置于区间线段中部
    const base = mid + w / 2
    return `${base},${opts.lineY - h} ${base},${opts.lineY + h} ${base - w},${opts.lineY}`
  })

  return {
    isForward,
    stationX,
    isPassed,
    dotState,
    lineSegments,
    directionArrow,
  }
}
