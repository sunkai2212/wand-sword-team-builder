import { access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const professions = ["knight", "fighter", "warlock", "sage"] as const;

describe("profession official assets", () => {
  it("keeps stable source images and optimized webp outputs for every profession", async () => {
    for (const profession of professions) {
      const source = path.join(root, "data/source/professions", `${profession}.jpg`);
      const output = path.join(root, "public/assets/professions", `${profession}.webp`);

      await expect(access(source)).resolves.toBeUndefined();
      await expect(access(output)).resolves.toBeUndefined();

      const metadata = await sharp(output).metadata();
      expect(metadata).toMatchObject({
        format: "webp",
        width: 512,
        height: 512,
      });
    }
  });
});
