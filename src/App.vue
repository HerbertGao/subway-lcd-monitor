<template>
  <div id="subway-monitor">
    <h1 class="app-title">地铁 LCD 报站显示屏模拟器</h1>
    <LcdFrame>
      <LcdScreen />
    </LcdFrame>
    <ControlPanel />
  </div>
</template>

<script setup lang="ts">
import LcdFrame from '@/components/lcd/LcdFrame.vue'
import LcdScreen from '@/components/lcd/LcdScreen.vue'
import ControlPanel from '@/components/controls/ControlPanel.vue'
import '@/themes/default/styles.css'
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
  padding: 24px;
}

.app-title {
  font-size: 20px;
  font-weight: 500;
  color: #aaa;
  letter-spacing: 2px;
}
</style>
