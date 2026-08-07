import { defineConfig } from 'eslint/config';

import { GLOB_SRC, GLOB_TSX } from '../globs';
import type { Options } from '../types';

const CORE_REACT_HOOKS_RULES = [
  'react-hooks/rules-of-hooks',
  'react-hooks/exhaustive-deps',
] as const;

export async function react(options: Options) {
  const { react: reactOption, reactHooks: reactHooksPreset = 'core' } = options;

  if (!reactOption) {
    return [];
  }

  const { default: reactHooks } = await import('eslint-plugin-react-hooks');
  const reactHooksRecommended = reactHooks.configs.flat.recommended;
  const reactHooksConfig =
    reactHooksPreset === 'core'
      ? {
          ...reactHooksRecommended,
          rules: Object.fromEntries(
            CORE_REACT_HOOKS_RULES.map((rule) => [rule, reactHooksRecommended.rules[rule]]),
          ),
        }
      : reactHooks.configs.flat[reactHooksPreset];
  const reactTypescript =
    options.typescript === false
      ? []
      : defineConfig([
          {
            name: '@hongshancapital/eslint-config-hongshan/react-typescript',
            files: [GLOB_TSX],
            rules: {
              '@typescript-eslint/naming-convention': [
                'error',
                { selector: 'variable', format: ['camelCase', 'UPPER_CASE', 'PascalCase'] },
              ],
            },
          },
        ]);

  return defineConfig([
    {
      ...reactHooksConfig,
      name: '@hongshancapital/eslint-config-hongshan/react-hooks',
      files: [GLOB_SRC],
      languageOptions: {
        parserOptions: {
          ecmaFeatures: { jsx: true },
        },
      },
    },
    ...reactTypescript,
  ]);
}
