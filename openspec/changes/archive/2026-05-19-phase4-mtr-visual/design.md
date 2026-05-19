## 上下文

`default` 主题是项目早期自拟的深蓝 Demo 风格。用户提供港铁西铁线 LCD 报站屏视频，要求把 LCD 视觉重做为港铁风。本变更是「港铁风重制」三期路线图的期一——视觉基底。视频参考帧已切出存于 `/tmp/mtr-frames/frame-01.png` 至 `frame-18.png`。

技术约束：只动渲染层与主题（`src/themes/`、`src/components/lcd/`、`src/composables/useTheme.ts`），外加 `src/core/models/theme.ts` 的 `ColorConfig` 类型扩展（纯类型、无逻辑、无 Vue 依赖）；不改 `src/core/` 运行逻辑与 `src/stores/`；不引入 UI/CSS 框架。

相关现状：
- `LcdScreen.vue`：根元素 `aspect-ratio: 3/1` + `min-height: 210px`（阶段三）；模板为 header（线路名+方向）+ `.lcd-screen__content`（场景）+ footer（状态+站名）三段；`<script>` 含 `activeLine`/`currentStation`/`trainStateLabel`/`directionLabel` 等 computed 与 `Direction` import，仅服务 header/footer。
- `theme.ts` 的 `ColorConfig` 现有 8 字段；`Theme` 为严格类型。`theme-resolver.test.ts` 的主题 fixture 按现有 8 字段构造完整 `Theme`。
- `useTheme.injectCSSVariables` 把 `colors` 各字段 `setProperty` 成 `--lcd-*` CSS 变量。
- 现有 `FullRouteScene`/`NearbyScene` 已渲染换乘 badge（站点下方挂换乘线路标签）。

## 港铁风视觉观察（取自参考帧）

- LCD 是横向超宽浅灰条，不同画面整屏切换。
- 站名特写（frame-01/02/05/12 等）：上半浅灰区超大中文站名 + 圆点 + 英文名，下半黄色安全条 + 双语提示。
- 线路图（全程/近段，frame-03/04/07/15/17）：站点横排，圆点 + 中文名在上、英文名在下；线路条粗横线——**已过区段灰、未过区段为线路自身色**（视频中西铁线为品红），已过站名转灰；当前站处嵌 `→` 行进方向箭头（也是灰/未过色的分界）；**底部蓝色提示条**。
- 站点圆点：参考帧中圆点颜色（白 / 黄 / 空心等）随列车运行进程动态变化——例如 frame-07（列车在锦上路）未来站显黄点、frame-16（列车接近红磡）红磡显白点——属动态状态表现，非静态位置规则。

## 目标 / 非目标

**目标：**`default` 主题配色、LCD 比例、三场景版式重做为港铁风视觉基底；港铁配色经主题系统提供。

**非目标：**不做状态化圆点配色、状态→提示语映射、开门方向提示、蓝条轮播文案（期二）；不扩充西铁线数据、不做换乘线路标签（期三）；不改业务状态机/轮播/数据逻辑；不补单元测试。

## 决策

### 1. LCD 外形：超宽横条 7∶2

`LcdScreen` 根元素比例由 `3 / 1` 改为 **`7 / 2`（3.5∶1）**——proposal / spec / tasks 统一此值。沿用阶段三响应式机制（`LcdFrame` 的 `box-sizing` + `min(…,100%)` + `max-width`、`clamp` 内边距），`min-height` 见决策 6。

### 2. LcdScreen 结构：整屏场景容器，移除并清理 header/footer

港铁不同画面是整屏内容，没有项目当前的独立 header/footer。期一把 `LcdScreen` 简化为整屏场景容器——场景 `Transition` 占满 LCD 屏。

**必须同步清理 `<script>`**：移除 header/footer 后，仅服务它们的 `activeLine`/`currentStation`/`trainStateLabel`/`directionLabel` 等 computed、`Direction` import 及相关 CSS 类会变成未使用代码；项目启用 `noUnusedLocals`/`noUnusedParameters`，不清理会导致 `type-check` 失败。须只保留场景调度、`Transition` 与主题注入所需代码。原 header/footer 承载的信息：线路靠线路条颜色表达、方向靠线路图 `→` 箭头表达、站名是站名特写场景主体；运行状态的显式呈现属期二。

### 3. `ColorConfig` 扩展与港铁配色规格

`ColorConfig`（`src/core/models/theme.ts`）**新增** 5 个必填港铁配色字段：`safetyBar`、`safetyBarText`、`infoBar`、`infoBarText`、`stationDot`。`useTheme.injectCSSVariables` 同步注入为 `--lcd-*` CSS 变量。

**新增必填字段后，所有完整构造 `Theme` 的位置都须补齐新字段**，否则 `type-check` 失败——包括 `src/themes/default/index.ts` 与 `src/core/theme-resolver.test.ts` 的主题 fixture。

港铁配色基准值（实现对照参考帧可微调）：

| 用途 | 来源 | 基准值 |
|---|---|---|
| 屏底浅灰 | `background` | `#e8e8e8` |
| 主文字 / 圆点描边（黑） | `foreground` | `#1a1a1a` |
| 线路条·已过段 / 已过站名（灰） | `passedStation` | `#9a9a9a` |
| 当前站名 / 未来站名（黑） | `currentStation` / `futureStation` | `#1a1a1a` |
| 黄色安全条 / 其文字 | `safetyBar` / `safetyBarText`（新增） | `#f2b600` / `#1a1a1a` |
| 底部蓝色提示条 / 其文字 | `infoBar` / `infoBarText`（新增） | `#13315c` / `#ffffff` |
| 站点圆点（白实心） | `stationDot`（新增） | `#ffffff` |
| 线路条·未过段 | **线路数据 `line.color`** | 数据驱动 |

边界：港铁主题色板经 `ColorConfig` + CSS 变量提供、不在组件写死；线路条未过段颜色由线路数据 `line.color` 驱动。现有 `lineColor` 字段保留（不删），港铁风下线路条未过段优先用 `line.color`。

### 4. 站点圆点与已过/未过区分（期一）

期一站点圆点**统一**为白色实心 + 细深色描边（`stationDot` 填充 + `foreground` 描边），**不引入状态化配色**。已过站 / 当前站 / 未来站的区分由以下三者表达，**不靠圆点颜色**：
- 线路条颜色——已过段 `passedStation` 灰、未过段线路自身色 `line.color`；
- 已过站名转灰（`passedStation`），当前/未来站名为黑；
- 当前站处的 `→` 行进方向箭头（即灰/未过色的分界点）。

当前站圆点可略大以突出。

**期二输入（已查证）**：对参考视频线路图时段密集采样（每 0.5 秒一帧）确认，站点圆点是动态状态——列车正驶向的「下一站」圆点在**黄色实心 ↔ 白色空心**之间闪烁（每相位约 1 秒）；其余未过站稳定黄色实心；已过站白色实心。这套状态化圆点（含闪烁）属「细腻状态」、是**期二**范围；期一只建立统一的白实心圆点与基于线路条/站名的位置区分，不实现状态色与闪烁。`ArrivalScene` 站名特写圆点同理：期一用白色实心默认态。

### 5. 三场景港铁版式骨架与图层式分层

- **`FullRouteScene`**：浅灰背景；全部站横排，每站圆点居中、中文名在上、英文名在下；贯穿所有圆点的粗横线路条，已过段 `passedStation` 灰、未过段 `line.color`，已过站名转灰；当前站处 `→` 箭头；圆点按决策 4 统一白实心；**底部渲染蓝色提示条**（`infoBar` 容器，本期放固定占位文字，轮播文案属期二）。**期一不渲染换乘线路标签**——现有的换乘 badge 在重绘时移除，换乘标签属期三。
- **`NearbyScene`**：与 `FullRouteScene` 同一视觉语言，仅显示当前站附近数站、字号更大；同样含底部蓝条、不渲染换乘标签。
- **`ArrivalScene`**：上半浅灰区——超大中文站名 + 白实心圆点 + 英文名横向排布（参考 frame-12）；下半黄色安全条（`safetyBar`，本期放固定占位「請小心空隙 Please mind the gap」）。**期一移除现有的换乘 badge（`.arrival__transfers`）**——换乘展示属期三。

三个场景在期一**一律不渲染换乘线路标签 / badge**，即使站点数据含 `transfers`——换乘线路标签展示统一属期三。

三场景沿用阶段三的响应式成果（SVG `viewBox` 自适应、`clamp` 字号、SVG `role="img"`/`<title>`/`<desc>`、`focus-visible`）不回归。

**图层式分层架构**：三个场景组件内部按「图层」组织——每个场景拆为若干职责单一、互不耦合的图层，自底向上叠加：

| 图层 | 职责 | 适用场景 |
|---|---|---|
| 背景层 | 浅灰屏底 | 全部 |
| 线路层 | 双色线路条（已过灰 / 未过 line.color） | 线路图（FullRoute/Nearby） |
| 站点层 | 站点圆点（决策 4 统一白实心） | 线路图 |
| 文字层 | 站名中英文 | 全部 |
| 标记层 | 行进方向箭头等 | 线路图 |
| 提示条层 | 黄色安全条 / 蓝色提示条 | 站名特写黄条 / 线路图蓝条 |

分层目的：① 各层职责单一，改一层不波及其它层，避免不同视觉元素的样式与逻辑互相耦合；② 期二做「细腻状态」时，状态变化只驱动相关层（站点层圆点色、提示条层文案），布局层与线路层不受影响；③ `FullRouteScene` 与 `NearbyScene` 可共享线路层/站点层逻辑。落地形式：SVG 线路图场景内用结构化 `<g>` 分组分层、可复用层逻辑抽为子组件或组合式函数；`ArrivalScene` 用分层 DOM 结构。层间通过明确输入（props / 主题 CSS 变量）通信，不互相读取对方内部状态。

### 6. `min-height` 重新核算与验收口径

移除 header/footer、改 7∶2、`ArrivalScene` 改为「上半区 + 黄条」后，阶段三基于「3∶1 + header/footer + 旧 ArrivalScene」的 `210px` 推导失效。新 `min-height` 须按——7∶2 比例下极窄屏（320px）LCD 屏高度（约宽 × 2/7）不足以容纳最高场景（`ArrivalScene` 站名特写：站名行 + 英文行 + 黄条 + 内边距，各按 `clamp` 下限）——重新推算、留余量定值，推导写入 `LcdScreen.vue` 注释。

验收口径：在视口 320/375/768/960/1280 下逐场景核验**场景根元素** `scrollWidth <= clientWidth` 且 `scrollHeight <= clientHeight`、内容不被 `LcdScreen` 的 `overflow:hidden` 裁剪。

### 7. 验证方式

本期为 CSS、模板、类型与主题数据改动，无纯逻辑新增，不补单元测试。回归靠阶段一二的 71 个单测保持通过（含更新后的 `theme-resolver.test.ts` fixture）+ `lint`/`format:check`/`type-check`/`build` 整链通过；港铁视觉用对照 `/tmp/mtr-frames/` 参考帧的手动验收（决策 6 的场景级判据）。

## 风险 / 权衡

- **移除 header/footer + 改比例 + 重绘三场景是较大结构改动** → 沿用阶段三响应式机制，`min-height` 按新盒模型核算并以场景级 DOM 判据验收。
- **港铁精确色值需对照视频微调** → design 给基准色值表，实现对照 `/tmp/mtr-frames/` 帧调整。
- **`ColorConfig` 新增必填字段会波及完整 `Theme` 构造点** → 决策 3 已明确同步更新 `default/index.ts` 与 `theme-resolver.test.ts` fixture。
- **期一不做状态化圆点** → 参考帧的黄/白动态圆点是「细腻状态」，划归期二；期一圆点统一白实心、靠线路条与站名色表达位置，避免把动态状态误固化为静态规则。
