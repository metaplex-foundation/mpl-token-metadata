// Builds the publishable client:
//   dist/esm/**/*.mjs  ES modules, one file per source file (tree-shakeable)
//   dist/cjs/**/*.cjs  CommonJS, one file per source file
//   dist/types/index.d.mts  bundled type declarations for `import`
//                           (`require` uses tsc's dist/types/**/*.d.ts tree)
//
// Run after `tsc -p tsconfig.json`, which emits the per-file declarations
// into dist/types that the declaration bundle starts from.
//
// Tests (tsconfig.test.json) import the package by name: Node resolves that
// to dist/cjs through the package's own `exports`, so the suite runs against
// the published output, and `paths` type-checks it against dist/types.
import { readFileSync } from 'node:fs';
import { dts } from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';

const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8')
);

// Every dependency (and its subpaths, e.g. `@metaplex-foundation/umi/serializers`)
// stays external so apps resolve a single copy of each.
const dependencies = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
];
const external = (id) =>
  dependencies.some((dep) => id === dep || id.startsWith(`${dep}/`));

const js = (format, extension) => ({
  input: 'src/index.ts',
  external,
  plugins: [esbuild({ target: 'es2020', tsconfig: 'tsconfig.json' })],
  output: {
    dir: `dist/${format === 'es' ? 'esm' : 'cjs'}`,
    format,
    exports: 'named',
    preserveModules: true,
    preserveModulesRoot: 'src',
    entryFileNames: `[name].${extension}`,
    sourcemap: true,
  },
});

const types = (extension) => ({
  input: 'dist/types/index.d.ts',
  external,
  plugins: [dts()],
  output: { file: `dist/types/index.${extension}`, format: 'es' },
});

export default [js('es', 'mjs'), js('cjs', 'cjs'), types('d.mts')];
