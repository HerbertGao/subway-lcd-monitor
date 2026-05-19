/**
 * 列车运行状态 → LCD 视觉的纯映射逻辑。
 *
 * 本模块为纯 TypeScript，不依赖 Vue——可被组件复用、可脱离 Vue 单测。
 * 集中维护状态相关的文案数据与映射规则，组件不得硬编码这些文案。
 *
 * 依据 phase4-mtr-states 变更 design 决策 2 / 3 / 4 / 7。
 */
import { TrainState } from './models/train'

/** 站点开门侧；空值表示数据缺失。 */
export type DoorSide = 'left' | 'right' | 'both'

/**
 * 站名特写黄色安全条文案，按 `TrainState` 区分（design 决策 3）。
 *
 * 四个 `TrainState` 均有定义，含 `RUNNING` 兜底（正常 `RUNNING` 不显示
 * 站名特写，但保留兜底文案以保证映射完备、不出现空文案）。
 */
export const SAFETY_BAR_TEXT: Record<TrainState, string> = {
  [TrainState.STOPPED]: '請小心空隙　Please mind the gap',
  [TrainState.DEPARTING]: '請勿靠近車門　Please stand back from the doors',
  [TrainState.ARRIVING]: '請小心空隙　Please mind the gap',
  [TrainState.RUNNING]: '請小心空隙　Please mind the gap',
}

/**
 * 线路图底部蓝色提示条的港铁式提示语集（design 决策 6）。
 *
 * 集中维护的预定义双语提示语，覆盖安全、礼让、禁止饮食等主题；
 * 组件从中选取一条非空内容显示，不得硬编码。
 */
export const INFO_BAR_MESSAGES: readonly string[] = [
  '請勿靠近車門　Please stand back from the doors',
  '請讓座給有需要的乘客　Please offer your seat to passengers in need',
  '車廂內請勿飲食　No eating or drinking in the train compartment',
  '請緊握扶手　Please hold the handrail',
  '請小心空隙　Please mind the gap',
]

/**
 * 全程线路图底部蓝条的换乘提示文案（design 决策 4）。
 *
 * 下一站为换乘站时，全程线路图底部蓝条切换为换乘提示文案。本函数按目标
 * 换乘线路集中生成中英双语文案，组件不得硬编码。形如
 * 「往房山线各站，请在此站换乘」+「Change to Fangshan Line」。
 *
 * 仅在 `RUNNING` 下一站为换乘站、且换乘线路可解析时呈现，故传入的换乘
 * 线路列表通常非空；若调用方传入空列表则返回兜底的通用换乘提示、不返回
 * 空文案。
 *
 * @param transferLines 目标换乘线路的中英文名（已按可解析过滤）
 * @returns 一条非空的双语换乘提示文案
 */
export function getTransferHintText(
  transferLines: readonly { name: string; nameEn: string }[]
): string {
  if (transferLines.length === 0) {
    return '請在此站換乘　Change here for connecting lines'
  }
  const zhNames = transferLines.map((l) => l.name).join('、')
  const enNames = transferLines.map((l) => l.nameEn).join(' / ')
  // 中英文之间沿用既有港铁式全角空格分隔（与 SAFETY_BAR_TEXT 一致）
  const zh = '往' + zhNames + '各站，請在此站換乘'
  return zh + '　Change to ' + enNames
}

/** 开门方向提示的视觉样式：绿底黑字 / 深色字（无绿底）。 */
export type DoorHintVariant = 'green' | 'dark'

/**
 * 开门方向提示。`null` 表示不显示（数据缺失时的 fallback）。
 *
 * 文案拆为中文 / 英文两段，由组件渲染为上下两行（中文行 + 英文小字行），
 * 与港铁实拍的中英双语两行版式一致（见 docs/mtr-ui-reference.md §1）。
 */
export interface DoorHint {
  /** 中文提示行 */
  zh: string
  /** 英文提示行（小字） */
  en: string
  /** 视觉样式 */
  variant: DoorHintVariant
}

/** 线路图站点圆点的状态。 */
export type StationDotState = 'passed' | 'upcoming' | 'next'

/**
 * 站名特写黄条是否带两端警示图标，按 `TrainState` 区分（design 决策 2）。
 *
 * - 「請小心空隙」类（`STOPPED` / `ARRIVING`）→ `true`，黄条两端各渲染一个
 *   港铁式红圈警示图标。
 * - 「請勿靠近車門」类（`DEPARTING`）→ `false`，黄条不带图标。
 * - `RUNNING` 兜底文案与「請小心空隙」同类，保持 `true` 使映射完备一致。
 *
 * 集中维护该判定，组件不得在多处散落硬编码。
 */
export const SAFETY_BAR_HAS_ICON: Record<TrainState, boolean> = {
  [TrainState.STOPPED]: true,
  [TrainState.DEPARTING]: false,
  [TrainState.ARRIVING]: true,
  [TrainState.RUNNING]: true,
}

/**
 * 取站名特写黄色安全条文案。
 *
 * @param state 当前列车运行状态
 * @returns 对应的双语安全条文案（四个状态均有值）
 */
export function getSafetyBarText(state: TrainState): string {
  return SAFETY_BAR_TEXT[state]
}

/**
 * 判定某 `TrainState` 的站名特写黄条文案是否应带两端警示图标。
 *
 * 「請小心空隙」类（`STOPPED` / `ARRIVING`）带图标，「請勿靠近車門」类
 * （`DEPARTING`）不带。组件据此渲染 / 不渲染黄条两端的红圈警示图标，并
 * 据此微调黄条版式（高度），不在组件硬编码该判定。
 *
 * @param state 当前列车运行状态
 * @returns `true` 表示黄条两端应带警示图标
 */
export function safetyBarHasIcon(state: TrainState): boolean {
  return SAFETY_BAR_HAS_ICON[state]
}

/**
 * 取站名特写的「展示站」（design 决策 2）。
 *
 * 站名、圆点、黄条、开门方向共用同一展示站。`TrainFSM` 在
 * `ARRIVING → STOPPED` 时才推进站点，故 `nextStation` 在不同状态语义不同：
 * - `ARRIVING` → `nextStation`（正在到达的站）
 * - `STOPPED` / `DEPARTING` → `currentStation`（当前停靠站）
 * - `RUNNING` → `null`（运行中不显示站名特写，无需展示站）
 *
 * @param state 当前列车运行状态
 * @param currentStation 当前停靠站（可为空）
 * @param nextStation 沿运行方向的下一站（可为空）
 * @returns 展示站；`RUNNING` 或数据缺失时为 `null`
 */
export function getDisplayedArrivalStation<T>(
  state: TrainState,
  currentStation: T | null | undefined,
  nextStation: T | null | undefined
): T | null {
  switch (state) {
    case TrainState.ARRIVING:
      return nextStation ?? null
    case TrainState.STOPPED:
    case TrainState.DEPARTING:
      return currentStation ?? null
    case TrainState.RUNNING:
      return null
    default:
      return null
  }
}

/**
 * 取开门方向提示（design 决策 4）。
 *
 * 「這邊/另一邊」相对车厢，本模拟器以 `doorSide` 直接映射为简化约定：
 * - `right` → 「請在這邊落車」绿底黑字（本侧，组件据 variant 闪烁）
 * - `left` → 「請往另一邊落車」深色字（无绿底，对侧静态）
 * - `both` → 「兩邊車門都會開」绿底黑字（本侧）
 * - 空 / 缺失 → `null`（不显示开门方向提示）
 *
 * 文案拆为中文 / 英文两段，由组件渲染为中英双语两行。
 *
 * @param doorSide 展示站的开门侧；`null` / `undefined` 视为数据缺失
 * @returns 开门方向提示；数据缺失时为 `null`
 */
export function getDoorHint(doorSide: DoorSide | null | undefined): DoorHint | null {
  switch (doorSide) {
    case 'right':
      return { zh: '請在這邊落車', en: 'Please exit this side', variant: 'green' }
    case 'left':
      return {
        zh: '請往另一邊落車',
        en: 'Please exit from the opposite side',
        variant: 'dark',
      }
    case 'both':
      return { zh: '兩邊車門都會開', en: 'Doors open on both sides', variant: 'green' }
    default:
      return null
  }
}

/**
 * 判定线路图某站点圆点的状态（design 决策 5）。
 *
 * - 列车正驶向的下一站（`isNext` 为真）→ `next`（组件据此应用闪烁动画）
 * - 已过站（`isPassed` 为真）→ `passed`（白色实心）
 * - 其余未过站 → `upcoming`（黄色实心）
 *
 * 「下一站」优先于「已过」判定，规则统一无需特判终点。
 *
 * @param isPassed 该站是否已过
 * @param isNext 该站是否为列车正驶向的下一站（`nextStation`）
 * @returns 圆点状态
 */
export function getStationDotState(isPassed: boolean, isNext: boolean): StationDotState {
  if (isNext) return 'next'
  if (isPassed) return 'passed'
  return 'upcoming'
}
