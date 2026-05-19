# dev-tooling 规范

## 目的
dev-tooling 能力定义 subway-lcd-monitor 的开发工程化要求，涵盖代码静态检查（ESLint）、统一格式化（Prettier）、核心逻辑层单元测试（Vitest）、标准开发脚本与 Node 版本约束，以及在 push / pull request 上自动校验的持续集成流水线。
## 需求
### 需求:项目必须提供统一的代码静态检查

项目必须配置 ESLint flat config（ESLint 9 及以上），覆盖 `.ts` 与 `.vue` 文件，使用 `typescript-eslint` 与 `eslint-plugin-vue` 规则集。`pnpm lint` 必须能对全部源码执行检查，存在违规时退出码必须非零；该脚本必须以 `--max-warnings 0` 运行，使 warning 与 error 同等阻断。

#### 场景:对干净代码执行 lint
- **当** 源码无 lint 违规时运行 `pnpm lint`
- **那么** 命令以退出码 0 结束，不报告任何错误

#### 场景:对存在违规的代码执行 lint
- **当** 源码中存在 ESLint 规则违规时运行 `pnpm lint`
- **那么** 命令以非零退出码结束，并打印违规文件与规则

### 需求:项目必须提供统一的代码格式化与格式校验

项目必须配置 Prettier 与 `.editorconfig`，统一缩进、引号、行宽等风格。必须提供两个脚本：`format` 实际格式化全部源码文件；`format:check` 仅校验格式、禁止修改文件，发现不一致时必须以非零退出码结束。

#### 场景:执行格式化
- **当** 运行 `pnpm format`
- **那么** 全部源码文件按 Prettier 配置被格式化，命令以退出码 0 结束

#### 场景:对不合规范的文件执行格式校验
- **当** 存在未按 Prettier 配置格式化的文件时运行 `pnpm format:check`
- **那么** 命令以非零退出码结束、不修改任何文件，并列出不合规范的文件

### 需求:核心逻辑层四个模块必须有单元测试覆盖

项目必须引入 Vitest 测试框架。`src/core/` 下的 `train-fsm`、`scene-rotator`、`data-loader`、`theme-resolver` 四个模块必须各有对应的单元测试文件。测试必须在 `node` 环境下、不依赖 Vue 运行时即可执行；测试文件必须显式从 `vitest` 导入测试 API，禁止依赖 Vitest globals，以保证 `pnpm type-check` 对测试文件的类型检查通过。本阶段不要求覆盖 `data-validator` 与 `models`。

#### 场景:运行测试套件
- **当** 运行 `pnpm test`
- **那么** Vitest 在 `node` 环境执行 `src/core/` 下的全部单元测试，并报告通过/失败结果

#### 场景:测试文件显式导入测试 API
- **当** 对任一核心模块的测试文件执行类型检查
- **那么** 该文件显式从 `vitest` 导入所用的测试 API，不依赖 Vitest globals，`pnpm type-check` 通过

#### 场景:列车状态机测试覆盖关键行为
- **当** 执行 `train-fsm` 的单元测试
- **那么** 测试必须覆盖状态循环、环线与非环线、终点方向自动反转、自动与手动模式

#### 场景:画面轮播测试覆盖边界
- **当** 执行 `scene-rotator` 的单元测试
- **那么** 测试必须覆盖场景列表设置、自动轮播、手动跳转与越界索引

#### 场景:主题解析测试覆盖优先级合并
- **当** 执行 `theme-resolver` 的单元测试
- **那么** 测试必须验证线路级 > 城市级 > 默认级的三级合并优先级

#### 场景:数据加载测试覆盖缺失文件
- **当** `data-loader` 加载不存在的城市或线路数据
- **那么** 测试必须验证其抛出错误

### 需求:项目必须提供标准开发脚本与 Node 版本约束

`package.json` 的 `scripts` 必须包含 `lint`、`format`、`format:check`、`test`、`type-check`。`type-check` 必须能独立于 `build` 执行 TypeScript 类型检查。`package.json` 必须声明 `engines.node`，约束为同时满足 Vite 7 与 ESLint 9 的 Node 版本（`^20.19.0 || ^22.13.0 || >=24`）。

#### 场景:执行类型检查
- **当** 运行 `pnpm type-check`
- **那么** 命令执行 `vue-tsc` 类型检查，类型错误存在时以非零退出码结束

#### 场景:声明 Node 版本约束
- **当** 查看 `package.json`
- **那么** 其 `engines.node` 字段声明了同时满足 Vite 7 与 ESLint 9 的 Node 版本范围

### 需求:持续集成必须在变更上自动校验

项目必须提供 GitHub Actions 工作流，在 push 与 pull request 时依次运行 lint、format:check、type-check、test、build。CI 必须在固定的、同时满足 Vite 7 与 ESLint 9 要求的 Node 版本上运行。任一步骤失败时，CI 工作流必须标记为失败，并将失败状态暴露在对应的 commit / pull request 上。

#### 场景:CI 在 pull request 上运行
- **当** 向仓库提交 pull request
- **那么** CI 工作流在固定 Node 版本上自动运行 lint、format:check、type-check、test、build 五个步骤

#### 场景:某一校验步骤失败
- **当** CI 中任一步骤失败
- **那么** CI 工作流整体标记为失败，并在对应 commit / pull request 上显示失败的 check 状态

注：是否依据失败的 check 阻止合并，由仓库的 branch protection / ruleset 设置决定，不属本能力范围。

### 需求:项目必须将构建产物自动部署到 GitHub Pages

项目必须提供独立于 CI 校验工作流的 GitHub Actions 部署工作流，在默认分支（`master`）push 时自动构建并将产物发布到 GitHub Pages。该部署工作流必须声明 Pages 部署所需权限（`pages: write`、`id-token: write`），并经 `actions/deploy-pages` 发布。

构建必须使用适配 GitHub Pages 项目站点子路径的 base 路径（`/subway-lcd-monitor/`），且该子路径 base 必须仅在 CI 构建时生效、不得影响本地开发与预览（本地仍以根路径 `/` 提供）。部署工作流不重复执行 lint / test —— 校验职责由既有 CI 工作流承担。

#### 场景:推送默认分支触发自动部署
- **当** 向 `master` 分支 push
- **那么** 部署工作流自动构建项目并将产物发布到 GitHub Pages，站点经 `https://herbertgao.github.io/subway-lcd-monitor/` 子路径可正常访问、静态资源不 404

#### 场景:本地开发与预览不受部署 base 影响
- **当** 在本地运行 `pnpm dev` 或 `pnpm preview`
- **那么** 应用以根路径 `/` 提供，不受 GitHub Pages 子路径 base 影响

#### 场景:CI 校验工作流不变
- **当** 向仓库 push 或提交 pull request
- **那么** 既有 CI 校验工作流照常运行 lint / format:check / type-check / test / build，部署工作流不重复这些校验

