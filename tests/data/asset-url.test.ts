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
