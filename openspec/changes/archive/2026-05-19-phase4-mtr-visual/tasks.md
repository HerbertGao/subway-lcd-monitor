## 1. 主题数据层 — 港铁配色

- [x] 1.1 扩展 `src/core/models/theme.ts` 的 `ColorConfig` 接口：新增必填港铁配色字段 `safetyBar`、`safetyBarText`、`infoBar`、`infoBarText`、`stationDot`（保留现有字段，不删）
- [x] 1.2 重做 `src/themes/default/index.ts` 的 `visual.colors`：按 design 决策 3 的港铁配色色值表填入全部字段（含新增 5 个字段）
- [x] 1.3 更新 `src/core/theme-resolver.test.ts` 的主题 fixture：为完整构造的 `Theme` 补齐新增的 `ColorConfig` 字段，使 `type-check` 与现有用例通过
- [x] 1.4 更新 `src/composables/useTheme.ts` 的 `injectCSSVariables`：把新增的 5 个港铁配色字段注入为对应 `--lcd-*` CSS 变量
- [x] 1.5 按港铁风调整 `src/themes/default/styles.css`（场景过渡等全局主题样式），与新配色协调

## 2. LCD 容器 — 比例与结构

- [x] 2.1 `src/components/lcd/LcdScreen.vue`：根元素比例由 `aspect-ratio: 3/1` 改为 `7/2`（超宽横条）；按 design 决策 6 重新核算 `min-height` 取值并把推导写入注释，沿用阶段三响应式机制
- [x] 2.2 `src/components/lcd/LcdScreen.vue`：移除独立 header（线路名+方向）与 footer（状态+站名），改为整屏场景容器；**同步清理** `<script>` 中仅服务 header/footer 的 computed（`activeLine`/`currentStation`/`trainStateLabel`/`directionLabel` 等）、`Direction` import 与相关 CSS 类，使 `noUnusedLocals` 下 `type-check` 通过
- [x] 2.3 `src/components/lcd/LcdFrame.vue`：核对/调整外框尺寸与 `box-sizing`，适配新的 7∶2 比例，确保「含外框整体」窄屏不溢出

## 3. 场景组件 — 港铁版式重绘

- [x] 3.1 `src/components/lcd/scenes/FullRouteScene.vue`：按 design 决策 5 重绘为港铁全程线路图，采用**图层式分层架构**（背景层 / 线路层 / 站点层 / 文字层 / 标记层 / 提示条层，各层职责单一、互不耦合，SVG 内用结构化 `<g>` 分组、可复用层逻辑抽为子组件或组合式函数）——浅灰背景、站点横排（圆点 + 中文名上 + 英文名下）、双色线路条（已过段 `--lcd-passed-station` 灰 / 未过段用线路数据 `line.color`）、已过站名转灰、当前站处行进方向箭头、站点圆点按 design 决策 4 统一白实心样式、**底部渲染蓝色提示条**（用 `--lcd-info-bar` / `--lcd-info-bar-text`，放固定占位文字）；**移除现有换乘 badge**（换乘线路标签属期三）；沿用 `viewBox` 响应式与 SVG 可访问性
- [x] 3.2 `src/components/lcd/scenes/NearbyScene.vue`：按与 `FullRouteScene` 一致的港铁视觉语言与图层式分层重绘近段放大图（复用线路层/站点层逻辑，仅当前站附近数站、字号更大），同样含底部蓝色提示条、不渲染换乘 badge
- [x] 3.3 `src/components/lcd/scenes/ArrivalScene.vue`：按图层式分层（背景层 / 文字层 / 站点圆点层 / 黄条层）重绘为港铁站名特写——上半浅灰区横排超大中文站名 + 白色实心圆点 + 英文名，下半黄色安全条（用 `--lcd-safety-bar` / `--lcd-safety-bar-text`，放固定占位「請小心空隙 Please mind the gap」）；**移除现有换乘 badge（`.arrival__transfers`）**；沿用阶段三 `clamp` 响应式
- [x] 3.4 扫描三个场景组件，把非数据驱动的硬编码颜色（圆点描边、文字色、黄条/蓝条色等）替换为主题注入的 CSS 变量；未过线路条颜色保留由线路数据 `line.color` 驱动

## 4. 素材

- [x] 4.1 更新 `.gitignore`：忽略根目录的港铁参考视频（`*.mkv` 或具名文件），确认该视频不进入 git 暂存

## 5. 验证

- [x] 5.1 运行 `pnpm lint && pnpm format:check && pnpm type-check && pnpm test && pnpm build`，确认整链通过、阶段一二的 71 个单测（含更新后的 theme-resolver fixture）不受影响
- [x] 5.2 对照参考帧 `/tmp/mtr-frames/frame-*.png` 手动验收：LCD 为港铁式超宽浅灰横条、无独立 header/footer；线路图的双色线路条、统一白实心站点圆点、方向箭头、底部蓝条符合港铁风；站名特写的超大站名 + 黄条版式符合港铁风；在视口 320/375/768/960/1280 下逐场景核验场景根元素 `scrollWidth <= clientWidth` 且 `scrollHeight <= clientHeight`、不被裁剪
