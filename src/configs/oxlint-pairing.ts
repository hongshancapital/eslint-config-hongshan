import type { FlatConfig, FlatConfigArray } from '../types';

type OxlintRuntimeOverride = {
  excludeFiles?: readonly string[] | null;
  files: readonly string[];
  jsPlugins?: unknown;
  plugins?: readonly string[] | null;
  rules?: Readonly<Record<string, unknown>> | null;
};

export type OxlintRuntimeConfig = {
  jsPlugins?: unknown;
  options?: {
    typeAware?: boolean;
  } | null;
  overrides?: readonly OxlintRuntimeOverride[] | null;
  rules: Readonly<Record<string, unknown>>;
};

type RuleMap = Record<string, 'off'>;

export type OxlintRuleMetadata = {
  eslintRules: readonly string[];
  typeAware: boolean;
};

export type OxlintRuleMetadataMap = ReadonlyMap<string, OxlintRuleMetadata>;

const ESLINT_SCOPE_BY_OXLINT_SCOPE: Readonly<Record<string, string>> = {
  eslint: '',
  import: 'import',
  jest: 'jest',
  jsdoc: 'jsdoc',
  jsx_a11y: 'jsx-a11y',
  nextjs: '@next/next',
  node: 'n',
  promise: 'promise',
  react: 'react',
  react_perf: 'react-perf',
  typescript: '@typescript-eslint',
  unicorn: 'unicorn',
  vitest: 'vitest',
  vue: 'vue',
};

const RULE_PREFIX_ALIASES: Readonly<Record<string, string>> = {
  '@next/next': 'nextjs',
  '@typescript-eslint': 'typescript',
  'import-x': 'import',
  'jsx-a11y': 'jsx_a11y',
  n: 'node',
  'react-hooks': 'react',
  'react-perf': 'react_perf',
};

const RULES_UNSUPPORTED_IN_COMPONENT_FILES = new Set([
  'no-unused-vars',
  '@typescript-eslint/no-unused-vars',
  '@typescript-eslint/consistent-type-imports',
  'react-hooks/rules-of-hooks',
]);

const COMPONENT_FILE_IGNORES = ['**/*.vue', '**/*.svelte', '**/*.astro'];
const REACT_HOOKS_RULES = new Set(['exhaustive-deps', 'rules-of-hooks']);

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function getSeverity(value: unknown): unknown {
  return Array.isArray(value) ? value.at(0) : value;
}

function isActive(value: unknown): boolean {
  return ['deny', 'error', 'warn', 1, 2].includes(getSeverity(value) as never);
}

function isInactive(value: unknown): boolean {
  return ['allow', 'off', 0].includes(getSeverity(value) as never);
}

function getTypescriptExtensions(typescriptRules: unknown): ReadonlyMap<string, readonly string[]> {
  const extensionsByEslintRule = new Map<string, string[]>();

  if (!isObject(typescriptRules)) {
    return extensionsByEslintRule;
  }

  for (const [typescriptRule, rule] of Object.entries(typescriptRules)) {
    if (!isObject(rule)) {
      continue;
    }

    const { meta } = rule;

    if (!isObject(meta)) {
      continue;
    }

    const { docs } = meta;

    if (!isObject(docs)) {
      continue;
    }

    const { extendsBaseRule } = docs;

    if (!extendsBaseRule || (extendsBaseRule !== true && typeof extendsBaseRule !== 'string')) {
      continue;
    }

    const eslintRule = typeof extendsBaseRule === 'string' ? extendsBaseRule : typescriptRule;
    const extensions = extensionsByEslintRule.get(eslintRule) ?? [];

    extensions.push(typescriptRule);
    extensionsByEslintRule.set(eslintRule, extensions);
  }

  return extensionsByEslintRule;
}

function toEslintRuleNames(
  scope: string,
  ruleName: string,
  typescriptExtensions: ReadonlyMap<string, readonly string[]>,
): readonly string[] {
  if (scope === 'oxc') {
    return [];
  }

  let eslintScope = ESLINT_SCOPE_BY_OXLINT_SCOPE[scope];

  if (eslintScope === undefined) {
    return [];
  }

  if (scope === 'react' && REACT_HOOKS_RULES.has(ruleName)) {
    eslintScope = 'react-hooks';
  }

  const eslintRules = new Set([eslintScope ? `${eslintScope}/${ruleName}` : ruleName]);

  if (scope === 'eslint') {
    for (const typescriptRule of typescriptExtensions.get(ruleName) ?? []) {
      eslintRules.add(`@typescript-eslint/${typescriptRule}`);
    }
  } else if (scope === 'import') {
    eslintRules.add(`import-x/${ruleName}`);
  } else if (scope === 'react' && ruleName === 'only-export-components') {
    eslintRules.add(`react-refresh/${ruleName}`);
  }

  return [...eslintRules];
}

/**
 * Builds the Oxlint-to-ESLint rule-name map from the installed Oxlint inventory.
 * Unknown scopes are ignored because they do not have a known ESLint equivalent.
 */
export function buildOxlintRuleMetadata(
  inventory: unknown,
  typescriptRules?: unknown,
): OxlintRuleMetadataMap {
  if (!Array.isArray(inventory)) {
    throw new TypeError('Oxlint --rules --format=json returned an unexpected shape.');
  }

  const metadata = new Map<string, OxlintRuleMetadata>();
  const typescriptExtensions = getTypescriptExtensions(typescriptRules);

  for (const rule of inventory) {
    if (
      !isObject(rule) ||
      typeof rule.scope !== 'string' ||
      typeof rule.value !== 'string' ||
      typeof rule.type_aware !== 'boolean'
    ) {
      throw new TypeError('Oxlint --rules --format=json returned an invalid rule.');
    }

    const eslintRules = toEslintRuleNames(rule.scope, rule.value, typescriptExtensions);

    if (eslintRules.length === 0) {
      continue;
    }

    const oxlintRule = rule.scope === 'eslint' ? rule.value : `${rule.scope}/${rule.value}`;

    metadata.set(oxlintRule, {
      eslintRules,
      typeAware: rule.type_aware,
    });
  }

  return metadata;
}

function getRuleMetadata(
  ruleName: string,
  metadata: OxlintRuleMetadataMap,
): OxlintRuleMetadata | undefined {
  const direct = metadata.get(ruleName);

  if (direct) {
    return direct;
  }

  for (const [alias, normalizedPrefix] of Object.entries(RULE_PREFIX_ALIASES)) {
    const aliasPrefix = `${alias}/`;

    if (ruleName.startsWith(aliasPrefix)) {
      return metadata.get(`${normalizedPrefix}/${ruleName.slice(aliasPrefix.length)}`);
    }
  }

  return undefined;
}

function applyRuntimeRules(
  configuredRules: Readonly<Record<string, unknown>>,
  rules: RuleMap,
  typeAware: boolean,
  metadata: OxlintRuleMetadataMap,
  registeredRuleNames?: ReadonlySet<string>,
): void {
  const disabledRules = rules;

  for (const [configuredRule, value] of Object.entries(configuredRules)) {
    const ruleMetadata = getRuleMetadata(configuredRule, metadata);

    if (!ruleMetadata || (ruleMetadata.typeAware && !typeAware)) {
      continue;
    }

    for (const eslintRule of ruleMetadata.eslintRules) {
      // Only emit disable directives for rules whose ESLint plugin is actually
      // registered. Setting an unregistered rule to `'off'` is harmless on its
      // own, but it misleads consumers into thinking the rule is owned by ESLint
      // and safe to reference in `eslint-disable` comments — which then fail
      // with "Definition for rule 'X' was not found" in ESLint v10.
      if (registeredRuleNames && !registeredRuleNames.has(eslintRule)) {
        continue;
      }

      if (isActive(value)) {
        disabledRules[eslintRule] = 'off';
      } else if (isInactive(value)) {
        // `eslintRule` is a controlled rule name from the metadata map, not an
        // arbitrary user key, so dynamic deletion is safe here.
        // oxlint-disable-next-line typescript/no-dynamic-delete
        delete disabledRules[eslintRule];
      }
    }
  }
}

function appendRuleConfigs(
  configs: FlatConfigArray,
  name: string,
  rules: RuleMap,
  files?: readonly string[],
  ignores: readonly string[] = [],
): void {
  const componentRules = Object.fromEntries(
    Object.entries(rules).filter(([rule]) => RULES_UNSUPPORTED_IN_COMPONENT_FILES.has(rule)),
  ) as RuleMap;
  const regularRules = Object.fromEntries(
    Object.entries(rules).filter(([rule]) => !RULES_UNSUPPORTED_IN_COMPONENT_FILES.has(rule)),
  ) as RuleMap;
  const commonConfig = {
    ...(files && { files: [...files] }),
  } satisfies FlatConfig;

  if (Object.keys(regularRules).length > 0) {
    configs.push({
      ...commonConfig,
      name,
      ...(ignores.length > 0 && { ignores: [...ignores] }),
      rules: regularRules,
    });
  }

  if (Object.keys(componentRules).length > 0) {
    configs.push({
      ...commonConfig,
      name: `${name}-component-exceptions`,
      ignores: [...ignores, ...COMPONENT_FILE_IGNORES],
      rules: componentRules,
    });
  }
}

/**
 * Converts Oxlint's normalized `--print-config` output to ESLint rule-disable configs.
 * Oxlint runtime state is authoritative; its rule inventory supplies rule-name mappings.
 */
export function buildDisabledOxlintRulesFromRuntimeConfig(
  config: OxlintRuntimeConfig,
  metadata: OxlintRuleMetadataMap,
  registeredRuleNames?: ReadonlySet<string>,
): FlatConfigArray {
  if (!isObject(config) || !isObject(config.rules)) {
    throw new TypeError('Oxlint --print-config returned an unexpected configuration shape.');
  }

  if (config.jsPlugins && (!Array.isArray(config.jsPlugins) || config.jsPlugins.length > 0)) {
    throw new Error(
      'Pairing external Oxlint JavaScript plugins is not supported because --print-config does not expose their resolved rules.',
    );
  }

  const typeAware = config.options?.typeAware === true;
  const configs: FlatConfigArray = [];
  const rootRules: RuleMap = {};

  applyRuntimeRules(config.rules, rootRules, typeAware, metadata, registeredRuleNames);
  appendRuleConfigs(configs, 'oxlint/from-runtime-config', rootRules);

  for (const [index, override] of (config.overrides ?? []).entries()) {
    if (!isObject(override) || !Array.isArray(override.files)) {
      throw new TypeError('Oxlint --print-config returned an invalid override.');
    }

    if (
      (override.plugins !== null && override.plugins !== undefined) ||
      (override.jsPlugins !== null && override.jsPlugins !== undefined)
    ) {
      throw new Error(
        'Pairing Oxlint overrides that change plugins is not supported because --print-config cannot expose their per-file category expansion.',
      );
    }

    const overrideRules: RuleMap = {};

    if (override.rules) {
      applyRuntimeRules(override.rules, overrideRules, typeAware, metadata, registeredRuleNames);
    }

    appendRuleConfigs(
      configs,
      `oxlint/from-runtime-config-override-${index}`,
      overrideRules,
      override.files,
      override.excludeFiles ?? [],
    );
  }

  return configs;
}
