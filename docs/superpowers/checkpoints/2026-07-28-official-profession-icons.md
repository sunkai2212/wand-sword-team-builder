# 官方职业图标替换快照

## 当前状态

本次已完成本地实现与验证，尚未提交、尚未部署。

## 已完成内容

- 将用户提供的 4 张官方职业图标纳入稳定源目录：
  - `data/source/professions/knight.jpg`
  - `data/source/professions/fighter.jpg`
  - `data/source/professions/warlock.jpg`
  - `data/source/professions/sage.jpg`
- 使用素材构建脚本生成 512×512、带透明圆形边缘的高质量 webp：
  - `public/assets/professions/knight.webp`
  - `public/assets/professions/fighter.webp`
  - `public/assets/professions/warlock.webp`
  - `public/assets/professions/sage.webp`
- 生成方式：
  - 居中方形裁切。
  - 输出尺寸 512×512。
  - webp 质量 95。
  - 轻微锐化。
  - 圆形透明遮罩。
- 页面与导出图均改为使用官方职业 webp：
  - 站位盘。
  - 角色编辑卡。
  - PNG 导出里的站位盘与角色行。
- 移除旧的占位 SVG 职业图标。
- `职业图标/` 已加入 `.gitignore`，作为本地临时投喂目录，不进入仓库。

## 验证结果

- `npm run assets:build`
  - 成功生成 389 个素材。
- `npm run data:check`
  - 通过：380 个技能、5 个宠物、4 个职业、389 个素材。
- `npm test`
  - 10 个测试文件通过。
  - 62 个测试通过。
- `npm run build:pages`
  - TypeScript 与 Vite Pages 构建通过。
- `$env:CI='1'; npm run test:e2e`
  - 42 个浏览器测试通过。

## 预览图

- 官方职业图标单独预览：
  - `dist/profession-official-webp-review.png`
- 页面预览：
  - `C:\Users\sunka\team-builder-preview\official-professions-preview.png`

## 下一步

1. 提交本次改动。
2. 推送 `master`，触发 GitHub Pages 自动部署。
3. 线上抽查页面是否加载新构建与官方职业图标。
