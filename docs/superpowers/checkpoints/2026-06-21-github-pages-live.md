# GitHub Pages 已上线快照

## 当前入口

- 项目目录：`C:\Users\sunka\OneDrive\桌面\遗物数据库`
- 当前分支：`master`
- 公开仓库：<https://github.com/sunkai2212/wand-sword-team-builder>
- 公开网页：<https://sunkai2212.github.io/wand-sword-team-builder/>
- Pages 生产基础路径：`/wand-sword-team-builder/`
- GitHub Actions 工作流：<https://github.com/sunkai2212/wand-sword-team-builder/actions/runs/27884912674>

## 已完成内容

- 新增统一的 `resolveAssetUrl` 边界，技能、宠物和四职业形象都能同时适配本地根路径与 GitHub Pages 项目子路径。
- 新增跨 Windows/Linux 的 `npm run build:pages`，生产构建使用 `/wand-sword-team-builder/`。
- 新增 GitHub Actions Pages 工作流；推送到 `master` 后自动执行安装、数据校验、单元测试、Pages 构建和部署。
- 创建公开仓库并启用 HTTPS Pages。
- GitHub 初次在空仓库启用 Pages 时自动生成了仅允许 `main` 的环境规则；已将 `github-pages` 环境规则校正为 `master`，重跑后构建和部署均成功。

## 关键提交

- `7ed6eca`：新增部署基础路径解析。
- `f5a17e9`：所有运行时图片接入基础路径解析。
- `f2508a8`：新增 Pages 构建、工作流与部署说明。
- 本快照所在提交：`docs: snapshot live GitHub Pages deployment`。

## 验证证据

- 本地完整验证：380 个技能、5 个宠物、385 个素材通过数据校验；57/57 单元测试、38/38 Chromium 交互测试通过；Pages 构建通过。
- GitHub Actions 运行 `27884912674`：`build` 与 `deploy` 均为 `success`。
- 公网入口返回 HTTP 200。
- 公网职业形象 `assets/professions/knight.svg` 返回 HTTP 200。
- 公网宠物图标 `assets/pets/qianming.webp` 返回 HTTP 200。
- 公网技能图标 `assets/skills/knight-s1-active-1.webp` 返回 HTTP 200。
- 公网脚本位于项目子路径，并包含“选择当前转数”“生成图片”和完整非官方玩家工具声明。

## 已知边界

- 当前桌面会话的内置浏览器自动化连接被运行环境拦截，因此本次没有在公网页面上重复点击一遍“少人阵容生成 PNG”；同一提交的该流程已由 38 项本地 Chromium 测试覆盖。公网 HTML、脚本和三类图片资源均已独立请求验证。
- 网页没有后端、账号或数据库；队伍配置和 PNG 生成均只在用户浏览器本地完成。
- 技能只展示图标，不包含名称、效果或数值说明。

## 后续继续方式

- 日常更新直接提交并推送 `master`，Pages 会自动重新部署。
- 若自动部署异常，先查看 `.github/workflows/deploy-pages.yml` 对应运行记录，再确认 `github-pages` 环境仍允许 `master`。
- 需要复核线上入口时，以本文件中的公开网页为准，不再使用旧的“仅支持站点根路径”结论。
