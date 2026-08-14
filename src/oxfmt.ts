import { defineConfig as defineOxfmtConfig, type OxfmtConfig } from 'oxfmt';

import { GLOB_EXCLUDE } from './globs';

const defaults = {
  printWidth: 100,
  semi: true,
  singleQuote: true,
  sortImports: false,
  sortPackageJson: true,
  sortTailwindcss: true,
  tabWidth: 2,
  trailingComma: 'all',
} satisfies OxfmtConfig;

export function defineConfig({ ignorePatterns = [], ...config }: OxfmtConfig = {}): OxfmtConfig {
  return defineOxfmtConfig({
    ...defaults,
    ...config,
    ignorePatterns: [...GLOB_EXCLUDE, ...ignorePatterns],
  });
}

export type { OxfmtConfig };
