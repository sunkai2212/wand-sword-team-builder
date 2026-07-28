import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
// @ts-expect-error This test intentionally imports the plain-JavaScript asset curation script.
import * as detailCropScript from "../../scripts/rebuild-detail-skill-icons.mjs";

type DetailSkillKind = "active" | "passive";
type DetailScreenshot = { file: string; group: string; kind?: DetailSkillKind };
type DetailMapping = { source: string; output: string; kind: DetailSkillKind };
type DetailCrop = { left: number; top: number; width: number; height: number };

const {
  buildDetailSkillMapping,
  classifyDetailSkillKinds,
  detailPassiveIconCrop,
  listDetailSkillScreenshots,
  writeCroppedDetailSource,
} = detailCropScript as unknown as {
  buildDetailSkillMapping(root: string): Promise<DetailMapping[]>;
  classifyDetailSkillKinds(root: string): Promise<Array<DetailScreenshot & { kind: DetailSkillKind }>>;
  detailPassiveIconCrop: DetailCrop;
  listDetailSkillScreenshots(root: string): Promise<DetailScreenshot[]>;
  writeCroppedDetailSource(source: string, output: string, crop?: DetailCrop): Promise<void>;
};

const root = process.cwd();
// Original phone screenshots are intentionally local-only; committed compact sources
// remain validated below in every environment, including GitHub Actions.
const withSuppliedDetailScreenshots = existsSync(path.join(root, "技能图标")) ? it : it.skip;
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
  withSuppliedDetailScreenshots("finds every supplied non-seventh detail screenshot by profession and turn", async () => {
    const screenshots = await listDetailSkillScreenshots(root);

    expect(screenshots).toHaveLength(280);
    expect(screenshots.filter((file) => file.group === "fighter-knight-s1")).toHaveLength(26);
    expect(screenshots.filter((file) => file.group === "warlock-sage-s1")).toHaveLength(26);
    expect(screenshots.filter((file) => file.group === "fighter-s2")).toHaveLength(11);
    expect(screenshots.filter((file) => file.group === "sage-s6")).toHaveLength(12);
  });

  withSuppliedDetailScreenshots("separates active and passive screenshots within a single turn", async () => {
    const screenshots = await classifyDetailSkillKinds(root);
    const fighterStageTwo = screenshots.filter((file) => file.group === "fighter-s2");

    expect(fighterStageTwo).toHaveLength(11);
    expect(fighterStageTwo.filter((file) => file.kind === "active")).toHaveLength(6);
    expect(fighterStageTwo.filter((file) => file.kind === "passive")).toHaveLength(5);
  });

  withSuppliedDetailScreenshots("preserves the active and passive count for every supplied skill group", async () => {
    const screenshots = await classifyDetailSkillKinds(root);
    const expected = {
      "fighter-knight-s1": [13, 13],
      "fighter-s2": [6, 5], "fighter-s3": [5, 5], "fighter-s4": [6, 6],
      "fighter-s5": [6, 6], "fighter-s6": [6, 6],
      "knight-s2": [6, 5], "knight-s3": [5, 5], "knight-s4": [6, 6],
      "knight-s5": [6, 6], "knight-s6": [6, 6],
      "warlock-sage-s1": [13, 13],
      "warlock-s2": [6, 5], "warlock-s3": [5, 5], "warlock-s4": [6, 6],
      "warlock-s5": [6, 6], "warlock-s6": [6, 6],
      "sage-s2": [6, 5], "sage-s3": [5, 5], "sage-s4": [6, 6],
      "sage-s5": [6, 6], "sage-s6": [6, 6],
    } as const;

    for (const [group, [active, passive]] of Object.entries(expected)) {
      const entries = screenshots.filter((file) => file.group === group);
      expect(entries.filter((file) => file.kind === "active"), group).toHaveLength(active);
      expect(entries.filter((file) => file.kind === "passive"), group).toHaveLength(passive);
    }
  });

  withSuppliedDetailScreenshots("maps every non-seventh output to a screenshot of the same skill kind", async () => {
    const mapping = await buildDetailSkillMapping(root);
    const fighterStageOne = mapping.filter((entry) => entry.output.includes("/fighter-s1-"));
    const knightStageOne = mapping.filter((entry) => entry.output.includes("/knight-s1-"));

    expect(mapping).toHaveLength(332);
    expect(mapping.some((entry) => entry.output.includes("-s7-"))).toBe(false);
    expect(mapping.every((entry) => entry.output.includes(`-${entry.kind}-`))).toBe(true);
    expect(fighterStageOne.map((entry) => entry.source))
      .toEqual(knightStageOne.map((entry) => entry.source));
  });

  it("uses the seventh-turn reference frame for the fighter second-turn sample", async () => {
    const manifest = JSON.parse(
      await readFile(path.join(root, "data/source-assets.json"), "utf8"),
    ) as Array<{
      source: string;
      output: string;
      crop: { left: number; top: number; width: number; height: number };
      mask?: string;
      maskRadiusRatio?: number;
      sharpen?: boolean;
      quality?: number;
    }>;
    const entries = manifest.filter((entry) => entry.output.includes("/skills/fighter-s2-"));

    expect(entries).toHaveLength(11);
    expect(entries.every((entry) => entry.source.startsWith("data/source/manual/detail/fighter/s2/"))).toBe(true);
    expect(entries.every((entry) => entry.crop.left === 0 && entry.crop.top === 0)).toBe(true);
    expect(entries.filter((entry) => entry.output.includes("-active-")).every((entry) =>
      entry.crop.width === 236 && entry.crop.height === 236
    )).toBe(true);
    expect(entries.filter((entry) => entry.output.includes("-passive-")).every((entry) =>
      entry.crop.width === 166 && entry.crop.height === 166
    )).toBe(true);
    expect(entries.every((entry) => entry.mask === "circle" && entry.maskRadiusRatio === undefined)).toBe(true);
    expect(entries.every((entry) => entry.sharpen === true && entry.quality === 95)).toBe(true);
  });

  it("stores the seventh-turn reference crop as a compact stable source", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "team-builder-detail-source-"));
    try {
      const source = path.join(temp, "detail.jpg");
      const output = path.join(temp, "stable.jpg");
      await sharp({
        create: { width: 1320, height: 2868, channels: 3, background: "#000000" },
      }).composite([{
        input: await sharp({
          create: { width: 236, height: 236, channels: 3, background: "#ff0000" },
        }).png().toBuffer(),
        left: 768,
        top: 887,
      }]).jpeg().toFile(source);

      await writeCroppedDetailSource(source, output);
      const { data, info } = await sharp(output).raw().toBuffer({ resolveWithObject: true });

      expect(info).toMatchObject({ width: 236, height: 236 });
      expect(data[(100 * info.width + 100) * info.channels]).toBeGreaterThan(200);
    } finally {
      await rm(temp, { recursive: true, force: true });
    }
  });

  it("uses the smaller seventh-turn reference crop for a passive detail screenshot", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "team-builder-passive-detail-source-"));
    try {
      const source = path.join(temp, "detail.jpg");
      const output = path.join(temp, "stable.jpg");
      await sharp({
        create: { width: 1320, height: 2868, channels: 3, background: "#000000" },
      }).composite([{
        input: await sharp({
          create: { width: 166, height: 166, channels: 3, background: "#00ff00" },
        }).png().toBuffer(),
        left: detailPassiveIconCrop.left,
        top: detailPassiveIconCrop.top,
      }]).jpeg().toFile(source);

      await writeCroppedDetailSource(source, output, detailPassiveIconCrop);
      const { data, info } = await sharp(output).raw().toBuffer({ resolveWithObject: true });

      expect(info).toMatchObject({ width: 166, height: 166 });
      expect(data[(80 * info.width + 80) * info.channels + 1]).toBeGreaterThan(200);
    } finally {
      await rm(temp, { recursive: true, force: true });
    }
  });

  it("uses compact detail sources for every non-seventh skill and leaves seventh-turn entries unchanged", async () => {
    const manifest = JSON.parse(
      await readFile(path.join(root, "data/source-assets.json"), "utf8"),
    ) as Array<{
      source: string;
      output: string;
      crop: { left: number; top: number; width: number; height: number };
      mask?: string;
      maskRadiusRatio?: number;
      sharpen?: boolean;
      quality?: number;
    }>;
    const skills = manifest.filter((entry) => entry.output.includes("/skills/"));
    const nonSeventh = skills.filter((entry) => !entry.output.includes("-s7-"));
    const seventh = skills.filter((entry) => entry.output.includes("-s7-"));

    expect(nonSeventh).toHaveLength(332);
    expect(nonSeventh.every((entry) => entry.source.startsWith("data/source/manual/detail/"))).toBe(true);
    expect(nonSeventh.every((entry) => entry.crop.left === 0 && entry.crop.top === 0)).toBe(true);
    expect(nonSeventh.filter((entry) => entry.output.includes("-active-")).every((entry) =>
      entry.crop.width === 236 && entry.crop.height === 236
    )).toBe(true);
    expect(nonSeventh.filter((entry) => entry.output.includes("-passive-")).every((entry) =>
      entry.crop.width === 166 && entry.crop.height === 166
    )).toBe(true);
    expect(nonSeventh.every((entry) =>
      entry.mask === "circle" && entry.maskRadiusRatio === undefined && entry.sharpen && entry.quality === 95
    )).toBe(true);
    expect(seventh).toHaveLength(48);
    expect(seventh.every((entry) => !entry.source.startsWith("data/source/manual/detail/"))).toBe(true);
  });

  it("maps the glowblade reference source to knight sixth-turn active four", async () => {
    const source = await readFile(path.join(root, "data/source/manual/detail/knight/s6/active-4.jpg"));

    expect(createHash("sha256").update(source).digest("hex"))
      .toBe("847e74e81d011641c44d55a39e9a8e6fc8c079b7bad14db55d5be3613d244e69");
  });

  it("keeps knight sixth-turn active one as the blue water icon", async () => {
    const { data, info } = await sharp(
      path.join(root, "public/assets/skills/knight-s6-active-1.webp"),
    ).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let visible = 0;
    let cool = 0;

    for (let index = 0; index < data.length; index += info.channels) {
      const [red, green, blue, alpha] = data.subarray(index, index + info.channels);
      if (alpha < 128) continue;
      visible += 1;
      if (blue > red * 1.25 && blue > green * 1.05 && blue > 100) cool += 1;
    }

    expect(cool / visible).toBeGreaterThan(0.2);
  });

  it("keeps knight sixth-turn active four as the warm-spectrum glowblade icon", async () => {
    const { data, info } = await sharp(
      path.join(root, "public/assets/skills/knight-s6-active-4.webp"),
    ).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let visible = 0;
    let warm = 0;
    let cool = 0;

    for (let index = 0; index < data.length; index += info.channels) {
      const [red, green, blue, alpha] = data.subarray(index, index + info.channels);
      if (alpha < 128) continue;
      visible += 1;
      if (red > blue * 1.35 && green > blue * 1.1 && red > 100) warm += 1;
      if (blue > red * 1.25 && blue > green * 1.05 && blue > 100) cool += 1;
    }

    expect(warm / visible).toBeGreaterThan(0.2);
    expect(cool / visible).toBeLessThan(0.1);
  });

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

  it("uses the shared circular frame for every skill icon", async () => {
    const manifest = JSON.parse(
      await readFile(path.join(root, "data/source-assets.json"), "utf8"),
    ) as Array<{ output: string; mask?: string }>;
    const skills = manifest.filter((entry) => entry.output.includes("/skills/"));

    expect(skills).toHaveLength(380);
    expect(skills.every((entry) => entry.mask === "circle")).toBe(true);
  });

  it("uses compact detail sources for stage-two warlock icons", async () => {
    const manifest = JSON.parse(
      await readFile(path.join(root, "data/source-assets.json"), "utf8"),
    ) as Array<{
      source: string;
      output: string;
      crop: { left: number; top: number; width: number; height: number };
      maskRadiusRatio?: number;
      sharpen?: boolean;
      quality?: number;
    }>;
    const warlockStageTwo = manifest.filter((entry) =>
      entry.output.includes("/skills/warlock-s2-")
    );

    expect(warlockStageTwo).toHaveLength(11);
    expect(warlockStageTwo.every((entry) =>
      entry.source.startsWith("data/source/manual/detail/warlock/s2/")
    )).toBe(true);
    expect(warlockStageTwo.every((entry) => entry.crop.left === 0 && entry.crop.top === 0)).toBe(true);
    expect(warlockStageTwo.filter((entry) => entry.output.includes("-active-")).every((entry) =>
      entry.crop.width === 236 && entry.crop.height === 236
    )).toBe(true);
    expect(warlockStageTwo.filter((entry) => entry.output.includes("-passive-")).every((entry) =>
      entry.crop.width === 166 && entry.crop.height === 166
    )).toBe(true);
    expect(warlockStageTwo.every((entry) => entry.maskRadiusRatio === undefined)).toBe(true);
    expect(warlockStageTwo.every((entry) => entry.sharpen === true)).toBe(true);
    expect(warlockStageTwo.every((entry) => entry.quality === 95)).toBe(true);
  });

  it("uses compact detail sources for knight icons without changing stage seven", async () => {
    const manifest = JSON.parse(
      await readFile(path.join(root, "data/source-assets.json"), "utf8"),
    ) as Array<{
      source: string;
      output: string;
      crop: { left: number; top: number; width: number; height: number };
      maskRadiusRatio?: number;
      sharpen?: boolean;
      quality?: number;
    }>;
    const knightManual = manifest.filter((entry) =>
      /\/skills\/knight-s[1-6]-/.test(entry.output)
    );
    const knightStageSeven = manifest.filter((entry) =>
      entry.output.includes("/skills/knight-s7-")
    );
    expect(knightManual).toHaveLength(83);
    expect(knightManual.every((entry) =>
      entry.source.startsWith("data/source/manual/detail/knight/")
    )).toBe(true);
    expect(knightManual.every((entry) => entry.crop.left === 0 && entry.crop.top === 0)).toBe(true);
    expect(knightManual.filter((entry) => entry.output.includes("-active-")).every((entry) =>
      entry.crop.width === 236 && entry.crop.height === 236
    )).toBe(true);
    expect(knightManual.filter((entry) => entry.output.includes("-passive-")).every((entry) =>
      entry.crop.width === 166 && entry.crop.height === 166
    )).toBe(true);
    expect(knightManual.every((entry) => entry.maskRadiusRatio === undefined)).toBe(true);
    expect(knightManual.every((entry) => entry.sharpen === true)).toBe(true);
    expect(knightManual.every((entry) => entry.quality === 95)).toBe(true);
    expect(knightStageSeven.every((entry) =>
      !entry.source.startsWith("data/source/manual/knight")
    )).toBe(true);
  });

  it("uses compact detail crops and sharpening for stage-six skill icons", async () => {
    const manifest = JSON.parse(
      await readFile(path.join(root, "data/source-assets.json"), "utf8"),
    ) as Array<{
      source: string;
      output: string;
      crop: { width: number; height: number };
      sharpen?: boolean;
      quality?: number;
      maskRadiusRatio?: number;
    }>;
    const stageSix = manifest.filter((entry) =>
      entry.output.includes("/skills/") && entry.output.includes("-s6-")
    );

    expect(stageSix).toHaveLength(48);
    expect(stageSix.filter((entry) => !entry.output.includes("-s7-")).every((entry) =>
      entry.source.startsWith("data/source/manual/detail/")
    )).toBe(true);
    expect(stageSix.filter((entry) => !entry.output.includes("-s7-")).filter((entry) =>
      entry.output.includes("-active-")
    ).every((entry) => entry.crop.width === 236)).toBe(true);
    expect(stageSix.filter((entry) => !entry.output.includes("-s7-")).filter((entry) =>
      entry.output.includes("-passive-")
    ).every((entry) => entry.crop.width === 166)).toBe(true);
    expect(stageSix.every((entry) => entry.sharpen === true)).toBe(true);
    expect(stageSix.every((entry) => entry.quality === 95)).toBe(true);
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
