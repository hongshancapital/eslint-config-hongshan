import { GLOB_EXCLUDE } from '../globs';
import type { FlatConfig } from '../types';

export function ignores(userIgnores: readonly string[] = []): FlatConfig {
  return {
    name: '@hongshancapital/eslint-config-hongshan/ignores',
    ignores: [...GLOB_EXCLUDE, ...userIgnores],
  };
}
