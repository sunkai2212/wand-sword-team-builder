import type { Stage } from "../domain/types";

const STAGE_NAMES: Record<Stage, string> = {
  1: "一转",
  2: "二转",
  3: "三转",
  4: "四转",
  5: "五转",
  6: "六转",
  7: "七转",
};

export interface StageSelectorOptions {
  onClose?: () => void;
}

export function stageName(stage: Stage): string {
  return STAGE_NAMES[stage];
}

export function renderStageSelector(
  onSelect: (stage: Stage) => void,
  options: StageSelectorOptions = {},
): HTMLElement {
  const overlay = document.createElement("div");
  overlay.className = "dialog-overlay";

  const dialog = document.createElement("section");
  dialog.className = "dialog-panel";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "stage-selector-title");

  const title = document.createElement("h2");
  title.id = "stage-selector-title";
  title.textContent = "选择当前转数";

  const choices = document.createElement("div");
  choices.className = "stage-choices";
  for (let stage = 1; stage <= 7; stage += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-button";
    button.textContent = stageName(stage as Stage);
    button.addEventListener("click", () => onSelect(stage as Stage));
    choices.append(button);
  }

  dialog.append(title, choices);
  if (options.onClose) {
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "text-button";
    closeButton.textContent = "关闭";
    closeButton.addEventListener("click", options.onClose);
    dialog.append(closeButton);
  }

  overlay.append(dialog);
  return overlay;
}
