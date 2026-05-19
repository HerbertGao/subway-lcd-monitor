import { computed, type ComputedRef } from 'vue'
import type { Station } from '@/core/models/network'
import { Direction, TrainState } from '@/core/models/train'
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

  /** 行进方向箭头（落在当前站处，无当前站则不渲染） */
  const directionArrow = computed(() => {
    const cur = currentIndex.value
    if (cur < 0) return null
    const cx = stationX(cur)
    const h = opts.dotRadius * 1.4
    const w = opts.dotRadius * 1.6
    if (isForward.value) {
      // 向右箭头，紧贴当前站右侧
      const base = cx + opts.dotRadius + 2
      return `${base},${opts.lineY - h} ${base},${opts.lineY + h} ${base + w},${opts.lineY}`
    }
    // 向左箭头，紧贴当前站左侧
    const base = cx - opts.dotRadius - 2
    return `${base},${opts.lineY - h} ${base},${opts.lineY + h} ${base - w},${opts.lineY}`
  })

  return {
    isForward,
    stationX,
    isPassed,
    lineSegments,
    directionArrow,
  }
}
