import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SceneRotator } from './scene-rotator'
import type { SceneConfig } from './models/theme'

function makeScene(id: string, duration: number): SceneConfig {
  return { id, name: id, duration }
}

describe('SceneRotator', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('场景列表设置', () => {
    it('初始状态无场景', () => {
      const rotator = new SceneRotator()
      expect(rotator.getCurrentScene()).toBeNull()
      expect(rotator.getCurrentIndex()).toBe(0)
      expect(rotator.getScenes()).toHaveLength(0)
    })

    it('setScenes 设置列表并重置到第一个场景', () => {
      const onSceneChange = vi.fn()
      const rotator = new SceneRotator({ onSceneChange })
      const scenes = [makeScene('s1', 5), makeScene('s2', 5)]
      rotator.setScenes(scenes)
      expect(rotator.getCurrentIndex()).toBe(0)
      expect(rotator.getCurrentScene()?.id).toBe('s1')
      expect(rotator.getScenes()).toHaveLength(2)
      expect(onSceneChange).toHaveBeenCalledWith(scenes[0], 0)
    })

    it('setScenes 设置空列表时不触发回调', () => {
      const onSceneChange = vi.fn()
      const rotator = new SceneRotator({ onSceneChange })
      rotator.setScenes([])
      expect(rotator.getCurrentScene()).toBeNull()
      expect(onSceneChange).not.toHaveBeenCalled()
    })

    it('重新 setScenes 后索引回到 0', () => {
      const rotator = new SceneRotator()
      rotator.setScenes([makeScene('a', 5), makeScene('b', 5)])
      rotator.goTo(1)
      expect(rotator.getCurrentIndex()).toBe(1)
      rotator.setScenes([makeScene('c', 5), makeScene('d', 5)])
      expect(rotator.getCurrentIndex()).toBe(0)
      expect(rotator.getCurrentScene()?.id).toBe('c')
    })
  })

  describe('自动轮播', () => {
    it('多场景时按 duration 自动轮播', () => {
      const onSceneChange = vi.fn()
      const rotator = new SceneRotator({ onSceneChange })
      rotator.setScenes([makeScene('s1', 3), makeScene('s2', 4)])

      // s1 持续 3 秒
      vi.advanceTimersByTime(3000)
      expect(rotator.getCurrentIndex()).toBe(1)
      expect(rotator.getCurrentScene()?.id).toBe('s2')

      // s2 持续 4 秒后回到 s1
      vi.advanceTimersByTime(4000)
      expect(rotator.getCurrentIndex()).toBe(0)
      expect(rotator.getCurrentScene()?.id).toBe('s1')

      rotator.destroy()
    })

    it('单场景时不启动自动轮播', () => {
      const rotator = new SceneRotator()
      rotator.setScenes([makeScene('only', 3)])
      vi.advanceTimersByTime(60000)
      expect(rotator.getCurrentIndex()).toBe(0)
    })

    it('destroy 后停止自动轮播', () => {
      const rotator = new SceneRotator()
      rotator.setScenes([makeScene('s1', 3), makeScene('s2', 3)])
      rotator.destroy()
      vi.advanceTimersByTime(60000)
      expect(rotator.getCurrentIndex()).toBe(0)
    })
  })

  describe('手动跳转', () => {
    it('goTo 跳转到指定场景并触发回调', () => {
      const onSceneChange = vi.fn()
      const rotator = new SceneRotator({ onSceneChange })
      const scenes = [makeScene('s1', 5), makeScene('s2', 5), makeScene('s3', 5)]
      rotator.setScenes(scenes)
      onSceneChange.mockClear()

      rotator.goTo(2)
      expect(rotator.getCurrentIndex()).toBe(2)
      expect(rotator.getCurrentScene()?.id).toBe('s3')
      expect(onSceneChange).toHaveBeenCalledWith(scenes[2], 2)
    })

    it('goTo 后自动轮播计时器从新场景重新开始', () => {
      const rotator = new SceneRotator()
      rotator.setScenes([makeScene('s1', 3), makeScene('s2', 10)])
      // 等待 2 秒后手动跳到 s2
      vi.advanceTimersByTime(2000)
      rotator.goTo(1)
      expect(rotator.getCurrentIndex()).toBe(1)
      // s2 duration 10 秒，跳转后再过 9 秒不应轮播
      vi.advanceTimersByTime(9000)
      expect(rotator.getCurrentIndex()).toBe(1)
      // 再过 1 秒后轮播回 s1
      vi.advanceTimersByTime(1000)
      expect(rotator.getCurrentIndex()).toBe(0)
      rotator.destroy()
    })
  })

  describe('越界索引边界', () => {
    it('goTo 负索引时忽略，不改变状态', () => {
      const rotator = new SceneRotator()
      rotator.setScenes([makeScene('s1', 5), makeScene('s2', 5)])
      rotator.goTo(1)
      rotator.goTo(-1)
      expect(rotator.getCurrentIndex()).toBe(1)
    })

    it('goTo 超出长度的索引时忽略', () => {
      const rotator = new SceneRotator()
      rotator.setScenes([makeScene('s1', 5), makeScene('s2', 5)])
      rotator.goTo(5)
      expect(rotator.getCurrentIndex()).toBe(0)
    })

    it('goTo 等于长度的索引（上界）时忽略', () => {
      const onSceneChange = vi.fn()
      const rotator = new SceneRotator({ onSceneChange })
      rotator.setScenes([makeScene('s1', 5), makeScene('s2', 5)])
      onSceneChange.mockClear()
      rotator.goTo(2)
      expect(rotator.getCurrentIndex()).toBe(0)
      expect(onSceneChange).not.toHaveBeenCalled()
    })

    it('场景列表为空时 goTo 任意索引都被忽略', () => {
      const rotator = new SceneRotator()
      rotator.setScenes([])
      rotator.goTo(0)
      expect(rotator.getCurrentScene()).toBeNull()
    })
  })
})
