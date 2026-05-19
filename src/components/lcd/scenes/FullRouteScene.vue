<template>
  <div class="full-route">
    <svg
      :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
      class="full-route__svg"
      role="img"
      aria-labelledby="full-route-title full-route-desc"
      preserveAspectRatio="xMidYMid meet"
    >
      <title id="full-route-title">线路全程图</title>
      <desc id="full-route-desc">{{ a11yDesc }}</desc>

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
          v-for="(station, i) in stations"
          :key="'dot-' + station.id"
          :cx="stationX(i)"
          :cy="lineY"
          :r="i === currentIndex ? dotRadius + 2 : dotRadius"
          fill="var(--lcd-station-dot)"
          stroke="var(--lcd-fg)"
          stroke-width="2"
        />
      </g>

      <!-- 标记层：当前站处行进方向箭头 -->
      <g class="layer-mark">
        <polygon v-if="directionArrow" :points="directionArrow" fill="var(--lcd-fg)" />
      </g>

      <!-- 文字层：站名中文（上）/ 英文（下），已过站名转灰 -->
      <g class="layer-text">
        <g v-for="(station, i) in stations" :key="'text-' + station.id">
          <text
            :x="stationX(i)"
            :y="lineY - 24"
            text-anchor="middle"
            :fill="isPassed(i) ? 'var(--lcd-passed-station)' : 'var(--lcd-current-station)'"
            :font-size="i === currentIndex ? 15 : 13"
            :font-weight="i === currentIndex ? 'bold' : 'normal'"
            font-family="var(--lcd-font-station)"
          >
            {{ station.name }}
          </text>
          <text
            :x="stationX(i)"
            :y="lineY - 9"
            text-anchor="middle"
            :fill="isPassed(i) ? 'var(--lcd-passed-station)' : 'var(--lcd-future-station)'"
            :font-size="i === currentIndex ? 10 : 9"
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
          font-size="14"
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

const stations = computed(() => sim.activeLine?.stations ?? [])
const lineColor = computed(() => sim.activeLine?.color ?? 'var(--lcd-line-color)')
const lineCap = computed(() => currentTheme.value.visual.lineCap)

// SVG 几何
const padding = 60
const svgHeight = 200
const infoBarHeight = 36
const lineY = 96
const dotRadius = 7
const lineWidth = 6
const svgWidth = computed(() => Math.max(stations.value.length * 90, 800))

const currentIndex = computed(() => sim.currentStationIndex)

const { stationX, isPassed, lineSegments, directionArrow } = useRouteLayout({
  stations,
  currentVisibleIndex: currentIndex,
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
  return `${lineName}全程图，当前站${stationName}，${directionName}`
})
</script>

<style scoped>
.full-route {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--lcd-bg);
}

.full-route__svg {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
