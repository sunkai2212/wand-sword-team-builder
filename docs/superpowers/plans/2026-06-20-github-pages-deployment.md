# GitHub Pages Project Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the existing static team builder at `https://sunkai2212.github.io/wand-sword-team-builder/` without breaking local development or any catalog image.

**Architecture:** Keep the 385 catalog records unchanged and resolve their root-style asset paths through one Vite-base-aware helper at runtime. Production Pages builds receive `/wand-sword-team-builder/` through an explicit environment variable, while local development and tests remain at `/`. GitHub Actions validates, builds, uploads `dist/`, and deploys it through the official Pages actions.

**Tech Stack:** TypeScript, Vite, Vitest, Playwright, GitHub Actions, GitHub Pages, GitHub CLI.

---

### Task 1: Add a base-aware asset URL boundary

**Files:**
- Create: `src/asset-url.ts`
- Create: `tests/data/asset-url.test.ts`

- [ ] **Step 1: Write the failing asset URL tests**

```ts
import { describe, expect, it } from "vitest";
import { resolveAssetUrl } from "../../src/asset-url";

describe("resolveAssetUrl", () => {
  it("keeps root deployment paths unchanged", () => {
    expect(resolveAssetUrl("/assets/pets/qianming.webp", "/"))
      .toBe("/assets/pets/qianming.webp");
  });

  it("adds the GitHub Pages project base once", () => {
    expect(resolveAssetUrl("/assets/pets/qianming.webp", "/wand-sword-team-builder/"))
      .toBe("/wand-sword-team-builder/assets/pets/qianming.webp");
    expect(resolveAssetUrl(
      "/wand-sword-team-builder/assets/pets/qianming.webp",
      "/wand-sword-team-builder/",
    )).toBe("/wand-sword-team-builder/assets/pets/qianming.webp");
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- tests/data/asset-url.test.ts`

Expected: FAIL because `src/asset-url.ts` does not exist.

- [ ] **Step 3: Implement the minimal resolver**

```ts
export function resolveAssetUrl(
  path: string,
  baseUrl = import.meta.env.BASE_URL,
): string {
  const base = `/${baseUrl.replace(/^\/+|\/+$/g, "")}`;
  const normalizedPath = `/${path.replace(/^\/+/, "")}`;
  if (base === "/") return normalizedPath;
  if (normalizedPath === base || normalizedPath.startsWith(`${base}/`)) {
    return normalizedPath;
  }
  return `${base}${normalizedPath}`;
}
```

- [ ] **Step 4: Run the focused and full unit tests**

Run: `npm test -- tests/data/asset-url.test.ts; npm test`

Expected: focused tests PASS; all existing tests PASS.

- [ ] **Step 5: Commit the path boundary**

```powershell
git add src/asset-url.ts tests/data/asset-url.test.ts
git commit -m "feat: resolve assets under deployment base"
```

### Task 2: Route every runtime image through the asset boundary

**Files:**
- Modify: `src/data/catalog.ts`
- Modify: `src/ui/board.ts`
- Modify: `src/ui/member-editor.ts`
- Modify: `src/export/render-image.ts`
- Modify: `tests/data/catalog.test.ts`

- [ ] **Step 1: Add a catalog regression assertion**

Add to `tests/data/catalog.test.ts`:

```ts
it("resolves catalog icons through the active Vite base", () => {
  expect(skills.every((skill) => skill.icon.startsWith("/assets/skills/"))).toBe(true);
  expect(pets.every((pet) => pet.icon.startsWith("/assets/pets/"))).toBe(true);
});
```

This protects the existing root development behavior; Task 1 already proves the project-base behavior.

- [ ] **Step 2: Route catalog records through `resolveAssetUrl`**

In `src/data/catalog.ts`, import the helper and replace the exports with:

```ts
import { resolveAssetUrl } from "../asset-url";

export const skills = parseSkills(skillsJson).map((skill) => ({
  ...skill,
  icon: resolveAssetUrl(skill.icon),
}));
export const pets = parsePets(petsJson).map((pet) => ({
  ...pet,
  icon: resolveAssetUrl(pet.icon),
}));
```

- [ ] **Step 3: Route the four profession image call sites**

Import `resolveAssetUrl` in `src/ui/board.ts`, `src/ui/member-editor.ts`, and `src/export/render-image.ts`. Replace profession image strings with:

```ts
resolveAssetUrl(`/assets/professions/${profession}.svg`)
```

For the static `PROFESSIONS` map in `board.ts`, call the helper once per image entry. Do not modify the JSON catalogs or generated asset filenames.

- [ ] **Step 4: Run catalog, export, and full tests**

Run:

```powershell
npm test -- tests/data/catalog.test.ts tests/export/render-image.test.ts
npm test
npm run test:e2e
```

Expected: catalog and Canvas tests PASS; 55+ unit tests and all 38 browser tests PASS.

- [ ] **Step 5: Commit runtime path use**

```powershell
git add src/data/catalog.ts src/ui/board.ts src/ui/member-editor.ts src/export/render-image.ts tests/data/catalog.test.ts
git commit -m "fix: load runtime images from deployment base"
```

### Task 3: Add the Pages build and deployment workflow

**Files:**
- Modify: `vite.config.ts`
- Modify: `package.json`
- Modify: `README.md`
- Create: `.github/workflows/deploy-pages.yml`

- [ ] **Step 1: Add an explicit Pages build script and Vite base**

Add to `package.json` scripts:

```json
"build:pages": "cross-env PAGES_BASE_PATH=/wand-sword-team-builder/ npm run build"
```

Install `cross-env` as a development dependency so the script works on Windows and Linux:

Run: `npm install --save-dev cross-env`

Update `vite.config.ts`:

```ts
export default defineConfig({
  base: process.env.PAGES_BASE_PATH || "/",
  test: {
    environment: "jsdom",
    exclude: ["e2e/**", "node_modules/**", ".worktrees/**"],
  },
});
```

- [ ] **Step 2: Create the official Pages workflow**

Create `.github/workflows/deploy-pages.yml`:

```yaml
name: Deploy GitHub Pages

on:
  push:
    branches: [master]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run data:check
      - run: npm test
      - run: npm run build:pages
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Update deployment documentation**

Replace the README root-path limitation with the public URL, `npm run build:pages`, and the fact that pushes to `master` deploy automatically. Retain the explanation that the app has no backend.

- [ ] **Step 4: Verify the Pages artifact locally**

Run:

```powershell
npm run build:pages
Select-String -Path dist/index.html -Pattern '/wand-sword-team-builder/assets/'
Test-Path dist/assets
```

Expected: `dist/index.html` references JS and CSS under `/wand-sword-team-builder/assets/`; `dist/assets` exists.

Run a production preview and request one page plus each asset category:

```powershell
$server = Start-Process -FilePath 'node.exe' -ArgumentList @('./node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173','--strictPort') -WorkingDirectory (Get-Location) -WindowStyle Hidden -PassThru
try {
  Start-Sleep -Seconds 2
  (Invoke-WebRequest 'http://127.0.0.1:4173/wand-sword-team-builder/').StatusCode
  (Invoke-WebRequest 'http://127.0.0.1:4173/wand-sword-team-builder/assets/professions/knight.svg').StatusCode
  (Invoke-WebRequest 'http://127.0.0.1:4173/wand-sword-team-builder/assets/pets/qianming.webp').StatusCode
  (Invoke-WebRequest 'http://127.0.0.1:4173/wand-sword-team-builder/assets/skills/knight-s1-active-1.webp').StatusCode
} finally {
  Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
}
```

Expected: all four requests return HTTP 200.

- [ ] **Step 5: Run the complete verification suite**

Run:

```powershell
npm run assets:build
npm run data:check
npm test
npm run build:pages
$env:CI='1'; npm run test:e2e; Remove-Item Env:CI
git diff --check
```

Expected: 385 assets rebuilt without drift; data, unit, build, and 38 E2E tests PASS; no whitespace errors.

- [ ] **Step 6: Commit deployment configuration**

```powershell
git add package.json package-lock.json vite.config.ts README.md .github/workflows/deploy-pages.yml
git commit -m "ci: deploy team builder to GitHub Pages"
```

### Task 4: Create the public repository and verify the live site

**Files:**
- Modify only if live verification finds a reproducible defect in the files above.

- [ ] **Step 1: Create the public repository and remote**

Run:

```powershell
gh repo create sunkai2212/wand-sword-team-builder --public --source . --remote origin
```

Expected: public repository created and `origin` points to `https://github.com/sunkai2212/wand-sword-team-builder.git`.

- [ ] **Step 2: Enable Pages for workflow deployment**

Run:

```powershell
gh api repos/sunkai2212/wand-sword-team-builder/pages -X POST -f build_type=workflow
```

If the endpoint reports Pages is already configured, verify with:

```powershell
gh api repos/sunkai2212/wand-sword-team-builder/pages
```

- [ ] **Step 3: Push `master` and watch the workflow**

Run:

```powershell
git push -u origin master
$runId = gh run list --workflow deploy-pages.yml --limit 1 --json databaseId --jq '.[0].databaseId'
gh run watch $runId --exit-status
```

Expected: build and deploy jobs complete successfully.

- [ ] **Step 4: Verify the public site**

Open `https://sunkai2212.github.io/wand-sword-team-builder/` and verify:

1. HTTP page loads without a 404.
2. The stage selector opens and entering the editor works.
3. Profession, skill, and pet icons load from the project subpath.
4. One partially configured member can generate a PNG.
5. The non-official material disclaimer is visible.

- [ ] **Step 5: Save the deployment snapshot**

Create `docs/superpowers/checkpoints/2026-06-20-github-pages-live.md` with the repository URL, live URL, deployment commit, workflow run URL, verification counts, and any known limitation. Commit it:

```powershell
git add docs/superpowers/checkpoints/2026-06-20-github-pages-live.md
git commit -m "docs: snapshot live GitHub Pages deployment"
git push
```
