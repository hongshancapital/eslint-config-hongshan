import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [
    {
      categories: {
        correctness: 'off',
        pedantic: 'error',
      },
    },
  ],
});
