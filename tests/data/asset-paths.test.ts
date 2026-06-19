import { describe, expect, it } from "vitest";
import path from "node:path";

// @ts-expect-error The production helper is a Node ESM module.
import { resolveManifestAsset } from "../../scripts/asset-paths.mjs";

describe("asset manifest path safety", () => {
  const root = process.cwd();

  it("accepts tracked sources and public asset outputs", () => {
    const seen = new Set<string>();
    const resolved = resolveManifestAsset(
      root,
      {
        source: "data/source/skills/1-knight.jpg",
        output: "public/assets/skills/knight-s1-active-1.webp",
      },
      3,
      seen,
    );

    expect(path.relative(root, resolved.source).split(path.sep).slice(0, 3)).toEqual([
      "data",
      "source",
      "skills",
    ]);
    expect(path.relative(root, resolved.output).split(path.sep).slice(0, 3)).toEqual([
      "public",
      "assets",
      "skills",
    ]);
  });

  it.each([
    ["absolute source", "C:/outside.jpg", "public/assets/skills/a.webp"],
    ["source traversal", "data/source/../outside.jpg", "public/assets/skills/a.webp"],
    ["output traversal", "data/source/a.jpg", "public/assets/../a.webp"],
  ])("rejects %s with entry context", (_label, source, output) => {
    expect(() =>
      resolveManifestAsset(root, { source, output }, 7, new Set()),
    ).toThrow(/entry 7.*source=.*output=/i);
  });

  it("rejects duplicate outputs", () => {
    const seen = new Set<string>();
    const asset = {
      source: "data/source/skills/1-knight.jpg",
      output: "public/assets/skills/a.webp",
    };
    resolveManifestAsset(root, asset, 0, seen);

    expect(() => resolveManifestAsset(root, asset, 1, seen)).toThrow(
      /entry 1.*duplicate output/i,
    );
  });
});
