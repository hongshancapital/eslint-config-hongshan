import { defineConfig } from './dist/index.mjs';

export default defineConfig({
  react: true,
  typescript: true,
  ignores: ['dist/**', 'tests/fixtures/**'],
});
