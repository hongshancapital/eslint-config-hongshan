import { defineConfig } from 'oxlint';

export default defineConfig({
  categories: {
    correctness: 'off',
  },
  plugins: ['import'],
  rules: {
    'id-denylist': ['error', 'forbidden'],
    'import/no-duplicates': 'error',
  },
});
