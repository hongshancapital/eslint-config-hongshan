import { defineConfig } from './dist/index.mjs';

export default defineConfig({
  react: true,
  typescript: 'recommended',
  ignores: ['dist/**', 'tests/fixtures/**'],
});
