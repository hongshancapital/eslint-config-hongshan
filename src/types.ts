import type { Linter } from 'eslint';
import type { defineConfig as defineEslintConfig } from 'eslint/config';

export type FlatConfig = Linter.Config;

export type FlatConfigArray = Linter.Config[];

export type FlatConfigInput = Parameters<typeof defineEslintConfig>[number];

export type ReactHooksPreset = 'core' | 'recommended' | 'recommended-latest';

export interface Options {
  /** 额外 ignore 模式（在默认生成目录之后追加） */
  ignores?: readonly string[];

  /** 与 ESLint 配对的 Oxlint 配置；相对字符串基于 process.cwd()。 */
  oxlintConfigFile?: string | URL;

  /**
   * 是否启用 React 规则
   * @default false
   */
  react?: boolean;

  /**
   * React Hooks 规则档位；仅在 `react = true` 时生效。
   * `core` 只启用 rules-of-hooks 和 exhaustive-deps。
   * @default 'core'
   */
  reactHooks?: ReactHooksPreset;

  /**
   * TypeScript 规则档位。`true` = 'recommended'；`false` 同时禁用 TypeScript parser。
   * @default true
   */
  typescript?: boolean | 'strict';
}

export type { Linter };
