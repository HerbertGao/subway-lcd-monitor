<template>
  <!-- 背景层：浅灰屏底（.arrival 容器底色） -->
  <div class="arrival" role="img" :aria-label="a11yLabel">
    <!-- 上半浅灰区：开门方向层 + 文字层 + 站点圆点层 -->
    <div class="arrival__stage">
      <!-- 开门方向层：右上角港铁式开门方向提示，中英双语两行；数据缺失时不渲染 -->
      <div
        v-if="doorHint"
        class="arrival__door-hint"
        :class="`arrival__door-hint--${doorHint.variant}`"
        aria-hidden="true"
      >
        <span class="arrival__door-hint-zh">{{ doorHint.zh }}</span>
        <span class="arrival__door-hint-en">{{ doorHint.en }}</span>
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
    <!-- 「請小心空隙」类（STOPPED / ARRIVING）两端各渲染一个港铁式红圈警示图标，
         「請勿靠近車門」类（DEPARTING）不渲染；是否带图标由 safetyBarHasIcon 判定，
         黄条版式（高度）经 --has-icon 类名微调。 -->
    <div
      class="arrival__safety-bar"
      :class="{ 'arrival__safety-bar--has-icon': safetyBarHasIcon }"
    >
      <!--
        港铁式红圈警示图标（纯内联 SVG，无图片资源）：
        红圈 + 列车（车头/车门）+ 行人组合。图形单列于 <defs>，左右两端经
        <use> 复用同一组 path，避免重复定义。
      -->
      <svg
        v-if="safetyBarHasIcon"
        class="arrival__safety-defs"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <g id="arrival-safety-warning-icon">
            <!-- 红色圆环 -->
            <circle
              cx="32"
              cy="32"
              r="27"
              fill="none"
              stroke="var(--lcd-safety-icon, #d4001a)"
              stroke-width="7"
            />
            <!-- 列车车厢主体（车头），右侧 -->
            <path
              d="M33 16h11a4 4 0 0 1 4 4v20a3 3 0 0 1-3 3H33z"
              fill="var(--lcd-safety-icon, #d4001a)"
            />
            <!-- 车门：车厢上挖出的浅色门洞 -->
            <rect x="36" y="21" width="9" height="17" rx="1.5" fill="var(--lcd-bg)" />
            <!-- 行人头部，列车左侧 -->
            <circle cx="20" cy="20" r="5.4" fill="var(--lcd-safety-icon, #d4001a)" />
            <!-- 行人身躯与腿 -->
            <path
              d="M15.5 28h9l4 12h-4.2l-1.3-6-0.9 14h-3.4l-0.9-14-1.3 6H11.5z"
              fill="var(--lcd-safety-icon, #d4001a)"
            />
            <!-- 月台缺口横杠 -->
            <rect x="13" y="46" width="38" height="4" fill="var(--lcd-safety-icon, #d4001a)" />
          </g>
        </defs>
      </svg>
      <!-- 左端警示图标 -->
      <svg
        v-if="safetyBarHasIcon"
        class="arrival__safety-icon"
        viewBox="0 0 64 64"
        aria-hidden="true"
        focusable="false"
      >
        <use href="#arrival-safety-warning-icon" />
      </svg>
      <span class="arrival__safety-text">{{ safetyBarText }}</span>
      <!-- 右端警示图标：与左端同一图形（同一 <use>） -->
      <svg
        v-if="safetyBarHasIcon"
        class="arrival__safety-icon"
        viewBox="0 0 64 64"
        aria-hidden="true"
        focusable="false"
      >
        <use href="#arrival-safety-warning-icon" />
      </svg>
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
  safetyBarHasIcon as safetyBarHasIconFor,
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

// 黄条两端是否带港铁式红圈警示图标：判定取自 train-state-visuals 集中纯映射
//（「請小心空隙」类带、「請勿靠近車門」类不带），组件不硬编码。
const safetyBarHasIcon = computed(() => safetyBarHasIconFor(sim.trainState))

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

/* 开门方向层：右上角港铁式开门方向提示，中英双语两行（装饰性，参考港铁帧） */
.arrival__door-hint {
  position: absolute;
  top: clamp(4px, 2vw, 14px);
  right: clamp(4px, 2vw, 14px);
  /* max-width 限制使长英文提示在窄屏内换行而非把站名挤出视口 */
  max-width: 45%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: var(--lcd-font-station);
  font-weight: bold;
  line-height: 1.15;
  text-align: center;
  overflow-wrap: anywhere;
}

/* 中文提示行 */
.arrival__door-hint-zh {
  font-size: clamp(8px, 2vw, 15px);
}

/* 英文提示行：小字 */
.arrival__door-hint-en {
  font-size: clamp(6px, 1.5vw, 11px);
  font-weight: normal;
}

/*
 * 本侧开门态（doorSide right / both）：恒定 padding / border-radius 保持版式稳定，
 * background 与 color 由 door-hint-flash 动画在「绿底圆角胶囊（黑字）」与
 * 「黑字无底」两态间 steps(1) 硬切闪烁、周期 2s（design 决策 3）。
 */
.arrival__door-hint--green {
  padding: clamp(2px, 0.8vw, 6px) clamp(4px, 1.6vw, 12px);
  border-radius: 999px;
  animation: door-hint-flash 2s steps(1, end) infinite;
}

@keyframes door-hint-flash {
  /* 绿底圆角胶囊态：绿底 + 提示用文字色 */
  0% {
    background: var(--lcd-door-hint-green);
    color: var(--lcd-door-hint-text);
  }
  /* 黑字无底态：透明底 + 深色字 */
  50% {
    background: transparent;
    color: var(--lcd-fg);
  }
  /* 回到绿底态，保证循环无缝 */
  100% {
    background: var(--lcd-door-hint-green);
    color: var(--lcd-door-hint-text);
  }
}

/* 对侧开门态（doorSide left）：静态黑字无底、不加动画 */
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
  gap: clamp(6px, 2vw, 20px);
  background: var(--lcd-safety-bar);
  color: var(--lcd-safety-bar-text);
  font-family: var(--lcd-font-station);
  font-weight: bold;
  font-size: clamp(11px, 3vw, 22px);
  padding: clamp(4px, 1.6vw, 12px);
  line-height: 1.2;
  text-align: center;
}

/*
 * 带图标态（「請小心空隙」类）：黄条略加高以容纳两端图标，幅度小、
 * 仍在 LcdScreen min-height 约束内、不破坏窄屏不裁剪。
 */
.arrival__safety-bar--has-icon {
  padding-top: clamp(6px, 2.2vw, 16px);
  padding-bottom: clamp(6px, 2.2vw, 16px);
}

/* 黄条文字：与两端图标横向并排居中 */
.arrival__safety-text {
  min-width: 0;
  overflow-wrap: anywhere;
}

/* 黄条两端港铁式红圈警示图标（纯内联 SVG，随字号缩放、不裁剪） */
.arrival__safety-icon {
  flex: 0 0 auto;
  width: clamp(16px, 5vw, 36px);
  height: clamp(16px, 5vw, 36px);
}

/* 警示图标 <defs> 容器：仅承载共享图形定义，不占版面 */
.arrival__safety-defs {
  position: absolute;
  width: 0;
  height: 0;
}
</style>
