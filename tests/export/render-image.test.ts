import { describe, expect, it } from "vitest";
import type { Member } from "../../src/domain/team";
import {
  calculateExportHeight,
  EXPORT_ACCENT_ROLES,
  EXPORT_PALETTE,
  EXPORT_WIDTH,
  orderedMembers,
} from "../../src/export/render-image";

function member(cell: number): Member {
  return {
    id: `member-${cell}`,
    cell,
    profession: "knight",
    active: [null, null, null, null],
    passive: [null, null, null, null],
    petId: null,
  };
}

describe("image export layout", () => {
  it("exposes a muted amber accent for restrained export details", () => {
    expect(EXPORT_PALETTE.accent).toBe("#9a7441");
    expect(EXPORT_ACCENT_ROLES).toEqual({
      titleRule: "accent",
      sectionHeading: "accent",
    });
  });

  it("uses a fixed 1080 pixel width", () => {
    expect(EXPORT_WIDTH).toBe(1080);
  });

  it("grows monotonically from one to four configured members", () => {
    const heights = [1, 2, 3, 4].map(calculateExportHeight);

    expect(heights[0]).toBeGreaterThanOrEqual(1000);
    expect(heights[3]).toBeGreaterThanOrEqual(1600);
    expect(heights[3]).toBeLessThanOrEqual(2000);
    expect(heights).toEqual([...heights].sort((left, right) => left - right));
    expect(new Set(heights).size).toBe(4);
  });

  it("orders members by board cell without modifying the input", () => {
    const input = [member(19), member(1), member(5), member(4)];
    const snapshot = input.map((entry) => entry.cell);

    expect(orderedMembers(input).map((entry) => entry.cell)).toEqual([1, 4, 5, 19]);
    expect(input.map((entry) => entry.cell)).toEqual(snapshot);
  });
});
