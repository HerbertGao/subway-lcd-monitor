<template>
  <div ref="screenRef" class="lcd-screen">
    <div class="lcd-screen__header">
      <span class="lcd-screen__line-name" :style="{ color: activeLine?.color }">
        {{ activeLine?.name }}
      </span>
      <span class="lcd-screen__direction">
        往 {{ directionLabel }} 方向
      </span>
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
  'nearby': NearbyScene,
  'arrival': ArrivalScene,
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
  width: 960px;
  height: 320px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.lcd-screen__header {
  background: var(--lcd-header-bg, #002850);
  color: var(--lcd-header-fg, #ffffff);
  padding: 8px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  flex-shrink: 0;
}

.lcd-screen__line-name {
  font-weight: bold;
  font-size: 18px;
}

.lcd-screen__content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.lcd-screen__footer {
  background: var(--lcd-header-bg, #002850);
  padding: 6px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
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
