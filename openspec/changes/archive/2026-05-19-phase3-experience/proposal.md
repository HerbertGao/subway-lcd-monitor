## 为什么

阶段一、二已建立工程基建与运行时健壮性，但项目在「体验」层面仍是 Demo——只能在宽屏上勉强可用，且对键盘与读屏用户近乎不可用：

- **无响应式**：`LcdScreen.vue` 硬编码 `width: 960px; height: 320px`，`ControlPanel.vue` 硬编码 `width: 960px`，外层 `LcdFrame.vue` 还有固定 `padding`/`border`。窄屏（手机、平板）下界面溢出、无法正常使用。`ArrivalScene.vue` 等非 SVG 场景用固定字号，缩小后会挤压溢出。
- **可访问性近乎为零**：
  - `FullRouteScene.vue`、`NearbyScene.vue` 的 `<svg>` 无 `role`、无 `<title>`/`<desc>`——屏幕阅读器完全读不到线路与站点信息。
  - 切换态控件（自动/手动模式、画面切换）仅靠 CSS class 表示状态，无任何 ARIA 状态。
  - `LineSelector.vue` 的 `<label>` 与 `<select>` 未用 `for`/`id` 关联，读屏软件无法把标签念给对应控件。
  - `LineSelector` 的 select 显式 `outline: none` 去掉了焦点指示，按钮无 `:focus-visible` 样式——键盘用户看不到当前焦点在哪。

本变更是「四阶段优化方案」的第三阶段，补齐响应式布局与基础可访问性，使应用在多种屏幕尺寸下可用、对键盘与读屏用户友好。

## 变更内容

- **响应式 LCD 屏（含外框）**：移除 `LcdScreen` 硬编码 `960×320`，改为 `width: 100%` + `aspect-ratio` 锁定 3∶1（并以 `min-height` 在极窄屏让步于内容）；header/footer 字号与内边距用 `clamp()` 自适应；外层 `LcdFrame` 设 `box-sizing: border-box`、`width: min(<960 加外框 chrome>, 100%)` 与 `max-width: 100%`、padding 用 `clamp()`，由外框限制整体设计宽度、确保「含外框整体」窄屏不溢出。
- **LCD 场景内容响应式**：含 `<svg>` 的场景（当前为 `FullRouteScene`、`NearbyScene`）借 `viewBox` 自然缩放；非 SVG 场景（`ArrivalScene`）的字号/内边距/间距改用 `clamp()`、必要元素 `flex-wrap`，确保窄屏内容区内不溢出。
- **响应式控制面板与页面容器**：`ControlPanel` 去固定宽、改 `max-width` + 100% 宽（内部 flex 已 `wrap`，窄屏自然纵向堆叠）；`App.vue` 页面容器在窄屏收敛内边距。
- **SVG 语义化**：`FullRouteScene`、`NearbyScene` 的 `<svg>` 加 `role="img"` 与经 `aria-labelledby` 关联的 `<title>`/`<desc>`，描述当前线路与运行状态。
- **交互控件可访问性**：自动/手动切换控件改用 `role="switch"` + `aria-checked` 并配稳定的可访问名；画面切换按钮组用 `role="group"` + 组标签包裹、各按钮以 `aria-pressed` 表当前选中；`LineSelector` 的 `<label>`/`<select>` 用 `for`/`id` 关联；新增全局 `:focus-visible` 可见焦点样式，覆盖按钮与下拉框。

## 功能 (Capabilities)

### 新增功能
- `experience-adaptation`: 体验适配——响应式布局（多屏幕尺寸自适应）与基础可访问性（语义化、ARIA 状态、标签关联、可见焦点）。

### 修改功能
<!-- 无既有规范级行为变更（dev-tooling、runtime-robustness 能力不受影响） -->

## 非目标

- 不修改任何业务逻辑（状态机、轮播、数据加载、主题解析行为不变）。
- 不重构 SVG 场景的绘制逻辑——仅为其补充语义标签。
- 不引入第三方 UI 组件库或 CSS 框架。
- 不做完整的 WCAG 合规审计——本阶段聚焦最影响可用性的可访问性项（语义、ARIA 状态、标签关联、焦点可见）。
- 不补单元测试——本阶段为 CSS / 模板 / ARIA 属性改动，无纯逻辑新增；验证靠 lint、type-check、build、阶段一二既有单测不回归，与一份明确的手动验收矩阵。
- 不扩充地铁线路 / 城市数据（属阶段四）。

## 影响

- **影响层**：仅渲染层 `src/components/` 与 `src/App.vue`——不触及 `src/core/` 与 `src/stores/`。
- **修改文件**：`src/components/lcd/LcdScreen.vue`、`src/components/lcd/LcdFrame.vue`、`src/components/lcd/scenes/FullRouteScene.vue`、`NearbyScene.vue`、`ArrivalScene.vue`、`src/components/controls/ControlPanel.vue`、`TrainControls.vue`、`LineSelector.vue`、`src/App.vue`；可能含一处全局焦点样式。
- **依赖**：不新增任何依赖。
