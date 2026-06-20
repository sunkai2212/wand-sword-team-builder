import { expect, test } from "@playwright/test";
import sharp from "sharp";

interface ImageRegion {
  left: number;
  top: number;
  width: number;
  height: number;
}

async function imageRegionSignal(path: string, region: ImageRegion) {
  const stats = await sharp(path).extract(region).stats();
  return {
    entropy: stats.entropy,
    maxDeviation: Math.max(...stats.channels.slice(0, 3).map((channel) => channel.stdev)),
  };
}

async function expectImageRegionToContainDrawing(path: string, region: ImageRegion) {
  const signal = await imageRegionSignal(path, region);
  expect(signal.entropy).toBeGreaterThan(0.01);
  expect(signal.maxDeviation).toBeGreaterThan(1);
}

async function downloadGeneratedImage(page: import("@playwright/test").Page) {
  const downloadPromise = page.waitForEvent("download");
  await page.locator(".generate-button").click();
  const download = await downloadPromise;
  const path = await download.path();
  if (!path) throw new Error("Downloaded image path is unavailable");
  return { download, path };
}

async function chooseStage(page: import("@playwright/test").Page, stage = "六转") {
  await page.goto("/");
  await page.getByRole("button", { name: stage, exact: true }).click();
}

async function addKnight(page: import("@playwright/test").Page, cell: number) {
  await page.getByTestId("board-cell").nth(cell).click();
  const professionDialog = page.getByRole("dialog", { name: "选择职业" });
  await expect(professionDialog).toBeVisible();
  await professionDialog.getByRole("button", { name: "骑士", exact: true }).click();
}

function memberEditor(page: import("@playwright/test").Page, index = 0) {
  return page.getByTestId("member-editor").nth(index);
}

async function chooseSkill(
  page: import("@playwright/test").Page,
  editorIndex: number,
  kind: "active" | "passive",
  slot: number,
) {
  const editor = memberEditor(page, editorIndex);
  await editor.locator(`[data-testid="skill-slot"][data-kind="${kind}"][data-slot="${slot}"]`).click();
  await page.locator(`[data-testid="skill-option"][data-skill-id="knight-s6-${kind}-${slot + 1}"]`).click();
}

async function completeKnight(page: import("@playwright/test").Page, editorIndex: number) {
  for (const kind of ["active", "passive"] as const) {
    for (let slot = 0; slot < 4; slot += 1) {
      await chooseSkill(page, editorIndex, kind, slot);
    }
  }
  await memberEditor(page, editorIndex).getByTestId("pet-slot").click();
  await page.locator('[data-testid="pet-option"][data-pet-id="qianming"]').click();
}

test("首次加载只显示不可关闭的转数选择层", async ({ page }) => {
  await page.goto("/");

  const dialog = page.getByRole("dialog", { name: "选择当前转数" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button")).toHaveCount(7);
  for (const stage of ["一转", "二转", "三转", "四转", "五转", "六转", "七转"]) {
    await expect(dialog.getByRole("button", { name: stage, exact: true })).toBeVisible();
  }
  await expect(dialog.getByRole("button", { name: "关闭" })).toHaveCount(0);
  await expect(page.getByTestId("position-board")).toHaveCount(0);
});

test("选六转后显示当前转数和 20 个站位", async ({ page }) => {
  await chooseStage(page);

  await expect(page.getByText("当前：六转", { exact: true })).toBeVisible();
  await expect(page.getByTestId("position-board")).toBeVisible();
  await expect(page.getByTestId("board-cell")).toHaveCount(20);
  await expect(page.getByRole("button", { name: "空位1", exact: true })).toBeVisible();
});

test("可添加骑士，并允许四个重复职业但拒绝第五人", async ({ page }) => {
  await chooseStage(page);

  for (let cell = 0; cell < 4; cell += 1) await addKnight(page, cell);

  await expect(page.getByRole("button", { name: /位置 \d+，骑士/ })).toHaveCount(4);
  await page.getByTestId("board-cell").nth(4).click();
  await expect(page.getByRole("dialog", { name: "选择职业" })).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveText("队伍已满4人");
});

test("选中已有角色后可移动到空位并取消选中", async ({ page }) => {
  await chooseStage(page);
  await addKnight(page, 0);

  const source = page.getByTestId("board-cell").nth(0);
  await source.click();
  await expect(source).toHaveAttribute("aria-pressed", "true");
  await source.click();
  await expect(source).toHaveAttribute("aria-pressed", "false");
  await source.click();
  await page.getByTestId("board-cell").nth(8).click();

  await expect(page.getByTestId("board-cell").nth(0)).toHaveAccessibleName("空位1");
  await expect(page.getByTestId("board-cell").nth(8)).toHaveAccessibleName("位置 9，骑士");
  await expect(page.getByTestId("board-cell").nth(8)).toHaveAttribute("aria-pressed", "false");
});

test("修改转数时保留已有角色且选择层可关闭", async ({ page }) => {
  await chooseStage(page);
  await addKnight(page, 3);

  await page.getByRole("button", { name: "修改转数" }).click();
  const dialog = page.getByRole("dialog", { name: "选择当前转数" });
  await expect(dialog.getByRole("button", { name: "关闭" })).toBeVisible();
  await dialog.getByRole("button", { name: "关闭" }).click();
  await expect(dialog).toHaveCount(0);

  await page.getByRole("button", { name: "修改转数" }).click();
  await page.getByRole("button", { name: "三转", exact: true }).click();
  await expect(page.getByText("当前：三转", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /位置 \d+，骑士/ })).toHaveCount(1);
});

test("修改转数时焦点限制在层内，关闭后返回触发按钮", async ({ page }) => {
  await chooseStage(page);
  const trigger = page.getByRole("button", { name: "修改转数" });
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "选择当前转数" });
  await expect(dialog.getByRole("button", { name: "一转", exact: true })).toBeFocused();
  for (let index = 0; index < 10; index += 1) {
    await page.keyboard.press("Tab");
    const focus = await dialog.evaluate((element) => ({
      inside: element.contains(document.activeElement),
      active: `${document.activeElement?.tagName}:${document.activeElement?.textContent?.trim()}`,
    }));
    expect(focus.inside, `Tab ${index + 1} focused ${focus.active}`).toBe(true);
  }
  await page.keyboard.press("Shift+Tab");
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);

  await dialog.getByRole("button", { name: "关闭" }).click();
  await expect(trigger).toBeFocused();
});

test("职业选择层也会阻止焦点进入背景", async ({ page }) => {
  await chooseStage(page);
  await page.getByTestId("board-cell").first().click();

  const dialog = page.getByRole("dialog", { name: "选择职业" });
  await expect(dialog.getByRole("button", { name: "骑士", exact: true })).toBeFocused();
  for (let index = 0; index < 6; index += 1) {
    await page.keyboard.press("Tab");
    const focus = await dialog.evaluate((element) => ({
      inside: element.contains(document.activeElement),
      active: `${document.activeElement?.tagName}:${document.activeElement?.textContent?.trim()}`,
    }));
    expect(focus.inside, `Tab ${index + 1} focused ${focus.active}`).toBe(true);
  }
});

test("职业选择可用按钮或 Escape 取消并返回原站位", async ({ page }) => {
  await chooseStage(page);
  const firstCell = page.getByTestId("board-cell").nth(4);
  await firstCell.click();
  let dialog = page.getByRole("dialog", { name: "选择职业" });
  await dialog.getByRole("button", { name: "取消" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(firstCell).toBeFocused();

  const secondCell = page.getByTestId("board-cell").nth(5);
  await secondCell.click();
  dialog = page.getByRole("dialog", { name: "选择职业" });
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(secondCell).toBeFocused();
});

test("选择职业后焦点返回新成员站位", async ({ page }) => {
  await chooseStage(page);
  const cell = page.getByTestId("board-cell").nth(6);
  await cell.click();
  await page.getByRole("dialog", { name: "选择职业" })
    .getByRole("button", { name: "骑士", exact: true }).click();

  await expect(cell).toBeFocused();
  await expect(cell).toHaveAccessibleName("位置 7，骑士");
});

test("重复职业的站位可访问名唯一", async ({ page }) => {
  await chooseStage(page);
  await addKnight(page, 0);
  await addKnight(page, 1);

  await expect(page.getByTestId("board-cell").nth(0)).toHaveAccessibleName("位置 1，骑士");
  await expect(page.getByTestId("board-cell").nth(1)).toHaveAccessibleName("位置 2，骑士");
});

test("站位选中、取消和移动后保持合理焦点", async ({ page }) => {
  await chooseStage(page);
  await addKnight(page, 0);
  const source = page.getByTestId("board-cell").nth(0);
  await source.click();
  await expect(source).toBeFocused();
  await source.click();
  await expect(source).toBeFocused();
  await source.click();

  const target = page.getByTestId("board-cell").nth(8);
  await target.click();
  await expect(target).toBeFocused();
  await expect(target).toHaveAccessibleName("位置 9，骑士");
});

test("满员提示更新时 live region 节点保持稳定", async ({ page }) => {
  await chooseStage(page);
  const status = page.getByRole("status");
  const statusNode = await status.elementHandle();
  expect(statusNode).not.toBeNull();

  for (let cell = 0; cell < 4; cell += 1) await addKnight(page, cell);
  await page.getByTestId("board-cell").nth(4).click();

  await expect(status).toHaveText("队伍已满4人");
  expect(await statusNode!.evaluate((element) => element.isConnected)).toBe(true);
  await expect(page.getByTestId("board-cell").nth(4)).toBeFocused();
});

test("六转技能选择器只提供一至六转，七转队伍才提供七转", async ({ page }) => {
  await chooseStage(page);
  await addKnight(page, 0);

  await memberEditor(page).getByRole("button", { name: "战技1", exact: true }).click();
  let dialog = page.getByRole("dialog", { name: "选择战技1" });
  await expect(dialog.locator('[data-testid="skill-stage-tab"]')).toHaveCount(6);
  for (let stage = 1; stage <= 6; stage += 1) {
    const tab = dialog.locator(`[data-testid="skill-stage-tab"][data-stage="${stage}"]`);
    await expect(tab).toBeVisible();
    await tab.click();
    await expect(dialog.locator(`[data-testid="skill-option"][data-stage="${stage}"]`).first()).toBeVisible();
  }
  await expect(dialog.locator('[data-stage="7"]')).toHaveCount(0);
  await expect(dialog.locator('[data-skill-id^="knight-s7-"]')).toHaveCount(0);
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "修改转数" }).click();
  await page.getByRole("dialog", { name: "选择当前转数" })
    .getByRole("button", { name: "七转", exact: true }).click();
  await memberEditor(page).getByRole("button", { name: "战技1", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "选择战技1" });
  await expect(dialog.locator('[data-testid="skill-stage-tab"][data-stage="7"]')).toBeVisible();
  await expect(dialog.locator('[data-skill-id="knight-s7-active-1"]')).toBeVisible();
});

test("技能按槽显示图标、禁止同成员重复并可清空", async ({ page }) => {
  await chooseStage(page);
  await addKnight(page, 0);
  const editor = memberEditor(page);

  const activeSlot = editor.locator('[data-testid="skill-slot"][data-kind="active"][data-slot="0"]');
  await activeSlot.click();
  await page.locator('[data-testid="skill-option"][data-skill-id="knight-s6-active-1"]').click();
  await expect(activeSlot).toBeFocused();
  await expect(activeSlot.locator("img")).toHaveCount(1);
  await expect(activeSlot).toHaveAttribute("aria-label", "战技1，骑士·六转·图标1");

  await editor.getByRole("button", { name: "战技2", exact: true }).click();
  const duplicate = page.locator('[data-testid="skill-option"][data-skill-id="knight-s6-active-1"]');
  await expect(duplicate).toBeDisabled();
  await duplicate.dispatchEvent("click");
  await expect(page.getByRole("status")).toHaveText("该技能已装备");
  await page.keyboard.press("Escape");

  const passiveSlot = editor.locator('[data-testid="skill-slot"][data-kind="passive"][data-slot="0"]');
  await passiveSlot.click();
  await page.locator('[data-testid="skill-option"][data-skill-id="knight-s6-passive-1"]').click();
  await expect(passiveSlot.locator("img")).toHaveCount(1);

  await activeSlot.click();
  await page.getByRole("dialog", { name: "选择战技1" })
    .getByRole("button", { name: "清空此技能", exact: true }).click();
  await expect(activeSlot).toBeFocused();
  await expect(activeSlot).toHaveAccessibleName("战技1");
  await expect(activeSlot.locator("img")).toHaveCount(0);
});

test("两名成员可选择同一只宠物并显示真实名称", async ({ page }) => {
  await chooseStage(page);
  await addKnight(page, 0);
  await addKnight(page, 1);

  for (let index = 0; index < 2; index += 1) {
    const slot = memberEditor(page, index).getByTestId("pet-slot");
    await slot.click();
    const dialog = page.getByRole("dialog", { name: "选择宠物" });
    await expect(dialog.locator('[data-testid="pet-option"]')).toHaveCount(5);
    await dialog.locator('[data-testid="pet-option"][data-pet-id="qianming"]').click();
    await expect(slot).toBeFocused();
    await expect(slot).toContainText("千明灵狗");
  }
});

test("更换职业清空技能但保留宠物，删除角色释放站位", async ({ page }) => {
  await chooseStage(page);
  await addKnight(page, 0);
  const editor = memberEditor(page);

  await editor.getByRole("button", { name: "战技1", exact: true }).click();
  await page.locator('[data-skill-id="knight-s6-active-1"]').click();
  await editor.getByRole("button", { name: "宠物", exact: true }).click();
  await page.locator('[data-pet-id="qianming"]').click();

  await editor.getByRole("button", { name: "更换职业", exact: true }).click();
  await page.getByRole("dialog", { name: "更换职业" })
    .getByRole("button", { name: "斗士", exact: true }).click();
  const changed = memberEditor(page);
  await expect(changed.getByTestId("change-profession")).toBeFocused();
  await expect(changed).toContainText("斗士");
  await expect(changed.getByRole("button", { name: "战技1", exact: true })).toHaveCount(1);
  await expect(changed.getByRole("button", { name: /千明灵狗/ })).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await changed.getByRole("button", { name: "删除角色", exact: true }).click();
  await expect(page.getByTestId("member-editor")).toHaveCount(0);
  await expect(page.getByTestId("board-cell").nth(0)).toHaveAccessibleName("空位1");
  await expect(page.getByTestId("board-cell").nth(0)).toBeFocused();
});

test("降低转数可取消，确认后只清除超阶技能", async ({ page }) => {
  await chooseStage(page, "七转");
  await addKnight(page, 0);
  const editor = memberEditor(page);

  await editor.getByRole("button", { name: "战技1", exact: true }).click();
  await page.locator('[data-skill-id="knight-s7-active-1"]').click();
  await editor.getByRole("button", { name: "战技2", exact: true }).click();
  await page.locator('[data-testid="skill-stage-tab"][data-stage="6"]').click();
  await page.locator('[data-skill-id="knight-s6-active-1"]').click();

  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "修改转数" }).click();
  await page.getByRole("dialog", { name: "选择当前转数" })
    .getByRole("button", { name: "六转", exact: true }).click();
  await expect(page.getByText("当前：七转", { exact: true })).toBeVisible();
  await expect(editor.locator('[data-skill-id="knight-s7-active-1"]')).toHaveCount(1);

  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toBe("降低转数会清除 1 个超阶技能，是否继续？");
    await dialog.accept();
  });
  await page.getByRole("dialog", { name: "选择当前转数" })
    .getByRole("button", { name: "六转", exact: true }).click();
  await expect(page.getByText("当前：六转", { exact: true })).toBeVisible();
  await expect(memberEditor(page).getByRole("button", { name: "战技1", exact: true })).toBeVisible();
  await expect(memberEditor(page).locator('[data-skill-id="knight-s6-active-1"]')).toHaveCount(1);
  await expect(page.getByTestId("completion-message")).toContainText("还缺 7 个技能和 1 只宠物");
  await expect(page.getByRole("button", { name: "生成图片", exact: true })).toBeEnabled();
  await expect(memberEditor(page).locator('[data-testid="skill-slot"].is-missing')).toHaveCount(7);
});

test("技能与宠物选择器用 Escape 关闭并把焦点还给槽位", async ({ page }) => {
  await chooseStage(page);
  await addKnight(page, 0);
  const editor = memberEditor(page);
  const skillSlot = editor.getByRole("button", { name: "战技1", exact: true });
  await skillSlot.click();
  await page.keyboard.press("Escape");
  await expect(skillSlot).toBeFocused();

  const petSlot = editor.getByRole("button", { name: "宠物", exact: true });
  await petSlot.click();
  await page.keyboard.press("Escape");
  await expect(petSlot).toBeFocused();
});

test("技能与宠物选择器可用可见取消按钮关闭并把焦点还给槽位", async ({ page }) => {
  await chooseStage(page);
  await addKnight(page, 0);
  const editor = memberEditor(page);

  const skillSlot = editor.getByRole("button", { name: "战技1", exact: true });
  await skillSlot.click();
  let dialog = page.getByRole("dialog", { name: "选择战技1" });
  const skillCancel = dialog.getByRole("button", { name: "取消", exact: true });
  await expect(skillCancel).toBeVisible();
  await skillCancel.click();
  await expect(dialog).toHaveCount(0);
  await expect(skillSlot).toBeFocused();

  const petSlot = editor.getByRole("button", { name: "宠物", exact: true });
  await petSlot.click();
  dialog = page.getByRole("dialog", { name: "选择宠物" });
  const petCancel = dialog.getByRole("button", { name: "取消", exact: true });
  await expect(petCancel).toBeVisible();
  await petCancel.click();
  await expect(dialog).toHaveCount(0);
  await expect(petSlot).toBeFocused();
});

test("更换职业用 Escape、取消或选择成功后都把焦点还给更换职业按钮", async ({ page }) => {
  await chooseStage(page);
  await addKnight(page, 0);

  let change = memberEditor(page).getByTestId("change-profession");
  await change.click();
  await page.keyboard.press("Escape");
  await expect(change).toBeFocused();

  await change.click();
  let dialog = page.getByRole("dialog", { name: "更换职业" });
  await dialog.getByRole("button", { name: "取消", exact: true }).click();
  await expect(change).toBeFocused();

  await change.click();
  dialog = page.getByRole("dialog", { name: "更换职业" });
  await dialog.getByRole("button", { name: "斗士", exact: true }).click();
  change = memberEditor(page).getByTestId("change-profession");
  await expect(change).toBeFocused();
});

test("390 像素宽屏下选择器显示取消按钮且页面没有横向溢出", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await chooseStage(page);
  await addKnight(page, 0);

  await memberEditor(page).getByRole("button", { name: "战技1", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "选择战技1" });
  await expect(dialog.getByRole("button", { name: "取消", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("空队禁用生成，添加一人后带缺项也可生成一次副本事件", async ({ page }) => {
  await page.addInitScript(() => {
    (window as Window & { generatedTeams?: unknown[] }).generatedTeams = [];
    window.addEventListener("team-builder:generate", (event) => {
      (window as Window & { generatedTeams: unknown[] }).generatedTeams.push(
        (event as CustomEvent).detail,
      );
    });
  });
  await chooseStage(page, "七转");

  const completion = page.getByTestId("completion-message");
  const completionNode = await completion.elementHandle();
  const generate = page.getByRole("button", { name: "生成图片", exact: true });
  await expect(completion).toHaveText("请先添加至少 1 名角色");
  await expect(generate).toBeDisabled();
  await expect(generate).not.toBeFocused();
  await generate.dispatchEvent("click");
  expect(await page.evaluate(() => (window as Window & { generatedTeams: unknown[] }).generatedTeams.length)).toBe(0);

  await addKnight(page, 0);
  await expect(completion).toContainText("还需要添加 3 名角色");
  await expect(completion).toContainText("还缺 8 个技能和 1 只宠物");
  await expect(completion).toContainText("可直接生成");
  await expect(generate).toBeEnabled();
  expect(await completionNode!.evaluate((element) => element.isConnected)).toBe(true);

  const editor = memberEditor(page);
  await expect(editor.locator('[data-testid="skill-slot"].is-missing')).toHaveCount(8);
  await expect(editor.locator('[data-testid="skill-slot"][aria-invalid]')).toHaveCount(0);
  await expect(editor.locator('[data-testid="pet-slot"].is-missing')).toHaveCount(1);
  await expect(editor.locator('[data-testid="pet-slot"][aria-invalid]')).toHaveCount(0);
  await generate.click();
  const events = await page.evaluate(() => (window as Window & { generatedTeams: Array<{ stage: number; members: unknown[] }> }).generatedTeams);
  expect(events).toHaveLength(1);
  expect(events[0]).toMatchObject({ stage: 7, members: [{ profession: "knight" }] });
  await page.evaluate(() => {
    const generated = (window as Window & { generatedTeams: Array<{ members: Array<{ profession: string }> }> }).generatedTeams;
    generated[0].members[0].profession = "fighter";
  });
  await page.getByRole("button", { name: "修改转数" }).click();
  await page.getByRole("dialog", { name: "选择当前转数" }).getByRole("button", { name: "关闭" }).click();
  await expect(memberEditor(page)).toContainText("骑士");
});

test("填写和清空缺项时完成度数字、缺失标记即时更新", async ({ page }) => {
  await chooseStage(page);
  await addKnight(page, 0);
  const completion = page.getByTestId("completion-message");
  const editor = memberEditor(page);
  const skill = editor.locator('[data-testid="skill-slot"][data-kind="active"][data-slot="0"]');

  await chooseSkill(page, 0, "active", 0);
  await expect(completion).toContainText("还缺 7 个技能和 1 只宠物");
  await expect(skill).not.toHaveClass(/is-missing/);
  await expect(skill).not.toHaveAttribute("aria-invalid", "true");
  await skill.click();
  await page.getByRole("dialog", { name: "选择战技1" })
    .getByRole("button", { name: "清空此技能", exact: true }).click();
  await expect(completion).toContainText("还缺 8 个技能和 1 只宠物");
  await expect(skill).toHaveClass(/is-missing/);
  await expect(skill).not.toHaveAttribute("aria-invalid");
});

test("完成度未变化时不重复播报，技能数量变化时才更新 live region", async ({ page }) => {
  await chooseStage(page);
  await addKnight(page, 0);
  const completion = page.getByTestId("completion-message");
  await expect(completion).toContainText("还缺 8 个技能和 1 只宠物");

  await page.evaluate(() => {
    const target = document.querySelector('[data-testid="completion-message"]');
    if (!target) throw new Error("completion live region not found");
    const state = { mutations: 0 };
    new MutationObserver(() => {
      state.mutations += 1;
    }).observe(target, { childList: true, characterData: true, subtree: true });
    (window as Window & { completionObserverState?: typeof state }).completionObserverState = state;
  });

  const skill = memberEditor(page).getByRole("button", { name: "战技1", exact: true });
  await skill.click();
  await page.getByRole("dialog", { name: "选择战技1" })
    .getByRole("button", { name: "取消", exact: true }).click();
  await page.getByTestId("board-cell").nth(0).click();
  await page.getByTestId("board-cell").nth(0).click();
  expect(await page.evaluate(() =>
    (window as Window & { completionObserverState: { mutations: number } })
      .completionObserverState.mutations,
  )).toBe(0);

  await chooseSkill(page, 0, "active", 0);
  await expect(completion).toContainText("还缺 7 个技能和 1 只宠物");
  expect(await page.evaluate(() =>
    (window as Window & { completionObserverState: { mutations: number } })
      .completionObserverState.mutations,
  )).toBeGreaterThan(0);

  await page.evaluate(() => {
    (window as Window & { completionObserverState: { mutations: number } })
      .completionObserverState.mutations = 0;
  });
  await memberEditor(page)
    .locator('[data-testid="skill-slot"][data-kind="active"][data-slot="0"]')
    .click();
  await page.getByRole("dialog", { name: "选择战技1" })
    .getByRole("button", { name: "清空此技能", exact: true }).click();
  await expect(completion).toContainText("还缺 8 个技能和 1 只宠物");
  expect(await page.evaluate(() =>
    (window as Window & { completionObserverState: { mutations: number } })
      .completionObserverState.mutations,
  )).toBeGreaterThan(0);
});

test("完整阵容显示完成，清空配置仍允许生成，删除至空队才重新禁用", async ({ page }) => {
  await chooseStage(page);
  for (let cell = 0; cell < 4; cell += 1) await addKnight(page, cell);
  for (let index = 0; index < 4; index += 1) await completeKnight(page, index);

  const completion = page.getByTestId("completion-message");
  const generate = page.getByRole("button", { name: "生成图片", exact: true });
  await expect(completion).toHaveText("阵容配置已完成");
  await expect(generate).toBeEnabled();
  await expect(page.locator(".is-missing")).toHaveCount(0);

  await memberEditor(page).getByTestId("change-profession").click();
  await page.getByRole("dialog", { name: "更换职业" })
    .getByRole("button", { name: "斗士", exact: true }).click();
  await expect(completion).toContainText("还缺 8 个技能");
  await expect(generate).toBeEnabled();
  await expect(memberEditor(page).locator('[data-testid="skill-slot"].is-missing')).toHaveCount(8);

  for (let index = 0; index < 4; index += 1) {
    page.once("dialog", (dialog) => dialog.accept());
    await memberEditor(page).getByRole("button", { name: "删除角色", exact: true }).click();
  }
  await expect(completion).toHaveText("请先添加至少 1 名角色");
  await expect(generate).toBeDisabled();
});

test("一名未配置角色可下载尺寸正确的 PNG", async ({ page }) => {
  await chooseStage(page);
  await addKnight(page, 0);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "生成图片", exact: true }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  if (!downloadPath) throw new Error("下载文件路径不可用");
  const metadata = await sharp(downloadPath).metadata();

  expect(download.suggestedFilename()).toMatch(/^杖剑传说-阵容-\d{4}-\d{2}-\d{2}\.png$/);
  expect(metadata.format).toBe("png");
  expect(metadata.width).toBe(1080);
  expect(metadata.height).toBe(1210);
  await expect(page.getByRole("status")).toHaveText("图片已生成");
});

test("四名部分配置角色可导出且快速双击只下载一次", async ({ page }) => {
  await chooseStage(page);
  for (let cell = 0; cell < 4; cell += 1) await addKnight(page, cell);
  await chooseSkill(page, 0, "active", 0);

  let downloads = 0;
  page.on("download", () => { downloads += 1; });
  const button = page.getByRole("button", { name: "生成图片", exact: true });
  await button.evaluate((element) => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await expect(page.getByRole("status")).toHaveText("图片已生成");
  await page.waitForTimeout(250);

  expect(downloads).toBe(1);
});

test("PNG 生成失败后恢复按钮并保留队伍", async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.toBlob = function toBlob(callback) {
      callback(null);
    };
  });
  await chooseStage(page);
  await addKnight(page, 0);

  const button = page.getByRole("button", { name: "生成图片", exact: true });
  await button.click();

  await expect(page.getByRole("status")).toHaveText("生成失败，请重试");
  await expect(button).toBeEnabled();
  await expect(memberEditor(page)).toContainText("骑士");
});

test("one empty member export draws the header, board, member row, and empty slots", async ({ page }) => {
  await chooseStage(page);
  await addKnight(page, 0);

  const { path } = await downloadGeneratedImage(page);
  const metadata = await sharp(path).metadata();
  expect(metadata).toMatchObject({ format: "png", width: 1080, height: 1210 });

  await expectImageRegionToContainDrawing(path, { left: 0, top: 0, width: 1080, height: 150 });
  await expectImageRegionToContainDrawing(path, { left: 72, top: 185, width: 936, height: 746 });
  await expectImageRegionToContainDrawing(path, { left: 54, top: 970, width: 972, height: 190 });
  await expectImageRegionToContainDrawing(path, { left: 188, top: 1018, width: 98, height: 98 });
  await expectImageRegionToContainDrawing(path, { left: 352, top: 1030, width: 68, height: 68 });
});

test("four member export draws the final member row without clipping", async ({ page }) => {
  await chooseStage(page);
  for (let cell = 0; cell < 4; cell += 1) await addKnight(page, cell);
  await chooseSkill(page, 3, "active", 0);

  const { path } = await downloadGeneratedImage(page);
  const metadata = await sharp(path).metadata();
  expect(metadata).toMatchObject({ format: "png", width: 1080, height: 1828 });
  await expectImageRegionToContainDrawing(path, { left: 54, top: 1588, width: 972, height: 190 });
});

test("failed profession asset still exports a valid image with a placeholder", async ({ page }) => {
  let failedProfessionRequests = 0;
  await page.route("**/assets/professions/knight.svg", async (route) => {
    failedProfessionRequests += 1;
    await route.abort();
  });
  await chooseStage(page);
  await addKnight(page, 0);

  const { path } = await downloadGeneratedImage(page);
  const metadata = await sharp(path).metadata();
  expect(failedProfessionRequests).toBeGreaterThan(0);
  expect(metadata).toMatchObject({ format: "png", width: 1080, height: 1210 });
  await expectImageRegionToContainDrawing(path, { left: 72, top: 1015, width: 88, height: 88 });
  await expectImageRegionToContainDrawing(path, { left: 0, top: 0, width: 1080, height: 1210 });
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 360, height: 800 },
]) {
  test(`task9: ${viewport.width}px 手机编辑器无水平滚动且站位格满足触控尺寸`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await chooseStage(page);

    expect(await page.evaluate(() =>
      document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    )).toBe(true);

    const cells = await page.getByTestId("board-cell").evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      }),
    );
    expect(cells).toHaveLength(20);
    for (const cell of cells) {
      expect(cell.width).toBeGreaterThanOrEqual(44);
      expect(cell.height).toBeGreaterThanOrEqual(44);
    }
  });
}

test("task9: 390px 手机可见控件满足触控高度且生成按钮接近容器全宽", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await chooseStage(page);
  await addKnight(page, 0);

  const tooShort = await page.locator("button:visible").evaluateAll((buttons) =>
    buttons
      .map((button) => ({
        label: button.getAttribute("aria-label") ?? button.textContent?.trim() ?? "",
        height: button.getBoundingClientRect().height,
      }))
      .filter((button) => button.height < 44),
  );
  expect(tooShort).toEqual([]);

  const panelBox = await page.locator(".completion-panel").boundingBox();
  const buttonBox = await page.locator(".generate-button").boundingBox();
  expect(panelBox).not.toBeNull();
  expect(buttonBox).not.toBeNull();
  expect(buttonBox!.width).toBeGreaterThanOrEqual(panelBox!.width - 34);
});

test("task9: 390px 技能选择器不超过视口 88% 且底部操作始终可达", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await chooseStage(page);
  await addKnight(page, 0);
  await chooseSkill(page, 0, "active", 0);
  const slot = memberEditor(page).locator(
    '[data-testid="skill-slot"][data-kind="active"][data-slot="0"]',
  );
  await slot.click();

  let dialog = page.getByRole("dialog", { name: "选择战技1" });
  let cancel = dialog.getByRole("button", { name: "取消", exact: true });
  let clear = dialog.getByRole("button", { name: "清空此技能", exact: true });
  const dialogBox = await dialog.boundingBox();
  const initialClearBox = await clear.boundingBox();
  const initialCancelBox = await cancel.boundingBox();
  expect(dialogBox).not.toBeNull();
  expect(initialClearBox).not.toBeNull();
  expect(initialCancelBox).not.toBeNull();
  expect(dialogBox!.height).toBeLessThanOrEqual(844 * 0.88 + 1);
  await expect(cancel).toBeVisible();
  await expect(clear).toBeVisible();
  for (const buttonBox of [initialClearBox!, initialCancelBox!]) {
    expect(buttonBox.x).toBeGreaterThanOrEqual(dialogBox!.x);
    expect(buttonBox.y).toBeGreaterThanOrEqual(dialogBox!.y);
    expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(dialogBox!.x + dialogBox!.width);
    expect(buttonBox.y + buttonBox.height).toBeLessThanOrEqual(dialogBox!.y + dialogBox!.height);
    expect(buttonBox.x).toBeGreaterThanOrEqual(0);
    expect(buttonBox.y).toBeGreaterThanOrEqual(0);
    expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(390);
    expect(buttonBox.y + buttonBox.height).toBeLessThanOrEqual(844);
  }
  const dialogButtonHeights = await dialog.locator("button:visible").evaluateAll((buttons) =>
    buttons.map((button) => button.getBoundingClientRect().height),
  );
  expect(dialogButtonHeights.every((height) => height >= 44)).toBe(true);

  await dialog.locator(".skill-picker-grid").evaluate((grid) => {
    grid.scrollTop = grid.scrollHeight;
  });
  const scrolledClearBox = await clear.boundingBox();
  const scrolledCancelBox = await cancel.boundingBox();
  expect(scrolledClearBox).not.toBeNull();
  expect(scrolledCancelBox).not.toBeNull();
  expect(scrolledClearBox!.y).toBeCloseTo(initialClearBox!.y, 0);
  expect(scrolledCancelBox!.y).toBeCloseTo(initialCancelBox!.y, 0);
  for (const buttonBox of [scrolledClearBox!, scrolledCancelBox!]) {
    expect(buttonBox.x).toBeGreaterThanOrEqual(dialogBox!.x);
    expect(buttonBox.y).toBeGreaterThanOrEqual(dialogBox!.y);
    expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(dialogBox!.x + dialogBox!.width);
    expect(buttonBox.y + buttonBox.height).toBeLessThanOrEqual(dialogBox!.y + dialogBox!.height);
    expect(buttonBox.x).toBeGreaterThanOrEqual(0);
    expect(buttonBox.y).toBeGreaterThanOrEqual(0);
    expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(390);
    expect(buttonBox.y + buttonBox.height).toBeLessThanOrEqual(844);
  }
  await cancel.scrollIntoViewIfNeeded();
  await cancel.click();
  await expect(dialog).toHaveCount(0);
  await expect(slot.locator("img")).toHaveCount(1);

  await slot.click();
  dialog = page.getByRole("dialog", { name: "选择战技1" });
  clear = dialog.getByRole("button", { name: "清空此技能", exact: true });
  cancel = dialog.getByRole("button", { name: "取消", exact: true });
  await expect(cancel).toBeVisible();
  await clear.scrollIntoViewIfNeeded();
  await clear.click();
  await expect(dialog).toHaveCount(0);
  await expect(slot).toHaveAccessibleName("战技1");
  await expect(slot.locator("img")).toHaveCount(0);
});

test("task9: 1280px 主内容宽度受控居中且成员编辑为两列", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await chooseStage(page);
  await addKnight(page, 0);
  await addKnight(page, 1);

  const shellBox = await page.locator(".app-shell").boundingBox();
  expect(shellBox).not.toBeNull();
  expect(shellBox!.width).toBeGreaterThanOrEqual(720);
  expect(shellBox!.width).toBeLessThanOrEqual(800);
  expect(Math.abs(shellBox!.x - (1280 - shellBox!.width) / 2)).toBeLessThanOrEqual(2);

  const editorBoxes = await page.getByTestId("member-editor").evaluateAll((editors) =>
    editors.map((editor) => editor.getBoundingClientRect()),
  );
  expect(editorBoxes).toHaveLength(2);
  expect(Math.abs(editorBoxes[0].top - editorBoxes[1].top)).toBeLessThanOrEqual(2);
  expect(editorBoxes[1].left).toBeGreaterThan(editorBoxes[0].right);
});

test("task9: 减少动态效果偏好会关闭非必要过渡与按压位移", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await chooseStage(page);

  const button = page.getByRole("button", { name: "修改转数" });
  const buttonBox = await button.boundingBox();
  expect(buttonBox).not.toBeNull();
  await page.mouse.move(buttonBox!.x + buttonBox!.width / 2, buttonBox!.y + buttonBox!.height / 2);
  await page.mouse.down();
  const styles = await button.evaluate((element) => {
    const pressed = getComputedStyle(element);
    return {
      duration: pressed.transitionDuration,
      properties: pressed.transitionProperty,
      transform: pressed.transform,
    };
  });
  await page.mouse.up();
  expect(styles.duration.split(",").every((duration) => Number.parseFloat(duration) <= 0.01)).toBe(true);
  expect(styles.properties.split(",").map((property) => property.trim()).every(
    (property) => property === "opacity" || property === "transform",
  )).toBe(true);
  expect(styles.transform).toBe("none");
});
