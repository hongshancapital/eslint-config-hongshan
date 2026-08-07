import { defineConfig } from 'oxlint';

export default defineConfig({
  categories: {
    correctness: 'off',
  },
  rules: {
    eqeqeq: 'error',
  },
  overrides: [
    {
      files: ['**/*.case.js'],
      rules: {
        eqeqeq: 'off',
      },
    },
  ],
});
