<template>
  <div ref="screenRef" class="lcd-screen">
    <div class="lcd-screen__header">
      <span class="lcd-screen__line-name" :style="{ color: activeLine?.color }">
        {{ activeLine?.name }}
      </span>
      <span class="lcd-screen__direction"> 往 {{ directionLabel }} 方向 </span>
    </div>
    <div class="lcd-screen__content">
      <Transition :name="transitionName" mode="out-in">
        <component :is="currentSceneComponent" :key="currentScene?.id" />
      </Transition>
    </div>
    <div class="lcd-screen__footer">
      <span class="lcd-screen__state">{{ trainStateLabel }}</span>
      <span class="lcd-screen__station">{{ currentStation?.name }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, type Component } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { useTheme } from '@/composables/useTheme'
import { Direction } from '@/core/models/train'
import FullRouteScene from './scenes/FullRouteScene.vue'
import NearbyScene from './scenes/NearbyScene.vue'
import ArrivalScene from './scenes/ArrivalScene.vue'

const sim = useSimulationStore()
const { currentTheme, injectCSSVariables } = useTheme()

const screenRef = ref<HTMLElement | null>(null)
injectCSSVariables(screenRef)

const activeLine = computed(() => sim.activeLine)
const currentStation = computed(() => sim.currentStation)
const currentScene = computed(() => sim.currentScene)
const trainStateLabel = computed(() => sim.trainStateLabel)
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

const directionLabel = computed(() => {
  if (!activeLine.value) return ''
  const stations = activeLine.value.stations
  if (sim.direction === Direction.FORWARD) {
    return stations[stations.length - 1].name
  }
  return stations[0].name
})
</script>

<style scoped>
.lcd-screen {
  background: var(--lcd-bg, #001428);
  color: var(--lcd-fg, #ffffff);
  font-family: var(--lcd-font-info);
  width: 100%;
  aspect-ratio: 3 / 1;
  /* 极窄屏（约 320/375px）下严格 3∶1 会把 LCD 屏压到约 90px 高，
     内容区扣除 header/footer 后不足以容纳 ArrivalScene 含换乘行的最小排版，
     会被 .lcd-screen__content 的 overflow:hidden 静默裁剪。
     min-height 让宽 ÷ 3 < min-height 时高度让步、宽高比大于 3∶1。
     取值依据（320px 视口，按 clamp 下限 + 最坏情况推算）：
     header≈22 + footer≈21 + ArrivalScene「两行换乘 badge 且开门提示
     文本换行」的最坏排版≈141 ≈184，留余量取 210px。
     宽屏（视口≥约 960px）下 LCD 屏宽 ÷ 3 ≈ 308px > 210px，仍维持精确 3∶1。 */
  min-height: 210px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.lcd-screen__header {
  background: var(--lcd-header-bg, #002850);
  color: var(--lcd-header-fg, #ffffff);
  padding: clamp(4px, 1.2vw, 8px) clamp(8px, 2.5vw, 16px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: clamp(12px, 2.5vw, 16px);
  flex-shrink: 0;
}

.lcd-screen__line-name {
  font-weight: bold;
  font-size: clamp(13px, 2.8vw, 18px);
}

.lcd-screen__content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.lcd-screen__footer {
  background: var(--lcd-header-bg, #002850);
  padding: clamp(3px, 1vw, 6px) clamp(8px, 2.5vw, 16px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: clamp(11px, 2.2vw, 14px);
  flex-shrink: 0;
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
