## 为什么

阶段一已建立测试与 CI 安全网，但项目的**运行时健壮性**仍是空白——核心逻辑虽完整，遇到异常输入或异常时机却会直接崩溃或静默失败：

- `src/core/data-validator.ts` 的 `validateNetwork`/`validateLine` 已实现却**从未被任何代码调用**——线网数据中的重复站点 ID、重复线路 ID、无效换乘线路引用无人发现；且其 `ValidationError.type` 缺少 `duplicate-line-id`，当前把重复线路 ID 错误地标成 `duplicate-station-id`。
- `src/core/data-loader.ts` 的 `loadNetwork`/`loadLine` 在数据文件缺失时直接 `throw`，而 `src/stores/line.ts` 的 `selectCity`/`selectLine` 无任何兜底 → 用户选到数据文件缺失的城市或线路即导致整页崩溃。
- `src/main.ts` 未注册 `app.config.errorHandler`，渲染层任何未捕获异常都会白屏，无降级界面。
- `src/stores/simulation.ts` 提供了 `destroy()`，但 `src/App.vue` 没有 `onUnmounted` 钩子去调用它 → 列车状态机与场景轮播的定时器存在泄漏隐患。
- 全项目无日志设施，失败均为静默，难以定位问题。

本变更是「四阶段优化方案」的第二阶段，补齐运行时健壮性，为阶段三（体验适配）、阶段四（内容扩展）提供稳定基座。

## 变更内容

- **数据校验集成与修正**：扩展 `ValidationError.type` 增加 `duplicate-line-id` 并修正 `validateNetwork` 的误分类；在线网加载后调用 `validateNetwork`，对重复站点/线路 ID、无效换乘引用产出可呈现的校验结果。
- **数据加载错误处理**：为 `stores/line.ts` 的加载路径加兜底——加载失败（数据文件缺失）以**事务式更新**转化为可呈现的错误状态，不再让异常冒泡导致崩溃，且失败不污染既有有效数据。
- **应用级错误边界**：`main.ts` 注册 `app.config.errorHandler`；新增错误兜底 UI 组件（含可正常工作的「重试」），渲染层异常时显示友好降级界面而非白屏。
- **资源生命周期清理**：`App.vue` 增加 `onUnmounted`，在组件卸载时调用 `simulation.destroy()`，消除定时器泄漏隐患。
- **轻量日志设施**：新增分级（debug/info/warn/error）logger，替代静默失败与零散的裸 `console`；数据加载错误、校验告警、错误边界均经 logger 输出。
- **单元测试与测试配置**：为本阶段新增/修改的逻辑（logger、`ValidationError` 修正、data-loader 错误上下文、line store 兜底与校验集成）补单元测试；扩展 `vitest.config.ts` 的收集范围至 `src/stores/`，使 store 测试不被静默跳过。

## 功能 (Capabilities)

### 新增功能
- `runtime-robustness`: 运行时健壮性——数据校验集成、数据加载错误兜底、应用级错误边界、资源生命周期清理、分级日志设施。

### 修改功能
<!-- 无既有规范级行为变更（dev-tooling 能力不受影响：核心四模块仍全覆盖，仅新增 stores 测试收集范围） -->

## 非目标

- 不做响应式适配与可访问性改造（属阶段三）。
- 不扩充地铁线路 / 城市数据（属阶段四）。
- 不修改列车状态机、场景轮播、主题解析的业务逻辑。
- 不引入第三方错误监控或日志服务（如 Sentry）——仅实现轻量本地 logger。
- 不重构 `data-loader` 基于 `import.meta.glob({ eager: true })` 的数据加载机制——因此 JSON **语法损坏**（在模块求值阶段即失败）不在本阶段兜底范围，本阶段只承诺**文件缺失**的兜底。
- 不补渲染层组件测试与 E2E（仅覆盖核心逻辑层与 store 单测）。

## 影响

- **影响层**：
  - 核心逻辑层 `src/core/`：`data-validator.ts`（扩展 `ValidationError` 类型以区分重复线路 ID、修正误分类）、新增 `logger.ts`、`data-loader.ts`（核对错误消息上下文）。
  - 状态管理 `src/stores/`：`line.ts`（事务式加载兜底 + 校验集成）。
  - 渲染层与入口：`src/main.ts`（注册 `errorHandler`）、`src/App.vue`（`onUnmounted` 清理）、新增错误兜底 UI 组件。
- **新增文件**：`src/core/logger.ts`、`src/components/common/ErrorBoundary.vue`、对应的 `src/core/**/*.test.ts` 与 `src/stores/**/*.test.ts`。
- **修改文件**：`src/core/data-validator.ts`、`src/core/data-loader.ts`、`src/stores/line.ts`、`src/main.ts`、`src/App.vue`、`vitest.config.ts`。
- **依赖**：不新增运行时依赖。
