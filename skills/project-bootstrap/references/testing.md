# Testing

Three suites with three owners.

| Suite          | Runner     | Command                | Location                         |
| -------------- | ---------- | ---------------------- | -------------------------------- |
| Package tests  | Vitest     | `nub run test`         | `src/**/*.test.ts(x)`, colocated |
| Script tests   | Vitest     | `nub run test:scripts` | `scripts/**/*.test.ts`           |
| Browser tests  | Playwright | `nub run e2e`          | `apps/e2e/tests/*.spec.ts`       |

Scope a package run with
`nub run test --filter=<scope>/server --only -- <pattern>`.

## Package tests

- Tests sit beside the file they cover.
- Use cases are tested through their port with an in-memory adapter or a
  migrated database, never by mocking Drizzle.
- Effect code uses `@effect/vitest`. Components use Testing Library with a
  per-file `// @vitest-environment jsdom` directive; the server default
  environment is `node`.
- The server config includes `src/**/*.test.ts` and `src/**/*.test.tsx`.

### Database template

Server tests open a real migrated SQLite database. `vitest.global-setup.ts`
writes the migrated image to a temporary file once and provides its path:

```ts
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { migratedDatabaseImage } from '<scope>/db/testing';
import type { TestProject } from 'vitest/node';

export default function setup(project: TestProject) {
  const directory = mkdtempSync(join(tmpdir(), '<cookie>-migrated-template-'));
  const template = join(directory, 'migrated.sqlite');
  writeFileSync(template, migratedDatabaseImage());
  project.provide('migratedDatabaseTemplate', template);
  return () => rmSync(directory, { force: true, recursive: true });
}
```

Reference it with `globalSetup: ['./vitest.global-setup.ts']`.
`src/testing/migrated-database.ts` (`templates/apps/server/src/testing/`)
injects the path, reads the file, and opens an independent copy per test with
`createDatabase(buffer)`. Workers are
separate processes, so the template is a file rather than a shared `Buffer`.

## Script tests

Repository scripts carry deployment and CI contracts, so they have tests. The
suite runs outside Turbo as its own CI step. Keep each script's logic in an
importable module (`scripts/thing.ts`) and its command-line shell thin
(`scripts/run-thing.ts`).

## Browser tests

`apps/e2e` depends on `@playwright/test`, `drizzle-orm`, and `<scope>/db`.
Scripts: `e2e` is `playwright test`, plus `lint` and `typecheck`. Turbo runs
`e2e` only after `<scope>/server#build`.

`playwright.config.ts`:

```ts
import path from 'node:path';

import { defineConfig } from '@playwright/test';

process.env.PLAYWRIGHT_BROWSERS_PATH ??= path.resolve(
  import.meta.dirname,
  '../../.cache/ms-playwright',
);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { trace: 'on-first-retry' },
});
```

No `webServer` block. Each worker owns its server through the worker-scoped
fixture in `templates/apps/e2e/tests/fixtures/server.ts`:

1. Create a temporary directory and database path.
2. Seed it by opening it with `createDatabase` and running scenarios from
   `<scope>/db/testing`.
3. Spawn `nub --cwd apps/server server-entry.ts` with `DATABASE_URL`,
   `PORT=0`, `HOST=127.0.0.1`, `RATE_LIMIT_ENABLED=false`, and
   `TRUSTED_PROXY_CIDRS=127.0.0.1/32,::1/128`. Loopback is the trusted proxy
   here because specs supply a client address per browser context.
4. Parse the `listening at http://…` line from stdout for the base URL.
5. On teardown, send `SIGTERM`, await exit, and remove the directory.

Module fixtures (`fixtures/auth.ts`, `fixtures/mcp.ts`) extend the server
fixture and seed their scenarios before the spawn. `fixtures/index.ts` merges
them, and specs import `test` and `expect` from there, never from
`@playwright/test`.

Conventions:

- One spec per user journey, named for the journey.
- Select by role and `data-testid`.
- TanStack Start hydrates after `load`, and a value typed before hydration is
  wiped. Fill inputs with `fillSticky`, which retries until the control reports
  the value back.
- The rate limiter is off for the suite because many browser contexts sign in
  against one server. Prove the throttle in a Vitest test against the Better
  Auth router instead.
- Keep the fixtures split by module. One shared fixture file grows past
  three thousand lines.

## Several agents on one machine

Full-suite and e2e results from a machine running several agents are
unreliable: wall-clock timeouts fire under load. Run focused suites locally and
let CI arbitrate the full run.
