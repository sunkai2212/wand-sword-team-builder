import type {
  Pet,
  Profession,
  SkillKind,
  Stage,
} from "./types";

export type Slots = [
  string | null,
  string | null,
  string | null,
  string | null,
];

export interface Member {
  id: string;
  cell: number;
  profession: Profession;
  active: Slots;
  passive: Slots;
  petId: Pet["id"] | null;
}

export interface Team {
  stage: Stage;
  members: Member[];
}

function emptySlots(): Slots {
  return [null, null, null, null];
}

function assertCell(cell: number): void {
  if (!Number.isInteger(cell) || cell < 0 || cell > 19) {
    throw new Error(`Cell must be an integer from 0 to 19; received ${cell}`);
  }
}

function findMember(team: Team, id: string): Member {
  const member = team.members.find((candidate) => candidate.id === id);
  if (!member) throw new Error(`Member not found: ${id}`);
  return member;
}

function replaceMember(team: Team, replacement: Member): Team {
  return {
    ...team,
    members: team.members.map((member) =>
      member.id === replacement.id ? replacement : member,
    ),
  };
}

function nextMemberId(team: Team): string {
  const highest = team.members.reduce((maximum, member) => {
    const match = /^member-(\d+)$/.exec(member.id);
    return match ? Math.max(maximum, Number(match[1])) : maximum;
  }, 0);
  return `member-${highest + 1}`;
}

export function createTeam(stage: Stage): Team {
  return { stage, members: [] };
}

export function addMember(
  team: Team,
  cell: number,
  profession: Profession,
): Team {
  assertCell(cell);
  if (team.members.length >= 4) {
    throw new Error("A team can have at most four members");
  }
  if (team.members.some((member) => member.cell === cell)) {
    throw new Error(`Cell ${cell} is occupied`);
  }

  return {
    ...team,
    members: [
      ...team.members,
      {
        id: nextMemberId(team),
        cell,
        profession,
        active: emptySlots(),
        passive: emptySlots(),
        petId: null,
      },
    ],
  };
}

export function moveMember(team: Team, from: number, to: number): Team {
  const member = team.members.find((candidate) => candidate.cell === from);
  if (!member) throw new Error(`No member at cell ${from}`);
  assertCell(to);
  if (from === to) return { ...team, members: [...team.members] };
  if (team.members.some((candidate) => candidate.cell === to)) {
    throw new Error(`Cell ${to} is occupied`);
  }

  return replaceMember(team, { ...member, cell: to });
}

export function changeProfession(
  team: Team,
  id: string,
  profession: Profession,
): Team {
  const member = findMember(team, id);
  if (member.profession === profession) {
    return { ...team, members: [...team.members] };
  }

  return replaceMember(team, {
    ...member,
    profession,
    active: emptySlots(),
    passive: emptySlots(),
  });
}

export function removeMember(team: Team, id: string): Team {
  findMember(team, id);
  return {
    ...team,
    members: team.members.filter((member) => member.id !== id),
  };
}

export function setSkill(
  team: Team,
  id: string,
  kind: SkillKind,
  slot: number,
  skillId: string | null,
): Team {
  if (!Number.isInteger(slot) || slot < 0 || slot > 3) {
    throw new Error(`Skill slot must be an integer from 0 to 3; received ${slot}`);
  }
  const member = findMember(team, id);
  if (skillId !== null) {
    const otherSkills = [...member.active, ...member.passive].filter(
      (_, index) => index !== slot + (kind === "passive" ? 4 : 0),
    );
    if (otherSkills.includes(skillId)) {
      throw new Error(`Duplicate skill: ${skillId}`);
    }
  }

  const skills: Slots = [...member[kind]];
  skills[slot] = skillId;
  return replaceMember(team, { ...member, [kind]: skills });
}

export function setPet(team: Team, id: string, petId: Pet["id"] | null): Team {
  const member = findMember(team, id);
  return replaceMember(team, { ...member, petId });
}
