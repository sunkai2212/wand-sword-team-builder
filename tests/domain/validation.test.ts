import { describe, expect, it } from "vitest";

import {
  countOverStageSkills,
  setStage,
  type Member,
  type Team,
} from "../../src/domain/team";
import type { Skill } from "../../src/domain/types";
import { completionIssues, isSkillAllowed } from "../../src/domain/validation";

const stageSixActive: Skill = {
  id: "active-6",
  profession: "knight",
  kind: "active",
  stage: 6,
  icon: "active-6.png",
};
const stageSevenActive: Skill = {
  id: "active-7",
  profession: "knight",
  kind: "active",
  stage: 7,
  icon: "active-7.png",
};
const stageSevenPassive: Skill = {
  id: "passive-7",
  profession: "knight",
  kind: "passive",
  stage: 7,
  icon: "passive-7.png",
};
const catalog = [stageSixActive, stageSevenActive, stageSevenPassive];

function configuredTeam(): Team {
  return {
    stage: 7,
    members: [
      {
        id: "member-1",
        cell: 9,
        profession: "knight",
        active: ["active-6", "active-7", null, null],
        passive: ["passive-7", null, null, null],
        petId: "rainbow",
      },
    ],
  };
}

describe("progression validation", () => {
  it("allows only skills at or below the shared stage", () => {
    expect(isSkillAllowed(stageSevenActive, 6)).toBe(false);
    expect(isSkillAllowed(stageSixActive, 6)).toBe(true);
  });

  it("reports four missing members for a new team", () => {
    expect(completionIssues({ stage: 7, members: [] })).toEqual(["members:4"]);
  });

  it("reports each missing skill slot and pet for existing members", () => {
    const configured = configuredTeam();
    const team: Team = {
      ...configured,
      members: [{ ...configured.members[0], petId: null }],
    };

    expect(completionIssues(team)).toEqual([
      "members:3",
      "member-1:active:2",
      "member-1:active:3",
      "member-1:passive:1",
      "member-1:passive:2",
      "member-1:passive:3",
      "member-1:pet",
    ]);
  });

  it("reports no issues for four fully configured members", () => {
    const members: Member[] = Array.from({ length: 4 }, (_, index) => ({
      id: `member-${index}`,
      cell: index,
      profession: "knight" as const,
      active: ["a1", "a2", "a3", "a4"],
      passive: ["p1", "p2", "p3", "p4"],
      petId: "rainbow",
    }));

    expect(completionIssues({ stage: 7, members })).toEqual([]);
  });

  it("requires confirmation before clearing over-stage skills", () => {
    const team = configuredTeam();

    expect(() => setStage(team, 6, false, catalog)).toThrow(
      "Stage change needs confirmation",
    );
    expect(team).toEqual(configuredTeam());
  });

  it("clears only over-stage skills after confirmation", () => {
    const team = configuredTeam();

    const lowered = setStage(team, 6, true, catalog);

    expect(lowered).toEqual({
      stage: 6,
      members: [
        {
          ...team.members[0],
          active: ["active-6", null, null, null],
          passive: [null, null, null, null],
        },
      ],
    });
    expect(lowered.members[0]).toMatchObject({ cell: 9, petId: "rainbow" });
  });

  it("does not clear skills when raising the stage", () => {
    const team = { ...configuredTeam(), stage: 6 as const };

    expect(setStage(team, 7, false, catalog)).toEqual({ ...team, stage: 7 });
  });

  it("lowers without confirmation when no skill is over-stage", () => {
    const team: Team = {
      ...configuredTeam(),
      members: [{ ...configuredTeam().members[0], active: ["active-6", null, null, null], passive: [null, null, null, null] }],
    };

    expect(setStage(team, 6, false, catalog)).toEqual({ ...team, stage: 6 });
  });

  it("reports an unknown selected skill clearly", () => {
    const team: Team = {
      ...configuredTeam(),
      members: [{ ...configuredTeam().members[0], active: ["missing", null, null, null], passive: [null, null, null, null] }],
    };

    expect(() => countOverStageSkills(team, 6, catalog)).toThrow(
      /skill.*missing.*catalog/i,
    );
    expect(() => setStage(team, 6, false, catalog)).toThrow(
      /skill.*missing.*catalog/i,
    );
  });

  it("counts the slots that lowering would clear", () => {
    expect(countOverStageSkills(configuredTeam(), 6, catalog)).toBe(2);
  });

  it("counts zero when a stage change would preserve all slots", () => {
    const team = { ...configuredTeam(), stage: 6 as const };

    expect(countOverStageSkills(team, 6, catalog)).toBe(0);
    expect(countOverStageSkills(team, 7, catalog)).toBe(0);
  });

  it("does not mutate the team or catalog", () => {
    const team = configuredTeam();
    const originalTeam = structuredClone(team);
    const originalCatalog = structuredClone(catalog);

    setStage(team, 6, true, catalog);

    expect(team).toEqual(originalTeam);
    expect(catalog).toEqual(originalCatalog);
  });

  it("rejects invalid runtime stages", () => {
    for (const stage of [0, 8, 1.5, Number.NaN]) {
      expect(() =>
        setStage(configuredTeam(), stage as never, true, catalog),
      ).toThrow(/stage.*integer.*1.*7/i);
    }
  });
});
