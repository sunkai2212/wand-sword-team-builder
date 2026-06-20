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
