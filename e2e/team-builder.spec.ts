import { expect, test } from "@playwright/test";

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

  await expect(page.getByRole("button", { name: "骑士", exact: true })).toHaveCount(4);
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
  await expect(page.getByTestId("board-cell").nth(8)).toHaveAccessibleName("骑士");
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
  await expect(page.getByRole("button", { name: "骑士", exact: true })).toHaveCount(1);
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
