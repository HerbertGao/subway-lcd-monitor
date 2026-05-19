## 1. GitHub Pages 自动部署

- [x] 1.1 `vite.config.ts` 新增条件 base：`base: process.env.GITHUB_ACTIONS ? '/subway-lcd-monitor/' : '/'`，并加注释说明（所有 GitHub Actions 环境的 `build` 走项目站点子路径、本地 `dev` / `preview` / `build` 走根路径）
- [x] 1.2 新增 `.github/workflows/deploy.yml`：`on: push` 限 `master`；`permissions` 含 `contents: read` / `pages: write` / `id-token: write`；设 `concurrency` 组避免并发部署；**build job** —— checkout、pnpm / Node（版本与缓存对齐 `ci.yml`，Node `22.13.0`）、`pnpm install --frozen-lockfile`、`pnpm build`、`actions/configure-pages`、`actions/upload-pages-artifact`（`dist/`）；**deploy job** —— `needs: build`、`environment`（`name: github-pages`、`url: ${{ steps.deployment.outputs.page_url }}`）、`actions/deploy-pages`（步骤 `id: deployment`）
- [x] 1.3 确认 `.github/workflows/ci.yml` 未被改动；本地 `pnpm build` 验证无 `GITHUB_ACTIONS` 时 base 为根路径 `/`

## 2. 双语 README

- [x] 2.1 `README.md` 重写为英文：项目简介、功能特性、技术栈、Quick Start（明确 Node 版本范围 `^20.19.0 || ^22.13.0 || >=24` 与 pnpm `11.1.2`，纠正旧版「Node 18+」）、项目结构、架构概览、在线 demo 链接（`https://herbertgao.github.io/subway-lcd-monitor/`）、文档指引；含「首次部署前须在仓库 Settings → Pages → Source 选『GitHub Actions』」的部署说明；顶部语言切换链接（`English | [简体中文](./README.zh-CN.md)`）
- [x] 2.2 新增 `README.zh-CN.md` 简体中文：与英文版结构一致、内容一一对应（含 Node / pnpm 版本、首次启用 Pages 说明、在线 demo 链接）；顶部语言切换链接（`[English](./README.md) | 简体中文`）
- [x] 2.3 两份 README 内容更新至港铁化重制现状 —— 视觉 / 状态 / 换乘三期重制、双状态机（TrainFSM + SceneRotator）、主题分级、三层架构；`openspec/` 文档指引更新为当前结构

## 3. 收尾验证

- [x] 3.1 运行 `pnpm lint`、`pnpm format:check`、`pnpm type-check`、`pnpm test`、`pnpm build` 全部通过（部署配置与 Markdown 改动未破坏既有构建与格式）
- [x] 3.2 人工核对 `deploy.yml` YAML 语法 / job 依赖（`deploy` 含 `needs: build`）/ 权限配置、README 双语互链可达与中英内容对应、两版 README 均含首次启用 Pages 的说明
