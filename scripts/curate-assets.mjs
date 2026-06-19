import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { resolveManifestAsset } from "./asset-paths.mjs";

const root = process.cwd();
const manifest = JSON.parse(
  await readFile(path.join(root, "data/source-assets.json"), "utf8"),
);

let count = 0;
const seenOutputs = new Set();
for (const [index, asset] of manifest.entries()) {
  const { source, output } = resolveManifestAsset(root, asset, index, seenOutputs);
  await mkdir(path.dirname(output), { recursive: true });
  await sharp(source)
    .extract(asset.crop)
    .resize(asset.size, asset.size, { fit: "cover" })
    .webp({ quality: 90 })
    .toFile(output);
  count += 1;
}

console.log(`Built ${count} catalog assets.`);
