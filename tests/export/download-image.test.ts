import { describe, expect, it } from "vitest";
import { formatLocalDate } from "../../src/export/download-image";

describe("download image filename", () => {
  it("uses local calendar fields instead of the UTC ISO date", () => {
    const localDate = {
      getFullYear: () => 2026,
      getMonth: () => 0,
      getDate: () => 2,
      toISOString: () => "2026-01-01T16:00:00.000Z",
    } as Date;

    expect(localDate.toISOString().slice(0, 10)).toBe("2026-01-01");
    expect(formatLocalDate(localDate)).toBe("2026-01-02");
  });
});
