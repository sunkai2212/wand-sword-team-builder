# 《杖剑传说》4v4 阵容图生成器

一个无需登录、无需后端的轻量网页工具。玩家可选择全队共用转数，在 5×4 站位盘放入 1–4 名角色，按需配置技能图标和宠物，并在浏览器本地生成 PNG 阵容图。

至少放入 1 名角色即可生成图片。技能和宠物都允许留空；页面只提示未配置项，不会阻止出图。技能只展示图标，不包含名称、效果或数值说明。

## 本地运行

需要 Node.js 20.19 或更高版本；使用 Node.js 22 时需为 22.12 或更高版本。

```powershell
npm install
npm run dev
```

开发服务器启动后，打开终端显示的本地地址。

## 校验与构建

```powershell
npm run data:check
npm test
npm run test:e2e
npm run assets:build
npm run build
npm run build:pages
```

- `data:check` 校验 380 个技能、5 个宠物及全部素材引用。
- `test` 运行单元测试。
- `test:e2e` 在 Chromium 中运行完整交互测试。
- `assets:build` 从仓库内源图重新裁切并生成 WebP 图标。
- `build` 执行数据校验、TypeScript 检查并生成生产文件。
- `build:pages` 生成适用于 GitHub Pages 项目子路径的生产文件。

## 静态部署

公开网址：`https://sunkai2212.github.io/wand-sword-team-builder/`。

推送到 `master` 后，GitHub Actions 会自动执行校验、测试、`npm run build:pages` 并发布 `dist/`。手动检查 Pages 产物时也应使用 `npm run build:pages`；普通站点根路径部署仍可使用 `npm run build`。网页运行时不需要服务器接口、数据库或额外环境变量，队伍配置和图片生成均在用户浏览器中完成。

## 更新技能或宠物素材

1. 将稳定命名的源图放入 `data/source/skills/`、`data/source/seventh/` 或 `data/source/pets/`。
2. 在 `data/source-assets.json` 增加或修改对应条目，填写源图路径、输出路径、裁切区域和尺寸。
3. 同步更新 `src/data/skills.json` 或 `src/data/pets.json` 中的目录记录。技能记录只保留职业、转数、类型和图标引用，不添加未经核验的名称或说明。
4. 运行 `npm run assets:build` 重新生成图标。
5. 运行 `npm run data:check` 和 `npm test` 确认数量、引用与规则一致。

仓库已包含重新生成当前图标所需的源图，不依赖本机下载目录。

## 素材声明

非官方玩家工具。游戏名称、图标与角色素材的权利归其原权利人所有。
