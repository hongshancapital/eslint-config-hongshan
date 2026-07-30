import { defineConfig } from 'oxlint';

export default defineConfig({
  categories: {
    correctness: 'off',
  },
  rules: {
    'no-undef': 'error',
  },
});
