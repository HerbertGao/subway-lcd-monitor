## 上下文

阶段一已为 subway-lcd-monitor 建立 ESLint/Prettier/Vitest/CI 安全网。本阶段（阶段二）补运行时健壮性。当前代码的薄弱点已在 proposal 列明：校验器未被调用且有类型缺陷、数据加载无兜底、无错误边界、定时器未清理、无日志。

技术约束：核心逻辑层 `src/core/` 运行时不依赖 Vue——新增的 `logger.ts` 必须是纯 TypeScript。错误边界与生命周期清理属渲染层，可用 Vue API。本阶段不改列车状态机/场景轮播/主题解析的业务逻辑。

相关现状：
- `validateNetwork(network, lines)` 返回 `ValidationError[]`（不抛异常）；`ValidationError.type` 当前仅 `'duplicate-station-id' | 'invalid-transfer-ref'`，`validateNetwork` 对重复线路 ID 误用了 `'duplicate-station-id'`。
- `loadNetwork`/`loadLine` 经 `import.meta.glob('/src/data/**/*.json', { eager: true })` 取模块，在 key 不存在（文件缺失）时 `throw`，错误消息含数据文件路径。
- `simulation` store 的 `destroy()` 已实现，仅缺调用方。
- `line` store 的 `selectCity` 第一行即写 `currentCity.value = city`，再加载——加载抛错会污染状态。

## 目标 / 非目标

**目标：**
- 修正 `ValidationError` 类型并把 `validateNetwork` 接入线网加载流程。
- 数据加载/校验失败以事务式更新转为可呈现的错误状态，不再崩溃、不污染既有数据。
- 提供应用级错误边界，渲染异常降级而非白屏。
- 根组件卸载时清理模拟资源（定时器）。
- 提供纯 TypeScript 的分级 logger。
- 为新增/修改的逻辑补单元测试并扩展测试收集范围。

**非目标：**
- 不改业务状态机逻辑；不补组件测试与 E2E。
- 不引入第三方监控/日志服务；不重构 `import.meta.glob` 加载机制。
- 不做响应式、可访问性、内容扩展（属阶段三/四）。

## 决策

### 1. 日志设施：`src/core/logger.ts`，纯 TypeScript

新增分级 logger，提供 `debug`/`info`/`warn`/`error` 四个方法，按当前 level 阈值过滤，底层输出到 `console`。level 默认依据 `import.meta.env.DEV`（开发为 `debug`、生产为 `warn`），并可显式覆盖。模块无 Vue 依赖，可被 core、stores、组件统一调用。

替代方案：直接用裸 `console`——无分级、无法统一关停；引入第三方日志库——超出本阶段轻量目标。均不选。

### 2. 数据加载错误处理：loader 抛错，store 事务式兜底

`data-loader` 的 `loadNetwork`/`loadLine` 继续在数据文件缺失时 `throw`（保持核心函数语义纯粹、便于单测）；其错误消息必须含足够定位上下文——`city`、（`loadLine` 还需）`lineId` 与数据文件路径。当前实现的错误消息已包含数据文件路径（path 内含 city 与 lineId），本阶段核对并在必要时补全，不重构加载机制。

兜底放在 `stores/line.ts`，且必须是**事务式更新**：`selectCity`/`selectLine` 先用**局部变量**完成全部加载与校验（`validateNetwork`），全部成功后才**一次性写入** store 状态（`currentCity`/`currentNetwork`/`availableLines`/`currentLine`/`loadError`/`validationErrors`）。当前 `selectCity` 第一行即 `currentCity.value = city` 的写法必须改掉——否则加载抛错会污染 `currentCity`。

`selectCity` 加载城市下各线路时，必须基于已加载的 `network.lines` **逐个**调用 `loadLine(city, lineId)`（而非黑盒的 `loadAllLines`），以便某条线路文件缺失时能准确知道失败的 `lineId`，把错误结构化为 `operation: 'loadLine'` 并带具体 `lineId`。

失败时：经 `logger` 记录、写入 `loadError` 状态、保持 store 既有有效数据不被破坏。`loadError` 状态类型固定为 `LoadError | null`，其中 `LoadError = { message: string; operation: 'loadNetwork' | 'loadLine'; city: string; lineId?: string }`——不采用「字符串或对象」二选一，以便测试稳定断言其 shape。每次**成功**加载完成后必须把 `loadError` 重置为 `null`，避免 UI 残留上一次的错误状态。

替代方案：让 `loadNetwork` 返回 `Result` 类型而非抛错——会改动 data-loader 既有契约与阶段一的单测，范围过大，不选。

### 3. 校验集成与 `ValidationError` 类型修正

先修正 `data-validator.ts`：扩展 `ValidationError.type` 增加 `'duplicate-line-id'`，并把 `validateNetwork` 中重复线路 ID 的错误类型由 `'duplicate-station-id'` 改为 `'duplicate-line-id'`，使消费方能可靠区分两类重复 ID。这是对核心逻辑层的小幅修正，须同步补 `data-validator` 单测覆盖。

集成点：在 `line.ts` 的 `selectCity` 成功加载 `network` 与 `lines` 后（事务提交前），调用 `validateNetwork(network, lines)`。校验错误视为**非致命**——经 `logger.warn` 输出，并写入 store 的 `validationErrors` 状态（`ValidationError[]`）供 UI 可选展示，但**不阻断**线路加载（保持 Demo 在数据有瑕疵时仍可运行）。这与「文件缺失」这类**致命**加载失败（决策 2，转 `loadError`）区分对待。

### 4. 错误边界：`ErrorBoundary` 组件 + 全局 `errorHandler` 双层

- **组件级**：新增 `src/components/common/ErrorBoundary.vue`，用 `onErrorCaptured` 捕获子树渲染/生命周期异常，捕获后渲染降级 UI 并返回 `false` 阻止异常继续向上传播导致白屏。`App.vue` 用它包裹主内容（LCD 屏 + 控制面板）。
- **重试语义**：boundary 内部维护 `error` ref 与 `retryKey` ref（number）。降级 UI 的「重试」按钮必须同时——清空 `error`、递增 `retryKey`；slot 子树以 `:key="retryKey"` 绑定，递增 key 强制子树**重新挂载**。若只清 `error` 不改 key，子树不会重建，重试后会立即再次抛出同一异常、按钮形同虚设。
- **日志记录**：`onErrorCaptured` 返回 `false` 会阻止异常继续传播，全局 `errorHandler` 因此**收不到**被边界捕获的异常；故 `ErrorBoundary` 的 `onErrorCaptured` 内必须**显式**调用 `logger.error` 记录被捕获的异常——否则错误边界主路径将只显示降级 UI 而不留日志。
- **全局兜底**：`main.ts` 注册 `app.config.errorHandler`，仅对**未被**组件边界捕获的异常（异步、事件处理器等）经 `logger.error` 记录。

Vue 的 `errorHandler` 本身只是回调、不阻止白屏，故必须有组件级 `onErrorCaptured`；两层配合：组件边界负责「降级 UI + 重试 + 记录」，全局 handler 负责「兜底记录」。

### 5. 资源生命周期清理

`App.vue` 增加 `onUnmounted` 钩子，调用 `useSimulationStore().destroy()`。`destroy()` 已存在（清理 `TrainFSM` 与 `SceneRotator` 的定时器并置空实例），本阶段仅补缺失的调用方。不改状态机内部逻辑，故无状态/转移变更。

### 6. 测试范围与 Vitest 收集范围扩展

为纯逻辑部分补 Vitest 单元测试：`logger`（分级过滤、level 阈值）、`data-validator`（重复线路 ID 被正确分类为 `duplicate-line-id`）、`data-loader`（缺失城市/线路的错误消息含定位上下文）、`line` store（加载失败兜底、状态不被污染、校验集成）。

`line` store 测试在 `node` 环境下用 `setActivePinia(createPinia())` 运行——store 的 `ref`/`computed` 是纯 JS 响应式、不依赖 DOM，可在 node 环境测；对加载失败路径用 `vi.mock` 替换 `data-loader`。

由于阶段一的 `vitest.config.ts` 只收集 `src/core/**/*.test.ts`，新增的 `src/stores/line.test.ts` 会被静默跳过、`pnpm test` 假性通过。因此本变更**必须扩展** `vitest.config.ts` 的 `include` 至 `['src/core/**/*.test.ts', 'src/stores/**/*.test.ts']`。这是对阶段一「测试仅收集 core」实现细节的有意扩展；阶段一 `dev-tooling` 能力「核心逻辑层四模块必须有单元测试覆盖」不受影响——core 四模块仍全覆盖，本扩展只是新增 stores 收集范围。

错误边界组件、`errorHandler` 属渲染层，沿用阶段一边界不补组件测试，由手动验证与 CI 构建覆盖。

## 风险 / 权衡

- **JSON 语法损坏不在兜底范围** → `import.meta.glob({ eager: true })` 会在模块求值阶段就对损坏的 JSON 失败，根本不进入 `loadNetwork`/`loadLine`，store 的 `try/catch` 捕获不到。本阶段据此把承诺收窄为「文件缺失」的兜底；覆盖「损坏」需改为 lazy glob / dynamic import 并在 loader 内捕获 parse 错误，属重构 `import.meta.glob`，列为非目标。
- **校验错误「非致命」可能放过会导致渲染异常的数据问题**（如重复站点 ID）→ 缓解：校验结果经 `logger.warn` 显式输出并存入可查询状态；真正在渲染层引发的异常由决策 4 的错误边界兜底。本阶段优先保证「不崩溃 + 可见」，严格的数据准入留待后续。
- **`onErrorCaptured` 无法捕获异步错误与事件处理器内的错误** → 缓解：全局 `errorHandler` 作为第二层兜底；本阶段不追求 100% 捕获，目标是消除最常见的同步渲染白屏。
- **logger 的 level 依据 `import.meta.env.DEV`** → 该变量由 Vite 注入，Vitest 复用 Vite 转换、同样可用，单测不受影响。
