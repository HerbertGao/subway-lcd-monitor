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
:root {
  /* 页面外壳背景：与浅色港铁 LCD 屏协调的中性深灰。
     属应用外壳、不属 LCD 屏主题范畴，故不纳入主题系统 ColorConfig；
     在此集中以单一 CSS 变量承载，避免色值散落硬编码于多个组件。 */
  --app-shell-bg: #26272b;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--app-shell-bg);
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
