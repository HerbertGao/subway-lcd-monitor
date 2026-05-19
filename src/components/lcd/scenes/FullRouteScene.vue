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

      <!-- 站点层：圆点按状态着色（已过白实心 / 未过黄实心 / 下一站闪烁） -->
      <g class="layer-dot">
        <template v-for="(station, i) in stations" :key="'dot-' + station.id">
          <!-- 下一站：fill/stroke 由 CSS class 动画控制，不设同名 SVG presentation 属性 -->
          <circle
            v-if="dotState(i, station) === 'next'"
            class="station-dot station-dot--next"
            :cx="stationX(i)"
            :cy="lineY"
            :r="i === currentIndex ? dotRadius + 2 : dotRadius"
            stroke-width="2"
          />
          <circle
            v-else
            :cx="stationX(i)"
            :cy="lineY"
            :r="i === currentIndex ? dotRadius + 2 : dotRadius"
            :fill="
              dotState(i, station) === 'passed'
                ? 'var(--lcd-station-dot)'
                : 'var(--lcd-station-dot-upcoming)'
            "
            stroke="var(--lcd-fg)"
            stroke-width="2"
          />
        </template>
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
import { INFO_BAR_MESSAGES } from '@/core/train-state-visuals'
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

const { stationX, isPassed, dotState, lineSegments, directionArrow } = useRouteLayout({
  stations,
  currentVisibleIndex: currentIndex,
  svgWidth,
  svgHeight,
  lineY,
  padding,
  dotRadius,
})

// 提示条层：取自集中维护的港铁式提示语集（src/core/train-state-visuals.ts）
const infoBarText = INFO_BAR_MESSAGES[0]

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

/*
 * 下一站圆点闪烁：在「黄实心」与「白空心」两态间硬切（steps 跳变、非渐变），
 * 周期 2s（黄≈1s、白空心≈1s）。fill/stroke 由本 class 的 animation 控制，
 * <circle> 上不设同名 SVG presentation 属性以免覆盖。
 */
.station-dot--next {
  animation: station-dot-flash 2s steps(1, end) infinite;
}

@keyframes station-dot-flash {
  /* 黄实心态 */
  0% {
    fill: var(--lcd-station-dot-upcoming);
    stroke: var(--lcd-fg);
  }
  /* 白空心态：填充屏底色（视觉为空心），白色描边圆环 */
  50% {
    fill: var(--lcd-bg);
    stroke: var(--lcd-station-dot);
  }
  /* 回到黄实心态，保证循环无缝 */
  100% {
    fill: var(--lcd-station-dot-upcoming);
    stroke: var(--lcd-fg);
  }
}
</style>
