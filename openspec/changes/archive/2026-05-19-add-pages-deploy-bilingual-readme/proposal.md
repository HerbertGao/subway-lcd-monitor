## 为什么

项目已完成港铁风重制三期，但工程化与文档侧仍有两处缺口：

- **无自动部署** —— 构建产物（`dist/`）从未发布，没有可在线访问的 demo；现有 `.github/workflows/ci.yml` 仅做 lint/test/build 验证，不部署。
- **README 单语且滞后** —— 仅一份中文 `README.md`，无英文版（不利对外展示）；且内容停留在初版（「文档」节指向初始变更、未反映港铁化重制三期现状、无在线 demo 链接）。

本变更补齐 GitHub Pages 自动部署与双语 README。

## 变更内容

1. **GitHub Pages 自动部署**
   - 新增 `.github/workflows/deploy.yml`：`master` 分支 push 触发，纯 build + deploy（不重复 lint/test —— 验证由既有 `ci.yml` 覆盖）。build job 安装依赖、`pnpm build`、上传 Pages artifact；deploy job 经 `actions/deploy-pages` 发布到 GitHub Pages。workflow 声明 `pages: write`、`id-token: write` 权限。
   - `vite.config.ts` 新增**条件 base**：`base: process.env.GITHUB_ACTIONS ? '/subway-lcd-monitor/' : '/'` —— CI 构建走项目站点子路径、本地 `dev` / `preview` 仍走根路径。
   - 既有 `ci.yml` 保持不动。

2. **双语 README**
   - `README.md` 改为**英文**（GitHub 仓库首页默认渲染语言）；新增 `README.zh-CN.md` 为**简体中文**。两份顶部互放语言切换链接。
   - 两份内容**更新重写**：反映港铁风 LCD 报站屏模拟器现状（视觉 / 状态 / 换乘三期重制、双状态机、主题分级、三层架构），并加入在线 demo 链接 `https://herbertgao.github.io/subway-lcd-monitor/`。

## 功能 (Capabilities)

### 新增功能

（无。）

### 修改功能

- `dev-tooling`: 新增「项目必须将构建产物自动部署到 GitHub Pages」需求 —— 扩充工程化能力，覆盖独立于 CI 校验的 Pages 自动部署工作流与构建 base 路径约束。

双语 README 属项目文档，不构成能力需求、无对应增量规范。

## 影响

- **工程化 / CI**：新增 `.github/workflows/deploy.yml`；`ci.yml` 不变。
- **构建配置**：`vite.config.ts` 新增条件 `base`。
- **文档**：`README.md`（改为英文并更新内容）、`README.zh-CN.md`（新增中文）。
- **数据层 / 核心逻辑层 / 渲染层**：不涉及，无产品代码改动。
- **依赖**：不新增第三方依赖。
- **规格**：`dev-tooling` 增量规范（新增一条自动部署需求）。
- **仓库设置（非代码、需手动）**：首次部署前须在 GitHub 仓库 **Settings → Pages → Source 选「GitHub Actions」**；该设置无法由代码完成，须人工操作一次。

## 非目标

- 不修改既有 `ci.yml` 的验证流程。
- 不改动任何产品代码 / 功能 / 数据。
- 不引入第三方依赖。
- 不做自定义域名、不配置 `CNAME`。
- 不在部署 workflow 内重复 lint/test（验证职责留给 `ci.yml`）。
