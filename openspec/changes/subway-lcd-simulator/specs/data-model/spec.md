## ADDED Requirements

### 需求：Station 数据结构

系统必须定义 Station（站点）数据结构，包含以下字段：
- `id`: 唯一标识符（string，kebab-case）
- `name`: 中文站名（string）
- `nameEn`: 英文站名（string）
- `transfers`: 可换乘线路引用列表（LineRef[]），无换乘时为空数组
- `doorSide`: 开门方向（`"left"` | `"right"` | `"both"`）

#### 场景：完整站点数据

- **当** 加载一个包含所有字段的站点数据
- **那么** 系统必须正确解析 id、name、nameEn、transfers、doorSide 所有字段

#### 场景：无换乘站点

- **当** 站点的 transfers 字段为空数组
- **那么** 系统必须将该站点识别为非换乘站

### 需求：Line 数据结构

系统必须定义 Line（线路）数据结构，包含以下字段：
- `id`: 唯一标识符（string，kebab-case）
- `name`: 线路名称（string，如"1号线"）
- `nameEn`: 线路英文名称（string，如"Line 1"）
- `color`: 线路标识色（string，CSS 颜色值）
- `stations`: 站点有序列表（Station[]），按运行方向排列
- `isLoop`: 是否为环线（boolean）
- `themeId`: 该线路绑定的主题 ID（string，可选）

#### 场景：普通线路

- **当** 加载一条 isLoop 为 false 的线路
- **那么** 系统必须将其识别为有明确起终点的线路，stations 列表的首尾元素分别为起点站和终点站

#### 场景：环线

- **当** 加载一条 isLoop 为 true 的线路
- **那么** 系统必须将其识别为环形线路，列车可沿单一方向循环运行

### 需求：Network 数据结构

系统必须定义 Network（线网）数据结构，包含以下字段：
- `city`: 城市名称（string）
- `cityEn`: 城市英文名称（string）
- `defaultThemeId`: 城市默认主题 ID（string）
- `lines`: 该城市的线路 ID 列表（string[]）

#### 场景：加载城市线网

- **当** 加载某个城市的 network.json
- **那么** 系统必须解析出城市名称、默认主题和所有线路 ID 列表

### 需求：数据文件组织

系统必须按城市和线路组织数据文件，目录结构为：
- `src/data/<city>/network.json` — 城市级信息
- `src/data/<city>/lines/<line-id>.json` — 各线路数据

每个线路 JSON 文件必须符合 Line 数据结构定义。

#### 场景：按城市加载数据

- **当** 指定城市标识（如 "beijing"）
- **那么** 系统必须从 `src/data/beijing/network.json` 加载线网信息，并能按 network 中的线路 ID 列表加载对应的线路数据文件

#### 场景：线路数据文件不存在

- **当** network.json 中引用的线路 ID 对应的 JSON 文件不存在
- **那么** 系统必须抛出明确的错误提示，包含缺失的文件路径

### 需求：数据校验

系统必须在加载数据时进行基本校验：
- Station 的 id 在同一线路内必须唯一
- Line 的 id 在同一城市内必须唯一
- Station 的 transfers 中引用的线路 ID 必须在同一城市的 network 中存在

#### 场景：站点 ID 重复

- **当** 同一线路数据中存在两个相同 id 的站点
- **那么** 系统必须抛出校验错误，提示重复的站点 ID 和所属线路

#### 场景：换乘引用无效线路

- **当** 站点的 transfers 中包含一个在当前城市 network 中不存在的线路 ID
- **那么** 系统必须抛出校验错误，提示无效的换乘线路引用
