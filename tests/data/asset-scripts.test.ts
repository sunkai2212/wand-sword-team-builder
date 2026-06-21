import { execFileSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

const root = process.cwd();
sharp.cache(false);

function runFailure(script: string, cwd: string): string {
  try {
    execFileSync(process.execPath, [path.join(root, script)], {
      cwd,
      encoding: "utf8",
      stdio: "pipe",
    });
  } catch (error) {
    return String((error as { stderr?: string }).stderr ?? error);
  }
  throw new Error(`${script} unexpectedly succeeded`);
}

describe("asset scripts diagnostics", () => {
  it("builds a 380-icon centering sheet with target guides", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "team-builder-centering-"));
    try {
      const output = path.join(temp, "audit.html");
      execFileSync(process.execPath, [
        path.join(root, "scripts/audit-skill-centering.mjs"),
        "--output",
        output,
      ], { cwd: root, stdio: "pipe" });

      const html = await readFile(output, "utf8");
      expect(html.match(/class="skill-card"/g)).toHaveLength(380);
      expect(html).toContain("class=\"target-circle\"");
      expect(html).toContain("data-stage=\"7\"");
      expect(html).toContain("data:image/webp;base64,");
    } finally {
      await rm(temp, { recursive: true, force: true });
    }
  });

  it("does not keep the offset shared crop for stage-seven skills", async () => {
    const manifest = JSON.parse(
      await readFile(path.join(root, "data/source-assets.json"), "utf8"),
    ) as Array<{
      output: string;
      crop: { left: number; top: number; width: number; height: number };
    }>;
    const stageSeven = manifest.filter(
      (entry) => entry.output.includes("/skills/") && entry.output.includes("-s7-"),
    );

    expect(stageSeven).toHaveLength(48);
    expect(stageSeven.some((entry) =>
      entry.crop.left === 780 &&
      entry.crop.top === 900 &&
      entry.crop.width === 240 &&
      entry.crop.height === 240
    )).toBe(false);
  });

  it("applies an optional circular mask to generated assets", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "team-builder-circle-mask-"));
    try {
      await mkdir(path.join(temp, "data/source"), { recursive: true });
      await sharp({
        create: {
          width: 64,
          height: 64,
          channels: 3,
          background: "#ff0000",
        },
      }).png().toFile(path.join(temp, "data/source/solid.png"));
      await writeFile(
        path.join(temp, "data/source-assets.json"),
        JSON.stringify([{
          source: "data/source/solid.png",
          output: "public/assets/masked.webp",
          crop: { left: 0, top: 0, width: 64, height: 64 },
          size: 64,
          mask: "circle",
        }]),
      );

      execFileSync(process.execPath, [path.join(root, "scripts/curate-assets.mjs")], {
        cwd: temp,
        stdio: "pipe",
      });
      const { data, info } = await sharp(path.join(temp, "public/assets/masked.webp"))
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const alpha = (x: number, y: number) => data[(y * info.width + x) * info.channels + 3];

      expect(alpha(0, 0)).toBe(0);
      expect(alpha(32, 32)).toBe(255);
    } finally {
      await rm(temp, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
    }
  });

  it("reports a non-array manifest before curating assets", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "team-builder-curate-schema-"));
    try {
      await mkdir(path.join(temp, "data"), { recursive: true });
      await writeFile(path.join(temp, "data/source-assets.json"), "{}");

      const stderr = runFailure("scripts/curate-assets.mjs", temp);
      expect(stderr).toMatch(/asset manifest must be an array/i);
      expect(stderr).not.toMatch(/TypeError/);
    } finally {
      await rm(temp, { recursive: true, force: true });
    }
  });

  it("reports image processing failures with manifest context", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "team-builder-curate-"));
    try {
      await mkdir(path.join(temp, "data/source"), { recursive: true });
      await writeFile(path.join(temp, "data/source/broken.jpg"), "not an image");
      const asset = {
        source: "data/source/broken.jpg",
        output: "public/assets/broken.webp",
        crop: { left: 1, top: 2, width: 3, height: 4 },
        size: 64,
      };
      await writeFile(
        path.join(temp, "data/source-assets.json"),
        JSON.stringify([asset]),
      );

      const stderr = runFailure("scripts/curate-assets.mjs", temp);
      expect(stderr).toMatch(/entry 0/);
      expect(stderr).toContain(`source=${asset.source}`);
      expect(stderr).toContain(`output=${asset.output}`);
      expect(stderr).toContain(`crop=${JSON.stringify(asset.crop)}`);
    } finally {
      await rm(temp, { recursive: true, force: true });
    }
  });

  it("reports malformed manifest entries without an unhandled TypeError", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "team-builder-validate-"));
    try {
      await mkdir(path.join(temp, "src/data"), { recursive: true });
      await mkdir(path.join(temp, "data"), { recursive: true });
      await copyFile(
        path.join(root, "src/data/skills.json"),
        path.join(temp, "src/data/skills.json"),
      );
      await copyFile(
        path.join(root, "src/data/pets.json"),
        path.join(temp, "src/data/pets.json"),
      );
      await writeFile(
        path.join(temp, "data/source-assets.json"),
        JSON.stringify([{ source: "data/source/broken.jpg" }]),
      );

      const stderr = runFailure("scripts/validate-data.mjs", temp);
      expect(stderr).toMatch(/entry 0.*source=data\/source\/broken\.jpg.*output=<missing>/i);
      expect(stderr).not.toMatch(/TypeError/);
    } finally {
      await rm(temp, { recursive: true, force: true });
    }
  });

  it("reports a non-array manifest as a schema error", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "team-builder-schema-"));
    try {
      await mkdir(path.join(temp, "src/data"), { recursive: true });
      await mkdir(path.join(temp, "data"), { recursive: true });
      await copyFile(
        path.join(root, "src/data/skills.json"),
        path.join(temp, "src/data/skills.json"),
      );
      await copyFile(
        path.join(root, "src/data/pets.json"),
        path.join(temp, "src/data/pets.json"),
      );
      await writeFile(path.join(temp, "data/source-assets.json"), "{}");

      const stderr = runFailure("scripts/validate-data.mjs", temp);
      expect(stderr).toMatch(/asset manifest must be an array/i);
      expect(stderr).not.toMatch(/TypeError/);
    } finally {
      await rm(temp, { recursive: true, force: true });
    }
  });
});
