## 上下文

阶段一、二已建立工程基建与运行时健壮性。本阶段（阶段三）补体验适配。当前代码的薄弱点已在 proposal 列明：硬编码 960×320、外框固定 padding/border、非 SVG 场景固定字号、SVG 无语义、控件无 ARIA 状态与标签关联、焦点不可见。

技术约束：本阶段只动渲染层（`src/components/` 与 `src/App.vue`），不触及 `src/core/`、`src/stores/`，不改业务逻辑。不引入 UI/CSS 框架。改动以 CSS 与模板属性为主。

相关现状（已核对代码）：
- `LcdScreen.vue` 根元素 `width: 960px; height: 320px`；header/footer 用固定 `px` 字号。
- `LcdFrame.vue` 包在 `LcdScreen` 外，固定 `padding: 16px` + `border: 2px solid`，无 `box-sizing`/`max-width`。
- LCD 场景中 `FullRouteScene.vue`、`NearbyScene.vue` 用 `<svg viewBox>` 绘制；`ArrivalScene.vue` **不含 SVG**，是固定字号（42/18/16/14px）的文本布局。
- `ControlPanel.vue` 根元素 `width: 960px`，内部分区已 `flex` + 部分 `flex-wrap`。
- `LineSelector.vue` 的 `<label>`/`<select>` 为兄弟节点、无 `for`/`id`；select 有 `:focus { outline: none }`。
- `TrainControls.vue` 的「自动/手动」是单个按钮、可见文本随状态在「自动运行中/手动模式」间变化；`ControlPanel.vue` 画面切换是一组按钮、当前项以 CSS class 标记。

## 目标 / 非目标

**目标：**
- LCD 屏（含外框 `LcdFrame`）、控制面板、页面容器在窄屏下可用、不溢出。
- 所有 LCD 场景（SVG 与非 SVG）在窄屏内容区内不溢出。
- 含 SVG 的场景对读屏软件可理解；切换态控件暴露正确 ARIA 状态；表单控件标签关联；键盘焦点可见。

**非目标：**
- 不改业务逻辑；不重构 SVG 绘制逻辑；不补单元测试。
- 不引入 UI/CSS 框架；不做完整 WCAG 审计。
- 不做内容扩展（属阶段四）。

## 决策

### 1. LCD 屏与外框响应式：纯 CSS 等比适配，含 `LcdFrame`

LCD 屏按 960×320 设计基准。`LcdScreen` 根元素由 `width: 960px; height: 320px` 改为 `width: 100%` + `aspect-ratio: 3 / 1`（960∶320），高度由比例自动得出。

**关键：外框 `LcdFrame` 必须一并纳入**——它在 `LcdScreen` 外，有 `padding` 与 `border`。`LcdFrame` 设 `box-sizing: border-box`、`width: min(960px + 外框 chrome, 100%)`（或更简单：`max-width: 100%` 配合 `box-sizing: border-box`，使 padding/border 计入宽度内），padding 用 `clamp()` 在窄屏收敛。这样「含外框的整体」在窄屏不溢出、不产生横向滚动。`aspect-ratio: 3 / 1` 约束的是 **LCD 屏整体**（`LcdScreen` 根元素，含 header、内容区 `.lcd-screen__content` 与 footer），而非单独的 `.lcd-screen__content`——header/footer 在该比例的盒子内按其自身高度占位，内容区取剩余空间。

**极窄屏的比例让步**：纯 `aspect-ratio: 3 / 1` 在极窄视口（约 320–375px）下会把 LCD 屏压到约 90–110px 高，扣除 header/footer 后内容区仅约 50–70px——文本型场景 `ArrivalScene`（站名、英文名、开门方向、换乘行多行文本）无法容纳，会被 `.lcd-screen__content` 的 `overflow: hidden` 静默裁剪。因此 `LcdScreen` 根元素须同时设一个**最小高度下限** `min-height`：当「宽 ÷ 3 ≥ min-height」时维持 3∶1，否则高度取 `min-height`、宽高比大于 3∶1。`min-height` 取值须足以容纳 header + footer + `ArrivalScene` 含换乘行的最小排版（按当前 clamp 下限推算并留余量）。SVG 场景借 `viewBox` 在更高的内容区内仍矢量缩放、无副作用。这是决策 6 验收矩阵「场景级 `scrollHeight <= clientHeight`」在 320/375px 下能通过的前提——「内容完整不裁剪」优先于「严格 3∶1」。

header/footer 的字号、内边距改用 `clamp()`（如 `clamp(12px, 2.5vw, 16px)`），小屏下不溢出。

替代方案：JS 计算 `transform: scale()` 整体缩放——`transform` 不影响布局盒、需额外 wrapper 占位，引入 JS 与 resize 监听。纯 CSS 更简单，不选 JS。

### 2. 控制面板与页面容器响应式

`ControlPanel.vue` 根元素 `width: 960px` 改为 `width: 100%` + `max-width: 960px`；内部各区块已 `flex` + `flex-wrap`，窄屏自然换行/堆叠。`App.vue` 的 `#subway-monitor` 页面容器 `padding` 在窄屏用 `clamp()` 收敛，避免小屏被内边距挤压。

### 3. LCD 场景内容响应式：区分 SVG 与非 SVG 场景

- **SVG 场景**（`FullRouteScene`、`NearbyScene`）：已用 `viewBox`，只需保证 `<svg>` 自身 `width: 100%; height: 100%; display: block`，即随容器矢量缩放，无需改绘制坐标。
- **非 SVG 场景**（`ArrivalScene`）：是固定字号文本布局，LCD 等比缩小后窄屏内容区变小，固定 `42/18/16/14px` 字号与固定 padding 会溢出/挤压。须把其字号、内边距、间距改用 `clamp()`，换乘信息等多元素行加 `flex-wrap`，确保窄屏内容区内不溢出。

### 4. SVG 场景语义化（仅 `FullRouteScene`、`NearbyScene`）

对含 `<svg>` 的两个场景，`<svg>` 加 `role="img"` 与 `aria-labelledby`，在 SVG 内首位放 `<title>`（简短名称，如「线路全程图」）与 `<desc>`（动态描述：当前线路名、当前站、运行方向），并以各自 `id` 经 `aria-labelledby` 关联到 `<svg>`。读屏软件据此把整张图作为单一有意义图像朗读。

`<svg role="img">` 是非交互图像、默认不进键盘 Tab 序列，本阶段**不**为其加 `tabindex`——规格中相应场景以「读屏软件浏览/访问到 SVG 场景」表述，不用「聚焦」。仅新增语义节点，不改绘制坐标与视觉。

### 5. 交互控件可访问性

- **自动/手动切换**（`TrainControls.vue`）：该控件是「开/关」语义，且可见文本随状态变化。改用 `role="switch"` + `:aria-checked="isAutoMode"`，并配一个**稳定的可访问名**（如 `aria-label="自动运行"`）——读屏软件据此播报「自动运行，开关，开/关」，不受可见文本变化影响。
- **画面切换**（`ControlPanel.vue`）：是一组「选其一」的按钮。用 `role="group"` + `aria-label="画面切换"` 包裹按钮组，各按钮以 `:aria-pressed="i === currentSceneIndex"` 表当前选中。此方案比强上完整 `tablist/tab/tabpanel` 轻、足以表达「当前在看哪个画面」。
- **标签关联**（`LineSelector.vue`）：城市/线路/方向三个 `<select>` 各设唯一 `id`，对应 `<label>` 加 `for` 指向该 `id`。
- **可见焦点**：移除 `LineSelector` select 的 `outline: none`；新增一组全局 `:focus-visible` 样式（清晰描边/轮廓），覆盖按钮与下拉框。原生 `<button>`/`<select>` 本可键盘操作，本阶段补的是「焦点可见」。

### 6. 验证方式与验收矩阵

本阶段无新增纯逻辑，不加单元测试。回归靠阶段一、二的 71 个单测保持通过 + `lint`/`format:check`/`type-check`/`build` 整链通过。

体验本身用一份**明确的手动验收矩阵**核验，至少覆盖：
- 视口宽度 320 / 375 / 768 / 960 / 1280 下逐一查看三个场景，**分层**核验不溢出：①页面级——`document.documentElement.scrollWidth <= clientWidth`、无横向滚动；②根元素级——LCD 屏（含外框 `LcdFrame`）与控制面板的根元素 bounding rect 完全落在视口内；③场景级——每个场景根元素 `scrollWidth <= clientWidth` 且 `scrollHeight <= clientHeight`，其 bounding rect 完全落在 `.lcd-screen__content` 内（`.lcd-screen__content` 为 `overflow: hidden`，场景内容溢出后会被静默裁剪、不产生页面级横向滚动，故页面级判据无法发现内部溢出，**必须叠加场景级判据**）；④`ArrivalScene` 额外核验换乘信息行换行后不超出、关键文本节点 bounding rect 不互相重叠。
- DOM 检查：两个 SVG 场景的 `<svg>` 有 `role="img"` 且 `aria-labelledby` 指向存在的 `<title>`/`<desc>` id；自动/手动控件有 `role="switch"` 与随状态变化的 `aria-checked`；画面切换按钮组有 `role="group"`+`aria-label`、各按钮 `aria-pressed` 正确；三个 `<select>` 的 `id` 与 `<label for>` 一一对应。
- 键盘 Tab 遍历所有控件，确认每个获焦控件都有可见焦点指示。

## 风险 / 权衡

- **`aspect-ratio` + `clamp()` 浏览器支持** → 现代浏览器（及 Vite 7 目标范围）均已稳定支持，无需 polyfill。
- **窄屏下 LCD 屏等比缩小后文字偏小** → 本阶段优先保证「不溢出、可用」；LCD 屏模拟真实报站屏、等比缩放符合其物理形态，极小屏可读性属可接受权衡。
- **`<svg>` 的 `<desc>` 动态描述与画面轮播同步** → `<desc>` 由响应式数据驱动随当前站/方向更新即可；不追求读屏实时播报（live region），属本阶段非目标。
- **`role="switch"` 的浏览器/读屏支持** → `switch` 角色被主流读屏（VoiceOver/NVDA）广泛支持；若个别老旧环境不识别，会退化为普通按钮朗读，不影响功能。
