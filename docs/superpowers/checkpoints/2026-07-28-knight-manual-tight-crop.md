# 骑士手动技能图标紧裁剪与位置修正快照

时间：2026-07-28

## 本次目标

用户反馈骑士手动更新后的技能图标整体不够居中，视觉偏右下，且技能圆在最终圆框内偏小，有多余黑边。第一次紧裁剪后，用户进一步指出左上角仍有小边，需要通过整体位移修正。

## 结论

- 骑士 1–6 转与斗士 1 转共用技能图标的源图保持不变。
- 正式裁剪从整张 `260×260` 改为统一紧裁剪，并将画面整体往左上移动：
  - `left: 32`
  - `top: 32`
  - `width: 208`
  - `height: 208`
- 七转技能不参与本次调整。
- 缓存版本更新为 `2026-07-28-knight-manual-position-shift`。

## 复现与对比

本次生成了候选裁剪预览，用于确认 208 裁剪比旧 260 裁剪更贴边：

- `docs/superpowers/checkpoints/assets/knight-s1-s6-tight-crop-candidates.png`
- `docs/superpowers/checkpoints/assets/knight-s6-tight-crop-candidates.png`
- `docs/superpowers/checkpoints/assets/knight-s1-s6-proposed-tight208-preview.png`
- `docs/superpowers/checkpoints/assets/knight-position-shift-candidates.png`

稳定快照已覆盖：

- `docs/superpowers/checkpoints/assets/knight-fighter-s1-manual-preview.png`
- `docs/superpowers/checkpoints/assets/knight-s2-manual-preview.png`
- `docs/superpowers/checkpoints/assets/knight-s3-manual-preview.png`
- `docs/superpowers/checkpoints/assets/knight-s4-manual-preview.png`
- `docs/superpowers/checkpoints/assets/knight-s5-manual-preview.png`
- `docs/superpowers/checkpoints/assets/knight-s6-manual-preview.png`

## 测试保护

已增加/更新测试约束：

- 骑士 1–6 转手动图标必须使用 `32,32,208×208` 裁剪。
- 斗士 1 转必须与骑士 1 转共用源图和裁剪。
- 七转不使用手动骑士源图。
- 技能图标 URL 必须带新缓存版本。

## 已验证

- `npm run data:check`
- `npm test`
- `npm run build:pages`

三项均通过。
