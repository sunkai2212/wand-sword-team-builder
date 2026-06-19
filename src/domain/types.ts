export type Profession = "knight" | "fighter" | "warlock" | "sage";
export type SkillKind = "active" | "passive";
export type Stage = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Skill {
  id: string;
  name: string;
  profession: Profession;
  kind: SkillKind;
  stage: Stage;
  icon: string;
}

export type PetId =
  | "qianming"
  | "dark-emperor"
  | "rainbow"
  | "bamboo"
  | "dawn-angel";

export interface Pet {
  id: PetId;
  name: string;
  icon: string;
}
