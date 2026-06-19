import petsJson from "./pets.json";
import skillsJson from "./skills.json";
import type { Pet, Profession, Skill, SkillKind, Stage } from "../domain/types";

export const skills = skillsJson as Skill[];
export const pets = petsJson as Pet[];

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
