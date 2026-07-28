# 六转技能图标居中与清晰度优化快照

日期：2026-07-28

## 已完成内容

- 优化范围：六转技能图标，共 48 个。
- 处理方式：保留原圆心，扩大六转源图裁切范围，避免旧版从 55–84px 小区域直接放大导致贴边和发糊。
- 主动技能裁切范围约扩大 32%，秘法裁切范围约扩大 38%。
- 六转技能输出开启 `sharpen: true` 与 `quality: 95`。
- 重新生成 `public/assets/skills/*-s6-*.webp`。
- 新增回归测试，要求六转技能不再使用过小裁切，并必须启用锐化和 95 质量。

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

## 复核备注

六转图标现在统一带有更完整的原图圆形底盘，视觉圆心与审查页参考线对齐。因为六转原始截图本身清晰度不如七转，清晰度无法达到七转源图级别，但通过使用更多源像素和锐化，已经比旧版小裁切放大更稳。
