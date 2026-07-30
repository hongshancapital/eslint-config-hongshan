import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

import { defineConfig, type FlatConfigInput, type Options } from '../src';
import { buildOxlintRuleMetadata } from '../src/configs/oxlint-pairing';

const fixturesDirectory = new URL('./fixtures/pairing/', import.meta.url);
const projectDirectory = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const oxlintBin = path.join(projectDirectory, 'node_modules/oxlint/bin/oxlint');

function runOxlint(oxlintConfigFile: URL, fixtureFile: URL) {
  const result = spawnSync(
    process.execPath,
    [
      oxlintBin,
      '--config',
      fileURLToPath(oxlintConfigFile),
      '--format',
      'json',
      fileURLToPath(fixtureFile),
    ],
    { cwd: projectDirectory, encoding: 'utf8' },
  );
  const output = JSON.parse(result.stdout) as {
    diagnostics: Array<{ code: string }>;
  };

  return { output, result };
}

function printOxlintConfig(oxlintConfigFile: URL) {
  const result = spawnSync(
    process.execPath,
    [oxlintBin, '--config', fileURLToPath(oxlintConfigFile), '--print-config'],
    { cwd: projectDirectory, encoding: 'utf8' },
  );
  const output = JSON.parse(result.stdout) as {
    options?: {
      typeAware?: boolean;
    };
    rules: Record<string, unknown>;
  };

  return { output, result };
}

async function createEslint(oxlintConfigFile: URL, ...userConfigs: FlatConfigInput[]) {
  return createEslintWithOptions(oxlintConfigFile, { typescript: false }, ...userConfigs);
}

async function createEslintWithOptions(
  oxlintConfigFile: URL,
  options: Omit<Options, 'oxlintConfigFile'>,
  ...userConfigs: FlatConfigInput[]
) {
  return new ESLint({
    cwd: fileURLToPath(fixturesDirectory),
    overrideConfig: await defineConfig({ ...options, oxlintConfigFile }, ...userConfigs),
    overrideConfigFile: true,
  });
}

describe('Oxlint and ESLint rule ownership', () => {
  it('auto-discovers the Oxlint config when no file is explicitly provided', async () => {
    const configs = await defineConfig({ typescript: false });

    expect(configs.some((config) => config.name === 'oxlint/from-runtime-config')).toBe(true);
  });

  it('maps Oxlint scopes and one-to-many ESLint aliases', () => {
    const metadata = buildOxlintRuleMetadata(
      [
        { scope: 'eslint', type_aware: false, value: 'no-throw-literal' },
        { scope: 'import', type_aware: false, value: 'no-duplicates' },
        { scope: 'jsx_a11y', type_aware: false, value: 'alt-text' },
        { scope: 'nextjs', type_aware: false, value: 'no-img-element' },
        { scope: 'node', type_aware: false, value: 'no-process-exit' },
        { scope: 'react', type_aware: false, value: 'rules-of-hooks' },
        { scope: 'react', type_aware: false, value: 'only-export-components' },
        { scope: 'oxc', type_aware: false, value: 'only-used-in-recursion' },
        { scope: 'unknown', type_aware: false, value: 'future-rule' },
      ],
      {
        'only-throw-error': {
          meta: {
            docs: {
              extendsBaseRule: 'no-throw-literal',
            },
          },
        },
      },
    );

    expect(metadata.get('no-throw-literal')?.eslintRules).toEqual([
      'no-throw-literal',
      '@typescript-eslint/only-throw-error',
    ]);
    expect(metadata.get('import/no-duplicates')?.eslintRules).toEqual([
      'import/no-duplicates',
      'import-x/no-duplicates',
    ]);
    expect(metadata.get('jsx_a11y/alt-text')?.eslintRules).toEqual(['jsx-a11y/alt-text']);
    expect(metadata.get('nextjs/no-img-element')?.eslintRules).toEqual([
      '@next/next/no-img-element',
    ]);
    expect(metadata.get('node/no-process-exit')?.eslintRules).toEqual(['n/no-process-exit']);
    expect(metadata.get('react/rules-of-hooks')?.eslintRules).toEqual([
      'react-hooks/rules-of-hooks',
    ]);
    expect(metadata.get('react/only-export-components')?.eslintRules).toEqual([
      'react/only-export-components',
      'react-refresh/only-export-components',
    ]);
    expect(metadata.has('oxc/only-used-in-recursion')).toBe(false);
    expect(metadata.has('unknown/future-rule')).toBe(false);
  });

  it('rejects non-TypeScript Oxlint configs', async () => {
    await expect(
      defineConfig({
        oxlintConfigFile: new URL('./unsupported.json', fixturesDirectory),
        typescript: false,
      }),
    ).rejects.toThrow('Only .ts and .mts are supported');
  });

  it('disables built-in ESLint overlap owned by the paired Oxlint config', async () => {
    const eslint = await createEslint(new URL('./override-off.config.ts', fixturesDirectory));
    const config = await eslint.calculateConfigForFile('example.js');

    expect(config?.rules.eqeqeq?.[0]).toBe(0);
  });

  it('uses Oxlint runtime defaults when deriving ESLint overlap', async () => {
    const oxlintConfigFile = new URL('./runtime-defaults.config.ts', fixturesDirectory);
    const { output: oxlintConfig, result: oxlintResult } = printOxlintConfig(oxlintConfigFile);
    const eslint = await createEslint(oxlintConfigFile);
    const eslintConfig = await eslint.calculateConfigForFile('example.js');

    expect(oxlintResult.status).toBe(0);
    expect(oxlintConfig.rules['no-debugger']).toBe('warn');
    expect(eslintConfig?.rules['no-debugger']?.[0]).toBe(0);
  });

  it('uses the installed Oxlint inventory and disables every ESLint alias', async () => {
    const oxlintConfigFile = new URL('./runtime-installed-inventory.config.ts', fixturesDirectory);
    const eslint = await createEslint(oxlintConfigFile);
    const eslintConfig = await eslint.calculateConfigForFile('example.js');

    expect(eslintConfig?.rules['id-denylist']?.[0]).toBe(0);
    expect(eslintConfig?.rules['import/no-duplicates']?.[0]).toBe(0);
    expect(eslintConfig?.rules['import-x/no-duplicates']?.[0]).toBe(0);
  });

  it('disables TypeScript extension aliases for active core Oxlint rules', async () => {
    const oxlintConfigFile = new URL('./runtime-defaults.config.ts', fixturesDirectory);
    const { output: oxlintConfig } = printOxlintConfig(oxlintConfigFile);
    const eslint = await createEslintWithOptions(oxlintConfigFile, { typescript: true });
    const eslintConfig = await eslint.calculateConfigForFile('example.ts');

    expect(oxlintConfig.rules['no-unused-vars']).toBe('warn');
    expect(eslintConfig?.rules['no-unused-vars']?.[0]).toBe(0);
    expect(eslintConfig?.rules['@typescript-eslint/no-unused-vars']?.[0]).toBe(0);
  });

  it('uses TypeScript ESLint metadata to disable every core-rule extension', async () => {
    const oxlintConfigFile = new URL('./runtime-typescript-aliases.config.ts', fixturesDirectory);
    const { output: oxlintConfig } = printOxlintConfig(oxlintConfigFile);
    const eslint = await createEslintWithOptions(oxlintConfigFile, {
      typescript: true,
    });
    const eslintConfig = await eslint.calculateConfigForFile('typescript/valid/basic.ts');
    const extendedRules = [
      ['no-implied-eval', 'no-implied-eval'],
      ['no-throw-literal', 'only-throw-error'],
      ['prefer-promise-reject-errors', 'prefer-promise-reject-errors'],
      ['require-await', 'require-await'],
    ] as const;

    for (const [eslintRule, typescriptRule] of extendedRules) {
      expect(oxlintConfig.rules[eslintRule]).toBe('deny');
      expect(eslintConfig?.rules[eslintRule]?.[0]).toBe(0);
      expect(eslintConfig?.rules[`@typescript-eslint/${typescriptRule}`]?.[0]).toBe(0);
    }
  });

  it('disables explicitly active Nursery overlap', async () => {
    const oxlintConfigFile = new URL('./runtime-nursery.config.ts', fixturesDirectory);
    const { output: oxlintConfig } = printOxlintConfig(oxlintConfigFile);
    const eslint = await createEslint(oxlintConfigFile);
    const eslintConfig = await eslint.calculateConfigForFile('example.js');

    expect(oxlintConfig.rules['no-undef']).toBe('deny');
    expect(eslintConfig?.rules['no-undef']?.[0]).toBe(0);
  });

  it('disables type-aware ESLint rules when Oxlint type-aware runtime is enabled', async () => {
    const oxlintConfigFile = new URL('./runtime-type-aware.config.ts', fixturesDirectory);
    const { output: oxlintConfig } = printOxlintConfig(oxlintConfigFile);
    const eslint = await createEslintWithOptions(oxlintConfigFile, {
      typescript: true,
    });
    const eslintConfig = await eslint.calculateConfigForFile('typescript/valid/basic.ts');

    expect(oxlintConfig.options?.typeAware).toBe(true);
    expect(oxlintConfig.rules['typescript/await-thenable']).toBe('warn');
    expect(eslintConfig?.rules['@typescript-eslint/await-thenable']?.[0]).toBe(0);
  });

  it('does not disable rules discarded by the Oxlint runtime', async () => {
    const oxlintConfigFile = new URL('./runtime-disabled-plugin.config.ts', fixturesDirectory);
    const { output: oxlintConfig } = printOxlintConfig(oxlintConfigFile);
    const eslint = await createEslint(oxlintConfigFile);
    const eslintConfig = await eslint.calculateConfigForFile('example.js');

    expect(oxlintConfig.rules['react/jsx-key']).toBeUndefined();
    expect(eslintConfig?.rules['react/jsx-key']).toBeUndefined();
  });

  it.each(['override-empty-plugins.config.ts', 'override-empty-js-plugins.config.ts'])(
    'rejects per-file plugin changes that Oxlint cannot print in %s',
    async (configFile) => {
      await expect(
        defineConfig({
          oxlintConfigFile: new URL(configFile, fixturesDirectory),
          typescript: false,
        }),
      ).rejects.toThrow('overrides that change plugins');
    },
  );

  it('lets ESLint reclaim a rule disabled by an Oxlint override', async () => {
    const oxlintConfigFile = new URL('./override-off.config.ts', fixturesDirectory);
    const fixtureFile = new URL('./example.case.js', fixturesDirectory);
    const { output: oxlintOutput, result: oxlintResult } = runOxlint(oxlintConfigFile, fixtureFile);
    const eslint = await createEslint(oxlintConfigFile, {
      files: ['**/*.case.js'],
      rules: {
        eqeqeq: 'error',
      },
    });
    const [eslintResult] = await eslint.lintFiles(fileURLToPath(fixtureFile));

    expect(oxlintResult.status).toBe(0);
    expect(oxlintOutput.diagnostics.map((diagnostic) => diagnostic.code)).not.toContain(
      'eslint(eqeqeq)',
    );
    expect(eslintResult?.messages.map((message) => message.ruleId)).toContain('eqeqeq');
  });

  it('preserves excludeFiles when translating Oxlint overrides', async () => {
    const oxlintConfigFile = new URL('./override-exclude.config.ts', fixturesDirectory);
    const includedFile = new URL('./included.case.js', fixturesDirectory);
    const excludedFile = new URL('./excluded.excluded.case.js', fixturesDirectory);
    const includedOxlint = runOxlint(oxlintConfigFile, includedFile);
    const excludedOxlint = runOxlint(oxlintConfigFile, excludedFile);
    const eslint = await createEslint(oxlintConfigFile);
    const includedConfig = await eslint.calculateConfigForFile('included.case.js');
    const excludedConfig = await eslint.calculateConfigForFile('excluded.excluded.case.js');

    expect(includedOxlint.result.status).toBe(1);
    expect(includedOxlint.output.diagnostics.map(({ code }) => code)).toContain(
      'eslint(no-debugger)',
    );
    expect(excludedOxlint.result.status).toBe(0);
    expect(includedConfig?.rules['no-debugger']?.[0]).toBe(0);
    expect(excludedConfig?.rules['no-debugger']?.[0]).toBe(2);
  });

  it.each(['extends-order.config.ts', 'extends-order.config.mts'])(
    'uses later Oxlint extensions when sibling rules conflict in %s',
    async (configFile) => {
      const oxlintConfigFile = new URL(configFile, fixturesDirectory);
      const fixtureFile = new URL('./extends-order.case.js', fixturesDirectory);
      const { output, result } = runOxlint(oxlintConfigFile, fixtureFile);
      const eslint = await createEslint(oxlintConfigFile);
      const config = await eslint.calculateConfigForFile('extends-order.case.js');
      const codes = output.diagnostics.map((diagnostic) => diagnostic.code);

      expect(result.status).toBe(1);
      expect(codes).toContain('eslint(no-debugger)');
      expect(codes).not.toContain('eslint(no-undef)');
      expect(config?.rules['no-debugger']?.[0]).toBe(0);
      expect(config?.rules['no-undef']?.[0]).toBe(2);
    },
  );

  it.each(['extends-categories.config.ts', 'extends-categories.config.mts'])(
    'inherits Oxlint categories from extensions in %s',
    async (configFile) => {
      const oxlintConfigFile = new URL(configFile, fixturesDirectory);
      const fixtureFile = new URL('./extends-categories.case.js', fixturesDirectory);
      const { output, result } = runOxlint(oxlintConfigFile, fixtureFile);
      const eslint = await createEslint(oxlintConfigFile);
      const config = await eslint.calculateConfigForFile('extends-categories.case.js');
      const codes = output.diagnostics.map((diagnostic) => diagnostic.code);

      expect(result.status).toBe(1);
      expect(codes).toContain('eslint(eqeqeq)');
      expect(codes).not.toContain('eslint(no-undef)');
      expect(config?.rules.eqeqeq?.[0]).toBe(0);
      expect(config?.rules['no-undef']?.[0]).toBe(2);
    },
  );
});
