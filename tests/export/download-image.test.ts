import { describe, expect, it } from "vitest";
import { formatLocalDate } from "../../src/export/download-image";

describe("download image filename", () => {
  it("formats the calendar date from local date fields", () => {
    const localDate = new Date(2026, 0, 2, 23, 59, 58);

    expect(formatLocalDate(localDate)).toBe("2026-01-02");
  });
});
