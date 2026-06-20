# GitHub Pages 项目站点部署设计

## 目标

将当前静态网页发布为独立公开项目：

- GitHub 仓库：`sunkai2212/wand-sword-team-builder`
- 公开网址：`https://sunkai2212.github.io/wand-sword-team-builder/`
- 不占用 `sunkai2212.github.io` 个人根站点。
- 保持本地开发、测试和 PNG 导出行为不变。

## 已选方案

采用 GitHub Pages 项目站点，并让生产构建统一使用 `/wand-sword-team-builder/` 基础路径。

未选方案：

- 个人根站点：改动最少，但会占用用户唯一的 GitHub Pages 根域名。
- Vercel 或 Netlify：可直接使用根路径，但当前电脑没有对应 CLI 登录状态，需要增加登录步骤。

## 资源路径

保留技能和宠物 JSON 中现有的 `/assets/...` 目录记录，不批量改写 385 条数据。新增一个小型资源路径函数，将目录记录转换为当前 Vite `BASE_URL` 下的实际 URL。

该函数同时用于：

- 技能图标与宠物图标目录。
- 站位盘和成员卡中的四职业形象。
- Canvas 导出加载的职业、技能和宠物图片。

本地开发的基础路径仍为 `/`；GitHub Pages 生产构建为 `/wand-sword-team-builder/`。路径转换必须避免重复斜杠，并对已经带基础路径的 URL 保持稳定。

## 自动部署

创建 GitHub Actions Pages 工作流：

1. `master` 推送时安装锁定依赖。
2. 运行数据校验、单元测试和生产构建。
3. 上传 `dist/` Pages artifact。
4. 使用官方 Pages action 发布。

工作流只申请 Pages 发布所需的最小权限。仓库设为公开，并将 Pages 构建来源设置为 GitHub Actions。

## 验证

- 先写路径函数测试，确认根路径与项目子路径结果。
- 本地运行 54 个单元测试、38 个浏览器测试、数据校验和生产构建。
- 检查 `dist/index.html` 的 JS/CSS URL 带项目基础路径。
- 用生产预览确认技能、宠物、职业图标与 PNG 导出仍可加载。
- 推送后等待 GitHub Actions 成功，再访问公开网址验证页面、转数选择、角色图标与免责声明。

## 失败处理

- 构建或测试失败时不发布新版本。
- Pages 工作流失败时保留本地与 Git 提交，不删除仓库，不反复创建仓库。
- 公网页面出现资源 404 时，先检查实际 URL 与 `BASE_URL` 转换，不改动技能目录数据或原始素材。

## 非目标

- 不添加自定义域名。
- 不占用个人根站点。
- 不引入后端、账号、统计或第三方运行时服务。
