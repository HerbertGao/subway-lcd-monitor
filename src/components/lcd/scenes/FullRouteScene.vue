<template>
  <div class="full-route">
    <svg :viewBox="`0 0 ${svgWidth} ${svgHeight}`" class="full-route__svg">
      <!-- 线路连线 -->
      <line
        :x1="stationX(0)"
        :y1="lineY"
        :x2="stationX(stations.length - 1)"
        :y2="lineY"
        :stroke="lineColor"
        stroke-width="6"
        :stroke-linecap="lineCap"
      />

      <!-- 已过区间高亮 -->
      <line
        v-if="isForward && currentIndex > 0"
        :x1="stationX(0)"
        :y1="lineY"
        :x2="stationX(currentIndex)"
        :y2="lineY"
        stroke="var(--lcd-passed-station)"
        stroke-width="6"
        :stroke-linecap="lineCap"
      />
      <line
        v-if="!isForward && currentIndex < stations.length - 1"
        :x1="stationX(currentIndex)"
        :y1="lineY"
        :x2="stationX(stations.length - 1)"
        :y2="lineY"
        stroke="var(--lcd-passed-station)"
        stroke-width="6"
        :stroke-linecap="lineCap"
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
      <g v-for="(station, i) in stations" :key="station.id">
        <!-- 换乘标记（外圈） -->
        <rect
          v-if="station.transfers.length > 0"
          :x="stationX(i) - 9"
          :y="lineY - 9"
          width="18"
          height="18"
          rx="3"
          fill="none"
          :stroke="stationColor(i)"
          stroke-width="2"
        />

        <!-- 站点圆点 -->
        <circle
          :cx="stationX(i)"
          :cy="lineY"
          :r="isHighlight(i) ? 8 : 6"
          :fill="stationColor(i)"
          :stroke="isHighlight(i) ? '#fff' : 'none'"
          :stroke-width="isHighlight(i) ? 2 : 0"
        />

        <!-- 站名（中文） -->
        <text
          :x="stationX(i)"
          :y="lineY - 22"
          text-anchor="middle"
          :fill="stationColor(i)"
          :font-size="isHighlight(i) ? 13 : 11"
          :font-weight="isHighlight(i) ? 'bold' : 'normal'"
          font-family="var(--lcd-font-station)"
        >
          {{ station.name }}
        </text>

        <!-- 换乘线路标记 -->
        <g v-if="station.transfers.length > 0">
          <rect
            v-for="(transfer, ti) in station.transfers"
            :key="transfer.lineId"
            :x="stationX(i) - 16"
            :y="lineY + 20 + ti * 16"
            width="32"
            height="14"
            rx="7"
            :fill="transfer.lineColor"
          />
          <text
            v-for="(transfer, ti) in station.transfers"
            :key="transfer.lineId + '-text'"
            :x="stationX(i)"
            :y="lineY + 31 + ti * 16"
            text-anchor="middle"
            fill="#fff"
            font-size="9"
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
import { useTheme } from '@/composables/useTheme'
import { Direction, TrainState } from '@/core/models/train'

const sim = useSimulationStore()
const { currentTheme } = useTheme()

const stations = computed(() => sim.activeLine?.stations ?? [])
const currentIndex = computed(() => sim.currentStationIndex)
const lineColor = computed(() => sim.activeLine?.color ?? 'var(--lcd-line-color)')
const lineCap = computed(() => currentTheme.value.visual.lineCap)
const isRunning = computed(() => sim.trainState === TrainState.RUNNING)

const padding = 60
const svgHeight = 180
const svgWidth = computed(() => Math.max(stations.value.length * 90, 800))
const lineY = 90

function stationX(index: number): number {
  const count = stations.value.length
  if (count <= 1) return svgWidth.value / 2
  const usable = svgWidth.value - padding * 2
  return padding + (index / (count - 1)) * usable
}

const isForward = computed(() => sim.direction === Direction.FORWARD)

/** 运行中高亮下一站，其他状态高亮当前站 */
const highlightIndex = computed(() => {
  if (isRunning.value) {
    return isForward.value
      ? Math.min(currentIndex.value + 1, stations.value.length - 1)
      : Math.max(currentIndex.value - 1, 0)
  }
  return currentIndex.value
})

function isHighlight(index: number): boolean {
  return index === highlightIndex.value
}

function isPassed(index: number): boolean {
  if (isForward.value) {
    // 运行中：出发站也算已过
    return isRunning.value ? index <= currentIndex.value : index < currentIndex.value
  }
  return isRunning.value ? index >= currentIndex.value : index > currentIndex.value
}

function stationColor(index: number): string {
  if (isHighlight(index)) return 'var(--lcd-current-station)'
  if (isPassed(index)) return 'var(--lcd-passed-station)'
  return 'var(--lcd-future-station)'
}

/** 所有区间的 ››› 小箭头，已过区间灰色，未过区间高亮 */
const allIntervalChevrons = computed(() => {
  const total = stations.value.length
  if (total < 2) return []

  const result: { points: string; color: string }[] = []
  const chevronCount = 3
  const chevronH = 5
  const chevronW = 4
  const dir = isForward.value ? 1 : -1

  for (let i = 0; i < total - 1; i++) {
    const fromX = stationX(i)
    const toX = stationX(i + 1)
    const gap = toX - fromX
    if (gap < 30) continue

    // 区间 i→i+1 是否已过
    const passed = isForward.value ? i + 1 <= currentIndex.value : i >= currentIndex.value
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
  if (dir === Direction.FORWARD) {
    const x = stationX(stations.value.length - 1) + 15
    return `${x},${lineY - 6} ${x},${lineY + 6} ${x + 10},${lineY}`
  } else {
    const x = stationX(0) - 15
    return `${x},${lineY - 6} ${x},${lineY + 6} ${x - 10},${lineY}`
  }
})
</script>

<style scoped>
.full-route {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}

.full-route__svg {
  width: 100%;
  height: 100%;
}
</style>
