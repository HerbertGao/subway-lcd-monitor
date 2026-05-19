/** 日志级别，由低到高 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/** 各级别的数值阈值，数值越大优先级越高 */
const LEVEL_WEIGHTS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

/** 依据构建环境推导默认级别：开发环境为 debug，生产环境为 warn */
function resolveDefaultLevel(): LogLevel {
  return import.meta.env.DEV ? 'debug' : 'warn'
}

let currentLevel: LogLevel = resolveDefaultLevel()

/** 显式设置生效日志级别 */
export function setLevel(level: LogLevel): void {
  currentLevel = level
}

/** 获取当前生效日志级别 */
export function getLevel(): LogLevel {
  return currentLevel
}

/** 判断某级别在当前阈值下是否应输出 */
function shouldLog(level: LogLevel): boolean {
  return LEVEL_WEIGHTS[level] >= LEVEL_WEIGHTS[currentLevel]
}

function debug(...args: unknown[]): void {
  if (shouldLog('debug')) {
    console.debug(...args)
  }
}

function info(...args: unknown[]): void {
  if (shouldLog('info')) {
    console.info(...args)
  }
}

function warn(...args: unknown[]): void {
  if (shouldLog('warn')) {
    console.warn(...args)
  }
}

function error(...args: unknown[]): void {
  if (shouldLog('error')) {
    console.error(...args)
  }
}

/** 分级 logger：按当前级别阈值过滤，底层输出到 console */
export const logger = {
  debug,
  info,
  warn,
  error,
  setLevel,
  getLevel,
}
