import { defineConfig } from 'oxlint';

export default defineConfig({
  categories: {
    correctness: 'off',
  },
  plugins: [],
  rules: {
    'react/jsx-key': 'error',
  },
});
