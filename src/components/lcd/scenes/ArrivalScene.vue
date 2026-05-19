<template>
  <!-- 背景层：浅灰屏底（.arrival 容器底色） -->
  <div class="arrival" role="img" :aria-label="a11yLabel">
    <!-- 上半浅灰区：开门方向层 + 文字层 + 站点圆点层 -->
    <div class="arrival__stage">
      <!-- 开门方向层：右上角港铁式开门方向提示；数据缺失时不渲染 -->
      <div
        v-if="doorHint"
        class="arrival__door-hint"
        :class="`arrival__door-hint--${doorHint.variant}`"
        aria-hidden="true"
      >
        {{ doorHint.text }}
      </div>
      <!-- 文字层 + 圆点层：超大中文站名 / 白色实心圆点 / 英文站名横排 -->
      <div class="arrival__row">
        <!-- 文字层：超大中文站名 -->
        <div class="arrival__name">{{ station?.name }}</div>
        <!-- 站点圆点层：ARRIVING 时闪烁黄↔白实心，STOPPED/DEPARTING 时静态白实心 -->
        <div
          class="arrival__dot"
          :class="{ 'arrival__dot--flashing': isArriving }"
          aria-hidden="true"
        ></div>
        <!-- 文字层：英文站名 -->
        <div class="arrival__name-en">{{ station?.nameEn }}</div>
      </div>
    </div>

    <!-- 黄条层：下半黄色安全条 -->
    <div class="arrival__safety-bar">
      {{ safetyBarText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { TrainState } from '@/core/models/train'
import {
  getDisplayedArrivalStation,
  getSafetyBarText,
  getDoorHint,
} from '@/core/train-state-visuals'

const sim = useSimulationStore()

// 圆点闪烁判定：ARRIVING 时展示站即正驶向的下一站（getDisplayedArrivalStation
// 已保证此映射），圆点须与线路图下一站圆点同规律闪烁；其余状态静态白实心。
const isArriving = computed(() => sim.trainState === TrainState.ARRIVING)

// 展示站：按列车运行状态取（ARRIVING→nextStation、STOPPED/DEPARTING→currentStation、
// RUNNING→null）。站名、圆点、黄条、开门方向共用此展示站。复用 train-state-visuals 纯映射。
const station = computed(() =>
  getDisplayedArrivalStation(sim.trainState, sim.currentStation, sim.nextStation)
)

// 黄条层：文案按当前 TrainState 取自集中维护的映射，不在组件硬编码。
const safetyBarText = computed(() => getSafetyBarText(sim.trainState))

// 开门方向层：按展示站 doorSide 取提示（{text, variant} 或 null）；
// null 时不渲染该图层（数据缺失 fallback）。映射约定见 getDoorHint 注释。
const doorHint = computed(() => getDoorHint(station.value?.doorSide))

const a11yLabel = computed(() => {
  const name = station.value?.name ?? '未知站点'
  const nameEn = station.value?.nameEn ?? ''
  return `到站提示，${name} ${nameEn}`
})
</script>

<style scoped>
.arrival {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--lcd-bg);
}

/* 上半浅灰区：开门方向层（绝对定位右上角）+ 站名行 */
.arrival__stage {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(4px, 3vw, 16px);
  min-width: 0;
}

/* 站名行：中文站名 + 圆点 + 英文站名横向排布 */
.arrival__row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: clamp(8px, 2.5vw, 28px);
  /* clamp 下限经下调，使极窄屏（320/375px）下「站名行 + 黄条」最坏排版
     可放入 LcdScreen min-height 约束下的内容区，scrollHeight ≤ clientHeight、不被裁剪。 */
  min-width: 0;
}

/* 开门方向层：右上角港铁式开门方向提示（装饰性，参考港铁帧） */
.arrival__door-hint {
  position: absolute;
  top: clamp(4px, 2vw, 14px);
  right: clamp(4px, 2vw, 14px);
  /* max-width 限制使长英文提示在窄屏内换行而非把站名挤出视口 */
  max-width: 45%;
  box-sizing: border-box;
  font-family: var(--lcd-font-station);
  font-weight: bold;
  font-size: clamp(8px, 2vw, 15px);
  line-height: 1.15;
  text-align: center;
  overflow-wrap: anywhere;
}

/* 绿底白字态（doorSide right / both） */
.arrival__door-hint--green {
  background: var(--lcd-door-hint-green);
  color: var(--lcd-door-hint-text);
  padding: clamp(2px, 0.8vw, 6px) clamp(4px, 1.6vw, 12px);
  border-radius: 999px;
}

/* 深色字态（doorSide left，无绿底） */
.arrival__door-hint--dark {
  color: var(--lcd-fg);
}

/* 文字层：超大中文站名 */
.arrival__name {
  /* min-width:0 让 flex 子项可收缩到内容以下；overflow-wrap:anywhere
     使极窄屏（320px）下超长站名换行而非横向溢出被裁剪。 */
  min-width: 0;
  font-size: clamp(28px, 9vw, 72px);
  font-weight: bold;
  font-family: var(--lcd-font-station);
  color: var(--lcd-current-station);
  line-height: 1.1;
  overflow-wrap: anywhere;
  text-align: center;
}

/* 站点圆点层：静态态为白色实心圆点 + 深色描边 */
.arrival__dot {
  flex: 0 0 auto;
  width: clamp(20px, 6vw, 52px);
  height: clamp(20px, 6vw, 52px);
  border-radius: 50%;
  background: var(--lcd-station-dot);
  border: clamp(2px, 0.6vw, 4px) solid var(--lcd-fg);
  box-sizing: border-box;
}

/*
 * ARRIVING 态：圆点在「白实心」与「黄实心」两态间硬切闪烁（steps 跳变、非渐变），
 * 周期 2s，与线路图下一站圆点（FullRouteScene 的 station-dot-flash）一致。
 * border 由 .arrival__dot 提供、恒为 var(--lcd-fg) 深色，闪烁全程不变。
 */
.arrival__dot--flashing {
  animation: arrival-dot-flash 2s steps(1, end) infinite;
}

@keyframes arrival-dot-flash {
  /* 白实心态 */
  0% {
    background: var(--lcd-station-dot);
  }
  /* 黄实心态 */
  50% {
    background: var(--lcd-station-dot-upcoming);
  }
  /* 回到白实心态，保证循环无缝 */
  100% {
    background: var(--lcd-station-dot);
  }
}

/* 文字层：英文站名 */
.arrival__name-en {
  /* min-width:0 让 flex 子项可收缩；overflow-wrap:anywhere 让长英文站名
     （如 Hong Kong West Kowloon）在 320px 窄屏按词换行、不横向溢出。 */
  min-width: 0;
  font-size: clamp(14px, 4.5vw, 38px);
  font-family: var(--lcd-font-station-en);
  color: var(--lcd-current-station);
  line-height: 1.1;
  overflow-wrap: anywhere;
  text-align: center;
}

/* 黄条层：下半黄色安全条 */
.arrival__safety-bar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--lcd-safety-bar);
  color: var(--lcd-safety-bar-text);
  font-family: var(--lcd-font-station);
  font-weight: bold;
  font-size: clamp(11px, 3vw, 22px);
  padding: clamp(4px, 1.6vw, 12px);
  line-height: 1.2;
  text-align: center;
}
</style>
