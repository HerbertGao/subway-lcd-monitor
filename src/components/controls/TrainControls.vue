<template>
  <div class="train-controls">
    <button
      class="train-controls__btn train-controls__btn--primary"
      :disabled="!sim.activeLine"
      @click="sim.next()"
    >
      下一步
    </button>

    <button
      class="train-controls__btn"
      :class="{ 'train-controls__btn--active': sim.isAutoMode }"
      :disabled="!sim.activeLine"
      role="switch"
      :aria-checked="sim.isAutoMode"
      aria-label="自动运行"
      @click="sim.setAutoMode(!sim.isAutoMode)"
    >
      {{ sim.isAutoMode ? '自动运行中' : '手动模式' }}
    </button>

    <button
      class="train-controls__btn"
      :disabled="!canToggleDirection"
      @click="sim.toggleDirection()"
    >
      切换方向
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { TrainState } from '@/core/models/train'

const sim = useSimulationStore()

const canToggleDirection = computed(() => {
  return sim.activeLine && sim.trainState === TrainState.STOPPED
})
</script>

<style scoped>
.train-controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.train-controls__btn {
  background: #2a2a3e;
  color: #eee;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.train-controls__btn:hover:not(:disabled) {
  background: #3a3a4e;
  border-color: #666;
}

.train-controls__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.train-controls__btn--primary {
  background: #335588;
  border-color: #4477aa;
}

.train-controls__btn--primary:hover:not(:disabled) {
  background: #4477aa;
}

.train-controls__btn--active {
  background: #2a6633;
  border-color: #44aa55;
}
</style>
