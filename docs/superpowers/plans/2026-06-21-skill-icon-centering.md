# Skill Icon Centering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-crop all 380 skill icons so their circular frames share one center, diameter, and margin, with special attention to stages four through seven.

**Architecture:** Keep source images, catalog records, output filenames, and UI code unchanged. Add one read-only visual-audit generator, then correct only the crop rectangles in `data/source-assets.json`, rebuild the existing WebP outputs, and review each stage batch against a 112 px target-circle overlay before moving on.

**Tech Stack:** Node.js, Sharp, Vitest, existing asset manifest/build scripts, HTML visual contact sheet, Vite, Playwright.

---

### Task 1: Add a reproducible visual centering audit

**Files:**
- Create: `scripts/audit-skill-centering.mjs`
- Modify: `package.json`
- Modify: `tests/data/asset-scripts.test.ts`

- [ ] **Step 1: Write the failing audit-script test**

Append a test that runs the future script against the real manifest and a temporary output file:

```ts
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
```

Also add `readFile` to the existing `node:fs/promises` import.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- tests/data/asset-scripts.test.ts`

Expected: FAIL because `scripts/audit-skill-centering.mjs` does not exist.

- [ ] **Step 3: Implement the minimal read-only audit generator**

Create `scripts/audit-skill-centering.mjs`:

```js
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
```

Add the script:

```json
"assets:audit-centering": "node scripts/audit-skill-centering.mjs --output dist/skill-icon-centering-audit.html"
```

- [ ] **Step 4: Verify GREEN and generate the baseline sheet**

Run:

```powershell
npm test -- tests/data/asset-scripts.test.ts
npm run assets:audit-centering
```

Expected: focused tests PASS; `dist/skill-icon-centering-audit.html` contains 380 icon cards grouped into seven stages.

- [ ] **Step 5: Save the baseline evidence and commit**

Open the audit sheet, record the visibly offset stage/source groups in `docs/superpowers/checkpoints/2026-06-21-skill-icon-centering-baseline.md`, and commit only the script, test, package script, and checkpoint:

```powershell
git add scripts/audit-skill-centering.mjs tests/data/asset-scripts.test.ts package.json docs/superpowers/checkpoints/2026-06-21-skill-icon-centering-baseline.md
git commit -m "test: add skill icon centering audit"
```

### Task 2: Calibrate stages one through three

**Files:**
- Modify: `data/source-assets.json`
- Regenerate: `public/assets/skills/*-s1-*.webp`
- Regenerate: `public/assets/skills/*-s2-*.webp`
- Regenerate: `public/assets/skills/*-s3-*.webp`

- [ ] **Step 1: Measure each source-sheet group**

For every stage 1–3 source sheet, inspect active and passive rows separately. Adjust crop squares so the circular frame center maps to `(64, 64)` and its outer diameter maps to `112 ± 2 px`. Use one shared size and horizontal spacing per visually identical row; do not compensate for decorative spikes or skill effects.

- [ ] **Step 2: Rebuild and visually verify only the affected batch**

Run:

```powershell
npm run assets:build
npm run assets:audit-centering
npm run data:check
```

Expected: all 385 catalog assets rebuild; stages 1–3 match the guide with no catalog drift; stages 4–7 remain unchanged.

- [ ] **Step 3: Commit the low-stage calibration snapshot**

```powershell
git add data/source-assets.json public/assets/skills
git commit -m "fix: center stage one to three skill icons"
```

### Task 3: Calibrate stages four through six

**Files:**
- Modify: `data/source-assets.json`
- Regenerate: `public/assets/skills/*-s4-*.webp`
- Regenerate: `public/assets/skills/*-s5-*.webp`
- Regenerate: `public/assets/skills/*-s6-*.webp`

- [ ] **Step 1: Correct the priority source-sheet groups**

For all four professions and both active/passive rows at stages 4–6, recalculate each crop from the visible circular frame, not from the decoration bounding box. Normalize every circle to the same `(64, 64)` center and `112 ± 2 px` diameter.

- [ ] **Step 2: Rebuild and inspect the priority contact sheet**

Run:

```powershell
npm run assets:build
npm run assets:audit-centering
npm run data:check
```

Expected: the stage 4–6 sections align with the target guide; no bottom labels or adjacent icons enter a crop.

- [ ] **Step 3: Commit the priority-stage calibration snapshot**

```powershell
git add data/source-assets.json public/assets/skills
git commit -m "fix: center stage four to six skill icons"
```

### Task 4: Re-crop every stage-seven screenshot

**Files:**
- Modify: `data/source-assets.json`
- Regenerate: `public/assets/skills/*-s7-*.webp`

- [ ] **Step 1: Add a regression assertion for the known bad crop**

Extend `tests/data/asset-scripts.test.ts` to read the real manifest and assert that no stage-seven skill keeps the old shared rectangle:

```ts
it("does not keep the offset shared crop for stage-seven skills", async () => {
  const manifest = JSON.parse(
    await readFile(path.join(root, "data/source-assets.json"), "utf8"),
  ) as Array<{ output: string; crop: { left: number; top: number; width: number; height: number } }>;
  const stageSeven = manifest.filter((entry) => entry.output.includes("/skills/") && entry.output.includes("-s7-"));
  expect(stageSeven).toHaveLength(48);
  expect(stageSeven.some((entry) =>
    entry.crop.left === 780 &&
    entry.crop.top === 900 &&
    entry.crop.width === 240 &&
    entry.crop.height === 240
  )).toBe(false);
});
```

- [ ] **Step 2: Verify RED before changing stage-seven data**

Run: `npm test -- tests/data/asset-scripts.test.ts`

Expected: FAIL because all 48 stage-seven entries still use the old shared crop.

- [ ] **Step 3: Measure and apply the stage-seven rectangles**

Inspect every stage-seven source screenshot independently. Replace the current repeated `{ left: 780, top: 900, width: 240, height: 240 }` rectangle with a square centered on that screenshot's circular frame. Choose a square whose circle becomes `112 ± 2 px` after the existing resize to `128 × 128`; exclude the bottom text label and ignore outside decoration when positioning.

- [ ] **Step 4: Rebuild and verify GREEN**

Update the 48 manifest entries, then run:

```powershell
npm run assets:build
npm run assets:audit-centering
npm run data:check
npm test -- tests/data/asset-scripts.test.ts
```

Expected: the regression test passes; stage-seven circles align to the target guide and no icon contains its bottom text label.

- [ ] **Step 5: Commit the stage-seven calibration snapshot**

```powershell
git add data/source-assets.json public/assets/skills tests/data/asset-scripts.test.ts
git commit -m "fix: center stage seven skill icons"
```

### Task 5: Final visual review, full verification, and deployment snapshot

**Files:**
- Create: `docs/superpowers/checkpoints/2026-06-21-skill-icon-centering-complete.md`
- Modify only if verification finds a reproducible defect in the files above.

- [ ] **Step 1: Review all seven stages in the visual companion**

Open `dist/skill-icon-centering-audit.html`. Check all 380 cards against the center crosshair and 112 px target circle, with a second pass over stages 4–7. Correct any remaining outlier in the manifest and rebuild before continuing.

- [ ] **Step 2: Run the complete verification suite**

Run:

```powershell
npm run assets:build
npm run data:check
npm test
npm run build:pages
$env:CI='1'; npm run test:e2e; $code=$LASTEXITCODE; Remove-Item Env:CI -ErrorAction SilentlyContinue; if($code -ne 0){exit $code}
git diff --check
```

Expected: 385 assets rebuilt; 380 skills and 5 pets validate; all unit tests and 38 browser tests pass; Pages build succeeds; no whitespace errors.

- [ ] **Step 3: Save the completion snapshot**

Record the crop method, affected stages, test counts, visual review result, and representative before/after evidence in `docs/superpowers/checkpoints/2026-06-21-skill-icon-centering-complete.md`.

- [ ] **Step 4: Commit and push**

```powershell
git add docs/superpowers/checkpoints/2026-06-21-skill-icon-centering-complete.md
git commit -m "docs: snapshot centered skill icons"
git push
```

- [ ] **Step 5: Verify automatic Pages deployment**

Watch the workflow triggered by the final push and confirm the public page and one skill image from each of stages 4, 5, 6, and 7 return HTTP 200.
