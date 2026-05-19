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
  /* 960px LCD 设计基准（7∶2 比例下高度由 LcdScreen 的 aspect-ratio 派生，
     约 960 × 2/7 ≈ 274px）+ 外框 chrome（padding 16px×2 + border 2px×2 = 36px）
     → 含外框整体设计宽 996px。box-sizing: border-box 使 padding/border 计入
     width，配合 width: min(996px, 100%) + max-width: 100% 保证含外框整体在
     窄屏（320–1280px）收缩适应可用宽度、不溢出、不产生横向滚动。 */
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
