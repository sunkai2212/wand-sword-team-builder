import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outputFlag = process.argv.indexOf("--output");
const outputArgument = outputFlag >= 0 ? process.argv[outputFlag + 1] : undefined;
if (!outputArgument) throw new Error("Usage: audit-skill-centering.mjs --output <path>");

const manifest = JSON.parse(
  await readFile(path.join(root, "data/source-assets.json"), "utf8"),
);
const skills = manifest.flatMap((entry) => {
  const match = entry.output?.match(
    /^public\/assets\/skills\/(.+)-s([1-7])-(active|passive)-(\d+)\.webp$/,
  );
  return match ? [{ ...entry, stage: Number(match[2]) }] : [];
});

const cards = await Promise.all(skills.map(async (entry) => {
  const bytes = await readFile(path.join(root, entry.output));
  const label = path.basename(entry.output);
  return {
    stage: entry.stage,
    html: `<figure class="skill-card" data-stage="${entry.stage}">
      <div class="icon-frame">
        <img src="data:image/webp;base64,${bytes.toString("base64")}" alt="">
        <span class="target-circle"></span><span class="axis axis-x"></span><span class="axis axis-y"></span>
      </div><figcaption>${label}</figcaption>
    </figure>`,
  };
}));

const sections = Array.from({ length: 7 }, (_, index) => index + 1).map((stage) =>
  `<section><h2>${stage} 转</h2><div class="grid">${cards
    .filter((card) => card.stage === stage)
    .map((card) => card.html)
    .join("")}</div></section>`,
).join("");

const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8">
<title>技能圆环居中审查</title><style>
body{margin:24px;background:#17191d;color:#f5f2e9;font:14px system-ui}h2{margin-top:36px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:18px}.skill-card{margin:0;text-align:center}.icon-frame{position:relative;width:128px;height:128px;margin:auto}.icon-frame img{display:block;width:128px;height:128px}.target-circle{position:absolute;inset:8px;border:1px solid #42ff8b;border-radius:50%}.axis{position:absolute;background:#ff3f5f}.axis-x{left:0;top:63px;width:128px;height:1px}.axis-y{left:63px;top:0;width:1px;height:128px}figcaption{margin-top:6px;overflow-wrap:anywhere;color:#c9c3b7;font-size:11px}
</style><body><h1>技能圆环居中审查</h1>${sections}</body></html>`;

const output = path.resolve(root, outputArgument);
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, html);
console.log(`Wrote ${skills.length} skill icons to ${output}`);
