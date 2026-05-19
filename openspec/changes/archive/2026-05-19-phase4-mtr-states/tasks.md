## 1. 主题数据层 — 配色、文案、场景配置

- [x] 1.1 扩展 `src/core/models/theme.ts` 的 `ColorConfig`：新增必填字段 `stationDotUpcoming`（未过站圆点黄色，基准 `#f2b600`）
- [x] 1.2 更新 `src/themes/default/index.ts` 的 `visual.colors` 补 `stationDotUpcoming`；同步更新 `src/core/theme-resolver.test.ts` 主题 fixture 补该字段，使 `type-check` 与现有用例通过
- [x] 1.3 更新 `src/composables/useTheme.ts` 的 `injectCSSVariables`：注入 `stationDotUpcoming` 为 `--lcd-station-dot-upcoming` CSS 变量
- [x] 1.4 调整 `src/themes/default/index.ts` 的 `scenes` 配置：`STOPPED`/`DEPARTING`/`ARRIVING` 为 `[arrival]`、`RUNNING` 为 `[full-route, nearby]` 且其两场景 `duration` 约 2.5s（使 `RUNNING` 5s 内两个线路图场景均可轮到，见 design 决策 1）
- [x] 1.5 集中定义状态相关文案映射：黄条文案按四个 `TrainState`（design 决策 3 文案表，含 `RUNNING` 兜底）、线路图蓝条提示文案集

## 2. 核心逻辑层 — 列车状态到视觉的纯映射

- [x] 2.1 在 `src/core/` 实现「列车状态 → 视觉」纯映射逻辑（纯函数/常量，可脱离 Vue 单测）：`TrainState → 黄条文案`、`TrainState + currentStation/nextStation → 站名特写展示站`（design 决策 2 表）、`doorSide → 开门方向提示`（design 决策 4 三态表，含空值 fallback）、`站点 + nextStation/isPassed → 圆点状态`（已过/未过/下一站）
- [x] 2.2 创建 `src/core/**/*.test.ts` 单元测试覆盖 2.1：四个 `TrainState` 的黄条文案与展示站、`doorSide` 的 `left`/`right`/`both`/空 四种情形、圆点各状态判定；显式从 `vitest` 导入测试 API

## 3. 站点圆点状态化

- [x] 3.1 `src/components/lcd/scenes/useRouteLayout.ts`：扩展共享布局逻辑，提供站点圆点状态判定（已过 / 未过 / 下一站），基于 `simulation.nextStation` 与 `isPassed`，复用任务 2.1 的纯映射
- [x] 3.2 `FullRouteScene.vue`、`NearbyScene.vue` 站点层：圆点按状态着色——已过 `--lcd-station-dot` 白实心、未过 `--lcd-station-dot-upcoming` 黄实心；下一站圆点**闪烁**——纯 CSS `@keyframes` 在「黄实心（fill 黄、stroke 深）」与「白空心（fill 屏底色/透明、stroke 白）」两态间硬切（`steps()`、周期约 2 秒），动画态圆点的 `fill`/`stroke` 由 CSS class 控制、不设同名 SVG presentation 属性以免覆盖

## 4. 站名特写状态化

- [x] 4.1 `src/components/lcd/scenes/ArrivalScene.vue`：展示站由直接用 `nextStation` 改为按任务 2.1 的「展示站」映射取（`ARRIVING→nextStation`、`STOPPED/DEPARTING→currentStation`）——站名、圆点、黄条、开门方向共用此展示站
- [x] 4.2 `ArrivalScene.vue`：黄色安全条文案改为按当前 `TrainState` 取自任务 1.5/2.1 的文案映射（取代固定占位）
- [x] 4.3 `ArrivalScene.vue` 新增**开门方向提示图层**：根据展示站 `doorSide` 显示港铁式开门方向提示（中英双语 + 绿/黑视觉区分，design 决策 4 三态表），数据缺失时不显示；映射约定写入注释

## 5. 线路图蓝条文案

- [x] 5.1 `FullRouteScene.vue`、`NearbyScene.vue` 提示条层：底部蓝条文案改为取自任务 1.5 的蓝条提示文案集（取代期一固定占位）

## 6. 验证

- [x] 6.1 运行 `openspec-cn validate phase4-mtr-states --strict`，确认变更规格校验通过
- [x] 6.2 运行 `pnpm lint && pnpm format:check && pnpm type-check && pnpm test && pnpm build`，确认整链通过、既有单测与新增映射逻辑单测全部通过
- [x] 6.3 对照参考帧 `/tmp/mtr-frames/`、`/tmp/mtr-flash/` 手动验收：`RUNNING` 线路图下一站圆点闪烁（黄↔白空心、约 1 秒每相位、白空心为真空心圆环）、其余未过站稳定黄、已过站白；`STOPPED`/`DEPARTING`/`ARRIVING` 显示站名特写且展示站正确（停站/关门为当前站）；黄条文案随状态切换；开门方向提示按 `doorSide` 正确显示；线路图蓝条显示有意义内容；视口 320/375/768/960/1280 下不溢出、场景不被裁剪
