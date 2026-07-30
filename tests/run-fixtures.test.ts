import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

import { defineConfig, type FlatConfigInput } from '../src';
import {
  GLOB_ALL_SRC,
  GLOB_EXCLUDE,
  GLOB_JSX,
  GLOB_SRC,
  GLOB_SRC_EXT,
  GLOB_TESTS,
  GLOB_TSX,
} from '../src/globs';
import { defineConfig as defineOxfmtConfig } from '../src/oxfmt';
import { defineConfig as defineOxlintConfig, OXLINT_DEFAULT_PLUGINS } from '../src/oxlint';

const currentFilename = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilename);
const require = createRequire(import.meta.url);
const fixturesDir = path.join(currentDirectory, 'fixtures');
const backendOxlintConfigFile = new URL('./fixtures/oxlint.backend.ts', import.meta.url);
const frontendOxlintConfigFile = new URL('./fixtures/oxlint.frontend.ts', import.meta.url);

async function createEslint(
  options: Parameters<typeof defineConfig>[0] = {},
  ...userConfigs: FlatConfigInput[]
) {
  return new ESLint({
    cwd: fixturesDir,
    overrideConfig: await defineConfig(options, ...userConfigs),
    overrideConfigFile: true,
  });
}

const frontendEslint = await createEslint({
  oxlintConfigFile: frontendOxlintConfigFile,
  react: true,
});

describe('glob exports', () => {
  it('keeps source, test, and exclusion patterns aligned', () => {
    expect(GLOB_SRC).toBe(`**/*.${GLOB_SRC_EXT}`);
    expect(GLOB_TESTS).toContain(`**/*.test.${GLOB_SRC_EXT}`);
    expect(GLOB_ALL_SRC).toContain(GLOB_SRC);
    expect(GLOB_EXCLUDE).toContain('**/dist');
    expect(GLOB_EXCLUDE).toContain('**/next-env.d.ts');
    expect(GLOB_EXCLUDE).not.toContain('**/.*/skills');
  });
});

describe('ESLint config fixtures', () => {
  it.each([
    'javascript/valid/basic.ts',
    'javascript/valid/object-shorthand.ts',
    'javascript/valid/destructuring-shorthand.ts',
    'config-files/valid/default-export.ts',
    'typescript/valid/basic.ts',
    'typescript/valid/consistent-type-imports.ts',
    'react/valid/basic.tsx',
    'react/valid/component-props.tsx',
    'imports/valid/sorted.ts',
  ])('accepts %s', async (file) => {
    const [result] = await frontendEslint.lintFiles(path.join(fixturesDir, file));

    expect(result?.messages).toEqual([]);
  });

  it.each([
    ['javascript/invalid/no-restricted-syntax.ts', 'no-restricted-syntax'],
    ['javascript/invalid/no-secrets.ts', 'no-secrets/no-secrets'],
    ['typescript/invalid/naming-convention.ts', '@typescript-eslint/naming-convention'],
    ['typescript/invalid/no-explicit-any.ts', '@typescript-eslint/no-explicit-any'],
  ])('%s is still checked by %s', async (file, expectedRule) => {
    const [result] = await frontendEslint.lintFiles(path.join(fixturesDir, file));

    expect(result?.messages.some((message) => message.ruleId === expectedRule)).toBe(true);
  });
});

describe('ESLint config composition', () => {
  it('works without an Oxlint config', async () => {
    const originalCwd = process.cwd();
    let config: Awaited<ReturnType<typeof defineConfig>>;

    try {
      process.chdir(fixturesDir);
      config = await defineConfig({ typescript: false });
    } finally {
      process.chdir(originalCwd);
    }

    const eslint = new ESLint({ overrideConfig: config, overrideConfigFile: true });
    const [result] = await eslint.lintText('const answer = 42;', { filePath: 'example.js' });

    expect(result?.fatalErrorCount).toBe(0);
  });

  it('throws when an explicit Oxlint config does not exist', async () => {
    await expect(
      defineConfig({
        oxlintConfigFile: new URL('./fixtures/missing-oxlint.config.ts', import.meta.url),
      }),
    ).rejects.toThrow('Cannot find the specified Oxlint config');
  });

  it('does not apply TypeScript rules to JavaScript files', async () => {
    const eslint = await createEslint({ oxlintConfigFile: backendOxlintConfigFile });
    const config = await eslint.calculateConfigForFile('example.js');

    expect(config?.rules['@typescript-eslint/no-explicit-any']).toBeUndefined();
  });

  it('does not inherit ignores from the paired Oxlint config', async () => {
    const eslint = await createEslint({
      oxlintConfigFile: frontendOxlintConfigFile,
      typescript: false,
    });
    const [result] = await eslint.lintText('const values = []; values.unshift(1);', {
      filePath: 'oxlint-only/example.js',
    });

    expect(result?.messages.some((message) => message.ruleId === 'no-restricted-syntax')).toBe(
      true,
    );
    expect(result?.messages.some((message) => message.ruleId === null)).toBe(false);
  });

  it('supports React without TypeScript', async () => {
    const eslint = await createEslint({
      oxlintConfigFile: frontendOxlintConfigFile,
      react: true,
      typescript: false,
    });
    const [result] = await eslint.lintText(
      'export default function Component() { return <div />; }',
      { filePath: 'component.jsx' },
    );

    expect(result?.fatalErrorCount).toBe(0);
  });

  it('does not reference TypeScript plugin rules for JSX in a .tsx file when disabled', async () => {
    const eslint = await createEslint({
      oxlintConfigFile: frontendOxlintConfigFile,
      react: true,
      typescript: false,
    });
    const [result] = await eslint.lintText(
      'export default function Component() { return <div />; }',
      { filePath: 'component.tsx' },
    );

    expect(result?.fatalErrorCount).toBe(0);
  });

  it('merges default and user globals using native flat config semantics', async () => {
    const eslint = await createEslint(
      { oxlintConfigFile: backendOxlintConfigFile, typescript: false },
      [{ languageOptions: { globals: { process: 'off', testGlobal: 'readonly' } } }],
    );
    const config = await eslint.calculateConfigForFile('example.js');

    expect(config?.languageOptions.globals).toMatchObject({
      document: false,
      process: 'off',
      testGlobal: 'readonly',
    });
  });

  it('reports a hooks violation once', async () => {
    const eslint = await createEslint(
      { oxlintConfigFile: frontendOxlintConfigFile, react: true },
      { languageOptions: { globals: { useState: 'readonly' } } },
    );
    const [result] = await eslint.lintText(
      'export function Component({ ok }) { if (ok) { useState(0); } return <div />; }',
      { filePath: 'component.jsx' },
    );
    const rulesOfHooks = result?.messages.filter((message) =>
      message.ruleId?.endsWith('/rules-of-hooks'),
    );

    expect(rulesOfHooks).toHaveLength(1);
  });

  it.each(['use-thing.js', 'use-thing.ts'])('checks hooks in %s', async (filePath) => {
    const eslint = await createEslint(
      { oxlintConfigFile: frontendOxlintConfigFile, react: true },
      { languageOptions: { globals: { useState: 'readonly' } } },
    );
    const [result] = await eslint.lintText(
      'export function useThing(ok) { if (ok) { useState(0); } }',
      { filePath },
    );

    expect(
      result?.messages.some((message) => message.ruleId === 'react-hooks/rules-of-hooks'),
    ).toBe(true);
  });

  it('uses the core React Hooks rules by default', async () => {
    const eslint = await createEslint({
      oxlintConfigFile: frontendOxlintConfigFile,
      react: true,
      typescript: false,
    });
    const config = await eslint.calculateConfigForFile('component.jsx');

    expect(config?.rules['react-hooks/rules-of-hooks']?.[0]).toBe(2);
    expect(config?.rules['react-hooks/exhaustive-deps']?.[0]).toBe(1);
    expect(config?.rules['react-hooks/static-components']).toBeUndefined();
    expect(config?.rules['react-hooks/use-memo']).toBeUndefined();
  });

  it.each([
    ['recommended', undefined],
    ['recommended-latest', 2],
  ] as const)('supports the %s React Hooks preset', async (reactHooks, voidUseMemoSeverity) => {
    const eslint = await createEslint({
      oxlintConfigFile: frontendOxlintConfigFile,
      react: true,
      reactHooks,
      typescript: false,
    });
    const config = await eslint.calculateConfigForFile('component.jsx');

    expect(config?.rules['react-hooks/static-components']?.[0]).toBe(2);
    expect(config?.rules['react-hooks/void-use-memo']?.[0]).toBe(voidUseMemoSeverity);
  });

  it('keeps inactive Nursery fallback in ESLint', async () => {
    const eslint = await createEslint({
      oxlintConfigFile: backendOxlintConfigFile,
    });
    const config = await eslint.calculateConfigForFile('typescript/valid/basic.ts');
    const javascriptConfig = await eslint.calculateConfigForFile('example.js');

    expect(javascriptConfig?.rules['no-undef']?.[0]).toBe(2);
    expect(config?.rules['no-unreachable']?.[0]).toBe(0);
    expect(config?.rules['@typescript-eslint/no-unused-vars']?.[0]).toBe(0);
  });

  it.each(['eslint.config.js', 'example.test.js', 'scripts/build.js'])(
    'keeps residual syntax restrictions in %s',
    async (filePath) => {
      const eslint = await createEslint({
        oxlintConfigFile: backendOxlintConfigFile,
        typescript: false,
      });
      const [result] = await eslint.lintText('const values = []; values.unshift(1);', {
        filePath,
      });

      expect(result?.messages.some((message) => message.ruleId === 'no-restricted-syntax')).toBe(
        true,
      );
    },
  );

  it('allows references to mutating methods', async () => {
    const eslint = await createEslint({
      oxlintConfigFile: backendOxlintConfigFile,
      typescript: false,
    });
    const [result] = await eslint.lintText(
      'const values = [1]; const callback = Array.of(values.pop); export { callback };',
      { filePath: 'example.js' },
    );

    expect(result?.messages.some((message) => message.ruleId === 'no-restricted-syntax')).toBe(
      false,
    );
  });

  it('does not apply JavaScript rules to user-added non-source languages', async () => {
    const eslint = await createEslint(
      { oxlintConfigFile: backendOxlintConfigFile, typescript: false },
      { files: ['**/*.json'] },
    );
    const config = await eslint.calculateConfigForFile('data.json');

    expect(config?.rules['no-undef']).toBeUndefined();
  });

  it('disables rules owned by the paired Oxlint config', async () => {
    const eslint = await createEslint({ oxlintConfigFile: backendOxlintConfigFile });
    const config = await eslint.calculateConfigForFile('example.js');

    expect(config?.rules.eqeqeq?.[0]).toBe(0);
    expect(config?.rules['no-console']?.[0]).toBe(0);
  });
});

describe('Oxlint config', () => {
  it('provides frontend and backend presets', () => {
    const frontend = defineOxlintConfig({ preset: 'frontend' });
    const backend = defineOxlintConfig({ preset: 'backend' });

    expect(frontend.plugins).toEqual(OXLINT_DEFAULT_PLUGINS.frontend);
    expect(frontend.env).toMatchObject({ browser: true });
    expect(backend.plugins).toEqual(OXLINT_DEFAULT_PLUGINS.backend);
    expect(backend.plugins).not.toContain('react');
    expect(backend.env).toMatchObject({ node: true });
    expect(frontend.categories).toEqual({ correctness: 'error' });
    expect(frontend.overrides?.[0]?.files).toEqual([GLOB_JSX, GLOB_TSX]);
  });

  it('lets explicit plugins replace the preset defaults', () => {
    const config = defineOxlintConfig({
      preset: 'backend',
      plugins: ['react', 'jest'],
      env: { browser: true },
      rules: { eqeqeq: 'warn' },
    });
    const withoutPlugins = defineOxlintConfig({
      preset: 'frontend',
      plugins: [],
    });

    expect(config.plugins).toEqual(['react', 'jest']);
    expect(withoutPlugins.plugins).toEqual([]);
    expect(withoutPlugins.rules?.['react/no-array-index-key']).toBeUndefined();
    expect(withoutPlugins.overrides).toEqual([]);
    expect(config.env).toMatchObject({ browser: true, node: true });
    expect(config.rules?.eqeqeq).toBe('warn');
  });

  it('does not rewrite explicit plugins when react defaults are disabled', () => {
    const enabled = defineOxlintConfig({ preset: 'backend', plugins: ['react'] });
    const disabled = defineOxlintConfig({
      preset: 'backend',
      plugins: ['react'],
      react: false,
    });
    const disabledPresetRules = defineOxlintConfig({
      preset: 'frontend',
      react: false,
    });

    expect(enabled.plugins).toEqual(['react']);
    expect(enabled.rules?.['react/no-array-index-key']).toBe('error');
    expect(disabled.plugins).toEqual(['react']);
    expect(disabled.rules?.['react/no-array-index-key']).toBeUndefined();
    expect(disabledPresetRules.plugins).toEqual(OXLINT_DEFAULT_PLUGINS.frontend);
    expect(disabledPresetRules.rules?.['react/no-array-index-key']).toBeUndefined();
  });

  it('uses selected Nursery rules but leaves React Hooks to ESLint', () => {
    const config = defineOxlintConfig({ preset: 'frontend' });

    expect(config.rules?.['import/export']).toBe('error');
    expect(config.rules?.['import/named']).toBeUndefined();
    expect(config.rules?.['react-hooks/exhaustive-deps']).toBe('off');
    expect(config.rules?.['react-hooks/rules-of-hooks']).toBe('off');
  });

  it('preserves historical rule options without file-type exemptions', () => {
    const config = defineOxlintConfig({ preset: 'backend' });

    expect(config.rules?.['no-console']).toEqual(['error', { allow: ['info', 'warn', 'error'] }]);
    expect(config.rules?.['no-restricted-imports']).toEqual(['error', { paths: ['console'] }]);
    expect(config.overrides).toEqual([]);
  });
});

describe('Oxfmt config', () => {
  it('owns formatting and sorting while allowing user overrides', () => {
    const config = defineOxfmtConfig({ ignorePatterns: ['generated/**'] });
    const withoutSort = defineOxfmtConfig({ sortImports: false });
    const withoutTailwindSort = defineOxfmtConfig({ sortTailwindcss: false });

    expect(config).toMatchObject({
      printWidth: 100,
      singleQuote: true,
      sortImports: true,
      sortPackageJson: true,
      sortTailwindcss: true,
    });
    expect(config.ignorePatterns).toContain('generated/**');
    expect(withoutSort.sortImports).toBe(false);
    expect(withoutTailwindSort.sortTailwindcss).toBe(false);
  });
});

describe('Formatter alternatives', () => {
  it('publishes Prettier and Oxfmt as optional choices', () => {
    const prettierConfig =
      require('@hongshancapital/eslint-config-hongshan/prettier.json') as Record<string, unknown>;
    const packageJson = require('../package.json') as {
      peerDependenciesMeta: Record<string, { optional?: boolean }>;
    };

    expect(prettierConfig).toMatchObject({
      printWidth: 100,
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: 'all',
    });
    expect(packageJson.peerDependenciesMeta).toMatchObject({
      oxfmt: { optional: true },
      prettier: { optional: true },
    });
  });
});
