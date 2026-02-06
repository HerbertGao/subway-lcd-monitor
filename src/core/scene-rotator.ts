import type { SceneConfig } from './models/theme'

export interface SceneRotatorCallbacks {
  onSceneChange?: (scene: SceneConfig, index: number) => void
}

export class SceneRotator {
  private scenes: SceneConfig[] = []
  private currentIndex = 0
  private timer: ReturnType<typeof setTimeout> | null = null
  private callbacks: SceneRotatorCallbacks

  constructor(callbacks: SceneRotatorCallbacks = {}) {
    this.callbacks = callbacks
  }

  /** 获取当前场景 */
  getCurrentScene(): SceneConfig | null {
    return this.scenes[this.currentIndex] ?? null
  }

  /** 获取当前场景索引 */
  getCurrentIndex(): number {
    return this.currentIndex
  }

  /** 获取场景列表 */
  getScenes(): readonly SceneConfig[] {
    return this.scenes
  }

  /** 设置新的场景列表并重置到第一个场景 */
  setScenes(scenes: SceneConfig[]): void {
    this.stopTimer()
    this.scenes = scenes
    this.currentIndex = 0
    if (scenes.length > 0) {
      this.callbacks.onSceneChange?.(scenes[0], 0)
      if (scenes.length > 1) {
        this.startTimer()
      }
    }
  }

  /** 手动跳转到指定场景 */
  goTo(index: number): void {
    if (index < 0 || index >= this.scenes.length) return
    this.stopTimer()
    this.currentIndex = index
    this.callbacks.onSceneChange?.(this.scenes[index], index)
    if (this.scenes.length > 1) {
      this.startTimer()
    }
  }

  /** 销毁，清除计时器 */
  destroy(): void {
    this.stopTimer()
  }

  private advance(): void {
    this.currentIndex = (this.currentIndex + 1) % this.scenes.length
    this.callbacks.onSceneChange?.(this.scenes[this.currentIndex], this.currentIndex)
    this.startTimer()
  }

  private startTimer(): void {
    this.stopTimer()
    const scene = this.scenes[this.currentIndex]
    if (!scene) return
    this.timer = setTimeout(() => {
      this.advance()
    }, scene.duration * 1000)
  }

  private stopTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }
}
