# Toolchain

Root configuration and the tooling packages.

## Layout

```text
.config/mise.toml        tool versions and environment
.github/                 @repo/github: workflows, setup action, scripts
apps/server              <scope>/server, the only deployable
apps/e2e                 <scope>/e2e, Playwright
packages/db              <scope>/db
packages/ui              <scope>/ui
packages/tsconfig        @repo/tsconfig
packages/vitest-config   @repo/vitest-config
scripts/                 repository scripts and their tests
```

`<scope>/*` is product code. `@repo/*` is tooling. Optional modules add
`packages/mcp`, `packages/device-grant`, `packages/cli`, and
`packages/oxlint-plugin`.

Internal packages export TypeScript source, so nothing builds between
packages: `"exports": { ".": "./src/index.ts" }`. A package that ships test
fixtures adds `"./testing": "./src/testing/index.ts"`.

## mise

`.config/mise.toml`:

```toml
[tools]
node = "24"
nub = "latest"
hk = "latest"
actionlint = "latest"
gh = "latest"
jq = "latest"

[settings]
idiomatic_version_file_enable_tools = ["node"]

[env]
_.path = ["{{config_root}}/node_modules/.bin"]
TURBO_TELEMETRY_DISABLED = "1"
DO_NOT_TRACK = "1"
PLAYWRIGHT_BROWSERS_PATH = "{{config_root}}/.cache/ms-playwright"
```

Add `.node-version` containing `24`.

## Nub

Nub is the package manager and the TypeScript runtime. It runs `.ts` files
directly, including the production entry, so the server has no compile step
beyond `vite build`.

`nub.jsonc`:

```jsonc
{
  "$schema": "https://nubjs.com/schema/latest.json",
  "envFile": false,
  "verifyDeps": "warn",
  "install": {
    "linker": "hoisted",
    "publicHoist": ["@types/*"],
  },
}
```

Commit `nub.lock`. Add no other lockfile. Run `nub --version` and write that
exact version into `packageManager` in the root `package.json` and into
`NUB_VERSION` in the `Dockerfile`; the two must match.

## Root package.json

```json
{
  "name": "<project>",
  "private": true,
  "workspaces": [".github", "apps/*", "packages/*"],
  "type": "module",
  "scripts": {
    "build": "turbo run build",
    "changeset": "nub --cwd apps/server exec changeset",
    "changeset:tag": "nub --cwd apps/server exec changeset tag",
    "changeset:version": "nub --cwd apps/server exec changeset version",
    "check:merge-markers": "nub exec tsx scripts/check-merge-markers.ts",
    "dev": "turbo run dev --parallel",
    "e2e": "turbo run e2e",
    "format": "nub exec oxfmt --check .",
    "format:fix": "nub exec oxfmt .",
    "lint": "turbo run lint lint:scripts",
    "lint:scripts": "nub exec oxlint scripts",
    "test": "turbo run test",
    "test:scripts": "nub exec vitest run --config vitest.config.ts",
    "typecheck": "turbo run typecheck && tsc -p tsconfig.json",
    "check": "nub run lint && nub run typecheck && nub run check:merge-markers && nub exec oxfmt --check .",
    "db:generate": "nub --cwd packages/db exec drizzle-kit generate",
    "db:migrate": "nub --cwd packages/db exec drizzle-kit migrate",
    "prepare": "hk install"
  },
  "engines": { "node": ">=24" },
  "packageManager": "nub@<version>"
}
```

Install root dev dependencies with `nub add -D`, which records the current
versions: `turbo`, `typescript`,
`oxlint`, `oxfmt`, `vitest`, `vite`, `tailwindcss`, `playwright`,
`@changesets/cli`, `@effect/language-service`, `@tanstack/router-plugin`,
`@vitejs/plugin-react`, `@types/node`, `@types/react`, `@types/react-dom`.

`test` stays a single `turbo run test`. Turbo forwards `--filter` and trailing
arguments to the package script, and a second runner chained onto the root
script would reject them. That is why the script suite is `test:scripts`.

Changesets runs from `apps/server` because it does not recognise Nub
workspaces. `apps/server/.changeset/config.json` sets `"baseBranch": "main"`,
`"access": "restricted"`, and
`"privatePackages": { "version": true, "tag": true }`, so a merged version PR
produces the tag `<scope>/server@<version>`.

## Turborepo

`turbo.json`:

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".output/**", "build/**"] },
    "transit": { "dependsOn": ["^transit"] },
    "test": { "dependsOn": ["transit"], "outputs": [] },
    "e2e": { "dependsOn": ["<scope>/server#build"], "outputs": ["playwright-report/**", "test-results/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": { "dependsOn": ["^lint"], "inputs": ["$TURBO_DEFAULT$", "$TURBO_ROOT$/oxlint.config.ts"], "outputs": [] },
    "//#lint:scripts": { "inputs": ["scripts/**", "oxlint.config.ts"], "outputs": [] },
    "typecheck": { "dependsOn": ["^typecheck"], "outputs": [] }
  },
  "globalDependencies": [".actionlint.yaml", "nub.lock"]
}
```

`transit` has no script anywhere. It exists so `test` is invalidated by a
dependency's source without waiting on a dependency's build.

Every package exposes the scripts its pipeline needs: `lint`, `typecheck`, and
`build`, `test`, or `dev` where they apply. Standard library-package scripts:

```json
{
  "build": "tsc -p tsconfig.json --noEmit false --outDir dist --declaration --emitDeclarationOnly",
  "lint": "nub exec oxlint src",
  "test": "vitest run --config vitest.config.ts",
  "typecheck": "tsc -p tsconfig.json"
}
```

## TypeScript

`packages/tsconfig/package.json` exports `./base.json`, `./node.json`, and
`./react.json`.

`base.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "allowJs": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "target": "ES2022",
    "plugins": [{ "name": "@effect/language-service" }]
  }
}
```

`node.json` extends it with `"lib": ["ES2022"], "types": ["node"]`.
`react.json` extends it with
`"lib": ["DOM", "DOM.Iterable", "ES2022"], "jsx": "react-jsx", "types": ["vite/client"]`.

A package `tsconfig.json` extends one of them, sets `"rootDir": "src"`, and
includes `src`. The root `tsconfig.json` extends `./packages/tsconfig/base.json`
with `"types": ["node"], "allowImportingTsExtensions": true` and includes
`scripts/**/*.ts` and `oxlint.config.ts`.

## Vitest configuration

`packages/vitest-config/base.ts`, exported as `./base`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    clearMocks: true,
    passWithNoTests: false,
  },
});
```

Each package merges it:

```ts
import baseConfig from '@repo/vitest-config/base';
import { mergeConfig, defineConfig } from 'vitest/config';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: { environment: 'node', include: ['src/**/*.test.ts'], name: '<package>' },
  }),
);
```

The root `vitest.config.ts` stands alone with `include: ['scripts/**/*.test.ts']`
and `name: 'scripts'`.

## Oxlint and Oxfmt

No ESLint and no Prettier. `oxlint.config.ts`:

```ts
import { defineConfig } from 'oxlint';

export default defineConfig({
  ignorePatterns: ['.agents/**'],
  plugins: ['react', 'typescript', 'import'],
  env: { browser: true, node: true },
  categories: { correctness: 'error', suspicious: 'warn' },
  rules: {
    'no-unused-vars': 'off',
    'no-undef': 'off',
    'no-shadow': 'off',
    'no-underscore-dangle': 'off',
    'typescript/no-unused-vars': 'off',
    'typescript/no-explicit-any': 'off',
    'typescript/no-unsafe-type-assertion': 'off',
    'typescript/consistent-return': 'off',
    'typescript/no-unnecessary-type-parameters': 'off',
    'react/react-in-jsx-scope': 'off',
    'import/no-unassigned-import': 'off',
  },
});
```

`oxfmt.config.ts`:

```ts
import { defineConfig } from 'oxfmt';

export default defineConfig({
  ignorePatterns: ['.agents/**', 'apps/server/src/routeTree.gen.ts'],
  printWidth: 100,
  tabWidth: 2,
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  arrowParens: 'always',
  endOfLine: 'lf',
  sortTailwindcss: true,
  sortImports: { ignoreCase: true, newlinesBetween: true, order: 'asc' },
  sortPackageJson: false,
  overrides: [{ files: ['*.md', '**/*.md'], options: { proseWrap: 'never' } }],
});
```

Generated files are ignored by the formatter because their generator rewrites
them on every build. Add `packages/cli/oclif.manifest.json` with the CLI
module.

## hk

`hk.pkl`. Replace the version with the one `hk --version` prints.

```pkl
amends "package://github.com/jdx/hk/releases/download/v<hk>/hk@<hk>#/Config.pkl"

local linters = new Mapping<String, Step> {
    ["format"] {
        glob = List("**/*.json", "**/*.jsonc", "**/*.md", "**/*.pkl", "**/*.ts", "**/*.tsx", "**/*.css")
        check = "nub exec oxfmt --check ."
        fix = "nub exec oxfmt ."
    }
    ["lint"] {
        glob = List("**/*.ts", "**/*.tsx")
        check = "nub run lint"
        fix = "nub run lint"
    }
    ["merge-markers"] {
        glob = List("**/*")
        check = "nub run check:merge-markers"
    }
}

hooks {
    ["pre-commit"] {
        fix = false
        steps = linters
    }
    ["fix"] {
        fix = true
        steps = linters
    }
    ["check"] {
        steps = linters
    }
}
```

The pre-commit hook is check-only and sets no `stash`. A fixing hook stashes
the working tree while it runs, which hides and can lose the uncommitted work
of a second agent in the same worktree. A refused commit is repaired with
`nub run format:fix`, reviewed, and retried.

The merge-marker check reads every tracked file and skips binary content. Copy
`scripts/conflict-markers.ts`, `scripts/check-merge-markers.ts`, and
`scripts/conflict-markers.test.ts` from `templates/scripts/`. An extension
allowlist once let a marker through in an `.html` file.

## The `.github` workspace package

`.github/package.json` makes workflow linting a Turbo task:

```json
{
  "name": "@repo/github",
  "private": true,
  "version": "0.0.0",
  "scripts": { "lint": "actionlint -config-file ../.actionlint.yaml workflows/*.yml" }
}
```

`.actionlint.yaml` lists self-hosted runner labels under
`self-hosted-runner.labels`. Leave it as an empty list for hosted runners.

## Ignore files

`.gitignore`: `node_modules/`, `.nub/`, `.turbo/`, `.cache/`,
`playwright-report/`, `test-results/`, `.output/`, `dist/`, `.env`, `.env.*`,
`!.env.example`, `.DS_Store`, `*.local`, `*.db`, `*.db-shm`, `*.db-wal`,
`data/media/`, `.claude/worktrees/`.

`.dockerignore`: `.git`, `.nub`, `.turbo`, `.cache`, `node_modules`,
`**/dist`, `**/.output`, `.env`, `.env.*`, `*.db`, `*.db-shm`, `*.db-wal`,
`playwright-report`, `test-results`, `**/*.test.ts`, `**/*.test.tsx`.

## Dependabot

`.github/dependabot.yml` updates `github-actions` and `npm` weekly, with a
`cooldown` (`default-days: 5`) and groups for `drizzle`, `react`, `tailwind`,
`tanstack`, and `vite` so coupled packages move in one pull request.
