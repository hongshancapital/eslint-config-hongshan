import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import { importX } from 'eslint-plugin-import-x';
import * as noSecrets from 'eslint-plugin-no-secrets';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
//#region prettier.json
var prettier_default = {
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  semi: true,
  tabWidth: 2,
  overrides: [
    {
      files: '.prettierrc',
      options: { parser: 'json' },
    },
  ],
};
//#endregion
//#region src/index.ts
const codeFiles = ['**/*.{js,mjs,jsx,ts,tsx,mts}'];
const tsFiles = ['**/*.{ts,tsx,mts}'];
const typedConfigs = tseslint.configs.recommendedTypeChecked.map((config) => ({
  ...config,
  files: tsFiles,
}));
const config = defineConfig([
  {
    name: '@hongshancapital/eslint-config-hongshan/ignores',
    ignores: ['node_modules/**', 'coverage/**'],
  },
  {
    ...js.configs.recommended,
    name: '@hongshancapital/eslint-config-hongshan/js-recommended',
  },
  {
    ...importX.flatConfigs.recommended,
    name: '@hongshancapital/eslint-config-hongshan/import-x-recommended',
  },
  {
    name: '@hongshancapital/eslint-config-hongshan/base',
    files: codeFiles,
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.es2020,
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
      },
      sourceType: 'module',
    },
    plugins: { 'no-secrets': noSecrets },
    settings: {
      'import-x/resolver-next': [createTypeScriptImportResolver({ alwaysTryTypes: true })],
    },
    rules: {
      'no-secrets/no-secrets': ['error', { tolerance: 5 }],
      'no-else-return': ['error', { allowElseIf: false }],
      'no-unreachable': 'error',
      'import-x/first': 'error',
      'import-x/newline-after-import': 'error',
      'no-return-assign': ['error', 'always'],
      'no-console': ['error', { allow: ['info', 'warn', 'error'] }],
      'import-x/no-named-as-default-member': 'off',
      eqeqeq: 'error',
      curly: 'error',
      'prefer-destructuring': 'error',
      'no-unused-expressions': 'error',
      'prefer-arrow-callback': 'error',
      'no-extra-bind': 'error',
      'no-extra-label': 'error',
      'no-useless-call': 'error',
      'prefer-template': 'error',
      'no-param-reassign': ['error', { props: true }],
      'no-loop-func': 'error',
      'no-await-in-loop': 'error',
      'spaced-comment': 'error',
      'multiline-comment-style': 'error',
      'padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          prev: ['var', 'const', 'let', 'class'],
          next: '*',
        },
        {
          blankLine: 'any',
          prev: ['const', 'let', 'var'],
          next: ['const', 'let', 'var'],
        },
        {
          blankLine: 'always',
          prev: '*',
          next: 'export',
        },
      ],
      'no-restricted-syntax': [
        'error',
        'WithStatement',
        'DoWhileStatement',
        'ForStatement',
        'ForInStatement',
        {
          selector: "CallExpression[callee.name='require']",
          message: 'require is not recommended, use import instead.',
        },
        {
          selector:
            "CallExpression[callee.type='MemberExpression'] MemberExpression[property.name=/^(copyWithin|fill|pop|reverse|shift|sort|splice|unshift)$/]",
          message: 'DO NOT CALL MUTATING FUNCTION, THANKS.',
        },
        {
          selector:
            "JSXOpeningElement[name.name='img'] JSXAttribute[name.name='src'][value.expression.type!=/^(Identifier|CallExpression)$/]",
          message: 'Import the source file first.',
        },
      ],
      'no-unneeded-ternary': 'error',
      'no-nested-ternary': 'error',
      'no-func-assign': 'error',
      'no-class-assign': 'error',
      'import-x/order': [
        'error',
        {
          'newlines-between': 'always',
          pathGroups: [
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
      'import-x/no-dynamic-require': 'error',
      'import-x/no-cycle': 'error',
      'import-x/no-useless-path-segments': 'error',
      'import-x/no-unused-modules': [
        1,
        {
          suppressMissingFileEnumeratorAPIWarning: true,
          unusedExports: true,
        },
      ],
      'import-x/export': 'error',
      'import-x/no-mutable-exports': 'error',
      'no-restricted-imports': ['error', { paths: ['console'] }],
      'no-restricted-globals': [
        'error',
        {
          name: 'status',
          message: 'Do not use global variable [status]. Use local variable instead.',
        },
        {
          name: 'name',
          message: 'Do not use global variable [name]. Use local variable instead.',
        },
        {
          name: 'open',
          message: 'Do not use global variable [open]. Use local variable instead.',
        },
      ],
    },
  },
  ...typedConfigs,
  {
    ...importX.flatConfigs.typescript,
    name: '@hongshancapital/eslint-config-hongshan/import-x-typescript',
    files: tsFiles,
  },
  {
    name: '@hongshancapital/eslint-config-hongshan/typescript',
    files: tsFiles,
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { projectService: true },
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          varsIgnorePattern: '_',
          argsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE'],
        },
      ],
    },
  },
  {
    ...prettierRecommended,
    name: '@hongshancapital/eslint-config-hongshan/prettier',
  },
  {
    name: '@hongshancapital/eslint-config-hongshan/prettier-options',
    rules: { 'prettier/prettier': ['error', prettier_default] },
  },
]);
//#endregion
export { config as default };
