import type { Team } from "./team";
import type { Skill, Stage } from "./types";

export function isSkillAllowed(skill: Skill, stage: Stage): boolean {
  return skill.stage <= stage;
}

export function completionIssues(team: Team): string[] {
  const issues: string[] = [];
  const missingMembers = 4 - team.members.length;
  if (missingMembers > 0) issues.push(`members:${missingMembers}`);

  for (const member of team.members) {
    for (const kind of ["active", "passive"] as const) {
      member[kind].forEach((skillId, index) => {
        if (skillId === null) issues.push(`${member.id}:${kind}:${index}`);
      });
    }
    if (member.petId === null) issues.push(`${member.id}:pet`);
  }

  return issues;
}
