import type { Member, Team } from "../domain/team";
import type { Profession } from "../domain/types";

const PROFESSIONS: Record<Profession, { name: string; image: string }> = {
  knight: { name: "骑士", image: "/assets/professions/knight.svg" },
  fighter: { name: "斗士", image: "/assets/professions/fighter.svg" },
  warlock: { name: "术士", image: "/assets/professions/warlock.svg" },
  sage: { name: "贤者", image: "/assets/professions/sage.svg" },
};

export interface BoardHandlers {
  onCellClick: (cell: number) => void;
}

export function professionName(profession: Profession): string {
  return PROFESSIONS[profession].name;
}

function renderMember(member: Member): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const image = document.createElement("img");
  image.src = PROFESSIONS[member.profession].image;
  image.alt = "";
  image.setAttribute("aria-hidden", "true");

  const name = document.createElement("span");
  name.textContent = professionName(member.profession);
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

  for (let cell = 0; cell < 20; cell += 1) {
    const member = team.members.find((candidate) => candidate.cell === cell);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "board-cell";
    button.dataset.testid = "board-cell";
    button.dataset.cell = String(cell);
    button.setAttribute("aria-pressed", String(member?.id === selectedMemberId));
    button.setAttribute("aria-label", member ? professionName(member.profession) : `空位${cell + 1}`);
    if (member) button.append(renderMember(member));
    button.addEventListener("click", () => handlers.onCellClick(cell));
    board.append(button);
  }

  return board;
}
