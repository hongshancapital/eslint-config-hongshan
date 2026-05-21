import { defineConfig, type UserConfig } from 'tsdown';

const outputFiles = ['index.js', 'index.d.ts', 'react.js', 'react.d.ts'];

type BuildConfigOptions = {
  clean?: false | string[];
  entry: string;
};

const createConfig = ({ clean = false, entry }: BuildConfigOptions): UserConfig => ({
  entry,
  format: 'esm',
  outDir: '.',
  root: 'src',
  fixedExtension: false,
  dts: true,
  sourcemap: false,
  clean,
});

export default defineConfig([
  createConfig({
    entry: 'src/index.ts',
    clean: outputFiles,
  }),
  createConfig({
    entry: 'src/react.ts',
  }),
]);
