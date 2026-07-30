import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, describe, expect, it } from 'vitest';

import { defineConfig as defineOxfmtConfig } from '../src/oxfmt';
import { defineConfig as defineOxlintConfig } from '../src/oxlint';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.dirname(testsDir);
const fixturesDir = path.join(testsDir, 'fixtures');
const oxlintBin = path.join(projectDir, 'node_modules/oxlint/bin/oxlint');
const oxfmtBin = path.join(projectDir, 'node_modules/oxfmt/bin/oxfmt');
const temporaryDir = mkdtempSync(path.join(tmpdir(), 'eslint-config-scc-'));
const oxlintConfig = path.join(temporaryDir, 'oxlint.json');
const oxfmtConfig = path.join(temporaryDir, 'oxfmt.json');

writeFileSync(oxlintConfig, JSON.stringify(defineOxlintConfig({ preset: 'frontend' })));
writeFileSync(oxfmtConfig, JSON.stringify(defineOxfmtConfig()));
afterAll(() => rmSync(temporaryDir, { force: true, recursive: true }));

function runOxlint(...paths: string[]) {
  return spawnSync(
    process.execPath,
    [oxlintBin, '--config', oxlintConfig, '--format', 'json', ...paths],
    { cwd: projectDir, encoding: 'utf8' },
  );
}

describe('Oxlint CLI fixtures', () => {
  it.each([
    ['javascript/invalid/eqeqeq.ts', 'eslint(eqeqeq)'],
    ['javascript/invalid/no-console.ts', 'eslint(no-console)'],
    ['javascript/invalid/restricted-global.ts', 'eslint(no-restricted-globals)'],
    ['javascript/invalid/no-useless-rename.ts', 'eslint(no-useless-rename)'],
    ['javascript/invalid/unused-var.ts', 'eslint(no-unused-vars)'],
    ['typescript/invalid/consistent-type-imports.ts', 'typescript(consistent-type-imports)'],
    ['imports/invalid/duplicate.ts', 'import(no-duplicates)'],
    ['react/invalid/array-index-key.tsx', 'react(no-array-index-key)'],
  ])('reports %s as %s', (file, expectedRule) => {
    const result = runOxlint(path.join(fixturesDir, file));
    const output = JSON.parse(result.stdout) as { diagnostics: Array<{ code: string }> };

    expect(result.status).toBe(1);
    expect(output.diagnostics.map((diagnostic) => diagnostic.code)).toContain(expectedRule);
  });

  it('accepts valid fixtures', () => {
    const result = runOxlint(
      path.join(fixturesDir, 'javascript/valid'),
      path.join(fixturesDir, 'typescript/valid'),
      path.join(fixturesDir, 'imports/valid'),
      path.join(fixturesDir, 'react/valid'),
    );
    const output = JSON.parse(result.stdout) as { diagnostics: unknown[] };

    expect(result.status).toBe(0);
    expect(output.diagnostics).toEqual([]);
  });
});

describe('Oxfmt CLI fixtures', () => {
  it.each([
    ['source', 'source.ts'],
    ['package', 'package.json'],
    ['tailwind', 'tailwind.tsx'],
  ])('formats and sorts %s', (fixture, fileName) => {
    const input = readFileSync(path.join(fixturesDir, `oxfmt/input/${fixture}.txt`), 'utf8');
    const expected = readFileSync(path.join(fixturesDir, `oxfmt/expected/${fixture}.txt`), 'utf8');
    const result = spawnSync(
      process.execPath,
      [oxfmtBin, '--config', oxfmtConfig, '--stdin-filepath', fileName],
      { cwd: projectDir, encoding: 'utf8', input },
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toBe(expected);
  });
});
