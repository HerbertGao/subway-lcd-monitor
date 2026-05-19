import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Line, Station } from '@/core/models/network'
import type { SceneConfig } from '@/core/models/theme'
import { TrainState, Direction, TrainStateLabel } from '@/core/models/train'
import { TrainFSM } from '@/core/train-fsm'
import { SceneRotator } from '@/core/scene-rotator'
import { resolveTheme } from '@/core/theme-resolver'
import { defaultTheme } from '@/themes/default'

export const useSimulationStore = defineStore('simulation', () => {
  // 状态
  const trainState = ref<TrainState>(TrainState.STOPPED)
  const currentStationIndex = ref(0)
  const direction = ref<Direction>(Direction.FORWARD)
  const isAutoMode = ref(false)
  const currentScene = ref<SceneConfig | null>(null)
  const currentSceneIndex = ref(0)
  const sceneList = ref<SceneConfig[]>([])
  const activeLine = ref<Line | null>(null)

  // 计算属性
  const trainStateLabel = computed(() => TrainStateLabel[trainState.value])
  const currentStation = computed<Station | null>(() => {
    if (!activeLine.value) return null
    return activeLine.value.stations[currentStationIndex.value] ?? null
  })
  const nextStation = computed<Station | null>(() => {
    if (!activeLine.value) return null
    const stations = activeLine.value.stations
    const cur = currentStationIndex.value
    const dir = direction.value
    const last = stations.length - 1
    if (activeLine.value.isLoop) {
      const next =
        dir === Direction.FORWARD
          ? (cur + 1) % stations.length
          : (cur - 1 + stations.length) % stations.length
      return stations[next]
    }
    if (dir === Direction.FORWARD) {
      return cur < last ? stations[cur + 1] : null
    }
    return cur > 0 ? stations[cur - 1] : null
  })

  // 核心实例
  let fsm: TrainFSM | null = null
  let rotator: SceneRotator | null = null

  function syncFromFSM(state: {
    trainState: TrainState
    currentStationIndex: number
    direction: Direction
    isAutoMode: boolean
  }) {
    trainState.value = state.trainState
    currentStationIndex.value = state.currentStationIndex
    direction.value = state.direction
    isAutoMode.value = state.isAutoMode
  }

  function updateScenes() {
    const theme = resolveTheme(defaultTheme, undefined, activeLine.value?.themeId)
    const scenes = theme.scenes[trainState.value] ?? []
    sceneList.value = scenes
    rotator?.setScenes(scenes)
  }

  /** 初始化模拟：加载线路并创建状态机 */
  function init(line: Line, dir: Direction = Direction.FORWARD) {
    // 清理旧实例
    fsm?.destroy()
    rotator?.destroy()

    activeLine.value = line

    fsm = new TrainFSM(line, {
      onStateChange: (state) => {
        syncFromFSM(state)
        updateScenes()
      },
      onStationChange: (state) => {
        syncFromFSM(state)
      },
      onDirectionChange: (state) => {
        syncFromFSM(state)
      },
    })

    rotator = new SceneRotator({
      onSceneChange: (scene, index) => {
        currentScene.value = scene
        currentSceneIndex.value = index
      },
    })

    fsm.reset(line, dir)
    syncFromFSM(fsm.getState())
    updateScenes()
  }

  /** 推进到下一个状态 */
  function next() {
    fsm?.next()
  }

  /** 切换方向 */
  function toggleDirection() {
    fsm?.toggleDirection()
  }

  /** 设置自动/手动模式 */
  function setAutoMode(auto: boolean) {
    fsm?.setAutoMode(auto)
    isAutoMode.value = auto
  }

  /** 手动切换场景 */
  function goToScene(index: number) {
    rotator?.goTo(index)
  }

  /** 销毁 */
  function destroy() {
    fsm?.destroy()
    rotator?.destroy()
    fsm = null
    rotator = null
  }

  return {
    // 状态
    trainState,
    currentStationIndex,
    direction,
    isAutoMode,
    currentScene,
    currentSceneIndex,
    sceneList,
    activeLine,
    // 计算属性
    trainStateLabel,
    currentStation,
    nextStation,
    // 方法
    init,
    next,
    toggleDirection,
    setAutoMode,
    goToScene,
    destroy,
  }
})
