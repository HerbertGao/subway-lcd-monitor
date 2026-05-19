<template>
  <div id="subway-monitor">
    <h1 class="app-title">地铁 LCD 报站显示屏模拟器</h1>
    <ErrorBoundary>
      <LcdFrame>
        <LcdScreen />
      </LcdFrame>
      <ControlPanel />
    </ErrorBoundary>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted } from 'vue'
import LcdFrame from '@/components/lcd/LcdFrame.vue'
import LcdScreen from '@/components/lcd/LcdScreen.vue'
import ControlPanel from '@/components/controls/ControlPanel.vue'
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'
import { useSimulationStore } from '@/stores/simulation'
import '@/themes/default/styles.css'

const simulation = useSimulationStore()

onUnmounted(() => {
  // 根组件卸载时清理列车状态机与场景轮播持有的定时器。
  simulation.destroy()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #1a1a2e;
  color: #eee;
  min-height: 100vh;
}

#subway-monitor {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 24px;
  padding: clamp(8px, 4vw, 24px);
}

.app-title {
  font-size: 20px;
  font-weight: 500;
  color: #aaa;
  letter-spacing: 2px;
}

button:focus-visible,
select:focus-visible {
  outline: 2px solid #88aaff;
  outline-offset: 2px;
  border-radius: 6px;
}
</style>
