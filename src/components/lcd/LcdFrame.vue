<template>
  <div class="lcd-frame">
    <div class="lcd-frame__inner">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.lcd-frame {
  box-sizing: border-box;
  /* 960px LCD 设计基准 + 外框 chrome（padding 16px×2 + border 2px×2 = 36px） */
  width: min(996px, 100%);
  max-width: 100%;
  background: #1a1a1a;
  border-radius: 12px;
  padding: clamp(6px, 2vw, 16px);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  border: 2px solid #333;
}

.lcd-frame__inner {
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.5);
}
</style>
