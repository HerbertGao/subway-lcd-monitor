## 新增需求

### 需求:项目必须将构建产物自动部署到 GitHub Pages

项目必须提供独立于 CI 校验工作流的 GitHub Actions 部署工作流，在默认分支（`master`）push 时自动构建并将产物发布到 GitHub Pages。该部署工作流必须声明 Pages 部署所需权限（`pages: write`、`id-token: write`），并经 `actions/deploy-pages` 发布。

构建必须使用适配 GitHub Pages 项目站点子路径的 base 路径（`/subway-lcd-monitor/`），且该子路径 base 必须仅在 CI 构建时生效、不得影响本地开发与预览（本地仍以根路径 `/` 提供）。部署工作流不重复执行 lint / test —— 校验职责由既有 CI 工作流承担。

#### 场景:推送默认分支触发自动部署
- **当** 向 `master` 分支 push
- **那么** 部署工作流自动构建项目并将产物发布到 GitHub Pages，站点经 `https://herbertgao.github.io/subway-lcd-monitor/` 子路径可正常访问、静态资源不 404

#### 场景:本地开发与预览不受部署 base 影响
- **当** 在本地运行 `pnpm dev` 或 `pnpm preview`
- **那么** 应用以根路径 `/` 提供，不受 GitHub Pages 子路径 base 影响

#### 场景:CI 校验工作流不变
- **当** 向仓库 push 或提交 pull request
- **那么** 既有 CI 校验工作流照常运行 lint / format:check / type-check / test / build，部署工作流不重复这些校验
