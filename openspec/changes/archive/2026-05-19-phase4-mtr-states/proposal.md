## 为什么

期一（`phase4-mtr-visual`）已建立港铁视觉基底——配色、7∶2 比例、三场景图层式分层骨架，站点圆点统一白实心、提示条固定占位、站名特写无开门方向提示。但真实港铁报站屏的精髓在于**状态细腻**——下一站圆点会闪烁、黄色安全条文案随停站/关门切换、有开门方向提示。

本变更是「港铁风重制」三期路线图的**期二**，让列车运行状态驱动 LCD 视觉。依据期一已查证并固化的闪烁规律，以及参考帧 `/tmp/mtr-frames/`、`/tmp/mtr-flash/`。

## 变更内容

- **场景配置随状态切换**：调整 `default` 主题 `scenes` 配置——`STOPPED`/`DEPARTING`/`ARRIVING` 显示站名特写、`RUNNING` 显示线路图，使站名特写的状态文案变化可见（详见 design 决策 1）。
- **站名特写显示正确的站**：站名特写显示的站点由运行状态决定——`ARRIVING` 显示正在到达的站（`nextStation`）、`STOPPED`/`DEPARTING` 显示当前停靠站（`currentStation`）；站名、圆点、黄条、开门方向共用此「展示站」。
- **黄条文案随状态变化**：站名特写黄色安全条文案由固定占位改为随 `TrainState` 切换——停靠在站「請小心空隙」、关门出发「請勿靠近車門」等。
- **开门方向提示**：站名特写根据展示站的 `doorSide` 显示港铁式开门方向提示（中英双语 + 绿/黑视觉区分）。
- **站点圆点状态化**：线路图（`RUNNING` 显示）的站点圆点按状态着色——已过站白色实心、未过站黄色实心、列车正驶向的下一站**闪烁**（黄实心 ↔ 白空心交替、每相位约 1 秒）。
- **线路图蓝条文案**：底部蓝色提示条由固定占位改为有意义的港铁式提示内容。

实现充分利用期一的图层式分层——状态变化只驱动站点层、提示条层，不动布局层与线路层。

## 功能 (Capabilities)

### 新增功能
- `mtr-train-states`: 港铁运行状态的动态呈现——状态化站点圆点（含下一站闪烁）、状态驱动的站名特写展示站与黄条文案、开门方向提示、蓝条提示内容、状态驱动的场景配置。

### 修改功能
- `mtr-visual-style`: 期一「站点圆点采用统一样式」需求被修改——`mtr-visual-style` 只定义圆点的基础形态，圆点的状态化着色规则改由 `mtr-train-states` 定义，消除两能力间的规格冲突。

## 非目标

- 不修改列车状态机（`TrainState` 枚举与状态流转、FSM 自动时长）本身——本期只读取列车状态映射到视觉、并调整主题侧的 `scenes` 配置。
- 不修改 LCD 比例、三场景布局骨架与图层分层结构（期一已定）。
- 不扩充地铁线路 / 城市数据、不做换乘线路标签展示（属期三）。
- 不引入第三方依赖。

## 影响

- **影响层**：渲染层 `src/components/lcd/scenes/`；`src/themes/default/index.ts`（`scenes` 配置、文案/配色映射）；`src/core/models/theme.ts`（`ColorConfig` 新增 1 字段）、`src/composables/useTheme.ts`；新增 `src/core/` 下「列车状态 → 视觉」纯映射逻辑及其单测。不修改状态机与数据加载逻辑。
- **规格变更**：新增 `mtr-train-states` 能力；修改 `mtr-visual-style` 能力的「站点圆点采用统一样式」需求（MODIFIED delta）。归档收尾时还须手动同步更新 `mtr-visual-style` 主规格的「目的」段（OpenSpec delta 不涵盖「目的」段），去除其中「统一的白色实心站点圆点」与状态化冲突的表述。
- **修改文件**：`src/core/models/theme.ts`、`src/core/theme-resolver.test.ts`、`src/themes/default/index.ts`、`src/composables/useTheme.ts`、`src/components/lcd/scenes/FullRouteScene.vue`、`NearbyScene.vue`、`ArrivalScene.vue`、`useRouteLayout.ts`；新增核心映射逻辑文件与其测试。
- **依赖**：不新增任何依赖。
