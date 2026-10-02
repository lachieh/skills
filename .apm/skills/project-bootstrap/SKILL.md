---
name: project-bootstrap
description: Bootstrap a new TypeScript monorepo on Lachie's reference architecture - Nub, Turborepo, TanStack Start, Effect, Drizzle, Better Auth, MCP, Vitest, Playwright, and container delivery.
disable-model-invocation: true
---

# Project Bootstrap

Bootstrap a new repository on the reference architecture. The result is a
working monorepo: one deployable server application, shared packages, checks,
tests, CI, and a container image. Deployment stays a placeholder until the
project names a target.

The `references/` files carry the structure and the reasons no config file
states. The `templates/` tree carries the files worth copying verbatim, laid
out at their target paths. A template is copied, its placeholders substituted,
and its `[module: …]` blocks trimmed; everything else is written from the
reference that describes it.

## Placeholders

Every template and reference uses these. Resolve them once in step 1 and
substitute everywhere.

| Placeholder | Meaning                                                  | Example          |
| ----------- | -------------------------------------------------------- | ---------------- |
| `<project>` | Repository name                                          | `dundermifflin`  |
| `<scope>`   | npm scope for product packages: `@` + name, dots removed | `@dundermifflin` |
| `<Project>` | Display name                                             | `Dunder Mifflin` |
| `<cookie>`  | Cookie, token, and binary prefix: the scope without `@`  | `dundermifflin`  |
| `<runner>`  | GitHub Actions runner label                              | `ubuntu-latest`  |

`@repo/*` is literal. It names internal tooling packages in every project and
is never replaced by `<scope>`.

## Procedure

Each step is one `principle-verifiable-units-of-work` unit. Reach its
completion line before starting the next step.

### 1. Settle the inputs

Derive `<project>`, `<scope>`, `<Project>`, and `<cookie>` from the repository
or directory name. Decide which modules the project needs:

- **Core**, always: toolchain, `packages/db`, `packages/ui`, `apps/server`,
  `apps/e2e`, CI, container image.
- **Auth**: Better Auth with cookie sessions.
- **OAuth authorization server**: device grant and JWTs. Required by the two
  modules below.
- **MCP door**: `/mcp` server behind OAuth.
- **Operator API and CLI**: `/api/resources` plus an oclif client.
- **WebMCP**: page-scoped browser tools.
- **Agent-readable surfaces**: sitemap, `llms.txt`, markdown negotiation.
- **Boundary audit**: custom Oxlint rules that confine Drizzle, network,
  environment, and Effect execution to approved adapters.

Infer modules from the request. Ask the user only for a module the request
leaves open, in one question. Default `<runner>` to `ubuntu-latest` and the
deployment target to the placeholder.

Complete when every placeholder has a value and every module is in or out.

### 2. Lay the toolchain

Read [`references/toolchain.md`](references/toolchain.md). Create the root
configuration, `packages/tsconfig`, `packages/vitest-config`, the `.github`
workspace package, and the merge-marker scripts from `templates/scripts/`.

Complete when `nub install` succeeds, `hk check --all --check` passes, and
`nub run check` passes on the empty workspace.

### 3. Build the shared packages

Read the package sections of
[`references/application.md`](references/application.md). Create `packages/db`
from `templates/packages/db/` with one table, its first generated migration,
and its `./testing` export, then `packages/ui` with the shadcn configuration
and one component.

Complete when `nub run typecheck`, `nub run build`, and
`nub run test --filter=<scope>/db` pass, and the test opens a database from the
migrated image.

### 4. Build the server application

Read the server sections of
[`references/application.md`](references/application.md). Create `apps/server`
with the four layers, the runtime from `templates/apps/server/src/runtime/`,
one route backed by one server function that reads the database through a
repository port, and the gateway entry from
`templates/apps/server/server-entry.ts` trimmed to the core.

Complete when `nub run build` passes, `nub --cwd apps/server run serve` boots
against a fresh database file, `GET /` renders the route with database data,
and `SIGTERM` exits cleanly.

### 5. Add the selected modules

Read [`references/auth-and-agent-surfaces.md`](references/auth-and-agent-surfaces.md)
and build only the modules settled in step 1, in the order that file lists.
Each module section names its templates and ends with its own completion line.

Complete when every selected module meets its line and every unselected module
left no file, dependency, route, or `[module: …]` block behind.

### 6. Wire the tests

Read [`references/testing.md`](references/testing.md). Add the server Vitest
global setup, the root script suite, and `apps/e2e` with the worker-scoped
server fixture from `templates/apps/e2e/` and one spec per selected module.

Complete when `nub run test`, `nub run test:scripts`, and `nub run e2e` pass
from a clean checkout.

### 7. Wire CI and delivery

Read [`references/ci-and-delivery.md`](references/ci-and-delivery.md). Copy
`templates/.github/` and `templates/Dockerfile`, then trim the workflow steps
of unselected modules.

Complete when `nub run lint` passes actionlint, the image builds locally, and
`.github/scripts/smoke-image.sh <image>` passes against it.

### 8. Write the repository documents

Read [`references/repository-docs.md`](references/repository-docs.md). Write
`AGENTS.md` from the template, keeping only the sections for what exists, and a
`README.md` with the setup commands.

Complete when every command either document names runs as written.

### 9. Prove the bootstrap

Run from a fresh clone in a temporary directory:

```sh
mise install && nub install --frozen-lockfile
hk check --all --check
nub run check && nub run build
nub run test && nub run test:scripts && nub run e2e
git grep -n -E '<(project|scope|Project|cookie|runner)>' -- . ':!*.md'
```

Apply `principle-prove-it-works`. The last command must print nothing: every
placeholder was substituted.

## Completion

A fresh clone installs, checks, builds, tests, and produces a container image
that passes its smoke test. No placeholder remains in source. The final account
lists the selected modules, every item left for the user (deployment target,
GitHub environments and secrets, runner, branch protection), and the output of
step 9.
