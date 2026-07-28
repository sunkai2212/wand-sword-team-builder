import { memberDisplayName, type Member, type Team } from "../domain/team";
import type { Profession } from "../domain/types";
import { resolveAssetUrl } from "../asset-url";

const PROFESSIONS: Record<Profession, { name: string; image: string }> = {
  knight: { name: "骑士", image: resolveAssetUrl("/assets/professions/knight.webp") },
  fighter: { name: "斗士", image: resolveAssetUrl("/assets/professions/fighter.webp") },
  warlock: { name: "术士", image: resolveAssetUrl("/assets/professions/warlock.webp") },
  sage: { name: "贤者", image: resolveAssetUrl("/assets/professions/sage.webp") },
};

export interface BoardHandlers {
  onCellClick: (cell: number) => void;
  onCellDrop: (from: number, to: number) => void;
}

export function professionName(profession: Profession): string {
  return PROFESSIONS[profession].name;
}

function renderMember(member: Member, label: string): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const image = document.createElement("img");
  image.src = PROFESSIONS[member.profession].image;
  image.alt = "";
  image.setAttribute("aria-hidden", "true");

  const name = document.createElement("span");
  name.textContent = label;
  fragment.append(image, name);
  return fragment;
}

export function renderBoard(
  team: Team,
  selectedMemberId: string | null,
  handlers: BoardHandlers,
): HTMLElement {
  const board = document.createElement("div");
  board.className = "position-board";
  board.dataset.testid = "position-board";
  const memberLabels = new Map(
    [...team.members]
      .sort((left, right) => left.cell - right.cell)
      .map((member, index) => [member.id, memberDisplayName(member, index)]),
  );

  for (let cell = 0; cell < 20; cell += 1) {
    const member = team.members.find((candidate) => candidate.cell === cell);
    const label = member ? memberLabels.get(member.id) ?? memberDisplayName(member, 0) : "";
    const button = document.createElement("button");
    button.type = "button";
    button.className = member ? "board-cell has-member" : "board-cell";
    button.dataset.testid = "board-cell";
    button.dataset.cell = String(cell);
    if (member) button.dataset.memberId = member.id;
    button.setAttribute("aria-pressed", String(member?.id === selectedMemberId));
    button.setAttribute(
      "aria-label",
      member ? `位置 ${cell + 1}，${label}，${professionName(member.profession)}` : `空位${cell + 1}`,
    );
    if (member) button.append(renderMember(member, label));
    let suppressClick = false;
    if (member) {
      button.draggable = true;
      let startX = 0;
      let startY = 0;
      let didDrag = false;

      button.addEventListener("dragstart", (event) => {
        event.dataTransfer?.setData("text/plain", String(cell));
        event.dataTransfer?.setData("application/x-team-builder-cell", String(cell));
        event.dataTransfer?.setDragImage(button, button.offsetWidth / 2, button.offsetHeight / 2);
        button.classList.add("is-drag-source");
      });

      button.addEventListener("dragend", () => {
        button.classList.remove("is-drag-source");
        board.querySelectorAll(".is-drop-target").forEach((element) => {
          element.classList.remove("is-drop-target");
        });
      });

      button.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        startX = event.clientX;
        startY = event.clientY;
        didDrag = false;
        button.setPointerCapture(event.pointerId);
      });

      button.addEventListener("pointermove", (event) => {
        if (!button.hasPointerCapture(event.pointerId)) return;
        const distance = Math.hypot(event.clientX - startX, event.clientY - startY);
        if (distance < 6) return;
        didDrag = true;
        button.classList.add("is-drag-source");
        const target = document.elementFromPoint(event.clientX, event.clientY)
          ?.closest<HTMLButtonElement>('[data-testid="board-cell"]');
        board.querySelectorAll(".is-drop-target").forEach((element) => {
          element.classList.remove("is-drop-target");
        });
        if (target && !target.dataset.memberId) {
          target.classList.add("is-drop-target");
        }
      });

      button.addEventListener("pointerup", (event) => {
        if (!button.hasPointerCapture(event.pointerId)) return;
        button.releasePointerCapture(event.pointerId);
        button.classList.remove("is-drag-source");
        board.querySelectorAll(".is-drop-target").forEach((element) => {
          element.classList.remove("is-drop-target");
        });
        if (!didDrag) return;
        suppressClick = true;
        const target = document.elementFromPoint(event.clientX, event.clientY)
          ?.closest<HTMLButtonElement>('[data-testid="board-cell"]');
        const targetCell = target?.dataset.cell ? Number(target.dataset.cell) : NaN;
        if (Number.isInteger(targetCell)) {
          handlers.onCellDrop(cell, targetCell);
        }
      });

      button.addEventListener("pointercancel", (event) => {
        if (button.hasPointerCapture(event.pointerId)) {
          button.releasePointerCapture(event.pointerId);
        }
        button.classList.remove("is-drag-source");
        board.querySelectorAll(".is-drop-target").forEach((element) => {
          element.classList.remove("is-drop-target");
        });
        suppressClick = didDrag;
      });
    }
    button.addEventListener("dragover", (event) => {
      if (member) return;
      event.preventDefault();
      button.classList.add("is-drop-target");
    });
    button.addEventListener("dragleave", () => {
      button.classList.remove("is-drop-target");
    });
    button.addEventListener("drop", (event) => {
      event.preventDefault();
      button.classList.remove("is-drop-target");
      const sourceCellText = event.dataTransfer?.getData("application/x-team-builder-cell") || "";
      const sourceCell = /^\d+$/.test(sourceCellText) ? Number(sourceCellText) : NaN;
      if (Number.isInteger(sourceCell)) {
        handlers.onCellDrop(sourceCell, cell);
      }
    });
    button.addEventListener("click", (event) => {
      if (member && suppressClick) {
        event.preventDefault();
        suppressClick = false;
        return;
      }
      handlers.onCellClick(cell);
    });
    board.append(button);
  }

  return board;
}
