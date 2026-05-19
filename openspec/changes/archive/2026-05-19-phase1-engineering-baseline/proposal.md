## 为什么

项目当前为 Demo 形态：核心逻辑（状态机、轮播、数据加载、主题解析）已完整实现，但缺少工程化基建——零测试、无 ESLint/Prettier、无 CI。这意味着任何后续改动（健壮性、响应式适配、内容扩展）都没有回归保障，重构核心逻辑时无法验证正确性，多人协作也缺乏统一的代码风格。

本变更是「四阶段优化方案」的第一阶段，先夯实工程地基，为后续阶段提供安全网。

## 变更内容

- **代码规范工具**：引入 ESLint（`eslint-plugin-vue` + `typescript-eslint`）、Prettier、`.editorconfig`，统一代码风格与静态检查。
- **测试框架与首批单测**：引入 Vitest，为核心逻辑层 `src/core/` 中的四个核心模块补单元测试：
  - `train-fsm`：状态循环、环线/非环线、终点方向自动反转、自动/手动模式
  - `scene-rotator`：场景轮播、手动跳转、边界处理
  - `data-loader`：城市/线路加载、文件缺失抛错
  - `theme-resolver`：线路 > 城市 > 默认 三级合并优先级
- **脚本补全**：`package.json` 新增 `lint`、`format`、`format:check`、`test`、`type-check` 脚本。
- **持续集成**：新增 GitHub Actions 工作流，在 push / PR 时运行 lint + format:check + type-check + test + build。

## 功能 (Capabilities)

### 新增功能
- `dev-tooling`: 开发工程化能力——代码静态检查、格式化、单元测试、CI 流水线及其对应的项目脚本契约。

### 修改功能
<!-- 无规范级行为变更 -->

## 非目标

- 不修改任何业务逻辑（状态机、轮播、主题、组件行为保持不变）。
- 不做响应式适配、可访问性改造（属阶段三）。
- 不扩充地铁线路 / 城市数据（属阶段四）。
- 不补组件测试（Vue 组件测试）与 E2E 测试。
- 本阶段单测仅覆盖上述四个核心模块，不含 `src/core/data-validator.ts` 与 `src/core/models/`。
- 不配置 GitHub branch protection / ruleset——CI 仅产出 check 状态，是否据此阻止合并属仓库设置项。
- 不引入错误边界、日志系统（属阶段二）。

## 影响

- **影响层**：本变更不改动三层架构中的任何业务逻辑（数据层 / 核心逻辑层 / 渲染层的行为保持不变）；唯一例外是首次接入 Prettier 时对存量源码执行的一次性格式化——仅调整空白、换行、引号等排版，不改逻辑与行为。
- **新增文件**：`eslint.config.mjs`、`.prettierrc`、`.prettierignore`、`.editorconfig`、`vitest.config.ts`、`.github/workflows/ci.yml`、`src/core/**/*.test.ts`。
- **修改文件**：`package.json`（scripts、devDependencies、engines）；存量源码文件（仅首次 Prettier 格式化产生的排版调整）。
- **依赖**：新增 devDependencies——ESLint 及插件、Prettier、Vitest 相关包。
- **构建/CI**：新增 CI 流水线；本地开发新增 `pnpm lint` / `pnpm test` / `pnpm format` 工作流。
