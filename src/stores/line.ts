import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Network, Line } from '@/core/models/network'
import { loadNetwork, loadLine, listCities } from '@/core/data-loader'
import { validateNetwork, type ValidationError } from '@/core/data-validator'
import { logger } from '@/core/logger'

/** 数据加载失败的结构化错误状态 */
export type LoadError = {
  message: string
  operation: 'loadNetwork' | 'loadLine'
  city: string
  lineId?: string
}

export type { ValidationError }

export const useLineStore = defineStore('line', () => {
  const currentCity = ref<string | null>(null)
  const currentNetwork = ref<Network | null>(null)
  const currentLine = ref<Line | null>(null)
  const availableLines = ref<Line[]>([])
  const loadError = ref<LoadError | null>(null)
  const validationErrors = ref<ValidationError[]>([])

  const cities = computed(() => listCities())

  function selectCity(city: string) {
    let network: Network

    // 事务式加载：先用局部变量完成全部加载与校验，全部成功后再写入 store
    try {
      network = loadNetwork(city)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      logger.error(`选择城市 "${city}" 失败：线网加载错误`, err)
      loadError.value = { message, operation: 'loadNetwork', city }
      return
    }

    const lines: Line[] = []
    for (const lineId of network.lines) {
      try {
        lines.push(loadLine(city, lineId))
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        logger.error(`选择城市 "${city}" 失败：线路 "${lineId}" 加载错误`, err)
        loadError.value = { message, operation: 'loadLine', city, lineId }
        return
      }
    }

    // 事务提交前执行完整性校验：校验问题非致命，不阻断加载
    const validation = validateNetwork(network, lines)
    if (validation.length > 0) {
      for (const issue of validation) {
        logger.warn(`线网校验问题 [${issue.type}]: ${issue.message}`)
      }
    }

    // 一次性提交：全部加载成功后才写入 store 状态
    currentCity.value = city
    currentNetwork.value = network
    availableLines.value = lines
    currentLine.value = null
    validationErrors.value = validation
    loadError.value = null
  }

  function selectLine(lineId: string) {
    const city = currentCity.value
    if (!city) return

    let line: Line
    try {
      line = loadLine(city, lineId)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      logger.error(`选择线路 "${lineId}" 失败：线路加载错误`, err)
      loadError.value = { message, operation: 'loadLine', city, lineId }
      return
    }

    // 一次性提交
    currentLine.value = line
    loadError.value = null
  }

  return {
    currentCity,
    currentNetwork,
    currentLine,
    availableLines,
    loadError,
    validationErrors,
    cities,
    selectCity,
    selectLine,
  }
})
