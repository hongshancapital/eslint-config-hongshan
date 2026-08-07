import { defineConfig } from 'oxlint';

export default defineConfig({
  categories: {
    correctness: 'off',
  },
  overrides: [
    {
      files: ['**/*.case.js'],
      excludeFiles: ['**/*.excluded.case.js'],
      rules: {
        'no-debugger': 'error',
      },
    },
  ],
});
