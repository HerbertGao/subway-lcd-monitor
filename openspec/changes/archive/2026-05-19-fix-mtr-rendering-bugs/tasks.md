## 1. Bug 1 —— 场景切换过渡 / 运行中空白（LcdScreen.vue）

- [x] 1.1 将场景切换过渡 CSS（`.lcd-fade-*` / `.lcd-slide-*`）从 `<style scoped>` 移入同文件独立的非 scoped `<style>` 块，并保留注释说明「过渡 class 加在 `<component :is>` 动态子场景根元素上、必须非 scoped 才能命中」
- [x] 1.2 `.lcd-screen` 增设 `position: relative`；场景根元素选择器（`.lcd-screen > :deep(*)`）由 `flex: 1` 改为 `position: absolute; inset: 0`，使 cross-fade 期间新旧场景叠放而非并排；保留 `overflow: hidden` / `aspect-ratio` / `min-height`
- [x] 1.3 确认 `<Transition>` 不使用 `mode="out-in"`（默认同步过渡）
- [x] 1.4 用 Playwright 在燕房线、房山线推进至 `RUNNING`，验证全程线路图正常渲染、不再整屏空白；切换全程图 / 近几站，验证过渡为叠放 cross-fade、无两场景并排闪现

## 2. Bug 2 + 3 —— 线路图填满 LCD 屏、蓝条贴底、站名不重叠（FullRouteScene.vue / NearbyScene.vue / useRouteLayout.ts）

- [x] 2.1 将底部蓝色提示条从 SVG 内移出为 `.full-route` 下的独立 HTML 元素；`.full-route` 改为 `display: flex; flex-direction: column`，蓝条 `flex: 0 0 auto`、固定高度贴底，SVG 区域 `flex: 1`
- [x] 2.2 重新设计 SVG 尺寸策略：将 `svgWidth` 由 `max(站数 × 90, 800)` 改为与站数无关的固定基准宽度，使 `viewBox` 宽高比贴近 SVG 显示区域比例、SVG 整体缩放比不随站数漂移；SVG 仅渲染线路图本体（背景 / 线路 / 站点 / 标记 / 文字层），以屏底色铺满 `flex: 1` 区域、内容垂直居中；移除 SVG 内原蓝条 `<rect>`/`<text>`（文案与配色沿用既有集中映射与 CSS 变量）；将 SVG `viewBox` 高度由原含蓝条的 `svgHeight=200` 改为不含蓝条的线路图本体高度，并据此重算 `lineY`、站名文字 y、方向箭头落点等内容纵坐标
- [x] 2.3 新增按可用站间距自适应字号的纯函数工具（`useRouteLayout.ts` 或同目录纯 TS 辅助）：CJK 约 `1.0×字号` / ASCII 约 `0.55×字号` 估算单字宽度，可用宽度取「站间距 × 安全系数 ≈ 0.9」，超宽时按比例下调字号至最小下限（基准约 60% 且不小于 7px viewBox unit），并标识字号触底后仍超宽、需水平压缩的项
- [x] 2.4 为 2.3 的字号适配纯函数补单元测试，覆盖：短名不缩、中等超长名缩字号至放入、超长英文名（房山线「Liangxiang Daxuecheng Bei」级）字号触底并被标记为需压缩 三类用例
- [x] 2.5 `FullRouteScene` 文字层中文名、英文名套用 2.3 的自适应字号（每站独立计算）；对字号触底仍超宽的项的 `<text>` 施加 SVG `textLength`（= 可用宽度）+ `lengthAdjust="spacingAndGlyphs"` 压缩进可用宽度（仅施于超宽项、不影响短名）
- [x] 2.6 `NearbyScene` 同步 2.1–2.5 的 flex column + 独立蓝条结构、viewBox 几何重算与站名自适应，保持与全程线路图版式一致
- [x] 2.7 用 Playwright 在房山线（16 站）验证：线路图填满 LCD 屏、蓝条贴 LCD 屏底、英文站名不重叠（以相邻站名元素 bounding box 不相交判定）、且典型桌面视口（视口宽 ≥ 1024px）下英文站名实际渲染 bounding box 高度不低于 8px（CSS 像素）；燕房线（9 站）回归同样正常

## 3. Bug 5 —— 线路图下一站圆点闪烁配色（FullRouteScene.vue / NearbyScene.vue）

- [x] 3.1 修改 `station-dot-flash` keyframes：`fill` 在 `var(--lcd-station-dot-upcoming)`（黄）与 `var(--lcd-station-dot)`（白）两态间交替（保持 `steps(1)` 硬切与原周期），`stroke` 恒为 `var(--lcd-fg)`（深色）、不随相位改变；确认下一站 `<circle>` 不设同名 SVG presentation 属性以免覆盖动画
- [x] 3.2 `NearbyScene` 如含同款下一站圆点闪烁动画，一并同步为黄↔白实心、描边恒定深色
- [x] 3.3 用 Playwright 在 `RUNNING` 状态验证下一站圆点在黄实心↔白实心间闪烁、描边恒为深色、无空心圆环；已过站白实心、未过站黄实心不受影响

## 4. Bug 6 —— 站名特写圆点按运行状态闪烁（ArrivalScene.vue）

- [x] 4.1 `ArrivalScene` 圆点按 `sim.trainState` 驱动两态：`ARRIVING` 时套用闪烁 class，`STOPPED` / `DEPARTING` 时保持静态白色实心
- [x] 4.2 新增站名特写圆点闪烁 keyframes：`background` 在 `var(--lcd-station-dot)`（白）与 `var(--lcd-station-dot-upcoming)`（黄）两态间 `steps(1)` 硬切交替、周期与线路图下一站闪烁一致，`border` 恒为 `var(--lcd-fg)`（深色）
- [x] 4.3 用 Playwright 验证 `ARRIVING` 站名特写圆点闪烁黄↔白实心、描边恒定深色；`STOPPED` / `DEPARTING` 站名特写圆点为静态白实心

## 5. Bug 4 —— 页面外层背景港铁化（App.vue / 全局样式）

- [x] 5.1 将页面外层背景由深蓝 `#1a1a2e` 改为与港铁风格协调的中性深灰；色值在全局样式集中以单一 CSS 变量 / 规则承载，不散落硬编码于多个组件
- [x] 5.2 用 Playwright 验证页面外层背景已更新、与浅色 LCD 屏视觉协调

## 6. 整体回归

- [x] 6.1 运行 `pnpm lint`、`pnpm test`、`pnpm build` 全部通过
- [x] 6.2 用 Playwright 在燕房线、房山线及窄屏（320–1280）端到端回归 Bug 1–6，确认 6 项缺陷均消除、无新回归；其中 Bug 3 以相邻站名元素 bounding box 不相交判定、并验证典型桌面视口（≥ 1024px）下英文站名实际渲染高度不低于 8px（CSS 像素），不仅靠截图目测
