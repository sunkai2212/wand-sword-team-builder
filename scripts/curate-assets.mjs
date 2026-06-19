import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const manifest = JSON.parse(
  await readFile(path.join(root, "data/source-assets.json"), "utf8"),
);

let count = 0;
for (const asset of manifest) {
  const source = path.join(root, asset.source);
  const output = path.join(root, asset.output);
  await mkdir(path.dirname(output), { recursive: true });
  await sharp(source)
    .extract(asset.crop)
    .resize(asset.size, asset.size, { fit: "cover" })
    .webp({ quality: 90 })
    .toFile(output);
  count += 1;
}

console.log(`Built ${count} catalog assets.`);
