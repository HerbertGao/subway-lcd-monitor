<template>
  <!-- 背景层：浅灰屏底（.arrival 容器底色） -->
  <div class="arrival" role="img" :aria-label="a11yLabel">
    <!-- 上半浅灰区：文字层 + 站点圆点层横排 -->
    <div class="arrival__stage">
      <!-- 文字层：超大中文站名 -->
      <div class="arrival__name">{{ station?.name }}</div>
      <!-- 站点圆点层：白色实心圆点 -->
      <div class="arrival__dot" aria-hidden="true"></div>
      <!-- 文字层：英文站名 -->
      <div class="arrival__name-en">{{ station?.nameEn }}</div>
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

const sim = useSimulationStore()

const station = computed(() => sim.nextStation)

// 黄条层：本期固定占位文案（状态化文案属期二）
const safetyBarText = '請小心空隙 Please mind the gap'

const a11yLabel = computed(() => {
  const name = station.value?.name ?? '未知站点'
  const nameEn = station.value?.nameEn ?? ''
  return `到站提示，下一站 ${name} ${nameEn}`
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

/* 上半浅灰区：中文站名 + 圆点 + 英文站名横向排布 */
.arrival__stage {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: clamp(8px, 2.5vw, 28px);
  /* clamp 下限经下调，使极窄屏（320/375px）下「站名行 + 黄条」最坏排版
     可放入 LcdScreen min-height 约束下的内容区，scrollHeight ≤ clientHeight、不被裁剪。 */
  padding: clamp(4px, 3vw, 16px);
  min-width: 0;
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

/* 站点圆点层：白色实心圆点 + 深色描边 */
.arrival__dot {
  flex: 0 0 auto;
  width: clamp(20px, 6vw, 52px);
  height: clamp(20px, 6vw, 52px);
  border-radius: 50%;
  background: var(--lcd-station-dot);
  border: clamp(2px, 0.6vw, 4px) solid var(--lcd-fg);
  box-sizing: border-box;
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
