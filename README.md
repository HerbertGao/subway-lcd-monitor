# 地铁 LCD 报站显示屏模拟器

> Subway LCD Monitor — 基于 Vue 3 + TypeScript 的地铁车站报站屏模拟器

模拟地铁列车运行过程中车厢内 LCD 报站屏的显示效果。提供可控的列车运行状态切换，实时展示线路全程图、附近站点、到站提示等画面，并支持按线路 / 城市分级的主题定制。

## 功能特性

- **LCD 画面轮播**：全程线路图、附近站点、到站提示等多种画面，按列车状态自动轮播
- **列车状态机**：列车在「停站 → 发车 → 运行 → 进站」四个状态间循环，支持自动 / 手动模式
- **控制面板**：切换线路、运行方向、列车状态，手动指定画面
- **主题系统**：按「线路 > 城市 > 默认」优先级解析主题，颜色、字体、画面配置均可定制
- **数据驱动**：地铁线网以 JSON 描述，含站点中英文名、换乘信息、开门方向等
- **分层架构**：数据层 / 核心逻辑层 / 渲染层解耦，核心逻辑为纯 TypeScript，与框架无关

## 技术栈

- **Vue 3**（Composition API）+ **TypeScript**（strict 模式）
- **Vite** 构建与开发服务器
- **Pinia** 状态管理
- **pnpm** 包管理
- 纯 CSS + SVG 渲染，无第三方 UI 组件库

## 快速开始

环境要求：Node.js 18+、pnpm。

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

## 项目结构

```
src/
├── main.ts              # 应用入口
├── App.vue              # 根组件
├── core/                # 纯 TypeScript 核心逻辑（与框架无关）
│   ├── models/          # network / train / theme 类型定义
│   ├── train-fsm.ts     # 列车状态机
│   ├── scene-rotator.ts # 画面轮播控制器
│   ├── data-loader.ts   # JSON 数据加载
│   └── theme-resolver.ts# 主题分级解析
├── composables/         # Vue 组合式函数（桥接核心逻辑与响应式）
├── stores/              # Pinia 状态仓库（line / simulation）
├── components/
│   ├── lcd/             # LCD 显示组件与各画面（scenes/）
│   └── controls/        # 控制面板组件
├── themes/              # 主题定义（default/ 等）
└── data/                # 地铁线网 JSON 数据（如 beijing/）

openspec/                # OpenSpec 提案与设计文档
```

## 架构概览

采用三层架构：

1. **数据层** `src/data/` —— 静态 JSON 描述地铁线网，配合 TypeScript 类型定义
2. **核心逻辑层** `src/core/` —— 纯 TypeScript，包含状态机、数据加载、主题解析
3. **渲染层** `src/components/` + `src/composables/` —— Vue 组件与 CSS 渲染

双状态机协同：

- **列车状态机（TrainFSM）**：驱动列车在 `STOPPED → DEPARTING → RUNNING → ARRIVING` 间循环
- **画面轮播器（SceneRotator）**：每个列车状态对应一组画面，按时长自动轮播，支持手动覆盖

主题按「线路级 > 城市级 > 默认级」优先级合并解析，通过 CSS 变量注入实现动态换肤。

## 文档

设计提案与规格说明位于 `openspec/changes/subway-lcd-simulator/`，包含 `proposal.md`、`design.md`、`tasks.md` 及各能力的 `specs/`。
