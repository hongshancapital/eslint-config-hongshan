import js from '@eslint/js';
import noSecrets from 'eslint-plugin-no-secrets';
import { defineConfig } from 'eslint/config';
import globals from 'globals';

import { GLOB_SRC } from '../globs';

export function javascript() {
  return defineConfig([
    {
      ...js.configs.recommended,
      name: '@hongshancapital/eslint-config-hongshan/js-recommended',
      files: [GLOB_SRC],
    },
    {
      name: '@hongshancapital/eslint-config-hongshan/base',
      files: [GLOB_SRC],
      languageOptions: {
        ecmaVersion: 'latest',
        globals: {
          ...globals.browser,
          ...globals.node,
        },
        sourceType: 'module',
      },
      plugins: {
        'no-secrets': noSecrets,
      },
      linterOptions: {
        reportUnusedDisableDirectives: 'error',
      },
      rules: {
        'no-secrets/no-secrets': ['error', { tolerance: 5 }],
        'no-restricted-syntax': [
          'error',
          'DoWhileStatement',
          'ForStatement',
          'ForInStatement',
          {
            selector:
              "CallExpression[callee.type='MemberExpression'][callee.property.name=/^(copyWithin|fill|pop|shift|splice|unshift)$/]",
            message: 'DO NOT CALL MUTATING FUNCTION, THANKS.',
          },
          {
            selector:
              "JSXOpeningElement[name.name='img'] JSXAttribute[name.name='src'][value.type='JSXExpressionContainer'][value.expression.type!=/^(Identifier|CallExpression)$/]",
            message: 'Import the source file first.',
          },
        ],
      },
    },
  ]);
}
