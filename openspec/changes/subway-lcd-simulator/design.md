## 上下文

这是一个全新项目，从空白 TypeScript 项目开始构建地铁 LCD 报站显示屏模拟器。没有遗留代码需要兼容，但需要做出一系列基础架构决策来支撑后续的功能开发。

核心挑战在于：系统需要同时管理两个维度的状态（列车运行状态 × 画面轮播状态），并且需要一套灵活的主题系统让不同城市/线路的 LCD 风格可以独立定制。

## 目标 / 非目标

**目标：**

- 建立清晰的分层架构：数据层、核心逻辑层、渲染层相互解耦
- 核心逻辑（状态机、数据模型）框架无关，便于测试和复用
- 主题系统支持城市/线路级别的风格绑定，场景组件可被主题覆盖
- 第一个版本能完整跑通一条线路的 LCD 模拟显示
- 数据格式设计便于半自动采集和未来的编辑器接入

**非目标：**

- 不做多语言国际化（LCD 上的中英文站名是数据的一部分，不是 i18n）
- 不做实时数据接入（不对接真实地铁运营系统）
- 不做移动端适配（优先桌面浏览器全屏显示）
- 不做数据编辑器（后期功能）
- 不做音频播报模拟

## 决策

### D1: 前端框架 — Vue 3 + Composition API

**选择**: Vue 3 + TypeScript + Vite

**替代方案**:
- React + Vite: 生态成熟，但用户更熟悉 Vue
- 纯 Canvas/Vanilla: 像素级控制强，但开发效率低、组件化困难

**理由**: 用户熟悉 Vue；Vue 内置 `<Transition>` 对画面切换场景天然适合；`<style scoped>` 便于主题样式隔离；Composition API 适合抽取状态机等可复用逻辑为 composable。

### D2: 整体架构 — 三层分离

```
┌──────────────────────────────────────────────────┐
│                渲染层 (renderer/)                  │
│  Vue 组件：LCD 容器、场景组件、控制面板             │
│  依赖：Vue 3, SVG, CSS Variables                  │
├──────────────────────────────────────────────────┤
│                核心逻辑层 (core/)                  │
│  纯 TypeScript：状态机、轮播器、主题解析器          │
│  零框架依赖，可独立测试                            │
├──────────────────────────────────────────────────┤
│                数据层 (data/)                      │
│  JSON 静态文件 + TypeScript 类型定义               │
│  线网数据、主题配置                                │
└──────────────────────────────────────────────────┘
```

**理由**: 核心逻辑层不依赖 Vue，便于单元测试和未来迁移。渲染层通过 composable 桥接核心逻辑。

### D3: 双层状态机架构

系统运行时由两个嵌套状态机驱动：

**外层 — 列车运行状态机 (TrainFSM)**

```
STOPPED ──▶ DEPARTING ──▶ RUNNING ──▶ ARRIVING ──▶ STOPPED
(停靠在站)   (关门出发)    (运行中)    (即将到站)   (下一站)
```

- 状态流转由用户操作或自动计时触发
- 每次 ARRIVING → STOPPED 时，当前站索引前进一位
- 到达终点站时自动反转方向或停止（取决于线路配置）

**内层 — 画面轮播状态机 (SceneRotator)**

- 每个列车状态对应一组可轮播的场景（Scene）
- 场景按配置的时长定时自动切换，支持手动覆盖
- 列车状态变化时，重置轮播到该状态的第一个场景

两层状态机通过事件连接：TrainFSM 状态变化 → SceneRotator 重置场景列表。

### D4: 主题系统 — 混合覆盖模式

**选择**: 默认场景组件 + 主题可选覆盖（方案 C）

**替代方案**:
- 方案 A（纯 CSS 变量）: 灵活度不够，不同城市 LCD 布局差异大
- 方案 B（主题自带全套组件）: 工作量大，共享逻辑难复用

**主题结构**:

```typescript
interface Theme {
  id: string
  name: string
  // 视觉样式
  visual: {
    colors: { background, foreground, lineColor, ... }
    fonts: { stationName, info, ... }
    stationMarker: 'circle' | 'square' | 'diamond'
    lineCap: 'round' | 'square'
  }
  // 行为配置 — 每个列车状态下的场景列表与时长
  scenes: {
    [TrainState]: Array<{
      id: string
      duration: number       // 秒
      component?: Component  // 覆盖默认组件（可选）
    }>
  }
}
```

**主题解析优先级**: 线路级主题 > 城市级主题 > 全局默认主题

**理由**: 大部分主题只需 CSS 变量定制即可，少数需要深度定制的场景才覆盖组件，兼顾灵活性和开发效率。

### D5: LCD 渲染 — HTML/CSS + SVG 混合

**选择**: 文字信息区用 HTML/CSS，线路站点图用 SVG

**替代方案**:
- 纯 Canvas 2D: 像素级控制强，但文字渲染和交互不便
- 纯 HTML/CSS: 线路图的连线和站点标记用 CSS 实现不够自然

**理由**: SVG 天然适合线路图（点和线的组合），支持缩放不失真；HTML/CSS 处理文字排版和布局更高效；两者可以在 Vue 组件中无缝混合。

### D6: 状态管理 — Pinia

**选择**: Pinia

**替代方案**:
- Vuex: 已是 Vue 2 时代产物，Pinia 是 Vue 3 官方推荐
- 纯 Composition API (ref/reactive): 对于跨组件共享的列车状态和线路数据，缺乏结构化管理

**理由**: Pinia 轻量、TypeScript 支持好、DevTools 集成便于调试状态机行为。用于管理全局状态（当前线路、列车状态、主题配置等），核心状态机逻辑仍在 `core/` 层，Pinia store 作为桥接层。

### D7: 数据格式 — 静态 JSON + TypeScript 类型

线网数据以 JSON 文件存储，按城市和线路组织：

```
src/data/
├── beijing/
│   ├── network.json        # 城市级信息（名称、默认主题）
│   └── lines/
│       ├── line-1.json      # 线路数据（站点列表、颜色等）
│       └── line-yanfang.json
```

通过 Vite 的静态资源导入或动态 import 加载。TypeScript 类型定义在 `core/models/` 中，JSON 数据需符合类型约束。

**理由**: JSON 格式简单通用，便于半自动采集脚本输出和人工编辑；按城市/线路拆分文件避免单文件过大；TypeScript 类型提供编译期校验。

### D8: 项目目录结构

```
subway-monitor/
├── package.json
├── vite.config.ts
├── index.html
│
├── src/
│   ├── main.ts                      # Vue 应用入口
│   ├── App.vue                      # 根组件
│   │
│   ├── core/                        # 核心逻辑（纯 TS，零框架依赖）
│   │   ├── models/                  # 数据类型定义
│   │   │   ├── network.ts           # Network, Line, Station
│   │   │   ├── theme.ts             # Theme, SceneConfig
│   │   │   └── train.ts             # TrainState, Direction
│   │   ├── train-fsm.ts             # 列车运行状态机
│   │   ├── scene-rotator.ts         # 画面轮播控制器
│   │   └── theme-resolver.ts        # 主题合并/优先级解析
│   │
│   ├── composables/                 # Vue Composition API 桥接
│   │   ├── useTrain.ts              # 列车状态 composable
│   │   ├── useSceneRotation.ts      # 场景轮播 composable
│   │   └── useTheme.ts              # 主题 composable
│   │
│   ├── stores/                      # Pinia stores
│   │   ├── line.ts                  # 当前线路/站点数据
│   │   └── simulation.ts            # 模拟运行状态
│   │
│   ├── components/                  # Vue 组件
│   │   ├── lcd/                     # LCD 显示屏
│   │   │   ├── LcdScreen.vue        # LCD 主容器（场景调度）
│   │   │   ├── LcdFrame.vue         # LCD 外框装饰
│   │   │   └── scenes/              # 默认场景组件
│   │   │       ├── FullRouteScene.vue
│   │   │       ├── NearbyScene.vue
│   │   │       ├── TransferScene.vue
│   │   │       └── ArrivalScene.vue
│   │   │
│   │   └── controls/                # 操作面板
│   │       ├── ControlPanel.vue
│   │       ├── LineSelector.vue
│   │       └── TrainControls.vue
│   │
│   ├── themes/                      # 主题定义
│   │   ├── default/                 # 默认主题
│   │   │   ├── index.ts
│   │   │   └── styles.css
│   │   └── beijing-classic/         # 示例：北京经典风格
│   │       ├── index.ts
│   │       └── styles.css
│   │
│   └── data/                        # 线网数据（JSON）
│       └── beijing/
│           ├── network.json
│           └── lines/
│
├── scripts/                         # 数据采集脚本
│   └── fetch-stations.ts
│
└── openspec/                        # OpenSpec 产出物
```

## 风险 / 权衡

**[数据录入工作量大] → 缓解：先只录入一条线路（如北京燕房线，仅 9 站）跑通全流程，再扩展数据。提供半自动采集脚本降低人工成本。**

**[主题系统过度设计] → 缓解：第一版只实现一个默认主题，主题接口预留但不急于实现多主题切换。验证接口设计后再扩展。**

**[双层状态机复杂度] → 缓解：核心逻辑在纯 TypeScript 层实现，可独立编写单元测试验证状态流转的正确性，不依赖 UI 渲染。**

**[SVG 线路图性能] → 缓解：单条线路的站点数量有限（通常 < 50 站），SVG 渲染不会有性能瓶颈。如果未来需要渲染全线网图再考虑优化。**

**[场景组件覆盖机制的类型安全] → 缓解：通过 TypeScript 泛型和 Vue 的 `defineAsyncComponent` 确保覆盖组件的 props 接口与默认组件一致。**
