// Runs as native ESM (no TypeScript step), so the package import below goes
// through the `import` condition of package.json `exports` to dist/esm.
import { createRequire } from 'node:module';
import test from 'ava';
import { createUmi } from '@metaplex-foundation/umi';
import { testPlugins } from '@metaplex-foundation/umi-bundle-tests';
import * as esm from '@metaplex-foundation/mpl-token-metadata';

const require = createRequire(import.meta.url);

test('the import condition resolves to the ES module build', (t) => {
  t.regex(
    import.meta.resolve('@metaplex-foundation/mpl-token-metadata'),
    /\/dist\/esm\/index\.mjs$/
  );
});

test('the ES module and CommonJS builds export the same names', (t) => {
  const cjs = require('@metaplex-foundation/mpl-token-metadata');
  t.deepEqual(Object.keys(esm).sort(), Object.keys(cjs).sort());
});

test('mplTokenMetadata registers its program when loaded as ESM', (t) => {
  const umi = createUmi().use(testPlugins()).use(esm.mplTokenMetadata());
  t.true(umi.programs.has('mplTokenMetadata'));
  t.is(
    umi.programs.get('mplTokenMetadata').publicKey,
    esm.MPL_TOKEN_METADATA_PROGRAM_ID
  );
  // mplTokenMetadata() installs mplToolbox(), which it now loads as ESM too.
  for (const name of ['splSystem', 'splToken', 'splAssociatedToken']) {
    t.true(umi.programs.has(name), name);
  }
});
