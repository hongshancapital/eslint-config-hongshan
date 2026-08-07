import { defineConfig, type ReactHooksPreset } from '../src';
import { GLOB_EXCLUDE } from '../src/globs';

const reactHooksPreset: ReactHooksPreset = 'core';

void defineConfig({ ignores: GLOB_EXCLUDE }, [
  [
    {
      extends: [
        [
          {
            rules: {
              eqeqeq: 'error',
            },
          },
        ],
      ],
    },
  ],
]);

void defineConfig({ react: true, reactHooks: reactHooksPreset });
void defineConfig({ react: true, reactHooks: 'recommended' });
void defineConfig({ react: true, reactHooks: 'recommended-latest' });

// @ts-expect-error ESLint type-aware mode was removed for performance.
void defineConfig({ typeChecked: false });

// @ts-expect-error ESLint no longer accepts a tsconfig because it never builds a Program.
void defineConfig({ tsconfigPath: './tsconfig.json' });
