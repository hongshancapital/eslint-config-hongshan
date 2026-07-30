import { defineConfig } from 'oxlint';

export default defineConfig({
  overrides: [
    {
      files: ['**/*.js'],
      jsPlugins: [],
    },
  ],
});
