import { defineConfig } from 'eslint/config';

import { GLOB_TS_ALL } from '../globs';
import type { Options } from '../types';

let typescriptEslintPromise: ReturnType<typeof importTypescriptEslint> | undefined;

function importTypescriptEslint() {
  return import('typescript-eslint');
}

export function loadTypescriptEslint() {
  typescriptEslintPromise ??= importTypescriptEslint();

  return typescriptEslintPromise;
}

export async function typescript(options: Options) {
  const { typescript: tsOption = true } = options;

  if (!tsOption) {
    return [];
  }

  const { default: tseslint } = await loadTypescriptEslint();
  const isStrict = tsOption === 'strict';
  const baseConfigs = isStrict ? tseslint.configs.strict : tseslint.configs.recommended;

  return defineConfig([
    ...baseConfigs.map((config) => ({ ...config, files: [...GLOB_TS_ALL] })),
    {
      name: '@hongshancapital/eslint-config-hongshan/typescript',
      files: [...GLOB_TS_ALL],
      languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
        },
      },
      rules: {
        '@typescript-eslint/naming-convention': [
          'error',
          { selector: 'variable', format: ['camelCase', 'UPPER_CASE'] },
        ],
      },
    },
  ]);
}
