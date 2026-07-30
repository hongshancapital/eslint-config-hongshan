export const GLOB_SRC_EXT = '{js,mjs,cjs,jsx,mjsx,ts,mts,cts,tsx}';

export const GLOB_SRC = `**/*.${GLOB_SRC_EXT}`;

export const GLOB_JS = '**/*.{js,mjs,cjs}';

export const GLOB_TS = '**/*.{ts,mts,cts}';

export const GLOB_JSX = '**/*.{jsx,mjsx}';

export const GLOB_TSX = '**/*.tsx';

export const GLOB_JS_ALL = Object.freeze([GLOB_JS, GLOB_JSX]);

export const GLOB_TS_ALL = Object.freeze([GLOB_TS, GLOB_TSX]);

export const GLOB_STYLE = '**/*.{c,le,sc}ss';

export const GLOB_CSS = '**/*.css';

export const GLOB_POSTCSS = '**/*.{p,post}css';

export const GLOB_LESS = '**/*.less';

export const GLOB_SCSS = '**/*.scss';

export const GLOB_JSON = '**/*.json';

export const GLOB_JSON5 = '**/*.json5';

export const GLOB_JSONC = '**/*.jsonc';

export const GLOB_MARKDOWN = '**/*.md';

export const GLOB_MARKDOWN_IN_MARKDOWN = '**/*.md/*.md';

export const GLOB_SVELTE = '**/*.svelte?(.{js,ts})';

export const GLOB_VUE = '**/*.vue';

export const GLOB_YAML = '**/*.y?(a)ml';

export const GLOB_TOML = '**/*.toml';

export const GLOB_XML = '**/*.xml';

export const GLOB_SVG = '**/*.svg';

export const GLOB_HTML = '**/*.htm?(l)';

export const GLOB_ASTRO = '**/*.astro';

export const GLOB_ASTRO_TS = '**/*.astro/*.ts';

export const GLOB_GRAPHQL = '**/*.{g,graph}ql';

export const GLOB_MARKDOWN_CODE = `${GLOB_MARKDOWN}/${GLOB_SRC}`;

export const GLOB_TESTS = Object.freeze([
  `**/__tests__/**/*.${GLOB_SRC_EXT}`,
  `**/*.spec.${GLOB_SRC_EXT}`,
  `**/*.test.${GLOB_SRC_EXT}`,
  `**/*.bench.${GLOB_SRC_EXT}`,
  `**/*.benchmark.${GLOB_SRC_EXT}`,
]);

export const GLOB_CONFIG_FILES = Object.freeze(['**/*.config.{js,mjs,ts,mts,cjs,cts}']);

export const GLOB_SCRIPTS = Object.freeze(['**/scripts/**']);

export const GLOB_ALL_SRC = Object.freeze([
  GLOB_SRC,
  GLOB_STYLE,
  GLOB_POSTCSS,
  GLOB_JSON,
  GLOB_JSON5,
  GLOB_JSONC,
  GLOB_MARKDOWN,
  GLOB_SVELTE,
  GLOB_VUE,
  GLOB_YAML,
  GLOB_TOML,
  GLOB_XML,
  GLOB_SVG,
  GLOB_HTML,
  GLOB_ASTRO,
  GLOB_GRAPHQL,
]);

export const GLOB_EXCLUDE = Object.freeze([
  '**/node_modules',
  '**/dist',
  '**/package-lock.json',
  '**/npm-shrinkwrap.json',
  '**/yarn.lock',
  '**/pnpm-lock.yaml',
  '**/bun.lock',
  '**/bun.lockb',
  '**/output',
  '**/coverage',
  '**/.nyc_output',
  '**/playwright-report',
  '**/test-results',
  '**/storybook-static',
  '**/temp',
  '**/.temp',
  '**/tmp',
  '**/.tmp',
  '**/.history',
  '**/.vitepress/cache',
  '**/.astro',
  '**/.angular/cache',
  '**/.nuxt',
  '**/.next',
  '**/.react-router',
  '**/.svelte-kit',
  '**/.vercel',
  '**/.changeset',
  '**/.idea',
  '**/.cache',
  '**/.output',
  '**/.vite-inspect',
  '**/.yarn',
  '**/.pnpm-store',
  '**/.pnp.*',
  '**/CHANGELOG*.md',
  '**/LICENSE*',
  '**/*.min.*',
  '**/*.tsbuildinfo',
  '**/__snapshots__',
  '**/vite.config.*.timestamp-*',
  '**/auto-import?(s).d.ts',
  '**/components.d.ts',
  '**/next-env.d.ts',
  '**/build',
  '**/.turbo',
  '**/out',
  '**/*.scss.d.ts',
]);
