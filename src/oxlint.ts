import { defineConfig as defineOxlintConfig, type OxlintConfig } from 'oxlint';

import { GLOB_EXCLUDE, GLOB_JSX, GLOB_TSX } from './globs.ts';

export type OxlintPreset = 'frontend' | 'backend';

export type OxlintConfigOptions = OxlintConfig & {
  preset: OxlintPreset;
  react?: boolean;
  /**
   * 启用 strict 级规则。与 ESLint 侧 `typescript: 'strict'` 对应；
   * 默认 `false` 对应 `typescript: 'recommended'`。各入口选项互不透传，需分别声明。
   * @default false
   */
  strict?: boolean;
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
  'import/no-dynamic-require': 'error',
  'import/no-mutable-exports': 'error',
  'no-array-constructor': 'error',
  'no-case-declarations': 'error',
  'no-empty': 'error',
  'no-fallthrough': 'error',
  'no-inner-declarations': 'error',
  'no-prototype-builtins': 'error',
  'no-redeclare': 'error',
  'no-regex-spaces': 'error',
  'no-unexpected-multiline': 'error',
  'no-useless-assignment': 'error',
  'no-var': 'error',
  'prefer-const': 'error',
  'prefer-rest-params': 'error',
  'prefer-spread': 'error',
  'preserve-caught-error': 'error',
  'typescript/adjacent-overload-signatures': 'error',
  'typescript/ban-ts-comment': 'error',
  'typescript/consistent-type-imports': 'error',
  'typescript/method-signature-style': ['error', 'property'],
  'typescript/no-empty-object-type': 'error',
  'typescript/no-explicit-any': 'error',
  'typescript/no-inferrable-types': 'error',
  'typescript/no-namespace': 'error',
  'typescript/no-non-null-assertion': 'error',
  'typescript/no-require-imports': 'error',
  'typescript/no-unnecessary-type-constraint': 'error',
  'typescript/no-unsafe-function-type': 'error',
  'no-unused-vars': [
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

/**
 * strict 级规则：对应 typescript-eslint `strict` preset 独有、且 Oxlint 有等价实现的规则。
 * 仅在 `strict: true` 时启用，与 ESLint 侧 `typescript: 'strict'` 对齐。
 */
const strictRules = {
  'no-useless-constructor': 'error',
  'typescript/no-dynamic-delete': 'error',
  'typescript/no-extraneous-class': 'error',
  'typescript/no-invalid-void-type': 'error',
  'typescript/no-non-null-asserted-nullish-coalescing': 'error',
  'typescript/prefer-literal-enum-member': 'error',
  'typescript/unified-signatures': 'error',
} satisfies ConfigField<'rules'>;

const reactRules = {
  'react-hooks/exhaustive-deps': 'off',
  'react-hooks/rules-of-hooks': 'off',
  'react/jsx-boolean-value': 'error',
  'react/jsx-curly-brace-presence': 'error',
  'react/jsx-no-comment-textnodes': 'error',
  'react/jsx-no-literals': 'error',
  'react/jsx-no-target-blank': 'error',
  'react/jsx-pascal-case': 'error',
  'react/no-array-index-key': 'error',
  'react/no-unescaped-entities': 'error',
  'react/no-unknown-property': 'error',
  'react/self-closing-comp': 'error',
} satisfies ConfigField<'rules'>;

export function defineConfig({
  preset,
  react,
  strict = false,
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
      ...(strict ? strictRules : {}),
      ...(reactEnabled ? reactRules : {}),
      ...rules,
    },
  });
}

export type { OxlintConfig };
