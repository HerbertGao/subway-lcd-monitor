import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { logger } from './logger'

describe('logger', () => {
  let debugSpy: ReturnType<typeof vi.spyOn>
  let infoSpy: ReturnType<typeof vi.spyOn>
  let warnSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('setLevel / getLevel', () => {
    it('setLevel 更新生效级别，getLevel 可读回', () => {
      logger.setLevel('info')
      expect(logger.getLevel()).toBe('info')
      logger.setLevel('error')
      expect(logger.getLevel()).toBe('error')
    })
  })

  describe('级别阈值过滤', () => {
    it('级别为 debug 时四个级别均输出', () => {
      logger.setLevel('debug')
      logger.debug('d')
      logger.info('i')
      logger.warn('w')
      logger.error('e')
      expect(debugSpy).toHaveBeenCalledTimes(1)
      expect(infoSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(errorSpy).toHaveBeenCalledTimes(1)
    })

    it('级别为 info 时抑制 debug，输出 info/warn/error', () => {
      logger.setLevel('info')
      logger.debug('d')
      logger.info('i')
      logger.warn('w')
      logger.error('e')
      expect(debugSpy).not.toHaveBeenCalled()
      expect(infoSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(errorSpy).toHaveBeenCalledTimes(1)
    })

    it('级别为 warn 时抑制 debug/info，输出 warn/error', () => {
      logger.setLevel('warn')
      logger.debug('d')
      logger.info('i')
      logger.warn('w')
      logger.error('e')
      expect(debugSpy).not.toHaveBeenCalled()
      expect(infoSpy).not.toHaveBeenCalled()
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(errorSpy).toHaveBeenCalledTimes(1)
    })

    it('级别为 error 时仅输出 error', () => {
      logger.setLevel('error')
      logger.debug('d')
      logger.info('i')
      logger.warn('w')
      logger.error('e')
      expect(debugSpy).not.toHaveBeenCalled()
      expect(infoSpy).not.toHaveBeenCalled()
      expect(warnSpy).not.toHaveBeenCalled()
      expect(errorSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('参数透传', () => {
    it('调用参数原样透传给底层 console', () => {
      logger.setLevel('debug')
      const meta = { code: 42 }
      logger.error('boom', meta)
      expect(errorSpy).toHaveBeenCalledWith('boom', meta)
    })
  })
})
