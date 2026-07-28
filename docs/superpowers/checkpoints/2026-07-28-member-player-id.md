# 队员 ID 功能快照

日期：2026-07-28

## 已完成内容

- 每个成员新增 `playerId` 字段，默认空字符串。
- 成员编辑卡新增 `队员ID` 输入框，最多 16 个字符。
- 棋盘格显示“队员ID”；未填写时显示 `队员1`、`队员2` 等兜底名称。
- 编辑卡标题显示“位置 + 队员ID”，不再把职业名当成员名重复显示。
- 更换职业仍会清空技能，但会保留队员 ID 和宠物。
- 生成事件与导出图使用同一份成员 ID 数据。
- 导出 PNG 的站位盘和成员行使用队员 ID 文本。

## 关键文件

- `src/domain/team.ts`
- `src/ui/board.ts`
- `src/ui/member-editor.ts`
- `src/ui/app.ts`
- `src/export/render-image.ts`
- `src/styles.css`
- `tests/domain/team.test.ts`
- `e2e/team-builder.spec.ts`

## 验证记录

- `npm test`：64 项通过。
- `npm run build:pages`：通过，数据校验显示 380 个技能、5 个宠物、4 个职业、389 个资产。
- `$env:CI='1'; npm run test:e2e`：44 项通过。

## 恢复提示

如果任务中断，从这个快照恢复时，优先检查 `git status --short` 和本文件列出的关键文件。最终收尾还需要重新跑完整验证、提交、推送，并确认 GitHub Pages 线上页面更新。
