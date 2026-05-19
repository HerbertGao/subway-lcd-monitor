## 上下文

期一（`phase4-mtr-visual`）已建立港铁视觉基底——配色、7∶2 比例、三场景图层式分层骨架，站点圆点统一白实心、提示条固定占位。本变更是港铁风重制期二，让列车运行状态驱动视觉。

技术约束：不修改列车状态机本身（`TrainState` 枚举、FSM 流转与自动时长），只**读取** `simulation` store 的状态、并调整主题侧 `scenes` 配置；不引入依赖；不改 LCD 比例与三场景布局骨架。沿用期一图层式分层——状态变化只驱动站点层与提示条层。

相关现状（已核对代码）：
- `TrainState` 枚举：`STOPPED`（停靠在站）、`DEPARTING`（关门出发）、`RUNNING`（运行中）、`ARRIVING`（即将到站）。
- `TrainFSM`：`next()` 在 `ARRIVING → STOPPED` 转换时才推进站点（`advanceStation`）；非环线到达终点时立即反转 `direction`。FSM 自动时长 `STOPPED 3s`/`DEPARTING 2s`/`RUNNING 5s`/`ARRIVING 3s`。
- `simulation` store：`trainState`、`currentStation`、`nextStation`（沿 `direction` 的下一站）、`currentStationIndex`、`direction`。
- `SceneRotator.setScenes()` 每次调用重置到列表第 0 个场景；状态变化时 `simulation` 用 `theme.scenes[trainState]` 调 `setScenes`。
- `default` 主题 `scenes`：`STOPPED`/`RUNNING` 为线路图、`DEPARTING` 为 `nearby`、`ARRIVING` 为 `arrival`，duration 均 5s。
- `ArrivalScene` 当前显示 `simulation.nextStation`。

## 目标 / 非目标

**目标：**站点圆点、站名特写展示站与黄条文案、开门方向提示、蓝条文案由列车运行状态驱动；消除与期一规格的冲突。

**非目标：**不改状态机（枚举/流转/自动时长）；不改 LCD 比例与布局骨架；不扩数据、不做换乘标签（期三）；不引入依赖。

## 决策

### 1. 场景配置随状态切换

`SceneRotator.setScenes()` 每次状态变化重置到列表首个场景，FSM 自动模式下 `STOPPED`(3s)/`DEPARTING`(2s) 短于场景 duration——故「把 arrival 加进列表」不保证它出现。本期明确调整 `default` 主题 `scenes` 配置为：

| TrainState | 场景列表 |
|---|---|
| `STOPPED` 停靠在站 | `[arrival]` |
| `DEPARTING` 关门出发 | `[arrival]` |
| `RUNNING` 运行中 | `[full-route, nearby]` |
| `ARRIVING` 即将到站 | `[arrival]` |

即停站/关门/到站显示站名特写（黄条文案随状态变化得以可见）、运行中显示线路图。`arrival` 在三个状态下均为列表唯一场景、必然渲染。`RUNNING` 的 `[full-route, nearby]` 两场景的 `duration` 须设为约 2.5 秒——FSM `RUNNING` 自动时长为 5s，2.5s×2 使两个线路图场景在一个 `RUNNING` 周期内都能轮到（否则 5s 的 `duration` 下只会显示首个 `full-route`）；`STOPPED`/`DEPARTING`/`ARRIVING` 为单场景列表、`duration` 不影响显示。此调整仅改主题数据，不改 `SceneRotator`/`TrainFSM` 逻辑。

### 2. 站名特写的「展示站」由状态决定

`TrainFSM` 在 `ARRIVING → STOPPED` 时才推进站点。因此 `nextStation` 在不同状态语义不同。站名特写的展示站（站名、圆点、黄条、开门方向**共用同一个**展示站）按下表：

| TrainState | 展示站 `displayedArrivalStation` |
|---|---|
| `ARRIVING` 即将到站 | `nextStation`（正在到达的站） |
| `STOPPED` 停靠在站 | `currentStation`（当前停靠站） |
| `DEPARTING` 关门出发 | `currentStation`（当前停靠站） |
| `RUNNING` 运行中 | （不显示站名特写，无需展示站） |

`ArrivalScene` 当前直接用 `nextStation`，本期改为按上表取展示站——抽为「列车状态 → 展示站」映射逻辑。

### 3. 黄条文案随 `TrainState` 变化

黄色安全条文案按 `TrainState`（基准，实现可对照参考帧微调）：

| TrainState | 黄条文案 |
|---|---|
| `STOPPED` | 請小心空隙　Please mind the gap |
| `DEPARTING` | 請勿靠近車門　Please stand back from the doors |
| `ARRIVING` | 請小心空隙　Please mind the gap |
| `RUNNING`（fallback，正常不显示站名特写） | 請小心空隙　Please mind the gap |

四个 `TrainState` 均有定义（含 `RUNNING` 兜底）。文案映射集中维护在主题数据或映射常量，不在组件硬编码。

### 4. 开门方向提示

`ArrivalScene` 右上角根据展示站 `doorSide` 显示开门方向提示。`doorSide` 三态映射（中英双语 + 视觉，「這邊/另一邊」相对车厢，本模拟器以 `doorSide` 直接映射为简化约定）：

| doorSide | 文案 | 视觉 |
|---|---|---|
| `right` | 請在這邊落車　Please exit this side | 绿底白字 |
| `left` | 請往另一邊落車　Please exit from the opposite side | 深色字（无绿底） |
| `both` | 兩邊車門都會開　Doors open on both sides | 绿底白字 |
| 空 / 缺失 | 不显示开门方向提示（fallback） | — |

当前北京数据站点 `doorSide` 多为 `right`，但映射须完整覆盖 `left`/`both`/空，并由测试 fixture 覆盖三态。开门方向提示作为 `ArrivalScene` 的独立图层。

### 5. 站点圆点状态化（线路图）

线路图（`RUNNING` 显示）站点圆点按状态着色：

| 站点 | 圆点 fill | 圆点 stroke |
|---|---|---|
| 已过站（`isPassed` 为真） | `--lcd-station-dot`（白） | `--lcd-fg`（深） |
| 未过站、非下一站 | `--lcd-station-dot-upcoming`（黄，新增） | `--lcd-fg` |
| 下一站（`nextStation`） | **闪烁**：黄实心 ↔ 白空心 | 见下 |

「下一站」= `simulation.nextStation` 对应的站点。线路图只在 `RUNNING` 显示，此时 `nextStation` 为列车正驶向的目标站、必有值（非单站线路）；FSM 到终点时已反转 `direction`，`nextStation` 取反向下一站，规则统一无需特判终点。

**闪烁实现**：纯 CSS `@keyframes`，在两态间硬切（`steps()` 或两关键帧跳变、非渐变），周期约 2 秒（黄≈1s、白≈1s）。「白空心」不能只改 `fill`——须同时控制 `fill` 与 `stroke`：
- 黄实心态：`fill = --lcd-station-dot-upcoming`、`stroke = --lcd-fg`；
- 白空心态：`fill = --lcd-bg`（屏底色，视觉为空心）或 `transparent`、`stroke = --lcd-station-dot`（白色描边圆环）。

动画作用于下一站圆点；为避免 SVG presentation 属性覆盖 CSS，下一站圆点的 `fill`/`stroke` 由 CSS class（动画）控制、不再设同名 presentation 属性。

`ColorConfig`（`src/core/models/theme.ts`）**新增** 1 个必填字段 `stationDotUpcoming`（未过站圆点黄、基准 `#f2b600`），`useTheme` 注入为 `--lcd-station-dot-upcoming`。新增必填字段须同步更新 `src/themes/default/index.ts` 与 `src/core/theme-resolver.test.ts` 主题 fixture，否则 `type-check` 失败。

### 6. 线路图蓝条文案

线路图底部蓝条文案由固定占位改为有意义的港铁式提示内容（一组通用提示语，可按场景选取）；文案集中维护在主题数据或映射常量。

### 7. 「列车状态 → 视觉」纯映射逻辑与测试

把可脱离 Vue 的纯逻辑抽为独立函数/常量（`src/core/` 下）：`TrainState → 黄条文案`、`TrainState + currentStation/nextStation → 展示站`、`doorSide → 开门方向提示`、`站点 + nextStation/isPassed → 圆点状态`。这些纯映射须补单元测试（覆盖四个 `TrainState`、`doorSide` 三态、圆点各状态）。圆点闪烁、文案切换等视觉行为靠对照参考帧手动验收。

### 8. 与期一规格的衔接

期一 `mtr-visual-style` 主规格的「站点圆点采用统一样式」需求要求圆点统一白实心、不按状态着色，与本期冲突。本变更包含对 `mtr-visual-style` 的 **MODIFIED delta**——把该需求改为「`mtr-visual-style` 只定义圆点基础形态，状态化着色规则由 `mtr-train-states` 定义」，消除两个活跃能力间的规格冲突。

注意：OpenSpec 的 specs delta 只增量修改**需求**，不涵盖主规格的「目的」段。`mtr-visual-style` 主规格的「目的」段当前仍含「统一的白色实心站点圆点」表述，与本期状态化圆点冲突。因此本变更**归档后须手动同步更新** `openspec/specs/mtr-visual-style/spec.md` 的「目的」段——把「统一的白色实心站点圆点」改为「站点圆点的基础形态」之类不含状态语义的措辞。这一步是归档收尾的一部分（与前几期归档后手动补「目的」段同性质）。

## 风险 / 权衡

- **`scenes` 配置调整后 `RUNNING` 才显示线路图** → 圆点状态化（含闪烁）仅在 `RUNNING` 可见；这符合港铁（运行中看线路图、停站看站名特写），可接受。
- **CSS 闪烁与场景 `Transition`** → 闪烁是站点层局部 animation，与场景切换 `Transition` 互不干扰。
- **`ColorConfig` 再新增必填字段** → 与期一同样处理，同步更新 `default` 主题与 `theme-resolver.test.ts` fixture。
- **开门方向「這邊/另一邊」语义** → 真实港铁相对车厢朝向，模拟器无此数据，以 `doorSide` 直接映射为简化约定，已在 design 与实现注释说明。
