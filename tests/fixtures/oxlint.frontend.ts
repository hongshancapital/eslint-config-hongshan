import { defineConfig } from '../../src/oxlint.ts';

export default defineConfig({
  preset: 'frontend',
  ignorePatterns: ['oxlint-only/**'],
});
