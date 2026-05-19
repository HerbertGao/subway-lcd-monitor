<template>
  <div ref="screenRef" class="lcd-screen">
    <Transition :name="transitionName" mode="out-in">
      <component :is="currentSceneComponent" :key="currentScene?.id" />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, type Component } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { useTheme } from '@/composables/useTheme'
import FullRouteScene from './scenes/FullRouteScene.vue'
import NearbyScene from './scenes/NearbyScene.vue'
import ArrivalScene from './scenes/ArrivalScene.vue'

const sim = useSimulationStore()
const { currentTheme, injectCSSVariables } = useTheme()

const screenRef = ref<HTMLElement | null>(null)
injectCSSVariables(screenRef)

const currentScene = computed(() => sim.currentScene)
const transitionName = computed(() => `lcd-${currentTheme.value.transition}`)

const sceneComponentMap: Record<string, Component> = {
  'full-route': FullRouteScene,
  nearby: NearbyScene,
  arrival: ArrivalScene,
}

const currentSceneComponent = computed(() => {
  const sceneId = currentScene.value?.id
  if (!sceneId) return null
  // 主题覆盖的组件优先
  return currentScene.value?.component ?? sceneComponentMap[sceneId] ?? null
})
</script>

<style scoped>
.lcd-screen {
  background: var(--lcd-bg, #e8e8e8);
  color: var(--lcd-fg, #1a1a1a);
  font-family: var(--lcd-font-info);
  width: 100%;
  aspect-ratio: 7 / 2;
  /* 港铁式超宽横条比例 7∶2（3.5∶1）。
     极窄屏（约 320px 视口）下严格 7∶2 会把 LCD 屏压得过矮，
     不足以容纳最高场景（ArrivalScene 站名特写），内容会被本元素
     的 overflow:hidden 静默裁剪。min-height 在「宽 × 2/7 < min-height」
     时让高度让步、宽高比大于 7∶2。
     取值推导（320px 视口，按各 clamp 取下限实算 + 站名换行最坏情况）：
     - LcdFrame chrome（padding 2vw×2 ≈ 12.8 + border 2px×2 = 4）≈ 17，
       故 LCD 屏宽 ≈ 320 − 17 ≈ 303，7∶2 下自然高 ≈ 303 × 2/7 ≈ 87；
     - 最高场景 ArrivalScene（.arrival 为 flex column：.arrival__stage 横排区
       + .arrival__safety-bar 黄条）所需高度，按各 clamp 在 320px 下的实际下限：
         · .arrival__stage 上下内边距 clamp(4px,3vw,16px) → 3vw≈9.6 ×2 ≈ 19；
         · stage 横排内容高 = max(中文名 9vw≈28.8×1.1≈32、
           圆点 6vw→下限 20、英文名 4.5vw≈14.4×1.1≈16)；
           中文名超长时换行最坏约两行 ≈ 64，取 64；
         · .arrival__safety-bar 字号 clamp(11px,3vw,22px)→下限 11×1.2≈13
           + 上下内边距 clamp(4px,1.6vw,12px)→1.6vw≈5.1 ×2 ≈ 10，黄条 ≈ 23；
       合计 ≈ 19 + 64 + 23 ≈ 106。
     故 7∶2 自然高度（87）不足以容纳，min-height 须接管；106 + 余量取
     min-height: 160px（短站名单行时自然高 87 仍由 160 兜底，留足空白）。
     宽屏（视口≥约 560px）下 LCD 屏宽 × 2/7 ≥ 160px，仍维持精确 7∶2。 */
  min-height: 160px;
  display: flex;
  overflow: hidden;
}

/* 场景 Transition 渲染的场景组件占满整个 LCD 屏（整屏场景容器，无独立 header/footer） */
.lcd-screen > :deep(*) {
  flex: 1;
  min-width: 0;
}

/* Fade transition */
.lcd-fade-enter-active,
.lcd-fade-leave-active {
  transition: opacity 0.4s ease;
}
.lcd-fade-enter-from,
.lcd-fade-leave-to {
  opacity: 0;
}

/* Slide transition */
.lcd-slide-enter-active,
.lcd-slide-leave-active {
  transition: transform 0.4s ease;
}
.lcd-slide-enter-from {
  transform: translateX(100%);
}
.lcd-slide-leave-to {
  transform: translateX(-100%);
}
</style>
