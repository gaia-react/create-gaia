// GAIA 2.0.0 renamed its release asset to gaia-bundle-<tag>.tar.gz so that
// v1.6.1's /update-gaia, which fetches gaia-<tag>.tar.gz, cannot pull a 2.x
// tarball. Releases below 2.0.0 keep the old name.
export function tarballAssetName(version) {
  const match = /^v?(\d+)\./.exec(version);
  if (!match) throw new Error(`Unrecognized GAIA version: ${version}`);
  const prefix = Number(match[1]) >= 2 ? 'gaia-bundle' : 'gaia';
  return `${prefix}-${version}.tar.gz`;
}
