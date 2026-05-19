import eslintReact from '@eslint-react/eslint-plugin';
import { defineConfig } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';

import baseConfig from './index';

const reactFiles = ['**/*.{jsx,tsx}'];
const reactTypeScriptFiles = ['**/*.tsx'];

const config = defineConfig([
  ...baseConfig,
  {
    ...eslintReact.configs['recommended-typescript'],
    name: '@hongshancapital/eslint-config-hongshan/react-recommended',
    files: reactFiles,
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  {
    ...reactHooks.configs.flat['recommended-latest'],
    name: '@hongshancapital/eslint-config-hongshan/react-hooks',
    files: reactFiles,
  },
  {
    name: '@hongshancapital/eslint-config-hongshan/react-overrides',
    files: reactFiles,
    rules: {
      'max-lines': ['error', { max: 490, skipComments: true }],
      'no-throw-literal': 'off',
      'space-before-function-paren': 'off',
      'arrow-parens': ['error', 'always'],
      'import-x/order': [
        'error',
        {
          'newlines-between': 'always',
          pathGroups: [
            {
              pattern: '*.{less,css,scss}',
              patternOptions: { matchBase: true },
              group: 'sibling',
              position: 'after',
            },
            {
              pattern: '@/**',
              group: 'internal',
            },
          ],
          groups: [
            'builtin',
            'external',
            'type',
            'internal',
            ['parent', 'sibling', 'index'],
            'object',
          ],
        },
      ],
      'import-x/no-duplicates': 'error',
      '@eslint-react/no-array-index-key': 'error',
      '@eslint-react/no-missing-component-display-name': 'off',
    },
  },
  {
    name: '@hongshancapital/eslint-config-hongshan/react-typescript',
    files: reactTypeScriptFiles,
    rules: {
      '@typescript-eslint/no-throw-literal': 'error',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/adjacent-overload-signatures': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/method-signature-style': 'error',
      '@typescript-eslint/no-for-in-array': 'error',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
    },
  },
]);

export default config;
