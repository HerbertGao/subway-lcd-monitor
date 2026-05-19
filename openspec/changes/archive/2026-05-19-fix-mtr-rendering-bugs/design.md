## 上下文

期四归档后用 Playwright 对燕房线（9 站）、房山线（16 站）做端到端测试，发现 6 个渲染层缺陷。本设计说明每个缺陷的根因与修复方案。改动全部限于渲染层（`src/components/lcd/`、`src/App.vue` / 全局样式），不触及核心逻辑层与数据层，不引入依赖。

当前相关实现要点：

- `LcdScreen.vue`：`<Transition :name>` 包 `<component :is="currentSceneComponent" :key="currentScene?.id">`。过渡 CSS 此前写在 `<style scoped>` 内。`.lcd-screen` 为 `display:flex`、`aspect-ratio:7/2`、`min-height:160px`、`overflow:hidden`，场景根元素 `.lcd-screen > :deep(*) { flex:1 }`。
- `FullRouteScene.vue`：单个 `<svg>`，`viewBox="0 0 svgWidth svgHeight"`，`svgHeight=200` 固定、`svgWidth=max(站数*90,800)`，`preserveAspectRatio="xMidYMid meet"`，`width/height:100%`。底部蓝色提示条以 SVG `<rect>+<text>` 画在 viewBox 内。英文名 `<text>` `font-size` 9（当前站 10），`text-anchor=middle`。
- `useRouteLayout.ts`：站点坐标 `stationX` 按 `padding + index/(count-1)*usable` 均分。
- `NearbyScene.vue`：与全程线路图共用 `useRouteLayout`，结构同构。

## 目标 / 非目标

**目标：**

- 修复 P0：`RUNNING` 线路图整屏空白、场景切换过渡失效（Bug 1）。
- 修复线路图未填满 LCD 屏、蓝条不贴底（Bug 2）。
- 修复密集线路下英文站名重叠（Bug 3）。
- 修复页面外层背景未港铁化（Bug 4）。
- 修复线路图下一站圆点闪烁配色错误（Bug 5）。
- 修复站名特写圆点未随运行状态闪烁（Bug 6）。
- 全程线路图与近段线路图保持版式一致。

**非目标：**

- 不改三场景布局骨架与 LCD 屏 7∶2 比例。
- 不扩充线路数据、不做换乘线路标签（属期三）。
- 不引入第三方依赖。
- 不改核心逻辑层（状态机、SceneRotator、主题解析）——本变更不涉及状态机或场景轮播逻辑。

## 决策

### 决策 1：场景切换过渡 —— 过渡 CSS 移出 scoped + 场景容器绝对定位重叠

**根因。** `LcdScreen.vue` 的过渡 CSS 写在 `<style scoped>` 内，被编译为 `.lcd-fade-enter-active[data-v-X]` 这类带宿主 scope 属性的选择器。但 `<Transition>` 的过渡 class 是运行时加在 `<component :is>` 动态渲染出的**子场景组件根元素**上。本变更测试期间在浏览器中实测确认：渲染出的子场景根元素只带子场景组件自身的 `data-v` 属性、不带 `LcdScreen` 的 `data-v-X`；样式表中过渡规则的编译产物确为带 `[data-v-X]` 的 scoped 选择器；过渡元素的 `getComputedStyle` 实测为 `transitionProperty:all`、`transitionDuration:0s` —— 即该 scoped 选择器未命中子场景根元素、过渡样式未生效。叠加 `<Transition mode="out-in">` 后，out-in 的「等离场结束再入场」状态机与失效的过渡时长交互失常，卡死在渲染注释占位 `<!---->`，`RUNNING` 线路图整屏空白。

**决策。**

1. 过渡 CSS（`.lcd-fade-*` / `.lcd-slide-*`）移出 `<style scoped>`，放入同文件的独立非 scoped `<style>` 块。非 scoped 后选择器为纯 class、无 `data-v` 属性，可正常命中子场景根元素。class 名以 `lcd-` 前缀，全局命名冲突风险可忽略。
2. 不使用 `mode="out-in"`。改为默认（同步）过渡，配合绝对定位让新旧场景在 cross-fade 期间叠放：`.lcd-screen` 设 `position:relative`，场景根元素（`.lcd-screen > :deep(*)`）设 `position:absolute; inset:0`，取代原 `flex:1`。这样过渡期两个场景重叠淡入淡出，而非作为 flex 兄弟并排闪现。

**替代方案。**

- 用 `:deep()` 包裹过渡 class —— `:deep(.lcd-fade-enter-active)` 编译为 `[data-v-X] .lcd-fade-enter-active` 后代选择器，而过渡元素是 `.lcd-screen` 的直接子级、且 class 动态，命中关系脆弱；不如直接移出 scoped 干净。否决。
- 保留 `mode="out-in"` 仅修 CSS 作用域 —— 实测即便过渡 CSS 生效，`mode="out-in"` + 动态组件仍卡死渲染 `<!---->`；out-in 对本场景（整屏场景轮播）也非必要。否决。

**影响说明。** `.lcd-screen` 的 `overflow:hidden`、`aspect-ratio`、`min-height` 不变；场景根从 flex 子项改为绝对定位子项后，其尺寸由 `inset:0` 撑满 `.lcd-screen`，与原 `flex:1` 等效填满，不影响既有窄屏不裁剪行为。

### 决策 2：线路图填满 LCD 屏、蓝条贴底 —— 蓝条移出 SVG、改 flex column 布局

**根因。** SVG `viewBox` 高度固定 200、宽度随站数增长（房山线 16 站 → 宽 1440），viewBox 宽高比（7.2∶1）与 LCD 屏 7∶2（3.5∶1）不一致；`preserveAspectRatio="xMidYMid meet"` 按宽匹配等比缩放后，SVG 内容高度远小于屏高，上下留白，画在 viewBox 底部的蓝条随之悬在屏中部。

**决策。** 把底部蓝色提示条从 SVG 内移出（改为 `.full-route` 下的独立 HTML 元素），并重新设计 SVG 尺寸策略：

- **SVG 尺寸策略**：`svgWidth` 不再随站点数线性增长（原 `max(站数 × 90, 800)` 使房山线 16 站时 viewBox 宽达 1440、SVG 被容器按宽度等比缩小约 0.67×，连同字号与圆点一起缩小、字号下限失去屏幕像素意义）。改为与站数无关的**固定基准宽度**，站点由 `stationX` 在其内均分；`viewBox` 宽高比设为贴近 SVG 显示区域（LCD 屏去蓝条后）的宽高比，使 `preserveAspectRatio="meet"` 下 SVG 整体缩放比稳定、可预期、不随站数漂移。站多则站距收窄，重叠交由决策 3 的字号自适应解决。
- `.full-route` 设 `display:flex; flex-direction:column`。
- 蓝色提示条为独立 HTML 元素，`flex:0 0 auto`、固定高度，恒贴 `.full-route`（即 LCD 屏）底边。
- SVG 仅渲染线路图本体（背景 / 线路 / 站点 / 标记 / 文字层），置于 `flex:1` 的上方区域并以屏底色铺满该区域；SVG 内容在其中垂直居中。
- 蓝条移出后 SVG 本体不再为蓝条预留下方空间：SVG `viewBox` 高度（原 `svgHeight=200`，含底部 `infoBarHeight` 蓝条区）须改为「不含蓝条的线路图本体高度」，并据此重算 `lineY`、站名文字 y、方向箭头落点等所有内容纵坐标，使线路图本体在新 viewBox 内垂直居中、自然填满 SVG 区域，不残留原蓝条预留的空白。`FullRouteScene` 与 `NearbyScene` 同步重算。

如此无论站点多少，蓝条恒贴 LCD 屏底；线路图本体居中于其上方区域、由屏底色铺满，不再出现「蓝条悬空、其下大片空白」。`NearbyScene` 采用相同的 flex column + 独立蓝条结构以保持版式一致。蓝条文案与配色仍取自既有集中映射与 CSS 变量。

**替代方案。** 保留 `svgWidth` 随站数线性增长、仅令 `svgHeight` 跟随以维持 viewBox 比例 —— viewBox 仍随站数变宽变高，SVG 整体缩放比仍随站数漂移、viewBox 内字号下限无法对应稳定的屏幕像素；不如「固定基准宽度 + 字号自适应」干净可控。否决。

### 决策 3：密集线路英文站名不重叠 —— 按可用宽度自适应字号

**根因。** 站点按 `stationX` 在 `svgWidth` 内均分，相邻站间距随站数增大而收窄；英文名 `<text>` 字号固定（9 / 当前站 10），长英文名（如 `Liangxiang Daxuecheng Bei`）渲染宽度超出站间距，相邻站英文名重叠。

**决策。** 站名在站间距内不重叠采用分层 fallback —— 「不重叠」为硬约束（房山线 16 站必须达成），可读性在此前提下尽量保留：

1. **缩字号**：按「文本估算宽度 vs 可用站间距」自适应——估算宽度超过可用宽度时，按比例下调该站字号至恰好放入，最低到字号下限；每站独立计算，短名不缩、不被强制拉伸。
2. **超宽项水平压缩**：字号已到下限仍超宽的项，对**该项**的 `<text>` 施加 SVG `textLength`（设为可用宽度）+ `lengthAdjust="spacingAndGlyphs"`，将其水平压缩进可用宽度。`textLength` 仅施于触底仍超宽的项、不施于其余项，故不会拉伸短名。
3. 经步骤 1、2 后所有站名宽度均不超过可用宽度、相邻站名不重叠（硬约束达成）。

新增一个纯函数式字号适配工具（放 `useRouteLayout.ts` 或同目录纯 TS 辅助），承载步骤 1 的宽度估算与字号计算，并标识哪些项字号触底、仍超宽、需走步骤 2。英文名必走该适配；中文名一般较短，亦套用同一适配作兜底。

**适配参数（实现须落到明确常量、不留模糊）：**

- 单字宽度估算：CJK 字符按约 `1.0 × 字号`、ASCII 字符按约 `0.55 × 字号`。
- 可用宽度：取「相邻站间距 × 安全系数（约 `0.9`，给相邻站名留间隙）」。
- 最小字号下限：下调后不低于基准字号的约 `60%`、且不小于 `7px`（viewBox user unit）。字号到下限仍超宽的项走步骤 2 的 `textLength` 压缩，不「维持下限放任超宽」。
- 适配工具为纯函数，必须配单元测试，覆盖：短名不缩、中等超长名缩字号至放入、超长英文名（房山线「Liangxiang Daxuecheng Bei」级）字号触底并被标记为需 `textLength` 压缩 三类用例。
- 经决策 2 固定 SVG 缩放比后，viewBox 内字号下限对应稳定的屏幕像素。回归须用 Playwright 读取英文站名的**实际渲染** bounding box：在典型桌面视口（视口宽 ≥ 1024px）下，验证房山线 16 站相邻站名 bbox 不相交、且英文站名渲染高度不低于 `8px`（CSS 像素）。

**替代方案。**

- 对**全体**站名统一施加 `textLength` + `lengthAdjust` —— 会把短名也强制拉伸 / 压缩到统一宽度、观感差；故只在步骤 2 对触底超宽项选择性施加。
- 英文名手动切词换行为多行 `<tspan>` —— SVG 文本不自动换行，手动切词逻辑复杂、且会增加行高挤占布局。否决。

### 决策 4：页面外层背景港铁化

**根因。** App 外层页面背景为深蓝 `#1a1a2e`，与浅色港铁 LCD 屏不协调。

**决策。** 将页面外层背景改为与港铁风格协调的中性深灰。页面外层属应用外壳、不属 LCD 屏主题范畴，故**不**纳入主题系统的 `ColorConfig`（`ColorConfig` 与 `useTheme` 注入面向 LCD 屏内部配色）；改为在全局样式中以单一集中的颜色定义（如 `:root` 上的一个 CSS 变量或单条全局规则）承载，避免色值散落、硬编码于多个组件。这是对 proposal 中「不硬编码、集中管理」意图的具体落实。

### 决策 5：下一站圆点闪烁 —— 黄↔白实心交替、描边恒定

**根因。** `FullRouteScene` 的 `station-dot-flash` 动画在白色相位（keyframes 50%）将 `fill` 设为 `var(--lcd-bg)`（屏底色，视觉呈空心圆环）、并把 `stroke` 由深色改成 `var(--lcd-station-dot)`（白色）。与港铁实拍闪烁采样帧（`/tmp/mtr-flash/`，对下一站「錦上路」圆点密集采样）逐帧比对发现：真实港铁下一站圆点闪烁是「黄色实心 ↔ 白色实心」两态交替，圆点描边恒为深色、闪烁全程不变，从不出现空心圆环。当前实现把白态做成了空心、且让描边跟着变色，均与实拍不符。

**决策。** 修改 `station-dot-flash` keyframes：`fill` 在 `var(--lcd-station-dot-upcoming)`（黄）与 `var(--lcd-station-dot)`（白）两态间交替（保持 `steps(1)` 硬切、闪烁周期不变），`stroke` 恒为 `var(--lcd-fg)`（深色）、不再随相位改变。下一站 `<circle>` 仍由该 class 动画统一控制 `fill` / `stroke`、不在元素上设同名 SVG presentation 属性以免覆盖。`NearbyScene` 若含同款动画一并同步。已过站、未过站圆点的着色与描边不变。修改后三类圆点共享同一深色描边，仅以填充色区分状态，下一站额外有黄↔白闪烁，视觉与港铁实拍一致。

### 决策 6：站名特写圆点 —— ARRIVING 闪烁、其余状态静态白实心

**根因。** `ArrivalScene` 的圆点为静态白色实心 div，不随运行状态变化。闪烁帧比对显示：站名特写在 `ARRIVING` 状态下其展示站（按既有逻辑即正驶向的下一站 `nextStation`）的圆点会闪烁——同站「錦上路」站名特写在不同帧分别呈黄、白（flash-20 黄 / frame-08 白）。该圆点应与线路图下一站圆点（决策 5）遵循同一闪烁规律。

**决策。** `ArrivalScene` 圆点按 `trainState` 驱动两态：

- `ARRIVING` 状态（展示站即下一站）：圆点套用闪烁动画——`background` 在 `var(--lcd-station-dot)`（白）与 `var(--lcd-station-dot-upcoming)`（黄）两态间交替（`steps(1)` 硬切、周期与线路图下一站闪烁一致），`border` 恒为 `var(--lcd-fg)`（深色）。
- `STOPPED` / `DEPARTING` 状态（展示站为已停靠的当前站）：圆点为静态白色实心、深色描边、不闪烁（即现状）。

判定条件直接用 `sim.trainState === ARRIVING`（既有 `getDisplayedArrivalStation` 逻辑保证 `ARRIVING` 时展示站即 `nextStation`），不需额外引入下一站比对。圆点填充 / 描边色仍取自 CSS 变量。与决策 5 共用同一套闪烁色与周期，保证线路图与站名特写视觉统一。

**替代方案。** 让 `ArrivalScene` 自行比对展示站是否等于 `sim.nextStation` —— 与 `getDisplayedArrivalStation` 的状态映射重复判定、易不一致；直接用 `trainState` 更简洁可靠。否决。

## 风险 / 权衡

- [下一站闪烁白态与已过站白实心同色] → 两者均为白色实心、深色描边，仅靠动画区分（已过站静止、下一站持续闪烁）；与港铁实拍一致，可接受。
- [非 scoped 过渡 CSS 泄漏为全局] → class 以 `lcd-` 前缀、且仅服务 `LcdScreen` 的 `<Transition>`，项目内无同名 class，冲突风险可忽略；保留注释说明为何必须非 scoped。
- [场景根改绝对定位后尺寸/裁剪行为变化] → `inset:0` 撑满 `.lcd-screen`，与原 `flex:1` 等效；`.lcd-screen` 的 `min-height` 与 `overflow:hidden` 不变，窄屏不裁剪的既有约束仍由 `.lcd-screen` 自身承担，需在窄屏（320–1280）回归验证。
- [字号自适应为估算、非精确测量] → 估算偏保守（系数留安全余量）即可保证不重叠；精确 `getBBox` 测量需挂载后读取、复杂度高，对本场景收益不足。
- [蓝条移出 SVG 后与线路图本体的视觉接缝] → 蓝条高度、配色沿用原 SVG 内蓝条参数，HTML 与 SVG 同宽贴合，视觉等价。

## 迁移计划

纯前端渲染修复，无数据 / 接口 / 状态机变更，无需迁移；回滚即还原相关组件文件。修复后须用 Playwright 在燕房线、房山线及窄屏（320–1280）回归验证 Bug 1–6 共 6 项缺陷均消除；其中站名不重叠（Bug 3）须以相邻站名元素的 bounding box 不相交来判定，不仅靠截图目测，并配字号适配纯函数的单元测试。
