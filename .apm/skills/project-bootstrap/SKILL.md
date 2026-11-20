---
name: project-bootstrap
description: Bootstrap a new TypeScript monorepo on Lachie's reference architecture - Nub, Turborepo, TanStack Start, Effect 4, Drizzle, Better Auth, MCP, Vitest, Playwright - through to live staging and production on Coolify behind Cloudflare.
disable-model-invocation: true
---

# Project Bootstrap

Bootstrap a new repository on the reference architecture and put it live. The
result is a working monorepo (one deployable server application, shared
packages, checks, tests, CI, a container image) plus its operating setup: a
per-project 1Password vault and service account, staging and production on
Coolify behind a Cloudflare Tunnel, Litestream backups to Backblaze B2, and
date-tagged production releases with generated notes.

The `references/` files carry the structure and the reasons no config file
states. The `templates/` tree carries the files worth copying verbatim, laid
out at their target paths. A template is copied, its placeholders substituted,
and its `[module: …]` blocks trimmed; everything else is written from the
reference that describes it.

## Placeholders

Every template and reference uses these. Resolve them once in step 1 and
substitute everywhere.

| Placeholder     | Meaning                                                  | Example                  |
| --------------- | -------------------------------------------------------- | ------------------------ |
| `<project>`     | Repository name                                          | `dundermifflin`          |
| `<scope>`       | npm scope for product packages: `@` + name, dots removed | `@dundermifflin`         |
| `<Project>`     | Display name                                             | `Dunder Mifflin`         |
| `<cookie>`      | Cookie, token, and binary prefix: the scope without `@`  | `dundermifflin`          |
| `<domain>`      | Production apex domain; staging is `staging.<domain>`    | `dundermifflin.com`      |
| `<owner>`       | GitHub owner of the repository                           | `mscott`                 |
| `<runner>`      | GitHub Actions runner label                              | `ubuntu-latest`          |
| `<account>`     | 1Password account holding the vaults                     | `my.1password.com`       |
| `<coolify-url>` | Coolify base URL, the `COOLIFY_URL` variable             | `https://coolify.example` |

`@repo/*` is literal. It names internal tooling packages in every project and
is never replaced by `<scope>`.

## Procedure

Each step is one `principle-verifiable-units-of-work` unit. Reach its
completion line before starting the next step. Work on a `bootstrap` branch
and commit at each step. Use the machine's git signing configuration as it is;
when signing fails, stop and report rather than overriding it.

### 1. Settle the inputs and the plan

Derive `<project>`, `<scope>`, `<Project>`, `<cookie>`, and `<owner>` from the
repository, directory, and `gh` login. Everything below has a default; the
human should have to answer one message, not a series.

| Decision         | Default                                                                  |
| ---------------- | ------------------------------------------------------------------------ |
| Modules          | All of them (listed below)                                               |
| Domain           | Ask. Assume it is bought and its zone is on Cloudflare                   |
| Domain seed      | One table and a home route listing it, named from the product            |
| shadcn preset    | Ask for the preset code; `shadcn init --preset <code>` in step 4         |
| Hosting          | Coolify on the existing VPS, as in `references/hosting.md`               |
| Image            | Private, on GHCR, `linux/amd64`                                          |
| Backups          | Litestream to a per-project B2 bucket, both environments                 |
| Deploy overlap   | A few seconds of old and new container overlap is acceptable (see hosting part 4) |
| Releases         | Date tags from the Release workflow, communiqué notes through Copilot    |
| `<runner>`       | `ubuntu-latest`                                                          |

Modules:

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

In one message, ask for what is still unknown (domain, preset code, Coolify
URL when no memory or earlier project names it, the 1Password account when
`op account list` shows more than one) and present the plan: the steps below,
the settled defaults, and the human-only actions it will need, batched:

- one 1Password approval for the vault and service account (step 3);
- Chrome remote debugging on, for the dashboards without an API (step 10);
- GitHub Mobile confirmations, for which the agent sends the digits.

Start step 2 when the human approves the plan. Treat later answers as changes
to it, not as a restart.

Complete when every placeholder has a value, every module is in or out, and
the human approved the plan.

### 2. Lay the toolchain

Read [`references/toolchain.md`](references/toolchain.md). Create the root
configuration, `packages/tsconfig`, `packages/vitest-config`, the `.github`
workspace package, and the merge-marker scripts from `templates/scripts/`.

Complete when `nub install` succeeds, `hk check --all --check` passes, and
`nub run check` passes on the empty workspace.

### 3. Wire secrets

Read [`references/secrets-and-agent-access.md`](references/secrets-and-agent-access.md).
In one script and one approval, create `project-<project>` and the
`agent-<project>` service account, store its token as `op-service-account`,
and run the copied `bootstrap-fnox.sh` for this machine. Copy
`templates/fnox.toml` and `templates/scripts/bootstrap-fnox.sh`. Add the
browser-session files only when the project has to work in a site without an
API.

Complete when the reference's completion line holds. From here on, no command
may raise a 1Password prompt.

### 4. Build the shared packages

Read the package sections of
[`references/application.md`](references/application.md). Create `packages/db`
from `templates/packages/db/` with one table, its first generated migration,
and its `./testing` export, then `packages/ui` with the shadcn preset and one
component.

Complete when `nub run typecheck`, `nub run build`, and
`nub run test --filter=<scope>/db` pass, and the test opens a database from the
migrated image.

### 5. Build the server application

Read the server sections of
[`references/application.md`](references/application.md). Create `apps/server`
with the four layers, the runtime from `templates/apps/server/src/runtime/`,
one route backed by one server function that reads the database through a
repository port, and the gateway entry from
`templates/apps/server/server-entry.ts` trimmed to the core.

Complete when `nub run build` passes, `nub --cwd apps/server run serve` boots
against a fresh database file, `GET /` renders the route with database data,
and `SIGTERM` exits cleanly.

### 6. Add the selected modules

Read [`references/auth-and-agent-surfaces.md`](references/auth-and-agent-surfaces.md)
and build only the modules settled in step 1, in the order that file lists.
Each module section names its templates and ends with its own completion line.

Delegate one module, or two small ones that touch the same files, per
subagent, one at a time. Rerun check, build, and the tests yourself after each
before starting the next. After a subagent changes the lockfile, run
`nub ci` before trusting a test failure.

Complete when every selected module meets its line and every unselected module
left no file, dependency, route, or `[module: …]` block behind.

### 7. Wire the tests

Read [`references/testing.md`](references/testing.md). Add the server Vitest
global setup, the root script suite, and `apps/e2e` with the worker-scoped
server fixture from `templates/apps/e2e/` and one spec per selected module.

Complete when `nub run test`, `nub run test:scripts`, and `nub run e2e` pass
from a clean checkout.

### 8. Write the verification skill

Run `lachie-skills:create-verification-skill` in a background subagent,
limited to `.agents/skills/verify-<project>/` and told not to commit. A second
subagent that did not write it proves it by launching the app and driving
every journey in its feature map. Fix what the proof finds, then commit. Fix
any application defect it finds test first before step 9.

Complete when the independent run passed and its findings are fixed.

### 9. Wire CI and delivery

Read [`references/ci-and-delivery.md`](references/ci-and-delivery.md). Copy
`templates/.github/`, `templates/Dockerfile`, `templates/deploy/`, and
`templates/communique.toml`, then trim the steps and `[module: …]` blocks of
unselected modules. Replace `<product-summary>` in `communique.toml` with two
or three sentences on what the product does and who uses it.

Complete when `nub run lint` passes actionlint, the image builds locally,
`.github/scripts/smoke-image.sh <image>` passes against it including the
in-container health probe, `next-release-tag.sh` gives the expected tags for a
first release, a same-day second release, and an already-released commit, and
a communiqué dry run against a local, unpushed tag produces notes.

### 10. Stand up the environments

Read [`references/hosting.md`](references/hosting.md) and do its parts 1 to 6:
the survey, the origin certificate, tunnel routes and DNS, the Coolify apps,
the B2 bucket, and the GitHub environments.

Complete when every hostname answers 503 from Traefik over Full (Strict) TLS,
each Coolify deploy token is confined to its environment, the B2 key reaches
only its bucket, and both GitHub environments hold their variables and
`OP_SERVICE_ACCOUNT_TOKEN`.

### 11. Write the repository documents

Read [`references/repository-docs.md`](references/repository-docs.md). Write
`AGENTS.md` from the template, keeping only the sections for what exists, a
`README.md` with the setup commands, and `.env.example`.

Complete when every command either document names runs as written.

### 12. Prove the bootstrap and deploy staging

Run from a fresh clone in a temporary directory:

```sh
mise install && nub install --frozen-lockfile
hk check --all --check
nub run check && nub run build
nub run test && nub run test:scripts && nub run e2e
git grep -n -E '<(project|scope|Project|cookie|domain|owner|runner|account|coolify-url|product-summary)>' -- . ':!*.md'
```

Apply `principle-prove-it-works`. The last command must print nothing: every
placeholder was substituted.

Then push `bootstrap`, open the pull request, and squash-merge it when CI
passes. Staging deploys need no approval. Do hosting part 7: the merge is the
first real staging deploy, and it is not done until staging serves.

## Completion

A fresh clone installs, checks, builds, tests, and produces a container image
that passes its smoke test. No placeholder remains in source. Staging serves
`https://staging.<domain>` from the merged `main`, with backups replicating.
Production is wired and undeployed.

The final account lists the selected modules, the output of step 12, the
staging deploy run, and every item left for the human:

- the first production release (run Release on `main`);
- `ci-success` as a required status check on `main`;
- running the copied `bootstrap-fnox.sh` once on each other machine;
- the security findings from the hosting survey, such as direct origin
  exposure;
- the production gate's limits: no required reviewer on a free private
  repository, and one service account that reads both deploy tokens;
- turning Chrome remote debugging back off.
