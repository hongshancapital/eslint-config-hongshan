import { createRequire } from 'node:module';

import { describe, expect, it } from 'vitest';

import { defineConfig } from '../src';
import {
  GLOB_ALL_SRC,
  GLOB_ASTRO,
  GLOB_CONFIG_FILES,
  GLOB_EXCLUDE,
  GLOB_GRAPHQL,
  GLOB_JS_ALL,
  GLOB_JSONC,
  GLOB_POSTCSS,
  GLOB_SCRIPTS,
  GLOB_SVG,
  GLOB_TESTS,
  GLOB_TOML,
  GLOB_TS_ALL,
} from '../src/globs';

const require = createRequire(import.meta.url);

describe('public configuration API', () => {
  it('rejects Flat Config fields passed in the options position', async () => {
    await expect(
      defineConfig({
        rules: {
          'no-debugger': 'off',
        },
      } as never),
    ).rejects.toThrow('Unknown defineConfig option "rules"');
  });

  it.each([
    ['typeChecked', false],
    ['tsconfigPath', './tsconfig.json'],
  ])('rejects removed ESLint type-aware option %s', async (option, value) => {
    await expect(defineConfig({ [option]: value } as never)).rejects.toThrow(
      `Unknown defineConfig option "${option}"`,
    );
  });

  it.each([
    ['GLOB_JS_ALL', GLOB_JS_ALL],
    ['GLOB_TS_ALL', GLOB_TS_ALL],
    ['GLOB_TESTS', GLOB_TESTS],
    ['GLOB_CONFIG_FILES', GLOB_CONFIG_FILES],
    ['GLOB_SCRIPTS', GLOB_SCRIPTS],
    ['GLOB_ALL_SRC', GLOB_ALL_SRC],
    ['GLOB_EXCLUDE', GLOB_EXCLUDE],
  ])('keeps exported glob collection %s immutable', (_name, collection) => {
    expect(Object.isFrozen(collection)).toBe(true);
    expect(() => (collection as string[]).push('consumer-mutated/**')).toThrow(TypeError);
  });

  it('includes every exported physical source format in GLOB_ALL_SRC', () => {
    expect(GLOB_ALL_SRC).toEqual(
      expect.arrayContaining([
        GLOB_ASTRO,
        GLOB_GRAPHQL,
        GLOB_JSONC,
        GLOB_POSTCSS,
        GLOB_SVG,
        GLOB_TOML,
      ]),
    );
  });

  it('supports TypeScript 5.4.5 and later without an upper bound', () => {
    const packageJson = require('../package.json') as {
      peerDependencies: { typescript: string };
    };

    expect(packageJson.peerDependencies.typescript).toBe('>=5.4.5');
  });

  it('owns ESLint while consumers own optional tool runtimes', () => {
    const packageJson = require('../package.json') as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
      peerDependencies: Record<string, string>;
      peerDependenciesMeta: Record<string, { optional?: boolean }>;
    };

    expect(packageJson.dependencies.eslint).toMatch(/\d/u);
    expect(packageJson.devDependencies.eslint).toBeUndefined();
    expect(packageJson.peerDependencies.eslint).toBeUndefined();

    for (const optionalPeer of ['oxfmt', 'oxlint', 'prettier']) {
      expect(packageJson.dependencies[optionalPeer]).toBeUndefined();
      expect(packageJson.peerDependencies[optionalPeer]).toMatch(/\d/u);
      expect(packageJson.peerDependenciesMeta[optionalPeer]).toEqual({ optional: true });
    }

    expect(packageJson.dependencies['oxlint-tsgolint']).toBeUndefined();
    expect(packageJson.peerDependencies['oxlint-tsgolint']).toBeUndefined();
  });
});
