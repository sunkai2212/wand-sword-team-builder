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

export function trapDialogFocus(dialog: HTMLDialogElement): void {
  dialog.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const buttons = Array.from(dialog.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
    const first = buttons[0];
    const last = buttons.at(-1);
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

export function renderStageSelector(
  onSelect: (stage: Stage) => void,
  options: StageSelectorOptions = {},
): HTMLElement {
  const dialog = document.createElement("dialog");
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
    button.autofocus = stage === 1;
    button.addEventListener("click", () => onSelect(stage as Stage));
    choices.append(button);
  }

  dialog.append(title, choices);
  if (options.onClose) {
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "text-button";
    closeButton.textContent = "关闭";
    closeButton.addEventListener("click", () => {
      dialog.close();
      options.onClose?.();
    });
    dialog.append(closeButton);
  }

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    if (options.onClose) {
      dialog.close();
      options.onClose();
    }
  });
  trapDialogFocus(dialog);
  return dialog;
}
