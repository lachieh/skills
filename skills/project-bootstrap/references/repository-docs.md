# Repository Documents

The documents a bootstrapped repository starts with. Write each from what the
repository now contains. Delete any section whose subject was not built.

## AGENTS.md

Sections, in order:

````markdown
# <project> repository requirements

## Deployment authority

Staging and production are separate GitHub environments, each with its own
`APP_URL`, Coolify application and Coolify deploy token. A merge to `main`
publishes the `nightly` image and is a staging deploy; agents merge and deploy
staging without asking. Each production deploy needs explicit human
authorization. A human releases by running the Release workflow on `main`: it
tags the commit `<scope>/server@YYYY.MM.DD` (UTC, `.2` and up for later
releases that day), creates the GitHub release, and dispatches CD from the tag,
which deploys production and writes the release notes with communiqué.
Production deploys only from such a tag: the production environment admits no
other ref, so a production rollback or diagnosis is also dispatched from one.
Agents do not run the Release workflow, do not create `<scope>/server@*` tags,
and do not dispatch any workflow with `environment: production`. When
reporting a merge to `main`, say it reached staging and not production.

## Secrets and operator access

- `fnox exec -- <command>` runs a command with the secrets declared in
  `fnox.toml`, read from 1Password as the `agent-<project>` service account.
  The `shared` provider is the read-only "Agent Automation" vault; the
  `project` provider is `project-<project>` (read/write).
- Never run `op` without `OP_SERVICE_ACCOUNT_TOKEN`: it falls back to the
  human's desktop session and blocks on an approval prompt. Inside
  `fnox exec` the token is set.
- 1Password items are named `<service>-<purpose>[-<environment>]`, with the
  secret in a `credential` field: `op://<vault>/<item>/credential`.
- A new machine runs `scripts/bootstrap-fnox.sh` once, as a human. It stores
  the service account token age-encrypted in the gitignored
  `fnox.local.toml`.
- CI loads each environment's Coolify token, and the release-notes job its
  Copilot token, with `1password/load-secrets-action`;
  `OP_SERVICE_ACCOUNT_TOKEN` is the only GitHub secret, set per environment.

## Working in this repository with several agents

- Give each agent its own git worktree.
- The orchestrator integrates, one reviewed change per branch. Other agents do
  not run `git add`, `git commit`, `git checkout`, or `git push`.
- The pre-commit hook is check-only. When a commit is refused, run
  `nub run format:fix`, review the diff, and retry.
- Treat full-suite and e2e results from a machine running several agents as
  unreliable. Run focused suites locally and let CI arbitrate.

## Workspace layout

<one line per app and package: path, published name, what it owns>

## Package management and scripts

- Nub is the package manager and runtime, pinned through mise in
  `.config/mise.toml`. Use `nub install`, `nub add`, `nub remove`,
  `nub run <script>`, and `nubx <package>@<version>`.
- Commit `nub.lock` and no other lockfile.
- Every package exposes the scripts its task pipeline needs.

## Task orchestration and caching

- Root tasks go through Turborepo: `nub run build`, `lint`, `typecheck`,
  `test`, `e2e`, `dev`.
- Declare a task and its outputs in `turbo.json` when it can be cached.
- Development tasks stay uncached and persistent.

## Framework and application

<the stack actually built: TanStack Start, Tailwind, shadcn preset, Drizzle,
Effect layers, auth, selected modules>

## Code quality

- Oxlint lints and Oxfmt formats. Their checked-in configs are authoritative.
- actionlint validates workflows. hk manages hooks.
- Run `nub run check` before declaring a change complete.

## Change verification

- `nub install` after dependency changes.
- `hk check --all --check`.
- `nub run typecheck` and `nub run build` when a change affects compilation.
- `nub run test`, scoped with
  `nub run test --filter=<package> --only -- <pattern>`. The root script stays a
  single `turbo run test`.
- `nub run test:scripts` for `scripts/**/*.test.ts`.
- `nub run e2e` for the Playwright suite.
- `git diff --check` before committing.
````

Keep the deployment authority and secrets sections with the hosting
reference's values substituted. Delete them only when the project has no
hosted environment.

## README.md

State what the project is in one paragraph, then the commands for a fresh
clone: `mise install`, `nub install`, `mise exec -- hk install --mise` (once
per clone), `nub run dev`, and the environment variables the server reads,
each with its default. When the project has
`fnox.toml`, say that a human runs `scripts/bootstrap-fnox.sh` once per
machine and that secrets come from `fnox exec`, not `.env` files.

## Environment variables

List these in the README and in a committed `.env.example`. Nub does not load
`.env` files (`"envFile": false`); mise or the shell provides them.

| Variable              | Module | Meaning                                              |
| --------------------- | ------ | ---------------------------------------------------- |
| `DATABASE_URL`        | Core   | SQLite file path                                     |
| `HOST`, `PORT`        | Core   | Listen address, default `127.0.0.1:3000`             |
| `MEDIA_STORAGE_DIR`   | Core   | Upload directory, when the project stores files      |
| `APP_URL`             | Auth   | Public origin; the issuer is `<APP_URL>/api/auth`    |
| `BETTER_AUTH_SECRET`  | Auth   | Required in production                               |
| `TRUSTED_PROXY_CIDRS` | Auth   | Proxies whose forwarded client address is believed   |
| `RATE_LIMIT_ENABLED`  | Auth   | `false` only for the browser suite                   |
| `MCP_ALLOWED_HOSTS`   | MCP    | Hostname allowlist, default localhost and `APP_URL`  |
| `MCP_ALLOWED_ORIGINS` | MCP    | Origin allowlist, same default                       |
| `LITESTREAM_REPLICA_URL` | Core | Container only; unset disables replication      |
| `LITESTREAM_ACCESS_KEY_ID`, `LITESTREAM_SECRET_ACCESS_KEY` | Core | Replica bucket key |

## Domain documents

Create `CONTEXT.md` and `docs/adr/` only when the project resolves its first
domain term or records its first decision. An empty scaffold is sediment.
