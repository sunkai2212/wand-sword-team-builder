import type { Member } from "../domain/team";
import type { Pet, Profession, Skill, SkillKind, Stage } from "../domain/types";
import { professionName } from "./board";
import { stageName, trapDialogFocus } from "./stage-selector";

const PROFESSIONS: Profession[] = ["knight", "fighter", "warlock", "sage"];

function createDialog(titleText: string, titleId: string, onClose: () => void): HTMLDialogElement {
  const dialog = document.createElement("dialog");
  dialog.className = "dialog-panel";
  dialog.setAttribute("aria-labelledby", titleId);
  const title = document.createElement("h2");
  title.id = titleId;
  title.textContent = titleText;
  dialog.append(title);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    dialog.close();
    onClose();
  });
  trapDialogFocus(dialog);
  return dialog;
}

export interface SkillPickerOptions {
  member: Member;
  kind: SkillKind;
  slot: number;
  stage: Stage;
  catalog: readonly Skill[];
  onSelect: (skillId: string) => void;
  onClear: () => void;
  onClose: () => void;
  onDuplicate: () => void;
}

export function renderSkillPicker(options: SkillPickerOptions): HTMLDialogElement {
  const prefix = options.kind === "active" ? "战技" : "秘法";
  const dialog = createDialog(`选择${prefix}${options.slot + 1}`, "skill-picker-title", options.onClose);
  const tabs = document.createElement("div");
  tabs.className = "skill-stage-tabs";
  const grid = document.createElement("div");
  grid.className = "skill-picker-grid";
  const used = new Set([...options.member.active, ...options.member.passive].filter(Boolean));

  function showStage(stage: Stage): void {
    for (const tab of tabs.querySelectorAll<HTMLButtonElement>("button")) {
      tab.setAttribute("aria-pressed", String(tab.dataset.stage === String(stage)));
    }
    grid.replaceChildren();
    const stageSkills = options.catalog.filter(
      (skill) =>
        skill.profession === options.member.profession &&
        skill.kind === options.kind &&
        skill.stage === stage,
    );
    stageSkills.forEach((skill, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "skill-option";
      button.dataset.testid = "skill-option";
      button.dataset.skillId = skill.id;
      button.dataset.stage = String(skill.stage);
      button.dataset.kind = skill.kind;
      button.setAttribute(
        "aria-label",
        `${professionName(skill.profession)}·${stageName(skill.stage)}·图标${index + 1}`,
      );
      const isUsed = used.has(skill.id);
      if (isUsed) button.setAttribute("aria-disabled", "true");
      button.addEventListener("click", () => {
        if (isUsed) {
          options.onDuplicate();
        } else {
          options.onSelect(skill.id);
        }
      });
      const image = document.createElement("img");
      image.src = skill.icon;
      image.alt = "";
      image.loading = "lazy";
      button.append(image);
      grid.append(button);
    });
  }

  for (let stage = 1; stage <= options.stage; stage += 1) {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "stage-tab";
    tab.dataset.testid = "skill-stage-tab";
    tab.dataset.stage = String(stage);
    tab.textContent = stageName(stage as Stage);
    tab.autofocus = stage === options.stage;
    tab.addEventListener("click", () => showStage(stage as Stage));
    tabs.append(tab);
  }
  showStage(options.stage);
  dialog.append(tabs, grid);

  if (options.member[options.kind][options.slot]) {
    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "text-button";
    clear.textContent = "清空此技能";
    clear.addEventListener("click", options.onClear);
    dialog.append(clear);
  }
  return dialog;
}

export function renderPetPicker(
  pets: readonly Pet[],
  onSelect: (petId: Pet["id"]) => void,
  onClose: () => void,
): HTMLDialogElement {
  const dialog = createDialog("选择宠物", "pet-picker-title", onClose);
  const grid = document.createElement("div");
  grid.className = "pet-picker-grid";
  pets.forEach((pet, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pet-option";
    button.dataset.testid = "pet-option";
    button.dataset.petId = pet.id;
    button.setAttribute("aria-label", pet.name);
    button.autofocus = index === 0;
    button.addEventListener("click", () => onSelect(pet.id));
    const image = document.createElement("img");
    image.src = pet.icon;
    image.alt = "";
    image.loading = "lazy";
    const name = document.createElement("span");
    name.textContent = pet.name;
    button.append(image, name);
    grid.append(button);
  });
  dialog.append(grid);
  return dialog;
}

export function renderProfessionPicker(
  titleText: "选择职业" | "更换职业",
  onSelect: (profession: Profession) => void,
  onClose: () => void,
): HTMLDialogElement {
  const dialog = createDialog(titleText, "profession-picker-title", onClose);
  const choices = document.createElement("div");
  choices.className = "profession-choices";
  PROFESSIONS.forEach((profession, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-button";
    button.textContent = professionName(profession);
    button.autofocus = index === 0;
    button.addEventListener("click", () => onSelect(profession));
    choices.append(button);
  });
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "text-button";
  cancel.textContent = "取消";
  cancel.addEventListener("click", onClose);
  dialog.append(choices, cancel);
  return dialog;
}
