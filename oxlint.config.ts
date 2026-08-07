import { defineConfig } from './dist/oxlint.mjs';

export default defineConfig({
  preset: 'backend',
  ignorePatterns: ['tests/fixtures/**'],
});
