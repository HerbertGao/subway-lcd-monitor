## 上下文

港铁风重制三期已完成并归档。工程化侧 `.github/workflows/ci.yml` 已做 lint/format/type-check/test/build 校验（全分支 + PR），但无部署环节；`README.md` 仅一份中文、内容停留在初版。本变更补 GitHub Pages 自动部署与双语 README，不触及任何产品代码。

当前相关事实：

- `vite.config.ts` 无 `base` 配置（默认 `/`）。
- `.github/workflows/ci.yml` 已存在，跑全分支 + PR 的校验。
- `README.md` 一份中文。
- 仓库 `HerbertGao/subway-lcd-monitor`，GitHub Pages 项目站点 URL 为 `https://herbertgao.github.io/subway-lcd-monitor/`（**子路径**，非根）。

## 目标 / 非目标

**目标：**
- `master` push 时自动构建并部署到 GitHub Pages。
- README 英文为主（`README.md`）+ 中文（`README.zh-CN.md`），内容更新至港铁化重制现状。

**非目标：**
- 不修改 `ci.yml`、不改任何产品代码 / 数据。
- 不自定义域名 / 不配 `CNAME`。
- 部署工作流不重复 lint/test。

## 决策

### 决策 1：构建 base —— 条件式

GitHub Pages 项目站点在子路径 `/subway-lcd-monitor/`，Vite 默认 `base: '/'` 会使构建产物引用 `/assets/...` 绝对根路径、部署后静态资源全部 404。

`vite.config.ts` 采用条件 base：`base: process.env.GITHUB_ACTIONS ? '/subway-lcd-monitor/' : '/'`。GitHub Actions 运行环境中 `GITHUB_ACTIONS` 环境变量恒为 `'true'`，故**所有 GitHub Actions 环境中的 `build`**（含 `ci.yml` 的校验构建与 `deploy.yml` 的部署构建）自动走子路径；本地 `dev` / `preview` / `build` 走根路径 `/`。`ci.yml` 的构建仅验证可构建性、不使用产物，走子路径 base 无副作用。

**替代方案。** 写死 `base: '/subway-lcd-monitor/'` —— 本地 `preview` 也被迫走子路径，不干净；命令行 `vite build --base=...` —— base 散落在 workflow、`vite.config.ts` 不可见。均否决，取条件式（一处可见、本地零影响）。

### 决策 2：独立部署工作流

新增 `.github/workflows/deploy.yml`，与 `ci.yml` 职责分离：

- `on: push` 限定 `master` 分支。
- `permissions`: `contents: read`、`pages: write`、`id-token: write`。
- `concurrency` 组（如 `pages`）避免并发部署互相覆盖。
- **build job**：checkout → 装 pnpm / Node（对齐 `ci.yml` 的版本与缓存）→ `pnpm install --frozen-lockfile` → `pnpm build` → `actions/configure-pages` → `actions/upload-pages-artifact`（`dist/`）。
- **deploy job**：`needs: build`（依赖 build job、待 Pages artifact 上传完成后才运行）；`environment` 设 `name: github-pages` 与 `url: ${{ steps.deployment.outputs.page_url }}`；`actions/deploy-pages` 步骤设 `id: deployment` 以供 environment url 引用。

部署工作流**不**重复 lint/test —— 校验由 `ci.yml` 覆盖；部署失败不污染 CI 信号。`ci.yml` 保持不动。

### 决策 3：双语 README

`README.md` 改为英文（GitHub 仓库首页默认渲染该文件）、新增 `README.zh-CN.md` 中文。两份顶部互放语言切换链接。内容统一更新重写：反映港铁风 LCD 报站屏模拟器现状（视觉 / 状态 / 换乘三期重制、双状态机、主题分级、三层架构），加入在线 demo 链接 `https://herbertgao.github.io/subway-lcd-monitor/`。两份内容须一一对应。

## 风险 / 权衡

- [GitHub Pages 须手动启用] → 仓库 Settings → Pages → Source 选「GitHub Actions」，此设置无法由代码完成；tasks 与 README 须提示使用者手动操作一次，否则首次部署会失败。
- [README 中英内容漂移] → 两份 README 内容须一一对应，本次更新时同步撰写、结构一致。
- [Node 版本与 ci.yml 一致] → deploy.yml 的 Node 版本与 pnpm 设置须对齐 `ci.yml`，避免构建环境差异。

## 迁移计划

纯配置 + 文档变更，无数据 / 接口 / 产品代码改动，无需迁移。首次部署前由使用者在 GitHub 仓库设置中手动启用 Pages（Source 选 GitHub Actions）。回滚即删除 `deploy.yml` 与 `vite.config.ts` 的 base 改动。
