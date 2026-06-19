import {
  addMember,
  changeProfession,
  countOverStageSkills,
  createTeam,
  moveMember,
  removeMember,
  setPet,
  setSkill,
  setStage,
  type Team,
} from "../domain/team";
import type { Profession, SkillKind, Stage } from "../domain/types";
import { pets, skills } from "../data/catalog";
import { renderBoard } from "./board";
import { renderMemberEditors } from "./member-editor";
import { renderPetPicker, renderProfessionPicker, renderSkillPicker } from "./pickers";
import { renderStageSelector, stageName } from "./stage-selector";

type Picker =
  | { type: "skill"; memberId: string; kind: SkillKind; slot: number }
  | { type: "pet"; memberId: string }
  | { type: "profession"; memberId: string };

export function mountApp(root: HTMLElement, title = "杖剑传说·4v4阵容图"): void {
  let team: Team | null = null;
  let selectedMemberId: string | null = null;
  let stageSelectorOpen = true;
  let professionCell: number | null = null;
  let picker: Picker | null = null;
  let statusMessage = "";

  root.replaceChildren();
  const main = document.createElement("main");
  main.className = "app-shell";
  const content = document.createElement("div");
  const status = document.createElement("p");
  status.className = "status-message";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  main.append(content, status);
  root.append(main);

  function showModal(dialog: HTMLDialogElement): void {
    root.append(dialog);
    dialog.showModal();
  }

  function focusStageTrigger(): void {
    root.querySelector<HTMLButtonElement>('[data-action="change-stage"]')?.focus();
  }

  function focusCell(cell: number): void {
    root.querySelector<HTMLButtonElement>(`[data-testid="board-cell"][data-cell="${cell}"]`)?.focus();
  }

  function findEditor(memberId: string): HTMLElement | undefined {
    return Array.from(root.querySelectorAll<HTMLElement>('[data-testid="member-editor"]'))
      .find((editor) => editor.dataset.memberId === memberId);
  }

  function focusSkillSlot(memberId: string, kind: SkillKind, slot: number): void {
    findEditor(memberId)
      ?.querySelector<HTMLButtonElement>(`[data-testid="skill-slot"][data-kind="${kind}"][data-slot="${slot}"]`)
      ?.focus();
  }

  function focusPetSlot(memberId: string): void {
    findEditor(memberId)?.querySelector<HTMLButtonElement>('[data-testid="pet-slot"]')?.focus();
  }

  function focusProfessionButton(memberId: string): void {
    findEditor(memberId)?.querySelector<HTMLButtonElement>('[data-testid="change-profession"]')?.focus();
  }

  function selectStage(nextStage: Stage): void {
    const shouldRestoreFocus = team !== null;
    if (!team) {
      team = createTeam(nextStage);
    } else {
      const count = countOverStageSkills(team, nextStage, skills);
      if (count > 0 && !window.confirm(`降低转数会清除 ${count} 个超阶技能，是否继续？`)) return;
      team = setStage(team, nextStage, count > 0, skills);
    }
    stageSelectorOpen = false;
    render();
    if (shouldRestoreFocus) focusStageTrigger();
  }

  function selectNewProfession(profession: Profession): void {
    if (!team || professionCell === null) return;
    const cell = professionCell;
    team = addMember(team, cell, profession);
    professionCell = null;
    statusMessage = "";
    render();
    focusCell(cell);
  }

  function cancelNewProfession(): void {
    if (professionCell === null) return;
    const cell = professionCell;
    professionCell = null;
    render();
    focusCell(cell);
  }

  function closePicker(): void {
    const closing = picker;
    picker = null;
    render();
    if (!closing) return;
    if (closing.type === "skill") focusSkillSlot(closing.memberId, closing.kind, closing.slot);
    if (closing.type === "pet") focusPetSlot(closing.memberId);
    if (closing.type === "profession") focusProfessionButton(closing.memberId);
  }

  function handleCellClick(cell: number): void {
    if (!team) return;
    const member = team.members.find((candidate) => candidate.cell === cell);

    if (member) {
      selectedMemberId = selectedMemberId === member.id ? null : member.id;
      statusMessage = "";
      render();
      focusCell(cell);
      return;
    }

    if (selectedMemberId) {
      const selected = team.members.find((candidate) => candidate.id === selectedMemberId);
      if (selected) team = moveMember(team, selected.cell, cell);
      selectedMemberId = null;
      statusMessage = "";
      render();
      focusCell(cell);
      return;
    }

    if (team.members.length >= 4) {
      statusMessage = "队伍已满4人";
      render();
      focusCell(cell);
      return;
    }

    professionCell = cell;
    render();
  }

  function renderOpenPicker(): HTMLDialogElement | null {
    if (!team || !picker) return null;
    const member = team.members.find((candidate) => candidate.id === picker?.memberId);
    if (!member) return null;

    if (picker.type === "skill") {
      const { memberId, kind, slot } = picker;
      return renderSkillPicker({
        member,
        kind,
        slot,
        stage: team.stage,
        catalog: skills,
        onSelect: (skillId) => {
          if (!team) return;
          team = setSkill(team, memberId, kind, slot, skillId);
          statusMessage = "";
          picker = null;
          render();
          focusSkillSlot(memberId, kind, slot);
        },
        onClear: () => {
          if (!team) return;
          team = setSkill(team, memberId, kind, slot, null);
          statusMessage = "";
          picker = null;
          render();
          focusSkillSlot(memberId, kind, slot);
        },
        onClose: closePicker,
        onDuplicate: () => {
          statusMessage = "该技能已装备";
          status.textContent = statusMessage;
        },
      });
    }

    if (picker.type === "pet") {
      const memberId = picker.memberId;
      return renderPetPicker(pets, (petId) => {
        if (!team) return;
        team = setPet(team, memberId, petId);
        statusMessage = "";
        picker = null;
        render();
        focusPetSlot(memberId);
      }, closePicker);
    }

    const memberId = picker.memberId;
    return renderProfessionPicker("更换职业", (profession) => {
      if (!team) return;
      team = changeProfession(team, memberId, profession);
      statusMessage = "";
      picker = null;
      render();
      focusProfessionButton(memberId);
    }, closePicker);
  }

  function render(): void {
    root.querySelectorAll(":scope > dialog").forEach((dialog) => dialog.remove());
    content.replaceChildren();
    status.textContent = statusMessage;
    main.hidden = team === null;

    if (!team) {
      showModal(renderStageSelector(selectStage));
      return;
    }

    const heading = document.createElement("h1");
    heading.textContent = title;
    const toolbar = document.createElement("header");
    toolbar.className = "toolbar";
    const currentStage = document.createElement("p");
    currentStage.textContent = `当前：${stageName(team.stage)}`;
    const changeStageButton = document.createElement("button");
    changeStageButton.type = "button";
    changeStageButton.className = "text-button";
    changeStageButton.dataset.action = "change-stage";
    changeStageButton.textContent = "修改转数";
    changeStageButton.addEventListener("click", () => {
      stageSelectorOpen = true;
      render();
    });
    toolbar.append(currentStage, changeStageButton);

    const board = renderBoard(team, selectedMemberId, { onCellClick: handleCellClick });
    const editors = renderMemberEditors(team, skills, pets, {
      onOpenSkill: (memberId, kind, slot) => {
        picker = { type: "skill", memberId, kind, slot };
        render();
      },
      onOpenPet: (memberId) => {
        picker = { type: "pet", memberId };
        render();
      },
      onChangeProfession: (memberId) => {
        picker = { type: "profession", memberId };
        render();
      },
      onRemove: (memberId) => {
        if (!team || !window.confirm("确定删除这个角色吗？")) return;
        const cell = team.members.find((candidate) => candidate.id === memberId)?.cell;
        team = removeMember(team, memberId);
        if (selectedMemberId === memberId) selectedMemberId = null;
        statusMessage = "";
        render();
        if (cell !== undefined) focusCell(cell);
      },
    });
    content.append(heading, toolbar, board, editors);

    if (stageSelectorOpen) {
      showModal(renderStageSelector(selectStage, {
        onClose: () => {
          stageSelectorOpen = false;
          render();
          focusStageTrigger();
        },
      }));
    } else if (professionCell !== null) {
      showModal(renderProfessionPicker("选择职业", selectNewProfession, cancelNewProfession));
    } else {
      const dialog = renderOpenPicker();
      if (dialog) showModal(dialog);
    }
  }

  render();
}
