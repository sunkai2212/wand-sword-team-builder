import { access, readFile } from "node:fs/promises";
import path from "node:path";

import { resolveManifestAsset } from "./asset-paths.mjs";

const root = process.cwd();
const skills = JSON.parse(await readFile("src/data/skills.json", "utf8"));
const pets = JSON.parse(await readFile("src/data/pets.json", "utf8"));
const manifest = JSON.parse(await readFile("data/source-assets.json", "utf8"));
if (!Array.isArray(manifest)) {
  console.error("Asset manifest must be an array.");
  process.exit(1);
}
const professions = ["knight", "fighter", "warlock", "sage"];
const kinds = ["active", "passive"];
const expectedCounts = {
  1: [13, 13],
  2: [6, 5],
  3: [5, 5],
  4: [6, 6],
  5: [6, 6],
  6: [6, 6],
};
const expectedSeventh = {
  fighter: [6, 6],
  knight: [6, 6],
  warlock: [6, 6],
  sage: [5, 7],
};
const requiredPets = [
  ["qianming", "千明灵狗"],
  ["dark-emperor", "暗夜帝王"],
  ["rainbow", "虹彩星灵"],
  ["bamboo", "竹林仙君"],
  ["dawn-angel", "晨曦天使"],
];
const errors = [];

function duplicates(items) {
  return items.filter((item, index) => items.indexOf(item) !== index);
}

for (const id of duplicates(skills.map((skill) => skill.id))) {
  errors.push(`duplicate skill id: ${id}`);
}
for (const id of duplicates(pets.map((pet) => pet.id))) {
  errors.push(`duplicate pet id: ${id}`);
}
for (const skill of skills) {
  if (
    !skill.id ||
    "name" in skill ||
    !professions.includes(skill.profession) ||
    !kinds.includes(skill.kind) ||
    !Number.isInteger(skill.stage) ||
    skill.stage < 1 ||
    skill.stage > 7 ||
    typeof skill.icon !== "string"
  ) {
    errors.push(`invalid skill fields: ${JSON.stringify(skill)}`);
  }
}
for (const [id, name] of requiredPets) {
  const pet = pets.find((candidate) => candidate.id === id);
  if (!pet || pet.name !== name) errors.push(`missing or invalid pet: ${id}`);
}

if (skills.length !== 380) errors.push(`expected 380 skills, found ${skills.length}`);
for (const profession of professions) {
  for (const [stage, expected] of Object.entries(expectedCounts)) {
    for (const [kindIndex, kind] of kinds.entries()) {
      const count = skills.filter(
        (skill) =>
          skill.profession === profession &&
          skill.stage === Number(stage) &&
          skill.kind === kind,
      ).length;
      if (count !== expected[kindIndex]) {
        errors.push(`${profession} stage ${stage} ${kind}: expected ${expected[kindIndex]}, found ${count}`);
      }
    }
  }
  for (const [kindIndex, kind] of kinds.entries()) {
    const count = skills.filter(
      (skill) =>
        skill.profession === profession && skill.stage === 7 && skill.kind === kind,
    ).length;
    if (count !== expectedSeventh[profession][kindIndex]) {
      errors.push(`${profession} stage 7 ${kind}: expected ${expectedSeventh[profession][kindIndex]}, found ${count}`);
    }
  }
  const seventhTotal = skills.filter(
    (skill) => skill.profession === profession && skill.stage === 7,
  ).length;
  if (seventhTotal !== 12) errors.push(`${profession} has ${seventhTotal} seventh-stage skills`);
}
if (pets.length !== 5) errors.push(`expected 5 pets, found ${pets.length}`);

const seenOutputs = new Set();
const manifestOutputs = new Set();
for (const [index, asset] of manifest.entries()) {
  try {
    const resolved = resolveManifestAsset(root, asset, index, seenOutputs);
    manifestOutputs.add(asset.output.replaceAll("\\", "/"));
    await access(resolved.source);
    await access(resolved.output);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
}

const catalogOutputs = new Set(
  [...skills, ...pets].map((entry) => `public${entry.icon}`.replaceAll("\\", "/")),
);
if (manifest.length !== 385) errors.push(`expected 385 manifest entries, found ${manifest.length}`);
for (const output of catalogOutputs) {
  if (!manifestOutputs.has(output)) errors.push(`catalog icon missing from manifest: ${output}`);
}
for (const output of manifestOutputs) {
  if (!catalogOutputs.has(output)) errors.push(`manifest output missing from catalog: ${output}`);
}
if (catalogOutputs.size !== 385 || manifestOutputs.size !== 385) {
  errors.push(`expected one-to-one catalog and manifest outputs (catalog ${catalogOutputs.size}, manifest ${manifestOutputs.size})`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${skills.length} skills, ${pets.length} pets, and ${manifest.length} tracked assets.`);
}
