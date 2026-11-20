# CI And Delivery

Workflows, the container image, the Coolify deploy, and releases. Every file
here is in `templates/` at its target path; this reference explains them. The
live resources they deploy to are set up from `hosting.md`.

## Composite setup action

`.github/actions/setup/action.yml`, used by every job. Inputs: `install`
(default `true`), `frozen` (default `true`), `turbo-cache` (default `false`).
Steps:

1. `jdx/mise-action` with `install: true, cache: true`.
2. `nubjs/setup-nub` with `cache: false`.
3. Resolve `nub store path` and the Nub cache directories, then cache them
   with `actions/cache`, keyed on `hashFiles('nub.lock', '.config/mise.toml')`.
4. Install `build-essential` and `python3` when `make` or `g++` is missing.
   `better-sqlite3` compiles natively.
5. `nub install --frozen-lockfile`, when `install` is `true`.
6. When `turbo-cache` is `true`, `rharkor/caching-for-turbo`, pinned by commit
   SHA. It serves Turbo's remote cache from the GitHub Actions cache, so jobs
   on empty runners replay each other's task results.

## CI

`.github/workflows/ci.yml` runs on pushes to `main` and on pull requests.
Concurrency group `ci-${{ github.workflow }}-${{ github.ref }}` with
`cancel-in-progress: true`. Include the pull request `closed` type with every
job guarded by `github.event.action != 'closed'`: the run does nothing but
joins the group and cancels CI still running for a merged branch.

| Job          | Needs    | Runs                                                              |
| ------------ | -------- | ----------------------------------------------------------------- |
| `static`     |          | format, lint, typecheck, merge markers, build                     |
| `test`       |          | `nub run test`, then `nub run test:scripts`                       |
| `e2e`        | `static` | install Chromium unless the Turbo result is cached, `nub run e2e` |
| `docker`     | `static` | build the image without pushing, run the smoke test               |
| `ci-success` | all      | fails unless every required job passed                            |

- Build and the static checks share one job because toolchain setup costs more
  than the checks. Each step after the first has `if: ${{ !cancelled() }}` so
  one run reports every failure.
- `static` classifies the changed paths of a pull request and outputs `code`.
  A change touching only `docs/`, `plans/`, `.agents/`, or `*.md` skips `e2e`
  and `docker`. `ci-success` accepts those skips only when `static` succeeded
  and reported `code == 'false'`.
- `e2e` asks `turbo run e2e --dry=json` for the cache status of
  `<scope>/e2e#e2e` and skips the browser install on a hit.
- `ci-success` is the single required status check. Tell the user to mark it
  required in branch protection; nothing in the repository can.
- Add the boundary-audit step to `static` when that module is selected.

## Container image

`templates/Dockerfile`, multi-stage on `node:24-bookworm-slim`, with
`deploy/entrypoint.sh` and `deploy/litestream.yml`.

- `hk` is linked to `/bin/true` so the root `prepare` script succeeds without
  installing git hooks.
- Copy `packages/` wholesale. A hand-maintained list of packages drops the
  next new runtime dependency and leaves a dangling workspace symlink, which
  crashes the image at startup.
- `NUB_VERSION` matches `packageManager` in the root `package.json`.
- `DATABASE_URL=/data/<project>.db` on a `VOLUME /data`, created in the image
  so the path exists before the volume mounts.
- `curl` is installed in the runtime stage. Coolify replaces the image's
  `HEALTHCHECK` with its own, which runs `curl` or `wget` inside the
  container; without either every rollout is unhealthy and rolled back.
- Litestream comes from its release tarball in a separate stage. The
  entrypoint, when `LITESTREAM_REPLICA_URL` is set, restores the database from
  the replica if the volume is empty, then runs the server under
  `litestream replicate -exec`, which streams every WAL change and forwards
  `SIGTERM`. Unset, it runs the server alone, so local runs and CI need no
  bucket. The database must be in WAL mode (`packages/db` sets it).

`.github/scripts/smoke-image.sh <image>` boots the image and proves it serves.
It runs the container with a unique name, an ephemeral host port,
`DATABASE_URL=/tmp/<cookie>.db`, and a throwaway `BETTER_AUTH_SECRET`, then
requires:

1. `GET /` answers within the retry window and the container is still running.
2. After a short wait for lazy initialisation, a build-hashed asset referenced
   by the homepage answers.
3. `GET /api/auth/ok` answers, when the Auth module is selected.
4. `GET /` still answers.
5. `curl` inside the container reaches the health path, the way Coolify
   probes it.

On failure it prints `docker logs`.

## CD

`.github/workflows/cd.yml`. Triggers: push to `main`, push of a
`<scope>/server@*` tag, and `workflow_dispatch` with an `environment` choice of
`staging` or `production`.

| Job                 | Runs                                                                       |
| ------------------- | -------------------------------------------------------------------------- |
| `changes`           | decides whether the push changed anything that reaches the image          |
| `publish-image`     | build, smoke test, then push to `ghcr.io/${{ github.repository }}`         |
| `deploy-staging`    | environment `staging`: load the Coolify token, run `deploy.sh`             |
| `deploy-production` | environment `production`: load the Coolify token, run `deploy.sh`          |
| `release-notes`     | on a server tag: communiqué rewrites the GitHub release notes              |
| `cleanup`           | prunes untagged image versions, keeping ten                                |

- `changes` diffs `github.event.before..HEAD` and deploys unless every changed
  path is on an exclusion list of paths that never reach the image or the
  deploy: Markdown, `docs`, `.agents`, workflows and actions, Dependabot,
  `apps/e2e`, the CLI, the oxlint plugin, `scripts`, lint/format/test configs,
  `communique.toml`, `fnox.toml`, `.env.example`, `.gitignore`. A push with no
  usable `before` (new branch, force push) deploys. Do not use
  `turbo --affected`: the build copies the whole repository, and files outside
  any package (`Dockerfile`, `deploy/`, `.github/scripts/deploy.sh`,
  `nub.jsonc`, `tsconfig.json`, `assets/`) would never trigger a deploy. A
  wrong "yes" costs one redundant staging deploy; a wrong "no" leaves staging
  behind `main`. Add new non-shipping paths to the list as the repo grows.
- `publish-image` builds into the local daemon, smoke tests that exact image,
  and pushes afterwards. Pushing first would publish a crashing image under a
  tag an environment pulls on its next restart.
- Image tags: `nightly` for `main` and staging dispatches, `sha-<full sha>`
  always, the version and `latest` for a server tag, `latest` for a production
  dispatch. Deploys roll to `sha-<sha>`, never a moving tag.
- Each deploy job starts with `1password/load-secrets-action@v5`, reading
  `op://project-<project>/coolify-deploy-<environment>/credential` with the
  environment's `OP_SERVICE_ACCOUNT_TOKEN`, and has a
  `deploy-<environment>` concurrency group that never cancels.
- Staging deploys on a push to `main` or a staging dispatch. Production
  deploys only on a server tag or a production dispatch from one.

### Deploy script

`.github/scripts/deploy.sh` rolls a Coolify application. Inputs, from the job
and the GitHub environment: `DEPLOY_ENVIRONMENT`, `APP_URL`, `IMAGE_TAG`,
`COOLIFY_URL` and `COOLIFY_APP_UUID` (variables), `COOLIFY_TOKEN` (from
1Password).

1. `PATCH /api/v1/applications/<uuid>` with `docker_registry_image_tag`, and
   `PATCH …/envs` with `APP_URL`, so the app's public origin cannot drift from
   the GitHub environment.
2. `POST /api/v1/deploy?uuid=<uuid>`. Coolify 4.7 answers `GET` with 405 "This
   endpoint has changed to a POST request". Poll
   `GET /deployments/<deployment_uuid>` every 10 s, up to 15 minutes, until
   `finished`; fail on `failed` or `cancelled*`.
3. With Auth: poll `<APP_URL>/api/auth/.well-known/openid-configuration` until
   `scripts/assert-deployment-auth-origin.ts issuer` accepts it. A process
   booted without its public origin still passes health checks, then
   advertises `http://localhost:3000/api/auth` and refuses every same-origin
   write.
4. With Auth: probe origin enforcement with a sign-in `POST` from an untrusted
   `Origin` (must be refused, 403) and from `APP_URL` (must reach the password
   check, 401). Both probes send a throwaway cookie: Better Auth checks
   `Origin` only on requests carrying a cookie, so a cookie-less probe passes
   against a misconfigured deployment too.

`templates/scripts/deployment-auth-origin.ts` and its command-line shell
`assert-deployment-auth-origin.ts` carry the assertions, with tests.

### Rollback and Diagnose

- `rollback.yml` (dispatch: environment, image tag) confirms the tag exists in
  GHCR, then runs `deploy.sh` with it. No rebuild.
- `diagnose.yml` (dispatch: environment, line count) prints the Coolify app's
  status and image, its recent deployments, the public endpoints' status
  codes, and the container's recent logs, so an operator needs no Coolify
  credentials locally. The environment-scoped token cannot read logs, which
  need `read:sensitive`; give the deploy token that permission or read logs
  with `coolify-root` when debugging locally.
- Both load the token with `${{ inputs.environment }}` in the item path. The
  production environment admits only release tags, so a production rollback or
  diagnosis is dispatched with `--ref <scope>/server@<version>`.

## Releases

There is no Changesets. A release is a date: the deployable is one web app,
not a published package, so a version only names what reached production.

- `release.yml` is `workflow_dispatch` only and runs on `main`. A human runs
  it; running it is the production authorization.
- `.github/scripts/next-release-tag.sh <commit> [date]` prints
  `<scope>/server@YYYY.MM.DD` (UTC), then `.2`, `.3` for further releases that
  day, and fails when the commit already carries a release tag. Test it for
  the first release, a same-day second release, the next day, and the refusal.
- The workflow creates the tag and the GitHub release with
  `gh release create --generate-notes`, then runs
  `gh workflow run cd.yml --ref <tag> -f environment=production`. Tags and
  events created with `GITHUB_TOKEN` start no workflow, so CD must be
  dispatched explicitly; it needs `actions: write`.
- The dispatched CD run is on the tag ref, so `release-notes` runs too.

### Release notes

`communique.toml` and the `release-notes` job. communiqué reads the commits
and pull requests since the previous `<scope>/server@*` tag and rewrites the
GitHub release.

- Replace `<product-summary>` in `context` with what the product does and who
  uses it; the rest of `context` names the surfaces (site, CLI, operator API,
  MCP) and says it is one deployed app, not a package. Trim the surfaces of
  unselected modules. `system_extra` says versions are dates, never major/minor/patch,
  and to lead with user-visible changes.
- `[packages.server] paths` lists what ships in the image: `apps/server`, the
  runtime packages, `deploy`, `Dockerfile`.
- The model runs through GitHub Copilot's OpenAI-compatible endpoint:
  `--provider openai`, `OPENAI_BASE_URL=https://api.githubcopilot.com`,
  `OPENAI_CUSTOM_HEADERS={"copilot-integration-id":"copilot-developer-cli"}`,
  and `OPENAI_API_KEY` from `op://Agent Automation/github-copilot-requests/credential`.
  Actions' own token cannot call Copilot for a repository owned by a personal
  account.
- Model: `kimi-k3`. Claude through Copilot answers in plain text instead of
  calling communiqué's submit tool, Copilot's Anthropic-style endpoint needs a
  header communiqué cannot send, and `gpt-4.1`'s context is too small for a
  first release. List what the plan offers at
  `https://api.githubcopilot.com/models` before changing it.
- The job runs in the `production` environment with `deployment: false`, only
  to read `OP_SERVICE_ACCOUNT_TOKEN`.
- Squash-merge pull requests. A squash commit carries `(#N)`, which is how
  communiqué finds the pull request; merge commits give it none. Set the
  repository to allow squash merges only.
- Dry-run it locally against a temporary, unpushed tag before the first
  release, with `OPENAI_BASE_URL` and `OPENAI_CUSTOM_HEADERS` exported as
  above: `fnox exec -- sh -c 'OPENAI_API_KEY="$COPILOT_REQUESTS_TOKEN" communique generate <tag> --package server --dry-run'`.

### Deployment authority

Write this rule into the new repository's `AGENTS.md` (the text is in
`repository-docs.md`): a merge to `main` is a staging deploy that agents make
without asking, and each production deploy needs explicit human
authorization. Agents do not run the Release workflow, do not create
`<scope>/server@*` tags, and do not dispatch any workflow with
`environment: production`.

## Runners

`<runner>` defaults to `ubuntu-latest`. For self-hosted runners, list the
labels in `.actionlint.yaml`. On a headless macOS runner, point
`DOCKER_CONFIG` at a workspace directory holding `{"auths":{}}` so Docker never
reaches for the locked keychain.
