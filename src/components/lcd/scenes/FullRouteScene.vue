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
              :lengthAdjust="nameFit(i, station).needsCompression ? 'spacingAndGlyphs' : undefined"
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

        <!--
          换乘标签层：transfers 非空的站在圆点下方渲染换乘线路名牌。
          但「正在渲染换乘支线的那个换乘站」不渲染换乘标签 —— 换乘信息已由
          换乘支线（含支线线路名牌）完整表达，避免名牌重复与竖向连接杆穿过名牌。
        -->
        <g class="layer-transfer">
          <template v-for="(station, i) in stations" :key="'tf-' + station.id">
            <g
              v-for="plate in transferPlatesFor(i, station)"
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

        <!--
          换乘支线层（条件图层）：仅当「下一站为换乘站」时渲染。
          在换乘站圆点下方以换乘线路自身色画一条短支线（线路条 + 站点圆点），
          并以一根竖向连接杆 + 换乘环把支线锚定到当前线路上的换乘站。
          下一站非换乘站、或换乘线路均不可解析时不渲染（transferBranches 为空）。
        -->
        <g v-if="transferBranches.length > 0" class="layer-transfer-branch">
          <template v-for="branch in transferBranches" :key="'branch-' + branch.id">
            <!-- 连接杆：从换乘站圆点垂直向下连到支线线路条 -->
            <line
              :x1="branch.anchorX"
              :y1="lineY"
              :x2="branch.anchorX"
              :y2="branch.branchY"
              stroke="var(--lcd-fg)"
              stroke-width="5"
              stroke-linecap="round"
            />
            <line
              :x1="branch.anchorX"
              :y1="lineY"
              :x2="branch.anchorX"
              :y2="branch.branchY"
              :stroke="branch.color"
              stroke-width="2.5"
              stroke-linecap="round"
            />
            <!-- 支线线路条：换乘线路自身色 -->
            <line
              :x1="branch.x1"
              :y1="branch.branchY"
              :x2="branch.x2"
              :y2="branch.branchY"
              :stroke="branch.color"
              stroke-width="5"
              stroke-linecap="round"
            />
            <!-- 支线站点圆点 -->
            <circle
              v-for="dot in branch.dots"
              :key="'branch-dot-' + branch.id + '-' + dot.id"
              :cx="dot.x"
              :cy="branch.branchY"
              :r="dot.isInterchange ? branchDotRadius + 1 : branchDotRadius"
              :fill="dot.isInterchange ? 'var(--lcd-station-dot)' : branch.color"
              stroke="var(--lcd-fg)"
              stroke-width="1.5"
            />
            <!-- 换乘节点环：套在当前线路换乘站圆点上 -->
            <circle
              :cx="branch.anchorX"
              :cy="lineY"
              :r="dotRadius + 4"
              fill="none"
              stroke="var(--lcd-fg)"
              stroke-width="2.5"
            />
            <!-- 支线线路名牌 -->
            <rect
              :x="branch.labelX"
              :y="branch.labelY - 9"
              :width="branch.labelWidth"
              height="18"
              rx="9"
              :fill="branch.color"
            />
            <text
              :x="branch.labelX + branch.labelWidth / 2"
              :y="branch.labelY"
              text-anchor="middle"
              dominant-baseline="central"
              fill="#ffffff"
              font-size="10"
              font-family="var(--lcd-font-station)"
            >
              {{ branch.name }}
            </text>
          </template>
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
import { useLineStore } from '@/stores/line'
import { useTheme } from '@/composables/useTheme'
import { Direction, TrainState } from '@/core/models/train'
import { INFO_BAR_MESSAGES, getTransferHintText } from '@/core/train-state-visuals'
import { resolveTransferBranches } from '@/core/local-network'
import { useRouteLayout } from './useRouteLayout'
import { fitStationLabel, estimateTextWidth } from './stationLabelFit'
import type { Station } from '@/core/models/network'

const sim = useSimulationStore()
const lineStore = useLineStore()
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

// 换乘支线几何：支线站点圆点半径，及多条支线的纵向布局参数。
// 一个换乘站可有多条换乘线路 —— 每条支线按 index 纵向错位排开、互不重叠。
//
// 布局策略（收口版）：用「固定行高」而非「gap 自动压缩到任意小」。
// 每条支线占据一个高度恒为 BRANCH_ROW_HEIGHT 的行，行内自上而下放：
// 名牌上方档预留 → 支线线路条（5 宽）+ 站点圆点（半径至多 branchDotRadius+1）
// → 名牌（高 18）。固定行高 ≥ 名牌(18) + 圆点直径(~12) + 安全间距，
// 确保相邻支线的线路条 / 圆点 / 名牌任意两者都不相交。
// 据可用竖向空间算出最多可渲染条数 N，超出 N 的支线不渲染图形
// （底部蓝条换乘文案仍含全部换乘线路名）。
const branchDotRadius = 4
// 换乘支线名牌高度（与模板 rect height 一致）。
const BRANCH_LABEL_HEIGHT = 18
// 单条支线固定行高：名牌(18) + 圆点直径(~12) + 安全间距(12) = 42。
// 该值确保「名牌上方档」fallback（labelY = branchY - 16）也不会压到
// 相邻（上一条）支线的线路条 / 圆点。
const BRANCH_ROW_HEIGHT = 42
// 最底一条支线线路条纵坐标：其名牌底边 = Y + 9，须落在 svgHeight 内。
const BRANCH_BOTTOM_Y = 156
// 首条（最顶）支线线路条距主线 lineY 的最小净空（连接杆 + 换乘环 + 圆点余量）。
const BRANCH_MIN_TOP_Y = lineY + 22
// 可用竖向区间内最多可排布的支线条数（固定行高、至少 1）。
// 顶部行的线路条不得高于 BRANCH_MIN_TOP_Y。
const BRANCH_MAX_RENDERED = Math.max(
  1,
  Math.floor((BRANCH_BOTTOM_Y - BRANCH_MIN_TOP_Y) / BRANCH_ROW_HEIGHT) + 1
)

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

// 换乘名牌：基准字号、内边距、行距、首枚距圆点的垂直偏移
const BASE_TRANSFER_FONT = 10
const TRANSFER_PAD_X = 6
const TRANSFER_PLATE_HEIGHT = 15
const TRANSFER_PLATE_GAP = 3
const TRANSFER_TOP_OFFSET = 12

/**
 * 计算某站换乘名牌的渲染布局。
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

/**
 * 渲染某站的换乘标签 —— 但当该站正在渲染换乘支线时返回空，
 * 由换乘支线（含支线线路名牌）完整表达换乘信息，消除名牌重复与重叠。
 */
function transferPlatesFor(i: number, station: Station) {
  if (i === branchAnchorIndex.value) return []
  return transferPlates(station)
}

/**
 * 「下一站为换乘站」判定 —— 解析出的**全部**换乘线路（未做渲染条数裁剪）。
 *
 * 仅 `RUNNING` 状态、`sim.nextStation` 的 `transfers` 含至少一个可在
 * `line` store `availableLines` 解析到的换乘线路时非空。其余情形为空数组。
 * 底部蓝条换乘文案据此生成 —— 含全部换乘线路名，不受支线渲染条数上限影响。
 */
const resolvedBranches = computed(() => {
  if (sim.trainState !== TrainState.RUNNING) return []
  const next = sim.nextStation
  if (!next) return []
  return resolveTransferBranches(next, lineStore.availableLines, sim.activeLine?.id ?? null)
})

/**
 * 换乘支线渲染数据。
 *
 * 由 `resolvedBranches` 派生：每条支线在主线下方画一段短线路条
 * （含至多 BRANCH_MAX_DOTS 个站点圆点），以竖向连接杆 + 换乘环锚定到
 * 当前线路上的换乘站圆点。可用竖向空间只够排 BRANCH_MAX_RENDERED 条，
 * 超出的支线不渲染图形（蓝条文案仍含全部 —— 见 resolvedBranches）。
 */
const BRANCH_MAX_DOTS = 5

const transferBranches = computed(() => {
  const branches = resolvedBranches.value
  if (branches.length === 0) return []
  const next = sim.nextStation
  if (!next) return []

  // 换乘站在当前线路（全程图）中的索引 → 锚定 x 坐标
  const nextIndex = stations.value.findIndex((s) => s.id === next.id)
  if (nextIndex < 0) return []
  const anchorX = stationX(nextIndex)

  // 支线水平跨度：固定占屏宽一段，居中对齐换乘站、并夹在内边距内
  const branchSpan = Math.min(svgWidth * 0.34, svgWidth - padding * 2)
  let x1 = anchorX - branchSpan / 2
  let x2 = anchorX + branchSpan / 2
  if (x1 < padding) {
    x1 = padding
    x2 = padding + branchSpan
  } else if (x2 > svgWidth - padding) {
    x2 = svgWidth - padding
    x1 = x2 - branchSpan
  }

  // 多条换乘支线纵向错位布局：固定行高 BRANCH_ROW_HEIGHT，自底
  // （BRANCH_BOTTOM_Y）向上依次叠放，index 越小越靠下。可用竖向空间
  // 只够排 BRANCH_MAX_RENDERED 条 —— 超出的支线不渲染图形（蓝条文案仍含全部）。
  // 不再压缩间距，保证任意条数下相邻支线的线路条 / 圆点 / 名牌互不相交。
  const renderable = branches.slice(0, BRANCH_MAX_RENDERED)

  return renderable.map((branch, branchIndex) => {
    // 本条支线线路条纵坐标：index 0 最靠下，依次上移一个固定行高。
    const thisBranchY = BRANCH_BOTTOM_Y - branchIndex * BRANCH_ROW_HEIGHT
    // 支线站点：换乘线路全部站点，过多时以换乘站为中心取一段窗口
    const all = branch.stations
    let slice = all
    let icIdx = branch.interchangeIndex
    if (all.length > BRANCH_MAX_DOTS) {
      let start = Math.max(0, (icIdx < 0 ? 0 : icIdx) - Math.floor(BRANCH_MAX_DOTS / 2))
      start = Math.min(start, all.length - BRANCH_MAX_DOTS)
      slice = all.slice(start, start + BRANCH_MAX_DOTS)
      icIdx = icIdx < 0 ? -1 : icIdx - start
    }
    const count = slice.length
    const dots = slice.map((s, si) => ({
      id: s.id,
      x: count <= 1 ? (x1 + x2) / 2 : x1 + (si / (count - 1)) * (x2 - x1),
      isInterchange: si === icIdx,
    }))
    const labelWidth = Math.max(40, estimateTextWidth(branch.name, 10) + 12)
    // 支线线路名牌定位：优先放在支线起点左侧；左侧空间不足（如支线起点
    // 紧贴左内边距，名牌会遮住支线起点与首个站点圆点）时改放支线右端
    // 外侧；左右均放不下则放到支线线路条「竖向空当」里 —— 须避让相邻支线。
    const labelGap = 6
    // 名牌竖向偏移量：名牌中心距本条线路条的距离。名牌半高 9 + 圆点半径
    // (branchDotRadius+1) + 安全间距，使名牌不压本条线路条 / 圆点。
    const labelYOffset = BRANCH_LABEL_HEIGHT / 2 + (branchDotRadius + 1) + 4
    let labelX: number
    let labelY: number
    if (x1 - labelWidth - labelGap >= padding) {
      // 左侧空间充足：名牌置于支线起点左侧、与线路条垂直居中。
      labelX = x1 - labelWidth - labelGap
      labelY = thisBranchY
    } else if (x2 + labelGap + labelWidth <= svgWidth - padding) {
      // 左侧不足、右侧充足：名牌置于支线右端外侧、与线路条垂直居中。
      labelX = x2 + labelGap
      labelY = thisBranchY
    } else {
      // 左右均不足：名牌移到本条线路条的竖向空当并避让相邻支线。
      // 相邻支线在固定行高下分别位于 thisBranchY ± BRANCH_ROW_HEIGHT，
      // 名牌偏移量 labelYOffset < BRANCH_ROW_HEIGHT，故放在「下方空当」
      // （thisBranchY + labelYOffset）不会触及下一条支线；但最底一条
      // （branchIndex 0）下方无空间、改放「上方空当」—— 其上无支线，
      // 名牌顶边 thisBranchY - labelYOffset - 9 仍在 BRANCH_MIN_TOP_Y
      // 下方、不侵入主线区。
      labelX = (x1 + x2) / 2 - labelWidth / 2
      labelY = branchIndex === 0 ? thisBranchY - labelYOffset : thisBranchY + labelYOffset
    }
    return {
      id: branch.id,
      name: branch.name,
      nameEn: branch.nameEn,
      color: branch.color,
      anchorX,
      branchY: thisBranchY,
      x1,
      x2,
      dots,
      labelWidth,
      labelX,
      labelY,
    }
  })
})

/**
 * 正在渲染换乘支线的换乘站在全程图中的索引。
 *
 * 换乘支线非空时即为「下一站」在当前线路中的索引（所有支线锚定同一换乘站）；
 * 无支线渲染时为 -1。换乘标签层据此对该站不再渲染独立换乘标签，避免与支线
 * 的竖向连接杆 / 支线线路名牌堆叠重复。
 */
const branchAnchorIndex = computed(() => {
  if (transferBranches.value.length === 0) return -1
  const next = sim.nextStation
  if (!next) return -1
  return stations.value.findIndex((s) => s.id === next.id)
})

/**
 * 底部蓝色提示条文案。
 *
 * 下一站为换乘站时切换为换乘提示文案（按换乘线路中英文名集中生成），
 * 否则取集中维护的港铁式通用提示语集（src/core/train-state-visuals.ts）。
 * 文案据 `resolvedBranches`（全部换乘线路）生成 —— 即便支线图形因竖向
 * 空间不足只渲染了前 N 条，蓝条文案仍列出全部换乘线路名。
 */
const infoBarText = computed(() => {
  if (resolvedBranches.value.length > 0) {
    return getTransferHintText(
      resolvedBranches.value.map((b) => ({ name: b.name, nameEn: b.nameEn }))
    )
  }
  return INFO_BAR_MESSAGES[0]
})

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
