import { describe, expect, it } from "vitest";

import {
  addMember,
  changeProfession,
  createTeam,
  moveMember,
  removeMember,
  setPet,
  setSkill,
} from "../../src/domain/team";

describe("team state", () => {
  it("creates an empty team for the selected stage", () => {
    expect(createTeam(7)).toEqual({ stage: 7, members: [] });
  });

  it("allows four members with the same profession and rejects a fifth", () => {
    let team = createTeam(7);
    for (let cell = 0; cell < 4; cell += 1) {
      team = addMember(team, cell, "knight");
    }

    expect(team.members.map((member) => member.profession)).toEqual([
      "knight",
      "knight",
      "knight",
      "knight",
    ]);
    expect(() => addMember(team, 4, "knight")).toThrow(/four members/i);
  });

  it("rejects adding a member outside the board or on an occupied cell", () => {
    const team = addMember(createTeam(7), 0, "knight");

    expect(() => addMember(team, -1, "fighter")).toThrow(/0.*19/);
    expect(() => addMember(team, 20, "fighter")).toThrow(/0.*19/);
    expect(() => addMember(team, 0, "fighter")).toThrow(/occupied/i);
  });

  it("moves a member to an empty cell and treats moving in place as valid", () => {
    const team = addMember(createTeam(7), 3, "knight");
    const moved = moveMember(team, 3, 9);
    const unchanged = moveMember(moved, 9, 9);

    expect(moved.members[0].cell).toBe(9);
    expect(unchanged.members[0].cell).toBe(9);
  });

  it("rejects moving from an empty cell, outside the board, or onto another member", () => {
    const first = addMember(createTeam(7), 1, "knight");
    const team = addMember(first, 2, "fighter");

    expect(() => moveMember(team, 8, 9)).toThrow(/no member/i);
    expect(() => moveMember(team, 1, 20)).toThrow(/0.*19/);
    expect(() => moveMember(team, 1, 2)).toThrow(/occupied/i);
  });

  it("clears skills but preserves pet and cell when profession changes", () => {
    const added = addMember(createTeam(7), 5, "knight");
    const id = added.members[0].id;
    const skilled = setSkill(
      setSkill(added, id, "active", 0, "skill-active"),
      id,
      "passive",
      3,
      "skill-passive",
    );
    const configured = setPet(skilled, id, "qianming");

    const changed = changeProfession(configured, id, "sage");

    expect(changed.members[0]).toMatchObject({
      id,
      cell: 5,
      profession: "sage",
      petId: "qianming",
      active: [null, null, null, null],
      passive: [null, null, null, null],
    });
  });

  it("does not clear configuration when profession is unchanged", () => {
    const added = addMember(createTeam(7), 5, "knight");
    const id = added.members[0].id;
    const configured = setPet(
      setSkill(added, id, "active", 0, "skill-active"),
      id,
      "rainbow",
    );

    const unchanged = changeProfession(configured, id, "knight");

    expect(unchanged.members[0].active[0]).toBe("skill-active");
    expect(unchanged.members[0].petId).toBe("rainbow");
  });

  it("removes an existing member and rejects an unknown id", () => {
    const team = addMember(createTeam(7), 0, "knight");
    const removed = removeMember(team, team.members[0].id);

    expect(removed.members).toEqual([]);
    expect(() => removeMember(team, "missing")).toThrow(/member.*missing/i);
  });

  it("sets and clears skills and validates the slot", () => {
    const team = addMember(createTeam(7), 0, "knight");
    const id = team.members[0].id;
    const skilled = setSkill(team, id, "active", 2, "skill-active");
    const cleared = setSkill(skilled, id, "active", 2, null);

    expect(skilled.members[0].active[2]).toBe("skill-active");
    expect(cleared.members[0].active[2]).toBeNull();
    expect(() => setSkill(team, id, "active", -1, "skill")).toThrow(/0.*3/);
    expect(() => setSkill(team, id, "active", 4, "skill")).toThrow(/0.*3/);
    expect(() => setSkill(team, "missing", "active", 0, "skill")).toThrow(
      /member.*missing/i,
    );
  });

  it("rejects a duplicate skill across active and passive slots but always allows clearing", () => {
    const team = addMember(createTeam(7), 0, "knight");
    const id = team.members[0].id;
    const skilled = setSkill(team, id, "active", 0, "same-skill");

    expect(() =>
      setSkill(skilled, id, "passive", 1, "same-skill"),
    ).toThrow(/duplicate/i);
    expect(() => setSkill(skilled, id, "passive", 1, null)).not.toThrow();
  });

  it("allows multiple members to select the same pet", () => {
    const first = addMember(createTeam(7), 0, "knight");
    const team = addMember(first, 1, "fighter");
    const withFirstPet = setPet(team, team.members[0].id, "bamboo");
    const configured = setPet(
      withFirstPet,
      team.members[1].id,
      "bamboo",
    );

    expect(configured.members.map((member) => member.petId)).toEqual([
      "bamboo",
      "bamboo",
    ]);
    expect(() => setPet(team, "missing", "bamboo")).toThrow(
      /member.*missing/i,
    );
  });

  it("never mutates the input team", () => {
    const empty = createTeam(7);
    const added = addMember(empty, 0, "knight");
    const id = added.members[0].id;
    const skilled = setSkill(added, id, "active", 0, "skill-active");
    const petted = setPet(skilled, id, "dawn-angel");
    const moved = moveMember(petted, 0, 1);
    const changed = changeProfession(moved, id, "fighter");
    const removed = removeMember(changed, id);

    expect(empty.members).toEqual([]);
    expect(added.members[0]).toMatchObject({
      cell: 0,
      profession: "knight",
      active: [null, null, null, null],
      petId: null,
    });
    expect(skilled.members[0]).toMatchObject({
      active: ["skill-active", null, null, null],
      petId: null,
    });
    expect(petted.members[0]).toMatchObject({ cell: 0, petId: "dawn-angel" });
    expect(moved.members[0]).toMatchObject({
      cell: 1,
      profession: "knight",
      active: ["skill-active", null, null, null],
    });
    expect(changed.members[0]).toMatchObject({
      profession: "fighter",
      active: [null, null, null, null],
      petId: "dawn-angel",
    });
    expect(removed.members).toEqual([]);
  });
});
