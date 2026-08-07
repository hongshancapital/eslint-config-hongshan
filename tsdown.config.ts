import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    format: ['esm'],
    dts: true,
    clean: true,
    target: 'node22.18',
    sourcemap: false,
    outDir: 'dist',
    entry: ['src/index.ts', 'src/globs.ts', 'src/oxfmt.ts', 'src/oxlint.ts'],
  },
]);
