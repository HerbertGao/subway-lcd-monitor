## 上下文

subway-lcd-monitor 当前为 Demo 形态：核心逻辑层 `src/core/`（状态机、轮播、数据加载、主题解析）已完整实现，渲染层组件齐全，但工程基建为零——无 ESLint/Prettier、无测试框架、无 CI。后续阶段二/三/四将改动业务代码，缺少回归安全网风险高。

技术约束：项目使用 pnpm + Vite 7 + Vue 3 + TypeScript strict。核心逻辑层在运行时不依赖 Vue——唯一例外是 `src/core/models/theme.ts` 有一处 type-only 的 `import type { Component } from 'vue'`，该 import 在编译后被擦除，不产生运行时依赖，因此核心逻辑仍可在 Vitest 的 `node` 环境下纯单测。本阶段不触碰任何业务代码。

## 目标 / 非目标

**目标：**
- 建立代码规范工具链（ESLint + Prettier + .editorconfig）。
- 引入 Vitest，为核心逻辑层四个模块（train-fsm、scene-rotator、data-loader、theme-resolver）补单元测试。
- 补全 `package.json` 标准脚本，并声明 `engines.node`。
- 建立 GitHub Actions CI 流水线。

**非目标：**
- 不改业务逻辑；不补组件测试与 E2E。
- 首批单测不覆盖 `src/core/data-validator.ts` 与 `src/core/models/`。
- 不解耦 `theme.ts` 对 Vue `Component` 类型的 type-only 引用（属架构调整，留待后续阶段）。
- 不做响应式、可访问性、错误处理、内容扩展（属阶段二/三/四）。
- 不配置 GitHub branch protection / ruleset——CI 仅产出 check 状态，是否据此阻止合并属仓库设置项。

## 决策

### 1. ESLint flat config，使用 `eslint.config.mjs`

ESLint 自 9 起默认使用 flat config（本次实际安装 ESLint 10，flat config 行为一致；其 `engines.node` 要求与 ESLint 9 相同，不影响决策 5）。配置文件采用 `.mjs` 而非 `.ts`：ESLint 在 Node.js 下加载 TypeScript 配置文件（`.ts/.mts/.cts`）需额外安装并依赖 `jiti`，`.mjs` 则原生支持、零额外依赖。配置组合 `@eslint/js` 的 `recommended`（ESLint 10 不再传递依赖该包，需显式声明为 devDependency）、`typescript-eslint` 推荐配置与 `eslint-plugin-vue` 的 `flat/recommended`。Prettier 不通过 `eslint-plugin-prettier` 集成——改用 `eslint-config-prettier` 仅关闭与格式冲突的规则，格式化交给独立脚本，职责分离、CI 更快。

替代方案：`eslint.config.ts` —— 需引入 `jiti`，收益仅为配置文件内的类型提示，不值当，不选。legacy `.eslintrc` —— 已被 ESLint 9 弃用，不选。

### 2. 测试框架选 Vitest

Vitest 与 Vite 共享配置与转换管线，对 `@/*` 路径别名零额外配置，与项目技术栈最契合。被测的四个核心模块在运行时不依赖 Vue，测试用默认 `node` 环境即可，无需 `jsdom`。

替代方案：Jest —— 需额外配置 ts 转换与路径别名，与 Vite 生态割裂，不选。

### 3. 测试文件就近放置，显式导入 Vitest API

测试文件放在被测模块同目录（`src/core/**/*.test.ts`），便于维护；Vitest 默认按 `*.test.ts` glob 发现，`vitest.config.ts` 复用 `vite.config.ts` 的别名配置。

当前 `tsconfig.json` 的 `include` 为 `src/**/*.ts`，会一并覆盖 `*.test.ts`，故 `type-check`（`vue-tsc`）会对测试文件做类型检查。为避免新增 `tsconfig.vitest.json` 的复杂度，测试文件一律**显式**从 `vitest` 导入测试 API（`describe`/`it`/`expect`/`vi`），**不使用** Vitest globals——这样无需配置 `types: ["vitest/globals"]`，`type-check` 即可通过。

替代方案：启用 Vitest globals + 独立 `tsconfig.vitest.json` —— 多一个配置文件与一层 project references，本阶段不值当，不选。

### 4. `type-check` 独立成脚本

当前 `build` 脚本为 `vue-tsc -b && vite build`，类型检查与构建耦合。新增独立 `type-check`（`vue-tsc -b`），供 CI 与本地单独调用，定位类型问题更快。

### 5. CI 分步执行，显式锁定 Node 版本

GitHub Actions 单 job 内顺序执行 install → lint → format:check → type-check → test → build，使用 pnpm 缓存。任一步失败即终止。单 job 足够——本阶段无矩阵构建需求。

Vite 7 与 `@vitejs/plugin-vue@6.0.4` 要求 Node `^20.19.0 || >=22.12.0`，ESLint 9 要求 Node `^20.19.0 || ^22.13.0 || >=24`。CI 必须 pin 到同时满足两者的具体版本（采用 `22.13.0`），不可含糊写「Node 20」——20.18 等版本会安装/构建失败。同时在 `package.json` 增加 `engines.node` 字段声明该约束（`^20.19.0 || ^22.13.0 || >=24`），让本地环境也能及早发现版本不符。

### 6. 格式化提供 `format` 与 `format:check` 两个脚本

`format` 执行 `prettier --write .` 实际格式化源码；`format:check` 执行 `prettier --check .` 仅校验、不改文件，发现不一致时以非零退出码结束。CI 使用 `format:check` 把「风格统一」纳入自动校验；本地开发用 `format` 一键格式化。两者语义分离，避免单个 `format` 脚本同时承担「写」与「检查」导致的歧义。

存量源码从未经 Prettier 格式化，故本变更须对全部存量源码执行一次性的首次格式化（`prettier --write .`），否则 `format:check` 与 CI 会因存量文件未格式化而失败。该首次格式化只调整空白、换行、引号等排版，不改变任何业务逻辑与运行时行为。

### 7. CI 与 branch protection 的边界

本阶段交付的 `ci.yml` 只能让 GitHub 产出 check 状态（成功/失败）并展示在 commit 与 PR 上。「失败时阻止合并」需要在仓库的 branch protection / ruleset 中把该 check 设为必需项——这是仓库设置而非仓库内文件，无法由本变更交付，也无法在仓库内文件层面测试，故列为非目标。规格中的 CI 需求据此表述为「标记失败并暴露在 PR 上」，不表述为「阻止合并」。

## 风险 / 权衡

- **新增 ESLint 配置可能暴露存量代码的既有违规**（如 `theme-resolver.ts` 已有的 `eslint-disable` 注释、`any` 用法）→ 缓解：对存量问题通过在 `eslint.config.mjs` 中定向关闭对应规则，或保留/补充显式 `eslint-disable` 注释来豁免，使 `pnpm lint` 在不重构业务代码的前提下零违规。不以 `warn` 级别作为豁免手段——`lint` 脚本以 `eslint . --max-warnings 0` 运行，warning 同样使其非零退出，与规格「存在违规时退出码必须非零」一致。
- **Vitest 与 Vite 7 / Node 版本兼容性** → 缓解：选用与 Vite 7 兼容的 Vitest 版本（Vitest 3.x）；CI 锁定 Node `22.13.0`、`engines.node` 锁定 `^20.19.0 || ^22.13.0 || >=24`，与决策 5 一致。
- **测试固化的是当前行为，若现有逻辑本身有 bug 会被一并固化** → 权衡：本阶段目标是建立安全网而非纠错；逻辑修正留待后续阶段，届时测试需同步更新。
- **CI 失败不自动阻止 PR 合并** → 见决策 7；本阶段仅提供 workflow 与 check 状态，文档明确这一边界，避免验收时误判。
