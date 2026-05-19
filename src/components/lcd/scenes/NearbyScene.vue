<template>
  <div class="nearby">
    <svg :viewBox="`0 0 ${svgWidth} ${svgHeight}`" class="nearby__svg">
      <!-- 连线 -->
      <line
        :x1="nodeX(0)"
        :y1="lineY"
        :x2="nodeX(visibleStations.length - 1)"
        :y2="lineY"
        :stroke="lineColor"
        stroke-width="8"
        stroke-linecap="round"
      />

      <!-- 已过区间 (正向：从左到当前站) -->
      <line
        v-if="isForward && currentVisibleIndex > 0"
        :x1="nodeX(0)"
        :y1="lineY"
        :x2="nodeX(currentVisibleIndex)"
        :y2="lineY"
        stroke="var(--lcd-passed-station)"
        stroke-width="8"
        stroke-linecap="round"
      />
      <!-- 已过区间 (反向：从当前站到右) -->
      <line
        v-if="!isForward && currentVisibleIndex < visibleStations.length - 1"
        :x1="nodeX(currentVisibleIndex)"
        :y1="lineY"
        :x2="nodeX(visibleStations.length - 1)"
        :y2="lineY"
        stroke="var(--lcd-passed-station)"
        stroke-width="8"
        stroke-linecap="round"
      />

      <!-- 方向箭头 -->
      <polygon :points="arrowPoints" :fill="lineColor" />

      <!-- 区间箭头 ››› -->
      <polygon
        v-for="(chevron, ci) in allIntervalChevrons"
        :key="'chevron-' + ci"
        :points="chevron.points"
        :fill="chevron.color"
        opacity="0.9"
      />

      <!-- 站点 -->
      <g v-for="(station, i) in visibleStations" :key="station.id">
        <!-- 站点圆点 -->
        <circle
          :cx="nodeX(i)"
          :cy="lineY"
          :r="isHighlight(i) ? 12 : 8"
          :fill="nodeColor(i)"
          :stroke="isHighlight(i) ? '#fff' : 'none'"
          :stroke-width="isHighlight(i) ? 3 : 0"
        />

        <!-- 中文站名 -->
        <text
          :x="nodeX(i)"
          :y="lineY - 28"
          text-anchor="middle"
          :fill="nodeColor(i)"
          :font-size="isHighlight(i) ? 18 : 14"
          :font-weight="isHighlight(i) ? 'bold' : 'normal'"
          font-family="var(--lcd-font-station)"
        >
          {{ station.name }}
        </text>

        <!-- 英文站名 -->
        <text
          :x="nodeX(i)"
          :y="lineY - 42"
          text-anchor="middle"
          :fill="nodeColor(i)"
          :font-size="isHighlight(i) ? 11 : 9"
          font-family="var(--lcd-font-station-en)"
          opacity="0.8"
        >
          {{ station.nameEn }}
        </text>

        <!-- 换乘标记 -->
        <g v-if="station.transfers.length > 0">
          <rect
            v-for="(transfer, ti) in station.transfers"
            :key="transfer.lineId"
            :x="nodeX(i) - 28"
            :y="lineY + 22 + ti * 20"
            width="56"
            height="16"
            rx="8"
            :fill="transfer.lineColor"
          />
          <text
            v-for="(transfer, ti) in station.transfers"
            :key="transfer.lineId + '-text'"
            :x="nodeX(i)"
            :y="lineY + 34 + ti * 20"
            text-anchor="middle"
            fill="#fff"
            font-size="10"
            font-family="var(--lcd-font-station-en)"
          >
            {{ transfer.lineName }}
          </text>
        </g>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { Direction, TrainState } from '@/core/models/train'

const sim = useSimulationStore()

const RANGE = 2 // 前后各显示几站

const stations = computed(() => sim.activeLine?.stations ?? [])
const currentIndex = computed(() => sim.currentStationIndex)
const lineColor = computed(() => sim.activeLine?.color ?? 'var(--lcd-line-color)')
const isRunning = computed(() => sim.trainState === TrainState.RUNNING)

const visibleRange = computed(() => {
  const total = stations.value.length
  const cur = currentIndex.value
  const start = Math.max(0, cur - RANGE)
  const end = Math.min(total - 1, cur + RANGE)
  return { start, end }
})

const visibleStations = computed(() => {
  const { start, end } = visibleRange.value
  return stations.value.slice(start, end + 1)
})

const currentVisibleIndex = computed(() => {
  return currentIndex.value - visibleRange.value.start
})

/** 运行中高亮下一站，其他状态高亮当前站 */
const highlightIndex = computed(() => {
  if (isRunning.value) {
    return isForward.value
      ? Math.min(currentIndex.value + 1, stations.value.length - 1)
      : Math.max(currentIndex.value - 1, 0)
  }
  return currentIndex.value
})

const highlightVisibleIndex = computed(() => {
  return highlightIndex.value - visibleRange.value.start
})

function isHighlight(visibleIndex: number): boolean {
  return visibleIndex === highlightVisibleIndex.value
}

const svgWidth = 800
const svgHeight = 160
const lineY = 80
const padding = 80

function nodeX(visibleIndex: number): number {
  const count = visibleStations.value.length
  if (count <= 1) return svgWidth / 2
  const usable = svgWidth - padding * 2
  return padding + (visibleIndex / (count - 1)) * usable
}

const isForward = computed(() => sim.direction === Direction.FORWARD)

function isPassed(globalIndex: number): boolean {
  if (isForward.value) {
    return isRunning.value ? globalIndex <= currentIndex.value : globalIndex < currentIndex.value
  }
  return isRunning.value ? globalIndex >= currentIndex.value : globalIndex > currentIndex.value
}

function nodeColor(visibleIndex: number): string {
  if (isHighlight(visibleIndex)) return 'var(--lcd-current-station)'
  const globalIndex = visibleRange.value.start + visibleIndex
  if (isPassed(globalIndex)) return 'var(--lcd-passed-station)'
  return 'var(--lcd-future-station)'
}

/** 所有可见区间的 ››› 小箭头，已过区间灰色，未过区间高亮 */
const allIntervalChevrons = computed(() => {
  const total = visibleStations.value.length
  if (total < 2) return []

  const result: { points: string; color: string }[] = []
  const chevronCount = 3
  const chevronH = 6
  const chevronW = 5
  const dir = isForward.value ? 1 : -1

  for (let i = 0; i < total - 1; i++) {
    const fromX = nodeX(i)
    const toX = nodeX(i + 1)
    const gap = toX - fromX
    if (gap < 30) continue

    // 转为全局索引判断是否已过
    const globalI = visibleRange.value.start + i
    const passed = isForward.value
      ? globalI + 1 <= currentIndex.value
      : globalI >= currentIndex.value
    const color = passed ? 'var(--lcd-passed-station)' : 'var(--lcd-future-station)'

    for (let c = 0; c < chevronCount; c++) {
      const t = (c + 1) / (chevronCount + 1)
      const cx = fromX + t * gap
      if (dir > 0) {
        result.push({
          points: `${cx - chevronW},${lineY - chevronH} ${cx - chevronW},${lineY + chevronH} ${cx + chevronW},${lineY}`,
          color,
        })
      } else {
        result.push({
          points: `${cx + chevronW},${lineY - chevronH} ${cx + chevronW},${lineY + chevronH} ${cx - chevronW},${lineY}`,
          color,
        })
      }
    }
  }
  return result
})

const arrowPoints = computed(() => {
  const dir = sim.direction
  const last = visibleStations.value.length - 1
  if (dir === Direction.FORWARD) {
    const x = nodeX(last) + 20
    return `${x},${lineY - 8} ${x},${lineY + 8} ${x + 12},${lineY}`
  } else {
    const x = nodeX(0) - 20
    return `${x},${lineY - 8} ${x},${lineY + 8} ${x - 12},${lineY}`
  }
})
</script>

<style scoped>
.nearby {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}

.nearby__svg {
  width: 100%;
  height: 100%;
}
</style>
