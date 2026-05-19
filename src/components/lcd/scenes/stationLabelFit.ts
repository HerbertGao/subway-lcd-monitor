/**
 * 站名字号自适应纯函数工具（决策 3 步骤 1 的宽度估算与字号计算）。
 *
 * 密集线路下相邻站站名在站间距内不得重叠是硬约束。本工具按「文本估算宽度
 * vs 可用站间距」自适应下调字号：超宽时按比例缩小字号至放入，最低到字号
 * 下限；字号到下限仍超宽的项被标记 `needsCompression`，由调用方对其 `<text>`
 * 施加 SVG `textLength` + `lengthAdjust="spacingAndGlyphs"` 水平压缩。
 *
 * 纯函数、不依赖 Vue / DOM，便于单元测试。
 */

/** 单字宽度估算系数（相对字号）：CJK 约方块字宽，ASCII 约半角宽。 */
const CJK_CHAR_RATIO = 1.0
const ASCII_CHAR_RATIO = 0.55

/** 可用宽度安全系数：可用宽度 = 站间距 × 此系数，给相邻站名留间隙。 */
export const SAFE_RATIO = 0.9

/** 字号下限：不低于基准字号的此比例。 */
const MIN_FONT_RATIO = 0.6

/** 字号绝对下限（viewBox user unit）。 */
const MIN_FONT_ABSOLUTE = 7

/** 单站字号适配结果。 */
export interface LabelFit {
  /** 适配后字号（viewBox user unit），介于下限与基准之间。 */
  fontSize: number
  /** 该项在适配后字号下仍超宽、需对 `<text>` 施加 textLength 水平压缩。 */
  needsCompression: boolean
  /** 可用宽度（站间距 × 安全系数），needsCompression 时作为 textLength 值。 */
  availableWidth: number
}

/**
 * 估算文本在给定字号下的渲染宽度。
 * CJK（含全角标点等非 ASCII 字符）按 `CJK_CHAR_RATIO × 字号`，
 * ASCII 字符按 `ASCII_CHAR_RATIO × 字号`。
 */
export function estimateTextWidth(text: string, fontSize: number): number {
  let units = 0
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0
    units += code <= 0x7f ? ASCII_CHAR_RATIO : CJK_CHAR_RATIO
  }
  return units * fontSize
}

/**
 * 计算单个站名在给定站间距内的字号适配结果。
 *
 * @param text          站名文本（中文名或英文名）
 * @param baseFontSize  基准字号（未超宽时直接采用）
 * @param stationGap    相邻站间距（viewBox user unit）
 * @returns 适配后的字号、是否需压缩、可用宽度
 */
export function fitStationLabel(
  text: string,
  baseFontSize: number,
  stationGap: number
): LabelFit {
  const availableWidth = Math.max(0, stationGap * SAFE_RATIO)
  const minFontSize = Math.max(baseFontSize * MIN_FONT_RATIO, MIN_FONT_ABSOLUTE)

  if (text.length === 0) {
    return { fontSize: baseFontSize, needsCompression: false, availableWidth }
  }

  const baseWidth = estimateTextWidth(text, baseFontSize)

  // 短名：基准字号即可放入，不缩。
  if (baseWidth <= availableWidth) {
    return { fontSize: baseFontSize, needsCompression: false, availableWidth }
  }

  // 超宽：按比例下调字号至恰好放入。
  const scaledFontSize = (baseFontSize * availableWidth) / baseWidth
  if (scaledFontSize >= minFontSize) {
    return { fontSize: scaledFontSize, needsCompression: false, availableWidth }
  }

  // 字号已到下限仍超宽：触底，标记需水平压缩。
  return { fontSize: minFontSize, needsCompression: true, availableWidth }
}
