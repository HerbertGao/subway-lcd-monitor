## 1. 项目基础设施搭建

- [x] 1.1 使用 pnpm 初始化 Vue 3 + TypeScript + Vite 项目，替换现有 package.json、tsconfig.json 和 src/index.ts
- [x] 1.2 安装核心依赖：vue、vue-router、pinia、@vitejs/plugin-vue
- [x] 1.3 创建项目目录结构（core/、composables/、stores/、components/lcd/、components/controls/、themes/、data/）
- [x] 1.4 配置 vite.config.ts，创建 index.html、src/main.ts、src/App.vue 入口文件，确保项目可正常 dev 启动

## 2. 数据模型与类型定义

- [x] 2.1 创建 src/core/models/network.ts，定义 Station、Line、Network、LineRef 等 TypeScript 类型
- [x] 2.2 创建 src/core/models/train.ts，定义 TrainState 枚举（STOPPED、DEPARTING、RUNNING、ARRIVING）和 Direction 枚举（FORWARD、BACKWARD）
- [x] 2.3 创建 src/core/models/theme.ts，定义 Theme、SceneConfig、VisualConfig 等类型

## 3. 示例数据录入

- [x] 3.1 创建 src/data/beijing/network.json，录入北京线网基本信息（城市名、默认主题 ID、线路 ID 列表）
- [x] 3.2 创建 src/data/beijing/lines/line-yanfang.json，录入燕房线全部 9 站数据（含中英文站名、换乘信息、开门方向）
- [x] 3.3 实现数据加载工具函数，支持按城市加载 network.json 和按线路 ID 加载线路 JSON 文件
- [x] 3.4 实现数据校验函数：站点 ID 唯一性检查、换乘线路引用有效性检查

## 4. 列车运行状态机

- [x] 4.1 实现 src/core/train-fsm.ts，包含状态定义、状态流转（STOPPED→DEPARTING→RUNNING→ARRIVING→STOPPED）、禁止跳跃校验
- [x] 4.2 实现站点推进逻辑：ARRIVING→STOPPED 时当前站索引沿运行方向前进一位
- [x] 4.3 实现终点站处理：非环线自动反转方向、环线循环回首站
- [x] 4.4 实现运行方向管理：FORWARD/BACKWARD 方向切换（仅 STOPPED 状态允许）
- [x] 4.5 实现手动/自动两种触发模式：手动模式逐步推进、自动模式按时间间隔自动推进

## 5. 画面轮播系统

- [x] 5.1 实现 src/core/scene-rotator.ts，包含场景列表管理、当前场景索引、定时切换逻辑
- [x] 5.2 实现定时自动轮播：按 duration 切换、末尾循环回首个场景
- [x] 5.3 实现列车状态变化时重置轮播：切换场景列表、重置到第一个场景、重置计时器
- [x] 5.4 实现手动切换场景：跳转到指定场景、重置计时器

## 6. 主题系统

- [x] 6.1 实现 src/core/theme-resolver.ts，包含主题合并逻辑（深度合并，线路级 > 城市级 > 全局默认）
- [x] 6.2 创建 src/themes/default/index.ts，定义全局默认主题的完整视觉样式和行为配置（各状态的场景列表与时长）
- [x] 6.3 创建 src/themes/default/styles.css，定义默认主题的 CSS 变量

## 7. Pinia Stores 与 Composables

- [x] 7.1 创建 src/stores/line.ts（line store），管理当前城市、线路、站点数据的加载和查询
- [x] 7.2 创建 src/stores/simulation.ts（simulation store），管理列车运行状态、当前站、方向、运行模式
- [x] 7.3 创建 src/composables/useTrain.ts，桥接 TrainFSM 核心逻辑与 Vue 响应式系统
- [x] 7.4 创建 src/composables/useSceneRotation.ts，桥接 SceneRotator 核心逻辑与 Vue 响应式系统
- [x] 7.5 创建 src/composables/useTheme.ts，桥接 ThemeResolver 核心逻辑，管理 CSS 变量注入

## 8. LCD 渲染组件

- [x] 8.1 实现 src/components/lcd/LcdFrame.vue，渲染 LCD 外框装饰（深色边框模拟物理外壳）
- [x] 8.2 实现 src/components/lcd/LcdScreen.vue，作为 LCD 主容器负责场景调度，根据当前状态和场景渲染对应组件，注入主题 CSS 变量，管理 `<Transition>` 过渡动画
- [x] 8.3 实现 src/components/lcd/scenes/FullRouteScene.vue，使用 SVG 渲染全线路图（站点标记、连线、已过站/当前站/未过站样式区分、换乘标记、方向指示）
- [x] 8.4 实现 src/components/lcd/scenes/NearbyScene.vue，渲染当前站前后各至少 2 站的放大视图（中英文站名、换乘信息、方向箭头）
- [x] 8.5 实现 src/components/lcd/scenes/TransferScene.vue，渲染换乘信息（可换乘线路名称、颜色、方向）
- [x] 8.6 实现 src/components/lcd/scenes/ArrivalScene.vue，渲染到站提示（下一站中英文站名、开门方向、换乘提示）

## 9. 操作控制面板

- [x] 9.1 实现 src/components/controls/LineSelector.vue，提供城市选择、线路选择、方向选择功能
- [x] 9.2 实现 src/components/controls/TrainControls.vue，提供下一步按钮、自动/手动模式切换、方向切换按钮（非 STOPPED 状态禁用）
- [x] 9.3 实现 src/components/controls/ControlPanel.vue，整合线路选择、运行控制、场景切换列表（高亮当前场景）和状态信息显示

## 10. 页面整合与联调

- [x] 10.1 在 App.vue 中整合 LcdFrame（含 LcdScreen）和 ControlPanel，完成页面布局
- [x] 10.2 联调完整流程：选择北京燕房线 → 列车 STOPPED → 手动/自动推进 → 场景轮播 → 到达终点自动反转
- [x] 10.3 验证主题 CSS 变量注入和场景切换过渡动画效果
