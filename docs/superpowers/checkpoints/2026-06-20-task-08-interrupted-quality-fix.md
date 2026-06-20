# 任务 8 中断快照：PNG 导出质量修复

## 恢复入口

- 分支：`feat/team-builder`
- 当前已提交 HEAD：`886ff64`（`fix: add export accent color`）
- PNG 主功能提交：`d8e336d`（`feat: export configured team as png`）
- 当前阶段：任务 8 规格审查已通过，代码质量审查提出的测试与本地日期修复尚未完成。
- 恢复时第一步：保留当前未提交的 TDD 测试，继续实现对应生产代码和 PNG 像素验证，不要丢弃工作树改动。

## 已提交并确认的任务 8 功能

- Canvas 固定宽度 1080px，按 1–4 名角色动态计算高度。
- 输出图包含深色标题区、当前转数、20 格 5×4 站位盘和按站位排序的成员配置行。
- 成员行包含职业、宠物、4 个战技和 4 个秘法；空技能和空宠物均可绘制占位。
- 支持 1–4 名角色，技能和宠物无需填满。
- 单张素材加载失败时绘制局部占位，不中断整张图。
- 生成按钮具有生成中、成功、失败恢复和快速重复触发保护。
- PNG 下载使用浏览器 Blob/ObjectURL，并在完成后释放 URL。
- 导出图使用暖灰、米白、深棕和低饱和琥珀 `#9a7441`。

## 已通过审查

- 任务 8 规格审查：通过。
- 主功能单元测试：52/52 通过。
- 数据校验、TypeScript 和 Vite 生产构建：通过。
- `git diff --check`：通过。
- E2E 运行器存在既有的结束后挂起问题；单个导出用例曾显示 `ok` 后不退出。

## 质量审查尚需完成的事项

1. 增加真实 PNG 内容回归，而不只检查宽高：
   - 一人全空图的标题和站位区必须不是纯背景。
   - 该成员配置行必须不是纯背景，并能体现空技能/空宠物占位。
   - 四人或部分配置图的最后一行必须存在且未被裁切。
   - 至少一个素材请求失败时仍能下载有效 PNG，并绘制失败占位。
   - 推荐使用 E2E 下载后由 Sharp 裁取关键区域，检查稳定的像素统计；不要使用整图哈希。
2. 下载文件日期改用用户本地年月日，而不是 UTC `toISOString()`，避免中国时区凌晨显示前一天。

## 当前未提交的 TDD 改动

- 已修改：`tests/export/render-image.test.ts`
  - 独立断言 1/2/3/4 人高度分别为 1210/1416/1622/1828。
  - 独立断言每种人数的最后成员行底部距画布底部 50px。
- 已新增：`tests/export/download-image.test.ts`
  - 期望从 `src/export/download-image.ts` 导出 `formatLocalDate(date)`。
  - 期望使用本地日期字段生成 `2026-01-02`。
- 生产代码尚未实现 `formatLocalDate`；当前测试是有意保留的 TDD 红灯入口。
- PNG 关键区域像素 E2E 尚未编写。

## 当前工作树状态

```text
 M tests/export/render-image.test.ts
?? tests/export/download-image.test.ts
?? docs/superpowers/checkpoints/2026-06-20-task-07-completion-guidance.md
?? docs/superpowers/checkpoints/2026-06-20-task-08-interrupted-quality-fix.md
```

## 恢复后的执行顺序

1. 运行导出单元测试，确认 `formatLocalDate` 测试先失败。
2. 实现本地日期格式化并让相关单测通过。
3. 编写并验证 PNG 关键区域像素 E2E，包括素材失败占位。
4. 运行全量单测、定向 E2E、数据校验、构建和 diff check。
5. 提交任务 8 质量修复。
6. 重新进行任务 8 代码质量复审。
7. 审查通过后生成“任务 8 完成快照”，再进入任务 9。
