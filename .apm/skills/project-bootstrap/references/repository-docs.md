# Repository Documents

The documents a bootstrapped repository starts with. Write each from what the
repository now contains. Delete any section whose subject was not built.

## AGENTS.md

Sections, in order:

````markdown
# <project> repository requirements

## Deployment authority

Staging and production are separate GitHub environments, each with its own
`APP_URL`. A merge to `main` publishes the `nightly` image and deploys staging.
Production deploys only on a `<scope>/server@*` tag or a `workflow_dispatch`
with `environment: production`, and each one needs explicit human
authorization. Agents do not create server tags, do not dispatch a production
deploy, and do not merge the Changesets "Version Packages" pull request. When
reporting a merge to `main`, say it reached staging and not production.

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

While the deployment placeholder stands, the Deployment authority section says
so: the image is published and nothing deploys.

## README.md

State what the project is in one paragraph, then the commands for a fresh
clone: `mise install`, `nub install`, `nub run dev`, and the environment
variables the server reads, each with its default.

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

## Domain documents

Create `CONTEXT.md` and `docs/adr/` only when the project resolves its first
domain term or records its first decision. An empty scaffold is sediment.
