# 《杖剑传说》4v4 阵容图生成器 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 交付一个公开、轻量、手机优先的静态网页，用户可在 5×4 站位中编排 1–4 名角色、按需配置技能与宠物，并导出 PNG 长图。

**Current rule override (2026-06-20):** 后续用户决策已取代早期的完整配置门槛。现在至少 1 名角色即可生成；技能和宠物允许留空并仅作提示；技能只展示图标，不展示名称、效果或数值。下文早期 TDD 示例若与本段冲突，以本段和最终测试为准。

**Architecture:** 使用 Vite + TypeScript 的无框架单页应用。技能、宠物和职业素材以本地结构化数据和静态图片存放；纯函数管理队伍状态与规则，DOM 组件负责交互，Canvas 负责生成分享图。页面运行时不需要后端。

**Tech Stack:** Vite, TypeScript, Vitest, Playwright, Canvas 2D API, Sharp（仅用于开发期素材裁切）, HTML, CSS

---

## 文件结构

```text
index.html                         # 应用入口 HTML
package.json                       # 依赖与命令
tsconfig.json                      # TypeScript 配置
vite.config.ts                     # Vite/Vitest 配置
playwright.config.ts               # 端到端测试配置
scripts/curate-assets.mjs           # 从原始截图裁切图标
scripts/validate-data.mjs           # 校验技能、宠物和图标引用
data/source-assets.json             # 原始截图到裁切资源的映射
data/source/skills/                 # 已核验的一至六转原始图鉴
public/assets/professions/          # 四个固定职业形象
public/assets/skills/               # 裁切后的技能图标
public/assets/pets/                 # 裁切后的宠物图标
src/main.ts                         # 启动应用
src/styles.css                      # 响应式布局与视觉样式
src/domain/types.ts                 # 职业、技能、宠物、队伍类型
src/domain/team.ts                  # 队伍状态变更规则
src/domain/validation.ts            # 完整性与选择校验
src/data/skills.json                # 一至七转技能清单
src/data/pets.json                  # 五只宠物清单
src/data/catalog.ts                 # JSON 数据的类型化读取和过滤
src/ui/app.ts                       # 整体界面组装与重绘
src/ui/stage-selector.ts            # 全队当前转数选择
src/ui/board.ts                     # 5×4 站位盘
src/ui/member-editor.ts             # 单个角色配置区
src/ui/pickers.ts                   # 职业、技能和宠物选择层
src/export/render-image.ts          # Canvas 长图绘制
src/export/download-image.ts        # PNG 下载
tests/domain/team.test.ts           # 队伍状态单元测试
tests/domain/validation.test.ts     # 转数、技能与完整性测试
tests/data/catalog.test.ts          # 数据完整性测试
tests/export/render-image.test.ts   # 出图尺寸与内容测试
e2e/team-builder.spec.ts            # 手机和桌面核心流程
README.md                           # 本地运行、素材更新和部署说明
```

### Task 1: 搭建最小可测试工程

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `playwright.config.ts`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/styles.css`
- Create: `tests/smoke.test.ts`

- [ ] **Step 1: 初始化 npm 项目并安装依赖**

Run:

```powershell
npm init -y
npm install -D vite typescript vitest jsdom @playwright/test sharp
```

Expected: `package.json` 和 `package-lock.json` 存在，命令退出码为 0。

- [ ] **Step 2: 配置开发、构建和测试命令**

`package.json` 的脚本必须是：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "assets:build": "node scripts/curate-assets.mjs",
    "data:check": "node scripts/validate-data.mjs"
  }
}
```

- [ ] **Step 3: 先写启动失败测试**

```ts
// tests/smoke.test.ts
import { describe, expect, it } from "vitest";
import { APP_TITLE } from "../src/main";

describe("application shell", () => {
  it("exposes the product title", () => {
    expect(APP_TITLE).toBe("杖剑传说·4v4阵容图");
  });
});
```

- [ ] **Step 4: 运行测试并确认失败**

Run: `npm test -- tests/smoke.test.ts`

Expected: FAIL，原因是 `src/main.ts` 不存在或未导出 `APP_TITLE`。

- [ ] **Step 5: 创建最小页面入口**

```ts
// src/main.ts
import "./styles.css";

export const APP_TITLE = "杖剑传说·4v4阵容图";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("Missing #app root");
root.innerHTML = `<main class="app-shell"><h1>${APP_TITLE}</h1></main>`;
```

```html
<!-- index.html -->
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>杖剑传说·4v4阵容图</title>
  </head>
  <body><div id="app"></div><script type="module" src="/src/main.ts"></script></body>
</html>
```

- [ ] **Step 6: 运行单元测试和构建**

Run: `npm test -- tests/smoke.test.ts; npm run build`

Expected: 1 test PASS，Vite build 成功产生 `dist/`。

- [ ] **Step 7: 提交工程骨架**

```powershell
git add package.json package-lock.json tsconfig.json vite.config.ts playwright.config.ts index.html src tests
git commit -m "chore: scaffold static team builder"
```

### Task 2: 整理技能、宠物与职业素材

**Files:**
- Create: `data/source-assets.json`
- Create: `scripts/curate-assets.mjs`
- Create: `scripts/validate-data.mjs`
- Create: `src/data/skills.json`
- Create: `src/data/pets.json`
- Create: `src/data/catalog.ts`
- Create: `src/domain/types.ts`
- Create: `public/assets/professions/*`
- Create: `public/assets/skills/*`
- Create: `public/assets/pets/*`
- Test: `tests/data/catalog.test.ts`

- [ ] **Step 1: 定义稳定的数据类型**

```ts
// src/domain/types.ts
export type Profession = "knight" | "fighter" | "warlock" | "sage";
export type SkillKind = "active" | "passive";
export type Stage = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Skill {
  id: string;
  name: string;
  profession: Profession;
  kind: SkillKind;
  stage: Stage;
  icon: string;
}

export interface Pet {
  id: "qianming" | "dark-emperor" | "rainbow" | "bamboo" | "dawn-angel";
  name: string;
  icon: string;
}
```

- [ ] **Step 2: 建立截图裁切清单**

`data/source-assets.json` 每项使用统一坐标格式：

```json
[
  {
    "source": "七转技能/骑士/_cgi-bin_mmwebwx-bin_webwxgetmsgimg__&MsgID=2632845302908178489&skey=@crypt_d4779332_670741b547bcba64aa66adf9534c73fb&mmweb_appid=wx_webfilehelper.jpg",
    "output": "public/assets/skills/knight-7-01.webp",
    "crop": { "left": 530, "top": 630, "width": 220, "height": 220 },
    "size": 128
  },
  {
    "source": "宠物/_cgi-bin_mmwebwx-bin_webwxgetmsgimg__&MsgID=8706170955870767997&skey=@crypt_d4779332_670741b547bcba64aa66adf9534c73fb&mmweb_appid=wx_webfilehelper.jpg",
    "output": "public/assets/pets/qianming.webp",
    "crop": { "left": 250, "top": 520, "width": 450, "height": 450 },
    "size": 192
  }
]
```

实际清单要求：四职业七转的 48 个技能详情图全部建立条目，四张职业总览不当作技能；五张宠物截图各建立一个条目。一至六转先从已核验图鉴下载到 `data/source/skills/`，再使用同一格式记录裁切坐标。

- [ ] **Step 3: 编写确定性裁切脚本**

```js
// scripts/curate-assets.mjs
import { mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import sharp from "sharp";

const entries = JSON.parse(await readFile("data/source-assets.json", "utf8"));
for (const entry of entries) {
  await mkdir(dirname(entry.output), { recursive: true });
  await sharp(entry.source)
    .extract(entry.crop)
    .resize(entry.size, entry.size, { fit: "cover" })
    .webp({ quality: 90 })
    .toFile(entry.output);
}
console.log(`Built ${entries.length} assets`);
```

- [ ] **Step 4: 建立完整技能与宠物清单**

`src/data/skills.json` 为每个可选技能保存一条记录；只记录职业、转数、类型和图标引用，不记录未经核验的名称、等级、品质或数值。七转每个职业应有 12 条技能记录。宠物清单必须精确为：

```json
[
  { "id": "qianming", "name": "千明灵狗", "icon": "/assets/pets/qianming.webp" },
  { "id": "dark-emperor", "name": "暗夜帝王", "icon": "/assets/pets/dark-emperor.webp" },
  { "id": "rainbow", "name": "虹彩星灵", "icon": "/assets/pets/rainbow.webp" },
  { "id": "bamboo", "name": "竹林仙君", "icon": "/assets/pets/bamboo.webp" },
  { "id": "dawn-angel", "name": "晨曦天使", "icon": "/assets/pets/dawn-angel.webp" }
]
```

- [ ] **Step 5: 先写数据完整性测试**

```ts
// tests/data/catalog.test.ts
import { describe, expect, it } from "vitest";
import { pets, skills } from "../../src/data/catalog";

describe("catalog", () => {
  it("contains five unique pets", () => {
    expect(pets).toHaveLength(5);
    expect(new Set(pets.map((pet) => pet.id)).size).toBe(5);
  });

  it("contains twelve seventh-stage skills per profession", () => {
    for (const profession of ["knight", "fighter", "warlock", "sage"] as const) {
      expect(skills.filter((skill) => skill.profession === profession && skill.stage === 7)).toHaveLength(12);
    }
  });

  it("contains no duplicate skill ids", () => {
    expect(new Set(skills.map((skill) => skill.id)).size).toBe(skills.length);
  });
});
```

- [ ] **Step 6: 类型化读取目录数据**

```ts
// src/data/catalog.ts
import skillsJson from "./skills.json";
import petsJson from "./pets.json";
import type { Pet, Profession, Skill, SkillKind, Stage } from "../domain/types";

export const skills = skillsJson as Skill[];
export const pets = petsJson as Pet[];

export function visibleSkills(profession: Profession, kind: SkillKind, stage: Stage): Skill[] {
  return skills.filter((skill) =>
    skill.profession === profession && skill.kind === kind && skill.stage <= stage
  );
}
```

- [ ] **Step 7: 生成素材并校验**

Run: `npm run assets:build; npm test -- tests/data/catalog.test.ts; npm run data:check`

Expected: 裁切数与 `source-assets.json` 条目数一致；3 个目录测试 PASS；校验脚本报告 0 个缺失图标。

- [ ] **Step 8: 人工快速复核图标**

打开生成后的素材网格，逐职业、逐转数核对技能名称和图标；验收条件是无错职业、无错类型、无明显裁切偏移。

- [ ] **Step 9: 提交数据与素材**

```powershell
git add data scripts src/data src/domain/types.ts public/assets tests/data
git commit -m "feat: add verified skill and pet catalog"
```

### Task 3: 用纯函数实现队伍状态

**Files:**
- Create: `src/domain/team.ts`
- Test: `tests/domain/team.test.ts`

- [ ] **Step 1: 写站位、重复职业和职业替换的失败测试**

```ts
// tests/domain/team.test.ts
import { describe, expect, it } from "vitest";
import { addMember, changeProfession, createTeam, moveMember } from "../../src/domain/team";

describe("team state", () => {
  it("allows duplicate professions but never more than four members", () => {
    let team = createTeam(6);
    for (const cell of [0, 1, 2, 3]) team = addMember(team, cell, "knight");
    expect(team.members).toHaveLength(4);
    expect(() => addMember(team, 4, "sage")).toThrow("Team already has four members");
  });

  it("moves a member to an empty cell", () => {
    const team = moveMember(addMember(createTeam(6), 0, "fighter"), 0, 19);
    expect(team.members[0].cell).toBe(19);
  });

  it("clears skills and keeps pet when profession changes", () => {
    const original = addMember(createTeam(6), 0, "fighter");
    original.members[0].active = ["fighter-a", null, null, null];
    original.members[0].petId = "rainbow";
    const changed = changeProfession(original, original.members[0].id, "sage");
    expect(changed.members[0].active).toEqual([null, null, null, null]);
    expect(changed.members[0].petId).toBe("rainbow");
  });
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm test -- tests/domain/team.test.ts`

Expected: FAIL，原因是 `src/domain/team.ts` 不存在。

- [ ] **Step 3: 实现最小不可变状态 API**

```ts
// src/domain/team.ts
import type { Pet, Profession, SkillKind, Stage } from "./types";

export type Slots = [string | null, string | null, string | null, string | null];
export interface Member {
  id: string;
  cell: number;
  profession: Profession;
  active: Slots;
  passive: Slots;
  petId: Pet["id"] | null;
}
export interface Team { stage: Stage; members: Member[]; }
const emptySlots = (): Slots => [null, null, null, null];
const copy = (team: Team): Team => structuredClone(team);

export const createTeam = (stage: Stage): Team => ({ stage, members: [] });

export function addMember(team: Team, cell: number, profession: Profession): Team {
  if (team.members.length === 4) throw new Error("Team already has four members");
  if (cell < 0 || cell > 19 || team.members.some((member) => member.cell === cell)) throw new Error("Cell unavailable");
  const next = copy(team);
  next.members.push({ id: crypto.randomUUID(), cell, profession, active: emptySlots(), passive: emptySlots(), petId: null });
  return next;
}

export function moveMember(team: Team, from: number, to: number): Team {
  if (team.members.some((member) => member.cell === to)) throw new Error("Cell unavailable");
  const next = copy(team);
  const member = next.members.find((candidate) => candidate.cell === from);
  if (!member) throw new Error("Member not found");
  member.cell = to;
  return next;
}

export function changeProfession(team: Team, id: string, profession: Profession): Team {
  const next = copy(team);
  const member = next.members.find((candidate) => candidate.id === id);
  if (!member) throw new Error("Member not found");
  member.profession = profession;
  member.active = emptySlots();
  member.passive = emptySlots();
  return next;
}
```

- [ ] **Step 4: 运行测试**

Run: `npm test -- tests/domain/team.test.ts`

Expected: 3 tests PASS。

- [ ] **Step 5: 补齐删除角色、设置技能和宠物函数**

```ts
export function removeMember(team: Team, id: string): Team {
  return { ...copy(team), members: team.members.filter((member) => member.id !== id) };
}

export function setSkill(team: Team, id: string, kind: SkillKind, slot: number, skillId: string | null): Team {
  if (slot < 0 || slot > 3) throw new Error("Invalid skill slot");
  const next = copy(team);
  const member = next.members.find((candidate) => candidate.id === id);
  if (!member) throw new Error("Member not found");
  const selected = [...member.active, ...member.passive];
  const current = member[kind][slot];
  if (skillId !== current && selected.includes(skillId)) throw new Error("Skill already selected");
  member[kind][slot] = skillId;
  return next;
}

export function setPet(team: Team, id: string, petId: Pet["id"]): Team {
  const next = copy(team);
  const member = next.members.find((candidate) => candidate.id === id);
  if (!member) throw new Error("Member not found");
  member.petId = petId;
  return next;
}
```

- [ ] **Step 6: 为三个补充函数写测试并运行**

测试必须断言：删除后成员数减一；技能写入指定槽位；同一技能不能出现在同一角色的其他槽位；两名角色可以选择同一宠物。

Run: `npm test -- tests/domain/team.test.ts`

Expected: 新增断言和原有 3 个用例全部 PASS。

- [ ] **Step 7: 提交领域状态**

```powershell
git add src/domain/team.ts tests/domain/team.test.ts
git commit -m "feat: add team state rules"
```

### Task 4: 实现转数过滤与完整性校验

**Files:**
- Create: `src/domain/validation.ts`
- Modify: `src/domain/team.ts`
- Test: `tests/domain/validation.test.ts`

- [ ] **Step 1: 写转数和完整性失败测试**

```ts
// tests/domain/validation.test.ts
import { describe, expect, it } from "vitest";
import { createTeam, setStage } from "../../src/domain/team";
import { completionIssues, isSkillAllowed } from "../../src/domain/validation";

describe("validation", () => {
  it("hides skills above the shared stage", () => {
    expect(isSkillAllowed({ stage: 7 } as never, 6)).toBe(false);
    expect(isSkillAllowed({ stage: 6 } as never, 6)).toBe(true);
  });

  it("reports four missing members for a new team", () => {
    expect(completionIssues(createTeam(6))).toEqual(["members:4"]);
  });

  it("requires confirmation before lowering stage with higher skills", () => {
    const team = createTeam(7);
    expect(() => setStage(team, 6, false, [{ id: "s7", stage: 7 }] as never)).toThrow("Stage change needs confirmation");
  });
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm test -- tests/domain/validation.test.ts`

Expected: FAIL，缺少校验函数。

- [ ] **Step 3: 实现转数上限与完整性报告**

```ts
// src/domain/validation.ts
import type { Skill, Stage } from "./types";
import type { Team } from "./team";

export const isSkillAllowed = (skill: Skill, stage: Stage): boolean => skill.stage <= stage;

export function completionIssues(team: Team): string[] {
  const issues: string[] = [];
  if (team.members.length < 4) issues.push(`members:${4 - team.members.length}`);
  for (const member of team.members) {
    member.active.forEach((id, index) => { if (!id) issues.push(`${member.id}:active:${index}`); });
    member.passive.forEach((id, index) => { if (!id) issues.push(`${member.id}:passive:${index}`); });
    if (!member.petId) issues.push(`${member.id}:pet`);
  }
  return issues;
}
```

- [ ] **Step 4: 实现全队转数变更**

```ts
// src/domain/team.ts
import type { Skill } from "./types";

export function setStage(team: Team, newStage: Stage, confirmed: boolean, catalog: Skill[]): Team {
  const byId = new Map(catalog.map((skill) => [skill.id, skill]));
  const isOverStage = (id: string | null): boolean => Boolean(id && byId.get(id)!.stage > newStage);
  const hasOverStageSkill = team.members.some((member) =>
    [...member.active, ...member.passive].some(isOverStage)
  );
  if (newStage < team.stage && hasOverStageSkill && !confirmed) {
    throw new Error("Stage change needs confirmation");
  }
  const next = copy(team);
  next.stage = newStage;
  if (newStage < team.stage) {
    for (const member of next.members) {
      member.active = member.active.map((id) => isOverStage(id) ? null : id) as Slots;
      member.passive = member.passive.map((id) => isOverStage(id) ? null : id) as Slots;
    }
  }
  return next;
}
```

补一条测试，确认从七转降到六转后只清空七转技能，六转技能、站位、职业和宠物保持不变。

- [ ] **Step 5: 运行领域测试**

Run: `npm test -- tests/domain`

Expected: 队伍和校验测试全部 PASS。

- [ ] **Step 6: 提交校验规则**

```powershell
git add src/domain tests/domain
git commit -m "feat: add progression and completion validation"
```

### Task 5: 实现转数选择和 5×4 站位盘

**Files:**
- Create: `src/ui/app.ts`
- Create: `src/ui/stage-selector.ts`
- Create: `src/ui/board.ts`
- Modify: `src/main.ts`
- Modify: `src/styles.css`
- Test: `e2e/team-builder.spec.ts`

- [ ] **Step 1: 写首次选择转数的端到端失败测试**

```ts
// e2e/team-builder.spec.ts
import { expect, test } from "@playwright/test";

test("asks for the shared stage before editing", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "选择当前转数" })).toBeVisible();
  await page.getByRole("button", { name: "六转" }).click();
  await expect(page.getByText("当前：六转")).toBeVisible();
  await expect(page.getByTestId("board-cell")).toHaveCount(20);
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run dev` 后在另一终端运行 `npm run test:e2e -- e2e/team-builder.spec.ts`

Expected: FAIL，页面没有转数选择器。

- [ ] **Step 3: 实现转数选择器**

`renderStageSelector(onSelect)` 返回一个含一转至七转七个按钮的 `dialog` 元素；点击后调用 `onSelect(stage)` 并关闭。页面顶部同时保留一个“修改转数”按钮。

- [ ] **Step 4: 实现站位盘**

```ts
// src/ui/board.ts
import type { Team } from "../domain/team";

export function renderBoard(team: Team, onCell: (cell: number) => void): HTMLElement {
  const board = document.createElement("section");
  board.className = "board";
  board.setAttribute("aria-label", "队伍站位");
  for (let cell = 0; cell < 20; cell += 1) {
    const button = document.createElement("button");
    button.dataset.testid = "board-cell";
    button.dataset.cell = String(cell);
    const member = team.members.find((candidate) => candidate.cell === cell);
    button.setAttribute("aria-label", member ? `移动${member.profession}` : `空位${cell + 1}`);
    button.addEventListener("click", () => onCell(cell));
    board.append(button);
  }
  return board;
}
```

- [ ] **Step 5: 在 `app.ts` 中串起“选转数→加职业→移站位”状态机**

选中空格时打开四职业选择层；选中角色后再点空格时移动。每次变更用新 `Team` 状态整体重绘。

- [ ] **Step 6: 运行 E2E 测试**

Run: `npm run test:e2e -- e2e/team-builder.spec.ts`

Expected: 转数选择用例 PASS，站位盘为 20 格。

- [ ] **Step 7: 提交基础编辑器**

```powershell
git add src/ui src/main.ts src/styles.css e2e
git commit -m "feat: add stage selector and position board"
```

### Task 6: 实现技能与宠物选择

**Files:**
- Create: `src/ui/member-editor.ts`
- Create: `src/ui/pickers.ts`
- Modify: `src/ui/app.ts`
- Modify: `src/styles.css`
- Modify: `e2e/team-builder.spec.ts`

- [ ] **Step 1: 写六转不显示七转技能的失败测试**

```ts
test("filters skill choices by shared stage", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "六转" }).click();
  await page.getByTestId("board-cell").first().click();
  await page.getByRole("button", { name: "骑士" }).click();
  await page.getByRole("button", { name: "战技1" }).click();
  await expect(page.getByRole("tab", { name: "六转" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "七转" })).toHaveCount(0);
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:e2e -- e2e/team-builder.spec.ts`

Expected: FAIL，成员编辑器尚不存在。

- [ ] **Step 3: 渲染单个成员的 8 个技能槽和 1 个宠物槽**

`renderMemberEditor(member, catalog, handlers)` 必须按“4 战技→4 秘法→宠物”顺序渲染，每个槽位用按钮实现，并用 `aria-label="战技1"` 到 `aria-label="秘法4"` 提供可访问名称。

- [ ] **Step 4: 实现技能选择层**

`renderSkillPicker(profession, kind, stage, selectedIds, onSelect)` 调用 `visibleSkills()`，仅渲染指定职业、类型和当前转数范围。已被该成员选中的技能按钮保持禁用。

- [ ] **Step 5: 实现宠物选择层**

`renderPetPicker(pets, onSelect)` 固定显示五只宠物的图标与名称。宠物不做队内唯一限制。

- [ ] **Step 6: 增加降低转数确认流程**

当 `setStage` 报告存在超阶技能时，显示“降低转数会清除 X 个超阶技能”的确认框；用户取消时不改变状态，确认时清理并重绘。

- [ ] **Step 7: 运行 E2E 测试**

Run: `npm run test:e2e -- e2e/team-builder.spec.ts`

Expected: 六转过滤、技能选择、宠物重复选择和降转清理用例全部 PASS。

- [ ] **Step 8: 提交成员配置界面**

```powershell
git add src/ui src/styles.css e2e
git commit -m "feat: add skill and pet configuration"
```

### Task 7: 完整性提示与最低导出门槛

**Files:**
- Modify: `src/ui/app.ts`
- Modify: `src/ui/member-editor.ts`
- Modify: `src/styles.css`
- Modify: `e2e/team-builder.spec.ts`

- [x] **Step 1: 写空队不能出图、至少一名角色即可出图的失败测试**

```ts
test("keeps export disabled for an empty team and enables it after one member", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "七转" }).click();
  await expect(page.getByRole("button", { name: "生成图片" })).toBeDisabled();
  await expect(page.getByText("请先添加至少 1 名角色")).toBeVisible();
  // 添加任意一名角色后按钮启用；技能和宠物可留空并显示提示。
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:e2e -- e2e/team-builder.spec.ts`

Expected: FAIL，生成按钮或提示尚不存在。

- [ ] **Step 3: 将 `completionIssues()` 映射到友好提示**

页面底部显示配置提示。空队时要求至少添加一名角色；已有角色但缺技能或宠物时显示数量提示，并允许直接生成。空槽使用中性样式，不作为错误高亮。

- [ ] **Step 4: 运行单元和 E2E 测试**

Run: `npm test; npm run test:e2e -- e2e/team-builder.spec.ts`

Expected: 完整性提示和生成按钮状态用例 PASS。

- [ ] **Step 5: 提交完成度提示**

```powershell
git add src/ui src/styles.css e2e
git commit -m "feat: add completion guidance"
```

### Task 8: 使用 Canvas 生成 PNG 长图

**Files:**
- Create: `src/export/render-image.ts`
- Create: `src/export/download-image.ts`
- Modify: `src/ui/app.ts`
- Test: `tests/export/render-image.test.ts`
- Modify: `e2e/team-builder.spec.ts`

- [ ] **Step 1: 写输出尺寸和绘制顺序失败测试**

```ts
// tests/export/render-image.test.ts
import { describe, expect, it } from "vitest";
import { EXPORT_HEIGHT, EXPORT_WIDTH, orderedMembers } from "../../src/export/render-image";

describe("image export", () => {
  it("uses a phone-friendly portrait canvas", () => {
    expect(EXPORT_WIDTH).toBe(1080);
    expect(EXPORT_HEIGHT).toBeGreaterThan(1500);
  });

  it("orders members by row then column", () => {
    const members = [{ cell: 19 }, { cell: 1 }, { cell: 5 }, { cell: 4 }] as never;
    expect(orderedMembers(members).map((member) => member.cell)).toEqual([1, 4, 5, 19]);
  });
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm test -- tests/export/render-image.test.ts`

Expected: FAIL，导出模块不存在。

- [ ] **Step 3: 实现固定画布与成员顺序**

```ts
// src/export/render-image.ts
import type { Member, Team } from "../domain/team";

export const EXPORT_WIDTH = 1080;
export const EXPORT_HEIGHT = 1920;
export const orderedMembers = (members: Member[]): Member[] => [...members].sort((a, b) => a.cell - b.cell);

export async function renderTeamImage(team: Team): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = EXPORT_WIDTH;
  canvas.height = EXPORT_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable");
  ctx.fillStyle = "#f3f1ea";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}
```

- [ ] **Step 4: 分区绘制标题、5×4 站位盘和四条配置行**

将绘制拆为 `drawHeader`、`drawBoard`、`drawMemberRow` 和 `loadImage`四个私有函数。每条配置行显示职业形象、宠物名称与图标、4 个战技和 4 个秘法。图片加载失败时绘制有边框的问号占位图。

- [ ] **Step 5: 实现 PNG 下载**

```ts
// src/export/download-image.ts
export async function downloadCanvas(canvas: HTMLCanvasElement): Promise<void> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error("PNG generation failed")), "image/png");
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `杖剑传说-阵容-${new Date().toISOString().slice(0, 10)}.png`;
  link.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 6: 在页面中接入导出与失败重试**

点击“生成图片”后显示生成中状态；成功后下载；失败时保留队伍状态并显示“生成失败，请重试”。

- [ ] **Step 7: 运行导出测试**

Run: `npm test -- tests/export/render-image.test.ts; npm run test:e2e -- e2e/team-builder.spec.ts`

Expected: 画布尺寸、成员顺序、下载触发与错误状态用例 PASS。

- [ ] **Step 8: 提交图片生成器**

```powershell
git add src/export src/ui/app.ts tests/export e2e
git commit -m "feat: export configured team as png"
```

### Task 9: 完成手机优先视觉和可访问性

**Files:**
- Modify: `src/styles.css`
- Modify: `src/ui/*.ts`
- Modify: `e2e/team-builder.spec.ts`

- [ ] **Step 1: 增加手机视口测试**

```ts
test("fits the editor at a 390px mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "七转" }).click();
  await expect(page.getByTestId("position-board")).toBeInViewport();
  const fitsViewport = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  expect(fitsViewport).toBe(true);
});
```

- [ ] **Step 2: 实现响应式 CSS**

使用 `max-width: 720px` 的中央编辑列；站位盘用 `grid-template-columns: repeat(5, 1fr)`；可点击元素最小触摸尺寸 44px；选择层在手机上从底部弹出，在桌面上为居中对话框。

- [ ] **Step 3: 补齐键盘与读屏语义**

所有可交互项使用 `button`；弹层有标题、关闭按钮和焦点返回；选中职业、技能和宠物用 `aria-pressed`；错误提示使用 `aria-live="polite"`。

- [ ] **Step 4: 执行手机与桌面 E2E**

Run: `npm run test:e2e`

Expected: Chromium 桌面和 390×844 手机视口测试全部 PASS，没有水平滚动。

- [ ] **Step 5: 提交视觉与可访问性修改**

```powershell
git add src/styles.css src/ui e2e
git commit -m "feat: polish responsive accessible editor"
```

### Task 10: 完成验证、说明与静态部署

**Files:**
- Create: `README.md`
- Modify: `index.html`
- Modify: `src/ui/app.ts`
- Modify: `package.json`

- [ ] **Step 1: 加入非官方玩家工具声明**

页面底部显示：“非官方玩家工具。游戏名称、图标与角色素材的权利归其原权利人所有。”声明不进入导出 PNG。

- [ ] **Step 2: 写 README**

README 必须包含：Node.js 环境要求；`npm install`、`npm run dev`、`npm test`、`npm run test:e2e`、`npm run build` 命令；如何将新技能截图加入 `source-assets.json`；如何重新生成素材；`dist/` 可部署到任意静态托管服务。

- [ ] **Step 3: 执行全量验证**

Run:

```powershell
npm run data:check
npm test
npm run build
npm run test:e2e
```

Expected: 数据校验 0 错误；全部单元测试 PASS；构建成功；全部 E2E PASS。

- [ ] **Step 4: 手动验收四组高风险流程**

1. 六转初始化后完全看不到七转技能。
2. 四名相同职业可完成配置，四人可选同一宠物。
3. 七转队伍降为六转时，仅七转技能被清除。
4. 任意 1–4 人配置可导出 1080×1828 PNG；站位、已选技能顺序与宠物正确，未选项显示占位。

- [ ] **Step 5: 提交交付文档**

```powershell
git add README.md index.html src/ui/app.ts package.json
git commit -m "docs: add usage and deployment guide"
```

- [ ] **Step 6: 确认最终工作树**

Run: `git status --short; git log --oneline -10`

Expected: 无未提交的应用代码或文档；原始截图如未加入 Git，仍保持原样且不被删除。
