<template>
  <div class="nearby">
    <svg
      :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
      class="nearby__svg"
      role="img"
      aria-labelledby="nearby-title nearby-desc"
      preserveAspectRatio="xMidYMid meet"
    >
      <title id="nearby-title">附近站点图</title>
      <desc id="nearby-desc">{{ a11yDesc }}</desc>

      <!-- 背景层：浅灰屏底 -->
      <g class="layer-bg">
        <rect x="0" y="0" :width="svgWidth" :height="svgHeight" fill="var(--lcd-bg)" />
      </g>

      <!-- 线路层：双色线路条（已过段灰 / 未过段 line.color） -->
      <g class="layer-line">
        <line
          v-for="(seg, si) in lineSegments"
          :key="'seg-' + si"
          :x1="seg.x1"
          :y1="lineY"
          :x2="seg.x2"
          :y2="lineY"
          :stroke="seg.passed ? 'var(--lcd-passed-station)' : lineColor"
          :stroke-width="lineWidth"
          :stroke-linecap="lineCap"
        />
      </g>

      <!-- 站点层：统一白色实心圆点 -->
      <g class="layer-dot">
        <circle
          v-for="(station, i) in visibleStations"
          :key="'dot-' + station.id"
          :cx="stationX(i)"
          :cy="lineY"
          :r="i === currentVisibleIndex ? dotRadius + 3 : dotRadius"
          fill="var(--lcd-station-dot)"
          stroke="var(--lcd-fg)"
          stroke-width="3"
        />
      </g>

      <!-- 标记层：当前站处行进方向箭头 -->
      <g class="layer-mark">
        <polygon v-if="directionArrow" :points="directionArrow" fill="var(--lcd-fg)" />
      </g>

      <!-- 文字层：站名中文（上）/ 英文（下），已过站名转灰 -->
      <g class="layer-text">
        <g v-for="(station, i) in visibleStations" :key="'text-' + station.id">
          <text
            :x="stationX(i)"
            :y="lineY - 34"
            text-anchor="middle"
            :fill="isPassed(i) ? 'var(--lcd-passed-station)' : 'var(--lcd-current-station)'"
            :font-size="i === currentVisibleIndex ? 24 : 18"
            :font-weight="i === currentVisibleIndex ? 'bold' : 'normal'"
            font-family="var(--lcd-font-station)"
          >
            {{ station.name }}
          </text>
          <text
            :x="stationX(i)"
            :y="lineY - 16"
            text-anchor="middle"
            :fill="isPassed(i) ? 'var(--lcd-passed-station)' : 'var(--lcd-future-station)'"
            :font-size="i === currentVisibleIndex ? 14 : 11"
            font-family="var(--lcd-font-station-en)"
          >
            {{ station.nameEn }}
          </text>
        </g>
      </g>

      <!-- 提示条层：底部蓝色提示条 -->
      <g class="layer-info-bar">
        <rect
          x="0"
          :y="svgHeight - infoBarHeight"
          :width="svgWidth"
          :height="infoBarHeight"
          fill="var(--lcd-info-bar)"
        />
        <text
          :x="svgWidth / 2"
          :y="svgHeight - infoBarHeight / 2"
          text-anchor="middle"
          dominant-baseline="central"
          fill="var(--lcd-info-bar-text)"
          font-size="16"
          font-family="var(--lcd-font-info)"
        >
          {{ infoBarText }}
        </text>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { useTheme } from '@/composables/useTheme'
import { Direction } from '@/core/models/train'
import { useRouteLayout } from './useRouteLayout'

const sim = useSimulationStore()
const { currentTheme } = useTheme()

const RANGE = 2 // 当前站前后各显示几站

const stations = computed(() => sim.activeLine?.stations ?? [])
const currentIndex = computed(() => sim.currentStationIndex)
const lineColor = computed(() => sim.activeLine?.color ?? 'var(--lcd-line-color)')
const lineCap = computed(() => currentTheme.value.visual.lineCap)

const visibleRange = computed(() => {
  const total = stations.value.length
  const cur = currentIndex.value
  return {
    start: Math.max(0, cur - RANGE),
    end: Math.min(total - 1, cur + RANGE),
  }
})

const visibleStations = computed(() => {
  const { start, end } = visibleRange.value
  return stations.value.slice(start, end + 1)
})

const currentVisibleIndex = computed(() => currentIndex.value - visibleRange.value.start)

// SVG 几何
const svgWidth = 800
const svgHeight = 200
const infoBarHeight = 40
const lineY = 96
const dotRadius = 9
const lineWidth = 8
const padding = 90

const { stationX, isPassed, lineSegments, directionArrow } = useRouteLayout({
  stations: visibleStations,
  currentVisibleIndex,
  svgWidth,
  svgHeight,
  lineY,
  padding,
  dotRadius,
})

// 提示条层：本期固定占位文案（轮播文案属期二）
const infoBarText = '請勿倚靠車門 Please do not lean on doors'

const a11yDesc = computed(() => {
  const lineName = sim.activeLine?.name ?? '未选择线路'
  const stationName = sim.currentStation?.name ?? '未知站点'
  const directionName = sim.direction === Direction.FORWARD ? '正向运行' : '反向运行'
  return `${lineName}附近站点图，当前站${stationName}，${directionName}`
})
</script>

<style scoped>
.nearby {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--lcd-bg);
}

.nearby__svg {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
