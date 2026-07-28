# 《杖剑传说》阵容图生成器

## 项目定位

- Vite + TypeScript 的纯静态网页：在浏览器本地编辑 4v4 阵容并导出 PNG。
- 线上站点：`https://sunkai2212.github.io/wand-sword-team-builder/`。
- 不引入登录、后端、数据库或技能文字说明；技能只展示图标。

## 常用命令

```powershell
npm test -- --run
npm run data:check
npm run assets:build
npm run build:pages
```

- 修改图标源图或 `data/source-assets.json` 后，依次运行素材重建、数据校验、测试与 Pages 构建。
- 推送 `master` 会触发 `.github/workflows/deploy-pages.yml`；发布完成后应验证实际 Pages 页面或资源 URL。

## 素材与数据约定

- `data/source-assets.json` 是素材裁切与输出的权威清单；`src/data/skills.json`、`src/data/pets.json` 是可选目录。
- 1–6 转稳定源图在 `data/source/manual/detail/`；7 转源图在 `data/source/seventh/`。仓库内这些源图必须能独立重建 `public/assets/`。
- 本机 `技能图标/` 是用户提供的原始详情截图，只供离线整理和比对，未入库且 CI 不依赖它。不得为了清理工作区删除它。
- 选择器必须按职业、转数和类型过滤；战技与秘法不可混用，且同一角色不能重复选择同一技能。
- 六转骑士当前约定：战技槽 1 为耀光灵刃，战技槽 4 为蓝色水系图标。修改相关图标前先核对这两个稳定源图和回归测试。

## 工作区边界

- 不要使用 `git add .`：根目录有用户保留的 `技能图标/` 以及 `docs/superpowers/checkpoints/assets/` 诊断素材。
- 历史计划与快照位于 `docs/superpowers/`，不作为当前实现的权威说明；现役交接见 `docs/CURRENT_STATE.md`。
