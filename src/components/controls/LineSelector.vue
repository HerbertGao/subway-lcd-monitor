<template>
  <div class="line-selector">
    <div class="line-selector__group">
      <label class="line-selector__label">城市</label>
      <select v-model="selectedCity" class="line-selector__select" @change="onCityChange">
        <option value="" disabled>选择城市</option>
        <option v-for="city in cities" :key="city" :value="city">
          {{ cityNames[city] || city }}
        </option>
      </select>
    </div>

    <div class="line-selector__group">
      <label class="line-selector__label">线路</label>
      <select v-model="selectedLineId" class="line-selector__select" @change="onLineChange">
        <option value="" disabled>选择线路</option>
        <option v-for="line in availableLines" :key="line.id" :value="line.id">
          {{ line.name }}
        </option>
      </select>
    </div>

    <div class="line-selector__group">
      <label class="line-selector__label">方向</label>
      <select v-model="selectedDirection" class="line-selector__select" @change="onDirectionChange">
        <option :value="Direction.FORWARD">{{ forwardLabel }}</option>
        <option :value="Direction.BACKWARD">{{ backwardLabel }}</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useLineStore } from '@/stores/line'
import { useSimulationStore } from '@/stores/simulation'
import { Direction } from '@/core/models/train'

const lineStore = useLineStore()
const sim = useSimulationStore()

const selectedCity = ref('')
const selectedLineId = ref('')
const selectedDirection = ref<Direction>(Direction.FORWARD)

const cities = computed(() => lineStore.cities)
const availableLines = computed(() => lineStore.availableLines)

const cityNames: Record<string, string> = {
  beijing: '北京',
}

const forwardLabel = computed(() => {
  const line = lineStore.currentLine
  if (!line) return '正向'
  return `${line.stations[0].name} → ${line.stations[line.stations.length - 1].name}`
})

const backwardLabel = computed(() => {
  const line = lineStore.currentLine
  if (!line) return '反向'
  return `${line.stations[line.stations.length - 1].name} → ${line.stations[0].name}`
})

function onCityChange() {
  if (selectedCity.value) {
    lineStore.selectCity(selectedCity.value)
    selectedLineId.value = ''
  }
}

function onLineChange() {
  if (selectedLineId.value) {
    lineStore.selectLine(selectedLineId.value)
    startSimulation()
  }
}

function onDirectionChange() {
  if (lineStore.currentLine) {
    sim.init(lineStore.currentLine, selectedDirection.value)
  }
}

function startSimulation() {
  if (lineStore.currentLine) {
    sim.init(lineStore.currentLine, selectedDirection.value)
  }
}

// 同步 store 中的 direction 到本地选择框（如终点站自动反转）
watch(() => sim.direction, (dir) => {
  selectedDirection.value = dir
})

// 自动选择第一个城市和线路
watch(cities, (c) => {
  if (c.length > 0 && !selectedCity.value) {
    selectedCity.value = c[0]
    onCityChange()
  }
}, { immediate: true })

watch(availableLines, (lines) => {
  if (lines.length > 0 && !selectedLineId.value) {
    selectedLineId.value = lines[0].id
    onLineChange()
  }
}, { immediate: true })
</script>

<style scoped>
.line-selector {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.line-selector__group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.line-selector__label {
  font-size: 12px;
  color: #999;
}

.line-selector__select {
  background: #2a2a3e;
  color: #eee;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 14px;
  min-width: 120px;
  cursor: pointer;
}

.line-selector__select:focus {
  outline: none;
  border-color: #6688cc;
}
</style>
