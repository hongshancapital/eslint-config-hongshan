# @hongshancapital/eslint-config-hongshan

前后端通用的代码质量配置：尽量由 Oxlint 执行语义检查，ESLint 只保留缺少可靠替代的规则；格式化与 lint 解耦，可选择 Oxfmt、Prettier，或不使用格式化器。

要求 Node.js 22.18–22.x，或 Node.js 24 及更高版本。

## 功能入口

| 入口                                                    | 用途                                                |
| ------------------------------------------------------- | --------------------------------------------------- |
| `@hongshancapital/eslint-config-hongshan`               | 异步生成 ESLint Flat Config，并可与 Oxlint 自动配对 |
| `@hongshancapital/eslint-config-hongshan/oxlint`        | 生成带前端或后端 preset 的 Oxlint 配置              |
| `@hongshancapital/eslint-config-hongshan/oxfmt`         | 生成 Oxfmt 配置，并默认开启常用排序能力             |
| `@hongshancapital/eslint-config-hongshan/globs`         | 复用本包的源码、测试、配置文件和排除 glob           |
| `@hongshancapital/eslint-config-hongshan/prettier.json` | 使用不带插件的基础 Prettier 配置                    |

ESLint、Oxlint 和格式化器是彼此独立的入口。ESLint 配对会读取 Oxlint 配置以关闭重复规则，但不会代替项目执行 Oxlint。

## 安装

本包直接安装 ESLint 及其规则运行所需依赖。TypeScript 是必需的 peer dependency，支持范围为 `>=5.4.5`。Oxlint 和格式化器是 optional peer，`oxlint-tsgolint` 是 Oxlint type-aware 的可选运行时；pnpm 不会自动安装这些可选项，消费项目必须按需把它们声明为运行脚本所在 package 的直接 `devDependency`。

如果项目没有统一配置 GitHub Packages registry，需要先完成 GitHub Packages 认证，并在 `.npmrc` 中声明：

```ini
@hongshancapital:registry=https://npm.pkg.github.com
```

本包当前直接依赖 ESLint，但不会把 ESLint bin 暴露到消费项目。pnpm isolated
`node_modules` 下，消费项目需要公开提升名称中包含 `eslint` 的相关依赖，让项目
脚本能从根 `node_modules/.bin` 调用 ESLint CLI。config 和 plugin 仍从本包自身的
依赖上下文解析，不依赖公开提升。配置位置取决于 pnpm 主版本。

### pnpm 11

pnpm 11 从 `.npmrc` 中仅读取 registry/auth 类设置；`publicHoistPattern` 等其他项目设置必须写入根目录的 `pnpm-workspace.yaml`：

```yaml
# pnpm-workspace.yaml
publicHoistPattern:
  - '*eslint*'
```

### pnpm 10

pnpm 10 可以在项目根目录的 `.npmrc` 中使用数组语法：

```ini
# .npmrc
public-hoist-pattern[]=*eslint*
```

pnpm 10 也支持 `pnpm-workspace.yaml`。已有等效 YAML 设置时应合并原位置，不要再创建重复的 `.npmrc` 设置；上面是没有既有设置时的 v10 兼容写法。

pnpm 对完整包名执行 pattern 匹配，因此这里使用前后各一个通配符的 `*eslint*`。只有前导通配符的 `*eslint` 仅匹配以 `eslint` 结尾的名称，会漏掉 `eslint-plugin-*`、`eslint-config-*` 等包；精确的 `eslint` 则只提升核心 CLI。

参考 [pnpm 11 `publicHoistPattern`](https://pnpm.io/11.x/settings#publichoistpattern) 和 [pnpm 10 `publicHoistPattern`](https://pnpm.io/10.x/settings#publichoistpattern)。

本仓库自身没有声明 `publicHoistPattern`，因为它是配置包的开发仓库，不是通过传递依赖使用已发布配置的消费项目；它直接声明并解析开发、构建和测试所需的 ESLint 依赖。上面的公开提升属于消费项目的安装布局契约。

不要再添加 `*oxlint*` 的公开提升。Oxlint 是可选工具，由消费项目直接声明为
`devDependency`，pnpm 会直接暴露它的 CLI；`oxlint-tsgolint` 也只在启用 type-aware
时直接安装。若把 Oxlint 改为本包的传递依赖，不仅 ESLint-only 项目也会下载原生
二进制，还需要依赖 hoist 才能从消费项目脚本稳定调用 CLI。

完成 registry、认证和 pnpm 安装布局配置后，再安装依赖：

```bash
pnpm add -D @hongshancapital/eslint-config-hongshan typescript

# 启用 Oxlint
pnpm add -D oxlint@^1.76.0

# 启用 Oxlint type-aware；仅用于已经兼容 TypeScript 7 的项目
pnpm add -D oxlint-tsgolint@7

# formatter 二选一
pnpm add -D oxfmt@^0.61.0
# 或
pnpm add -D prettier@^3.9.6
```

在目标 package 目录运行这些命令。Monorepo 若要安装到 workspace root，显式使用 `pnpm add -Dw ...`；若要安装到某个 package，使用 `pnpm --filter <package-name> add -D ...`，不要依赖命令执行位置猜测目标。

## 给 AI Agent 的配置契约

AI 或自动化工具配置消费项目时，应按以下顺序执行；人工配置也可以使用同一流程：

1. 先读取现有 `package.json`、lockfile、`pnpm-workspace.yaml`、`.npmrc` 和 lint/format 配置。合并现有内容，不覆盖无关字段，也不创建第二种 lockfile。
2. 非 pnpm 项目继续使用现有包管理器，并把兼容版本的 ESLint 作为直接开发依赖；不要复制 pnpm hoist 设置。pnpm 项目以 `package.json#packageManager` 为版本契约；缺少该字段时，才使用 `pnpm-lock.yaml` 和 `pnpm --version` 判断。声明、lockfile 与实际版本冲突，或版本不在 10/11 时停止修改并报告，不要自行切换包管理器。
3. 确认 GitHub Packages registry 和认证已可用。不得回显、复制或提交 token；缺少认证时只报告所需操作，不生成或猜测凭证。
4. pnpm 消费项目在安装前确保已有 `*eslint*` 的公开提升设置，用于暴露本包传递安装的 ESLint CLI；pnpm 11 修改 `pnpm-workspace.yaml`，pnpm 10 优先合并既有配置位置，没有时使用 `.npmrc`。直接安装的 Oxlint 与 `oxlint-tsgolint` 不需要公开提升。
5. 安装基础包和 TypeScript；只安装选定的 Oxlint 与 formatter。不要同时配置 Oxfmt 和 Prettier。
6. 根据项目运行环境选择配置，不在不同入口之间猜测或透传选项：

   | 项目类型           | Oxlint                                                             | ESLint                           |
   | ------------------ | ------------------------------------------------------------------ | -------------------------------- |
   | React 前端         | `preset: 'frontend'`                                               | `react: true`（Hooks 默认 core） |
   | Node.js 后端或脚本 | `preset: 'backend'`                                                | 保持 `react: false`              |
   | 仅 ESLint          | 当前目录没有候选配置时不安装 Oxlint                                | 使用根入口                       |
   | Oxlint type-aware  | TS7 迁移后安装 `oxlint-tsgolint@7`、设置 `options.typeAware: true` | 始终使用非 type-aware 配置       |

7. 仅 ESLint 模式下，如果当前目录已有 `oxlint.config.ts` 或 `.mts`，不要删除或改名；当前 API 没有 `oxlintConfigFile: false`，应停止并请求用户决定。非 React 浏览器项目也没有一行式 preset，应根据实际 plugin 需求显式配置，不套用 React 前端示例。
8. ESLint 配置统一使用推荐的 `eslint.config.mjs`，不依赖消费项目的 `"type": "module"`；从项目根目录运行时，可通过 `oxlintConfigFile: './oxlint.config.ts'` 显式配对。字符串路径相对当前工作目录解析；monorepo 或可能从其他目录运行时，改用 `new URL('./oxlint.config.ts', import.meta.url)`。省略该选项时，只会在当前工作目录自动查找 `oxlint.config.ts` 或 `oxlint.config.mts`。
9. ESLint `defineConfig()` 的第一个参数只放本包选项，原生 Flat Config 从第二个参数开始传入。直接 `export default defineConfig(...)`；它会返回 ESLint 可等待的 Promise。
10. Type-aware lint 只由 Oxlint 提供。Oxlint、ESLint 和 formatter 的 ignore、React 等选项彼此独立，需要相同行为时分别声明。
11. Oxlint 和 Oxfmt CLI 会自动读取标准命名的 `oxlint.config.ts` 与 `oxfmt.config.ts`；只有使用非标准文件名时才传 `--config`。
12. 配对只负责关闭重复的 ESLint rules，不会执行 Oxlint。合并对应 scripts 后，按“配置完成检查”先检查加载与配对结果，再执行所选工具。

## 快速开始

下面是推荐的 React 前端项目配置。没有等效配置时，可直接创建这些文件；已有配置时应按字段合并。各入口的配置选项互不透传；ESLint 配对只读取 Oxlint 的 rule 状态，因此 React 和 ignore 模式仍需分别声明。

```ts
// oxlint.config.ts
import { defineConfig } from '@hongshancapital/eslint-config-hongshan/oxlint';

export default defineConfig({
  preset: 'frontend',
  ignorePatterns: ['generated/**'],
});
```

```js
// eslint.config.mjs
import { defineConfig } from '@hongshancapital/eslint-config-hongshan';

export default defineConfig(
  {
    oxlintConfigFile: './oxlint.config.ts',
    react: true,
    typescript: 'strict',
    ignores: ['generated/**'],
  },
  {
    languageOptions: {
      globals: {
        __DEV__: 'readonly',
      },
    },
  },
);
```

以下 Oxfmt 配置仅在项目选择 Oxfmt 时创建：

```ts
// oxfmt.config.ts
import { defineConfig } from '@hongshancapital/eslint-config-hongshan/oxfmt';

export default defineConfig({
  ignorePatterns: ['generated/**'],
});
```

选择 Oxfmt 时使用下面的 scripts；不使用 formatter 时只保留 `lint`，选择 Prettier 时改用“格式化”一节的 scripts：

```json
{
  "scripts": {
    "lint": "oxlint . && eslint .",
    "format": "oxfmt .",
    "format:check": "oxfmt --check ."
  }
}
```

快速开始假定从项目根目录运行命令，因此使用字符串路径显式定位 `oxlint.config.ts`。
ESLint 会读取 Oxlint 实际开启的规则，并关闭对应的重复规则。字符串路径相对
`process.cwd()` 解析；需要从其他工作目录运行时，应改用相对 `eslint.config.mjs` 的
`new URL('./oxlint.config.ts', import.meta.url)`。省略 `oxlintConfigFile` 时，才会自动
查找当前工作目录中的候选文件。

`react: true` 默认使用 `reactHooks: 'core'`，只启用 `rules-of-hooks` 和
`exhaustive-deps`。需要 React Compiler 诊断时可显式选择 `recommended`；需要试用
实验性 Compiler 规则时选择 `recommended-latest`。后两档都会增加全量冷扫描成本。

后端项目应将 Oxlint preset 改为 `backend`，同时删除 ESLint 示例中的 `react: true`，使用其默认值 `false`。Oxlint 的 `preset: 'frontend'` 不会自动开启 ESLint 的 React 配置。

### 配置完成检查

先验证配置可加载。推荐示例中，ESLint 输出的 `eqeqeq` 应为关闭状态，因为该规则已经由 Oxlint 负责：

```bash
# ESLint：始终执行
pnpm exec eslint --print-config eslint.config.mjs

# Oxlint：仅在安装并配置后执行
pnpm exec oxlint --print-config
```

配置可加载后，再运行项目已经选择并安装的工具：

```bash
# ESLint：始终执行
pnpm exec eslint --version
pnpm exec eslint .

# Oxlint：仅在安装并配置后执行
pnpm exec oxlint --version
pnpm exec oxlint .

# Oxfmt：仅在选择 Oxfmt 后执行
pnpm exec oxfmt --version
pnpm exec oxfmt --check .

# Prettier：仅在选择 Prettier 后执行
pnpm exec prettier --version
pnpm exec prettier --check .
```

AI Agent 应区分“配置无法加载”和“配置已生效但发现代码问题”：前者必须修复；后者应保留诊断并向用户报告，除非任务同时要求修改业务代码。

### 仅使用 ESLint

如果运行 ESLint 的 `process.cwd()` 中不存在 `oxlint.config.ts` 或 `oxlint.config.mts`，根入口不会解析 Oxlint，也不要求安装 Oxlint：

```js
// eslint.config.mjs
import { defineConfig } from '@hongshancapital/eslint-config-hongshan';

export default defineConfig(
  { typescript: true },
  {
    rules: {
      'no-warning-comments': 'warn',
    },
  },
);
```

只使用 ESLint 时，lint 脚本为：

```json
{
  "scripts": {
    "lint": "eslint ."
  }
}
```

## Oxlint 与 ESLint 配对

配对以消费者实际安装的同一个 Oxlint binary 为准，并行读取：

```text
oxlint --config <file> --print-config
oxlint --rules --format=json
```

`--print-config` 提供默认值、`extends`、category、plugin 和显式 rule 合并后的 normalized 根配置及 override 条目；`--rules` 提供同版本的 rule scope 和 type-aware 元数据。规则清单按 binary path 缓存，映射在内存中生成，不需要维护或发布静态规则表。

只有 runtime 中实际开启且存在 ESLint 等价实现的规则会生成新的 ESLint `off`。根级最终状态为 `off` 的规则、未加载 plugin 的规则，以及未启用 Oxlint type-aware runtime 的 type-aware 规则不会生成 `off`；override 如何收回根级 rule owner 见下文。

默认启用 TypeScript ESLint 时，一个 Oxlint rule 可能关闭多个 ESLint aliases，例如：

- `no-unused-vars` → `no-unused-vars`、`@typescript-eslint/no-unused-vars`（`typescript !== false`）
- `import/no-duplicates` → `import/no-duplicates`、`import-x/no-duplicates`
- `react/rules-of-hooks` → `react-hooks/rules-of-hooks`
- `react/only-export-components` → `react/only-export-components`、`react-refresh/only-export-components`

### 何时执行配对

| `oxlintConfigFile` | `process.cwd()` 中的候选文件          | 行为                                            |
| ------------------ | ------------------------------------- | ----------------------------------------------- |
| 未提供             | 没有 `.ts` 或 `.mts` 配置             | 纯 ESLint，不解析 Oxlint                        |
| 未提供             | 恰好一个 `oxlint.config.ts` 或 `.mts` | 自动配对该文件                                  |
| 未提供             | 两个文件同时存在                      | 报错，要求显式选择                              |
| `string`           | 任意                                  | 相对 `process.cwd()` 解析并配对指定文件         |
| `URL`              | 任意                                  | 配对指定文件，适合相对 `eslint.config.mjs` 定位 |

当前只支持 `.ts` 和 `.mts` Oxlint 配置，也没有 `oxlintConfigFile: false` 这个关闭自动发现的选项。找到配置后，如果文件不存在、Oxlint 未安装、配置执行失败或 CLI 输出无效，会直接报错，不会静默退回另一套推导逻辑。

自动发现只检查当前工作目录，不会递归扫描或合并 monorepo 中其他 package 的配置。每次 `defineConfig()` 最多配对一个 Oxlint 配置。

### Monorepo 或非标准文件名

每个 package 应从自己的 ESLint 配置显式定位对应的 Oxlint 配置：

```js
// packages/web/eslint.config.mjs
import { defineConfig } from '@hongshancapital/eslint-config-hongshan';

export default defineConfig({
  oxlintConfigFile: new URL('./oxlint.config.ts', import.meta.url),
  react: true,
});
```

`URL` 相对当前 `eslint.config.mjs`，不会受到运行命令所在目录影响；字符串路径始终相对 `process.cwd()`。

### Rule Owner 与配置优先级

ESLint 配置顺序固定为：

```text
内置 ESLint fallback → Oxlint 派生的 off → 用户 Flat Config
```

因此用户 Flat Config 拥有最终优先级。要避免重复诊断，首先应在对应范围内关闭 Oxlint rule；如果内置 ESLint fallback 没有启用该规则，或需要覆盖根级派生的 `off`，再通过用户 Flat Config 显式启用 ESLint 等价规则。

例如，仅让 ESLint 在 `legacy/**` 中负责 `eqeqeq`：

```ts
// oxlint.config.ts
import { defineConfig } from '@hongshancapital/eslint-config-hongshan/oxlint';

export default defineConfig({
  preset: 'backend',
  overrides: [
    {
      files: ['legacy/**'],
      rules: {
        eqeqeq: 'off',
      },
    },
  ],
});
```

```js
// eslint.config.mjs
import { defineConfig } from '@hongshancapital/eslint-config-hongshan';

export default defineConfig(
  {},
  {
    files: ['legacy/**'],
    rules: {
      eqeqeq: 'error',
    },
  },
);
```

只重新开启 ESLint 会导致两个 linter 同时报错；只在 Oxlint override 中关闭规则，也不会自动恢复被根级配对关闭的 ESLint rule。

### Type-aware 规则

本包只通过 Oxlint 提供 type-aware lint，ESLint 始终使用不需要类型信息的配置：

```bash
pnpm add -D oxlint@^1.76.0 oxlint-tsgolint@7
```

tsgolint 7 使用 TypeScript 7 引擎。根 `tsconfig.json` 推荐使用
`target: 'es2015'` 或更高版本，并选择 `bundler`、`node16` 或 `nodenext`
模块解析策略。需要保留 ES5 构建时，使用独立的构建 tsconfig，并让构建工具读取该
配置。`--tsconfig` 只影响 Oxlint 的 import resolution，type-aware lint 仍会自动
发现项目的 `tsconfig.json`。

```ts
// oxlint.config.ts
import { defineConfig } from '@hongshancapital/eslint-config-hongshan/oxlint';

export default defineConfig({
  preset: 'backend',
  options: {
    typeAware: true,
  },
});
```

```js
// eslint.config.mjs
import { defineConfig } from '@hongshancapital/eslint-config-hongshan';

export default defineConfig({
  oxlintConfigFile: './oxlint.config.ts',
  typescript: 'strict',
});
```

- Oxlint `options.typeAware` 控制 Oxlint type-aware runtime，并决定配对是否关闭对应 ESLint rules。
- ESLint 不会读取 tsconfig 或建立 TypeScript Program；没有 Oxlint 等价实现的非 type-aware 规则仍由 ESLint 执行。
- `options.typeCheck` 会额外输出 TypeScript 编译诊断；只需要 type-aware lint rules 时不要开启。
- Oxlint 和 `oxlint-tsgolint` 由运行 lint 脚本的消费项目直接安装和维护，不需要公开提升。

### 配对边界

- Oxlint 的 `ignorePatterns` 不会复制到 ESLint；需要相同忽略范围时，应同时设置 ESLint `ignores`。
- Oxlint override 的 `excludeFiles` 会转换为对应 ESLint 配置的 `ignores`。
- 当前不支持会改变 plugin 集合的 Oxlint overrides，也不支持外部 Oxlint JavaScript plugins；遇到 `override.plugins`、override `jsPlugins` 或非空根 `jsPlugins` 时会报错。
- `oxc` 专属规则和未知 rule scope 没有可靠的 ESLint 对应关系，会被跳过。
- 对 `.vue`、`.svelte` 和 `.astro`，少量规则不会派生 ESLint `off`；本包不会因此自动配置这些文件所需的 ESLint parser 或 processor。

## Oxlint 配置参考

`/oxlint` 导出的 `defineConfig` 要求显式提供 `preset`：

- `frontend`：Browser + ES2024，默认启用 React。
- `backend`：Node.js + ES2024，默认不启用 React。

默认整体开启的 category 只有 `correctness: 'error'`；此外还启用本包维护的显式规则，包括经过验证的 Nursery `import/export`。`categories`、`env` 和 `rules` 按 key 合并，用户值优先；`ignorePatterns` 和 `overrides` 追加在默认值之后。

未设置 `plugins` 时使用 `OXLINT_DEFAULT_PLUGINS[preset]`。显式 `plugins` 与 Oxlint 原生行为一致，会完整替换默认列表，`[]` 也有效。要追加 plugin，应先展开对应 preset 的默认值：

```ts
import {
  defineConfig,
  OXLINT_DEFAULT_PLUGINS,
} from '@hongshancapital/eslint-config-hongshan/oxlint';

export default defineConfig({
  preset: 'frontend',
  plugins: [...OXLINT_DEFAULT_PLUGINS.frontend, 'jest'],
});
```

`react` 覆盖 preset 的默认值，控制 React 配套规则与 `react` 插件的增删：`react: false` 会从默认插件列表中移除 `react`（若存在）。但存在显式 `plugins` 时不会改写用户提供的数组；此时若想启用 React，应确保 `plugins` 中包含 `react`。

`options.typeAware` 和 `options.typeCheck` 原样透传，本包不声明或安装 `oxlint-tsgolint`。

## ESLint 配置参考

根入口导出异步的 `defineConfig(options = {}, ...flatConfigs)`。第一个参数只接受本包选项，`rules`、`files`、`languageOptions` 等原生 Flat Config 字段必须从第二个参数开始传入：

```js
import { defineConfig } from '@hongshancapital/eslint-config-hongshan';

export default defineConfig(
  {},
  {
    files: ['**/*.js'],
    rules: {
      eqeqeq: 'error',
    },
  },
);
```

Flat Config 参数可以是对象或嵌套数组。它们位于内置配置和 Oxlint 派生配置之后，遵循 ESLint 原生级联合并语义。默认 language options 使用最新 ECMAScript、ES modules，以及 Browser 和 Node.js globals。

| 选项               | 类型                                              | 默认     | 说明                                                                    |
| ------------------ | ------------------------------------------------- | -------- | ----------------------------------------------------------------------- |
| `ignores`          | `readonly string[]`                               | `[]`     | 追加到默认生成目录之后的全局 ignore                                     |
| `oxlintConfigFile` | `string \| URL`                                   | 自动查找 | 显式选择用于规则配对的 `.ts` 或 `.mts` Oxlint 配置                      |
| `react`            | `boolean`                                         | `false`  | 启用 React、JSX parser 选项和 TSX naming fallback                       |
| `reactHooks`       | `'core' \| 'recommended' \| 'recommended-latest'` | `'core'` | React Hooks 规则档位；仅在 `react: true` 时生效                         |
| `typescript`       | `boolean \| 'strict'`                             | `true`   | `true` 使用 recommended；`'strict'` 使用 strict；`false` 禁用 TS parser |

`typescript: true` 会启用 typescript-eslint parser、plugin 和非 type-aware 的
recommended preset，但不会读取 tsconfig 或建立 TypeScript Program。`'strict'` 同样
只启用非 type-aware 的 strict preset。需要类型信息的 lint rules 应由 Oxlint
type-aware 执行；`typescript: false` 会禁用整个 TypeScript ESLint 配置。

## 共享 Globs

`/globs` 导出单个 glob 和不可变的组合数组，可用于消费者自己的 Flat Config：

```js
import { defineConfig } from '@hongshancapital/eslint-config-hongshan';
import { GLOB_TESTS } from '@hongshancapital/eslint-config-hongshan/globs';

export default defineConfig(
  {},
  {
    files: [...GLOB_TESTS],
    rules: {
      'no-console': 'off',
    },
  },
);
```

常用组合包括：

- `GLOB_JS_ALL`、`GLOB_TS_ALL`
- `GLOB_TESTS`、`GLOB_CONFIG_FILES`、`GLOB_SCRIPTS`
- `GLOB_ALL_SRC`
- `GLOB_EXCLUDE`

同时还导出 JavaScript、TypeScript、JSX、TSX、Vue、Svelte、Astro、JSON、Markdown、样式文件等单独 glob。

`GLOB_ALL_SRC` 是供多种工具复用的物理源码集合；将其中的非 JavaScript/TypeScript 格式用于 ESLint 时，消费项目需要自行配置对应 parser 或 processor。

## 格式化

格式化器独立于 ESLint 和 Oxlint。Oxfmt 与 Prettier 共享 100 列、单引号、分号、两空格和 trailing comma 基线，但排序能力不同。

### Oxfmt

`/oxfmt` 默认开启 import、`package.json` 和 Tailwind CSS class 排序：

```ts
// oxfmt.config.ts
import { defineConfig } from '@hongshancapital/eslint-config-hongshan/oxfmt';

export default defineConfig({
  ignorePatterns: ['generated/**'],
  sortImports: false,
  // sortPackageJson: false,
  // sortTailwindcss: false,
});
```

标量值覆盖默认值，`ignorePatterns` 追加到默认排除列表，`overrides` 保持 Oxfmt 原生数组语义。Oxfmt 不保证在最后一个 import 与后续语句之间插入空行。

### Prettier

在 `package.json` 中引用包内的基础配置：

```json
{
  "prettier": "@hongshancapital/eslint-config-hongshan/prettier.json",
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

这份配置不安装插件，也不负责 import、export、`package.json` 或 Tailwind CSS class 排序。需要排序能力时请选择 Oxfmt，或由项目自行配置 Prettier plugins。

ESLint 不包含格式化或排序规则。

## 本地开发

```bash
pnpm install
pnpm check
```

`check` 会构建最新配置，再依次检查格式、类型、lint 和测试。规则名映射在配对时从消费者安装的 Oxlint 动态构建，因此升级 Oxlint 后不需要生成或提交静态规则表。

### 本地发布

确保工作区干净、已登录 GitHub Packages，并更新包版本后执行：

```bash
pnpm release
```

`release` 会先执行 `pnpm publish --dry-run`，确认发布生命周期和最终文件清单，再执行
正式发布。两次发布流程都会通过 `prepublishOnly` 运行完整的 `pnpm check` 门禁；任一
检查失败时不会发布。只检查发布包时直接执行 `pnpm publish --dry-run`。
