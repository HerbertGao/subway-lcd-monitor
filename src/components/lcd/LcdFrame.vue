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
  background: #1a1a1a;
  border-radius: 12px;
  padding: 16px;
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
