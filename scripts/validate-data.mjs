import { access, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const skills = JSON.parse(await readFile("src/data/skills.json", "utf8"));
const pets = JSON.parse(await readFile("src/data/pets.json", "utf8"));
const professions = new Set(["knight", "fighter", "warlock", "sage"]);
const kinds = new Set(["active", "passive"]);
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
  if (!skill.id || !skill.name || !professions.has(skill.profession)) {
    errors.push(`invalid skill fields: ${JSON.stringify(skill)}`);
  }
  if (!kinds.has(skill.kind) || !Number.isInteger(skill.stage) || skill.stage < 1 || skill.stage > 7) {
    errors.push(`invalid skill kind or stage: ${skill.id}`);
  }
  try {
    await access(path.join(root, "public", skill.icon));
  } catch {
    errors.push(`missing skill icon: ${skill.icon}`);
  }
}
for (const [id, name] of requiredPets) {
  const pet = pets.find((candidate) => candidate.id === id);
  if (!pet || pet.name !== name) errors.push(`missing or invalid pet: ${id}`);
}
for (const pet of pets) {
  try {
    await access(path.join(root, "public", pet.icon));
  } catch {
    errors.push(`missing pet icon: ${pet.icon}`);
  }
}
for (const profession of professions) {
  const count = skills.filter(
    (skill) => skill.profession === profession && skill.stage === 7,
  ).length;
  if (count !== 12) errors.push(`${profession} has ${count} seventh-stage skills`);
}

if (pets.length !== 5) errors.push(`expected 5 pets, found ${pets.length}`);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${skills.length} skills and ${pets.length} pets.`);
}
