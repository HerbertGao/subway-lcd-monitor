## 1. 核心逻辑层 — 日志设施

- [x] 1.1 创建 `src/core/logger.ts`：分级 logger（`debug`/`info`/`warn`/`error`），按 level 阈值过滤输出，默认级别依据 `import.meta.env.DEV`（开发 `debug` / 生产 `warn`）并可显式覆盖；纯 TypeScript，不依赖 Vue
- [x] 1.2 创建 `src/core/logger.test.ts`：覆盖级别阈值过滤、各级别输出与抑制行为；显式从 `vitest` 导入测试 API

## 2. 核心逻辑层 — 数据校验器与加载器

- [x] 2.1 修正 `src/core/data-validator.ts`：扩展 `ValidationError.type` 增加 `'duplicate-line-id'`，并把 `validateNetwork` 中重复线路 ID 的错误类型由 `'duplicate-station-id'` 改为 `'duplicate-line-id'`
- [x] 2.2 创建 `src/core/data-validator.test.ts`：覆盖重复站点 ID、重复线路 ID（断言类型为 `duplicate-line-id`）、无效换乘引用三类问题；显式从 `vitest` 导入测试 API
- [x] 2.3 核对 `src/core/data-loader.ts`：确认 `loadNetwork`/`loadLine` 在数据文件缺失时抛出的 `Error` 消息含定位上下文（`city`、`loadLine` 含 `lineId`、数据文件路径）；不足则补全，不重构 `import.meta.glob` 机制
- [x] 2.4 在 `src/core/data-loader.test.ts` 补充用例：断言缺失城市/线路时抛出的错误消息包含 `city`、`lineId`（线路场景）与数据文件路径

## 3. 测试配置扩展

- [x] 3.1 扩展 `vitest.config.ts` 的 `include` 至 `['src/core/**/*.test.ts', 'src/stores/**/*.test.ts']`，使 store 单测被收集

## 4. 状态管理层 — 加载兜底与校验集成

- [x] 4.1 `src/stores/line.ts`：改为事务式更新——`selectCity`/`selectLine` 先用局部变量完成全部加载，全部成功后再一次性写入 store 状态；`selectCity` 须基于 `network.lines` 逐个 `loadLine(city, lineId)`（不用黑盒 `loadAllLines`），以便线路文件缺失时把错误结构化为 `operation: 'loadLine'` 且带具体 `lineId`；新增 `loadError` 状态（类型 `LoadError | null`，`LoadError = { message; operation; city; lineId? }`）；加载失败时 `try/catch` 兜底、经 logger 记录、不向上抛出、不污染既有有效数据；每次成功加载后把 `loadError` 重置为 `null`
- [x] 4.2 `src/stores/line.ts`：`selectCity` 在事务提交前调用 `validateNetwork`，校验问题经 `logger.warn` 输出并写入新增的 `validationErrors` 状态（`ValidationError[]`），不阻断线路加载
- [x] 4.3 创建 `src/stores/line.test.ts`：以 `node` 环境 + `setActivePinia(createPinia())` 测试加载失败兜底、用 `vi.mock` 替换 `data-loader`；用例须覆盖——城市线网文件缺失、城市引用的某线路文件缺失（断言 `loadError.operation === 'loadLine'` 且含 `lineId`）、失败不污染既有状态、失败后再成功加载会清空 `loadError`、校验集成路径；显式从 `vitest` 导入测试 API

## 5. 渲染层 — 错误边界

- [x] 5.1 创建 `src/components/common/ErrorBoundary.vue`：用 `onErrorCaptured` 捕获子树渲染/生命周期异常并返回 `false` 阻止传播，渲染降级 UI；`onErrorCaptured` 内须显式调用 `logger.error` 记录被捕获的异常（因返回 `false` 后全局 errorHandler 收不到）；内部维护 `error` 与 `retryKey`，「重试」按钮清空 `error` 并递增 `retryKey`，slot 子树以 `:key="retryKey"` 绑定以强制重新挂载
- [x] 5.2 `src/App.vue`：用 `ErrorBoundary` 包裹 LCD 屏与控制面板主内容
- [x] 5.3 `src/main.ts`：注册 `app.config.errorHandler`，对未被组件边界捕获的异常经 `logger.error` 记录

## 6. 渲染层 — 资源生命周期清理

- [x] 6.1 `src/App.vue`：增加 `onUnmounted` 钩子，调用 `useSimulationStore().destroy()` 清理状态机与轮播定时器

## 7. 验证

- [x] 7.1 运行 `pnpm test`，确认含新增 core 与 store 测试在内的全部用例通过
- [x] 7.2 运行 `pnpm lint && pnpm format:check && pnpm type-check && pnpm build`，确认整链通过
- [x] 7.3 手动验证：选择缺失的城市/线路不致崩溃且有错误状态、既有数据不被污染；故意触发渲染异常时错误边界显示降级 UI 且「重试」可使子树重新挂载；根组件卸载时模拟资源被清理
