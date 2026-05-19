[English](./README.md) | 简体中文

# 地铁 LCD 报站显示屏模拟器

> 一个港铁风格的地铁车厢内 LCD 报站显示屏模拟器，基于 Vue 3 + TypeScript 构建。

Subway LCD Monitor 复刻地铁车厢内 LCD 报站屏的外观与行为。它渲染一条港铁风格的超宽状态横条，在全程线路图、临近站点视图与到站特写三个场景间轮播，由可控的列车运行状态驱动，并支持按线路 / 城市分级定制的主题视觉系统。

**在线 demo：** <https://herbertgao.github.io/subway-lcd-monitor/>

## 功能特性

- **港铁风格 LCD 屏** —— 超宽 7:2 状态横条，呈现港铁观感：浅灰屏底、双色线路条、黄色安全条、蓝色提示条。
- **三场景轮播** —— 屏幕在三个场景间轮播：全程线路图、临近站点特写、到站站点特写。
- **双状态机** —— `TrainFSM` 驱动列车在 `STOPPED → DEPARTING → RUNNING → ARRIVING` 间循环，`SceneRotator` 在每个列车状态内按时长轮播场景，并支持手动覆盖。
- **换乘渲染** —— 在换乘站处，屏幕从主线路绘制换乘线路支线。
- **图层式 SVG 渲染** —— 每个场景由专用 SVG 图层组合而成（背景、线路、站点圆点、标记、文字、换乘支线）。
- **主题分级系统** —— 颜色、字体与场景配置经「线路 > 城市 > 默认」三级合并解析，并以 CSS 变量注入实现动态换肤。
- **数据驱动** —— 地铁线网以 JSON 描述（站点中英文名、换乘信息、开门方向），配合 TypeScript 严格类型。
- **控制面板** —— 切换线路、运行方向与列车状态，或手动指定固定场景。
- **分层架构** —— 数据层 / 核心逻辑层 / 渲染层解耦，核心逻辑为与框架无关的纯 TypeScript。

## 技术栈

- **Vue 3**（Composition API、`<script setup>`）+ **TypeScript**（strict 模式）
- **Vite 7** —— 构建工具与开发服务器
- **Pinia** —— 状态管理
- **Vitest** —— 核心逻辑层单元测试
- **pnpm** —— 包管理器
- 纯 CSS + SVG 渲染，无第三方 UI 组件库

## 快速开始

环境要求：

- **Node.js** `^20.19.0 || ^22.13.0 || >=24`
- **pnpm** `11.1.2`

```bash
# 安装依赖
pnpm install

# 启动开发服务器（默认 http://localhost:5173）
pnpm dev

# 生产构建
pnpm build

# 预览构建产物
pnpm preview
```

其他常用脚本：

```bash
pnpm lint          # ESLint，零警告
pnpm format:check  # Prettier 格式校验
pnpm type-check    # vue-tsc 类型检查
pnpm test          # Vitest 单元测试
```

## 部署

推送到 `master` 分支时，`.github/workflows/deploy.yml` 会自动构建并发布到 GitHub Pages。

> **首次部署设置：** 首次部署前，须在仓库 **Settings → Pages → Source** 中选择 **GitHub Actions**。此设置无法由代码完成，须人工操作一次，否则首次部署会失败。

## 项目结构

```
src/
├── main.ts              # 应用入口
├── App.vue              # 根组件
├── core/                # 与框架无关的纯 TypeScript 核心逻辑
│   ├── models/          # network / train / theme 类型定义
│   ├── train-fsm.ts     # 列车状态机
│   ├── scene-rotator.ts # 场景轮播控制器
│   ├── data-loader.ts   # JSON 数据加载
│   ├── data-validator.ts# 线网数据完整性校验
│   ├── theme-resolver.ts# 主题分级解析
│   ├── train-state-visuals.ts # 按状态推导视觉
│   ├── local-network.ts # 本地线网辅助逻辑
│   └── logger.ts        # 分级日志设施
├── composables/         # 桥接核心逻辑与响应式的 Vue 组合式函数
├── stores/              # Pinia 状态仓库（line / simulation）
├── components/
│   ├── lcd/             # LCD 显示组件与各场景（scenes/）
│   ├── controls/        # 控制面板组件
│   └── common/          # 共用组件（如 ErrorBoundary）
├── themes/              # 主题定义（default/ 等）
└── data/                # 地铁线网 JSON 数据（如 beijing/）

openspec/                # OpenSpec 能力规格与变更提案
```

## 架构概览

采用三层架构：

1. **数据层** —— `src/data/` —— 静态 JSON 描述地铁线网（北京地铁燕房线与房山线），配合 TypeScript 类型定义。
2. **核心逻辑层** —— `src/core/` —— 与框架无关的纯 TypeScript：状态机、数据加载与校验、主题解析、日志。
3. **渲染层** —— `src/components/` + `src/composables/` —— Vue 组件与 CSS / SVG 渲染。

两个协同的状态机：

- **列车状态机（`TrainFSM`）** —— 驱动列车在 `STOPPED → DEPARTING → RUNNING → ARRIVING` 间循环，支持自动与手动模式。
- **场景轮播器（`SceneRotator`）** —— 每个列车状态对应一组场景，按时长自动轮播，支持手动覆盖。

港铁化重制分三期交付 —— **视觉重制**（港铁配色、超宽比例、场景版式）、**状态重制**（运行状态驱动的站点圆点、站名特写、开门方向提示）、**换乘内容重制**（换乘站处的换乘线路支线）。

主题经「线路 > 城市 > 默认」分级合并解析，并通过 CSS 变量注入实现动态换肤。场景以图层式 SVG 渲染（背景、线路、圆点、标记、文字、换乘支线）。

## 文档

规格说明与变更历史位于 `openspec/`：

- `openspec/specs/` —— 当前能力规格（`dev-tooling`、`mtr-visual-style`、`mtr-train-states`、`experience-adaptation`、`runtime-robustness`）。
- `openspec/changes/` —— 进行中的变更提案（`proposal.md`、`design.md`、`tasks.md`）。
- `openspec/changes/archive/` —— 已归档变更，含港铁化重制各期。
