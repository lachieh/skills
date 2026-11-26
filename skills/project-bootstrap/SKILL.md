---
name: project-bootstrap
description: Bootstrap a new TypeScript monorepo on Lachie's reference architecture - Nub, Turborepo, TanStack Start, Effect 4, Drizzle, Better Auth, MCP, Vitest, Playwright - through to live staging and production on Coolify behind Cloudflare, or align an existing repository with that architecture.
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

When the repository already exists and the task is to align it, read
[`references/adoption.md`](references/adoption.md) first. It replaces
"build" with a survey, a gap table, and one plan message, and it says which
of the steps below apply.

This skill loads only when the human invokes it. `project-operations` is the
skill agents load later for the secrets and hosting knowledge in
`references/secrets-and-agent-access.md` and `references/hosting.md`.

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

A project with no domain yet takes both hostnames under `devbox.party` (see
step 1), and its staging hostname is not `staging.<domain>`.

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
| Domain           | Ask. Assume it is bought and its zone is on Cloudflare (fallback below)  |
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

When no domain is bought yet, do not wait for one. Use
`<project>.devbox.party` for production and `<project>-staging.devbox.party`
for staging, under the existing wildcard record and tunnel route. "Without a
domain" in `references/hosting.md` says what changes.

In one message, ask for what is still unknown (domain, preset code, Coolify
URL when no memory or earlier project names it, the 1Password account when
`op account list` shows more than one) and present the plan: the steps below,
the settled defaults, and the human-only actions it will need, batched:

- the copied setup script for the vault and service account, which the human
  runs in their own Terminal and approves once (step 3);
- Chrome remote debugging on, for the dashboards without a documented API
  (step 10);
- GitHub Mobile confirmations, for which the agent sends the digits.

List the prompts the run will raise in the same message, so the human grants
them once with the plan and not one at a time:

- the agent harness's permission rules for what the run does: API writes to
  Coolify, Cloudflare, and Backblaze, `gh` changes to repository settings,
  environments, and secrets, the connection to the human's browser, the
  merge to `main`, and a run of the Release workflow when the human asks for
  a production release;
- Chrome's Allow prompt, which appears when the agent connects to that
  browser on port 9222.

Everything else is the agent's work. Any credential or resource the agent can
create through an API or the signed-in browser is the agent's job: app
secrets, DNS records, deploy tokens, vendor apps. During the run, "needs the
human" means one of the three actions above. The Completion section lists
what stays with the human afterwards.

Start step 2 when the human approves the plan. Treat later answers as changes
to it, not as a restart.

Complete when every placeholder has a value, every module is in or out, and
the human approved the plan.

### 2. Lay the toolchain

Read [`references/toolchain.md`](references/toolchain.md). Create the root
configuration, `packages/tsconfig`, `packages/vitest-config`, the `.github`
workspace package, and the merge-marker scripts from `templates/scripts/`.
Install the git hooks in this clone as that reference describes.

Complete when `nub install` succeeds, `hk check --all --check` passes, and
`nub run check` passes on the empty workspace.

### 3. Wire secrets

Read [`references/secrets-and-agent-access.md`](references/secrets-and-agent-access.md).
Create the service account before reading or creating any other secret. Until
it exists, every `op` call raises an approval on the human's desktop.

Copy `templates/scripts/setup-1password.sh`,
`templates/scripts/bootstrap-fnox.sh`, and `templates/fnox.toml`, and
substitute their placeholders. Do not write a setup script of your own. The
copied `setup-1password.sh` creates `project-<project>` and the
`agent-<project>` service account, stores its token as `op-service-account`,
and runs `bootstrap-fnox.sh` for this machine. Give the human the one command
that runs it in their own Terminal, with the absolute path of this checkout,
then poll for its result as the reference describes. The human does not have
to report back.

`fnox.toml` declares the items that step 10 creates and marks each
`if_missing = "ignore"`, so entering a worktree prints no 1Password warning
before they exist. Add the browser-session files only when the project has to
work in a site without an API.

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
the B2 bucket, and the GitHub environments. For a dashboard without a
documented API, connect to the human's Chrome as "Driving the human's
dashboards" in the secrets reference describes: announce the connection, then
connect on port 9222.

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

Then push `bootstrap` and open the pull request. Load `technical-writing`
and `unslop` and apply them to its title and body. Squash-merge it when CI
passes. Staging deploys need no approval. Do hosting part 7: the merge is the
first real staging deploy, and it is not done until staging serves.

### 13. Send back what the run learned

List what this run had to work out that the skill did not say: a missing or
wrong instruction, a command that failed as written, a template that needed a
change. Write the list as a proposed patch for the skills repository
(`lachieh/skills`): for each entry, the file under
`.apm/skills/project-bootstrap/` and the change to make. That repository is
public. Write every entry with the skill's placeholders, and never include
this project's hostname, IP address, account or resource id, or a session
value.

When a fix made in this project touches a file that came from a template,
open the matching change in `lachieh/skills` as a pull request. Fixes made
only in the project are lost to the next bootstrap. Later threads do not load
this skill, so the `AGENTS.md` template carries the same rule for them.

Complete when the final account carries the list, or says the run found
nothing to add, and links a pull request for each template fix.

## Completion

A fresh clone installs, checks, builds, tests, and produces a container image
that passes its smoke test. No placeholder remains in source. Staging serves
`https://staging.<domain>` from the merged `main`, with backups replicating.
Production is wired and undeployed.

The final account lists the selected modules, the output of step 12, the
staging deploy run, the step 13 list, and every item left for the human:

- the first production release, which waits for the human's instruction
  (given one, the agent runs Release on `main` and verifies production);
- `ci-success` as a required status check on `main`;
- running the copied `bootstrap-fnox.sh` once on each other machine;
- installing the git hooks once in each other clone;
- the security findings from the hosting survey, such as direct origin
  exposure;
- the production gate's limits: no required reviewer on a free private
  repository, and one service account that reads both deploy tokens;
- turning Chrome remote debugging back off.
