import { addMember, createTeam, moveMember, setStage, type Team } from "../domain/team";
import type { Profession, Stage } from "../domain/types";
import { skills } from "../data/catalog";
import { renderBoard, professionName } from "./board";
import { renderStageSelector, stageName, trapDialogFocus } from "./stage-selector";

const PROFESSIONS: Profession[] = ["knight", "fighter", "warlock", "sage"];

export function mountApp(root: HTMLElement, title = "杖剑传说·4v4阵容图"): void {
  let team: Team | null = null;
  let selectedMemberId: string | null = null;
  let stageSelectorOpen = true;
  let professionCell: number | null = null;
  let statusMessage = "";

  function showModal(dialog: HTMLElement): void {
    root.append(dialog);
    (dialog as HTMLDialogElement).showModal();
  }

  function focusStageTrigger(): void {
    root.querySelector<HTMLButtonElement>('[data-action="change-stage"]')?.focus();
  }

  function selectStage(stage: Stage): void {
    const shouldRestoreFocus = team !== null;
    team = team ? setStage(team, stage, true, skills) : createTeam(stage);
    stageSelectorOpen = false;
    render();
    if (shouldRestoreFocus) focusStageTrigger();
  }

  function selectProfession(profession: Profession): void {
    if (!team || professionCell === null) return;
    team = addMember(team, professionCell, profession);
    professionCell = null;
    statusMessage = "";
    render();
  }

  function handleCellClick(cell: number): void {
    if (!team) return;
    const member = team.members.find((candidate) => candidate.cell === cell);

    if (member) {
      selectedMemberId = selectedMemberId === member.id ? null : member.id;
      statusMessage = "";
      render();
      return;
    }

    if (selectedMemberId) {
      const selected = team.members.find((candidate) => candidate.id === selectedMemberId);
      if (selected) team = moveMember(team, selected.cell, cell);
      selectedMemberId = null;
      statusMessage = "";
      render();
      return;
    }

    if (team.members.length >= 4) {
      statusMessage = "队伍已满4人";
      render();
      return;
    }

    professionCell = cell;
    render();
  }

  function renderProfessionSelector(): HTMLElement {
    const dialog = document.createElement("dialog");
    dialog.className = "dialog-panel";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "profession-selector-title");

    const titleElement = document.createElement("h2");
    titleElement.id = "profession-selector-title";
    titleElement.textContent = "选择职业";
    const choices = document.createElement("div");
    choices.className = "profession-choices";
    for (const profession of PROFESSIONS) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice-button";
      button.textContent = professionName(profession);
      button.autofocus = profession === "knight";
      button.addEventListener("click", () => selectProfession(profession));
      choices.append(button);
    }
    dialog.append(titleElement, choices);
    dialog.addEventListener("cancel", (event) => event.preventDefault());
    trapDialogFocus(dialog);
    return dialog;
  }

  function render(): void {
    root.replaceChildren();

    if (!team) {
      showModal(renderStageSelector(selectStage));
      return;
    }

    const main = document.createElement("main");
    main.className = "app-shell";
    const heading = document.createElement("h1");
    heading.textContent = title;

    const toolbar = document.createElement("header");
    toolbar.className = "toolbar";
    const currentStage = document.createElement("p");
    currentStage.textContent = `当前：${stageName(team.stage)}`;
    const changeStage = document.createElement("button");
    changeStage.type = "button";
    changeStage.className = "text-button";
    changeStage.dataset.action = "change-stage";
    changeStage.textContent = "修改转数";
    changeStage.addEventListener("click", () => {
      stageSelectorOpen = true;
      render();
    });
    toolbar.append(currentStage, changeStage);

    const status = document.createElement("p");
    status.className = "status-message";
    status.setAttribute("role", "status");
    status.textContent = statusMessage;

    main.append(heading, toolbar, renderBoard(team, selectedMemberId, { onCellClick: handleCellClick }), status);
    root.append(main);

    if (stageSelectorOpen) {
      showModal(renderStageSelector(selectStage, {
        onClose: () => {
          stageSelectorOpen = false;
          render();
          focusStageTrigger();
        },
      }));
    } else if (professionCell !== null) {
      showModal(renderProfessionSelector());
    }
  }

  render();
}
