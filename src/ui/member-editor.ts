import type { Member, Team } from "../domain/team";
import type { Pet, Skill, SkillKind } from "../domain/types";
import { professionName } from "./board";
import { stageName } from "./stage-selector";

export interface MemberEditorHandlers {
  onOpenSkill: (memberId: string, kind: SkillKind, slot: number) => void;
  onOpenPet: (memberId: string) => void;
  onChangeProfession: (memberId: string) => void;
  onRemove: (memberId: string) => void;
}

function skillLabel(
  member: Member,
  kind: SkillKind,
  slot: number,
  skill: Skill,
  catalog: readonly Skill[],
): string {
  const prefix = kind === "active" ? "战技" : "秘法";
  const peers = catalog.filter(
    (candidate) =>
      candidate.profession === skill.profession &&
      candidate.kind === skill.kind &&
      candidate.stage === skill.stage,
  );
  const iconNumber = peers.findIndex((candidate) => candidate.id === skill.id) + 1;
  return `${prefix}${slot + 1}，${professionName(member.profession)}·${stageName(skill.stage)}·图标${iconNumber}`;
}

function renderSkillSlot(
  member: Member,
  kind: SkillKind,
  slot: number,
  catalog: readonly Skill[],
  handlers: MemberEditorHandlers,
): HTMLButtonElement {
  const prefix = kind === "active" ? "战技" : "秘法";
  const skillId = member[kind][slot];
  const skill = skillId ? catalog.find((candidate) => candidate.id === skillId) : undefined;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "skill-slot";
  button.dataset.testid = "skill-slot";
  button.dataset.kind = kind;
  button.dataset.slot = String(slot);
  if (skill) {
    button.dataset.skillId = skill.id;
    button.setAttribute("aria-label", skillLabel(member, kind, slot, skill, catalog));
    const image = document.createElement("img");
    image.src = skill.icon;
    image.alt = "";
    image.loading = "lazy";
    button.append(image);
  } else {
    button.setAttribute("aria-label", `${prefix}${slot + 1}`);
    const empty = document.createElement("span");
    empty.textContent = `${prefix}${slot + 1}`;
    button.append(empty);
  }
  button.addEventListener("click", () => handlers.onOpenSkill(member.id, kind, slot));
  return button;
}

function renderPetSlot(
  member: Member,
  pets: readonly Pet[],
  handlers: MemberEditorHandlers,
): HTMLButtonElement {
  const pet = pets.find((candidate) => candidate.id === member.petId);
  const button = document.createElement("button");
  button.type = "button";
  button.className = "pet-slot";
  button.dataset.testid = "pet-slot";
  button.setAttribute("aria-label", pet ? `宠物，${pet.name}` : "宠物");
  if (pet) {
    button.dataset.petId = pet.id;
    const image = document.createElement("img");
    image.src = pet.icon;
    image.alt = "";
    image.loading = "lazy";
    const name = document.createElement("span");
    name.textContent = pet.name;
    button.append(image, name);
  } else {
    button.textContent = "宠物";
  }
  button.addEventListener("click", () => handlers.onOpenPet(member.id));
  return button;
}

function renderMember(
  member: Member,
  catalog: readonly Skill[],
  pets: readonly Pet[],
  handlers: MemberEditorHandlers,
): HTMLElement {
  const section = document.createElement("section");
  section.className = "member-editor";
  section.dataset.testid = "member-editor";
  section.dataset.memberId = member.id;
  section.dataset.cell = String(member.cell);
  section.tabIndex = -1;

  const header = document.createElement("header");
  header.className = "member-editor-header";
  const portrait = document.createElement("img");
  portrait.src = `/assets/professions/${member.profession}.svg`;
  portrait.alt = "";
  const title = document.createElement("h2");
  title.textContent = `位置 ${member.cell + 1} · ${professionName(member.profession)}`;
  header.append(portrait, title);

  const skillGroups = document.createElement("div");
  skillGroups.className = "member-skill-groups";
  for (const kind of ["active", "passive"] as const) {
    const group = document.createElement("div");
    const heading = document.createElement("h3");
    heading.textContent = kind === "active" ? "战技" : "秘法";
    const slots = document.createElement("div");
    slots.className = "member-skill-grid";
    for (let slot = 0; slot < 4; slot += 1) {
      slots.append(renderSkillSlot(member, kind, slot, catalog, handlers));
    }
    group.append(heading, slots);
    skillGroups.append(group);
  }

  const petGroup = document.createElement("div");
  petGroup.className = "member-pet-group";
  const petHeading = document.createElement("h3");
  petHeading.textContent = "宠物";
  petGroup.append(petHeading, renderPetSlot(member, pets, handlers));

  const actions = document.createElement("div");
  actions.className = "member-actions";
  const change = document.createElement("button");
  change.type = "button";
  change.className = "text-button";
  change.textContent = "更换职业";
  change.addEventListener("click", () => handlers.onChangeProfession(member.id));
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "text-button danger-button";
  remove.textContent = "删除角色";
  remove.addEventListener("click", () => handlers.onRemove(member.id));
  actions.append(change, remove);

  section.append(header, skillGroups, petGroup, actions);
  return section;
}

export function renderMemberEditors(
  team: Team,
  catalog: readonly Skill[],
  pets: readonly Pet[],
  handlers: MemberEditorHandlers,
): HTMLElement {
  const container = document.createElement("div");
  container.className = "member-editors";
  for (const member of [...team.members].sort((left, right) => left.cell - right.cell)) {
    container.append(renderMember(member, catalog, pets, handlers));
  }
  return container;
}
