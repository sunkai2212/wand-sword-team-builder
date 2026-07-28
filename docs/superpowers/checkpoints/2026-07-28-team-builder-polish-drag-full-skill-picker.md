# 阵容工具美化、拖动与技能全量选择快照

## 当前状态

本次优化已完成本地实现与验证，尚未提交、尚未部署。

## 已完成内容

- 前端视觉优化：
  - 页面背景改为更柔和的游戏工具质感。
  - 顶部转数条、5×4 站位盘、角色编辑卡片、技能/宠物槽、弹窗做了统一圆角、浅色层次和触控反馈。
  - 保留 360px/390px 手机宽度可用性与 reduced-motion 兼容。
- 角色移动：
  - 保留原有“点选角色 → 点空位移动”。
  - 新增拖拽移动：有角色的站位可拖到空位。
  - 拖到已有角色站位不会交换、覆盖或移动。
  - 同时支持桌面标准拖放事件和移动端指针事件。
- 技能选择器：
  - 取消原来的转数分页。
  - 打开战技/秘法槽时，直接展示该角色职业、该技能类型、1 到当前转数的全部技能图标。
  - 按转数分组展示，仍然不显示技能说明。
  - 同一角色重复技能仍禁用。

## 主要变更文件

- `src/ui/board.ts`：新增拖拽与放置交互。
- `src/ui/app.ts`：新增拖拽落点后的移动规则。
- `src/ui/pickers.ts`：技能选择器改为全量分组展示。
- `src/styles.css`：整体视觉美化与拖拽/选择器样式。
- `e2e/team-builder.spec.ts`：新增并更新端到端测试。
- `docs/superpowers/specs/2026-07-28-team-builder-polish-drag-full-skill-picker-design.md`：本次设计记录。
- `docs/superpowers/plans/2026-07-28-team-builder-polish-drag-full-skill-picker.md`：本次执行计划。

## 验证结果

- `npm test`
  - 9 个测试文件通过。
  - 61 个测试通过。
- `npm run build:pages`
  - 数据校验通过：380 个技能、5 个宠物、385 个素材。
  - TypeScript 编译通过。
  - Vite Pages 构建通过。
- `$env:CI='1'; npm run test:e2e`
  - 42 个浏览器测试通过。

## 截图检查

本地生成了两张人工检查截图：

- `C:\Users\sunka\team-builder-preview\main-preview.png`
- `C:\Users\sunka\team-builder-preview\skill-picker-preview.png`

截图观察结论：手机宽度下主页面、站位盘、角色卡片和技能选择器没有明显拥挤或横向溢出；选择器能直接看到多转技能分组。

## 下一步建议

1. 如果用户认可当前视觉方向，提交本次改动。
2. 如需上线，提交后运行 GitHub Pages 部署流程。
3. 如果想继续打磨，可优先微调技能选择器弹窗高度和站位盘角色图标大小。
