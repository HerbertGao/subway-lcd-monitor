## 上下文

港铁风重制期一（视觉）、期二（状态）已归档，`fix-mtr-rendering-bugs` 已修复 6 个渲染缺陷。期三依据 `docs/mtr-ui-reference.md` 补齐换乘相关内容与界面细节。改动集中在渲染层，新增少量 `src/core` 纯函数；不改状态机（`TrainFSM`）与场景轮播机（`SceneRotator`）的逻辑，仅扩展场景配置数据与场景组件。

当前相关实现要点：

- 场景由 `theme.scenes[TrainState]`（`SceneConfig[]`）配置，`SceneRotator` 按列表轮播；`LcdScreen.vue` 用 `sceneComponentMap`（`full-route` / `nearby` / `arrival`）将场景 id 映射到组件。
- `simulation` store 的 `updateScenes()` 取 `theme.scenes[trainState]` 设入 `SceneRotator`。
- `FullRouteScene` / `NearbyScene` 共用 `useRouteLayout`；站点数据含 `transfers: { lineId, lineName, lineColor }[]`。期一曾移除换乘 badge。
- `ArrivalScene` 的开门提示 `.arrival__door-hint` 为绿底圆角胶囊 / 深色字两态，文案由 `getDoorHint(doorSide)` 提供；黄条 `.arrival__safety-bar` 文案由 `getSafetyBarText(trainState)` 提供。
- 数据：`line-yanfang.json`（9 站）、`line-fangshan.json`（16 站），两线在阎村东互为换乘（`transfers` 互指）。

## 目标 / 非目标

**目标：**

- 线路图场景换乘站渲染换乘线路标签（Bug 对照差异 1）。
- 站名特写黄条按文案渲染两端警示图标、版式随文案微调（差异 2）。
- 开门方向提示样式对齐实拍（差异 3）。
- 下一站为换乘站时，全程线路图在换乘站处渲染换乘线路支线、底部蓝条切换为换乘提示文案（换乘网络信息融入全程线路图，不新增独立场景）。
- 方向箭头改为定位于区间线段中部、与下一站圆点同步闪烁（参考文档差异 7）。

**非目标：**

- 不改 `TrainFSM` / `SceneRotator` 逻辑、不改 LCD 屏 7∶2 比例与三场景布局骨架。
- 不引入新城市 / 线路数据、不引入第三方依赖或图片资源。
- 不做蓝条文案多主题轮换扩充。

## 决策

### 决策 1：换乘线路标签 —— 数据驱动的彩色名牌，渲染在换乘站圆点下方

期一为聚焦视觉骨架移除了换乘 badge，本期正式渲染。

- 在 `FullRouteScene` / `NearbyScene` 的文字层下方（圆点下方区域）新增「换乘标签层」。仅 `station.transfers` 非空的站渲染。
- 每个换乘项渲染为一枚港铁式彩色线路名牌：以 `transfers[].lineColor` 为底色 / 边框色，标注 `transfers[].lineName`（如「房山线」）。颜色与文案全部取自 `transfers` 数据，组件不写死。
- 一站有多个换乘项时纵向叠放多枚名牌。
- 标签宽度受站间距约束 —— 复用决策 3 期（`fix-mtr-rendering-bugs`）的字号自适应思路：名牌文字过宽时缩字号 / 压缩，避免与相邻站标签重叠。
- 当前数据下仅阎村东渲染一枚标签，其余站 `transfers` 为空、不渲染。

**替代方案。** 把换乘标签做成圆点上的小色块 badge —— 信息量不足、与港铁实拍的「线路名牌」不符。否决。

### 决策 2：站名特写黄条警示图标与版式

- 黄条两端警示图标以**纯 SVG 内联**绘制（红色圆环 + 简化图形），不引入图片资源。图标组件 / 内联 SVG 置于 `ArrivalScene` 黄条 `.arrival__safety-bar` 的左右两端。
- 是否渲染图标由黄条文案类别决定：文案为「請小心空隙」类（`STOPPED` / `ARRIVING`）时渲染两端图标，「請勿靠近車門」类（`DEPARTING`）时不渲染。判定复用既有 `getSafetyBarText` / `trainState` —— 新增一个集中的纯映射（如 `safetyBarHasIcon(trainState)`）或在 `train-state-visuals` 中扩展，不在组件散落硬编码。
- 黄条版式随文案微调（高度）通过 CSS 按是否带图标的类名切换，幅度小、不破坏既有窄屏不裁剪约束。

### 决策 3：开门方向提示 —— 本侧闪烁、对侧静态

**现状。** `.arrival__door-hint` 有绿底圆角胶囊（`right` / `both` → `--green` variant）与深色字（`left` → `--dark` variant）两态，均为静态。

**实拍核对。** 经裁剪密集帧核对（见 `docs/mtr-ui-reference.md` 差异 6）：本侧开门「請在這邊落車」在视频中**闪烁** —— 在「绿底圆角胶囊（黑字）」与「黑字无底」两态间交替，周期约 2s；对侧开门「請往另一邊落車」为静态黑字无底。当前实现本侧绿底为恒定、不闪。

**决策。**

- 本侧开门（`right` / `both`，绿底 variant）：保留绿底圆角胶囊样式，新增闪烁动画 —— `background`（绿色↔透明）与文字所在样式在两态间切换、`steps(1)` 硬切、周期约 2s。
- 对侧开门（`left`，深色字 variant）：保持静态黑字无底（现状已基本符合实拍对侧）。
- `getDoorHint` 保留 `variant` 字段 —— 用于区分本侧 / 对侧（决定是否闪烁与样式）；中英双语按既有方式排布。
- 闪烁动画仅施于本侧 variant，对侧不加动画。

**spec 影响。** 本侧开门提示闪烁是对 `mtr-train-states`「站名特写必须显示开门方向提示」需求的行为补充，本变更 MODIFIED 该需求。

**替代方案。** 把开门提示统一改为纯黑小字、移除绿底 —— 经核对实拍本侧确为绿底胶囊（闪烁两态之一），统一纯黑会丢失本侧的港铁式绿底视觉。否决。

### 决策 4：全程线路图换乘支线（取代独立全网换乘图场景）

**背景。** 期三初稿曾设计独立的第四类「全网换乘图」场景。经与港铁实拍复核：实拍中并无独立的「全网换乘图」画面 —— 全程线路图本身即承载换乘网络信息（临近换乘站时在换乘站处展示换乘线路）。把它拆成独立场景属过度设计。故取消独立场景，把换乘网络信息融入全程线路图。

**决策。**

- **不**新增 `NetworkMapScene` 场景、**不**新增 `network-map` 场景 id、**不**改场景配置（`RUNNING` 仍为 `theme.scenes[RUNNING]` 的 `[full-route, nearby]`）；`SceneRotator`、`updateScenes` 的场景列表逻辑不变。
- `FullRouteScene`（全程线路图）在「下一站为换乘站」时 —— 即 `RUNNING` 状态、`nextStation` 的 `transfers` 含至少一个可在 `line` store `availableLines` 解析到的换乘线路 —— 在该换乘站处渲染换乘线路**支线**：
  - 支线为该换乘线路自身色的一条短线路条 + 其站点圆点，以换乘节点（连接环）与当前线路上的换乘站连接。
  - 支线渲染为 `FullRouteScene` SVG 内的一个条件图层（如 `layer-transfer-branch`），不与既有线路 / 站点 / 文字层冲突。
  - 底部蓝色提示条切换为换乘提示文案（中英双语，「往<换乘线路>各站，请在此站换乘 / Change to … Line」），文案集中维护（`train-state-visuals` 或主题数据）、按 `nextStation.transfers` 解析的换乘线路生成。
- 下一站非换乘站、或换乘线路均无法解析时，`FullRouteScene` 照常渲染（无支线、蓝条为普通线路图提示语）。
- **数据通路**：换乘支线数据由 `src/core/local-network.ts` 的纯函数提供 —— 输入当前线路、目标换乘站、全部线路数据（`availableLines`），输出该换乘站可换乘的线路及其站点序列 / 颜色；纯函数、不依赖 Vue，`transfers` 指向的线路不在 `availableLines` 时降级跳过。`FullRouteScene` 经 `line` store 取 `availableLines`。
- `NearbyScene` 不渲染换乘支线（站点范围窄、支线意义有限）；近段图换乘信息仍由换乘标签（决策 1）体现。

**替代方案。**

- 保留独立的「全网换乘图」第四类场景 —— 与港铁实拍不符（实拍无独立画面），且额外占一帧轮播。否决。
- 在换乘站处仅画一个换乘环 / 不画支线 —— 信息量不足，未体现「换乘线路网络」。否决，按支线渲染。

### 决策 5：方向箭头位置与闪烁

**现状。** `useRouteLayout` 的 `directionArrow` 把箭头紧贴当前站圆点右侧、为静态黑色三角。与实拍不符（见 `docs/mtr-ui-reference.md` 差异 7）：实拍中箭头位于「最后一个已过站与下一站之间」的线段中部，且与下一站圆点同步闪烁（绿色实心↔白色实心）。

**决策。**

- **位置**：`directionArrow` 改为把箭头定位在「最后一个已过站与下一站之间」的线路段上（约线段中部）。`useRouteLayout` 已有 `isPassed`、`nextStation` 等判定，据此取「最后一个已过站」与「下一站」的 `stationX` 坐标、取其中点附近作箭头位置。
- **闪烁**：箭头由静态改为与下一站圆点同步闪烁。复用下一站圆点的闪烁动画参数（`station-dot-flash` 同周期 `2s`、`steps(1)`）—— 箭头 `fill` 在「绿色实心」与「白色实心」两态间交替、`stroke` 恒为 `var(--lcd-fg)`。为保证与下一站圆点**严格同相**，箭头与圆点共用同名 keyframes / 同一动画时间轴（绿色态对应圆点黄色态、白色态对应圆点白色态）。
- **颜色**：箭头绿色为新的港铁专用配色，新增一个 `ColorConfig` 字段（如 `directionArrow`）并经 `useTheme` 注入为 CSS 变量；白色复用 `--lcd-station-dot`、描边复用 `--lcd-fg`，不在组件硬编码。
- `FullRouteScene` 与 `NearbyScene` 共用 `useRouteLayout` 的 `directionArrow`，位置改动一处生效；闪烁动画在两组件的 `<style>` 中按既有方式定义、保持一致。

**替代方案。** 箭头使用独立于下一站圆点的闪烁周期 —— 与圆点不同步会显得割裂，实拍中两者严格同步。否决。

## 风险 / 权衡

- [换乘支线渲染与既有图层] → 换乘支线作为 `FullRouteScene` SVG 内的条件图层，仅「下一站为换乘站」时渲染；须不与既有线路 / 站点 / 文字 / 换乘标签层冲突，且不破坏全程图填满 LCD 屏、蓝条贴底的既有约束。当前数据为 2 条线、1 个交汇点，渲染按简化版式即可。
- [换乘支线 / 蓝条文案的条件切换] → 「下一站为换乘站」的判定、换乘支线与换乘蓝条文案均为 `FullRouteScene` 内的条件渲染，不改场景配置与 `SceneRotator`；需覆盖「下一站为换乘站 / 非换乘站」两种情形的回归验证。
- [换乘标签与密集线路站名重叠] → 标签宽度受站间距约束、复用字号自适应；房山线 16 站下当前仅阎村东有标签，重叠风险低，仍需 Playwright 验证。
- [开门提示保留 `variant`、本侧新增闪烁] → `variant` 用于区分本侧 / 对侧；本侧闪烁动画须不影响对侧静态渲染，且 `both` 的双侧开门文案不变 —— 需回归验证 `left` / `right` / `both` 三态。

## 迁移计划

纯前端渲染增量，无数据 / 接口变更，无需迁移；回滚即还原相关组件与新增文件。完成后用 Playwright 在燕房线、房山线验证换乘标签、黄条图标、开门提示、方向箭头、换乘支线五项，并在窄屏（320–1280）回归。
