# 六转技能图标居中与清晰度优化快照

日期：2026-07-28

## 已完成内容

- 优化范围：六转技能图标，共 48 个。
- 当前处理方式：保留原圆心，恢复贴近原始圆环的裁切范围，并用满框圆形遮罩放大视觉占比。
- 六转技能输出开启 `sharpen: true` 与 `quality: 95`。
- 重新生成 `public/assets/skills/*-s6-*.webp`。
- 新增回归测试，要求六转技能使用满框圆形裁切，并必须启用锐化和 95 质量。
- 追加缓存修复：技能图标 URL 增加版本参数，避免浏览器继续显示同名旧图，尤其是六转战技。
- 本版设置 `maskRadiusRatio: 0.5`，让圆形遮罩贴到 128×128 外框。
- 技能槽和技能选择器的 padding 从约 4–5px 降到约 1px，使图标在页面里至少占按钮宽度 90%。

## 关键文件

- `data/source-assets.json`
- `public/assets/skills/*-s6-*.webp`
- `tests/data/asset-scripts.test.ts`

## 验证记录

- `npm run data:check`：380 个技能、5 个宠物、4 个职业、389 个资产通过。
- `npm test`：10 个测试文件、65 项通过。
- `npm run build:pages`：通过。
- `$env:CI='1'; npm run test:e2e`：45 项通过。
- `npm run assets:audit-centering`：生成 `dist/skill-icon-centering-audit.html`，包含 380 个技能图标审查页。
- 缓存修复后重新验证：`npm test` 66 项通过，`npm run build:pages` 通过，`$env:CI='1'; npm run test:e2e` 45 项通过。
- 满框重做后重新验证：`npm run data:check` 通过，`npm test` 66 项通过，`npm run build:pages` 通过，`$env:CI='1'; npm run test:e2e` 46 项通过。

## 复核备注

六转图标现在采用满框圆形，圆形底盘比上一版更接近技能槽边框。因为六转原始截图本身清晰度不如七转，清晰度无法达到七转源图级别，但通过锐化、满框遮罩和更小页面 padding，实际选择器里的视觉尺寸更接近游戏截图。
