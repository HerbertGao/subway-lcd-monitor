<template>
  <div class="full-route">
    <!-- 线路图本体区：flex:1，以屏底色铺满，SVG 内容垂直居中 -->
    <div class="full-route__canvas">
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

        <!-- 文字层：站名中文（上）/ 英文（下），已过站名转灰；字号按站间距自适应 -->
        <g class="layer-text">
          <g v-for="(station, i) in stations" :key="'text-' + station.id">
            <text
              :x="stationX(i)"
              :y="lineY - 24"
              text-anchor="middle"
              :fill="isPassed(i) ? 'var(--lcd-passed-station)' : 'var(--lcd-current-station)'"
              :font-size="nameFit(i, station).fontSize"
              :font-weight="i === currentIndex ? 'bold' : 'normal'"
              font-family="var(--lcd-font-station)"
              :textLength="
                nameFit(i, station).needsCompression
                  ? nameFit(i, station).availableWidth
                  : undefined
              "
              :lengthAdjust="
                nameFit(i, station).needsCompression ? 'spacingAndGlyphs' : undefined
              "
            >
              {{ station.name }}
            </text>
            <text
              :x="stationX(i)"
              :y="lineY - 9"
              text-anchor="middle"
              :fill="isPassed(i) ? 'var(--lcd-passed-station)' : 'var(--lcd-future-station)'"
              :font-size="nameEnFit(i, station).fontSize"
              font-family="var(--lcd-font-station-en)"
              :textLength="
                nameEnFit(i, station).needsCompression
                  ? nameEnFit(i, station).availableWidth
                  : undefined
              "
              :lengthAdjust="
                nameEnFit(i, station).needsCompression ? 'spacingAndGlyphs' : undefined
              "
            >
              {{ station.nameEn }}
            </text>
          </g>
        </g>
      </svg>
    </div>

    <!-- 底部蓝色提示条：独立 HTML 元素，固定高度、贴 LCD 屏底 -->
    <div class="full-route__info-bar">{{ infoBarText }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { useTheme } from '@/composables/useTheme'
import { Direction } from '@/core/models/train'
import { INFO_BAR_MESSAGES } from '@/core/train-state-visuals'
import { useRouteLayout } from './useRouteLayout'
import { fitStationLabel } from './stationLabelFit'
import type { Station } from '@/core/models/network'

const sim = useSimulationStore()
const { currentTheme } = useTheme()

const stations = computed(() => sim.activeLine?.stations ?? [])
const lineColor = computed(() => sim.activeLine?.color ?? 'var(--lcd-line-color)')
const lineCap = computed(() => currentTheme.value.visual.lineCap)

// SVG 几何：蓝条已移出 SVG，viewBox 仅含线路图本体。
// 固定基准宽度（与站数无关），viewBox 宽高比贴近去蓝条后的 SVG 显示区域，
// 使 preserveAspectRatio="meet" 下整体缩放比稳定、不随站数漂移。
const padding = 60
const svgWidth = 700
const svgHeight = 170
const lineY = 110
const dotRadius = 7
const lineWidth = 6

// 站名基准字号
const BASE_NAME_FONT = 13
const BASE_NAME_FONT_CURRENT = 15
const BASE_NAME_EN_FONT = 9
const BASE_NAME_EN_FONT_CURRENT = 10

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

// 相邻站间距（viewBox user unit）：站名自适应的可用宽度依据
const stationGap = computed(() => {
  const count = stations.value.length
  if (count <= 1) return svgWidth - padding * 2
  return (svgWidth - padding * 2) / (count - 1)
})

function nameFit(i: number, station: Station) {
  const base = i === currentIndex.value ? BASE_NAME_FONT_CURRENT : BASE_NAME_FONT
  return fitStationLabel(station.name, base, stationGap.value)
}

function nameEnFit(i: number, station: Station) {
  const base = i === currentIndex.value ? BASE_NAME_EN_FONT_CURRENT : BASE_NAME_EN_FONT
  return fitStationLabel(station.nameEn, base, stationGap.value)
}

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
  flex-direction: column;
  background: var(--lcd-bg);
}

/* 线路图本体区：占据蓝条以上全部空间，以屏底色铺满、内容垂直居中 */
.full-route__canvas {
  flex: 1;
  min-height: 0;
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

/* 底部蓝色提示条：固定高度、不收缩、恒贴 LCD 屏底边 */
.full-route__info-bar {
  flex: 0 0 auto;
  height: 13%;
  min-height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--lcd-info-bar);
  color: var(--lcd-info-bar-text);
  font-family: var(--lcd-font-info);
  font-size: clamp(10px, 1.8vw, 14px);
  line-height: 1;
}

/*
 * 下一站圆点闪烁：在「黄实心」与「白实心」两态间硬切（steps 跳变、非渐变），
 * 周期 2s（黄≈1s、白≈1s）。fill 由本 class 的 animation 控制、两态均为实心；
 * stroke 恒为深色、不随相位改变。<circle> 上不设同名 SVG presentation 属性以免覆盖。
 */
.station-dot--next {
  stroke: var(--lcd-fg);
  animation: station-dot-flash 2s steps(1, end) infinite;
}

@keyframes station-dot-flash {
  /* 黄实心态 */
  0% {
    fill: var(--lcd-station-dot-upcoming);
  }
  /* 白实心态 */
  50% {
    fill: var(--lcd-station-dot);
  }
  /* 回到黄实心态，保证循环无缝 */
  100% {
    fill: var(--lcd-station-dot-upcoming);
  }
}
</style>
