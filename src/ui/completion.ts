import type { Team } from "../domain/team";
import { completionIssues } from "../domain/validation";

export function completionMessage(team: Team): string {
  const issues = completionIssues(team);
  if (team.members.length === 0) return "请先添加至少 1 名角色";
  if (issues.length === 0) return "阵容配置已完成";

  const missingMembers = 4 - team.members.length;
  const missingSkills = issues.filter((issue) => /:(active|passive):/.test(issue)).length;
  const missingPets = issues.filter((issue) => issue.endsWith(":pet")).length;
  const details: string[] = [];

  if (missingMembers > 0) details.push(`还需要添加 ${missingMembers} 名角色`);
  if (missingSkills > 0 && missingPets > 0) {
    details.push(`还缺 ${missingSkills} 个技能和 ${missingPets} 只宠物`);
  } else if (missingSkills > 0) {
    details.push(`还缺 ${missingSkills} 个技能`);
  } else if (missingPets > 0) {
    details.push(`还缺 ${missingPets} 只宠物`);
  }

  return `当前 ${team.members.length} 名角色，${details.join("，")}；可直接生成`;
}
