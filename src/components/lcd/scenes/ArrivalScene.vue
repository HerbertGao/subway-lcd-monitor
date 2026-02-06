<template>
  <div class="arrival">
    <div class="arrival__label">下一站 Next Station</div>
    <div class="arrival__name">{{ station?.name }}</div>
    <div class="arrival__name-en">{{ station?.nameEn }}</div>
    <div class="arrival__door">
      {{ doorSideLabel }}
    </div>
    <div v-if="station && station.transfers.length > 0" class="arrival__transfers">
      <span class="arrival__transfer-label">可换乘</span>
      <span
        v-for="transfer in station.transfers"
        :key="transfer.lineId"
        class="arrival__transfer-badge"
        :style="{ backgroundColor: transfer.lineColor }"
      >
        {{ transfer.lineName }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'

const sim = useSimulationStore()

const station = computed(() => sim.nextStation)

const doorSideLabel = computed(() => {
  const side = station.value?.doorSide
  if (side === 'left') return '左侧开门 Doors will open on the left'
  if (side === 'right') return '右侧开门 Doors will open on the right'
  if (side === 'both') return '双侧开门 Doors will open on both sides'
  return ''
})
</script>

<style scoped>
.arrival {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  text-align: center;
}

.arrival__label {
  font-size: 16px;
  opacity: 0.8;
  margin-bottom: 8px;
  font-family: var(--lcd-font-info);
}

.arrival__name {
  font-size: 42px;
  font-weight: bold;
  font-family: var(--lcd-font-station);
  color: var(--lcd-current-station);
  line-height: 1.2;
}

.arrival__name-en {
  font-size: 18px;
  font-family: var(--lcd-font-station-en);
  opacity: 0.8;
  margin-bottom: 12px;
}

.arrival__door {
  font-size: 14px;
  font-family: var(--lcd-font-info);
  opacity: 0.9;
  margin-bottom: 8px;
}

.arrival__transfers {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.arrival__transfer-label {
  font-size: 14px;
  font-family: var(--lcd-font-info);
}

.arrival__transfer-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  color: #fff;
  font-weight: bold;
  font-family: var(--lcd-font-station);
}
</style>
