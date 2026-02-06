import { computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'

export function useSceneRotation() {
  const sim = useSimulationStore()

  return {
    currentScene: computed(() => sim.currentScene),
    currentSceneIndex: computed(() => sim.currentSceneIndex),
    sceneList: computed(() => sim.sceneList),
    goToScene: (index: number) => sim.goToScene(index),
  }
}
