import { computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { TrainState } from '@/core/models/train'

export function useTrain() {
  const sim = useSimulationStore()

  const isStopped = computed(() => sim.trainState === TrainState.STOPPED)
  const isDeparting = computed(() => sim.trainState === TrainState.DEPARTING)
  const isRunning = computed(() => sim.trainState === TrainState.RUNNING)
  const isArriving = computed(() => sim.trainState === TrainState.ARRIVING)
  const canToggleDirection = computed(() => isStopped.value)

  return {
    trainState: computed(() => sim.trainState),
    trainStateLabel: computed(() => sim.trainStateLabel),
    currentStation: computed(() => sim.currentStation),
    nextStation: computed(() => sim.nextStation),
    direction: computed(() => sim.direction),
    isAutoMode: computed(() => sim.isAutoMode),
    currentStationIndex: computed(() => sim.currentStationIndex),
    isStopped,
    isDeparting,
    isRunning,
    isArriving,
    canToggleDirection,
    next: () => sim.next(),
    toggleDirection: () => sim.toggleDirection(),
    setAutoMode: (auto: boolean) => sim.setAutoMode(auto),
  }
}
