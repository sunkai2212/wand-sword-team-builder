# GitHub Pages 部署中断快照

> 已于 2026-06-21 完成部署；本文件仅保留为历史中断记录。当前状态以 `2026-06-21-github-pages-live.md` 为准。

## 恢复入口

- 项目目录：`C:\Users\sunka\OneDrive\桌面\遗物数据库`
- 当前分支：`master`
- 当前提交：`d925b2a`（`docs: plan GitHub Pages deployment`）
- 部署设计：`65c62bb`，文件为 `docs/superpowers/specs/2026-06-20-github-pages-deployment-design.md`
- 部署计划：`d925b2a`，文件为 `docs/superpowers/plans/2026-06-20-github-pages-deployment.md`
- 恢复时先运行：`git status --short; git log -4 --oneline`

## 已完成

- 功能分支已快进合并到本地 `master`。
- 临时工作树和 `feat/team-builder` 分支已安全清理。
- 主目录 Vitest 已排除 `.worktrees/**`，修复嵌套工作树被重复收集的问题；提交为 `5aaa983`。
- 合并后的主分支验证通过：380 个技能、5 个宠物、385 个素材；54/54 单元测试；38/38 浏览器测试；TypeScript 与生产构建通过。
- GitHub CLI 已登录账号 `sunkai2212`。
- 已确认以下仓库目前均不存在：
  - `sunkai2212/sunkai2212.github.io`
  - `sunkai2212/wand-sword-team-builder`
- 用户已确认采用独立 GitHub Pages 项目站点，不占用个人根站点。
- 部署设计和详细 TDD 实施计划均已写入仓库并提交。

## 尚未开始

- 尚未修改资源路径或 Vite base。
- 尚未添加 GitHub Actions Pages 工作流。
- 尚未安装 `cross-env`。
- 尚未创建公开 GitHub 仓库。
- 尚未添加 `origin`、推送代码、启用 Pages 或产生公网网址。
- 因此当前没有任何需要回滚的远程操作。

## 已批准的部署目标

- 公开仓库：`https://github.com/sunkai2212/wand-sword-team-builder`
- 计划网址：`https://sunkai2212.github.io/wand-sword-team-builder/`
- 生产基础路径：`/wand-sword-team-builder/`
- 本地开发与测试基础路径：`/`
- 使用 GitHub Actions 官方 Pages actions 自动验证、构建和部署 `dist/`。

## 明天继续顺序

1. 用户选择计划执行方式；今天建议的是“当前会话直接执行并逐步保存”。
2. 按计划 Task 1 先写失败测试，再实现 `resolveAssetUrl`。
3. 按计划 Task 2 将目录、职业形象和 Canvas 图片加载统一接入基础路径。
4. 按计划 Task 3 添加 Pages build、工作流和 README，并跑全量验证。
5. 只有本地验证全部通过后，才创建公开仓库、推送并启用 Pages。
6. 等待工作流成功，实际打开公网网址验证页面与图标。
7. 生成 `2026-06-20-github-pages-live.md` 最终部署快照。

## 恢复口令

下次可直接说：`从 GitHub Pages 部署中断快照继续，选择当前会话直接执行。`
