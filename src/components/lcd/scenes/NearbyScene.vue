<template>
  <div class="nearby">
    <!-- 线路图本体区：flex:1，以屏底色铺满，SVG 内容垂直居中 -->
    <div class="nearby__canvas">
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

        <!-- 站点层：圆点按状态着色（已过白实心 / 未过黄实心 / 下一站闪烁） -->
        <g class="layer-dot">
          <template v-for="(station, i) in visibleStations" :key="'dot-' + station.id">
            <!-- 下一站：fill/stroke 由 CSS class 动画控制，不设同名 SVG presentation 属性 -->
            <circle
              v-if="dotState(i, station) === 'next'"
              class="station-dot station-dot--next"
              :cx="stationX(i)"
              :cy="lineY"
              :r="i === currentVisibleIndex ? dotRadius + 3 : dotRadius"
              stroke-width="3"
            />
            <circle
              v-else
              :cx="stationX(i)"
              :cy="lineY"
              :r="i === currentVisibleIndex ? dotRadius + 3 : dotRadius"
              :fill="
                dotState(i, station) === 'passed'
                  ? 'var(--lcd-station-dot)'
                  : 'var(--lcd-station-dot-upcoming)'
              "
              stroke="var(--lcd-fg)"
              stroke-width="3"
            />
          </template>
        </g>

        <!-- 标记层：区间线段中部行进方向箭头，与下一站圆点同步闪烁 -->
        <g class="layer-mark">
          <polygon
            v-if="directionArrow"
            class="direction-arrow"
            :points="directionArrow"
            stroke="var(--lcd-fg)"
            stroke-width="1.5"
          />
        </g>

        <!-- 文字层：站名中文（上）/ 英文（下），已过站名转灰；字号按站间距自适应 -->
        <g class="layer-text">
          <g v-for="(station, i) in visibleStations" :key="'text-' + station.id">
            <text
              :x="stationX(i)"
              :y="lineY - 34"
              text-anchor="middle"
              :fill="isPassed(i) ? 'var(--lcd-passed-station)' : 'var(--lcd-current-station)'"
              :font-size="nameFit(i, station).fontSize"
              :font-weight="i === currentVisibleIndex ? 'bold' : 'normal'"
              font-family="var(--lcd-font-station)"
              :textLength="
                nameFit(i, station).needsCompression
                  ? nameFit(i, station).availableWidth
                  : undefined
              "
              :lengthAdjust="nameFit(i, station).needsCompression ? 'spacingAndGlyphs' : undefined"
            >
              {{ station.name }}
            </text>
            <text
              :x="stationX(i)"
              :y="lineY - 16"
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

        <!-- 换乘标签层：transfers 非空的站在圆点下方渲染换乘线路名牌 -->
        <g class="layer-transfer">
          <template v-for="(station, i) in visibleStations" :key="'tf-' + station.id">
            <g
              v-for="plate in transferPlates(station)"
              :key="'tf-' + station.id + '-' + plate.lineId"
            >
              <rect
                :x="stationX(i) - plate.width / 2"
                :y="plate.y"
                :width="plate.width"
                :height="plate.height"
                :rx="plate.height / 2"
                :fill="plate.color"
                :stroke="plate.color"
                stroke-width="1"
              />
              <text
                :x="stationX(i)"
                :y="plate.y + plate.height / 2"
                text-anchor="middle"
                dominant-baseline="central"
                fill="#ffffff"
                :font-size="plate.fontSize"
                font-family="var(--lcd-font-station)"
                :textLength="plate.needsCompression ? plate.textWidth : undefined"
                :lengthAdjust="plate.needsCompression ? 'spacingAndGlyphs' : undefined"
              >
                {{ plate.lineName }}
              </text>
            </g>
          </template>
        </g>
      </svg>
    </div>

    <!-- 底部蓝色提示条：独立 HTML 元素，固定高度、贴 LCD 屏底 -->
    <div class="nearby__info-bar">{{ infoBarText }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { useTheme } from '@/composables/useTheme'
import { Direction } from '@/core/models/train'
import { INFO_BAR_MESSAGES } from '@/core/train-state-visuals'
import { useRouteLayout } from './useRouteLayout'
import { fitStationLabel, estimateTextWidth } from './stationLabelFit'
import type { Station } from '@/core/models/network'

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

// SVG 几何：蓝条已移出 SVG，viewBox 仅含线路图本体。
// 与全程线路图同构——固定基准宽度、viewBox 宽高比贴近去蓝条后的 SVG 显示区域。
const svgWidth = 700
const svgHeight = 170
const lineY = 110
const dotRadius = 9
const lineWidth = 8
const padding = 90

// 站名基准字号（近段图字号更大）
const BASE_NAME_FONT = 18
const BASE_NAME_FONT_CURRENT = 24
const BASE_NAME_EN_FONT = 11
const BASE_NAME_EN_FONT_CURRENT = 14

const { stationX, isPassed, dotState, lineSegments, directionArrow } = useRouteLayout({
  stations: visibleStations,
  currentVisibleIndex,
  svgWidth,
  svgHeight,
  lineY,
  padding,
  dotRadius,
})

// 相邻站间距（viewBox user unit）：站名自适应的可用宽度依据
const stationGap = computed(() => {
  const count = visibleStations.value.length
  if (count <= 1) return svgWidth - padding * 2
  return (svgWidth - padding * 2) / (count - 1)
})

function nameFit(i: number, station: Station) {
  const base = i === currentVisibleIndex.value ? BASE_NAME_FONT_CURRENT : BASE_NAME_FONT
  return fitStationLabel(station.name, base, stationGap.value)
}

function nameEnFit(i: number, station: Station) {
  const base = i === currentVisibleIndex.value ? BASE_NAME_EN_FONT_CURRENT : BASE_NAME_EN_FONT
  return fitStationLabel(station.nameEn, base, stationGap.value)
}

// 换乘名牌：近段图字号更大，与全程线路图版式一致
const BASE_TRANSFER_FONT = 14
const TRANSFER_PAD_X = 8
const TRANSFER_PLATE_HEIGHT = 20
const TRANSFER_PLATE_GAP = 4
const TRANSFER_TOP_OFFSET = 16

/**
 * 计算某站换乘名牌的渲染布局，与全程线路图版式一致。
 * transfers 非空时每个换乘项生成一枚名牌，颜色 / 文案取自 transfers 数据；
 * 文字字号复用 fitStationLabel 受站间距约束，名牌宽度据适配后文字宽度自适应；
 * 多个换乘项纵向叠放在圆点下方。
 */
function transferPlates(station: Station) {
  return station.transfers.map((tf, ti) => {
    const fit = fitStationLabel(tf.lineName, BASE_TRANSFER_FONT, stationGap.value)
    const textWidth = fit.needsCompression
      ? fit.availableWidth
      : estimateTextWidth(tf.lineName, fit.fontSize)
    const width = Math.min(textWidth + TRANSFER_PAD_X * 2, stationGap.value * 0.95)
    return {
      lineId: tf.lineId,
      lineName: tf.lineName,
      color: tf.lineColor,
      fontSize: fit.fontSize,
      needsCompression: fit.needsCompression,
      textWidth,
      width,
      height: TRANSFER_PLATE_HEIGHT,
      y: lineY + TRANSFER_TOP_OFFSET + ti * (TRANSFER_PLATE_HEIGHT + TRANSFER_PLATE_GAP),
    }
  })
}

// 提示条层：取自集中维护的港铁式提示语集（src/core/train-state-visuals.ts）
const infoBarText = INFO_BAR_MESSAGES[1]

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
  flex-direction: column;
  background: var(--lcd-bg);
}

/* 线路图本体区：占据蓝条以上全部空间，以屏底色铺满、内容垂直居中 */
.nearby__canvas {
  flex: 1;
  min-height: 0;
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

/* 底部蓝色提示条：固定高度、不收缩、恒贴 LCD 屏底边 */
.nearby__info-bar {
  flex: 0 0 auto;
  height: 13%;
  min-height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--lcd-info-bar);
  color: var(--lcd-info-bar-text);
  font-family: var(--lcd-font-info);
  font-size: clamp(11px, 2vw, 16px);
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

/*
 * 行进方向箭头闪烁：与下一站圆点 station-dot-flash 严格同相
 * （同 2s 周期、steps(1) 硬切、0%/50%/100% 相位一致）。
 * fill 在「绿实心」与「白实心」两态交替——绿态对应圆点黄态、白态对应圆点白态；
 * stroke 恒为深色、不随相位改变。
 */
.direction-arrow {
  stroke: var(--lcd-fg);
  animation: direction-arrow-flash 2s steps(1, end) infinite;
}

@keyframes direction-arrow-flash {
  /* 绿实心态（对应下一站圆点黄态） */
  0% {
    fill: var(--lcd-direction-arrow);
  }
  /* 白实心态（对应下一站圆点白态） */
  50% {
    fill: var(--lcd-station-dot);
  }
  /* 回到绿实心态，保证循环无缝 */
  100% {
    fill: var(--lcd-direction-arrow);
  }
}
</style>
