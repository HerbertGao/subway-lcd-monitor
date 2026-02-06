<template>
  <div class="control-panel">
    <!-- 线路选择 -->
    <div class="control-panel__section">
      <h3 class="control-panel__title">线路选择</h3>
      <LineSelector />
    </div>

    <!-- 运行控制 -->
    <div class="control-panel__section">
      <h3 class="control-panel__title">运行控制</h3>
      <TrainControls />
    </div>

    <!-- 状态信息 -->
    <div class="control-panel__section" v-if="sim.activeLine">
      <h3 class="control-panel__title">状态信息</h3>
      <div class="control-panel__info">
        <div class="control-panel__info-item">
          <span class="control-panel__info-label">线路</span>
          <span class="control-panel__info-value" :style="{ color: sim.activeLine?.color }">
            {{ sim.activeLine?.name }}
          </span>
        </div>
        <div class="control-panel__info-item">
          <span class="control-panel__info-label">当前站</span>
          <span class="control-panel__info-value">{{ sim.currentStation?.name }}</span>
        </div>
        <div class="control-panel__info-item">
          <span class="control-panel__info-label">状态</span>
          <span class="control-panel__info-value">{{ sim.trainStateLabel }}</span>
        </div>
        <div class="control-panel__info-item">
          <span class="control-panel__info-label">方向</span>
          <span class="control-panel__info-value">{{ directionLabel }}</span>
        </div>
        <div class="control-panel__info-item">
          <span class="control-panel__info-label">模式</span>
          <span class="control-panel__info-value">{{ sim.isAutoMode ? '自动' : '手动' }}</span>
        </div>
      </div>
    </div>

    <!-- 场景切换 -->
    <div class="control-panel__section" v-if="sim.sceneList.length > 0">
      <h3 class="control-panel__title">画面切换</h3>
      <div class="control-panel__scenes">
        <button
          v-for="(scene, i) in sim.sceneList"
          :key="scene.id"
          class="control-panel__scene-btn"
          :class="{ 'control-panel__scene-btn--active': i === sim.currentSceneIndex }"
          @click="sim.goToScene(i)"
        >
          {{ scene.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { Direction } from '@/core/models/train'
import LineSelector from './LineSelector.vue'
import TrainControls from './TrainControls.vue'

const sim = useSimulationStore()

const directionLabel = computed(() => {
  if (!sim.activeLine) return ''
  const stations = sim.activeLine.stations
  if (sim.direction === Direction.FORWARD) {
    return `→ ${stations[stations.length - 1].name}`
  }
  return `→ ${stations[0].name}`
})
</script>

<style scoped>
.control-panel {
  background: #222233;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 960px;
}

.control-panel__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-panel__title {
  font-size: 13px;
  color: #888;
  font-weight: normal;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.control-panel__info {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.control-panel__info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.control-panel__info-label {
  font-size: 11px;
  color: #777;
}

.control-panel__info-value {
  font-size: 14px;
  color: #eee;
}

.control-panel__scenes {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.control-panel__scene-btn {
  background: #2a2a3e;
  color: #ccc;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.control-panel__scene-btn:hover {
  background: #3a3a4e;
  border-color: #666;
}

.control-panel__scene-btn--active {
  background: #335588;
  border-color: #4477aa;
  color: #fff;
}
</style>
