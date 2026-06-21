import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { resolveManifestAsset } from "./asset-paths.mjs";

const root = process.cwd();
const manifest = JSON.parse(
  await readFile(path.join(root, "data/source-assets.json"), "utf8"),
);
if (!Array.isArray(manifest)) {
  console.error("Asset manifest must be an array.");
  process.exit(1);
}

let count = 0;
const seenOutputs = new Set();
for (const [index, asset] of manifest.entries()) {
  const { source, output } = resolveManifestAsset(root, asset, index, seenOutputs);
  try {
    await mkdir(path.dirname(output), { recursive: true });
    let image = sharp(source)
      .extract(asset.crop)
      .resize(asset.size, asset.size, { fit: "cover" });
    if (asset.mask === "circle") {
      const center = asset.size / 2;
      const radius = asset.size * 7 / 16;
      const mask = Buffer.from(
        `<svg width="${asset.size}" height="${asset.size}"><circle cx="${center}" cy="${center}" r="${radius}" fill="white"/></svg>`,
      );
      image = image.composite([{ input: mask, blend: "dest-in" }]);
    }
    await image
      .webp({ quality: 90 })
      .toFile(output);
  } catch (error) {
    throw new Error(
      `Failed to build asset entry ${index} source=${asset.source} output=${asset.output} crop=${JSON.stringify(asset.crop)}`,
      { cause: error },
    );
  }
  count += 1;
}

console.log(`Built ${count} catalog assets.`);
