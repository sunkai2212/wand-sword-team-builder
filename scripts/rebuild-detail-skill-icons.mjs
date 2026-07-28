import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

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

const labelCrop = { left: 140, top: 860, width: 240, height: 140 };

async function labelSignature(file) {
  const { data, info } = await sharp(file)
    .extract(labelCrop)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const signature = new Uint8Array(info.width * info.height);
  for (let index = 0; index < signature.length; index += 1) {
    const offset = index * info.channels;
    signature[index] = data[offset] > 190 && data[offset + 1] > 190 && data[offset + 2] > 190
      ? 1
      : 0;
  }
  return signature;
}

function signatureDistance(left, right) {
  let distance = 0;
  for (let index = 0; index < left.length; index += 1) {
    distance += left[index] === right[index] ? 0 : 1;
  }
  return distance;
}

function groupForOutput(output) {
  const match = output.match(/\/(fighter|knight|warlock|sage)-s([1-6])-(active|passive)-/);
  if (!match) {
    return null;
  }
  const [, profession, stage] = match;
  if (stage === "1") {
    return profession === "fighter" || profession === "knight"
      ? "fighter-knight-s1"
      : "warlock-sage-s1";
  }
  return `${profession}-s${stage}`;
}

async function activeCountByGroup(root) {
  const manifest = JSON.parse(
    await readFile(path.join(root, "data", "source-assets.json"), "utf8"),
  );
  const counts = new Map();
  for (const asset of manifest) {
    if (
      asset.output.includes("/skills/knight-s1-") ||
      asset.output.includes("/skills/sage-s1-")
    ) {
      continue;
    }
    const group = groupForOutput(asset.output);
    if (!group || !asset.output.includes("-active-")) {
      continue;
    }
    counts.set(group, (counts.get(group) ?? 0) + 1);
  }
  return counts;
}

export async function classifyDetailSkillKinds(root) {
  const screenshots = await listDetailSkillScreenshots(root);
  const fighterStageTwo = screenshots.filter((file) => file.group === "fighter-s2");
  const [activeReference, passiveReference] = fighterStageTwo;
  if (!activeReference || !passiveReference) {
    throw new Error("Fighter stage-two screenshots are required to classify skill kinds.");
  }

  const activeTemplate = await labelSignature(activeReference.file);
  const passiveTemplate = await labelSignature(passiveReference.file);

  const candidates = await Promise.all(screenshots.map(async (screenshot) => {
    const signature = await labelSignature(screenshot.file);
    return {
      ...screenshot,
      activeScore: signatureDistance(signature, passiveTemplate) - signatureDistance(signature, activeTemplate),
    };
  }));
  const expectedActive = await activeCountByGroup(root);
  const classified = [];

  for (const group of new Set(candidates.map((candidate) => candidate.group))) {
    const groupCandidates = candidates
      .filter((candidate) => candidate.group === group)
      .sort((left, right) => right.activeScore - left.activeScore || left.file.localeCompare(right.file, "en"));
    const activeCount = expectedActive.get(group);
    if (activeCount === undefined || activeCount > groupCandidates.length) {
      throw new Error(`Cannot classify supplied screenshots for ${group}.`);
    }
    classified.push(...groupCandidates.map((candidate, index) => ({
      file: candidate.file,
      group: candidate.group,
      kind: index < activeCount ? "active" : "passive",
    })));
  }

  return classified.sort((left, right) =>
    left.group.localeCompare(right.group, "en") || left.file.localeCompare(right.file, "en")
  );
}
