# 任务 7 快照：完成度提示与生成门槛

## 恢复入口

- 分支：`feat/team-builder`
- 功能代码提交：`bc3dadc`（`fix: clarify optional configuration status`）
- 上一步功能提交：`b2eac21`（`feat: add completion guidance`）
- 下一步：任务 8，监听 `team-builder:generate` 并使用 Canvas 生成 PNG。

## 已确认业务规则

- 不要求四人满编，也不要求技能或宠物配置完整。
- 选择转数后，0 名角色时“生成图片”禁用，并提示“请先添加至少 1 名角色”。
- 只要有 1–4 名角色即可生成；缺技能或宠物只提示，不阻止生成。
- 空技能和空宠物槽保留 `.is-missing` 视觉提示，但不使用 `aria-invalid`，因为它们是允许缺省的配置。
- 完整配置时显示“阵容配置已完成”。
- 点击启用的生成按钮只派发一次 `team-builder:generate`，事件 `detail` 是当前 `Team` 的深拷贝，可包含少人和空槽。
- 删除至 0 人后按钮重新禁用；换职业或降转导致技能清空时，只更新提示，不禁用生成。

## 主要实现

- `src/ui/completion.ts`：把领域层的缺项信息转换为自然中文，并计算生成按钮状态。
- `src/ui/app.ts`：维护稳定的完成度 live region 和生成按钮；只有提示文本变化时才更新 live region。
- `src/ui/member-editor.ts`：为空技能和宠物槽添加可选缺省的视觉状态。
- `src/styles.css`：完成度区域、缺省槽位和生成按钮样式。
- `e2e/team-builder.spec.ts`：覆盖 0 人、少人、缺技能/宠物、完整配置、删除/换职/降转、事件深拷贝及 live region mutation。

## 审查结论

- 规格审查：通过。
- 代码质量审查：通过，无 Critical、Important 或 Minor 遗留问题。
- 修复过的质量问题：可选槽位误用 `aria-invalid`；无关重绘重复播报相同完成度提示。

## 验证证据

- 单元测试：48/48 通过。
- E2E：25/25 断言通过。
- 数据校验：380 个技能、5 个宠物、385 个素材通过。
- TypeScript 与 Vite 生产构建：通过。
- `git diff --check`：通过。

## 已知环境问题

- Playwright/Vite 在全部 E2E 断言完成后偶尔不自动退出，需要由外层超时回收；没有断言失败，当前判断为 Windows 测试进程回收问题，不是产品代码故障。

## 任务 8 注意事项

- PNG 渲染必须容忍 1–4 名角色、空技能槽和空宠物槽。
- 输出图不得假设 32 个技能和 4 个宠物全部存在。
- 空槽应以清晰、克制的占位形式呈现，不能导致 Canvas 绘制异常。
- 继续使用现有本地技能、宠物与职业素材，不上传任何用户数据。
