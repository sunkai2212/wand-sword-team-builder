import petsJson from "./pets.json";
import skillsJson from "./skills.json";
import type { Pet, Profession, Skill, SkillKind, Stage } from "../domain/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isProfession(value: unknown): value is Profession {
  return value === "knight" || value === "fighter" || value === "warlock" || value === "sage";
}

function isSkillKind(value: unknown): value is SkillKind {
  return value === "active" || value === "passive";
}

function isStage(value: unknown): value is Stage {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5 || value === 6 || value === 7;
}

function isPetId(value: unknown): value is Pet["id"] {
  return value === "qianming" || value === "dark-emperor" || value === "rainbow" || value === "bamboo" || value === "dawn-angel";
}

export function parseSkills(value: unknown): Skill[] {
  if (!Array.isArray(value)) throw new Error("Invalid skill catalog: expected an array");

  return value.map((entry, index) => {
    if (
      !isRecord(entry) ||
      typeof entry.id !== "string" ||
      !isProfession(entry.profession) ||
      !isSkillKind(entry.kind) ||
      !isStage(entry.stage) ||
      typeof entry.icon !== "string"
    ) {
      throw new Error(`Invalid skill catalog entry at index ${index}`);
    }
    return {
      id: entry.id,
      profession: entry.profession,
      kind: entry.kind,
      stage: entry.stage,
      icon: entry.icon,
    };
  });
}

export function parsePets(value: unknown): Pet[] {
  if (!Array.isArray(value)) throw new Error("Invalid pet catalog: expected an array");

  return value.map((entry, index) => {
    if (
      !isRecord(entry) ||
      !isPetId(entry.id) ||
      typeof entry.name !== "string" ||
      typeof entry.icon !== "string"
    ) {
      throw new Error(`Invalid pet catalog entry at index ${index}`);
    }
    return { id: entry.id, name: entry.name, icon: entry.icon };
  });
}

export const skills = parseSkills(skillsJson);
export const pets = parsePets(petsJson);

export function visibleSkills(
  profession: Profession,
  kind: SkillKind,
  stage: Stage,
): Skill[] {
  return skills.filter(
    (skill) =>
      skill.profession === profession &&
      skill.kind === kind &&
      skill.stage <= stage,
  );
}
