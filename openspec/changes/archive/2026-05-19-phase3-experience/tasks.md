## 1. 渲染层 — 响应式布局

- [x] 1.1 `src/components/lcd/LcdScreen.vue`：根元素由硬编码 `width: 960px; height: 320px` 改为 `width: 100%` + `aspect-ratio: 3 / 1`；header/footer 的字号与内边距改用 `clamp()` 自适应
- [x] 1.2 `src/components/lcd/LcdFrame.vue`：根元素设 `box-sizing: border-box` 与 `max-width: 100%`、`width: min(<960 加外框 chrome>, 100%)`，padding 用 `clamp()` 在窄屏收敛，确保「含外框整体」不溢出视口、不产生横向滚动
- [x] 1.3 `src/components/controls/ControlPanel.vue`：根元素 `width: 960px` 改为 `width: 100%` + `max-width: 960px`，确认内部分区在窄屏正常换行/堆叠
- [x] 1.4 `src/App.vue`：`#subway-monitor` 页面容器的 `padding` 在窄屏用 `clamp()` 收敛，避免小屏内容被挤压溢出
- [x] 1.5 `src/components/lcd/LcdScreen.vue`：为根元素设 `min-height`，使极窄屏（320/375px）下严格 3∶1 会导致内容区过小时，LCD 屏高度让步于内容、`ArrivalScene` 不被 `.lcd-screen__content` 的 `overflow:hidden` 裁剪；`min-height` 取值须容纳 header+footer+`ArrivalScene` 含换乘行的最小排版（按 clamp 下限推算并留余量），必要时同步下调 `ArrivalScene`/header/footer 的 clamp 下限，使 320/375px 下场景级 `scrollHeight <= clientHeight` 成立

## 2. 渲染层 — LCD 场景内容响应式

- [x] 2.1 核对 `FullRouteScene.vue`、`NearbyScene.vue` 的 `<svg>` 为 `width: 100%; height: 100%; display: block`，随容器矢量缩放（不改绘制坐标）
- [x] 2.2 `src/components/lcd/scenes/ArrivalScene.vue`（非 SVG 文本场景）：固定字号（42/18/16/14px）、内边距、间距改用 `clamp()` 自适应，换乘等多元素行加 `flex-wrap`，确保窄屏内容区内不溢出、不挤压重叠

## 3. 渲染层 — SVG 场景语义化

- [x] 3.1 `FullRouteScene.vue`、`NearbyScene.vue`：`<svg>` 加 `role="img"` 与 `aria-labelledby`，在 SVG 内首位加带唯一 `id` 的 `<title>`（简短名称）与 `<desc>`（含当前线路名、当前站、运行方向的动态描述）；不加 `tabindex`、不改绘制坐标与视觉

## 4. 渲染层 — 交互控件可访问性

- [x] 4.1 `src/components/controls/TrainControls.vue`：自动/手动切换按钮改用 `role="switch"` + `:aria-checked="sim.isAutoMode"`，并配稳定的可访问名（如 `aria-label="自动运行"`，不随可见文本变化）
- [x] 4.2 `src/components/controls/ControlPanel.vue`：画面切换按钮组外层加 `role="group"` + `aria-label="画面切换"`，组内每个按钮加 `:aria-pressed="i === sim.currentSceneIndex"`
- [x] 4.3 `src/components/controls/LineSelector.vue`：为城市/线路/方向三个 `<select>` 各设唯一 `id`，对应 `<label>` 加 `for` 指向该 `id`
- [x] 4.4 可见焦点：移除 `LineSelector.vue` 中 select 的 `outline: none`，新增一组全局 `:focus-visible` 焦点样式（清晰描边/轮廓），覆盖按钮与下拉框

## 5. 验证

- [x] 5.1 运行 `pnpm lint && pnpm format:check && pnpm type-check && pnpm test && pnpm build`，确认整链通过、阶段一二的 71 个单测不受影响
- [x] 5.2 按验收矩阵手动验证响应式：在视口宽度 320 / 375 / 768 / 960 / 1280 下逐一切换三个场景，分层核验——(a) 页面级：`document.documentElement.scrollWidth <= document.documentElement.clientWidth`、无横向滚动；(b) LCD 屏（含外框）与控制面板根元素 bounding rect 在视口内；(c) 场景级：每个场景根元素 `scrollWidth <= clientWidth` 且 `scrollHeight <= clientHeight`、其 bounding rect 完全落在 `.lcd-screen__content` 内（该容器 `overflow:hidden`，仅靠页面级判据会漏判被裁剪的内部溢出）；(d) `ArrivalScene` 额外：换乘信息行换行后不超出、关键文本节点 bounding rect 不互相重叠
- [x] 5.3 按验收矩阵手动验证可访问性：DOM 检查两个 SVG 场景 `<svg>` 的 `role="img"` 与 `aria-labelledby` 指向有效 `<title>`/`<desc>`；自动/手动控件 `role="switch"` 与 `aria-checked` 随状态变化；画面切换组 `role="group"`+`aria-label`、各按钮 `aria-pressed` 正确；三个 `<select>` 的 `id` 与 `<label for>` 一一对应；键盘 Tab 遍历所有控件，每个获焦控件均有可见焦点指示
