## 为什么

`default` 主题是项目早期自拟的深蓝 Demo 风格（深蓝屏底 `#001428`、橙色当前站、圆点站标、3∶1 比例），与真实地铁报站屏相去甚远。用户提供了港铁西铁线（屯门→红磡）LCD 报站屏视频作为参考，要求把 LCD 视觉重做为港铁风、并把运行状态做得更细腻。

本变更是「港铁风重制」三期路线图的**期一**，建立港铁视觉基底——配色、比例、场景版式骨架。期二做细腻状态、期三做西铁线数据与换乘标签。

视频参考帧已切出存于 `/tmp/mtr-frames/frame-01.png` 至 `frame-18.png`。

## 变更内容

- **主题配色港铁化**：把 `default` 主题（`src/themes/default/`）从深蓝 Demo 风格重做为港铁风——浅灰屏底、未过区段线路条用线路自身色、已过区段线路条灰色（站名同步转灰）、站名特写画面的黄色安全条、底部蓝色提示条，以及统一的白色实心站点圆点（已过/未过由线路条颜色区分；状态化圆点配色属期二）。
- **LCD 比例改超宽条**：`LcdScreen` 从 3∶1 改为港铁式超宽横条（约 7∶2，即 3.5∶1），`LcdScreen`/`LcdFrame` 布局相应调整，沿用阶段三的响应式（`min(…,100%)`、`clamp()`）与 `min-height` 让步机制。
- **三场景组件港铁版式重绘**：`FullRouteScene`（全程横排站点图——圆点 + 中文名在上、英文名在下、品红/灰线路条、当前站处行进方向箭头）、`NearbyScene`（近段放大图）、`ArrivalScene`（站名特写——超大中文站名 + 白色实心圆点 + 英文名 + 黄色安全条）按港铁版式重绘骨架。

## 功能 (Capabilities)

### 新增功能
- `mtr-visual-style`: 港铁风视觉风格——LCD 屏的港铁化配色、超宽条比例、三类场景的港铁版式与统一的白色实心站点圆点。

### 修改功能
<!-- 无既有规范级行为变更（dev-tooling、runtime-robustness、experience-adaptation 能力不受影响） -->

## 非目标

- 不做状态→提示语的细化映射——黄条文案随运行状态变化（「請小心空隙」/「請勿靠近車門」）、右上角开门方向提示、底部蓝条轮播提示语，均属**期二**。
- 不扩充西铁线线网数据、不做换乘站的换乘线路标签展示，均属**期三**。
- 不修改列车状态机、场景轮播、数据加载等业务逻辑。
- 不引入第三方 UI 组件库或 CSS 框架。
- 不保留旧深蓝 Demo 风格——`default` 主题直接重做，不维护双风格。
- 不做响应式/可访问性的新增工作（沿用阶段三成果，保持不回归即可）。

## 影响

- **影响层**：渲染层与主题——`src/themes/default/`、`src/components/lcd/`、`src/composables/useTheme.ts`；外加 `src/core/models/theme.ts` 的 `ColorConfig` **类型定义扩展**（新增港铁配色字段）——这是主题数据结构的类型扩展，不改任何 core 运行逻辑；不触及 `src/stores/`。
- **修改文件**：`src/core/models/theme.ts`（`ColorConfig` 类型扩展）、`src/core/theme-resolver.test.ts`（更新主题 fixture 补新增字段）、`src/themes/default/index.ts`、`src/themes/default/styles.css`、`src/composables/useTheme.ts`（注入新增配色为 CSS 变量）、`src/components/lcd/LcdScreen.vue`、`LcdFrame.vue`、`scenes/FullRouteScene.vue`、`NearbyScene.vue`、`ArrivalScene.vue`、`.gitignore`（忽略港铁参考视频）。
- **依赖**：不新增任何依赖。
- **素材**：根目录的港铁参考视频（`.mkv`，约 22MB）是设计素材，须加入 `.gitignore`、不提交。
