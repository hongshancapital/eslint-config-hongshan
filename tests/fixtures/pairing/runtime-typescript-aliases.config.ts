import { defineConfig } from 'oxlint';

export default defineConfig({
  categories: {
    correctness: 'off',
  },
  rules: {
    'no-implied-eval': 'error',
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error',
    'require-await': 'error',
  },
});
