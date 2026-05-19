## 1. 换乘线路标签（FullRouteScene / NearbyScene / 共享布局）

- [x] 1.1 在 `FullRouteScene` 文字层下方新增「换乘标签层」：`station.transfers` 非空的站渲染换乘线路名牌，每个换乘项一枚 —— 以 `transfers[].lineColor` 为底/边色、标注 `transfers[].lineName`；颜色与文案取自数据、不写死；多个换乘项纵向叠放
- [x] 1.2 换乘标签宽度受站间距约束 —— 复用既有字号自适应（`stationLabelFit`）思路，名牌文字过宽时缩字号 / 压缩，避免与相邻站标签重叠
- [x] 1.3 `NearbyScene` 同步换乘标签层，与全程线路图版式一致
- [x] 1.4 用 Playwright 验证：燕房线 / 房山线阎村东站渲染「房山线 / 燕房线」换乘标签、其余站不渲染；标签颜色取自数据、不与相邻站重叠

## 2. 站名特写黄条警示图标与版式（ArrivalScene / train-state-visuals）

- [x] 2.1 在 `src/core/train-state-visuals.ts` 新增集中的纯映射，判定某 `TrainState` 的黄条文案是否应带两端警示图标（「請小心空隙」类带、「請勿靠近車門」类不带）
- [x] 2.2 以纯内联 SVG 绘制港铁式红圈警示图标（红圈 + 列车 + 行人组合），不引入图片资源
- [x] 2.3 `ArrivalScene` 黄条 `.arrival__safety-bar` 两端按 2.1 的判定渲染 / 不渲染警示图标；黄条版式（高度）随是否带图标经 CSS 类名微调，不破坏窄屏不裁剪约束
- [x] 2.4 用 Playwright 验证：`STOPPED` / `ARRIVING` 黄条两端有红圈图标、`DEPARTING` 黄条无图标

## 3. 开门方向提示本侧闪烁（ArrivalScene / train-state-visuals）

- [x] 3.1 `getDoorHint` 返回中英双语两段（`{ zh, en, variant }`）以区分本侧（`right` / `both`）与对侧（`left`）；`left` / `right` / `both` 三态与空值（返回 null、不渲染）的处理逻辑不变
- [x] 3.2 本侧开门提示（`.arrival__door-hint--green`）新增闪烁动画 keyframes：「绿底圆角胶囊↔黑字无底」`steps(1)` 硬切、周期约 2s；开门提示渲染为上下两行
- [x] 3.3 对侧开门提示（`left` / `.arrival__door-hint--dark`）保持静态黑字无底、不加动画
- [x] 3.4 用 Playwright 验证：`right` / `both` 开门提示在「绿底圆角胶囊↔黑字无底」间闪烁、`left` 为静态黑字、无 `doorSide` 时不渲染

## 4. 方向箭头位置与闪烁（useRouteLayout / FullRouteScene / NearbyScene / 主题）

- [x] 4.1 `useRouteLayout` 的 `directionArrow` 改为把箭头定位在「最后一个已过站与下一站之间」的线路段上（约线段中部）
- [x] 4.2 新增方向箭头绿色的 `ColorConfig` 字段（`directionArrow`），同步更新 `theme.ts` 接口、`defaultTheme`、`useTheme` 注入、`theme-resolver.test.ts` fixture
- [x] 4.3 `FullRouteScene` / `NearbyScene` 的方向箭头由静态黑色三角改为与下一站圆点同步闪烁（`fill` 绿↔白、`steps(1)`、与 `station-dot-flash` 同 `2s` 周期严格同相，`stroke` 恒为 `var(--lcd-fg)`），箭头尺寸与站点圆点相近
- [x] 4.4 用 Playwright 验证：方向箭头位于最后已过站与下一站之间、与下一站圆点同步闪烁

## 5. 全程线路图换乘支线（FullRouteScene / local-network / train-state-visuals）

- [x] 5.1 调整 `src/core/local-network.ts`：提供纯函数，输入当前线路与全部线路数据（`availableLines`），解析出指定换乘站可换乘的线路及其站点序列 / 颜色；纯函数、不依赖 Vue，`transfers` 指向缺失线路降级跳过
- [x] 5.2 为 5.1 纯函数补 / 调整单元测试（含可解析换乘线路、无换乘、缺失线路降级等用例）
- [x] 5.3 `FullRouteScene` 在「下一站为换乘站」（`RUNNING` 状态、`nextStation` 含可解析换乘线路）时，在该换乘站处渲染换乘线路支线 —— 换乘线路自身色短线路条 + 站点 + 换乘节点连接当前线路换乘站；下一站非换乘站时不渲染支线。经 `line` store `availableLines` 取换乘线路数据
- [x] 5.4 `FullRouteScene` 底部蓝条在「下一站为换乘站」时切换为换乘提示文案（按 `nextStation.transfers` 解析的换乘线路生成中英双语、集中维护），否则为普通线路图提示语
- [x] 5.5 用 Playwright 验证：列车临近阎村东（`RUNNING`、下一站阎村东）时全程线路图在阎村东处渲染房山线换乘支线 + 底部换乘提示蓝条；下一站非换乘站时无支线、蓝条为普通提示语

## 6. 移除独立全网换乘图场景

- [x] 6.1 删除 `src/components/lcd/scenes/NetworkMapScene.vue`；`LcdScreen.vue` 的 `sceneComponentMap` 移除 `network-map` 注册
- [x] 6.2 `simulation` store 的 `updateScenes()` 移除 `network-map` 条件拼接逻辑，`RUNNING` 场景恢复为 `theme.scenes[RUNNING]` 基础线路图列表；移除 `isApproachingTransfer` 等仅服务独立场景的逻辑（如其它处不再需要）
- [x] 6.3 清理仅服务独立全网换乘图场景的死代码与测试（`simulation.test.ts` 中 `network-map` 插入相关用例随之调整或移除）

## 7. 整体回归

- [x] 7.1 运行 `pnpm lint`、`pnpm test`、`pnpm build` 全部通过
- [x] 7.2 用 Playwright 在燕房线、房山线及窄屏（320–1280）端到端回归五块内容（换乘标签、黄条图标、开门提示、方向箭头、换乘支线），确认无新回归、既有三场景与运行状态表现不受影响
