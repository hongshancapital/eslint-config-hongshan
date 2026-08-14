import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import js from '@eslint/js';
import { defineConfig as defineEslintConfig } from 'eslint/config';

import { ignores } from './configs/ignores';
import { javascript } from './configs/javascript';
import {
  buildDisabledOxlintRulesFromRuntimeConfig,
  buildOxlintRuleMetadata,
  type OxlintRuleMetadataMap,
  type OxlintRuntimeConfig,
} from './configs/oxlint-pairing';
import { react } from './configs/react';
import { loadTypescriptEslint, typescript } from './configs/typescript';
import type { FlatConfig, FlatConfigArray, FlatConfigInput, Options } from './types';

const OXLINT_CONFIG_FILES = ['oxlint.config.ts', 'oxlint.config.mts'];
const execFileAsync = promisify(execFile);
const oxlintRuleInventoryByBinary = new Map<string, Promise<unknown>>();
const OPTION_KEYS = new Set(['ignores', 'oxlintConfigFile', 'react', 'reactHooks', 'typescript']);

function validateOptions(options: Options): void {
  const unknownOption = Object.keys(options).find((key) => !OPTION_KEYS.has(key));

  if (unknownOption) {
    throw new Error(`Unknown defineConfig option "${unknownOption}"`);
  }

  if (
    options.typescript !== undefined &&
    options.typescript !== 'recommended' &&
    options.typescript !== 'strict'
  ) {
    throw new Error(
      `Invalid typescript option "${options.typescript}". Use 'recommended' or 'strict'.`,
    );
  }
}

function resolveConfigFile(configFile?: string | URL): string | undefined {
  if (configFile) {
    const filePath =
      configFile instanceof URL
        ? fileURLToPath(configFile)
        : path.resolve(process.cwd(), configFile);

    if (!existsSync(filePath)) {
      throw new Error(`Cannot find the specified Oxlint config: ${filePath}`);
    }

    return filePath;
  }

  const candidates = OXLINT_CONFIG_FILES.map((file) => path.resolve(process.cwd(), file)).filter(
    existsSync,
  );

  if (candidates.length > 1) {
    throw new Error(
      `Multiple Oxlint configs found:\n${candidates.join('\n')}\nPass oxlintConfigFile explicitly.`,
    );
  }

  return candidates.at(0);
}

async function runOxlintJson(
  oxlintBin: string,
  args: readonly string[],
  failureMessage: string,
  invalidJsonMessage: string,
): Promise<unknown> {
  let stdout: string;

  try {
    const { stdout: commandOutput } = await execFileAsync(process.execPath, [oxlintBin, ...args], {
      cwd: process.cwd(),
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });

    stdout = commandOutput;
  } catch (error) {
    const result = error as Error & {
      stderr?: Buffer | string;
      stdout?: Buffer | string;
    };
    const output = [result.stdout, result.stderr]
      .map((value) => value?.toString().trim())
      .filter(Boolean)
      .join('\n');

    throw new Error(`${failureMessage}${output ? `\n${output}` : ''}`, {
      cause: error,
    });
  }

  try {
    return JSON.parse(stdout);
  } catch (error) {
    throw new Error(invalidJsonMessage, { cause: error });
  }
}

async function loadOxlintRuleInventory(oxlintBin: string): Promise<unknown> {
  const cached = oxlintRuleInventoryByBinary.get(oxlintBin);

  if (cached) {
    return cached;
  }

  const inventory = runOxlintJson(
    oxlintBin,
    ['--rules', '--format=json'],
    'Failed to read the Oxlint rule inventory.',
    'Oxlint --rules --format=json returned invalid JSON.',
  );

  oxlintRuleInventoryByBinary.set(oxlintBin, inventory);

  try {
    return await inventory;
  } catch (error) {
    if (oxlintRuleInventoryByBinary.get(oxlintBin) === inventory) {
      oxlintRuleInventoryByBinary.delete(oxlintBin);
    }

    throw error;
  }
}

type OxlintPairingData = {
  config: OxlintRuntimeConfig;
  metadata: OxlintRuleMetadataMap;
};

async function loadOxlintPairingData(
  configFile: string | URL | undefined,
): Promise<OxlintPairingData | null> {
  const filePath = resolveConfigFile(configFile);

  if (!filePath) {
    return null;
  }

  const extension = path.extname(filePath);

  if (extension !== '.ts' && extension !== '.mts') {
    throw new Error(`Unsupported Oxlint config: ${filePath}. Only .ts and .mts are supported.`);
  }

  let oxlintBin: string;

  try {
    const packageUrl = import.meta.resolve('oxlint/package.json');
    oxlintBin = fileURLToPath(new URL('./bin/oxlint', packageUrl));
  } catch (error) {
    throw new Error(
      `Cannot resolve Oxlint while pairing ${filePath}. Install a compatible oxlint version as a direct devDependency of the package that runs ESLint.`,
      {
        cause: error,
      },
    );
  }

  const [config, inventory, typescriptEslint] = await Promise.all([
    runOxlintJson(
      oxlintBin,
      ['--config', filePath, '--print-config'],
      `Failed to calculate the Oxlint runtime config: ${filePath}`,
      `Oxlint --print-config returned invalid JSON for ${filePath}`,
    ),
    loadOxlintRuleInventory(oxlintBin),
    loadTypescriptEslint(),
  ]);
  const typescriptRules = (typescriptEslint.default.plugin as unknown as { rules?: unknown }).rules;
  const metadata = buildOxlintRuleMetadata(inventory, typescriptRules);

  return { config: config as OxlintRuntimeConfig, metadata };
}

/**
 * Collects the names of every rule ESLint can resolve from the assembled configs:
 * built-in core rules (from `@eslint/js`) plus every rule exposed by a registered
 * plugin. Used to prevent the Oxlint pairing layer from emitting `'off'` for
 * rules whose ESLint plugin is not installed (which would mislead consumers into
 * referencing them in `eslint-disable` comments).
 */
function collectRegisteredRuleNames(configs: ReadonlyArray<FlatConfig>): Set<string> {
  const ruleNames = new Set<string>();

  for (const ruleName of Object.keys(js.configs.all.rules)) {
    ruleNames.add(ruleName);
  }

  for (const config of configs) {
    if (!config.plugins) {
      continue;
    }

    for (const [pluginName, plugin] of Object.entries(config.plugins)) {
      const rules =
        plugin && typeof plugin === 'object' ? (plugin as { rules?: unknown }).rules : undefined;

      if (rules && typeof rules === 'object') {
        for (const ruleName of Object.keys(rules as Record<string, unknown>)) {
          ruleNames.add(`${pluginName}/${ruleName}`);
        }
      }
    }
  }

  return ruleNames;
}

export async function defineConfig(
  options: Options = {},
  ...userConfigs: FlatConfigInput[]
): Promise<FlatConfigArray> {
  validateOptions(options);

  const { ignores: userIgnores = [], oxlintConfigFile } = options;
  const [oxlintData, typescriptConfigs, reactConfigs] = await Promise.all([
    loadOxlintPairingData(oxlintConfigFile),
    typescript(options),
    react(options),
  ]);

  const jsConfigs = javascript();
  const registeredRuleNames = collectRegisteredRuleNames([
    ...jsConfigs,
    ...typescriptConfigs,
    ...reactConfigs,
  ]);

  const disabledOxlintRules = oxlintData
    ? buildDisabledOxlintRulesFromRuntimeConfig(
        oxlintData.config,
        oxlintData.metadata,
        registeredRuleNames,
      )
    : [];

  return defineEslintConfig([
    ignores(userIgnores),
    ...jsConfigs,
    ...typescriptConfigs,
    ...reactConfigs,
    ...disabledOxlintRules.filter((config) => config.rules !== undefined),
    ...userConfigs,
  ]);
}

export type {
  FlatConfig,
  FlatConfigArray,
  FlatConfigInput,
  Linter,
  Options,
  ReactHooksPreset,
} from './types';
