import assert from 'node:assert/strict';
import {test} from 'node:test';

import {tarballAssetName} from '../bin/asset-name.js';

test('releases below 2.0.0 keep the gaia-<tag> name', () => {
  assert.equal(tarballAssetName('v1.6.1'), 'gaia-v1.6.1.tar.gz');
  assert.equal(tarballAssetName('v1.0.0'), 'gaia-v1.0.0.tar.gz');
});

test('releases at or above 2.0.0 use the gaia-bundle-<tag> name', () => {
  assert.equal(tarballAssetName('v2.0.0'), 'gaia-bundle-v2.0.0.tar.gz');
  assert.equal(tarballAssetName('v2.1.3'), 'gaia-bundle-v2.1.3.tar.gz');
  assert.equal(tarballAssetName('v10.0.0'), 'gaia-bundle-v10.0.0.tar.gz');
});

test('an unparseable version throws', () => {
  assert.throws(() => tarballAssetName('latest'), /Unrecognized GAIA version/);
});
