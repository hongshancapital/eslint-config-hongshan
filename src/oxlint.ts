import { defineConfig as defineOxlintConfig, type OxlintConfig } from 'oxlint';

import { GLOB_EXCLUDE, GLOB_JSX, GLOB_TSX } from './globs.ts';

export type OxlintPreset = 'frontend' | 'backend';

export type OxlintConfigOptions = OxlintConfig & {
  preset: OxlintPreset;
  react?: boolean;
};

type ConfigField<Key extends keyof OxlintConfig> = NonNullable<OxlintConfig[Key]>;
type LintPlugin = ConfigField<'plugins'>[number];

const basePlugins = [
  'eslint',
  'typescript',
  'unicorn',
  'oxc',
  'import',
] as const satisfies readonly LintPlugin[];

const presets = {
  frontend: {
    env: { es2024: true, browser: true },
    react: true,
  },
  backend: {
    env: { es2024: true, node: true },
    react: false,
  },
} satisfies Record<OxlintPreset, Pick<Required<OxlintConfig>, 'env'> & { react: boolean }>;

export const OXLINT_DEFAULT_PLUGINS = Object.freeze({
  frontend: Object.freeze([...basePlugins, 'react'] as const),
  backend: Object.freeze([...basePlugins, 'node'] as const),
}) satisfies Readonly<Record<OxlintPreset, readonly LintPlugin[]>>;

function getDefaultPlugins(preset: OxlintPreset, reactEnabled: boolean): LintPlugin[] {
  const plugins: readonly LintPlugin[] = OXLINT_DEFAULT_PLUGINS[preset];

  // `react` 的增删由 `reactEnabled` 显式控制，确保 `react: false` 能真正移除 react 插件。
  // oxlint-disable-next-line no-nested-ternary
  return reactEnabled
    ? plugins.includes('react')
      ? [...plugins]
      : [...plugins, 'react']
    : plugins.filter((plugin) => plugin !== 'react');
}

function restrictGlobal(name: string) {
  return {
    name,
    message: `Do not use global variable [${name}]. Use local variable instead.`,
  };
}

const baseRules = {
  'no-else-return': ['error', { allowElseIf: false }],
  'no-return-assign': ['error', 'always'],
  'no-console': [
    'error',
    {
      allow: ['info', 'warn', 'error'],
    },
  ],
  eqeqeq: 'error',
  curly: 'error',
  'prefer-destructuring': 'error',
  'prefer-arrow-callback': 'error',
  'no-extra-bind': 'error',
  'no-extra-label': 'error',
  'no-useless-call': 'error',
  'prefer-template': 'error',
  'no-param-reassign': ['error', { props: true }],
  'no-loop-func': 'error',
  'no-await-in-loop': 'error',
  'no-unneeded-ternary': 'error',
  'no-nested-ternary': 'error',
  'object-shorthand': ['error', 'properties', { avoidQuotes: true }],
  'no-restricted-imports': ['error', { paths: ['console'] }],
  'no-restricted-globals': [
    'error',
    restrictGlobal('status'),
    restrictGlobal('name'),
    restrictGlobal('open'),
  ],
  'unicorn/no-array-reverse': ['error', { allowExpressionStatement: false }],
  'unicorn/no-array-sort': ['error', { allowExpressionStatement: false }],
  'import/export': 'error',
  'import/first': 'error',
  'import/no-commonjs': 'error',
  'import/no-cycle': 'error',
  'import/no-duplicates': 'error',
  'import/no-mutable-exports': 'error',
  'typescript/adjacent-overload-signatures': 'error',
  'typescript/consistent-type-imports': 'error',
  'typescript/method-signature-style': ['error', 'property'],
  'typescript/no-inferrable-types': 'error',
  'typescript/no-unused-vars': [
    'error',
    {
      vars: 'all',
      args: 'after-used',
      ignoreRestSiblings: false,
      varsIgnorePattern: '_',
      argsIgnorePattern: '^_',
    },
  ],
} satisfies ConfigField<'rules'>;

const reactRules = {
  'react-hooks/exhaustive-deps': 'off',
  'react-hooks/rules-of-hooks': 'off',
  'react/jsx-no-literals': 'error',
  'react/no-array-index-key': 'error',
} satisfies ConfigField<'rules'>;

export function defineConfig({
  preset,
  react,
  categories,
  env,
  ignorePatterns = [],
  overrides = [],
  plugins,
  rules,
  ...config
}: OxlintConfigOptions): OxlintConfig {
  const selectedPreset = presets[preset];
  const reactEnabled =
    react ?? (plugins === undefined ? selectedPreset.react : plugins.includes('react'));

  const reactOverrides: ConfigField<'overrides'> = reactEnabled
    ? [
        {
          files: [GLOB_JSX, GLOB_TSX],
          rules: {
            'max-lines': ['error', { max: 490, skipComments: true }],
          },
        },
      ]
    : [];

  return defineOxlintConfig({
    ...config,
    categories: { correctness: 'error', ...categories },
    env: { ...selectedPreset.env, ...env },
    ignorePatterns: [...GLOB_EXCLUDE, ...ignorePatterns],
    overrides: [...reactOverrides, ...overrides],
    plugins: plugins ?? getDefaultPlugins(preset, reactEnabled),
    rules: {
      ...baseRules,
      ...(reactEnabled ? reactRules : {}),
      ...rules,
    },
  });
}

export type { OxlintConfig };
