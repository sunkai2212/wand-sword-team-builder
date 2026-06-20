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

  it("uses explicit heights for teams of one through four members", () => {
    expect(calculateExportHeight(1)).toBe(1210);
    expect(calculateExportHeight(2)).toBe(1416);
    expect(calculateExportHeight(3)).toBe(1622);
    expect(calculateExportHeight(4)).toBe(1828);
  });

  it("keeps the final member row inside every supported canvas height", () => {
    const canvasHeights = [1210, 1416, 1622, 1828];
    const finalRowBottoms = [1160, 1366, 1572, 1778];

    finalRowBottoms.forEach((bottom, index) => {
      expect(bottom).toBeLessThan(canvasHeights[index]);
      expect(canvasHeights[index] - bottom).toBe(50);
    });
  });

  it("orders members by board cell without modifying the input", () => {
    const input = [member(19), member(1), member(5), member(4)];
    const snapshot = input.map((entry) => entry.cell);

    expect(orderedMembers(input).map((entry) => entry.cell)).toEqual([1, 4, 5, 19]);
    expect(input.map((entry) => entry.cell)).toEqual(snapshot);
  });
});
