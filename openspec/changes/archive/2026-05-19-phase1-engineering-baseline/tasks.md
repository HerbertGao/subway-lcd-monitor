## 1. 代码规范工具链

- [x] 1.1 安装 ESLint 9+ 及插件（`eslint`、`@eslint/js`、`typescript-eslint`、`eslint-plugin-vue`、`eslint-config-prettier`）为 devDependencies
- [x] 1.2 创建 `eslint.config.mjs` flat config：组合 `typescript-eslint` 推荐配置 + `eslint-plugin-vue` 的 `flat/recommended` + `eslint-config-prettier`；对存量违规（如 `theme-resolver.ts` 的 `any`）通过定向关闭规则或 `eslint-disable` 注释豁免，不用 `warn` 级别、不重构业务代码
- [x] 1.3 安装 Prettier 并创建 `.prettierrc`（缩进、引号、行宽与现有代码风格一致）与 `.prettierignore`
- [x] 1.4 创建 `.editorconfig`（缩进、换行、字符集）
- [x] 1.5 运行 `pnpm lint` 与 `pnpm format:check`，确认配置生效、无意外报错
- [x] 1.6 对存量源码执行首次 Prettier 格式化（`pnpm exec prettier --write .`），使 `format:check` 可干净通过；仅调整空白/换行/引号等排版，不改业务逻辑

## 2. 测试框架与配置

- [x] 2.1 安装 Vitest（与 Vite 7 兼容的 3.x 版本）为 devDependency
- [x] 2.2 创建 `vitest.config.ts`：`node` 测试环境，复用 `@/*` 路径别名，按 `src/core/**/*.test.ts` 发现测试

## 3. 核心逻辑层单元测试（node 环境，显式导入 vitest API）

- [x] 3.1 `src/core/train-fsm.test.ts`：覆盖状态循环 STOPPED→DEPARTING→RUNNING→ARRIVING、环线与非环线、非环线终点方向自动反转、自动与手动模式；显式 `import { describe, it, expect, vi } from 'vitest'`
- [x] 3.2 `src/core/scene-rotator.test.ts`：覆盖场景列表设置、自动轮播、手动跳转、越界索引边界；显式从 `vitest` 导入测试 API
- [x] 3.3 `src/core/data-loader.test.ts`：覆盖城市/线路正常加载、文件缺失抛错；显式从 `vitest` 导入测试 API
- [x] 3.4 `src/core/theme-resolver.test.ts`：覆盖线路 > 城市 > 默认 三级合并优先级与深层字段覆盖；显式从 `vitest` 导入测试 API
- [x] 3.5 运行 `pnpm test`，确认全部用例通过

## 4. 项目脚本与 engines

- [x] 4.1 `package.json` scripts 新增 `lint`（`eslint . --max-warnings 0`）、`format`（`prettier --write .`）、`format:check`（`prettier --check .`）、`test`
- [x] 4.2 `package.json` scripts 新增独立的 `type-check`（`vue-tsc -b`，不产出构建物）
- [x] 4.3 `package.json` 新增 `engines.node` 字段，约束为 `^20.19.0 || ^22.13.0 || >=24`（同时满足 Vite 7 与 ESLint 9）
- [x] 4.4 运行 `pnpm type-check`，确认含 `src/core/**/*.test.ts` 在内的类型检查通过

## 5. 持续集成

- [x] 5.1 创建 `.github/workflows/ci.yml`：在 push 与 pull request 触发，使用 pnpm + Node `22.13.0`、启用依赖缓存
- [x] 5.2 CI 顺序执行 install → lint → format:check → type-check → test → build，任一步失败即终止并标记 CI 失败
- [x] 5.3 本地完整跑通 `pnpm lint && pnpm format:check && pnpm type-check && pnpm test && pnpm build`，确认与 CI 行为一致
