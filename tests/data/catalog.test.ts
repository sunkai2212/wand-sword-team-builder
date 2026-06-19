import { describe, expect, it } from "vitest";

import {
  parsePets,
  parseSkills,
  pets,
  skills,
  visibleSkills,
} from "../../src/data/catalog";

const professions = ["knight", "fighter", "warlock", "sage"] as const;

describe("verified catalog", () => {
  it("contains the five supported pets exactly once", () => {
    expect(pets.map((pet) => [pet.id, pet.name])).toEqual([
      ["qianming", "千明灵狗"],
      ["dark-emperor", "暗夜帝王"],
      ["rainbow", "虹彩星灵"],
      ["bamboo", "竹林仙君"],
      ["dawn-angel", "晨曦天使"],
    ]);
    expect(new Set(pets.map((pet) => pet.id)).size).toBe(pets.length);
  });

  it("contains twelve seventh-stage skills for every profession", () => {
    for (const profession of professions) {
      expect(
        skills.filter(
          (skill) => skill.profession === profession && skill.stage === 7,
        ),
      ).toHaveLength(12);
    }
  });

  it("contains the exact verified skill count matrix", () => {
    const expected = {
      1: [13, 13],
      2: [6, 5],
      3: [5, 5],
      4: [6, 6],
      5: [6, 6],
      6: [6, 6],
    } as const;

    expect(skills).toHaveLength(380);
    for (const profession of professions) {
      for (const [stage, [active, passive]] of Object.entries(expected)) {
        expect(
          skills.filter(
            (skill) =>
              skill.profession === profession &&
              skill.stage === Number(stage) &&
              skill.kind === "active",
          ),
        ).toHaveLength(active);
        expect(
          skills.filter(
            (skill) =>
              skill.profession === profession &&
              skill.stage === Number(stage) &&
              skill.kind === "passive",
          ),
        ).toHaveLength(passive);
      }
    }
    const expectedSeventh = {
      knight: [6, 6],
      fighter: [6, 6],
      warlock: [6, 6],
      sage: [5, 7],
    } as const;
    for (const profession of professions) {
      const [active, passive] = expectedSeventh[profession];
      expect(
        skills.filter(
          (skill) =>
            skill.profession === profession &&
            skill.stage === 7 &&
            skill.kind === "active",
        ),
      ).toHaveLength(active);
      expect(
        skills.filter(
          (skill) =>
            skill.profession === profession &&
            skill.stage === 7 &&
            skill.kind === "passive",
        ),
      ).toHaveLength(passive);
    }
  });

  it("does not invent skill names", () => {
    expect(skills.every((skill) => !("name" in skill))).toBe(true);
  });

  it("rejects malformed catalog entries with their index", () => {
    expect(() => parseSkills([{ id: "broken" }])).toThrow(
      /skill catalog entry at index 0/i,
    );
    expect(() => parsePets([{ id: "broken" }])).toThrow(
      /pet catalog entry at index 0/i,
    );
  });

  it("uses globally unique skill ids", () => {
    expect(new Set(skills.map((skill) => skill.id)).size).toBe(skills.length);
  });

  it("filters skills by profession, kind and shared stage", () => {
    const visible = visibleSkills("knight", "active", 6);

    expect(visible.length).toBeGreaterThan(0);
    expect(
      visible.every(
        (skill) =>
          skill.profession === "knight" &&
          skill.kind === "active" &&
          skill.stage <= 6,
      ),
    ).toBe(true);
    expect(visible.some((skill) => skill.stage === 7)).toBe(false);
  });
});
