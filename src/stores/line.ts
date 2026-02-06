import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Network, Line } from '@/core/models/network'
import { loadNetwork, loadLine, loadAllLines, listCities } from '@/core/data-loader'

export const useLineStore = defineStore('line', () => {
  const currentCity = ref<string | null>(null)
  const currentNetwork = ref<Network | null>(null)
  const currentLine = ref<Line | null>(null)
  const availableLines = ref<Line[]>([])

  const cities = computed(() => listCities())

  function selectCity(city: string) {
    currentCity.value = city
    currentNetwork.value = loadNetwork(city)
    availableLines.value = loadAllLines(city)
    currentLine.value = null
  }

  function selectLine(lineId: string) {
    if (!currentCity.value) return
    currentLine.value = loadLine(currentCity.value, lineId)
  }

  return {
    currentCity,
    currentNetwork,
    currentLine,
    availableLines,
    cities,
    selectCity,
    selectLine,
  }
})
