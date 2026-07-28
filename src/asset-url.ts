const SKILL_ASSET_VERSION = "2026-07-28-stage-six-polish";

function versionSkillAsset(url: string): string {
  return url.includes("/assets/skills/")
    ? `${url}${url.includes("?") ? "&" : "?"}v=${SKILL_ASSET_VERSION}`
    : url;
}

export function resolveAssetUrl(
  path: string,
  baseUrl = import.meta.env.BASE_URL,
): string {
  const base = `/${baseUrl.replace(/^\/+|\/+$/g, "")}`;
  const normalizedPath = `/${path.replace(/^\/+/, "")}`;
  if (base === "/") return versionSkillAsset(normalizedPath);
  if (normalizedPath === base || normalizedPath.startsWith(`${base}/`)) {
    return versionSkillAsset(normalizedPath);
  }
  return versionSkillAsset(`${base}${normalizedPath}`);
}
