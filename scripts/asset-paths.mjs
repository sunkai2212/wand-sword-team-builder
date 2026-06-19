import path from "node:path";

function isInside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

export function resolveManifestAsset(root, asset, index, seenOutputs) {
  const sourceLabel = asset?.source ?? "<missing>";
  const outputLabel = asset?.output ?? "<missing>";
  const fail = (reason) => {
    throw new Error(
      `Asset manifest entry ${index} source=${sourceLabel} output=${outputLabel}: ${reason}`,
    );
  };

  if (!asset || typeof asset.source !== "string" || typeof asset.output !== "string") {
    fail("source and output must be strings");
  }
  if (path.isAbsolute(asset.source) || path.isAbsolute(asset.output)) {
    fail("absolute paths are not allowed");
  }

  const sourceRoot = path.resolve(root, "data/source");
  const outputRoot = path.resolve(root, "public/assets");
  const source = path.resolve(root, asset.source);
  const output = path.resolve(root, asset.output);
  if (!isInside(sourceRoot, source)) fail("source must stay inside data/source");
  if (!isInside(outputRoot, output)) fail("output must stay inside public/assets");

  const outputKey = path.normalize(output).toLowerCase();
  if (seenOutputs.has(outputKey)) fail("duplicate output");
  seenOutputs.add(outputKey);
  return { source, output };
}
