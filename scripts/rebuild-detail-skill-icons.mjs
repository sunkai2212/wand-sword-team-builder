import { readdir } from "node:fs/promises";
import path from "node:path";

const sharedGroups = new Map([
  ["斗士、骑士一转", "fighter-knight-s1"],
  ["术士、贤者一转", "warlock-sage-s1"],
]);

const professionGroups = new Map([
  ["斗士", "fighter"],
  ["骑士", "knight"],
  ["术士", "warlock"],
  ["贤者", "sage"],
]);

async function listJpegs(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".jpg")
    .map((entry) => path.join(directory, entry.name))
    .sort((left, right) => left.localeCompare(right, "en"));
}

export async function listDetailSkillScreenshots(root) {
  const sourceRoot = path.join(root, "技能图标");
  const groups = await readdir(sourceRoot, { withFileTypes: true });
  const screenshots = [];

  for (const group of groups.filter((entry) => entry.isDirectory())) {
    const sharedGroup = sharedGroups.get(group.name);
    if (sharedGroup) {
      for (const file of await listJpegs(path.join(sourceRoot, group.name))) {
        screenshots.push({ file, group: sharedGroup });
      }
      continue;
    }

    const profession = professionGroups.get(group.name);
    if (!profession) {
      continue;
    }

    const stages = await readdir(path.join(sourceRoot, group.name), { withFileTypes: true });
    for (const stage of stages.filter((entry) => entry.isDirectory())) {
      for (const file of await listJpegs(path.join(sourceRoot, group.name, stage.name))) {
        screenshots.push({ file, group: `${profession}-s${stage.name}` });
      }
    }
  }

  return screenshots.sort((left, right) =>
    left.group.localeCompare(right.group, "en") || left.file.localeCompare(right.file, "en")
  );
}
