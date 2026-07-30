import { defineConfig } from 'oxlint';

export default defineConfig({
  categories: {
    correctness: 'off',
  },
  extends: [
    {
      rules: {
        'no-debugger': 'off',
        'no-undef': 'error',
      },
    },
    {
      rules: {
        'no-debugger': 'error',
        'no-undef': 'off',
      },
    },
  ],
});
